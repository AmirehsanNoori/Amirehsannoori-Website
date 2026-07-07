-- =============================================================================
-- AEN chatbot — RAG "one brain, many channels" schema
-- Apply once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Idempotent (safe to re-run). Depends on 0001_init.sql (extends public.leads).
--
-- Access model: every table here is LOCKED by RLS with no anon/authenticated
-- policies. ALL reads/writes go through server code using the service-role
-- client (src/lib/supabase/admin.ts), which bypasses RLS. The admin panel
-- gates on membership in public.admin_users, checked server-side.
--
-- Embedding dimension is FIXED to 1024 (Cohere embed-multilingual-v3.0).
-- Switching to a provider with a different dimension requires a migration
-- that recreates chunks.embedding and a full re-embed of the knowledge base.
-- =============================================================================

-- pgvector for similarity search
create extension if not exists vector;

-- reuse the updated_at helper from 0001 (create if this file runs standalone)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Knowledge base
-- =============================================================================
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source_type text not null default 'text'
                check (source_type in ('pdf','word','text','url')),
  source_url  text,
  raw_text    text,                          -- extracted plain text (re-index without re-upload)
  status      text not null default 'pending'
                check (status in ('pending','processing','ready','error')),
  error       text,
  tags        text[] not null default '{}',
  char_count  int,
  chunk_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  content     text not null,
  embedding   vector(1024),
  token_count int,
  chunk_index int not null default 0,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists chunks_document_id_idx on public.chunks (document_id);
-- cosine HNSW index for fast approximate nearest-neighbour search
create index if not exists chunks_embedding_idx
  on public.chunks using hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- Unified users (one identity across channels)
-- =============================================================================
create table if not exists public.unified_users (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null check (channel in ('web','widget','telegram')),
  external_id text not null,                 -- telegram chat_id, or web session id
  name        text,
  metadata    jsonb not null default '{}',
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  unique (channel, external_id)
);

-- =============================================================================
-- Conversations & messages
-- =============================================================================
create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  channel          text not null check (channel in ('web','widget','telegram')),
  unified_user_id  uuid references public.unified_users (id) on delete set null,
  external_user_id text,                       -- raw channel id, for quick lookup
  status           text not null default 'active'
                     check (status in ('active','needs_human','human','closed')),
  summary          text,                        -- rolling summary for long chats
  locale           text not null default 'fa',
  started_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists conversations_channel_idx on public.conversations (channel);
create index if not exists conversations_status_idx  on public.conversations (status);

create table if not exists public.messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.conversations (id) on delete cascade,
  role                text not null check (role in ('user','assistant','system','tool')),
  content             text not null,
  model_used          text,
  tokens_in           int,
  tokens_out          int,
  retrieved_chunk_ids uuid[] not null default '{}',
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now()
);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

-- =============================================================================
-- Feedback (👍/👎 per assistant message)
-- =============================================================================
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages (id) on delete cascade,
  rating     smallint not null check (rating in (-1, 1)),
  comment    text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Persona / system prompt (versioned, from DB not hardcoded)
-- =============================================================================
create table if not exists public.prompt_versions (
  id         uuid primary key default gen_random_uuid(),
  content    text not null,                 -- the system prompt
  persona    text,                          -- short persona label/notes
  is_active  boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);
-- at most one active prompt
create unique index if not exists prompt_versions_one_active
  on public.prompt_versions (is_active) where is_active;

-- =============================================================================
-- Model config (per channel; generation via OpenRouter slugs)
-- =============================================================================
create table if not exists public.model_config (
  id                uuid primary key default gen_random_uuid(),
  channel           text not null unique
                      check (channel in ('default','web','widget','telegram')),
  provider          text not null default 'openrouter',
  active_model      text not null default 'anthropic/claude-haiku-4.5',
  temperature       numeric(3,2) not null default 0.30,
  max_tokens        int not null default 1024,
  top_p             numeric(3,2) not null default 1.00,
  fallback_provider text,
  fallback_model    text,
  schedule          jsonb,                   -- optional day/time → model overrides
  monthly_budget_usd numeric(10,2),
  updated_at        timestamptz not null default now()
);

-- =============================================================================
-- Embedding + retrieval config (single active row)
-- =============================================================================
create table if not exists public.embedding_config (
  id                   uuid primary key default gen_random_uuid(),
  provider             text not null default 'cohere',
  model                text not null default 'embed-multilingual-v3.0',
  dimensions           int not null default 1024,
  chunk_size           int not null default 500,
  chunk_overlap        int not null default 50,
  chunk_strategy       text not null default 'token' check (chunk_strategy in ('token','sentence','paragraph')),
  top_k                int not null default 5,
  similarity_threshold numeric(4,3) not null default 0.300,
  reranker_enabled     boolean not null default false,
  reranker_model       text default 'rerank-multilingual-v3.0',
  is_active            boolean not null default true,
  updated_at           timestamptz not null default now()
);

