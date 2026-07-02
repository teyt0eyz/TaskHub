<!-- BEGIN:nextjs-agent-rules -->
# TaskHub — CLAUDE.md

ระบบติดตามงานและ mood สำหรับทีมทุกประเภท
Capstone Project · Presentation วันอาทิตย์ที่ 5 กค.

---

## Project overview

TaskHub เป็น web app สำหรับการบริหารงานในทีม ไม่ว่าจะเป็นหัวหน้ากับพนักงาน, อาจารย์กับนักศึกษา, หรือหัวหน้ากลุ่มกับเพื่อนร่วมทีม โดย Leader มอบหมายงานและติดตาม progress ของ Member ในที่เดียว มีฟีเจอร์ mood check-in รายวัน, blocker flag, streak badge, และ AI summary รายเดือน (จำกัด 4 ครั้ง/เดือน/user)

---

## Tech stack

- **Framework:** Next.js 14 App Router (JavaScript — ไม่ใช้ TypeScript)
- **Styling:** Tailwind CSS
- **Database + Realtime:** Supabase
- **Authentication:** NextAuth.js v5 + Google OAuth
- **AI:** Google Gemini API (`gemini-2.5-flash`) ผ่าน `@google/generative-ai` — ฟรี 1,500 req/วัน
- **Font:** Prompt (heading) + Noto Sans Thai (body) จาก `next/font/google`
- **Deploy:** Vercel

---

## AI Summary — rate limit

- แต่ละ user กด "สรุปงาน AI" ได้ **5 ครั้งต่อเดือน** เท่านั้น
- นับจาก column `ai_summary_count` และ `ai_summary_reset_at` ใน table `users`
- ทุกต้นเดือนระบบ reset นับใหม่อัตโนมัติ
- ถ้าครบ 5 ครั้งแล้วให้แสดง UI บอกว่า "ใช้ครบโควต้าเดือนนี้แล้ว รีเซ็ตวันที่ 1 เดือนหน้า"

---

## Project structure

```
taskhub/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.jsx
│   │   └── onboarding/
│   │       └── page.jsx
│   ├── (workspace)/
│   │   ├── layout.jsx
│   │   ├── leader/
│   │   │   ├── page.jsx
│   │   │   ├── tasks/
│   │   │   │   └── page.jsx
│   │   │   └── members/
│   │   │       └── [id]/
│   │   │           └── page.jsx
│   │   └── member/
│   │       ├── page.jsx
│   │       └── checkin/
│   │           └── page.jsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.js
│   │   ├── tasks/
│   │   │   ├── route.js
│   │   │   └── [id]/
│   │   │       └── route.js
│   │   ├── checkins/
│   │   │   └── route.js
│   │   ├── comments/
│   │   │   └── route.js
│   │   └── ai/
│   │       └── summary/
│   │           └── route.js      # POST — Gemini API + rate limit check
│   └── layout.jsx
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── Avatar.jsx
│   │   ├── Card.jsx
│   │   └── MoodPill.jsx
│   ├── leader/
│   │   ├── MemberCard.jsx
│   │   ├── TeamOverview.jsx
│   │   └── AISummaryPanel.jsx    # แสดง quota เหลือ + ปุ่ม generate
│   └── member/
│       ├── WorkspaceCanvas.jsx
│       ├── TaskNode.jsx
│       ├── LeaderNode.jsx
│       └── CheckinForm.jsx
├── lib/
│   ├── supabase/
│   │   ├── client.js
│   │   └── server.js
│   ├── auth.js
│   ├── gemini.js                 # Gemini API helper + rate limit logic
│   └── utils.js
├── hooks/
│   ├── useTasks.js
│   ├── useCheckin.js
│   └── useDrag.js
├── middleware.js
└── .env.local
```

---

## Role & auth rules

- Login ด้วย Google OAuth เท่านั้น
- หลัง login ครั้งแรก จะเข้าหน้า workspace
- สลับ role ได้ บางคนเป็นหัวหน้าบางงาน บางงานอาจจะเป็นลูกทีมก็ได้
- Middleware ทำหน้าที่ redirect ถ้า role ไม่ตรง

---

## Coding conventions

- JavaScript ล้วน ไม่ใช้ TypeScript ไม่มี `.ts` หรือ `.tsx` ในโปรเจกต์นี้
- Supabase query ทำใน server component หรือ API route เท่านั้น
- ทุก API route เช็ค session ก่อนเสมอ
- component ชื่อ PascalCase, function และ variable ชื่อ camelCase
- UI ใช้ Tailwind เท่านั้น ห้ามใช้ inline style
- สีหลัก: เขียว `#2E9E5B`, ส้ม `#FF6B2B`, ขาว `#FFFFFF`
- ใช้ `cn()` จาก `lib/utils.js` สำหรับ conditional classnames

---

## Capstone requirements checklist

- [ ] Google OAuth login
- [ ] Database 5+ tables (users, tasks, check_ins, comments, tags)
- [ ] Deploy บน Vercel
- [ ] AI summary — Gemini API (4 ครั้ง/เดือน/user)
- [ ] Mood check-in + blocker flag
- [ ] Streak badge system
- [ ] Workspace canvas + tree diagram
<!-- END:nextjs-agent-rules -->
