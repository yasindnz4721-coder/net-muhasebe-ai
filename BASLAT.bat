@echo off
CHCP 65001 > nul
echo ===================================================
echo   MUHASEBE UYGULAMASI - TAM SISTEM BASLATICI
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/3] Backend (Arka Plan) Hazırlanıyor...
:: Backend'i ayrı bir pencerede ve döngü içinde başlat
start "MUHASEBE - BACKEND SUNUCUSU" cmd /k "echo BACKEND BASLATILIYOR... && :loop && cd server && node index.js && echo BACKEND COKTU! 5 saniyede yeniden basliyor... && timeout /t 5 && goto loop"

timeout /t 2 > nul

echo [2/3] Frontend (Arayüz) Hazırlanıyor...
:: Frontend'i ayrı bir pencerede ve döngü içinde başlat
start "MUHASEBE - FRONTEND ARAYUZU" cmd /k "echo FRONTEND BASLATILIYOR... && :loop && node node_modules\vite\bin\vite.js --port 3000 && echo FRONTEND COKTU! 5 saniyede yeniden basliyor... && timeout /t 5 && goto loop"

echo [3/3] Kontroller yapılıyor...
timeout /t 5 > nul

echo.
echo ===================================================
echo   ISLEM TAMAM! 
echo.
echo   1. Backend Penceresi: Sunucu ve Veritabanı durumu
echo   2. Frontend Penceresi: Arayüz durumu
echo.
echo   Lutfen bu pencereleri KAPATMAYIN.
echo   Kapatırsanız program çalışmaz.
echo.
echo   Uygulama Adresi: http://localhost:3000
echo ===================================================
echo.
pause
