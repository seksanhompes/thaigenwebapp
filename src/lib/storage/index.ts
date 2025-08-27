import { type StorageAdapter } from "@/lib/types";
let adapter: StorageAdapter | null = null;
export async function getStorage(): Promise<StorageAdapter> {
  if (adapter) return adapter;
  if ((process.env.STORAGE_PROVIDER || 'local') === 'supabase') {
    const { supabaseStorage } = await import('./supabase');
    adapter = supabaseStorage();
  } else {
    const { localStorageAdapter } = await import('./local');
    adapter = localStorageAdapter();
  }
  return adapter;
}
