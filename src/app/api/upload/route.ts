import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { getDB } from "@/lib/db";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const kind = (form.get("kind") as string) || "text";
  const title = (form.get("title") as string) || "";
  const mood = (form.get("mood") as string) || "neutral";
  const caption = (form.get("caption") as string) || "";
  const file = form.get("file") as File | null;
  const text = form.get("text") as string | null;

  if (!title) return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });

  const storage = await getStorage();
  const db = await getDB();

  let key = "";
  let url = "";
  let size = 0;
  let mime = "text/plain";

  if (kind === "text") {
    const body = text ?? "";
    if (!body) return NextResponse.json({ ok: false, error: "text content required" }, { status: 400 });
    key = `texts/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
    const saved = await storage.saveText(key, body, "text/plain; charset=utf-8");
    url = saved.url;
    size = new Blob([body]).size;
  } else {
    if (!file) return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    const array = await file.arrayBuffer();
    size = array.byteLength;
    mime = file.type || (kind === "image" ? "image/*" : "video/*");
    const ext = (file.name.split(".").pop() || (kind === "image" ? "png" : "mp4")).toLowerCase();
    key = `${kind}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const saved = await storage.saveObject(key, new Uint8Array(array), mime);
    url = saved.url;
  }

  const checksum = crypto.createHash("md5").update(key + ":" + size).digest("hex");
  const rec = await db.createFile({
    kind: kind as any,
    title,
    path: key,
    url,
    size,
    mime,
    checksum,
    meta: { mood, caption },
    createdBy: null
  });

  return NextResponse.json({ ok: true, file: rec });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") as any;
  const db = await getDB();
  const list = await db.listFiles(kind || undefined, 100);
  return NextResponse.json({ ok: true, files: list });
}
