@echo off
CHCP 65001 > nul
echo ===================================================
echo   NET MUHASEBE - UYGULAMA BASLATILIYOR
echo ===================================================
echo.

echo Eski süreçler temizleniyor...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1

echo.
echo [1/1] Uygulama ve Sunucular Hazirlaniyor...
cd /d "%~dp0"
npm run electron:dev

echo.
echo Uygulama kapandi.
pause
