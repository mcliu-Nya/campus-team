# 校园组队 API 契约

> 版本：v1.0 · 状态：**已实现并部署（`http://139.196.169.146/api`）**
>
> 前端 `src/services/repositories/remote/*` 已按本文档实现调用；Express + Prisma 后端的实现与文档一致，切换 `EXPO_PUBLIC_DATA_MODE=remote` 即可直连，页面逻辑无需改动。

---

## 1. 通用约定

| 项 | 约定 |
| --- | --- |
| Base URL | `EXPO_PUBLIC_API_BASE_URL`；线上为 `http://139.196.169.146/api`，本地默认 `http://localhost:3000/api` |
| 编码 | 请求/响应体均为 `application/json; charset=utf-8` |
| 时间 | 所有时间字段为 ISO 8601 UTC 字符串，如 `2026-11-09T09:57:19.000Z` |
| 命名 | JSON 字段使用 camelCase；数据库列可用 snake_case，由 ORM 映射 |
| 分页 | `page` 从 1 开始，`pageSize` 默认 10、上限 100 |
| 鉴权 | `Authorization: Bearer <JWT>`；登录类接口与公开列表无需鉴权 |
| 幂等 | 加入/退出/移除/取消均为状态类操作，重复调用按错误码返回，不产生重复数据 |

### 1.1 成功响应

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

`message` 可为空字符串；写操作建议返回一句中文提示（前端仅在无 data 时展示）。

### 1.2 错误响应

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "请填写活动名称"
}
```

HTTP 状态码与 `code` 的映射（前端 `src/services/api/client.ts` 按此解析）：

| HTTP | code | 含义 |
| --- | --- | --- |
| 400 / 422 | `VALIDATION_ERROR` | 字段校验失败、人数非法等 |
| 401 | `AUTH_REQUIRED` | 未登录 / token 失效 |
| 401 | `AUTH_MISMATCH` | 学号已注册但姓名或学院不一致 |
| 403 | `FORBIDDEN` | 非发布者操作、发布者加入自己的队伍 |
| 404 | `NOT_FOUND` | 招募/成员/通知不存在 |
| 409 | `ALREADY_JOINED` | 重复加入 |
| 409 | `RECRUITMENT_FULL` | 名额已满 |
| 409 | `INVALID_STATUS` | 当前状态不允许该操作 |
| 5xx | `UNKNOWN_ERROR` | 服务器内部错误 |

前端另有 `NETWORK_ERROR`（超时、断网、响应无法解析），仅由客户端抛出。

---

## 2. 数据模型

### 2.1 User

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主键 |
| `realName` | string | 真实姓名，2-20 字 |
| `studentId` | string | 学号，唯一，4-20 位字母数字 |
| `college` | string | 二级学院，取自固定列表 |
| `createdAt` | ISO 8601 | 注册时间 |

> 前端 `User` 不含登录状态字段，登录态由 token + 会话存储表达。

### 2.2 Recruitment

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主键 |
| `title` | string | 活动名称，4-40 字 |
| `college` | string | 发起学院（筛选用） |
| `activityType` | enum | `competition` / `research` / `innovation` / `practice` / `sports` / `volunteer` / `other` |
| `neededCount` | number | 需要人数，1-100 |
| `joinedCount` | number | 已加入人数（服务端由有效加入记录推导） |
| `requirements` | string | 队员要求，5-300 字 |
| `contact` | string | 队伍联系方式（**仅同队可见**） |
| `contactType` | enum | 联系方式类型：`qq` / `wechat` / `phone` |
| `activityUrl` | string | 活动链接，http(s) |
| `extra` | string | 补充内容，0-500 字 |
| `deadline` | ISO 8601 | 报名截止时间（必填，必须晚于当前时间） |
| `publisherId` | string | 发布者 userId |
| `publisherName` | string | 发布者姓名（冗余，发布时快照） |
| `publisherCollege` | string | 发布者学院（冗余） |
| `status` | enum | `recruiting` / `full` / `ended` / `cancelled` |
| `createdAt` | ISO 8601 | 发布时间 |
| `updatedAt` | ISO 8601 | 最后更新时间 |

**列表摘要 `RecruitmentSummary`** 在 Recruitment 基础上：去掉 `requirements` / `contact` / `extra` / `activityUrl`，增加 `remainingCount`、`requirementsPreview`（52 字截断）。摘要不含任何联系方式字段。

### 2.3 JoinRecord（TeamMember）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主键 |
| `recruitmentId` | string | 招募 id |
| `userId` | string | 加入者 id |
| `realName` / `studentId` / `college` | string | 加入时身份快照 |
| `contact` | string | 加入时填写的联系方式 |
| `contactType` | enum | 联系方式类型：`qq` / `wechat` / `phone` |
| `joinedAt` | ISO 8601 | 加入时间 |
| `status` | enum | `active` / `left` / `removed` |
| `updatedAt` | ISO 8601 | 状态变更时间 |

唯一约束建议：`(recruitmentId, userId)` 上做部分唯一索引（仅 `status='active'`），保证同一用户不会同时存在两条有效加入记录；历史 `left` / `removed` 记录保留。

### 2.4 Notification

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 主键 |
| `recipientUserId` | string | 接收者（招募发布者） |
| `recruitmentId` | string | 相关招募 |
| `recruitmentTitle` | string | 招募标题快照 |
| `joinerUserId` | string | 加入者 id |
| `joinerName` / `joinerStudentId` / `joinerCollege` / `joinerContact` | string | 加入者信息快照 |
| `joinerContactType` | enum | 加入者联系方式类型：`qq` / `wechat` / `phone` |
| `content` | string | 文案，如 `「数学建模竞赛组队」有新成员加入` |
| `read` | boolean | 已读/未读 |
| `createdAt` | ISO 8601 | 生成时间 |

### 2.5 招募状态机

```
            名额已满                      重新发布
