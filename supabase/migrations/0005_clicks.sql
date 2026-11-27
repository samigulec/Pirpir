-- pirpir: ortaklık (affiliate) tıklamaları — "Fırsata git" ile Skyscanner'a gönderilen ziyaretçiler.
-- Kişisel veri tutulmaz (IP, e-posta yok). Yalnızca sunucu (service role) yazar ve okur.
create table if not exists public.clicks (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  src         text,
  origin      text not null,
  destination text not null,
  depart      date not null,
  return_date date,
  market      text,
  partner     text not null default 'skyscanner'
);

create index if not exists clicks_created_idx on public.clicks (created_at desc);
create index if not exists clicks_src_idx on public.clicks (src);

alter table public.clicks enable row level security;
-- Bilerek politika yok: anonim ve giriş yapmış kullanıcılar erişemez, yalnızca service role.
