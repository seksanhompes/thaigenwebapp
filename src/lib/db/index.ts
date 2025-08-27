import { type DBAdapter } from "@/lib/types";
let adapter: DBAdapter | null = null;
export async function getDB(): Promise<DBAdapter> {
  if (adapter) return adapter;
  if ((process.env.DB_PROVIDER || 'sqlite') === 'supabase') {
    const { supabaseAdapter } = await import('./supabase');
    adapter = supabaseAdapter();
  } else {
    const { sqliteAdapter } = await import('./sqlite');
    adapter = sqliteAdapter();
  }
  await adapter.init();
  return adapter;
}
