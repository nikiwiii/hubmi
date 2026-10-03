@echo off
echo ==============================================
echo   Uruchamianie aplikacji Hubmi (Backend + Front)
echo ==============================================

echo Uruchamianie Backend FastAPI na http://127.0.0.1:8000 ...
start "Hubmi - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\uvicorn.exe main:app --reload --port 8000"

echo Uruchamianie Frontend Next.js na http://localhost:3000 ...
start "Hubmi - Frontend (Next.js)" cmd /k "cd /d %~dp0front && npm run dev"

echo.
echo Oba serwery zostaly uruchomione w oddzielnych oknach!
echo API Docs: http://127.0.0.1:8000/docs
echo Frontend: http://localhost:3000
pause
