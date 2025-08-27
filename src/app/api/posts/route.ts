import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mood = url.searchParams.get("mood");
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const db = await getDB();
  const kinds: Array<'text'|'image'|'video'> = ['text','image','video'];
  const lists = await Promise.all(kinds.map(k=>db.listFiles(k, 200)));
  let items = lists.flat().sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  if (mood) items = items.filter(it => (it.meta?.mood || 'neutral') === mood);
  if (q) items = items.filter(it => (it.title + " " + (it.meta?.caption||"")).toLowerCase().includes(q));
  return NextResponse.json({ ok: true, items });
}
