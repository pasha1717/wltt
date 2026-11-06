# Sağlık kontrolü: Node, OBS, dosyalar, anahtarlar (yalnız dolu/boş), portlar.
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host '✗ Node.js yok: https://nodejs.org/en/download'; exit 1 }
$obs = @("$env:ProgramFiles\obs-studio\bin\64bit\obs64.exe", "${env:ProgramFiles(x86)}\obs-studio\bin\64bit\obs64.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($obs) { Write-Host "✓ OBS Studio                 $obs" } else { Write-Host '! OBS Studio                 bulunamadı: https://obsproject.com/download' }
node araclar/saglik.js
