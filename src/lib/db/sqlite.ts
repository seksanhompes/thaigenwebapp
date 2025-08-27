import { type DBAdapter, type FileRecord } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type Row = {
  id: string;
  kind: string;
  title: string;
  path: string;
  url: string;
  size: number;
  mime: string;
  checksum?: string | null;
  meta?: any;
  created_at: string;
  created_by?: string | null;
};

function dbFile() {
  const dir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return path.join(dir, "app.db.json");
}
function load(): Row[] { const f = dbFile(); if (!fs.existsSync(f)) return []; return JSON.parse(fs.readFileSync(f, "utf-8") || "[]"); }
function save(rows: Row[]) { fs.writeFileSync(dbFile(), JSON.stringify(rows, null, 2)); }

export function sqliteAdapter(): DBAdapter {
  return {
    async init() { if (!fs.existsSync(dbFile())) save([]); },
    async createFile(rec) {
      const rows = load();
      const id = crypto.randomUUID();
      const row: Row = {
        id, kind: rec.kind, title: rec.title, path: rec.path, url: rec.url,
        size: rec.size, mime: rec.mime, checksum: rec.checksum || null,
        meta: rec.meta || null, created_at: new Date().toISOString(), created_by: rec.createdBy || null
      };
      rows.unshift(row); save(rows);
      const out: FileRecord = { id, kind: row.kind as any, title: row.title, path: row.path, url: row.url, size: row.size, mime: row.mime, checksum: row.checksum || undefined, meta: row.meta || undefined, createdAt: row.created_at, createdBy: row.created_by || undefined };
      return out;
    },
    async listFiles(kind, limit = 100) {
      const rows = load();
      const filtered = kind ? rows.filter(r => r.kind === kind) : rows;
      return filtered.slice(0, limit).map(r => ({
        id: r.id, kind: r.kind as any, title: r.title, path: r.path, url: r.url,
        size: r.size, mime: r.mime, checksum: r.checksum || undefined, meta: r.meta || undefined, createdAt: r.created_at, createdBy: r.created_by || undefined
      }));
    },
    async deleteFile(id) { const rows = load(); save(rows.filter(r => r.id !== id)); }
  }
}
