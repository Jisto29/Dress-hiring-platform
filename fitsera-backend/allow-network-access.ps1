# Run this script as Administrator to allow network access to the backend
# Right-click PowerShell → Run as Administrator, then run this script

Write-Host "Adding Windows Firewall rules for Fitsera..." -ForegroundColor Green

# Allow port 8080 (backend)
New-NetFirewallRule -DisplayName "Fitsera Backend (Port 8080)" `
    -Direction Inbound `
    -LocalPort 8080 `
    -Protocol TCP `
    -Action Allow `
    -ErrorAction SilentlyContinue

Write-Host "✓ Port 8080 (backend) allowed" -ForegroundColor Green

# Allow port 5174 (frontend)
New-NetFirewallRule -DisplayName "Fitsera Frontend (Port 5174)" `
    -Direction Inbound `
    -LocalPort 5174 `
    -Protocol TCP `
    -Action Allow `
    -ErrorAction SilentlyContinue

Write-Host "✓ Port 5174 (frontend) allowed" -ForegroundColor Green

Write-Host "`nFirewall rules added successfully!" -ForegroundColor Cyan
Write-Host "Your backend should now be accessible from other devices on your network." -ForegroundColor Cyan
Write-Host "`nAccess URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://192.168.1.203:5174" -ForegroundColor White
Write-Host "  Backend:  http://192.168.1.203:8080" -ForegroundColor White

