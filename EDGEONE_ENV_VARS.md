# 环境变量获取指南

> 部署目标：EdgeOne Makers
> 配套分支：`migrate-supabase-to-cloudbase`
> 配套文件：`.env.example`

部署到 EdgeOne Makers 时，环境变量分两处配置：

- **本地开发**：项目根目录 `.env.local`（不要 commit）
- **EdgeOne 部署**：EdgeOne Makers 控制台 → 项目 → **设置 → 环境变量**（Production / Preview 两个环境都要填）

---

## 一、必填变量

### 1.1 CloudBase（数据库访问）

| 变量 | 说明 |
|---|---|
| `TCB_ENV` | CloudBase 环境 ID |
| `CLOUDBASE_APIKEY` | CloudBase 服务端 API Key（推荐） |

**`TCB_ENV` 获取**：

- 已知值：`YOUR_CLOUDBASE_ENV_ID`
- 控制台路径：[CloudBase 控制台](https://console.cloud.tencent.com/tcb) → 左侧选你的环境 → 概览页顶部「环境ID」一栏

**`CLOUDBASE_APIKEY` 获取**：

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) → 选环境 `YOUR_CLOUDBASE_ENV_ID`
2. 左侧菜单 → **环境** → **鉴权** → **API Key 管理** 标签页
3. 点 **创建 API Key**
   - 名称：`tools-edgeone`（或你习惯的名字，便于后续轮换/撤销）
   - 类型：选 **服务端**（`api_key`，等价于 Supabase 的 `service_role`，绕过 RLS）
   - 过期时间：按需，长期用选「永不过期」
4. 创建后**立即复制弹出的 Key 字符串**（只显示一次，关掉就再也看不到）
5. 粘到 `.env.local` 和 EdgeOne 控制台环境变量的 `CLOUDBASE_APIKEY`

> ⚠️ 这个 Key 拥有 service_role 权限（绕过 RLS），等同于数据库管理员。**不要 commit 到仓库**，不要写进前端代码，不要在日志里打印。

### 1.2 应用自身

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_APP_URL` | 应用对外 URL（用于生成文件访问链接） |
| `CRON_SECRET` | `/api/files/cleanup` 与 `/api/files/delete` HTTP 入口的鉴权 token |

**`NEXT_PUBLIC_APP_URL`**：

- 本地开发：`http://localhost:3000`
- EdgeOne 部署后：用 EdgeOne 给的访问 URL，例如 `https://your-project.edgeone.cool`（不带 query 参数）
- 如果绑定了自定义域名，用自定义域名

**`CRON_SECRET`**：

- 自己生成一个随机串，例如：`openssl rand -hex 32` 或 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- 这个串同时填到 `.env.local` 和 EdgeOne 控制台
- CloudBase 定时云函数 `cleanupExpiredFiles` **不经过** `/api/files/cleanup` HTTP 路由，所以**不需要**这个 secret——它只用于手动 / 外部 cron 兜底调用

### 1.3 S3 / S3 兼容存储（文件存储）

| 变量 | 说明 |
|---|---|
| `AWS_REGION` | S3 区域，如 `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM 用户 Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 用户 Secret Key |
| `AWS_BUCKET_NAME` | S3 桶名 |

**`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 获取**（AWS S3）：

