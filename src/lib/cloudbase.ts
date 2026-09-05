import tcb from '@cloudbase/node-sdk';

/**
 * CloudBase Node SDK 单例 + 数据库客户端。
 *
 * 替换原 @supabase/supabase-js 客户端。
 *
 * Node SDK 在 PG 模式下通过运行时方法 `app.rdb()` 返回一个 postgREST 客户端
 * （与 @supabase/postgrest-js 同源、协议一致），所以上层路由代码可以保持原
 * Supabase 链式调用风格：
 *
 *     db.from('files').select().eq('id', id).single()
 *     db.from('files').insert({...}).select().single()
 *     db.from('files').update({...}).eq('key', key)
 *     db.from('files').delete().in('id', ids)
 *
 * 注意：截至 @cloudbase/node-sdk@3.18.3，types/index.d.ts 没有声明 `rdb`
 * 方法（只有 `database()` 与 `models`），但 dist/cloudbase.js 第 148 行实际
 * 存在 `this.rdb = (options) => getEntity(options)(options)`，运行时可用。
 * 这里用类型断言绕过 TS 检查，并补一个最小的 rdb 类型声明。
 *
 * 必需环境变量：
 *   - TCB_ENV            : CloudBase 环境 ID（PG 模式）
 *   - CLOUDBASE_APIKEY   : CloudBase 服务端 API Key（控制台 -> 鉴权 -> API Key）
 *     或 TENCENTCLOUD_SECRETID + TENCENTCLOUD_SECRETKEY 备选
 */

if (!process.env.TCB_ENV) {
  throw new Error(
    '[cloudbase] Missing env TCB_ENV. Set it to your CloudBase env id (e.g. cloudbase-xxx).'
  );
}

if (!process.env.CLOUDBASE_APIKEY &&
    !(process.env.TENCENTCLOUD_SECRETID && process.env.TENCENTCLOUD_SECRETKEY)) {
  console.warn(
    '[cloudbase] No credentials detected. Set CLOUDBASE_APIKEY or (TENCENTCLOUD_SECRETID + TENCENTCLOUD_SECRETKEY).'
  );
}

export const app = tcb.init({
  env: process.env.TCB_ENV,
  // Node SDK 自动从 CLOUDBASE_APIKEY / TENCENTCLOUD_* 读取凭证
});

// Minimal postgREST-style client interface (subset of @supabase/postgrest-js).
// We only declare the methods actually used by this project so route code
// keeps full type-checking without depending on @supabase/postgrest-js types.
export interface PostgrestLikeClient {
  from(table: string): any;
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: unknown | null }>;
}

/**
 * 数据库客户端。运行时通过 app.rdb() 拿到 postgREST 客户端。
 *
 * ⚠️ 必须显式传 `database: 'public'`：Node SDK 的 getEntity 默认把 `database`
 * 设成 `envId`，而 envId 不是 PG schema 名，postgREST 会报
 * DATABASE_PGRST106 "Invalid schema: <envId>"。我们的 files / file_logs
 * 表建在 `public` schema 里，所以这里强制覆盖为 `public`。
 *
 * 由于 SDK 类型声明未暴露 rdb() 的签名，这里用类型断言访问运行时方法。
 */
export const db: PostgrestLikeClient = (
  app as unknown as {
    rdb: (opts?: { database?: string }) => PostgrestLikeClient;
  }
).rdb({ database: 'public' });

// 兼容原 supabase / supabaseAdmin 命名：CloudBase Node SDK 中
// app.rdb() 返回的客户端即可读也可写（携带 service_role 凭据），无需再区分 anon/admin。
export const supabase = db;
export const supabaseAdmin = db;
