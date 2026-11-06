# Neşe'yi kayıtları kaydettirerek kapatır; cevap vermezse süreci sonlandırır.
Set-Location $PSScriptRoot
$port = 3900
if (Test-Path .env) { $satir = Select-String -Path .env -Pattern '^PORT=(\d+)' | Select-Object -First 1; if ($satir) { $port = [int]$satir.Matches[0].Groups[1].Value } }
try {
  Invoke-RestMethod "http://127.0.0.1:$port/api/olay" -Method Post -Body '{"tur":"kapat"}' -TimeoutSec 3 | Out-Null
  Write-Host 'Kapatma isteği gönderildi.'
} catch { Write-Host 'Sunucu cevap vermedi.' }
Start-Sleep -Seconds 2
$pidDosya = 'kayitlar/nese.pid'
if (Test-Path $pidDosya) {
  $id = Get-Content $pidDosya
  if (Get-Process -Id $id -ErrorAction SilentlyContinue) { Stop-Process -Id $id -Force; Write-Host "Süreç $id sonlandırıldı." }
  Remove-Item $pidDosya -ErrorAction SilentlyContinue
}
Write-Host 'Neşe durdu. Kayıtlar: kayitlar/'
