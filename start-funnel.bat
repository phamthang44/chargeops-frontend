@echo off
title ChargeOps Tailscale Funnel Launcher
echo ===================================================
echo   ChargeOps - Dang kich hoat Tailscale Funnel...
echo ===================================================

echo [1/5] Expose Mobile Driver Web (port 8082) -> https://thang.tail704409.ts.net/
tailscale funnel --bg http://localhost:8082

echo [2/5] Expose Spring Boot API (port 8081) -> https://thang.tail704409.ts.net/api
tailscale funnel --bg --set-path /api http://127.0.0.1:8081/api

echo [3/5] Expose Keycloak Auth Realms (port 8080) -> https://thang.tail704409.ts.net/realms
tailscale funnel --bg --set-path /realms http://127.0.0.1:8080/realms

echo [4/5] Expose Keycloak Resources & JS (port 8080) -> https://thang.tail704409.ts.net/resources, /js
tailscale funnel --bg --set-path /resources http://127.0.0.1:8080/resources
tailscale funnel --bg --set-path /js http://127.0.0.1:8080/js

echo [5/5] Expose Web Portal (port 5173) -> https://thang.tail704409.ts.net:8443/
tailscale funnel --bg --https=8443 http://localhost:5173

echo.
echo ===================================================
echo   Kiem tra trang thai Tailscale Funnel:
echo ===================================================
tailscale funnel status
echo.
pause
