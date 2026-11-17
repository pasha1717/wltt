#!/usr/bin/env python3
"""Günlük tarama: kanallar.txt'deki her kanalın biten son yayınını işler, daha önce işlenenleri atlar.

kanallar.txt (her satır bir kanal, ardından isteğe bağlı kesit.py seçenekleri; # ile yorum):
    kick:wtcn --adet 5 --dil tr
    twitch:kanaladi --adet 3
    youtube:kanaladi --mod genel

Kullanım:  python3 takip.py [kanallar.txt]
Her gün otomatik çalıştırmak için BENIOKU.md'deki zamanlayıcı satırına bak.
"""
import shlex, subprocess, sys
from pathlib import Path

KOK = Path(__file__).resolve().parent


def main():
    dosya = Path(sys.argv[1] if len(sys.argv) > 1 else KOK / "kanallar.txt")
    if not dosya.exists():
        sys.exit(f"{dosya} yok. Örnek: kanallar.ornek.txt dosyasını kopyala.")
    hatalar = 0
    for satir in dosya.read_text(encoding="utf-8").splitlines():
        satir = satir.split("#")[0].strip()
        if not satir:
            continue
        print(f"\n===== {satir}", flush=True)
        r = subprocess.run([sys.executable, str(KOK / "kesit.py")] + shlex.split(satir) + ["--yeni", "--temizle", "--derleme"])
        hatalar += r.returncode != 0
    print(f"\nTarama bitti. Hatalı kanal: {hatalar}")
    sys.exit(1 if hatalar else 0)


if __name__ == "__main__":
    main()
