# 校园组队 Campus Team

面向校内学生的组队招募 App：**发布招募 → 浏览 / 搜索 / 筛选 → 查看详情 → 填写联系方式加入 → 发布者收到系统通知 → 双方在「我的队伍」查看联系方式 → 满员后仍展示并置底、到期自动转为已结束**。

当前版本是可运行的 MVP：数据默认存在本机（AsyncStorage），但所有读写都经过 `services/repositories` 抽象层，改一个环境变量即可切到真实后端。

- 技术栈：Expo SDK 58 / React Native 0.88 / TypeScript 6 / Expo Router
- 状态管理：React Context（Auth / 通知 / Toast / Confirm）
- 本地持久化：AsyncStorage
- 验证状态：`tsc --noEmit` 0 错误、ESLint 0 问题、`expo export -p web` 构建成功

---

## 一、快速开始

```bash
# 1. 安装依赖（Node 20+，本项目在 Node 26 上验证）
npm install

# 2. 准备环境变量（Windows 用 copy）
cp .env.example .env      # Windows: copy .env.example .env

# 3. 启动
npx expo start
```

启动后：

- 按 `w` 在浏览器打开；
- 按 `a` / `i` 打开 Android / iOS 模拟器（需已安装对应工具链）；
- 手机安装 Expo Go，扫描终端二维码（需与电脑同一 Wi-Fi）。

> **Windows PowerShell 提示**：若出现 `无法加载文件 …npm.ps1，因为在此系统上禁止运行脚本`，改用 `npm.cmd` / `npx.cmd`，例如 `npx.cmd expo start`。

### 种子账号

首次启动会写入种子数据：6 位同学、8 条招募（含招募中 / 已满员 / 已结束 / 已取消）、13 条加入记录、3 条通知，方便直接体验满员置底、通知已读等流程。可用其中任意一位登录（学号 + 姓名 + 学院），例如：

| 姓名 | 学号 | 二级学院 |
| --- | --- | --- |
| 张三 | 2021001 | 通信与信息工程学院 |

> 想重置演示数据：卸载 App / 清除应用数据后重启，种子数据会重新写入。

---

## 二、环境变量与数据模式

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `EXPO_PUBLIC_DATA_MODE` | `local` | `local` = 本地 AsyncStorage；`remote` = 调用 REST API |
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:3000/api` | 后端根地址，仅 `remote` 生效 |
| `EXPO_PUBLIC_API_TIMEOUT` | `15000` | 请求超时（毫秒） |

`EXPO_PUBLIC_*` 变量在打包时内联到客户端，**改完必须重启 Expo**。

### local 与 remote 的区别

| | `DATA_MODE=local` | `DATA_MODE=remote` |
| --- | --- | --- |
| 数据位置 | 本机 AsyncStorage | 服务器 PostgreSQL |
| 多人协作 | 不支持（只有本机数据） | 支持 |
| 登录 token | `local:<userId>` 伪 token | JWT（`Authorization: Bearer`） |
| 网络 | 完全离线可用 | 需要后端可达 |
| 适用场景 | 演示、开发、验收 UI/流程 | 真实使用、多设备 |

切换步骤：

1. 修改 `.env`：`EXPO_PUBLIC_DATA_MODE=remote`，并把 `EXPO_PUBLIC_API_BASE_URL` 指向后端；
2. 重启 `npx expo start`；
3. 页面逻辑不变——差异全部封装在 `src/services/repositories/index.ts` 适配器选择里。

> 真机访问电脑上的后端时，`localhost` 指向手机自身，请改成电脑局域网 IP（如 `http://192.168.1.10:3000/api`）。

---

## 三、目录结构

