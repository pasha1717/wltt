#!/usr/bin/env bash
cd "$(dirname "$0")"
port=$(grep -oP '^PORT=\K\d+' .env 2>/dev/null || echo 3900)
curl -sf -X POST "http://127.0.0.1:$port/api/olay" -d '{"tur":"kapat"}' > /dev/null && echo "Kapatma isteği gönderildi." || echo "Sunucu cevap vermedi."
sleep 2
if [ -f kayitlar/nese.pid ]; then pid=$(cat kayitlar/nese.pid); kill -0 "$pid" 2>/dev/null && kill -9 "$pid" && echo "Süreç $pid sonlandırıldı."; rm -f kayitlar/nese.pid; fi
echo "Neşe durdu. Kayıtlar: kayitlar/"
