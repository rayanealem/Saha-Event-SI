/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as _create } from '@supabase/supabase-js';

let _client: any = null;

export function createClient(): any {
  if (_client) return _client;
  _client = _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
  );
  return _client;
}