```
.
├── app.json                    # Expo 配置（scheme、plugins、包名）
├── docker-compose.yml          # 后端 + PostgreSQL（+ 可选 Nginx）
├── deploy/nginx.conf           # HTTPS 反向代理草案
├── docs/api.md                 # API 契约与数据模型
├── server/                     # 后端目录结构草案（Express + Prisma，见 server/README.md）
├── .env.example
└── src/
    ├── app/                    # Expo Router 路由（只有这里是页面）
    │   ├── _layout.tsx         # 根 Stack + 四个 Provider + ErrorBoundary
    │   ├── (tabs)/
    │   │   ├── _layout.tsx     # 底部 3 Tab，通知角标
    │   │   ├── index.tsx       # 活动招募首页
    │   │   ├── notifications.tsx
    │   │   └── profile.tsx     # 我的
    │   ├── login.tsx           # 登录 / 注册（modal）
    │   ├── recruitment-new.tsx
    │   ├── recruitment/[id].tsx
    │   ├── recruitment-edit/[id].tsx
    │   ├── my-teams.tsx
    │   ├── my-recruitments.tsx
    │   └── my-ended.tsx
    ├── components/
    │   ├── ui/                 # Button / Field / Sheet / Chip / Badge / Avatar /
    │   │                       # SelectField / Section / StateViews / SignInRequired
    │   ├── recruitment/        # RecruitmentCard / FilterSheet / RecruitmentForm /
    │   │                       # DeadlinePickerSheet / ManagedRecruitmentCard
    │   ├── notifications/      # NotificationItem
    │   └── team/               # TeamCard / MemberRow
    ├── constants/              # theme（颜色/间距/阴影）、options（学院/类型/筛选项）
    ├── hooks/                  # useRecruitmentList / useDebouncedValue / useRequireAuth / useAsyncResource
    ├── lib/                    # date / calendar / mask / validate / errors / id / text
    ├── services/
    │   ├── config.ts           # DATA_MODE / API_BASE_URL / TIMEOUT
    │   ├── api/                # client.ts（fetch 封装 + token 注入）、endpoints.ts
    │   ├── storage/            # localStore（串行事务）、sessionStore
    │   └── repositories/
    │       ├── types.ts        # DataAdapter / AuthRepository / RecruitmentRepository / NotificationRepository
    │       ├── index.ts        # createLocalAdapter / createRemoteAdapter / dataAdapter
    │       ├── local/          # LocalAdapter：seed / localDb / 三个仓储
    │       └── remote/         # RemoteAdapter：三个仓储，走 apiRequest
    ├── state/                  # AuthProvider / NotificationsProvider / ToastProvider / ConfirmProvider
    └── types/                  # models.ts / api.ts / forms.ts / env.d.ts
```

---

## 四、架构：一次数据请求的路径

```
页面 (src/app)                      只处理渲染、表单与交互
   │  useAuth / useNotifications / useAsyncResource / useRecruitmentList
   ▼
src/state、src/hooks                状态与加载逻辑，不关心数据来自哪里
   │  dataAdapter.recruitments.list(query, viewer)
   ▼
services/repositories/index.ts      按 DATA_MODE 选择适配器
   ├── LocalAdapter → localStore(AsyncStorage)，带串行事务，隐私裁剪在前端完成
   └── RemoteAdapter → api/client.ts（fetch + JWT + 超时 + 统一错误）→ 后端 REST
```

关键约束（已落实）：

- **页面组件不直接读写 AsyncStorage**：`src/app` 与 `src/components` 中没有 `AsyncStorage` 导入，只有 `services/storage/*` 使用；
- **业务规则在仓储层**：重复加入、超员、满员置底、到期结束、状态锁、通知生成等都在 `localRecruitmentRepository.ts` / 后端中实现，页面只展示结果；
- **隐私按访问者裁剪**：列表摘要不含联系方式；详情页 `contact` 仅对发布者与有效成员返回明文，其余为 `null` + `contactMasked`；
- **时间统一 ISO 8601**：仓储层写入 `new Date().toISOString()`，展示统一走 `lib/date.ts`。

### 换成真实后端要改什么

1. 实现 `docs/api.md` 中的接口（或直接用 `server/` 草案完善）；
2. `.env` 切 `EXPO_PUBLIC_DATA_MODE=remote`；
3. 完成。`remote/` 下的三个仓储已经写好请求、参数与响应类型，页面与状态层零改动。

---

## 五、功能清单

### 活动招募（首页）

