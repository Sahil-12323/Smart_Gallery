@echo off
title AI Gallery Launcher
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║       AI Gallery v2.0 Launcher       ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Choose how to run the frontend:
echo.
echo  [1] TUNNEL    - Works everywhere, no IP needed (RECOMMENDED)
echo  [2] LAN       - Fast, phone must be on same WiFi
echo  [3] USB/Local - Requires ADB USB debugging
echo.
set /p choice="Enter 1, 2, or 3: "

if "%choice%"=="1" goto tunnel
if "%choice%"=="2" goto lan
if "%choice%"=="3" goto local
goto tunnel

:tunnel
echo.
echo  Starting backend + tunnel...
echo.
start "AI Gallery Backend" cmd /k "cd /d %~dp0backend && uvicorn server:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
cd /d %~dp0frontend
echo  Scan the QR code that appears with Expo Go on your phone.
echo  Make sure EXPO_PUBLIC_BACKEND_URL is set to your tunnel/LAN URL in .env
echo.
npx expo start --tunnel
goto end

:lan
echo.
echo  Your PC's IP addresses:
ipconfig | findstr "IPv4"
echo.
echo  Copy the IP above and set it in frontend\.env as:
echo  EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:8000
echo.
pause
start "AI Gallery Backend" cmd /k "cd /d %~dp0backend && uvicorn server:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
cd /d %~dp0frontend
npx expo start --lan
goto end

:local
echo.
echo  Forwarding ports via ADB (USB debugging)...
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
start "AI Gallery Backend" cmd /k "cd /d %~dp0backend && uvicorn server:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
cd /d %~dp0frontend
npx expo start
goto end

:end
