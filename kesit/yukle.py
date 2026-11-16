#!/usr/bin/env python3
"""Kesitleri YouTube'a yükler (isteğe bağlı, ayrı adım). Varsayılan gizlilik: private.

Gerekenler: Google Cloud'da YouTube Data API v3 açık bir proje ve oradan indirilen
OAuth istemci dosyası (client_secret.json, "Masaüstü uygulaması" türü). İlk çalıştırmada
tarayıcıda hesabını onaylarsın; izin token.json'a kaydedilir.

Not: Doğrulama (audit) almamış API projelerinden yüklenen videolar YouTube tarafından
"özel" olarak kilitlenir; herkese açık yayın için Google'ın denetiminden geçmek gerekir.

Kullanım:  python3 yukle.py cikti/<kimlik> [--gizlilik private|unlisted|public] [--istemci client_secret.json]
"""
import argparse, re
from pathlib import Path

KAPSAM = ["https://www.googleapis.com/auth/youtube.upload"]


def youtube(istemci, token):
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    cred = Credentials.from_authorized_user_file(token, KAPSAM) if Path(token).exists() else None
    if not cred or not cred.valid:
        if cred and cred.expired and cred.refresh_token:
            cred.refresh(Request())
        else:
            cred = InstalledAppFlow.from_client_secrets_file(istemci, KAPSAM).run_local_server(port=0)
        Path(token).write_text(cred.to_json())
    return build("youtube", "v3", credentials=cred)


def aciklamalari_oku(klasor):
    metin = (klasor / "aciklamalar.md").read_text(encoding="utf-8")
    bolumler = {}
    for parca in re.split(r"^## ", metin, flags=re.M)[1:]:
        ad, _, govde = parca.partition("\n")
        m = re.search(r"\*\*Başlık:\*\* (.+)", govde)
        baslik = m[1].strip() if m else ad
        aciklama = re.sub(r"\*\*Başlık:\*\* .+\n", "", govde).strip()
        bolumler[ad.strip()] = (baslik, aciklama)
    return bolumler


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("klasor")
    ap.add_argument("--gizlilik", default="private", choices=["private", "unlisted", "public"])
    ap.add_argument("--istemci", default="client_secret.json")
    ap.add_argument("--token", default="token.json")
    a = ap.parse_args()
    from googleapiclient.http import MediaFileUpload
    klasor = Path(a.klasor)
    bilgiler = aciklamalari_oku(klasor)
    yt = youtube(a.istemci, a.token)
    for video in sorted(klasor.glob("kesit_*.mp4")):
        baslik, aciklama = bilgiler.get(video.name, (video.stem, ""))
        baslik = (baslik if "#shorts" in baslik.lower() else baslik + " #shorts")[:100]
        govde = {"snippet": {"title": baslik, "description": aciklama[:4900], "categoryId": "20"},
                 "status": {"privacyStatus": a.gizlilik, "selfDeclaredMadeForKids": False}}
        r = yt.videos().insert(part="snippet,status", body=govde,
                               media_body=MediaFileUpload(str(video), chunksize=-1, resumable=True)).execute()
        print(f"{video.name} -> https://youtube.com/shorts/{r['id']} ({a.gizlilik})")


if __name__ == "__main__":
    main()