- 顶栏：标题、招募总数、发布按钮
- 搜索：按活动名称、要求、补充内容、发布者、学院匹配（350ms 防抖）
- 筛选：二级学院（多选）、活动类型（多选）、剩余名额（有剩余 / 仅剩 1-2 人）、发布时间（1/3/7 天）
- 列表按发布时间倒序，卡片含状态、类型、标题、学院、要求摘要、进度条、已加入/需要、剩余名额、发布者、相对时间
- **满员不下架**：招满后仍留在首页，归入「已满员」分组并排在所有招募中活动之后；到报名截止时间才转为「已结束」并离开首页
- 下拉刷新、触底分页（每页 10）
- 状态：加载中 / 加载失败可重试 / 无搜索结果（可清除筛选）/ 暂无招募（可去发布）

### 发布招募

- 必填：标题（4-40）、二级学院、需要人数（1-100）、要求（5-300）、联系方式类型（QQ / 微信 / 电话）+ 联系方式、活动链接
- 选填：补充内容（≤500）、活动类型
- 必填：报名截止时间（预设 3 天 / 1 周 / 2 周，或**自定义具体日期与时间**，日历 + 时分步进，精确到 5 分钟）
- 发布时自动带出当前登录用户姓名与学院
- 校验：必填、长度、人数、联系方式格式（按所选类型分别校验 QQ / 微信 / 电话）、链接格式；错误定位到具体字段
- 成功后回到首页，列表按时间倒序展示

### 招募详情与加入

- 完整信息、发布者信息、进度、状态、截止时间
- 联系方式按类型展示（QQ / 微信 / 电话各自图标 + 文案），详情、成员列表、通知、「我的队伍」均标注类型
- 加入：弹窗先选联系方式类型再填写号码 → 提交；同一用户不可重复加入；发布者不能加入自己的队伍
- 满员自动变 `full`：**仍留在首页**（归入「已满员」分组，排在最后），不再接收新成员；到报名截止时间才转 `ended` 并离开首页
- 已满员 / 已结束 / 已取消 / 已加入 均给出明确禁用原因
- 发布者：编辑、取消、重新发布、移除成员；成员：退出队伍

### 通知

- 仅发布者可见，按时间倒序；展示加入者姓名、学号、学院、联系方式（含类型）、加入时间、对应招募
- 已读/未读（左侧蓝条 + 圆点），点击标记已读，支持全部已读
- **系统通知**：有新成员加入时弹出 Android 系统通知（渠道「队伍加入提醒」，锁屏/横幅可见），点击直达对应招募详情；前台每 15 秒轮询一次
- 首次登录时申请通知权限（Android 13+ 会弹系统授权框）；拒绝后不再打扰，可到系统设置里重新开启
- Tab 未读角标；空状态提示

### 我的

- 登录兼注册：姓名 + 学号 + 学院；学号已存在时校验姓名与学院一致；登录态持久化
- 我的队伍：已加入与已发布的队伍，展示双方联系方式，可退出 / 移除成员
- 我的招募：进行中的招募（含已满员但未到截止时间），可编辑、取消
- 结束的招募：已结束 / 已取消的归档，可查看详情、重新发布、**删除**（物理删除，加入记录与通知一并移除）
- 退出登录（二次确认）

### 启动体验

- 原生启动图用 `resizeMode: contain`（`expo-splash-screen` 插件，背景 `#2F6FED`，logo 宽 200），不拉伸、不变形
- 进入 App 后播放「从正中向外扩散」的过渡动画：logo 淡入放大 → 底色圆从中心扩散铺满 → 整体淡出交给首页（`src/components/branding/SplashIntro.tsx`）

---

## 六、状态与数据规则

