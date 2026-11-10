# 云服务器部署 runbook

后端部署在 **139.196.169.146**（阿里云 ECS，Debian 12，2 核 / 1.6 GB 内存 / 40 GB 磁盘），对外地址：

```
http://139.196.169.146/api
```

Nginx 监听 80，把 `/api/` 反代到 `127.0.0.1:3000`；Node 由 systemd 托管；数据库是同一台机器上的 PostgreSQL 15。

## 一、目录与进程

| 内容 | 位置 |
| --- | --- |
| 应用代码 | `/opt/campus-team/app` |
| 环境变量 | `/opt/campus-team/.env`（`chmod 600`，含随机数据库密码与 JWT 密钥） |
| systemd 单元 | `/etc/systemd/system/campus-team.service` |
| Nginx 站点 | `/etc/nginx/sites-available/campus-team`（软链到 `sites-enabled/`） |
| 数据库 | PostgreSQL 15，库 `campus_team`，用户 `campus`（仅 `127.0.0.1` 口令登录） |
| Web 版静态站 | `/opt/campus-team/web`（Expo 导出，Nginx 根路径直接托管，iPhone Safari 可用） |
| Node | `/usr/local/lib/nodejs/current`（22.20.0，软链 `/usr/local/bin/node`） |
| 日志 | `journalctl -u campus-team`、`/var/log/nginx/` |

```bash
systemctl status campus-team
journalctl -u campus-team -n 50 --no-pager
systemctl restart campus-team
curl -s http://127.0.0.1/api/health
```

自检顺序：`GET /api` 返回服务索引（200），`GET /api/health` 返回 `{"success":true,...,"env":"production"}`，`GET /api/recruitments?pageSize=5` 返回招募列表。`/api` 是 API 前缀而不是业务接口，早先没有根路由时会落到 404 `接口不存在`，现在已经补上索引路由。

## 二、重新部署

本机（`C:\ct`）打包后上传，再在服务器上解压、编译、重启：

```powershell
# 1. 本机打包（不含依赖与本地 .env）
cd C:\ct
tar -czf .deploy\server.tgz -C server --exclude node_modules --exclude dist --exclude .env .
```

```bash
# 2. 上传到 /root/server.tgz 后，在服务器执行
cd /opt/campus-team
rm -rf app && mkdir app && tar -xzf server.tgz -C app
cd app
set -a && . /opt/campus-team/.env && set +a
NODE_ENV=development npm install --include=dev --no-audit --no-fund
npx prisma migrate deploy
npm run build
systemctl restart campus-team
```

两个必须注意的点：

1. **`NODE_ENV=development npm install --include=dev`**：`.env` 里是 `NODE_ENV=production`，直接 `npm install` 会跳过 devDependencies，`tsc` 报 `TS2688: Cannot find type definition file for 'node'`。
2. **npm 源用腾讯镜像**：`npm config set registry https://mirrors.cloud.tencent.com/npm/`。这台机器访问 npmmirror 的 tarball 会大量 502/504（单个包重试 3 次、耗时 10 分钟仍失败）。

## 三、初始化 / 重置数据

```bash
cd /opt/campus-team/app
set -a && . /opt/campus-team/.env && set +a
npx prisma migrate deploy   # 建表
npm run seed                # 清空并写入演示数据（6 用户 / 8 招募 / 13 加入 / 3 通知）
```

`npm run seed` 会**清空**现有数据，只适合演示环境。

## 四、Nginx 与端口

```nginx
server {
    listen 80 default_server;
    client_max_body_size 2m;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location = /healthz { proxy_pass http://127.0.0.1:3000/api/health; }

    # 同一个 80 端口顺带托管 Web 版（iPhone Safari 可直接用）
    root /opt/campus-team/web;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

阿里云安全组只需放行 **22（SSH）** 与 **80（HTTP）**；3000 端口不对外暴露。

### 更新 Web 版

```powershell
# 本机（remote 模式）导出静态站
npx expo export -p web --output-dir dist-web

# 打包上传到服务器并解压覆盖
tar -czf web.tgz -C dist-web .
# 上传 web.tgz 后执行：
#   rm -rf /opt/campus-team/web/* && tar -xzf /root/web.tgz -C /opt/campus-team/web
#   chmod -R a+rX /opt/campus-team/web
```

`dist-web` 里的资源路径是站点根路径（`/_expo/...`），所以 Web 版必须挂在域名/端口根目录，不能放在 `/app/` 子路径下。

## 五、客户端如何指向云端

`C:\ct\.env`：

```env
EXPO_PUBLIC_DATA_MODE=remote
EXPO_PUBLIC_API_BASE_URL=http://139.196.169.146/api
EXPO_PUBLIC_API_TIMEOUT=15000
```

`EXPO_PUBLIC_*` 是**构建时内联**的，改完必须重新 `expo prebuild`（仅当原生配置变更）或直接重打 APK / 重新导出 Web：

```powershell
cd C:\ct\android
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

## 六、安全待办

- 目前只有 HTTP：登录口令与 JWT 明文传输。正式上线前请绑定域名，用 `certbot` 或 `deploy/nginx.conf` 的证书方案开 HTTPS，并把 App 的 `EXPO_PUBLIC_API_BASE_URL` 换成 `https://<域名>/api`。
- 修改 root 密码并改用 SSH 密钥登录，关闭密码登录（`PasswordAuthentication no`）。
- `.env` 里的 `JWT_SECRET` 与数据库密码是部署时随机生成的；轮换 JWT 密钥会让所有已登录用户失效。
- 建议给接口加限流（`express-rate-limit`）与访问日志脱敏。