recruiting ──────────▶ full ───────────────────▶ recruiting
    │  │                │  ▲
    │  │ 截止时间已过     │  │ 有成员退出 / 被移除
    │  │                │  └──────────────▶ recruiting
    │  ▼                ▼
    │ ended ◀──────── ended（满员招募到期同样转 ended）
    │
    │ 发布者取消
    ▼
cancelled ──────────────▶ recruiting（重新发布）

full / ended / cancelled ──发布者删除──▶ 记录被移除（物理删除）
```

| 规则 | 说明 |
| --- | --- |
| 满员 | `joinedCount >= neededCount` → `full`；**仍在首页展示**，归入「已满员」分组并排在 `recruiting` 之后，不再接受新成员 |
| 退出/移除 | `full` 且出现空位 → 回到 `recruiting` |
| 截止 | `deadline`（必填）已过且状态仍为 `recruiting` 或 `full` → `ended`，此时才离开首页并进入「结束的招募」（读取时惰性计算，或定时任务） |
| 取消 | 发布者主动取消 → `cancelled`，不可再加入 |
| 重新发布 | `full` / `ended` / `cancelled` → `recruiting`；`neededCount` 必须大于当前 `joinedCount`；过期或缺失的截止时间自动顺延 7 天 |
| 删除 | **物理删除**：招募及其加入记录、相关通知一并移除，不保留历史数据 |
| 我的招募 | 返回 `recruiting` + `full`（都算「进行中」） |
| 结束的招募 | 返回 `ended` + `cancelled`（不含 `full`） |

---

## 3. 接口清单

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/auth/login` | 否 | 登录 / 首次注册 |
| GET | `/auth/me` | 是 | 当前登录用户 |
| GET | `/recruitments` | 否 | 招募列表（搜索 / 筛选 / 分页） |
| POST | `/recruitments` | 是 | 发布招募 |
| GET | `/recruitments/:id` | 可选 | 招募详情（按访问者裁剪隐私） |
| PATCH | `/recruitments/:id` | 是 | 编辑招募（发布者） |
| POST | `/recruitments/:id/join` | 是 | 加入招募 |
| POST | `/recruitments/:id/leave` | 是 | 退出队伍 |
| POST | `/recruitments/:id/remove` | 是 | 发布者移除成员 |
| POST | `/recruitments/:id/cancel` | 是 | 取消招募 |
| POST | `/recruitments/:id/reopen` | 是 | 重新发布 |
| DELETE | `/recruitments/:id` | 是 | 删除招募（物理删除，仅已结束/已取消） |
| GET | `/my/teams` | 是 | 我的队伍 |
| GET | `/my/recruitments` | 是 | 我发布的进行中招募（含已满员） |
| GET | `/my/ended` | 是 | 结束的招募（已结束 / 已取消） |
| GET | `/notifications` | 是 | 通知列表 |
| PATCH | `/notifications/:id/read` | 是 | 标记已读 |