| 规则 | 实现位置 |
| --- | --- |
| 状态：`recruiting / full / ended / cancelled` | `src/types/models.ts`、`src/constants/options.ts` |
| 满员 → `full`，仍留在首页并排在其他活动之后；到截止时间才转 `ended` | `localRecruitmentRepository.list` / `localDb.recomputeRecruitmentStatuses`；后端 `list()` / `expireOverdue()` |
| 「我的招募」= 招募中 + 已满员；「结束的招募」= 已结束 + 已取消 | `myRecruitments` / `myEnded`（前端本地与后端同规则） |
| 删除为物理删除：招募、加入记录与相关通知一并移除 | 本地仓储 `deleteRecruitment()`；后端 `remove()`（Prisma 事务） |
| 防重复加入 | `join()` 校验 + 本地 `JoinRecord` 状态 |
| 人数不超过需要人数 | `join()` 前置校验 + 满员判定 |
| 发布/加入校验（必填、长度、人数、联系方式） | `lib/validate.ts`（前端）+ `server/.../recruitment.service.ts`（后端） |
| 通知在加入成功后生成 | `join()` 内 unshift 通知 / 后端事务内 create |
| 重新发布 | `reopen()`：默认 `max(需要人数, 已加入+1)`，过期的截止时间顺延 7 天 |
| 时间 ISO 8601 | `lib/date.ts`、仓储写入 |

---

## 七、自测记录

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `npx tsc --noEmit` | 通过，0 错误 |
| 代码规范 | `npx eslint .` | 通过，0 error / 0 warning |
| Web 构建 | `npx expo export -p web` | 成功，产物在 `dist-web/`（15 个路由 bundle） |
| 后端迁移 + 种子 | `npx prisma migrate dev` / `npm run seed` | 通过，users 6 / recruitments 8 / joins 13 / notifications 3 |
| 后端接口冒烟 | `curl` / `Invoke-RestMethod` | health、登录、列表、详情、加入、重复加入拦截、通知、退出、隐私裁剪均符合预期 |
| remote 模式页面 | `DATA_MODE=remote` + 无头 Edge | 首页从 `:3000` 取到 7 条招募（5 条招募中在前、2 条已满员在后并带分组头），登录拿到 JWT，0 控制台错误 |
| Release APK | `gradlew :app:assembleRelease` | 成功，`build/campus-team-1.0.2.apk`，32,800,867 字节，`versionCode 3` / `1.0.2`（SHA-256 `9DC43805…2C3540`） |
| Web 版（线上） | `expo export -p web` + 无头 Edge | 导出后部署到 nginx 根路径；页面渲染「7 个活动」、列表取自云端 API，0 控制台错误 |
| iOS 配置 | `npx expo config --type introspect` | `com.campus.team` / buildNumber 3 / `NSAllowsArbitraryLoads: true` 均正确注入；本机（Windows）无法编译 `.ipa` |

> `npx expo lint` 在部分环境会误报「需要 ESLint ≥ 8.57」（本地已装 9.39.5），直接用 `npx eslint .` 或 `npm run lint` 即可。

建议按下面的路径手动验收（local 模式）：

1. 首页 → 发布招募（不填直接提交）→ 看到字段级错误；
2. 填写完整并发布 → 返回首页，新招募在第一位；
3. 搜索关键词、打开筛选选「通信与信息工程学院 + 竞赛」→ 结果收敛，清空筛选恢复；
4. 退出登录 → 打开某条招募 → 点「登录后加入队伍」→ 用种子账号登录；
5. 加入 → 填联系方式 → 详情显示「你已在队伍中」；再次尝试加入被拦截；
6. 用发布者身份（种子数据里的张三有招募）查看通知 Tab：未读角标、点击已读；
7. 我的队伍 → 看到发布者与成员的联系方式；
8. 把招募人数填满（或加入最后一个名额）→ 首页该招募移到最底部「已满员」分组、状态「已满员」、加入按钮变为不可用；发布者「我的招募」里仍能看到它；
9. 把它的报名截止时间改到过去（或用种子数据里已过期的招募）→ 自动转「已结束」并离开首页，出现在「我的 → 结束的招募」；
10. 我的招募 → 编辑人数 / 标题 → 保存后详情同步；取消招募 → 归档为「已取消」；
11. 杀掉 App 重开 → 登录态与数据仍在；重新打开时能看到「从中间扩散」的启动动画。

---

## 八、Expo App 与服务器部署的关系

