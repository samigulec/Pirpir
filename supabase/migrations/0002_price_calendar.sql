-- rotala: fiyatlı takvim için son aramaların en düşük fiyatları.
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (ya da `supabase db push`).
-- Yalnızca sunucu (service role) okur ve yazar; tarayıcıdan erişim yok.

create table if not exists public.price_calendar (
  route      text not null,                -- "AMS>ADB" ya da "AMS,city:RTM>city:IST" (sıralı kodlar)
  cabin      text not null,
  mode       text not null check (mode in ('test', 'live')),
  depart     date not null,
  nights     integer not null,             -- dönüşe kadar gece; tek yön için -1
  price_try  integer not null check (price_try >= 0),   -- kişi başı en düşük fiyat
  seen_at    timestamptz not null default now(),
  primary key (route, cabin, mode, depart, nights)
);

create index if not exists price_calendar_seen_idx on public.price_calendar (seen_at);

alter table public.price_calendar enable row level security;
-- Politika yok: anon ve oturumlu kullanıcılar okuyamaz/yazamaz, yalnızca service role.
