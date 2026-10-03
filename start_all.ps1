Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   Uruchamianie aplikacji Hubmi (Backend + Front)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Uruchamianie Backend FastAPI na http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\.venv\Scripts\uvicorn.exe main:app --reload --port 8000"

Write-Host "Uruchamianie Frontend Next.js na http://localhost:3000 ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$root\front`" && npm run dev"

Write-Host ""
Write-Host "Oba serwery zostaly uruchomione w oddzielnych oknach!" -ForegroundColor Yellow
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
