/**
 * cleanupExpiredFiles
 * --------------------
 * CloudBase Event Function. Triggered by a timer trigger every 10 minutes.
 *
 * Replaces:
 *   1. The original external-cron call to POST /api/files/cleanup (Next.js route).
 *   2. The Supabase pg_cron one-shot schedule (schedule_one_time_deletion RPC)
 *      that was supposed to delete each file exactly at its expires_at timestamp.
 *
 * Why one function instead of one-shot tasks:
 *   CloudBase timer triggers only support fixed-cadence 7-field cron expressions.
 *   They do NOT support one-shot "run once at <timestamp>" scheduling, which is
 *   what Supabase pg_cron + pg_net provided. The original Next.js code already
 *   treated one-shot scheduling as non-fatal ("Non-fatal, daily cleanup will
 *   catch it"), so running this function frequently (every 10 minutes) keeps
 *   the same fallback guarantee while simplifying the architecture.
 *
 * Database access:
 *   CloudBase Node SDK exposes app.rdb() (a postgREST client, same chain shape
 *   as @supabase/postgrest-js). Event Functions run inside the platform and get
 *   runtime credentials injected automatically, so we just call app.rdb() with
 *   no explicit API key.
 *
 * Required environment variables (configure on the function, not in code):
 *   - TCB_ENV                : CloudBase env id (auto-injected in Event Function)
 *   - AWS_REGION             : e.g. us-east-1
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - AWS_BUCKET_NAME
 *   - AWS_ENDPOINT           : optional, for S3-compatible storage
 *   - AWS_FORCE_PATH_STYLE   : 'true' / 'false'
 */

const tcb = require('@cloudbase/node-sdk');
const {
  S3Client,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');

const app = tcb.init();
const db = app.rdb();

const BATCH_SIZE = 100;

/**
 * Build an S3 client from environment variables. Mirrors the project's
 * S3StorageService configuration so the same storage backend is targeted.
 */
function buildS3Client() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const config = {
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  };
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT;
    config.forcePathStyle = process.env.AWS_FORCE_PATH_STYLE === 'true';
  }
  return new S3Client(config);
}

const s3 = buildS3Client();

async function deleteFromS3(keys) {
  if (!keys || keys.length === 0) return { deleted: 0 };
  // S3 deleteObjects is idempotent: deleting a non-existent key is a no-op,
  // so retrying after a partial failure is safe.
  const command = new DeleteObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: true,
    },
  });
  await s3.send(command);
  return { deleted: keys.length };
}

exports.main = async (event, context) => {
  const now = new Date().toISOString();
  console.log(`[cleanupExpiredFiles] run at ${now}`);

  try {
    // 1. Query expired files that have not been soft-deleted.
    // CloudBase PG postgREST chain — identical to the original Supabase call.
    const { data: expiredFiles, error: fetchError } = await db
      .from('files')
      .select('id, key')
      .lt('expires_at', now)
      .neq('status', 'deleted')
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('[cleanupExpiredFiles] fetch error:', fetchError);
      return { code: -1, message: 'Database fetch error', data: { error: String(fetchError) } };
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      console.log('[cleanupExpiredFiles] no expired files found');
      return { code: 0, message: 'No expired files found', data: { count: 0 } };
    }

    const keys = expiredFiles.map((f) => f.key).filter(Boolean);
    const ids = expiredFiles.map((f) => f.id).filter(Boolean);

    console.log(`[cleanupExpiredFiles] found ${keys.length} expired files`);

    // 2. Delete S3 objects first. Idempotent, safe to retry.
    try {
      await deleteFromS3(keys);
    } catch (s3Error) {
      console.error('[cleanupExpiredFiles] S3 delete failed:', s3Error);
      // Return non-zero so SCF records a failed invocation; the next tick will retry.
      return {
        code: -1,
        message: 'Failed to delete files from storage',
        data: { count: keys.length, s3Error: String(s3Error) },
      };
    }

    // 3. Delete DB records. postgREST .delete().in('id', ids) is identical to
    // the original Supabase call.
    const { error: deleteError } = await db
      .from('files')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('[cleanupExpiredFiles] DB delete failed:', deleteError);
      // Files are gone from S3 but records remain; next run will no-op on S3
      // and retry the DB delete.
      return {
        code: -1,
        message: 'Failed to delete records from database',
        data: { count: keys.length, error: String(deleteError) },
      };
    }

    console.log(`[cleanupExpiredFiles] cleanup done: s3=${keys.length}, db=${ids.length}`);

    return {
      code: 0,
      message: 'Cleanup successful',
      data: { count: keys.length, deleted: ids.length, keys },
    };
  } catch (error) {
    console.error('[cleanupExpiredFiles] unexpected error:', error);
    return {
      code: -1,
      message: error && error.message ? error.message : 'Internal Error',
      data: null,
    };
  }
};
