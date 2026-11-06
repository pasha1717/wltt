#!/usr/bin/env bash
# Linux/macOS (ve bu projenin bulut testi) için başlatma. Windows'ta basla.ps1 kullan.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p kayitlar
[ -d node_modules ] || npm install --no-fund --no-audit
[ -f src/arayuz/public/vendor/Haru/Haru.model3.json ] || node araclar/live2d-indir.js
if [ -f kayitlar/nese.pid ] && kill -0 "$(cat kayitlar/nese.pid)" 2>/dev/null; then echo "Neşe zaten çalışıyor (PID $(cat kayitlar/nese.pid))."; exit 1; fi
tarih=$(date +%F_%H-%M)
nohup node src/ana.js > "kayitlar/cikti_$tarih.log" 2> "kayitlar/hata_$tarih.log" < /dev/null &
port=$(grep -oP '^PORT=\K\d+' .env 2>/dev/null || echo 3900)
for _ in $(seq 20); do sleep 0.5; curl -sf "http://127.0.0.1:$port/api/saglik" > /dev/null && break; done
curl -sf "http://127.0.0.1:$port/api/saglik" > /dev/null || { echo "Sunucu açılmadı:"; tail -20 "kayitlar/hata_$tarih.log"; exit 1; }
echo "Neşe çalışıyor (PID $(cat kayitlar/nese.pid)). Panel: http://127.0.0.1:$port/panel"
node araclar/saglik.js
