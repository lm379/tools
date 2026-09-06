# Supabase → CloudBase 迁移说明

> 分支：`migrate-supabase-to-cloudbase`
> 目标环境：`<CLOUDBASE_ENV_ID>`（体验版，PostgreSQL 模式，ap-shanghai）
> 完成时间：2026-09-05

## 一、为什么这样迁

### 1.1 环境是 PG 模式，不是 NoSQL

通过 `envQuery(action="info")` 确认当前 CloudBase 环境：

- `RuntimeMode = "postgresql"`
- `RuntimeBackends = { postgresql: true, nosql: false, mysql: false }`

也就是说，**NoSQL 文档数据库（`app.database()` / `db.collection()`）在这个环境里不可用**。所有数据访问必须走 CloudBase PG（PostgreSQL）。

### 1.2 Node SDK 暴露 `app.rdb()`，与 Supabase 同协议

CloudBase Node SDK 的 TypeScript 类型声明里只暴露了 `database()`（NoSQL）和 `models`（ORM），但 `dist/cloudbase.js` 第 148 行实际有 `this.rdb = (options) => getEntity(options)(options)`，运行时返回一个 **postgREST 客户端**——与 `@supabase/postgrest-js` 同源、链式 API 一致：

```ts
db.from('files').select().eq('id', id).single()
db.from('files').insert({...}).select().single()
db.from('files').update({...}).eq('key', key)
db.from('files').delete().in('id', ids)
db.rpc('function_name', args)
```

所以上层路由代码几乎不用改，迁移成本极低。`src/lib/cloudbase.ts` 用类型断言访问运行时方法，并补了最小接口声明。

## 二、改了什么

### 2.1 依赖

| 原 | 现 |
|---|---|
| `@supabase/supabase-js@^2.90.1` | `@cloudbase/node-sdk@^3.10.0`（实际装上 3.18.3） |

`next.config.mjs` 的 `serverComponentsExternalPackages` 已加上 `@cloudbase/node-sdk`。

### 2.2 源代码

| 文件 | 改动 |
|---|---|
| `src/lib/supabase.ts` | **删除** |
| `src/lib/cloudbase.ts` | **新建**。`app = tcb.init({ env: process.env.TCB_ENV })`，`db = (app as any).rdb()`；导出 `db`、`supabase`、`supabaseAdmin` 三个别名指向同一实例（Node SDK 默认 service_role，无 anon/admin 之分）。 |
| `src/lib/logger.ts` | import 改 `@/lib/cloudbase`；insert 链路恢复为 `.from('file_logs').insert({...})` 风格。 |
| `src/app/api/files/confirm/route.ts` | import 改 `@/lib/cloudbase`；insert 链路恢复 supabase 链式风格；**移除 `schedule_one_time_deletion` RPC 调用**（详见 §3）。 |
| `src/app/api/files/cleanup/route.ts` | import 改 `@/lib/cloudbase`；CRON_SECRET 鉴权保留作为 HTTP 入口；查询/删除链路恢复 supabase 风格。 |
| `src/app/api/files/delete/route.ts` | import 改 `@/lib/cloudbase`；不再 fallback `SUPABASE_SERVICE_ROLE_KEY`；**移除 `unschedule_cron_job` RPC 调用**（详见 §3）。 |
| `src/app/api/files/[id]/route.ts` | import 改 `@/lib/cloudbase`；select 链路恢复 supabase 风格。 |
| `src/app/api/files/sign/route.ts` | import 改 `@/lib/cloudbase`；select 链路恢复 supabase 风格。 |
| 4 个 `*.test.ts` | mock 路径改 `@/lib/cloudbase`；mock 形状保持 supabase 链式（与运行时一致）。 |

### 2.3 数据库

迁移文件：`cloudbase/migrations/20260905134330_create_files_and_file_logs.sql`

- `public.files` 表（bigserial id / key / bucket / expires_at / metadata jsonb / status / created_at）+ 2 个索引
- `public.file_logs` 表（type / file_id / file_key / file_name / file_size / mime_type / status / ip / user_agent / referer / error_message / created_at）+ 2 个索引
- RLS：两张表都启用 RLS
  - `files`：anon/authenticated 可读（让 `/files/[id]` 跳转生效）；写操作只允许 service_role（Node SDK 用 server API Key 即映射为 service_role，自动绕过 RLS）
  - `file_logs`：anon/authenticated 全部禁访问（只允许 server 写）
- GRANT：authenticated 拿到 SELECT/INSERT/UPDATE/DELETE + 序列 USAGE

迁移已通过 `managePgDatabase(action="applyMigration")` 应用，远端 history 已确认。

### 2.4 定时任务（详见 §3）

新建 `cloudfunctions/cleanupExpiredFiles/` 目录，含 `index.js` + `package.json`，作为 CloudBase Event Function 部署。

## 三、定时任务迁移评估

### 3.1 项目原有两个定时任务

| 任务 | 触发方式 | 用途 |
|---|---|---|
| **每日 cleanup** | 外部 cron（Vercel Cron 等）`POST /api/files/cleanup`，带 `CRON_SECRET` Bearer | 批量删除过期文件（S3 + DB） |
| **一次性删除** | 上传 confirm 时通过 supabase RPC `schedule_one_time_deletion` 在 pg_cron 中调度一次性任务，到点由 pg_net 调 `POST /api/files/delete`；删除后通过 `unschedule_cron_job` RPC 取消 | 单文件过期即删 |