**Expo 原生 App 不会「部署到服务器上运行」。** 它是要安装到手机上的客户端，服务器只负责 API、数据库与静态资源。

```
┌──────────────────────┐        HTTPS/JSON        ┌────────────────────────┐
│  Expo App (iOS/APK)  │ ───────────────────────▶ │  Nginx 443             │
│  或 Web 静态站点      │ ◀─────────────────────── │   └─ Node API :3000    │
└──────────────────────┘                          │        └─ PostgreSQL   │
                                                  └────────────────────────┘
```

三条互不影响的发布路径：

1. **手机安装包**：`npx eas-cli@latest build -p android --profile preview`（或 `-p ios`），EAS 云端构建后下载 APK/IPA；也可本地 `npx expo run:android`。
2. **Web 版**：`npx expo export -p web` 生成 `dist-web/`，把静态文件放到 Nginx / 对象存储 / Vercel 等任意静态托管。
3. **后端**：已部署到云服务器（见下节「云服务器部署」），也可用 `docker compose up -d --build` 在本机或任意主机启动 API + PostgreSQL。

三者通过 `EXPO_PUBLIC_API_BASE_URL` 关联：构建安装包或 Web 产物前，把它设为线上 API 地址（如 `https://api.example.com/api`），再构建。

### 本机后端启动与联调（已跑通）

本机没有 Docker，后端用「便携版 PostgreSQL 17 + Node」直接跑：

```powershell
# 1. 启动数据库（一次性；数据目录与日志都在工具链目录下）
$tc = "$env:LOCALAPPDATA\campus-toolchain"
Start-Process "$tc\pg\pgsql\bin\postgres.exe" `
  -ArgumentList '-D', "$tc\pgdata", '-p', '5432', '-c', 'listen_addresses=0.0.0.0' `
  -WindowStyle Hidden

# 2. 启动 API（首次需迁移 + 种子数据）
cd C:\ct\server
npm.cmd install                                  # 首次
npm.cmd install-scripts approve prisma @prisma/client @prisma/engines esbuild
npx.cmd prisma migrate deploy                    # 首次
npm.cmd run seed                                 # 可选：重置为演示数据
npm.cmd run dev                                  # tsx watch，监听 0.0.0.0:3000

# 3. 验证（电脑本机或手机浏览器）
# http://192.168.1.164:3000/api/health
```

`server/.env` 里 `DATABASE_URL=postgresql://campus@127.0.0.1:5432/campus_team?schema=public`（trust 认证，仅本机开发用）。

也可以一条命令启动（幂等：端口已在监听就跳过，末尾做健康检查并打印局域网地址）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-server.ps1
```

手机访问不到时依次检查：

1. 手机与电脑在同一 Wi-Fi；
2. 后端 `listen_addresses=0.0.0.0`（上面命令已带）；
3. **Windows 防火墙**。本机网络被识别为「公用网络」，原本有两条针对 `D:\nodejs\node.exe` 的入站 Block 规则（点过「取消」留下的），会直接丢弃手机发来的请求。修复分两步，都需要管理员权限（UAC 弹窗点「是」）：

```powershell
# 1. 放行端口（已执行）
netsh advfirewall firewall add rule name="campus-team api" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="campus-team expo" dir=in action=allow protocol=TCP localport=8081

# 2. 把 Node 的入站 Block 规则改成 Allow（Block 优先级高于 Allow，必须改）
powershell -ExecutionPolicy Bypass -File scripts\fix-firewall.ps1
```

改完用手机浏览器打开 `http://192.168.1.164:3000/api/health` 验证：能看到 `{"success":true,...}` 说明网络通了，剩下的是 App 侧问题；打不开则是路由器开了「AP 隔离」或手机在别的网段。

没有管理员权限时，可改走 USB：`adb reverse tcp:3000 tcp:3000`，并把 `.env` 的 `EXPO_PUBLIC_API_BASE_URL` 改成 `http://127.0.0.1:3000/api` 重新构建 APK。

### 云服务器部署（已上线）

后端已部署在阿里云 ECS，公网地址：**`http://139.196.169.146/api`**（Nginx 80 端口反代到 Node 的 3000 端口）。

