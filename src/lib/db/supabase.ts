import { createClient } from "@supabase/supabase-js";
import { type DBAdapter, type FileRecord } from "@/lib/types";

const table = (process.env.SUPABASE_TABLE_PREFIX || 'app_') + 'files';
const schema = process.env.SUPABASE_DB_SCHEMA || 'public';

function client() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseAdapter(): DBAdapter {
  return {
    async init() {
      // Expect table exists; see README SQL.
    },
    async createFile(rec) {
      const row = { kind: rec.kind, title: rec.title, path: rec.path, url: rec.url, size: rec.size, mime: rec.mime, checksum: rec.checksum || null, meta: rec.meta || null, created_by: rec.createdBy || null };
      const { data, error } = await client().from(table).insert(row).select().single();
      if (error) throw new Error(error.message);
      return { id: data.id, kind: data.kind, title: data.title, path: data.path, url: data.url, size: Number(data.size||0), mime: data.mime, checksum: data.checksum || undefined, meta: data.meta || undefined, createdAt: data.created_at, createdBy: data.created_by } as FileRecord;
    },
    async listFiles(kind, limit = 100) {
      let q = client().from(table).select("*").order("created_at", { ascending: false }).limit(limit);
      if (kind) q = q.eq('kind', kind);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data||[]).map((d:any)=>({ id:d.id, kind:d.kind, title:d.title, path:d.path, url:d.url, size:Number(d.size||0), mime:d.mime, checksum:d.checksum||undefined, meta:d.meta||undefined, createdAt:d.created_at, createdBy:d.created_by }));
    },
    async deleteFile(id) { const { error } = await client().from(table).delete().eq('id', id); if (error) throw new Error(error.message); }
  }
}
