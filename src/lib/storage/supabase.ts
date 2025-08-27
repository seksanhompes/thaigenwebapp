import { type StorageAdapter } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
function client() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseStorage(): StorageAdapter {
  return {
    async saveObject(key, data, contentType) {
      const { error } = await client().storage.from(bucket).upload(key, data, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      return { key, url: this.publicUrl(key) };
    },
    async saveText(key, text, contentType="text/plain; charset=utf-8") {
      const { error } = await client().storage.from(bucket).upload(key, text, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      return { key, url: this.publicUrl(key) };
    },
    publicUrl(key) { const { data } = client().storage.from(bucket).getPublicUrl(key); return data.publicUrl; },
    async deleteObject(key) { const { error } = await client().storage.from(bucket).remove([key]); if (error) throw new Error(error.message); }
  }
}
