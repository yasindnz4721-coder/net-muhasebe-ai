@echo off
CHCP 65001 > nul
echo ===================================================
echo   MUHASEBE UYGULAMASI - SISTEM BASLATILIYOR
echo ===================================================
echo.
cd /d "%~dp0"

IF NOT EXIST "node_modules" (
    echo [!] node_modules eksik. Bağımlılıklar yükleniyor...
    cmd /c npm install
)

IF NOT EXIST "server\node_modules" (
    echo [!] Server bağımlılıkları eksik. Yükleniyor...
    cd server && cmd /c npm install && cd ..
)

echo 1. Arka Plan Sunucusu (Backend) başlatılıyor...
start "Muhasebe - Backend" cmd /c "cd server && node --watch index.js || node index.js"

echo 2. Ön Yüz Sunucusu (Frontend) başlatılıyor...
start "Muhasebe - Frontend" cmd /c "node node_modules\vite\bin\vite.js"

echo.
echo ===================================================
echo   Sistemler başlatıldı!
echo   Front-end: http://localhost:3000
echo   Back-end: http://localhost:3001
echo.
echo   Lütfen açılan siyah pencereleri kapatmayın.
echo   Pencerelerden birinde hata varsa, lütfen bana bildirin.
echo ===================================================
timeout /t 10
echo    Sunucu çalışıyor
echo    SUNUCUSU sorunu
timeout /t 10
echo    start   sorunu
timeout /t 10
echo        sorunu gider    

echo    eksik node_modules sorunu
timeout /t 10
echo        sorunu gider    