### 3.2 迁移判断

**每日 cleanup**：

✅ **可以直接迁移**。已经迁移为 CloudBase 定时 Event Function `cleanupExpiredFiles`，timer trigger cron `0 */10 * * * * *`（每 10 分钟一次，比原"每日"更高频，更早删除过期文件）。

**一次性删除**：

❌ **不能直接迁移**，原因有二：

1. CloudBase 定时触发器只支持**固定周期**的 7 段 cron 表达式（秒-分-时-日-月-周-年），**不支持"一次性定点"调度**。Supabase 的 pg_cron + pg_net 组合能调度"在 X 时刻执行一次"的任务，CloudBase 没有等价能力。
2. CloudBase PG 是托管 PostgreSQL，`pg_cron` / `pg_net` 扩展**不保证可用**。即使能 `CREATE EXTENSION`，托管环境通常也不允许 cron worker 周期性扫描。

但好消息是：**原代码已经把一次性调度当作非关键路径**。`src/app/api/files/confirm/route.ts` 注释明确写着：

> "Non-fatal, daily cleanup will catch it"

也就是说，原本就设计了"如果一次性调度失败，daily cleanup 兜底"的容错。我们采用同一思路：

- **移除** `schedule_one_time_deletion` 与 `unschedule_cron_job` 这套 pg_cron 调度（代码已删，PG 里也不创建这两个 RPC）
- 把 daily cleanup 改成**每 10 分钟**运行一次，把"过期到删除"的最大延迟从"最长一天"压缩到"最长 10 分钟"
- 删除逻辑放在独立云函数里，不再依赖 Next.js 服务存活

`/api/files/delete` 路由保留，作为"立即删除"的 HTTP 入口（仍带 CRON_SECRET 鉴权），用于手动触发或外部 cron 兜底。

### 3.3 已部署的 CloudBase 资源

- **云函数** `cleanupExpiredFiles`（Nodejs18.15 / Event / timeout 30s / status Active）
- **Timer 触发器** `every-10-minutes`：`0 */10 * * * * *`（每 10 分钟）
- **PG 表** `files`、`file_logs` + 索引 + RLS（migration `20260905134330`）

## 四、需要你做的后续步骤

### 4.1 创建 CloudBase Server API Key

1. 进入 CloudBase 控制台 → 环境 `<CLOUDBASE_ENV_ID>` → 鉴权 → API Key 管理
2. 创建一个 server API Key（用于 Next.js 服务端调用 `app.rdb()`）
3. 把返回的 key 填到 `.env`：

   ```
   TCB_ENV=<CLOUDBASE_ENV_ID>
   CLOUDBASE_APIKEY=<your-server-api-key>
   ```

   或用腾讯云密钥替代：

   ```
   TENCENTCLOUD_SECRETID=<sub-account-secretid>
   TENCENTCLOUD_SECRETKEY=<sub-account-secretkey>
   ```

   ⚠️ 用 CAM 子账号，**不要用主账号密钥**。

`.env.example` 已包含全部条目，删除了原 Supabase 三项。

### 4.2 给云函数 `cleanupExpiredFiles` 配置 AWS 凭证

云函数代码读取 AWS S3 凭证从环境变量。在 CloudBase 控制台 → 云函数 → `cleanupExpiredFiles` → 配置 → 环境变量，添加：

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_BUCKET_NAME=<your-bucket>
AWS_ENDPOINT=<optional, for S3-compatible>
AWS_FORCE_PATH_STYLE=<true|false>
```

或用 MCP 一键更新：

```
manageFunctions(action="updateFunctionConfig", functionName="cleanupExpiredFiles",
  envVariables={ AWS_REGION, AWS_ACCESS_KEY_ID, ... })
```

> ⚠️ 不要把 AWS 凭证写进云函数代码或 commit 到仓库。

### 4.3 CRON_SECRET

仍然用作 Next.js `/api/files/cleanup` 与 `/api/files/delete` 的 HTTP 入口鉴权（手动触发 / 外部 cron 兜底）。自填一个随机串即可。CloudBase 定时云函数**不经过**这条 HTTP 路径，不需要它。

## 五、本地验证

```bash
pnpm install
pnpm test      # 14 suites / 85 tests passing
npx tsc --noEmit   # 0 errors
```

eslint 当前因 ESLint 8 与 ESLint 9 配置加载兼容问题报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，与本次改动无关，是仓库原本就有的环境问题。

## 六、回滚

如需回到 supabase，删除本分支即可；CloudBase 资源回滚方式：

- 删除云函数：`manageFunctions(action="deleteFunction", functionName="cleanupExpiredFiles", confirm=true)`
- 删除 timer 触发器：`manageFunctions(action="deleteFunctionTrigger", functionName="cleanupExpiredFiles", triggerName="every-10-minutes", confirm=true)`
- 回滚 PG migration：`managePgDatabase(action="rollbackMigration", lastN=1, confirm=true)`
