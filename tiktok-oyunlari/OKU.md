# TikTok oyun fabrikası için ek oyunlar

`oyunlar.zip`: Rast Gele! (balikci), Pavyon Gecesi (pavyon), Fetih 1453 (fetih) ve telefonda dokununca tam ekran (`cekirdek/js/99-tam-ekran.js`).

Termux'ta, `tiktok-oyun-fabrikasi` klasöründe:

```
curl -L -o oyunlar.zip https://raw.githubusercontent.com/pasha1717/wltt/ccr-63de91cd-ia2lcj/tiktok-oyunlari/oyunlar.zip
unzip -o oyunlar.zip
node kopru.js --deneme --oyun fetih
```

## Fetih'te hazır marş

Zip, `oyunlar/fetih/muzik/` içinde Ceddin Deden kaydını (`ceddin-deden.mp3`) ve vuruş listesini (`liste.js`) taşır.
Köprü açılınca "Müzik: 1 hazır parça" yazar. Oyunun kendi havalarına dönmek için `oyunlar/fetih/muzik` klasörünü sil.
Kaydın kullanım hakkı depo sahibine aittir; telifliyse TikTok yayında sesi kısabilir.
