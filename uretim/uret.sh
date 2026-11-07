#!/bin/bash
# Kullanım: uret.sh ad1 ad2 ... (sırayla ses+kes+sessizlik+render)
cd /home/user/wltt
for ad in "$@"; do
  if [ -f cikti/$ad.mp4 ]; then echo "$ad zaten var"; continue; fi
  if [ ! -f public/$ad/ses.mp3 ]; then
    k=$(python3 -I uretim/kredi.py 2>/dev/null | tail -1); [[ "$k" =~ ^[0-9]+$ ]] && [ "$k" -lt 1200 ] && { echo "$ad KREDI YETMEZ ($k)"; continue; }
    python3 ses.py public/$ad KAGDtM2gzDrjWlUp2KNe && python3 kes.py public/$ad && python3 sessizlik.py public/$ad || { echo "$ad SES HATA"; continue; }
  fi
  npx remotion render src/$ad/index.ts Video cikti/$ad.mp4 --concurrency=2 --log=error >/dev/null 2>&1 && echo "$ad TAMAM $(python3 -c "import json;print(json.load(open('public/$ad/kelimeler.json'))[-1]['e'])")" || echo "$ad RENDER HATA"
done
