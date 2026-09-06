@echo off
title ChargeOps Tailscale Funnel Launcher
echo ===================================================
echo   ChargeOps - Dang kich hoat Tailscale Funnel...
echo ===================================================

echo [1/3] Expose Keycloak (port 8080) -> https://thang.tail704409.ts.net/
tailscale funnel --bg http://127.0.0.1:8080

echo [2/3] Expose Spring Boot API (port 8081) -> https://thang.tail704409.ts.net/api
tailscale funnel --bg --set-path /api http://127.0.0.1:8081/api

echo [3/3] Expose Web Portal (port 5173) -> https://thang.tail704409.ts.net:8443/
tailscale funnel --bg --https=8443 http://localhost:5173

echo.
echo ===================================================
echo   Kiem tra trang thai Tailscale Funnel:
echo ===================================================
tailscale funnel status
echo.
pause