1. 登录 [AWS 控制台](https://console.aws.amazon.com/)
2. 右上角点你的用户名 → **Security credentials**
3. 滚到 **Access keys** 区域 → 点 **Create access key**
4. 选 **Application running outside AWS**（EdgeOne 不是 AWS 服务）
5. 复制弹出的 `Access Key ID` 和 `Secret access key`（**Secret 只显示一次**）
6. 粘到 `.env.local` 和 EdgeOne 控制台环境变量

**推荐**：用 CAM 风格——创建一个专用 IAM 用户，只给它对目标桶的 `s3:PutObject` / `s3:GetObject` / `s3:DeleteObject` / `s3:HeadObject` 权限，**不要用根账号**。

**`AWS_BUCKET_NAME` 获取**：

- AWS 控制台 → [S3 服务页](https://console.aws.amazon.com/s3/) → 看桶列表，复制桶名

**`AWS_REGION` 获取**：

- S3 控制台 → 桶详情页顶部会显示 Region，如 `US East (N. Virginia)` → 对应代码 `us-east-1`

---

## 二、可选变量

### 2.1 S3 兼容存储（非 AWS S3）

如果你用的是腾讯云 COS / MinIO / 阿里云 OSS 等 S3 兼容存储，加这俩：

| 变量 | 说明 |
|---|---|
| `AWS_ENDPOINT` | 自定义 endpoint，如 `https://cos.ap-shanghai.myqcloud.com` |
| `AWS_FORCE_PATH_STYLE` | `true` 用 path-style（MinIO 等需要）；`false` 用 virtual-host style（AWS 默认） |

**腾讯云 COS** 的获取：
- [COS 控制台](https://console.cloud.tencent.com/cos) → 存储桶列表 → 桶详情页
- `AWS_ENDPOINT` = `https://cos.<region>.myqcloud.com`（如 `https://cos.ap-shanghai.myqcloud.com`）
- `AWS_BUCKET_NAME` = 桶名（形如 `tools-1301131062`）
- `AWS_REGION` = COS region，如 `ap-shanghai`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` = 腾讯云 API 密钥（[API 密钥管理](https://console.cloud.tencent.com/cam/capi)）
- `AWS_FORCE_PATH_STYLE` = `true`

### 2.2 CDN 签名 URL（如启用 CDN 加速）

| 变量 | 说明 |
|---|---|
| `CDN_DOMAIN` | CDN 域名，如 `cdn.example.com` |
| `TYPEA_SIGN_TOKEN` | Type-A 鉴权的签名密钥 |

只在 `src/app/api/files/[id]/route.ts` 与 `src/app/api/files/sign/route.ts` 里用到。不配的话这俩路由会返回 503；项目其他功能不受影响。

**腾讯云 EdgeOne / CDN Type-A 鉴权** 获取：
- EdgeOne / CDN 控制台 → 域名管理 → 鉴权配置 → Type-A → 签名密钥

---

## 三、备选凭证路径

如果 `CLOUDBASE_APIKEY` 不能用，可以用腾讯云 CAM 子账号密钥：

| 变量 | 说明 |
|---|---|
| `TENCENTCLOUD_SECRETID` | 腾讯云 CAM 子账号 SecretId |
| `TENCENTCLOUD_SECRETKEY` | 腾讯云 CAM 子账号 SecretKey |

**获取**：

1. 登录 [腾讯云 CAM 控制台](https://console.cloud.tencent.com/cam)
2. **用户** → **新建用户** → 选 **可访问资源并接收消息**（子用户）
3. 给该用户挂 CloudBaseFullAccess 策略（最小权限原则下只给 CloudBase 相关策略）
4. 创建时勾选 **编程访问** → 复制 `SecretId` + `SecretKey`

> ⚠️ 用子账号，**不要用主账号密钥**。子账号密钥泄露后撤销成本低。

---

## 四、EdgeOne Makers 部署时的注入

部署完成后，在 EdgeOne Makers 控制台配置环境变量：

1. 打开 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 找到你的项目 → 进项目详情
3. **设置** → **环境变量**
4. 按环境（Production / Preview）分别填入：
   - `TCB_ENV`
   - `CLOUDBASE_APIKEY`
   - `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_BUCKET_NAME`（+ 可选 `AWS_ENDPOINT` / `AWS_FORCE_PATH_STYLE`）
   - `NEXT_PUBLIC_APP_URL`（部署后用 EdgeOne 给的 URL）
   - `CRON_SECRET`
   - 可选：`CDN_DOMAIN` / `TYPEA_SIGN_TOKEN`

> 注意：`NEXT_PUBLIC_*` 开头的变量在 Next.js 构建时**烘焙到客户端代码**里。EdgeOne 部署时要在**构建前**就配好（即先在 EdgeOne 控制台填好环境变量，再触发部署）。

---

## 五、验证清单

部署 + 配置完环境变量后，按顺序 curl 一遍验证：

```bash
# 1. 拿上传 URL（验证 AWS S3 presigner 在 EdgeOne 运行时能跑）
curl -X POST https://your-project.edgeone.cool/api/files \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.png","contentType":"image/png","ttl":1440}'
# 期望：201，返回 uploadUrl + key + expiresAt

# 2. 确认上传 + 写 PG（验证 @cloudbase/node-sdk 的 app.rdb() 在 EdgeOne 凭证链下能通）
# 先用 uploadUrl PUT 一个文件到 S3，然后：
curl -X POST https://your-project.edgeone.cool/api/files/confirm \
  -H "Content-Type: application/json" \
  -d '{"key":"2024-01-01/xxx-test.png","filename":"test.png","contentType":"image/png","ttl":1440}'
# 期望：201，返回 fileId + accessUrl + expiresAt + ttlMinutes

# 3. 访问文件（验证 PG 查询 + CDN/S3 重定向）
curl -I https://your-project.edgeone.cool/files/<fileId>
# 期望：302，Location 指向 CDN 或 S3

# 4. 手动触发 cleanup（验证 CRON_SECRET 鉴权 + PG 批删）
curl -X POST https://your-project.edgeone.cool/api/files/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
# 期望：200，返回 count + keys
```

任一步失败，看 EdgeOne Makers 控制台 → 部署详情 → **日志** 标签页排查。

---

## 六、定时任务的环境变量（独立）

CloudBase 定时云函数 `cleanupExpiredFiles`（每 10 分钟运行一次）独立部署在 CloudBase 平台，**不在 EdgeOne 上**。它的 AWS 凭证要在 CloudBase 控制台单独配：

1. [CloudBase 控制台](https://console.cloud.tencent.com/tcb) → 云函数 → `cleanupExpiredFiles`
2. **函数配置** → **环境变量** → 添加：
   - `TCB_ENV` — CloudBase 环境 ID（`YOUR_CLOUDBASE_ENV_ID`）
   - `CLOUDBASE_APIKEY` — 服务端 API Key（见 1.1 节创建步骤）
   - `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_BUCKET_NAME`
   - 可选 `AWS_ENDPOINT` / `AWS_FORCE_PATH_STYLE`
3. 保存后下次触发自动生效

> ⚠️ 云函数**不是**免鉴权的，两个 CloudBase 变量都必须配：
>
> - 不配 `TCB_ENV`：`tcb.init()` 从运行时上下文推导 envId 失败 → `app.rdb()` 发出
>   `Accept-Profile: undefined` → `ERR_HTTP_INVALID_HEADER_VALUE` 报错。
> - 不配 `CLOUDBASE_APIKEY`：云函数用运行时临时凭证，映射的 PG role 没有
>   `files` 表 DELETE 权限 → `DATABASE_42501: permission denied for table files`。
>   配了 Server API Key 后以 `service_role` 身份操作，绕过 RLS 且有完整 DML。
>
> 建议给云函数单独创建一个专用 API Key（而不是复用应用那份），便于独立撤销。
