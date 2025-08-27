import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const runtime = "nodejs";
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDB();
  await db.deleteFile(params.id);
  return NextResponse.json({ ok: true });
}
