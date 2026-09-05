import { supabaseAdmin } from '@/lib/cloudbase';

export interface LogEntry {
  type: 'upload' | 'access';
  file_id?: string;
  file_key?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: 'success' | 'failed';
  ip?: string;
  user_agent?: string;
  referer?: string;
  error_message?: string;
}

export const logger = {
  /**
   * Asynchronously logs file activity to CloudBase PG (files.file_logs table).
   * Does not throw errors to ensure main flow is not interrupted.
   *
   * CloudBase PG exposes a postgREST client via app.rdb(), so the insert call
   * is identical to the original Supabase version — only the SDK entry differs.
   */
  async log(entry: LogEntry) {
    // We do not await this promise in the main flow to ensure performance,
    // but we catch errors here.
    const logPromise = async () => {
      try {
        const { error } = await supabaseAdmin
          .from('file_logs')
          .insert({
            ...entry,
          });

        if (error) {
          console.error('Failed to write log:', error);
        }
      } catch (err) {
        console.error('Logger exception:', err);
      }
    };

    // Execute and catch immediately
    logPromise();
  }
};
