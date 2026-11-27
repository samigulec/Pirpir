-- pirpir: fırsat motoru — günlük taramada normal fiyatına göre belirgin ucuz bulunan uçuş adayları
-- ve yönetim panelinden yayınlanan fırsatlar. Yalnızca sunucu (service role) yazar ve okur.
create table if not exists public.deals (
  id           uuid primary key default gen_random_uuid(),
  origin       text not null,
  destination  text not null,
  depart       date not null,
  return_date  date,
  price_eur    numeric not null,
  median_eur   numeric not null,
  airline      text,
  transfers    int,
  seen_at      date,
  link         text,
  status       text not null default 'candidate' check (status in ('candidate', 'published', 'rejected')),
  created_at   timestamptz not null default now(),
  published_at timestamptz,
  unique nulls not distinct (origin, destination, depart, return_date)
);

create index if not exists deals_status_depart_idx on public.deals (status, depart);
create index if not exists deals_route_status_idx on public.deals (origin, destination, status);

alter table public.deals enable row level security;
-- Bilerek politika yok: anonim ve giriş yapmış kullanıcılar doğrudan erişemez, yalnızca service role.
