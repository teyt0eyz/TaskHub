-- TaskHub database schema (Supabase / PostgreSQL)
-- รันไฟล์นี้ใน Supabase: Dashboard → SQL Editor → New query → วางทั้งหมด → Run
-- ปลอดภัยต่อการรันซ้ำ (ใช้ if not exists / on conflict do nothing)

create extension if not exists "pgcrypto";

-- 1. users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  role text check (role in ('leader', 'member')) default 'member',
  created_at timestamptz default now()
);

-- 2. projects (1 คนมีได้หลายโปรเจกต์)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text default '#2E9E5B',
  owner_id uuid references users(id),
  created_at timestamptz default now()
);

-- ความเป็นสมาชิกในโปรเจกต์ + บทบาทเฉพาะโปรเจกต์ (คนเดียวเป็น leader บางโปรเจกต์ / member บางโปรเจกต์)
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('leader', 'member')) not null default 'member',
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- 3. tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  deadline date,
  assigned_to uuid references users(id),
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- 4. check_ins (mood รายวัน + blocker)
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  project_id uuid references projects(id) on delete cascade,
  date date default current_date,
  done_today text,
  blockers text,
  plan_tomorrow text,
  mood text check (mood in ('great', 'good', 'okay', 'stressed', 'blocked')),
  created_at timestamptz default now(),
  unique (user_id, project_id, date)
);

-- 5. comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references users(id),
  body text not null,
  created_at timestamptz default now()
);

-- 6. tags + junction
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#6366f1'
);

create table if not exists task_tags (
  task_id uuid references tasks(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

-- 7. invites (ลิงก์เชิญเข้าโปรเจกต์)
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  token text unique not null,
  role text check (role in ('leader', 'member')) not null default 'member',
  created_by uuid references users(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 8. attachments (ไฟล์/รูปแนบบน task — เก็บไฟล์จริงใน Supabase Storage bucket "attachments")
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text,
  uploaded_by uuid references users(id),
  created_at timestamptz default now()
);

-- ตีกลับงานให้แก้ไข (leader ตีกลับงานที่ done กลับไปให้ member)
alter table tasks add column if not exists needs_revision boolean default false;

-- หัวหน้ายืนยันงานผ่าน → เก็บเวลาที่อนุมัติ (null = ยังไม่ผ่าน/ยังอยู่ในกิ่ง)
-- "ประวัติงานเสร็จ" = แค่กรอง approved_at is not null จาก row เดิม (ไม่ต้องมีตารางแยก)
alter table tasks add column if not exists approved_at timestamptz;
create index if not exists idx_tasks_approved on tasks(project_id, approved_at);

-- โหมดการมองเห็นของสมาชิก: 'own' = เห็นเฉพาะงานตัวเอง, 'all' = เห็นกิ่งทุกคน (งานคนอื่นจางลง)
alter table projects add column if not exists member_visibility text default 'own';

-- โหมดการเข้าร่วม: false = หัวหน้าต้องอนุมัติก่อน, true = เข้าได้เลยไม่ต้องอนุมัติ
alter table projects add column if not exists auto_approve boolean default false;

-- รองหัวหน้า (deputy) + สิทธิ์ที่หัวหน้ามอบให้ (review / manage_tasks / manage_members / settings)
alter table project_members drop constraint if exists project_members_role_check;
alter table project_members add constraint project_members_role_check check (role in ('leader', 'member', 'deputy'));
alter table project_members add column if not exists permissions text[] default '{}';

-- ชื่อบทบาทที่ตั้งเอง (แสดงผล) เช่น อาจารย์ / TA / นักศึกษา / พี่เลี้ยง — แยกจากระดับสิทธิ์
alter table project_members add column if not exists title text;

-- โควตา AI summary (เดิมนับต่อ user — เลิกใช้แล้ว แต่คงคอลัมน์ไว้)
alter table users add column if not exists ai_summary_count int default 0;
alter table users add column if not exists ai_summary_reset_at timestamptz;

-- โควตา AI summary แบบใหม่: นับต่อ "โปรเจกต์" (4 ครั้ง/เดือน แชร์กันระหว่างหัวหน้า+รองหัวหน้า) reset ต้นเดือนในโค้ด
alter table projects add column if not exists ai_summary_count int default 0;
alter table projects add column if not exists ai_summary_reset_at timestamptz;

-- 9. join_requests (คำขอเข้าร่วม — หัวหน้าต้องอนุมัติก่อนถึงเป็นสมาชิก)
create table if not exists join_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text check (role in ('leader', 'member')) not null default 'member',
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

-- 10. task_assignees (มอบหมายงานได้หลายคน — junction)
create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (task_id, user_id)
);

-- 11. notifications (แจ้งเตือนเจาะจงรายคน)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  type text,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- unique ชื่อ tag (กันซ้ำเวลา upsert)
create unique index if not exists uq_tags_name on tags(name);

-- เปิด Supabase Realtime สำหรับตารางที่ต้องอัปเดตสด (idempotent — รันซ้ำได้)
do $$
begin
  begin alter publication supabase_realtime add table tasks; exception when others then null; end;
  begin alter publication supabase_realtime add table task_assignees; exception when others then null; end;
  begin alter publication supabase_realtime add table comments; exception when others then null; end;
  begin alter publication supabase_realtime add table check_ins; exception when others then null; end;
  begin alter publication supabase_realtime add table join_requests; exception when others then null; end;
  begin alter publication supabase_realtime add table notifications; exception when others then null; end;
end $$;

-- index ที่ใช้บ่อย
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assignee on tasks(assigned_to);
create index if not exists idx_checkins_user_date on check_ins(user_id, date);
create index if not exists idx_comments_task on comments(task_id);
create index if not exists idx_attachments_task on attachments(task_id);
