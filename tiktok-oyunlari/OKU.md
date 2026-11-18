# TikTok oyun fabrikası için ek oyunlar

`oyunlar.zip`: Rast Gele! (balikci), Pavyon Gecesi (pavyon), Fetih 1453 (fetih) ve telefonda dokununca tam ekran (`cekirdek/js/99-tam-ekran.js`).

Termux'ta, `tiktok-oyun-fabrikasi` klasöründe:

```
curl -L -o oyunlar.zip https://raw.githubusercontent.com/pasha1717/wltt/ccr-63de91cd-ia2lcj/tiktok-oyunlari/oyunlar.zip
unzip -o oyunlar.zip
node kopru.js --deneme --oyun fetih
```

## Fetih'te hazır marş

`fetih-muzik/liste.js`: `ceddin-deden.mp3` kaydının ölçülmüş vuruşları. Ses dosyası depoda yok (telif); kendi kopyanı
`oyunlar/fetih/muzik/ceddin-deden.mp3` olarak koy, `liste.js`'i yanına indir.
