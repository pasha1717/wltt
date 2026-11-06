# Neşe'nin repliklerini VoxCPM2 ile (yerel, ücretsiz) seslendirir.
# Önce VoxCPM2'yi kur ve Neşe'nin sesini tasarla (README > "Ses üretimi: VoxCPM2").
# Kullanım:
#   .\araclar\voxcpm-uret.ps1 -VoxKlasor C:\vox\voxcpm2-turkce-ses-tasarimi -Ses nese/2 -Dene 3   # önce 3 replik
#   .\araclar\voxcpm-uret.ps1 -VoxKlasor C:\vox\voxcpm2-turkce-ses-tasarimi -Ses nese/2           # tüm eksikler
param(
  [Parameter(Mandatory)][string]$VoxKlasor,   # VoxCPM2 repo klasörü (.venv burada)
  [Parameter(Mandatory)][string]$Ses,         # tasarladığın ses: <ad>/<çeşit>, ör. nese/2
  [int]$Dene = 0,
  [string]$IsKlasor = 'C:\vox\nese'           # yalnız İngilizce harfli yol: motor Türkçe harfli yolu açamıyor
)
$ErrorActionPreference = 'Stop'
$proje = Split-Path $PSScriptRoot -Parent
$python = Join-Path $VoxKlasor '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) { Write-Host "VoxCPM2 bulunamadı: $python (kurulum: README > Ses üretimi)"; exit 1 }
if ($IsKlasor -match '[^\x00-\x7F]') { Write-Host "IsKlasor yalnız İngilizce harf içermeli: $IsKlasor"; exit 1 }

$cikti = Join-Path $IsKlasor 'cikti'
Push-Location $proje
$hazirlaArg = @('araclar/voxcpm.js', 'hazirla', $IsKlasor)
if ($Dene -gt 0) { $hazirlaArg += @('--dene', $Dene) }
node @hazirlaArg
if ($LASTEXITCODE) { Pop-Location; exit 1 }
Pop-Location

$basla = Get-Date
Push-Location $VoxKlasor
& $python -m ses_tasarim.oku --ses $Ses --metin "@$IsKlasor\metin.txt" --cikti $cikti
$kod = $LASTEXITCODE
Pop-Location
if ($kod) { Write-Host "VoxCPM2 okuma başarısız (çıkış $kod)."; exit 1 }
Write-Host ("Okuma süresi: {0:n0} sn" -f ((Get-Date) - $basla).TotalSeconds)

Push-Location $proje
node araclar/voxcpm.js bol $cikti
node araclar/icerik-denetle.js
Pop-Location
