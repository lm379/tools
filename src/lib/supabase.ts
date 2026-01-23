import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getSegmentedKey(segmentedVar: string, partPrefix: string, fallbackVar?: string): string {
  if (process.env[segmentedVar]?.toLowerCase() === 'true') {
    return [
      process.env[`${partPrefix}_PART1`],
      process.env[`${partPrefix}_PART2`],
      process.env[`${partPrefix}_PART3`]
    ].join('.');
  }
  return (fallbackVar ? process.env[fallbackVar] : process.env[segmentedVar]) || '';
}

export const supabaseKey = getSegmentedKey('SUPABASE_ANON_KEY_SEGMENTED', 'ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const supabaseServiceKey = getSegmentedKey('SUPABASE_SERVICE_ROLE_KEY_SEGMENTED', 'ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with service role key for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);
