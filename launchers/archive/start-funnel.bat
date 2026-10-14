@echo off
setlocal
title ChargeOps Tailscale Funnel Launcher
set "BACKEND_DIR=%~dp0..\chargeops-backend\chargeops"

echo ===================================================
echo   ChargeOps - Single Gateway + Tailscale Funnel
echo ===================================================

echo [1/4] Starting NGINX gateway on http://127.0.0.1:8088 ...
docker compose --project-directory "%BACKEND_DIR%" -f "%BACKEND_DIR%\docker-compose.yml" up -d gateway
if errorlevel 1 goto :error

echo [2/4] Checking gateway health ...
powershell -NoProfile -Command "$response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8088/healthz' -TimeoutSec 10; if ($response.StatusCode -ne 200) { exit 1 }"
if errorlevel 1 goto :error

echo [3/4] Configuring Tailscale Funnel: Gateway (443) + Mobile Web (8443) ...
tailscale funnel reset
if errorlevel 1 goto :error
tailscale funnel --bg --https=443 http://127.0.0.1:8088
if errorlevel 1 goto :error
tailscale funnel --bg --https=8443 http://localhost:8082
if errorlevel 1 goto :error

echo [4/4] Funnel status:
tailscale funnel status
echo.
echo ===================================================
echo   Public URLs
echo   Web Portal:             https://thang.tail704409.ts.net/
echo   Backend API:            https://thang.tail704409.ts.net/api/
echo   Keycloak OIDC:          https://thang.tail704409.ts.net/realms/
echo   Grafana Dashboard:      https://thang.tail704409.ts.net/grafana/
echo   Driver Mobile (Web):    https://thang.tail704409.ts.net:8443/
echo ===================================================
echo.
echo NOTE: Vite must listen on 5173, Backend on 8081, and Mobile on 8082.
pause
exit /b 0

:error
echo.
echo [ERROR] Gateway/Funnel setup failed. Check Docker, Vite, backend and Tailscale.
pause
exit /b 1
