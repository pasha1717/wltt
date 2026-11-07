-- Denk: Supabase şeması. Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştırın.
-- Sıra önemlidir: tablolar, yardımcı fonksiyonlar, kurallar (RLS), depolama, realtime.

-- ================= Tablolar =================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ad text not null check (char_length(ad) between 1 and 40),
  dogum_yili int not null,
  cinsiyet text not null check (cinsiyet in ('kadin','erkek')),
  sehir text not null check (char_length(sehir) <= 40),
  hakkinda text check (char_length(hakkinda) <= 400),
  cevap smallint[] not null check (array_length(cevap,1) = 56),
  gorunur boolean not null default true,
  foto int not null default 0,          -- 0: fotoğraf yok; artan sayı: sürüm
  askida boolean not null default false, -- yönetici tarafından askıya alındı
  riza_tarihi timestamptz not null,      -- açık rıza verildiği an
  dogrulandi boolean not null default false,          -- selfie doğrulaması yönetici tarafından onaylandı
  telefon_dogrulandi boolean not null default false,  -- telefon numarası SMS koduyla doğrulandı
  eposta_bildirim boolean not null default true,      -- ilgi ve mesaj e-postaları
  son_gorulme timestamptz,                            -- sitede en son ne zaman açıktı (bildirim için)
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

