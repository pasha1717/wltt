# Neşe'yi başlatır: eksik dosyaları kontrol eder, sunucuyu arka planda açar, (istersen) OBS sahnesini kurar, paneli açar.
# Kullanım:  .\basla.ps1          |  .\basla.ps1 -ObsKur
param([switch]$ObsKur)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force kayitlar | Out-Null

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js bulunamadı. Kur: https://nodejs.org/en/download (20 veya üstü)'; exit 1
}
if (-not (Test-Path node_modules)) { Write-Host 'Paketler kuruluyor (npm install)...'; npm install --no-fund --no-audit }
if (-not (Test-Path src/arayuz/public/vendor/Haru/Haru.model3.json)) { Write-Host 'Live2D dosyaları indiriliyor...'; node araclar/live2d-indir.js }
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host '.env oluşturuldu. Anahtarları yalnız bu dosyaya yaz.' }

$pidDosya = 'kayitlar/nese.pid'
if (Test-Path $pidDosya) {
  $eski = Get-Content $pidDosya
  if (Get-Process -Id $eski -ErrorAction SilentlyContinue) { Write-Host "Neşe zaten çalışıyor (PID $eski). Önce .\durdur.ps1"; exit 1 }
}

$tarih = Get-Date -Format 'yyyy-MM-dd_HH-mm'
$p = Start-Process node -ArgumentList 'src/ana.js' -PassThru -WindowStyle Hidden `
  -RedirectStandardOutput "kayitlar/cikti_$tarih.log" -RedirectStandardError "kayitlar/hata_$tarih.log"

$port = 3900
if (Test-Path .env) { $satir = Select-String -Path .env -Pattern '^PORT=(\d+)' | Select-Object -First 1; if ($satir) { $port = [int]$satir.Matches[0].Groups[1].Value } }
$hazir = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500
  try { Invoke-RestMethod "http://127.0.0.1:$port/api/saglik" -TimeoutSec 2 | Out-Null; $hazir = $true; break } catch {}
}
if (-not $hazir) { Write-Host "Sunucu açılmadı. Hata kaydı: kayitlar/hata_$tarih.log"; Get-Content "kayitlar/hata_$tarih.log" -Tail 20; exit 1 }

Write-Host "Neşe çalışıyor (PID $($p.Id)). Panel: http://127.0.0.1:$port/panel"
if ($ObsKur) { node src/obs/kurulum.js }
Start-Process "http://127.0.0.1:$port/panel"
node araclar/saglik.js
