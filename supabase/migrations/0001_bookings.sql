-- rotala: rezervasyonlar tablosu.
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (ya da `supabase db push`).

create table if not exists public.bookings (
  id          text primary key,                         -- sağlayıcının sipariş kimliği (ör. Duffel ord_…)
  user_id     uuid references auth.users (id) on delete set null,
  email       text not null,                            -- küçük harfle saklanır
  provider    text not null check (provider in ('demo', 'duffel')),
  pnr         text,                                     -- havayolu rezervasyon kodu
  total_try   integer not null check (total_try >= 0),
  locale      text,
  summary     jsonb not null,                           -- uçuş özeti (saatler, havalimanları, havayolu)
  created_at  timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_email_idx on public.bookings (email);

alter table public.bookings enable row level security;

-- Kullanıcı yalnızca kendi biletlerini görür: hesabına bağlı olanlar ya da
-- giriş yapmadan aynı (doğrulanmış) e-postayla aldıkları.
drop policy if exists "bookings: kendi biletlerini okur" on public.bookings;
create policy "bookings: kendi biletlerini okur"
  on public.bookings for select
  to authenticated
  using (
    user_id = auth.uid()
    or email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Ekleme/güncelleme yalnızca sunucudan, service role anahtarıyla yapılır (RLS'yi aşar);
-- bu yüzden istemciler için insert/update/delete kuralı tanımlanmaz.