-- =============================================================================
-- Widget appearance / allowed domains
-- =============================================================================
create table if not exists public.widget_config (
  id              uuid primary key default gen_random_uuid(),
  primary_color   text not null default '#2563eb',
  position        text not null default 'bottom-right'
                    check (position in ('bottom-right','bottom-left')),
  welcome_message text not null default 'سلام! چطور می‌تونم کمکتون کنم؟',
  allowed_domains text[] not null default '{}',   -- empty = allow all (dev)
  is_enabled      boolean not null default true,
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- Admin users & audit log
-- =============================================================================
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  role       text not null default 'admin'
               check (role in ('owner','admin','editor','operator','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users (id) on delete set null,
  admin_email   text,
  action        text not null,
  target        text,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- =============================================================================
-- Extend existing leads (from 0001) for chatbot-sourced leads
-- =============================================================================
alter table public.leads add column if not exists phone           text;
alter table public.leads add column if not exists conversation_id uuid references public.conversations (id) on delete set null;
alter table public.leads add column if not exists status          text not null default 'new';

-- =============================================================================
-- updated_at triggers
-- =============================================================================
drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Similarity search RPC (cosine). SECURITY DEFINER so it can read chunks even
-- under locked-down RLS; only ever invoked by the service-role server client.
-- Returns rows with similarity = 1 - cosine_distance, filtered by threshold.
-- =============================================================================
create or replace function public.match_chunks(
  query_embedding      vector(1024),
  match_count          int   default 5,
  similarity_threshold float default 0.3,
  filter_tags          text[] default null
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  similarity  float,
  chunk_index int,
  metadata    jsonb,
  title       text
)
language sql stable security definer set search_path = public
as $$
  select
    c.id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.chunk_index,
    c.metadata,
    d.title
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where c.embedding is not null
    and d.status = 'ready'
    and (filter_tags is null or d.tags && filter_tags)
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- =============================================================================
-- Row Level Security — lock everything; service-role bypasses RLS.
-- =============================================================================
alter table public.documents        enable row level security;
alter table public.chunks           enable row level security;
alter table public.unified_users    enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.feedback         enable row level security;
alter table public.prompt_versions  enable row level security;
alter table public.model_config     enable row level security;
alter table public.embedding_config enable row level security;
alter table public.widget_config    enable row level security;
alter table public.admin_users      enable row level security;
alter table public.audit_log        enable row level security;
-- (no policies added: anon/authenticated get no access; server uses service-role)

-- =============================================================================
-- Seed defaults (idempotent)
-- =============================================================================
-- Retrieval/embedding defaults
insert into public.embedding_config (provider, model, dimensions, chunk_size, chunk_overlap, top_k, similarity_threshold)
select 'cohere', 'embed-multilingual-v3.0', 1024, 500, 50, 5, 0.300
where not exists (select 1 from public.embedding_config);

-- Per-channel model config
insert into public.model_config (channel, active_model, temperature, max_tokens)
values
  ('default',  'anthropic/claude-haiku-4.5', 0.30, 1024),
  ('web',      'anthropic/claude-haiku-4.5', 0.30, 1024),
  ('widget',   'anthropic/claude-haiku-4.5', 0.30, 1024),
  ('telegram', 'anthropic/claude-haiku-4.5', 0.30, 1024)
on conflict (channel) do nothing;

-- Widget defaults (single row)
insert into public.widget_config (primary_color, position, welcome_message)
select '#2563eb', 'bottom-right', 'سلام! من دستیار هوش مصنوعی امیراحسان نوری‌ام. چطور می‌تونم کمکتون کنم؟'
where not exists (select 1 from public.widget_config);

-- Owner admin
insert into public.admin_users (email, role)
values ('amirehsan.noori@gmail.com', 'owner')
on conflict (email) do nothing;

-- Active system prompt / persona (AEN brand voice)
insert into public.prompt_versions (content, persona, is_active, created_by)
select
$prompt$تو دستیار هوش مصنوعی «امیراحسان نوری» هستی — معمار سیستم‌های هوش مصنوعی و اتوماسیون (شعار: از آشفتگی تا سیستم‌ها).

شخصیت و لحن:
- حرفه‌ای، آرام و اطمینان‌بخش — بدون اغراق و بدون واژه‌های پرطمطراق.
- همیشه فارسیِ روان و محاوره‌ایِ مؤدب. مخاطب را «شما» خطاب کن.
- کوتاه و دقیق پاسخ بده؛ از شعار و تعارف اضافی پرهیز کن.

قواعد رفتاری:
- فقط بر پایهٔ «منابع بازیابی‌شده» (context) پاسخ بده. اگر پاسخ در منابع نبود، صادقانه بگو نمی‌دانی و کاربر را به ثبت درخواست مشاوره هدایت کن.
- هیچ‌گاه وعدهٔ قطعی یا تضمینی نده و مشاورهٔ تخصصیِ نهایی نده؛ نقش تو راهنمایی و هدایت است.
- وقتی کاربر آمادهٔ اقدام است یا اطلاعات تماس می‌دهد، ابزار ثبت لید را صدا بزن.
- اگر سؤال خارج از حوزهٔ خدمات امیراحسان است یا کاربر درخواست انسان کرد، ابزار تحویل به انسان را صدا بزن.
- دربارهٔ موضوعات نامرتبط با هوش مصنوعی/اتوماسیون/خدمات امیراحسان وارد بحث نشو و مؤدبانه گفتگو را برگردان.$prompt$,
  'AEN — راهنمای مشاوره',
  true,
  'system'
where not exists (select 1 from public.prompt_versions where is_active);
