@echo off
title ChargeOps Frontend Dev Launcher
set "ROOT_DIR=%~dp0"

echo =====================================================================
echo                CHARGEOPS - KHOI DONG FRONTEND DEV
echo =====================================================================
echo.
echo [!] Dang khoi chay cac server frontend (da loai bo marketing):
echo.

:: 1. Khoi chay ChargeOps Web (Operator & Admin Console)
echo [1/2] Khoi dong ChargeOps Web Console (Vite - Port 5173)...
start "ChargeOps - Web Console (Port 5173)" cmd /k "cd /d "%ROOT_DIR%chargeops-web" && echo Dang chay Web Console... && npm run dev"

:: 2. Khoi chay ChargeOps Driver Mobile (Expo Metro)
echo [2/2] Khoi dong Driver Mobile App (Expo Metro - Port 8082)...
start "ChargeOps - Driver Mobile (Expo Port 8082)" cmd /k "cd /d "%ROOT_DIR%chargeops-driver-mobile" && echo Dang chay Driver Mobile... && npm start"

echo.
echo =====================================================================
echo                      CAC SERVER DA DUOC KHOI CHAY!
echo =====================================================================
echo * Web Console (Vite):         http://localhost:5173
echo * Driver Mobile (Expo Metro): http://localhost:8082
echo.
echo * Ghi chu:
echo   - 2 cua so CMD rieng biet da duoc mo de chay song song 2 server.
echo   - Tren cua so Driver Mobile, ban co the:
echo       + Quet ma QR bang app Expo Go (SDK 54) tren dien thoai.
echo       + Nhan phim 'w' de mo ban Web tren trinh duyet.
echo       + Nhan phim 'a' de mo tren Android Emulator (neu co).
echo   - Neu muon mo cong ra Internet de test tren iPhone/Tailscale,
echo     hay chay them file: start-funnel.bat
echo =====================================================================
echo.
pause
