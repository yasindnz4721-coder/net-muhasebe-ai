@echo off
CHCP 65001 > nul
echo ===================================================
echo   NET MUHASEBE AI - MASAÜSTÜ KURULUM ARACI (EXE)
echo ===================================================
echo.
echo Bu araç, masaüstü uygulamasını (.exe) senin için üretecek
echo ve sisteme otomatik olarak dahil edecektir.
echo.
cd /d "%~dp0"

echo [1/3] Sistem dosyaları kontrol ediliyor...
echo Önceki build kalıntıları temizleniyor...
if exist "dist-electron" rmdir /s /q dist-electron
IF NOT EXIST "node_modules" (
    echo Bağımlılıklar eksik. Yükleniyor...
    npm install
)

echo [2/3] Masaüstü uygulaması paketleniyor (.exe üretiliyor)...
echo Bu işlem bir dakika sürebilir, lütfen bekleyin...
cmd /c "npm run electron:build"

IF EXIST "dist-electron\NetMuhasebe_AI Setup 1.0.0.exe" (
    echo [3/3] .exe dosyası başarıyla üretildi!
    echo Dashboard'dan indirilebilir hale getiriliyor...
    copy "dist-electron\NetMuhasebe_AI Setup 1.0.0.exe" "public\NetMuhasebe_AI_Kurulum.exe" > nul
    echo.
    echo ===================================================
    echo   İŞLEM TAMAMLANDI! 🚀
    echo.
    echo 1. Masaüstü uygulaman başarıyla üretildi.
    echo 2. Dashboard'daki "Masaüstüne Kur" butonu artık aktif.
    echo 3. Dosyayı 'public' klasöründe görebilirsin.
    echo ===================================================
) ELSE (
    echo.
    echo [!] Hata: .exe dosyası üretilemedi. 
    echo Lütfen terminaldeki hata mesajlarını kontrol et.
)

echo.
pause
