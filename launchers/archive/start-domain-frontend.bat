@echo off
setlocal
cd /d "%~dp0"
echo Domain config: https://chargeops.online and https://driver.chargeops.online
echo Restart frontend servers to load the updated environment.
start "ChargeOps Domain - Web" cmd /k "cd /d "%~dp0chargeops-web" && npm run dev"
start "ChargeOps Domain - Driver Web" cmd /k "cd /d "%~dp0chargeops-driver-mobile" && npm run web -- --clear"
echo Start the backend in your IDE, then use start-domain-local.bat in the backend repo.
echo Public access requires the Cloudflare DNS and Tunnel setup.