| 项目 | 位置 / 值 |
| --- | --- |
| 系统 | Debian 12，2 核 / 1.6 GB 内存（另有 2 GB swap）/ 40 GB 磁盘 |
| 代码 | `/opt/campus-team/app` |
| 环境变量 | `/opt/campus-team/.env`（600 权限，含随机数据库密码与 JWT 密钥） |
| 进程 | systemd `campus-team.service` → `node dist/index.js` |
| 反向代理 | `/etc/nginx/sites-available/campus-team`（80 → 127.0.0.1:3000） |
| 数据库 | PostgreSQL 15，库 `campus_team`，用户 `campus`（仅本机口令登录） |
| 日志 | `journalctl -u campus-team -f`、`/var/log/nginx/` |

```bash
systemctl status campus-team
journalctl -u campus-team -n 50 --no-pager
curl -s http://127.0.0.1/api/health
```

浏览器自检：打开 `http://139.196.169.146/api` 会返回服务索引（名称、版本与接口列表），`http://139.196.169.146/api/health` 返回 `{"success":true,...}`。直接访问 `/api` 不是业务接口，它只用来确认「Nginx → Node → PostgreSQL」这条链路是通的。

客户端指向云端只需要改 `.env`：

```env
EXPO_PUBLIC_DATA_MODE=remote
EXPO_PUBLIC_API_BASE_URL=http://139.196.169.146/api
```

`EXPO_PUBLIC_*` 在**构建时**内联进 bundle，改完必须重新打 APK / 导出 Web。阿里云安全组只需放行 22 与 80，3000 端口不对外暴露。

同一个 Nginx 还托管了 Web 版（`/opt/campus-team/web`，Expo 导出的静态站），iPhone Safari 可直接打开 **`http://139.196.169.146/`** 使用，并「添加到主屏幕」当 App 用；Android 仍以安装包为准。Web 版更新：

```powershell
npx expo export -p web --output-dir dist-web
# 打包 dist-web 上传到服务器，覆盖 /opt/campus-team/web/ 即可（详见 docs/deploy.md）
```

重新部署、初始化数据、Nginx 配置与安全待办详见 [`docs/deploy.md`](docs/deploy.md)。目前只有 HTTP，登录口令与 JWT 为明文传输；正式上线前请绑定域名开 HTTPS，并修改 root 密码、改用 SSH 密钥登录。

### iOS 端（Windows 不能编译 .ipa，已接好 EAS）

iOS 原生包只能在 macOS + Xcode 或 EAS 云构建上产出，Windows 下 `npx expo prebuild -p ios` 会被 Expo 直接跳过。项目已接入 EAS（账号 `mcliugepi`，项目 `@mcliugepi/campus-team`），CLI 已登录：

| 项目 | 值 |
| --- | --- |
| Bundle Identifier | `com.campus.team` |
| 版本 / buildNumber | `1.0.2` / `3` |
| ATS 明文放行 | `app.json` → `ios.infoPlist.NSAppTransportSecurity`（后端还是 http） |
| 构建档位 | `eas.json`：`development` / `simulator` / `preview` / `production`（各档位内置了 `EXPO_PUBLIC_*`） |
| 模拟器构建 | `npx eas-cli build -p ios --profile simulator`（无需 Apple 凭据，用于验证可编译） |
| 真机 .ipa | `npx eas-cli build -p ios --profile preview`（Ad Hoc，需要 Apple Developer 付费账号） |

三条路径（详见 [`docs/ios.md`](docs/ios.md)）：

1. **iPhone 直接用**：Safari 打开 `http://139.196.169.146/`，添加到主屏幕；
2. **EAS 云构建**：`npx eas-cli@latest login --device` → `npx eas-cli@latest build -p ios --profile preview`（需要 Expo 账号，装真机还需 Apple 账号签名）；
3. **macOS 本地**：`npx expo prebuild -p ios && npx expo run:ios`。

### iOS 无签名 .ipa（GitHub Actions 已跑通）

