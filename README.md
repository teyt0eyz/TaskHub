# TaskHub 🌳

ระบบติดตามงานและ mood ของทีม สำหรับหัวหน้ากับลูกทีมทุกรูปแบบ (บริษัท / กลุ่มเรียน / โปรเจกต์เพื่อน)
Leader มอบหมายงานและติดตามความคืบหน้าของ Member ในที่เดียว พร้อม workspace แบบผังต้นไม้, mood check-in รายวัน, streak, และสรุปงานด้วย AI

> Capstone Project — Presentation 5 กรกฎาคม

---

## ✨ ฟีเจอร์หลัก

- **เข้าสู่ระบบด้วย Google** (NextAuth + Google OAuth)
- **หลายโปรเจกต์ / สลับบทบาทได้** — คนเดียวเป็นได้ทั้ง Leader และ Member ต่างโปรเจกต์
- **Workspace ผังต้นไม้** — ซูม/แพนได้ กิ่งแยกตามสมาชิก งานเรียงตาม deadline
- **มอบหมายงานหลายคน** ต่อ 1 งาน (multi-assignee) + แท็ก + ความด่วน + กำหนดส่ง
- **สถานะงานควบคุมโดยผู้รับผิดชอบ** (Todo / In Progress / Done)
- **หัวหน้ายืนยัน / ตีกลับงาน** — Done → หัวหน้ากดยืนยันปิดงาน หรือ ตีกลับให้แก้ไข (พร้อม feedback)
- **ประวัติงานเสร็จ** แยกตามรายชื่อสมาชิก (ใช้ row เดิม ไม่มีตารางแยก)
- **ปฏิทินกำหนดส่ง** รายเดือน
- **Dashboard** — กราฟสัดส่วนสถานะงาน, mood ทีม, งานต่อสมาชิก
- **Mood check-in รายวัน + blocker flag + streak**
- **AI summary รายสัปดาห์** ด้วย Google Gemini (จำกัด 5 ครั้ง/เดือน/user)
- **เชิญเข้าทีมด้วยโค้ด 6 หลัก** + ระบบอนุมัติคำขอเข้าร่วม
- **แจ้งเตือน realtime** (มอบหมาย / ตีกลับ / ยืนยัน / คอมเมนต์ / งานเสร็จรอตรวจ) + badge บนเมนู
- **อัปเดตสดไม่ต้อง refresh** (Supabase Realtime + polling fallback)
- **แนบไฟล์/รูป** บนงาน (Supabase Storage)

---

## 🧱 Tech stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, JavaScript) |
| UI | Tailwind CSS v4 · React 19 |
| Auth | NextAuth v4 + Google OAuth |
| Database + Realtime + Storage | Supabase (PostgreSQL) |
| AI | Google Gemini (`gemini-2.0-flash`) |

---

## 🚀 เริ่มใช้งาน

> เพื่อนร่วมทีมที่แค่อยากรัน ดู [SETUP.md](./SETUP.md) (คู่มือฉบับย่อ)

1. ติดตั้ง dependencies
   ```bash
   npm install
   ```
2. ตั้งค่า environment — คัดลอก template แล้วเติมค่าจริง
   ```bash
   cp .env.example .env.local
   ```
3. สร้างตารางในฐานข้อมูล — เปิด Supabase → SQL Editor → วางทั้งหมดจาก [`supabase/schema.sql`](./supabase/schema.sql) → Run
   (ไฟล์นี้รันซ้ำได้ปลอดภัย — ทุกครั้งที่ schema เปลี่ยนให้รันใหม่)
4. รัน dev server (พอร์ต 3001)
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3001

---

## 🔑 Environment variables

| ตัวแปร | ใช้ทำอะไร | หาได้จาก |
|---|---|---|
| `NEXTAUTH_URL` | URL ของแอป (dev = `http://localhost:3001`) | — |
| `NEXTAUTH_SECRET` | เข้ารหัส session | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | Google Cloud Console → Credentials |
| `NEXT_PUBLIC_SUPABASE_URL` | endpoint Supabase | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client key (realtime) | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | server key (อ่าน/เขียน DB) — **ห้าม commit / เปิดเผย** | Supabase → API |
| `GEMINI_API_KEY` | เรียก Gemini | aistudio.google.com/apikey |

> Google OAuth redirect URI ต้องเป็น `<NEXTAUTH_URL>/api/auth/callback/google`
> ถ้า consent screen ยังเป็น Testing ต้องเพิ่มอีเมลผู้ใช้เป็น Test user

---

## 📜 Scripts

```bash
npm run dev     # dev server (พอร์ต 3001)
npm run build   # production build
npm run start   # รัน production (พอร์ต 3001)
npm run lint    # ESLint
```

---

## 🗂 โครงสร้างโดยย่อ

```
app/
  leader/[projectId]/   workspace · dashboard · tasks · calendar · history · members
  member/[projectId]/   งานของฉัน · calendar · history · checkin
  api/                  auth · tasks · projects · checkins · comments · attachments
                        invites · requests · members · notifications · ai/summary
components/             AppShell · WorkspaceCanvas · TaskDetail · CalendarView ...
lib/                    data.js (data layer) · supabase.js · auth.js · gemini.js · notify.js
supabase/schema.sql     สคีมาฐานข้อมูล (รันใน Supabase)
```

---

## ☁️ Deploy (Vercel)

1. Push โปรเจกต์ขึ้น GitHub แล้ว Import ใน Vercel
2. ใส่ environment variables ทั้งหมดใน Vercel (ตั้ง `NEXTAUTH_URL` เป็นโดเมนจริง เช่น `https://taskhub.vercel.app`)
3. เพิ่ม redirect URI `<โดเมน>/api/auth/callback/google` ใน Google OAuth
4. Deploy

---

## 🔐 หมายเหตุด้านความปลอดภัย

- สิทธิ์การเข้าถึงข้อมูลถูกบังคับที่ชั้นแอป (server เท่านั้นที่ใช้ service role) — production ที่จริงจังควรเปิด Supabase RLS เพิ่ม
- `.env.local` มีความลับ (service role key, secrets) — อยู่ใน `.gitignore` แล้ว **ห้าม commit หรือแชร์สาธารณะ**
