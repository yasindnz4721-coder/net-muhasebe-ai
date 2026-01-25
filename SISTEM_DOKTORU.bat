@echo off
CHCP 65001 > nul
echo ===================================================
echo   MUHASEBE UYGULAMASI - SISTEM DOKTORU
echo ===================================================
echo.

echo [1/4] Node.js Kontrolü...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js yüklü değil veya yolda (PATH) bulunamadı!
) else (
    echo [TAMAM] Node.js hazır.
)

echo [2/4] Sunucu Portu (3001) Kontrolü...
netstat -ano | findstr :3001 > nul 2>&1
if %errorlevel% neq 0 (
    echo [DIKKAT] Backend sunucusu (3001) şu an çalışmıyor.
) else (
    echo [TAMAM] Backend sunucusu aktif.
)

echo [3/4] Arayüz Portu (3000) Kontrolü...
netstat -ano | findstr :3000 > nul 2>&1
if %errorlevel% neq 0 (
    echo [DIKKAT] Frontend arayüzü (3000) şu an çalışmıyor.
) else (
    echo [TAMAM] Frontend arayüzü aktif.
)

echo [4/4] Veritabanı Bağlantı Testi...
curl -s http://localhost:3001/api/health | findstr /i "connected" > nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Veritabanı bağlantısı kurulamadı! 
    echo        Lütfen PostgreSQL servisinin çalıştığından emin olun.
) else (
    echo [TAMAM] Veritabanı bağlantısı sağlıklı.
)

echo.
echo ===================================================
echo   Teşhis Tamamlandı!
echo ===================================================
echo.
pause