---

## 4. 接口详情

### 4.1 POST /auth/login

登录兼注册：学号不存在则创建用户，存在则校验姓名与学院。

请求：

```json
{ "realName": "张三", "studentId": "2021001", "college": "通信与信息工程学院" }
```

成功 `data`：

```json
{
  "token": "<JWT>",
  "user": {
    "id": "u_xxx",
    "realName": "张三",
    "studentId": "2021001",
    "college": "通信与信息工程学院",
    "createdAt": "2026-11-09T09:57:19.000Z"
  }
}
```

错误：`VALIDATION_ERROR`（字段格式）、`AUTH_MISMATCH`（学号已注册但姓名/学院不一致）。

JWT payload 建议：`{ "sub": "<userId>", "studentId": "2021001", "iat": ..., "exp": ... }`，有效期 7 天。

### 4.2 GET /auth/me

成功 `data`：`User`。错误：`AUTH_REQUIRED`。

### 4.3 GET /recruitments

查询参数（均可选）：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `keyword` | string | 匹配标题、要求、补充内容、发布者姓名、学院 |
| `college` | string | 学院，多值用逗号分隔，如 `a,b` |
| `type` | enum | 活动类型，多值用逗号分隔 |
| `spot` | `any` \| `available` \| `scarce` | 剩余名额：有剩余 / 紧缺（≤2） |
| `publishedWithin` | `1d` \| `3d` \| `7d` \| `all` | 发布时间范围 |
| `page` | number | 默认 1 |
| `pageSize` | number | 默认 10，最大 100 |

服务端行为：返回 `status ∈ {recruiting, full}`；排序规则为「招募中在前、已满员在后」，同组内按 `createdAt` 倒序；`deadline` 已过的（无论招募中还是已满员）先置为 `ended` 并不再返回。

成功 `data`：

```json
{
  "items": [ /* RecruitmentSummary[] */ ],
  "total": 12,
  "page": 1,
  "pageSize": 10,
  "hasMore": true
}
```

### 4.4 POST /recruitments

请求体 `RecruitmentWriteRequest`：

```json
{
  "title": "全国大学生数学建模竞赛组队",
  "college": "通信与信息工程学院",
  "activityType": "competition",
  "neededCount": 3,
  "requirements": "熟悉 Python，有建模经验优先",
  "contactType": "wechat",
  "contact": "team_zhangsan",
  "activityUrl": "https://www.mcm.edu.cn/",
  "extra": "每周三晚集合",
  "deadline": "2026-11-20T16:00:00.000Z"
}
```

服务端：从 token 取发布者，写入 `publisherId/publisherName/publisherCollege`，`status='recruiting'`、`joinedCount=0`。
成功 `data`：`RecruitmentDetail`（发布者视角，联系方式明文）。错误：`VALIDATION_ERROR`、`AUTH_REQUIRED`。

### 4.5 GET /recruitments/:id

鉴权可选：带 token 时按访问者计算隐私字段。

成功 `data`：`RecruitmentDetail`

