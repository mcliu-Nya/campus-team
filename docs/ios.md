# iOS 端构建说明

iOS 原生安装包（`.ipa`）必须在 macOS + Xcode 上编译，或在 Expo 的云端构建（EAS Build）里编译。本项目的开发机是 Windows，因此**不能**在本机直接产出 `.ipa`；下面给出三条可行路径，前置配置已经写好。

## 已完成的 iOS 配置

| 项目 | 位置 | 值 |
| --- | --- | --- |
| Bundle Identifier | `app.json` → `ios.bundleIdentifier` | `com.campus.team` |
| 版本号 | `app.json` → `version` / `ios.buildNumber` | `1.0.2` / `3` |
| 允许 HTTP 明文请求 | `app.json` → `ios.infoPlist.NSAppTransportSecurity` | `NSAllowsArbitraryLoads: true` |
| 构建档位 | `eas.json` | `development` / `simulator` / `preview` / `production` |
| EAS 项目 | `app.json` → `extra.eas.projectId` / `owner` | `92bcdcc1-1392-450c-b4c8-568aa6e85f08` / `mcliugepi` |
| 接口地址 | `.env` + `eas.json` 各档位 `env` | `http://139.196.169.146/api`（EAS 构建时 `.env` 不会上传，必须写在 `eas.json` 的 env 里） |

> iOS 默认禁止明文 HTTP。当前后端只有 `http://139.196.169.146`，所以开启了 ATS 例外；上 HTTPS 之后应删除 `NSAppTransportSecurity`，改用默认的加密传输策略。

## 构建记录

| 日期 | 档位 | 版本 | 结果 | 产物 |
| --- | --- | --- | --- | --- |
| 2026-11-10 | `simulator` | 1.0.2 (3) | FINISHED，EAS 用时约 7 分钟 | `C:\ct\build\ios-simulator\app.app`（解压自 24.8 MB 的 `campus-team-sim.tar.gz`），`Info.plist` 已确认 `com.campus.team`、`1.0.2`、`NSAllowsArbitraryLoads`、`ITSAppUsesNonExemptEncryption=false` |

模拟器包只能跑在 macOS 的 iOS 模拟器上，不能直接装 iPhone；真机安装请用 `preview` 档位并准备 Apple 账号。

## 路径一：iPhone 直接用（无需编译）

后端同一个 nginx 已经托管了 Web 版（Expo 导出的静态站），iPhone 用 Safari 打开即可，功能和 Android 包一致：

```
http://139.196.169.146/
```

- Safari → 分享 → 「添加到主屏幕」，就会像 App 一样全屏启动。
- 该地址同时也是 Web 版的调试入口，改完前端执行 `npx expo export -p web --output-dir dist-web`，把 `dist-web/` 覆盖到服务器 `/opt/campus-team/web/` 即可更新。

## 路径二：EAS 云端构建（产出可安装的 .ipa）

EAS 已经在项目里接好（账号 `mcliugepi`，项目 `@mcliugepi/campus-team`），CLI 也已登录，只需要补 Apple 的签名凭据。

需要 Expo 账号（已登录）；要装到真机还需要 Apple Developer 账号（付费，Ad Hoc 分发）或至少一个 Apple ID 用于开发签名。

```bash
# 1. 登录（若换机器）
npx eas-cli@latest login --device

# 2. 首次构建：让 EAS 创建 iOS 证书/描述文件（会要求 Apple ID 与两步验证）
npx eas-cli@latest build --platform ios --profile preview

# 3. 构建完成后按提示用 iPhone 扫码或打开链接安装（需在设备上信任描述文件）
```

- `--profile preview` 产出内部分发的 `.ipa`，适合直接装到自己的 iPhone，**要求 Apple Developer 付费账号**（Ad Hoc 需要注册设备 UDID）。
- `--profile simulator` 不需要任何 Apple 凭据，产物是模拟器用的 `.app`，只能跑在 macOS 的 iOS 模拟器里；已用它验证 iOS 侧能正常编译。
- 提交 App Store 用 `--profile production`，之后 `npx eas-cli@latest submit --platform ios`。
- 每次构建的进度与日志在 <https://expo.dev/accounts/mcliugepi/projects/campus-team/builds> 查看。

## 路径三：macOS 本地编译

在任意一台装好 Xcode 的 Mac 上：

```bash
git clone <仓库地址> && cd campus-team
npm install
cp .env.example .env        # 确认 EXPO_PUBLIC_API_BASE_URL 指向云端
npx expo prebuild -p ios    # 生成 ios/ 工程并安装 CocoaPods
npx expo run:ios            # 真机或模拟器直接运行
```

产物：`ios/build/Build/Products/Release-iphoneos/campus-team.app`；要打成 `.ipa` 需在 Xcode 里 Archive 并导出。

## 路径四：无签名 .ipa（不需要 Apple 账号）

未签名的 `.ipa` 只是一个 zip：`Payload/xxx.app`。它同样需要 macOS 的 Xcode 编译出 **device（arm64）** 的 `.app`，但全程可以关掉签名（`CODE_SIGNING_ALLOWED=NO`），所以不需要 Apple 账号。拿到 `.ipa` 后，用 Sideloadly / AltStore 在 Windows 上用自己的 Apple ID 现签现装。

仓库已带好工作流 [`.github/workflows/ios-unsigned.yml`](../.github/workflows/ios-unsigned.yml)：在 GitHub 上手动触发（Actions → iOS unsigned ipa → Run workflow），跑完在 Artifacts 下载 `campus-team-unsigned-ipa`。

```bash
# 工作流核心步骤（macOS）
npx expo prebuild -p ios --no-install
cd ios && pod install
xcodebuild -workspace *.xcworkspace -scheme <scheme> \
  -configuration Release -sdk iphoneos -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" build
mkdir -p Payload && cp -R build/Build/Products/Release-iphoneos/*.app Payload/
zip -qry campus-team-unsigned.ipa Payload
```

安装（Windows，无需开发者账号）：

1. 装 [Sideloadly](https://sideloadly.io/) 与 iTunes（提供 Apple 设备驱动）；
2. iPhone 用数据线连电脑，Sideloadly 里拖入 `campus-team-unsigned.ipa`，填 Apple ID；
3. 首次安装后到「设置 → 通用 → VPN与设备管理」信任证书；
4. 免费 Apple ID 签的 App **7 天过期**，到期重新签名即可；付费账号可签 1 年。

> 注意：模拟器 `.app` 不能当 device 包用（Mach-O 平台号不同），必须用 `-sdk iphoneos` 重新编译。

## 版本号约定

每次迭代都要同时改三处，避免和线上包混淆：

- `app.json` → `version`（`1.0.2` → `1.0.3`）
- `app.json` → `android.versionCode`（`3` → `4`）
- `app.json` → `ios.buildNumber`（`3` → `4`）

「我的」页底部会显示当前运行版本，例如 `版本 1.0.2 (3)`。

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `expo prebuild -p ios` 提示跳过 | Windows/Linux 无法生成 iOS 工程 | 用 macOS 或 EAS 云构建 |
| `eas build` 提示 Not logged in | 未登录 Expo 账号 | `npx eas-cli@latest login` |
| 真机打开后接口全部失败 | 用的是 HTTP，且 ATS 未放行 | 确认 `NSAppTransportSecurity` 生效，或给后端配 HTTPS |
| 装到 iPhone 提示「无法验证 App」 | 用的是开发签名 | 设置 → 通用 → VPN与设备管理 → 信任开发者证书 |
