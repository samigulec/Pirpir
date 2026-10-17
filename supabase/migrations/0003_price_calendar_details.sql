-- rotala: fiyat takvimine uçuş özeti (popüler kartlarda en ucuz tarihin aktarma, süre ve havayolu bilgisi için).
-- 0002'den sonra SQL Editor'da çalıştır.
alter table public.price_calendar add column if not exists details jsonb;
create index if not exists price_calendar_route_idx on public.price_calendar (route, cabin, mode, seen_at);
