-- Denk: Supabase şeması. Supabase panelinde SQL Editor'e yapıştırıp çalıştırın.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ad text not null check (char_length(ad) between 1 and 40),
  dogum_yili int not null,
  cinsiyet text not null check (cinsiyet in ('kadin','erkek')),
  sehir text not null check (char_length(sehir) <= 40),
  hakkinda text check (char_length(hakkinda) <= 400),
  cevap smallint[] not null check (array_length(cevap,1) = 56),
  gorunur boolean not null default true,
  guncelleme timestamptz not null default now()
);

-- İletişim bilgisi ayrı tabloda: yalnızca sahibi ve karşılıklı ilgi olan kişi görebilir.
create table if not exists public.iletisim (
  id uuid primary key references public.profiles(id) on delete cascade,
  bilgi text check (char_length(bilgi) <= 120)
);

create table if not exists public.ilgi (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  olusturma timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

alter table public.profiles enable row level security;
alter table public.iletisim enable row level security;
alter table public.ilgi     enable row level security;

-- Profiller: giriş yapmış üyeler görünür profilleri ve kendi profilini okur; yalnızca kendi profilini yazar.
create policy "profil okuma" on public.profiles for select to authenticated
  using (gorunur or id = auth.uid());
create policy "profil ekleme" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profil guncelleme" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profil silme" on public.profiles for delete to authenticated
  using (id = auth.uid());

-- İlgi: kişi yalnızca kendi gönderdiği ve kendisine gelen ilgileri görür.
create policy "ilgi okuma" on public.ilgi for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "ilgi gonderme" on public.ilgi for insert to authenticated
  with check (from_id = auth.uid());
create policy "ilgi geri alma" on public.ilgi for delete to authenticated
  using (from_id = auth.uid());

-- İletişim: sahibi her zaman; başkası yalnızca iki yönlü ilgi varsa okur.
create policy "iletisim okuma" on public.iletisim for select to authenticated
  using (
    id = auth.uid()
    or (exists (select 1 from public.ilgi a where a.from_id = auth.uid() and a.to_id = iletisim.id)
        and exists (select 1 from public.ilgi b where b.from_id = iletisim.id and b.to_id = auth.uid()))
  );
create policy "iletisim ekleme" on public.iletisim for insert to authenticated
  with check (id = auth.uid());
create policy "iletisim guncelleme" on public.iletisim for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ================= Görüntülü görüşme =================
-- İki kişi arasında karşılıklı ilgi var mı?
create or replace function public.karsilikli(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from ilgi where from_id = a and to_id = b)
     and exists (select 1 from ilgi where from_id = b and to_id = a)
$$;

-- Arama kayıtları: arayan satır ekler, aranan Realtime ile anında görür.
create table if not exists public.cagri (
  id bigint generated always as identity primary key,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  durum text not null default 'caliyor' check (durum in ('caliyor','kabul','red','iptal','mesgul')),
  olusturma timestamptz not null default now()
);
alter table public.cagri enable row level security;
create policy "cagri okuma" on public.cagri for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "cagri baslatma" on public.cagri for insert to authenticated
  with check (from_id = auth.uid() and public.karsilikli(from_id, to_id));
create policy "cagri durum" on public.cagri for update to authenticated
  using (from_id = auth.uid() or to_id = auth.uid())
  with check (from_id = auth.uid() or to_id = auth.uid());
alter publication supabase_realtime add table public.cagri;

-- Sinyal kanalı "gorusme:<id1>_<id2>": yalnızca bu iki kişi, karşılıklı ilgi varsa katılabilir.
create policy "gorusme kanali okuma" on realtime.messages for select to authenticated
  using (
    realtime.topic() like 'gorusme:%'
    and auth.uid()::text = any (string_to_array(split_part(realtime.topic(), ':', 2), '_'))
    and public.karsilikli(split_part(split_part(realtime.topic(), ':', 2), '_', 1)::uuid,
                          split_part(split_part(realtime.topic(), ':', 2), '_', 2)::uuid)
  );
create policy "gorusme kanali yazma" on realtime.messages for insert to authenticated
  with check (
    realtime.topic() like 'gorusme:%'
    and auth.uid()::text = any (string_to_array(split_part(realtime.topic(), ':', 2), '_'))
    and public.karsilikli(split_part(split_part(realtime.topic(), ':', 2), '_', 1)::uuid,
                          split_part(split_part(realtime.topic(), ':', 2), '_', 2)::uuid)
  );

-- ================= Mesajlaşma =================
create table if not exists public.mesaj (
  id bigint generated always as identity primary key,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  metin text not null check (char_length(metin) between 1 and 1000),
  okundu boolean not null default false,
  olusturma timestamptz not null default now()
);
create index if not exists mesaj_cift on public.mesaj (least(from_id,to_id), greatest(from_id,to_id), olusturma desc);
create index if not exists mesaj_alici on public.mesaj (to_id, okundu);
alter table public.mesaj enable row level security;

-- Yalnızca gönderen ve alıcı okur; yalnızca karşılıklı ilgi varsa gönderilir; alıcı yalnızca "okundu" bilgisini değiştirir.
create policy "mesaj okuma" on public.mesaj for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "mesaj gonderme" on public.mesaj for insert to authenticated
  with check (from_id = auth.uid() and public.karsilikli(from_id, to_id) and okundu = false);
create policy "mesaj okundu" on public.mesaj for update to authenticated
  using (to_id = auth.uid()) with check (to_id = auth.uid());
revoke update on public.mesaj from authenticated;
grant update (okundu) on public.mesaj to authenticated;
alter publication supabase_realtime add table public.mesaj;
