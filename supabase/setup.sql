-- ════════════════════════════════════════════════════════════════
--  الشاهين (Al-Shaheen) — full project setup for a fresh Supabase project.
--  Run ONCE in the new project's SQL Editor. Schema + current seed data.
--  (Canonical schema; mirrors what was applied to the dev project.)
-- ════════════════════════════════════════════════════════════════

-- ── shared helper: keep updated_at fresh ──
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── admins: identity allowlist that gates all writes ──
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

alter table public.admins enable row level security;
drop policy if exists "admins can read admins" on public.admins;
create policy "admins can read admins" on public.admins for select to authenticated using (public.is_admin());

-- ════════════════════════════════════════════════════════════════
--  Content tables
-- ════════════════════════════════════════════════════════════════
create table if not exists public.brand_config (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'الشاهين',
  tagline text, logo_url text,
  primary_color text default '#0C2340', accent_color text default '#C8932A',
  tone text, banned_words text[] not null default '{}', settings jsonb not null default '{}',
  singleton boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint brand_config_singleton unique (singleton),
  constraint brand_config_singleton_true check (singleton = true)
);

create table if not exists public.app_settings (
  key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name_ar text not null, description text,
  sort_order int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null, type text not null, url text, config jsonb not null default '{}',
  trust_score int not null default 50, fetch_interval_minutes int not null default 60,
  active boolean not null default true, last_fetched_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources on delete set null,
  url text, url_hash text unique, title text, content text, raw jsonb not null default '{}',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.processed_items (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid references public.raw_items on delete cascade,
  category_id uuid references public.categories on delete set null,
  audience text[] not null default '{}', summary text,
  importance int, novelty int, risk int, source_trust int,
  selected boolean not null default false, rejected_reason text, analysis jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  type text not null, title text not null, description text, content text,
  category_id uuid references public.categories on delete set null,
  tags text[] not null default '{}', file_url text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  advertiser text, title text, content text, link text, image_url text,
  label text not null default 'إعلان', active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.draft_issues (
  id uuid primary key default gen_random_uuid(),
  issue_date date, type text not null default 'daily', title text, intro text, main_topic text,
  body jsonb not null default '{}',
  gift_id uuid references public.gifts on delete set null,
  ad_id uuid references public.ads on delete set null,
  cover_image_url text, status text not null default 'draft',
  channel_variants jsonb not null default '{}', meta jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.published_issues (
  id uuid primary key default gen_random_uuid(),
  draft_issue_id uuid references public.draft_issues on delete set null,
  issue_date date, type text not null default 'daily', title text, slug text unique,
  body jsonb not null default '{}', cover_image_url text, published_at timestamptz not null default now(),
  channel_results jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.gifts_used (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references public.gifts on delete cascade,
  issue_id uuid references public.published_issues on delete set null,
  used_on date not null default current_date, created_at timestamptz not null default now()
);

create table if not exists public.gifts_scheduled (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references public.gifts on delete cascade,
  scheduled_date date not null unique, note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.ads_calendar (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references public.ads on delete cascade,
  scheduled_date date not null, placement text not null default 'newsletter',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.ai_models_config (
  id uuid primary key default gen_random_uuid(),
  task text not null unique, model text not null, temperature numeric not null default 0.7,
  max_tokens int, params jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.publishing_channels (
  id uuid primary key default gen_random_uuid(),
  channel text not null unique, enabled boolean not null default false, config jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique, name text, status text not null default 'active', source text,
  confirmed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.feedback_ratings (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.published_issues on delete cascade,
  news_ref text, rating text not null, ip_hash text, created_at timestamptz not null default now()
);

create table if not exists public.errors_log (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'error', source text, message text, detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'daily', status text not null default 'running',
  run_date date not null default current_date, state jsonb not null default '{}', error text,
  started_at timestamptz not null default now(), finished_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ── updated_at triggers ──
do $$
declare t text;
begin
  foreach t in array array['brand_config','app_settings','categories','sources','raw_items',
    'processed_items','gifts','ads','draft_issues','published_issues','gifts_scheduled',
    'ads_calendar','ai_models_config','publishing_channels','subscribers','pipeline_runs']
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I;', t);
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$I
      for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ── RLS: enable + admin-all on every table ──
do $$
declare t text;
begin
  foreach t in array array['brand_config','app_settings','categories','sources','raw_items',
    'processed_items','gifts','ads','draft_issues','published_issues','gifts_used','gifts_scheduled',
    'ads_calendar','ai_models_config','publishing_channels','subscribers','feedback_ratings',
    'errors_log','pipeline_runs']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "admin all" on public.%I;', t);
    execute format('create policy "admin all" on public.%I for all to authenticated
      using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- ── public read (blog) + public insert (reader actions) ──
drop policy if exists "public read" on public.brand_config;
create policy "public read" on public.brand_config for select to anon, authenticated using (true);
drop policy if exists "public read" on public.categories;
create policy "public read" on public.categories for select to anon, authenticated using (active = true);
drop policy if exists "public read" on public.published_issues;
create policy "public read" on public.published_issues for select to anon, authenticated using (true);
drop policy if exists "public subscribe" on public.subscribers;
create policy "public subscribe" on public.subscribers for insert to anon, authenticated
  with check (position('@' in email) > 1 and char_length(email) <= 254);
drop policy if exists "public rate" on public.feedback_ratings;
create policy "public rate" on public.feedback_ratings for insert to anon, authenticated
  with check (rating in ('up','down'));

-- ════════════════════════════════════════════════════════════════
--  Seed — current الشاهين configuration
-- ════════════════════════════════════════════════════════════════
insert into public.admins (email, name) values ('junkpro518@gmail.com', 'Owner')
on conflict (email) do nothing;

insert into public.brand_config (name, tagline, primary_color, accent_color, tone, settings)
values (
  'الشاهين',
  'الذكاء الاصطناعي بعين الشاهين',
  '#0C2340', '#C8932A',
  'واثق، مختصر، عملي — بخفّة ذكية بلا سخافة وبلا رسمية ميتة. عربي واضح يربط كل خبر بفرصة عملية لرائد الأعمال الخليجي. التحليل يُقدَّم تحت عنوان «بعين الشاهين». الافتتاحية تبدأ بنحو «الشاهين يرصد لك اليوم…».',
  '{"story":"الشاهين أسرع صقر وأحدّه بصراً — يرصد المشهد من علٍ ويلتقط الفرصة قبل غيره. هذا ما يمنحه الذكاء الاصطناعي لأعمالك: بصيرة مبكرة وسرعة ونظرة شاملة.","domain":"alshaheenai.com","emails":{"admin":"alshaheendaily@gmail.com","newsletter":"news@alshaheenai.com"},"handle":"@AlShaheenAi","mascot":"صقر (الشاهين) — واثق، حاد النظرة، مهيب لكن قريب. مستشار ذكي لا مهرّج.","palette":{"gold":"#C8932A","navy":"#0C2340","sand":"#EFE9DA","tech_blue":"#1E6FB8"},"sections":{"gift":{"icon":"🎁","name":"غنيمة اليوم"},"main":{"icon":"⚡️","name":"الانقضاضة"},"tldr":{"icon":"👁️","name":"نظرة الشاهين"},"tools":{"icon":"🛠️","name":"عُدّة الشاهين"},"roundup":{"icon":"🪶","name":"رفّة جناح"}},"descriptor":"نشرة الذكاء الاصطناعي لروّاد الأعمال","voice_examples":{"social":"الشاهين شاف شي اليوم… 🦅","opening":"الشاهين يرصد لك اليوم…","analysis_label":"بعين الشاهين"}}'::jsonb
)
on conflict (singleton) do nothing;

insert into public.app_settings (key, value) values
  ('review_mode', '"manual"'), ('publish_time', '"03:00"'),
  ('prepare_by_time', '"00:30"'), ('timezone', '"Asia/Riyadh"')
on conflict (key) do nothing;

insert into public.categories (slug, name_ar, sort_order) values
  ('ai','الذكاء الاصطناعي',1), ('business','الأعمال',2), ('ecommerce','التجارة الإلكترونية',3),
  ('automation','الأتمتة',4), ('tech','التقنية',5), ('marketing','التسويق',6), ('productivity','الإنتاجية',7)
on conflict (slug) do nothing;

insert into public.sources (name, type, url, trust_score, fetch_interval_minutes, active, config) values
  ('OpenAI Blog','rss','https://openai.com/blog/rss.xml',92,60,true,'{"lang":"en"}'),
  ('Google — The Keyword (AI)','rss','https://blog.google/technology/ai/rss/',88,60,true,'{"lang":"en"}'),
  ('TechCrunch — AI','rss','https://techcrunch.com/category/artificial-intelligence/feed/',78,60,true,'{"lang":"en"}'),
  ('VentureBeat — AI','rss','https://venturebeat.com/category/ai/feed/',74,60,true,'{"lang":"en"}'),
  ('Ars Technica','rss','https://feeds.arstechnica.com/arstechnica/index',76,90,true,'{"lang":"en"}'),
  ('MIT Tech Review — AI','rss','https://www.technologyreview.com/topic/artificial-intelligence/feed',82,120,true,'{"lang":"en"}'),
  ('Hacker News — Front','rss','https://hnrss.org/frontpage?points=150',62,60,true,'{"lang":"en"}'),
  ('Product Hunt','rss','https://www.producthunt.com/feed',70,120,true,'{"kind":"products","lang":"en"}'),
  ('The Verge','rss','https://www.theverge.com/rss/index.xml',72,90,true,'{"lang":"en"}'),
  ('a16z','rss','https://a16z.com/feed/',80,180,false,'{"lang":"en"}');

insert into public.ai_models_config (task, model, temperature, max_tokens) values
  ('classify','google/gemini-2.5-flash',0.2,4096), ('score','google/gemini-2.5-flash',0.2,4096),
  ('select','google/gemini-2.5-flash',0.3,1024), ('verify','google/gemini-2.5-flash',0.1,1024),
  ('write','anthropic/claude-sonnet-4',0.7,4096), ('headline','anthropic/claude-sonnet-4',0.7,1500),
  ('tone','google/gemini-2.5-flash',0.3,2048), ('image_prompt','google/gemini-2.5-flash',0.6,600),
  ('rate','google/gemini-2.5-flash',0.2,1024)
on conflict (task) do nothing;
