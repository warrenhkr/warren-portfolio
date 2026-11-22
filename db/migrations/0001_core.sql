-- 0001_core : structure de base du CMS (contenus, médias, messages, journal d'activité).
-- Règle : une migration appliquée n'est JAMAIS modifiée. Toute évolution = un nouveau fichier numéroté.

-- Contenus : un document = un brouillon + une version publiée (null tant que rien n'est publié).
create table documents (
  id          uuid primary key default gen_random_uuid(),
  collection  text not null check (collection ~ '^[a-z][a-z0-9_]{1,40}$'),
  slug        text not null check (slug ~ '^[a-z0-9][a-z0-9_-]{0,80}$'),
  draft       jsonb not null check (jsonb_typeof(draft) = 'object'),
  published   jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at timestamptz,
  has_unpublished_changes boolean generated always as (published is distinct from draft) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (collection, slug)
);
create index documents_public_idx on documents (collection, ((published ->> 'order')::int)) where published is not null;
create index documents_admin_idx  on documents (collection, ((draft ->> 'order')::int));

create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger documents_set_updated_at before update on documents for each row execute function set_updated_at();

-- Médias : métadonnées des fichiers stockés dans Supabase Storage.
create table media (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  filename     text not null check (char_length(filename) between 1 and 200),
  mime_type    text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif')),
  size_bytes   integer not null check (size_bytes > 0),
  width        integer check (width is null or width > 0),
  height       integer check (height is null or height > 0),
  alt          jsonb not null default '{"fr": "", "en": ""}'::jsonb,
  folder       text not null default '' check (folder = '' or folder ~ '^[a-z0-9][a-z0-9_/-]{0,80}$'),
  created_at   timestamptz not null default now()
);
create index media_folder_idx on media (folder, created_at desc);

-- Usage des médias : la base interdit de supprimer un média encore utilisé (ON DELETE RESTRICT).
create table document_media (
  document_id uuid not null references documents (id) on delete cascade,
  media_id    uuid not null references media (id) on delete restrict,
  scope       text not null check (scope in ('draft', 'published')),
  primary key (document_id, media_id, scope)
);
create index document_media_media_idx on document_media (media_id);

-- Messages du formulaire de contact.
create table messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 100),
  email      text not null check (char_length(email) between 5 and 200),
  subject    text not null check (char_length(subject) between 3 and 150),
  body       text not null check (char_length(body) between 10 and 2000),
  is_read    boolean not null default false,
  ip_hash    text,
  created_at timestamptz not null default now()
);
create index messages_inbox_idx on messages (is_read, created_at desc);

-- Journal d'activité (tableau de bord).
create table activity (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  action      text not null,
  collection  text,
  document_id uuid,
  label       text,
  details     jsonb not null default '{}'::jsonb
);
create index activity_at_idx on activity (at desc);

-- Sécurité : Supabase expose le schéma public via une API (clés anon / authenticated).
-- On active la sécurité par ligne SANS aucune politique et on retire les droits : seule la connexion serveur
-- (rôle propriétaire, via DATABASE_URL) peut lire ou écrire. Toute future table doit suivre la même règle.
alter table documents      enable row level security;
alter table media          enable row level security;
alter table document_media enable row level security;
alter table messages       enable row level security;
alter table activity       enable row level security;

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all tables in schema public from %I', r);
      execute format('revoke all on all sequences in schema public from %I', r);
      execute format('revoke all on all functions in schema public from %I', r);
      execute format('alter default privileges in schema public revoke all on tables from %I', r);
      execute format('alter default privileges in schema public revoke all on sequences from %I', r);
      execute format('alter default privileges in schema public revoke all on functions from %I', r);
    end if;
  end loop;
end $$;