```json
{
  "id": "rc_xxx",
  "title": "...",
  "requirements": "...",
  "extra": "...",
  "activityUrl": "https://...",
  "contactMasked": "te***san",
  "contact": "team_zhangsan",
  "contactType": "wechat",
  "publisher": { "userId": "u_1", "realName": "张三", "studentId": "2021001", "college": "...", "contact": "team_zhangsan", "contactType": "wechat" },
  "members": [ /* MemberView[] */ ],
  "viewerIsPublisher": false,
  "viewerHasJoined": true,
  "viewerJoinedAt": "2026-11-09T10:00:00.000Z",
  "canJoin": false,
  "joinBlockedReason": "你已在队伍中"
}
```

裁剪规则：

| 访问者 | `contact` | `publisher.studentId` | `publisher.contact` | `members` |
| --- | --- | --- | --- | --- |
| 未登录 | `null` | 脱敏 | 脱敏 | `[]` |
| 已登录非成员 | `null` | 脱敏 | 脱敏 | `[]` |
| 队伍成员 | 明文 | 明文 | 明文 | 明文 |
| 发布者 | 明文 | 明文 | 明文 | 明文 |

`joinBlockedReason` 取值：`登录后即可填写联系方式加入队伍` / `这是你发布的招募` / `你已在队伍中` / `名额已满` / `队伍已满员，无法加入` / `该招募已结束，无法加入` / `该招募已取消，无法加入`。

错误：`NOT_FOUND`。

### 4.6 PATCH /recruitments/:id

请求体同发布（整体覆盖可编辑字段）。仅发布者可调用，`cancelled` 状态不可编辑。
约束：`neededCount >= joinedCount`，否则 `VALIDATION_ERROR`；若调整后仍有余位且状态为 `full`，服务端应回到 `recruiting`。
成功 `data`：`RecruitmentDetail`。错误：`FORBIDDEN`、`INVALID_STATUS`、`NOT_FOUND`、`VALIDATION_ERROR`。

### 4.7 POST /recruitments/:id/join

请求：`{ "contactType": "wechat", "contact": "lisi_wx" }`（`contactType` 为 `qq` / `wechat` / `phone`，服务端按类型校验格式）

服务端校验顺序：登录 → 招募存在 → 非发布者 → 状态为 `recruiting` → 名额未满 → 无有效加入记录。
成功后：写 `JoinRecord(active)`、`joinedCount+1`、满员置 `full`、为发布者生成 `Notification`（`read=false`）。
成功 `data`：`RecruitmentDetail`（成员视角）。
错误：`AUTH_REQUIRED`、`FORBIDDEN`（自己发布的）、`ALREADY_JOINED`、`RECRUITMENT_FULL`、`INVALID_STATUS`、`VALIDATION_ERROR`。

并发要求：在事务内对招募行加锁（`SELECT ... FOR UPDATE`）或使用条件更新 `UPDATE ... SET joined_count = joined_count + 1 WHERE id = $1 AND joined_count < needed_count`，避免超员。

### 4.8 POST /recruitments/:id/leave

无请求体。发布者不可退出（`FORBIDDEN`）；无有效加入记录 `NOT_FOUND`。
成功：`JoinRecord.status='left'`、`joinedCount-1`、`full → recruiting`。
成功 `data`：`RecruitmentDetail`（游客视角，因已退出）。

### 4.9 POST /recruitments/:id/remove

请求：`{ "joinId": "jn_xxx" }`，仅发布者。
成功：`status='removed'`、`joinedCount-1`、`full → recruiting`。错误：`FORBIDDEN`、`NOT_FOUND`。

### 4.10 POST /recruitments/:id/cancel

无请求体，仅发布者。成功：`status='cancelled'`，返回 `RecruitmentDetail`。
错误：`FORBIDDEN`、`INVALID_STATUS`（已取消）、`NOT_FOUND`。

### 4.11 POST /recruitments/:id/reopen

请求（可选）：`{ "neededCount": 4 }`
默认 `neededCount = max(neededCount, joinedCount + 1)`，必须 1-100 且大于 `joinedCount`；`deadline` 已过或为空时自动顺延 7 天。
成功：`status='recruiting'`，返回 `RecruitmentDetail`。错误：`FORBIDDEN`、`INVALID_STATUS`（仍在招募中）、`VALIDATION_ERROR`。

