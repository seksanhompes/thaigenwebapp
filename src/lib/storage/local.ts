import { type StorageAdapter } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";

function baseDir() {
  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function localStorageAdapter(): StorageAdapter {
  return {
    async saveObject(key, data, contentType) {
      const full = path.join(baseDir(), key);
      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await fs.promises.writeFile(full, Buffer.from(data));
      return { key, url: `/uploads/${key}` };
    },
    async saveText(key, text, contentType="text/plain; charset=utf-8") {
      const full = path.join(baseDir(), key);
      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await fs.promises.writeFile(full, text, "utf-8");
      return { key, url: `/uploads/${key}` };
    },
    publicUrl(key) { return `/uploads/${key}`; },
    async deleteObject(key) {
      const full = path.join(baseDir(), key);
      if (fs.existsSync(full)) await fs.promises.rm(full, { force: true });
    }
  }
}
