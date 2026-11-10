# server —— 后端 API

> **状态：本机可运行。** 已安装依赖、在本地 PostgreSQL 17 上执行迁移并灌入演示数据，`npm run typecheck` 通过，`/api/health`、登录、招募列表、我的队伍、通知等接口均实测可用。生产化仍需按文末清单补齐（限流、定时任务、测试、日志等）。

## 目录结构

```
server/
├── Dockerfile                # 多阶段构建（deps → build → runtime）
├── package.json
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma         # User / Recruitment / JoinRecord / Notification + 枚举
│   ├── seed.ts               # 演示数据（6 用户 / 8 招募 / 13 加入 / 3 通知）
│   └── migrations/           # prisma migrate 产物
└── src/
    ├── index.ts              # Express 装配：CORS、JSON、/api 路由、健康检查、优雅退出
    ├── config/
    │   └── env.ts            # 环境变量读取与默认值
    ├── lib/
    │   ├── http.ts           # ApiError / ok() / asyncHandler / currentUserId
    │   ├── mask.ts           # 学号、联系方式脱敏（与前端规则一致）
    │   └── prisma.ts         # PrismaClient 单例
    ├── middleware/
    │   ├── auth.ts           # requireAuth / optionalAuth / signToken（JWT）
    │   └── errorHandler.ts   # 统一错误响应 + 404
    ├── types/
    │   └── dto.ts            # 对外 DTO，字段与前端 src/types/models.ts 对齐
    └── modules/
        ├── auth/             # POST /login、GET /me
        ├── recruitments/     # 列表 / 详情 / 发布 / 编辑 / join / leave / remove / cancel / reopen / delete
        ├── me/               # GET /my/teams、/my/recruitments、/my/ended
        └── notifications/    # GET 列表、PATCH 已读、POST read-all
```

## 本地运行

```bash
cd server
cp .env.example .env          # 修改 DATABASE_URL / JWT_SECRET
npm install                   # 若 npm 拦截 install 脚本：npm install-scripts approve prisma @prisma/client @prisma/engines esbuild && npm rebuild
npx prisma generate
npx prisma migrate dev        # 首次会创建 prisma/migrations
npm run seed                  # 可选：灌入演示数据
npm run dev                   # http://localhost:3000/api/health
```

服务默认监听所有网卡（`0.0.0.0:3000`），同一 Wi-Fi 下的手机可直接访问 `http://<电脑局域网IP>:3000/api`；如无法访问，检查 Windows 防火墙是否放行 Node.js。

自检：

```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"realName":"张三","studentId":"2021001","college":"通信与信息工程学院"}'
```

## 与前端对接

1. 后端按 `docs/api.md` 返回统一响应包；
2. 前端 `.env` 改为：

```env
EXPO_PUBLIC_DATA_MODE=remote
EXPO_PUBLIC_API_BASE_URL=http://<你的局域网IP>:3000/api
```

3. 重启 Expo（环境变量在打包时内联，改完必须重启）；
4. 页面逻辑无需改动：所有读写都经过 `src/services/repositories/remote/*`。

> 真机调试时 `localhost` 指向手机自身，请填电脑的局域网 IP，并保证同一 Wi-Fi。

## Docker 部署

```bash
docker compose up -d --build          # db + api
docker compose --profile proxy up -d  # 追加 Nginx（需先放证书到 deploy/certs/）
```

`docker-compose.yml` 与 `deploy/nginx.conf` 都是草案：域名、证书、`CORS_ORIGIN` 需按实际环境修改；生产环境务必替换 `JWT_SECRET` 与数据库密码。

## 契约实现要点

| 规则 | 落点 |
| --- | --- |
| 登录兼注册、学号唯一 | `modules/auth/auth.service.ts`（P2002 并发注册回退） |
| 联系方式仅同队可见 | `modules/recruitments/recruitment.service.ts` 的 `toDetail()` |
| 重复加入 / 超员 / 状态锁 | `join()` 事务内校验，`JoinRecord` 的 `(recruitmentId,userId)` 唯一约束 |
| 满员仍展示（首页置底）、到期才结束、退出回到招募中 | `join/leave/removeMember/expireOverdue` 内同步 `status` 与 `joinedCount` |
| 通知在加入成功后生成 | `join()` 事务内写 `Notification` |
| 不物理删除 | 全部为状态字段变更 |
| ISO 8601 | DTO 统一 `Date.toISOString()` |

## 上线前待办

- [ ] 安装依赖并跑通 `npm run typecheck`、`prisma migrate`，补一次端到端联调
- [ ] `spot` 筛选目前为内存过滤（`recruitment.service.ts` 已注释），数据量上来后改为 SQL 条件
- [ ] 截止时间过期目前是读取时惰性更新，建议加定时任务（node-cron / 队列）
- [ ] 登录与加入接口加速率限制（`express-rate-limit`）
- [ ] 增加 refresh token、登出黑名单（当前为 7 天单 token）
- [ ] 增加单元测试（vitest）与 API 集成测试（supertest）
- [ ] 增加 seed 脚本，便于演示环境初始化
- [ ] 结构化日志（pino）+ 请求 ID，日志中禁止出现 token 与明文联系方式
