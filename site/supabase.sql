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