create table if not exists public.engel (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  ad text,  -- engellerken karşı tarafın adı (engel listesinde göstermek için)
  olusturma timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create table if not exists public.sikayet (
  id bigint generated always as identity primary key,
  from_id uuid references public.profiles(id) on delete set null,
  hakkinda_id uuid not null references public.profiles(id) on delete cascade,
  sebep text not null check (char_length(sebep) <= 60),
  aciklama text check (char_length(aciklama) <= 1000),
  durum text not null default 'acik' check (durum in ('acik','islem','asilsiz')),
  olusturma timestamptz not null default now()
);

-- Selfie doğrulama başvurusu: fotoğraf Storage'da dogrulama/<id>.jpg
create table if not exists public.dogrulama (
  id uuid primary key references public.profiles(id) on delete cascade,
  kod text not null check (kod ~ '^[0-9]{4}$'),
  durum text not null default 'bekliyor' check (durum in ('bekliyor','onay','red')),
  red_sebep text check (char_length(red_sebep) <= 200),
  olusturma timestamptz not null default now()
);

-- E-posta bildirimlerinin tekrarını sınırlamak için kayıt (yalnızca sunucu fonksiyonu kullanır)
create table if not exists public.bildirim_log (
  id bigint generated always as identity primary key,
  to_id uuid not null references public.profiles(id) on delete cascade,
  from_id uuid references public.profiles(id) on delete cascade,
  tur text not null,
  zaman timestamptz not null default now()
);
create index if not exists bildirim_log_ara on public.bildirim_log (to_id, tur, from_id, zaman desc);

create table if not exists public.yoneticiler (
  id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.cagri (
  id bigint generated always as identity primary key,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  durum text not null default 'caliyor' check (durum in ('caliyor','kabul','red','iptal','mesgul')),
  olusturma timestamptz not null default now()
);

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

-- ================= Yardımcı fonksiyonlar =================
create or replace function public.yonetici() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from yoneticiler where id = auth.uid())
$$;

-- a ile b arasında herhangi bir yönde engel var mı?
create or replace function public.engelli(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from engel where (from_id = a and to_id = b) or (from_id = b and to_id = a))
$$;

-- Karşılıklı ilgi var, engel yok, ikisi de askıda değil: mesaj, görüntülü görüşme ve iletişim bilgisi buna bağlı.
create or replace function public.karsilikli(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from ilgi where from_id = a and to_id = b)
     and exists (select 1 from ilgi where from_id = b and to_id = a)
     and not engelli(a, b)
     and not exists (select 1 from profiles where id in (a, b) and askida)
$$;

-- Kullanıcının kendi hesabını tamamen silmesi (profil, mesajlar, ilgiler vb. zincirleme silinir).
create or replace function public.hesabimi_sil() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.hesabimi_sil() from public, anon;
grant execute on function public.hesabimi_sil() to authenticated;

-- Kullanıcı askı ve doğrulama alanlarını kendisi değiştiremez.
-- askida: yalnızca yönetici. dogrulandi: yalnızca doğrulama onayı. telefon_dogrulandi: yalnızca auth tetikleyicisi.
create or replace function public.askida_koru() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Başka bir tetikleyiciden (doğrulama/telefon sonucu) gelen güncellemeye izin ver
  if pg_trigger_depth() > 1 then return new; end if;
  if tg_op = 'INSERT' then
    new.askida := false; new.dogrulandi := false;
    new.telefon_dogrulandi := coalesce((select phone_confirmed_at is not null from auth.users where id = new.id), false);
  else
    if not yonetici() then new.askida := old.askida; end if;
    new.dogrulandi := old.dogrulandi;
    new.telefon_dogrulandi := old.telefon_dogrulandi;
  end if;
  return new;
end $$;
drop trigger if exists askida_koru on public.profiles;
create trigger askida_koru before insert or update on public.profiles
  for each row execute function public.askida_koru();

-- Doğrulama onaylanınca/reddedilince profildeki rozet güncellenir.
create or replace function public.dogrulama_sonuc() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set dogrulandi = (new.durum = 'onay') where id = new.id;
  return new;
end $$;
drop trigger if exists dogrulama_sonuc on public.dogrulama;
create trigger dogrulama_sonuc after insert or update of durum on public.dogrulama
  for each row execute function public.dogrulama_sonuc();

-- Telefon SMS koduyla doğrulanınca rozet açılır.
create or replace function public.telefon_sonuc() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set telefon_dogrulandi = (new.phone_confirmed_at is not null) where id = new.id;
  return new;
end $$;
drop trigger if exists telefon_sonuc on auth.users;
create trigger telefon_sonuc after update of phone_confirmed_at on auth.users
  for each row execute function public.telefon_sonuc();

-- ================= Kurallar (RLS) =================
alter table public.profiles    enable row level security;
alter table public.iletisim    enable row level security;
alter table public.ilgi        enable row level security;
alter table public.engel       enable row level security;
alter table public.sikayet     enable row level security;
alter table public.yoneticiler enable row level security;
alter table public.dogrulama   enable row level security;
alter table public.bildirim_log enable row level security; -- kural yok: yalnızca service role erişir
alter table public.cagri       enable row level security;
alter table public.mesaj       enable row level security;

-- Profiller: görünür, askıda olmayan ve engel ilişkisi olmayan profiller; kendi profiliniz; yönetici hepsini görür.
create policy "profil okuma" on public.profiles for select to authenticated
  using (id = auth.uid() or public.yonetici()
         or (gorunur and not askida and not public.engelli(id, auth.uid())));
create policy "profil ekleme" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profil guncelleme" on public.profiles for update to authenticated
  using (id = auth.uid() or public.yonetici()) with check (id = auth.uid() or public.yonetici());

create policy "iletisim okuma" on public.iletisim for select to authenticated
  using (id = auth.uid() or public.karsilikli(auth.uid(), id));
create policy "iletisim ekleme" on public.iletisim for insert to authenticated
  with check (id = auth.uid());
create policy "iletisim guncelleme" on public.iletisim for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "ilgi okuma" on public.ilgi for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "ilgi gonderme" on public.ilgi for insert to authenticated
  with check (from_id = auth.uid() and not public.engelli(from_id, to_id));
create policy "ilgi geri alma" on public.ilgi for delete to authenticated
  using (from_id = auth.uid());

-- Engel: kişi yalnızca kendi koyduğu engelleri görür (kimin onu engellediğini göremez).
create policy "engel okuma" on public.engel for select to authenticated using (from_id = auth.uid());
create policy "engel koyma" on public.engel for insert to authenticated with check (from_id = auth.uid());
create policy "engel kaldirma" on public.engel for delete to authenticated using (from_id = auth.uid());

-- Şikayet: herkes şikayet edebilir; yalnızca yöneticiler okur ve durumunu değiştirir.
create policy "sikayet etme" on public.sikayet for insert to authenticated
  with check (from_id = auth.uid() and hakkinda_id <> auth.uid() and durum = 'acik');
create policy "sikayet okuma" on public.sikayet for select to authenticated using (public.yonetici());
create policy "sikayet guncelleme" on public.sikayet for update to authenticated
  using (public.yonetici()) with check (public.yonetici());

-- Doğrulama: kişi kendi başvurusunu görür ve "bekliyor" olarak gönderir; yönetici hepsini görür ve karar verir.
create policy "dogrulama okuma" on public.dogrulama for select to authenticated
  using (id = auth.uid() or public.yonetici());
create policy "dogrulama basvuru" on public.dogrulama for insert to authenticated
  with check (id = auth.uid() and durum = 'bekliyor');
create policy "dogrulama yenileme" on public.dogrulama for update to authenticated
  using (id = auth.uid() or public.yonetici())
  with check ((id = auth.uid() and durum = 'bekliyor') or public.yonetici());

create policy "yonetici okuma" on public.yoneticiler for select to authenticated using (id = auth.uid());

create policy "cagri okuma" on public.cagri for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "cagri baslatma" on public.cagri for insert to authenticated
  with check (from_id = auth.uid() and public.karsilikli(from_id, to_id));
create policy "cagri durum" on public.cagri for update to authenticated
  using (from_id = auth.uid() or to_id = auth.uid())
  with check (from_id = auth.uid() or to_id = auth.uid());

create policy "mesaj okuma" on public.mesaj for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "mesaj gonderme" on public.mesaj for insert to authenticated
  with check (from_id = auth.uid() and public.karsilikli(from_id, to_id) and okundu = false);
create policy "mesaj okundu" on public.mesaj for update to authenticated
  using (to_id = auth.uid()) with check (to_id = auth.uid());
revoke update on public.mesaj from authenticated;
grant update (okundu) on public.mesaj to authenticated;

-- ================= Fotoğraflar (Storage) =================
-- "foto" kovası özeldir. Her üyenin iki dosyası olur:
--   bulanik/<id>.jpg : 24 piksellik küçük kopya, giriş yapmış herkes görebilir (yüz seçilemez)
--   net/<id>.jpg     : asıl fotoğraf, yalnızca sahibi, karşılıklı ilgi olan kişi ve yönetici görebilir
--   dogrulama/<id>.jpg : doğrulama selfiesi, yalnızca sahibi ve yönetici görebilir
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto', 'foto', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "foto okuma" on storage.objects for select to authenticated
  using (bucket_id = 'foto' and (
    split_part(storage.filename(name), '.', 1) = auth.uid()::text
    or public.yonetici()
    or (storage.foldername(name))[1] = 'bulanik'
    or ((storage.foldername(name))[1] = 'net'
        and public.karsilikli(auth.uid(), split_part(storage.filename(name), '.', 1)::uuid))
  ));  -- dogrulama/ klasörünü yalnızca sahibi ve yönetici görür
create policy "foto yukleme" on storage.objects for insert to authenticated
  with check (bucket_id = 'foto' and split_part(storage.filename(name), '.', 1) = auth.uid()::text
              and (storage.foldername(name))[1] in ('net','bulanik','dogrulama'));
create policy "foto guncelleme" on storage.objects for update to authenticated
  using (bucket_id = 'foto' and split_part(storage.filename(name), '.', 1) = auth.uid()::text);
create policy "foto silme" on storage.objects for delete to authenticated
  using (bucket_id = 'foto' and (split_part(storage.filename(name), '.', 1) = auth.uid()::text or public.yonetici()));

-- ================= Realtime =================
alter publication supabase_realtime add table public.cagri;
alter publication supabase_realtime add table public.mesaj;

-- Görüntülü görüşme sinyal kanalı "gorusme:<id1>_<id2>": yalnızca bu iki kişi, karşılıklı ilgi varsa.
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

-- ================= Yönetici ekleme =================
-- Kendinizi yönetici yapmak için, siteye bir kez giriş yaptıktan sonra:
--   insert into public.yoneticiler (id) select id from auth.users where email = 'sizin@gmail.com';
