#!/bin/bash
# sesi hazır olanlar önce, sonra kısa metinden uzuna (kredi en çok videoya yetsin); parti2'de açıklaması hazır olan ve kontrolden geçen videoları sırayla üretir; 40 dk yeni iş gelmezse çıkar
cd /home/user/wltt; bos=0
while [ $bos -lt 80 ]; do
  is=""
  for a in $(ls uretim/aciklamalar | sed "s/.md$//" | while read x; do [ -f public/$x/ses.mp3 ] && echo $x; done) $(python3 -I uretim/uzun.py | cut -d" " -f1); do [ -f cikti/$a.mp4 ] && continue; grep -q "$a" /tmp/atla.txt 2>/dev/null && continue
    python3 -I uretim/kontrol.py $a | grep -q " OK$" && mkdir /tmp/kilit/$a 2>/dev/null && { is=$a; break; }; done
  if [ -z "$is" ]; then bos=$((bos+1)); sleep 30; continue; fi
  bos=0; uretim/uret.sh $is | grep -E "TAMAM|HATA|KREDI"
  [ -f cikti/$is.mp4 ] || echo $is >> /tmp/atla.txt
done
