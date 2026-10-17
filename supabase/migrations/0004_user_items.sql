-- rotala: hesaba bağlı kayıtlar: kayıtlı yolcular, fiyat alarmları, favoriler.
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (ya da `supabase db push`).

create table if not exists public.user_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('traveller', 'alert', 'favorite')),
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_items_user_kind_idx on public.user_items (user_id, kind, created_at desc);

alter table public.user_items enable row level security;

-- Herkes yalnızca kendi kayıtlarını görür, ekler, değiştirir ve siler.
drop policy if exists "user_items: kendi kayıtları" on public.user_items;
create policy "user_items: kendi kayıtları"
  on public.user_items for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
