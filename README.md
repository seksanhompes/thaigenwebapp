# Thaigen Webapp (Next.js 14 + TypeScript)

รีแฟคเตอร์จากไฟล์ HTML เดียวให้เป็นเว็บแอพโครงสร้างชัดเจน พร้อม **API**, **DB adapters** และ **Storage adapters**.
- อัปโหลดโพสต์ได้ 3 แบบ: **ข้อความ / รูปภาพ / วิดีโอ**
- แนบ **mood** และ **caption** เก็บใน `meta`
- ดึงฟีดด้วย `/api/posts` (รวมทุกชนิดไฟล์)
- ค้นหาด้วยพารามิเตอร์ `?q=...` และกรอง `?mood=...`

## เริ่มต้น
```bash
npm i
cp .env.example .env
# เริ่มง่าย: DB_PROVIDER=sqlite, STORAGE_PROVIDER=local
npm run dev
```

เปิด http://localhost:3000

## ใช้ Supabase (โปรดักชั่น)
ตั้งค่าแปรแวดล้อมทั้งหมด และสร้างตาราง:
```sql
create extension if not exists pgcrypto;
create table if not exists public.app_files(
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('text','image','video')),
  title text not null,
  path text not null,
  url text not null,
  size bigint not null default 0,
  mime text not null,
  checksum text,
  meta jsonb,
  created_at timestamptz not null default now(),
  created_by text
);
```

## โครงสร้างโค้ด
- `src/app/api/*` — API อัปโหลด/ลิสต์/รวมโพสต์
- `src/lib/db/*` — DB adapters (sqlite JSON, supabase)
- `src/lib/storage/*` — Storage adapters (local, supabase storage)
- `src/app/page.tsx` — UI หลัก (Mood picker, Feed, Search, Notifications, Profile, Settings)

> ต้องการแยกคอมโพเนนต์ย่อยเพิ่มเติม (Topbar, BottomNav, PostCard ฯลฯ) สามารถย้ายจาก `page.tsx` ออกเป็นไฟล์ใน `src/components/*` ได้ทันที