### 4.12 DELETE /recruitments/:id

无请求体，仅发布者，且仅允许 `ended` / `cancelled`（`recruiting` 需先取消；`full` 还有效，需先等到期或取消）。成功：`data` 为 `{ "id": "rc_xxx" }`。

**物理删除**：招募记录及其加入记录、相关通知一并从数据库移除，不保留历史数据，删除后不可恢复。

错误：`FORBIDDEN`、`INVALID_STATUS`（`recruiting` 需先取消）、`NOT_FOUND`。

### 4.13 GET /my/teams

返回当前用户作为发布者或有效成员的所有队伍（不含 `cancelled`），按 `updatedAt` 倒序。

```json
[
  {
    "recruitment": { /* RecruitmentSummary */ },
    "role": "member",
    "joinedAt": "2026-11-09T10:00:00.000Z",
    "myContact": "lisi_wx",
    "myContactType": "wechat",
    "publisher": { "userId": "u_1", "realName": "张三", "studentId": "2021001", "college": "...", "contact": "team_zhangsan", "contactType": "wechat" },
    "members": [ /* MemberView[]，含发布者之外的成员 */ ]
  }
]
```

### 4.14 GET /my/recruitments

当前用户发布且 `status ∈ {recruiting, full}` 的招募（已满员仍算进行中），`createdAt` 倒序，`data` 为 `RecruitmentSummary[]`。

### 4.15 GET /my/ended

当前用户发布且 `status ∈ {ended, cancelled}` 的招募（不含 `full`），`updatedAt` 倒序，`data` 为 `RecruitmentSummary[]`。

### 4.16 GET /notifications

当前用户收到的通知，`createdAt` 倒序，`data` 为 `Notification[]`。

### 4.17 PATCH /notifications/:id/read

无请求体，仅接收者本人。成功 `data`：更新后的 `Notification`。错误：`FORBIDDEN`、`NOT_FOUND`。

---

## 5. 校验规则（前后端必须一致）

| 字段 | 规则 |
| --- | --- |
| 真实姓名 | 2-20 字，中文/字母，允许少数民族姓名中的 `·` |
| 学号 | 4-20 位字母或数字 |
| 二级学院 | 必须在固定列表中（见 `src/constants/options.ts`） |
| 活动名称 | 4-40 字 |
| 需要人数 | 整数 1-100，且不小于已加入人数 |
| 队员要求 | 5-300 字 |
| 联系方式类型 | `qq` / `wechat` / `phone`，发布与加入时必填 |
| 联系方式 | 5-60 字，且必须匹配所选类型：QQ 5-11 位数字；微信 6-20 位字母/数字/`_`/`-` 且字母开头；电话 11 位手机号或 `区号-号码` 座机 |
| 活动链接 | `http://` 或 `https://` 开头，≤ 500 字 |
| 补充内容 | ≤ 500 字，可空 |
| 报名截止 | ISO 8601；必填；必须晚于当前时间（重新发布时若已过期则自动顺延 7 天） |

---

## 6. 隐私与安全要求

1. 列表接口绝不返回 `contact`、`studentId`、`realName` 之外的成员信息。
2. 详情接口按 §4.5 矩阵裁剪，`contactMasked` 始终脱敏（前端展示用）。
3. 「我的队伍」仅在当前用户为发布者或有效成员时返回明文联系方式。
4. 后端必须再次校验所有业务规则，不能依赖前端校验。
5. 速率限制建议：登录 10 次/分钟/IP；加入 20 次/分钟/用户。
6. 日志中不得记录明文联系方式与 token。

---

## 7. 数据库索引建议

| 表 | 索引 |
| --- | --- |
| `users` | `UNIQUE(student_id)` |
| `recruitments` | `(status, created_at DESC)`、`(publisher_id, status)`、`(college)`、`(activity_type)` |
| `join_records` | `(recruitment_id, status)`、`UNIQUE(recruitment_id, user_id) WHERE status='active'` |
| `notifications` | `(recipient_user_id, read, created_at DESC)` |
