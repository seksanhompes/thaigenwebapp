// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

// ✔ ใช้ Node.js runtime (เพราะมี Buffer/crypto)
export const runtime = "nodejs";

// ช่วยอ่าน ENV แบบปลอดภัย
function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const SUPABASE_URL = must("SUPABASE_URL");
const SERVICE_ROLE = must("SUPABASE_SERVICE_ROLE_KEY");
const BUCKET = must("SUPABASE_STORAGE_BUCKET"); // "uploads"
const DB_SCHEMA = process.env.SUPABASE_DB_SCHEMA ?? "public";
const TABLE_PREFIX = process.env.SUPABASE_TABLE_PREFIX ?? "app_";
const TABLE = `${DB_SCHEMA}.${TABLE_PREFIX}files`; // => public.app_files

// admin client (server-only)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const kind = String(form.get("kind") || "text"); // 'text' | 'image' | 'video'
    const title = String(form.get("title") || "").trim();
    const caption = String(form.get("caption") || "");
    const mood = String(form.get("mood") || "neutral");
    const text = String(form.get("text") || "");

    if (!title) return NextResponse.json({ ok: false, error: "กรอกชื่อเรื่อง" }, { status: 400 });

    // โพสต์ข้อความอย่างเดียว
    if (kind === "text") {
      const path = `texts/${Date.now()}-${crypto.randomUUID()}.txt`;
      // เก็บเป็นไฟล์ข้อความลง storage ด้วย (กันหาย/แชร์ได้)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, new Blob([text], { type: "text/plain;charset=utf-8" }), {
          upsert: true,
        });
      if (upErr) throw upErr;

      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

      // บันทึกลง DB
      const { error: insErr } = await supabase.from(TABLE).insert({
        kind: "text",
        title,
        path,
        url: publicUrl,
        size: text.length,
        mime: "text/plain",
        checksum: crypto.createHash("sha1").update(text).digest("hex"),
        meta: { caption, mood },
        created_by: "anonymous",
      });
      if (insErr) throw insErr;

      return NextResponse.json({ ok: true });
    }

    // image / video ต้องมี file
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "กรุณาเลือกไฟล์" }, { status: 400 });
    }

    const ext = (() => {
      const m = file.name.match(/\.([A-Za-z0-9]+)$/);
      return (m?.[1] || "").toLowerCase();
    })();

    const safeKind = kind === "image" || kind === "video" ? kind : "image";
    const prefix = safeKind === "image" ? "images" : "videos";
    const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;

    // อัปโหลดไป Supabase Storage
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(key, file, {
      cacheControl: "31536000",
      upsert: true,
      contentType: file.type || (safeKind === "image" ? "image/*" : "video/*"),
    });
    if (uploadErr) throw uploadErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const publicUrl = pub.publicUrl;

    // อ่าน buffer เพื่อทำ checksum + size
    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(new Uint8Array(arrayBuf));
    const checksum = crypto.createHash("sha1").update(buf).digest("hex");

    // บันทึกลง DB
    const { error: insertErr } = await supabase.from(TABLE).insert({
      kind: safeKind,
      title,
      path: key,
      url: publicUrl,
      size: buf.byteLength,
      mime: file.type,
      checksum,
      meta: { caption, mood, originalName: file.name },
      created_by: "anonymous",
    });
    if (insertErr) throw insertErr;

    return NextResponse.json({ ok: true, url: publicUrl, path: key });
  } catch (err: any) {
    console.error("[/api/upload] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