源码已推到 <https://github.com/mcliu-Nya/campus-team>（Public）。在 Actions 里手动触发 **iOS unsigned ipa** → Run workflow，约 12 分钟产出未签名安装包：

| 项目 | 值 |
| --- | --- |
| 产物 | `campus-team-unsigned.ipa`（约 13.6 MB，`Payload/app.app`，无 `_CodeSignature`） |
| 校验 | `com.campus.team` · `1.0.2 (3)` · `MinimumOSVersion 16.4` · 内联 `http://139.196.169.146/api` |
| 本机副本 | `build/campus-team-1.0.2-unsigned.ipa`（SHA-256 `60ABFAE4…696E`） |
| 安装 | Windows 上用 [Sideloadly](https://sideloadly.io/) + Apple ID 现签现装（免费账号 7 天有效） |

> 私有仓库跑 macOS runner 需要绑定付款方式，公开仓库免费；`runs-on` 必须用 `macos-latest`（`macos-14` 已下线，任务会被秒取消）。细节见 [`docs/ios.md`](docs/ios.md) 的「路径四」。


### 本地直接构建 APK（连本机后端）

不依赖 EAS，用本机 JDK 17 + Android SDK + Gradle 出包：

```powershell
# 1. 环境变量指向本机工具链（若已装 Android Studio 可跳过，用其 SDK 即可）
$root = "$env:LOCALAPPDATA\campus-toolchain"
$env:JAVA_HOME = "$root\jdk\jdk-17.0.21+9"
$env:ANDROID_HOME = "$root\sdk"

# 2. 确认 .env 指向本机后端（手机与电脑需同一 Wi-Fi）
#    EXPO_PUBLIC_DATA_MODE=remote
#    EXPO_PUBLIC_API_BASE_URL=http://<电脑局域网IP>:3000/api

# 3. 构建（只编 arm64，release 用 debug 签名，可直接安装）
cd android
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

产物：`android/app/build/outputs/apk/release/app-release.apk`，拷到手机安装即可（需允许「安装未知来源应用」）。当前成品为 `build/campus-team-1.0.2.apk`（32.8 MB / 31.28 MiB，SHA-256 `9DC43805…C3540`，`versionCode 3`、`versionName 1.0.2`，内置云端 API 地址 `http://139.196.169.146/api`），装有 adb 时可直接 `adb install -r build\campus-team-1.0.2.apk`。

因为 `.env` 的 API 地址是在**构建时**内联进 JS bundle 的：换 Wi-Fi / 换电脑 IP 后，要改 `EXPO_PUBLIC_API_BASE_URL` 并重新构建 APK（或用 `adb reverse tcp:3000 tcp:3000` 把手机请求转发到 USB 连接的电脑，再把地址写成 `http://127.0.0.1:3000/api`）。

Windows 上的三个注意点（本项目已处理）：

1. **明文 HTTP**：`app.json` 里通过 `expo-build-properties` 打开 `usesCleartextTraffic`，否则 Android 9+ 会拦截 `http://` 请求。
2. **路径长度**：React Native 原生编译会在 `.cxx` 下镜像源码绝对路径，超过 260 字符会报 `ninja: error: mkdir(...): No such file or directory`。本项目做了两件事：把真实工程放在 `C:\ct`（原位置 `C:\Users\mcliu\Documents\suidao` 是 junction），并在 `android/app/build.gradle` 的 `android { }` 里加 `externalNativeBuild { cmake { buildStagingDirectory = file('C:/cx/app') } }`，把整个 CMake 中间目录挪到 `C:\cx`。`android/` 是 prebuild 生成且被 gitignore，**重新 `expo prebuild` 后要再补这段配置**；换机器时也请把工程放在短路径下。
3. **依赖下载**：Gradle 发行包走腾讯镜像（`https://mirrors.cloud.tencent.com/gradle/`），Maven 走 `~/.gradle/init.d/aliyun-mirrors.gradle` 里的阿里云镜像（本机已配）。

### 版本号规则（每次迭代都要改）

| 字段 | 位置 | 规则 |
| --- | --- | --- |
| `version` | `app.json` | 语义化版本：加功能升 minor（`1.0.x → 1.1.0`），改文案/修 bug 升 patch（`1.0.1 → 1.0.2`） |
| `android.versionCode` | `app.json` | 每次发版 **+1**，且不能回退；重复或回退会导致覆盖安装失败 |
| `ios.buildNumber` | `app.json` | 每次发版 +1 |

- 改完 `app.json` 要跑一次 `npx expo prebuild -p android`，让 Gradle 重新生成 `versionName` / `versionCode`（`android/` 会被重建，记得补回 `local.properties` 和 `buildStagingDirectory`）。
- App 内「我的」页底部显示安装包的真实版本（`expo-application` 读 `versionName` / `versionCode`），用来确认手机上装的是哪一版：`版本 1.0.2 (3)`。
- 后端 `server/package.json` 的 `version` 与 `GET /api` 返回的 `version` 同步更新，便于确认线上是哪一版。

当前版本：**1.0.2（versionCode 3）**。

---

## 九、文档与后端草案

- [`docs/api.md`](docs/api.md)：16 个接口的请求/响应、错误码、隐私矩阵、校验规则、索引建议
- [`docs/deploy.md`](docs/deploy.md)：云服务器部署 runbook（systemd、Nginx、Web 版托管、重新部署、安全待办）
- [`docs/ios.md`](docs/ios.md)：iOS 端三条构建路径、ATS 配置与版本号约定
- [`server/README.md`](server/README.md)：后端目录结构、启动方式、契约映射、上线前待办
- [`docker-compose.yml`](docker-compose.yml)：PostgreSQL + API（+ 可选 Nginx profile）
- [`deploy/nginx.conf`](deploy/nginx.conf)：HTTPS 反向代理草案
- [`.env.example`](.env.example)：前端与后端环境变量

> 后端已在本机跑通：PostgreSQL 17 + Prisma 迁移 + 演示数据（`npm run seed`），`/api/health`、登录、招募列表/详情/发布/加入、我的队伍、通知等接口均实测返回正确数据。生产化仍需补限流、定时任务与集成测试（见 `server/README.md`）。

---

## 十、已知限制与后续待办

**限制**

- local 模式下数据只在本机，无法多人协作；remote 模式已可连本机后端，但还没有线上部署实例；
- remote 模式的 APK 依赖「电脑开着后端 + 手机同一 Wi-Fi」，电脑 IP 变了要重新构建（或用 `adb reverse`）；
- APK 目前用 debug keystore 签名（`android/app/build.gradle` 的 release 配置），适合内部安装，不适合上架；
- JWT 存在 AsyncStorage（非加密存储），正式环境建议换成 `expo-secure-store`；
- 通知为「前台每 15 秒轮询 + 本地系统通知」：App 完全退出后收不到提醒，真正的离线推送需要后端接入 FCM/APNs 与设备 token 注册；
- 没有头像、图片上传、聊天；
- 搜索与筛选在本地是全量过滤；后端因 SQL 里不便表达「剩余名额 ≤ 2」，暂时在服务层内存过滤后再分页，数据量大时需改成数据库表达式索引；
- 未做深色模式与多语言；
- 未在真机上实机走查（当前环境无 Android 设备 / 模拟器），已通过类型检查、Lint、Web 构建与 CDP 页面级验证，APK 已编译产出。

**后续**

- [x] 接入 `server/`：Prisma 迁移 + seed + 本机 PostgreSQL 联调
- [x] 本地构建 release APK（`build/campus-team-1.0.0.apk`，remote 模式指向本机 `:3000`）
- [ ] 用真机安装 APK 走一遍「发布 → 加入 → 通知 → 满员置底 → 到期结束」
- [ ] 离线推送（FCM / APNs + 设备 token 注册）、启动图改用品牌插画
- [ ] 招募收藏、分享（深链已配置 `campus-team://`）
- [ ] 举报与内容审核、频率限制
- [ ] 头像与活动海报上传（expo-image-picker + 对象存储）
- [ ] 单元测试（Jest / vitest）覆盖仓储层业务规则
