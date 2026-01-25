# 🚀 Muhasebe Uygulaması - Kurulum Rehberi

## 📦 Otomatik Kurulum

### 1️⃣ Bağımlılıkları Yükle
```bash
npm install
```

### 2️⃣ Uygulamayı Geliştirme Modunda Çalıştır
```bash
npm run dev
```
*Bu komut hem ön yüzü hem de arka yüzü aynı anda başlatır.*

### 3️⃣ Electron ile Çalıştır (Masaüstü Uygulaması)
```bash
npm run electron:dev
```
*Bu komut her şeyi başlatır ve masaüstü uygulamasını açar.*

### 4️⃣ Kurulum Dosyası Oluştur

**Windows için (.exe):**
```bash
npm run electron:build:win
```

**Mac için (.dmg):**
```bash
npm run electron:build:mac
```

**Linux için (.AppImage):**
```bash
npm run electron:build:linux
```

**Tüm platformlar için:**
```bash
npm run electron:build
```

## 📁 Kurulum Dosyaları

Build işlemi tamamlandığında kurulum dosyaları şurada olacak:
```
dist-electron/
  ├── Muhasebe Uygulaması Setup 1.0.0.exe  (Windows)
  ├── Muhasebe Uygulaması-1.0.0.dmg        (Mac)
  └── Muhasebe Uygulaması-1.0.0.AppImage   (Linux)
```

## ✅ Özellikler

- ✅ Otomatik kurulum
- ✅ Masaüstü kısayolu oluşturma
- ✅ Başlat menüsüne ekleme
- ✅ Çift tıkla çalıştırma
- ✅ Tam ekran ve pencere modu
- ✅ Otomatik güncelleme desteği
- ✅ Hata yakalama ve kurtarma
- ✅ Supabase bağlantısı

## 🎯 Kullanım

1. Kurulum dosyasını çalıştır
2. Kurulum adımlarını takip et
3. Uygulama otomatik olarak başlayacak
4. Masaüstü kısayolundan veya başlat menüsünden açabilirsin

## 🔧 Geliştirme Modu

Geliştirme yaparken:
```bash
npm run electron:dev
```

Bu komut hem web sunucusunu hem de Electron uygulamasını başlatır.

## 📝 Notlar

- Windows için .exe dosyası oluşturulur
- Mac için .dmg dosyası oluşturulur
- Linux için .AppImage dosyası oluşturulur
- Tüm dosyalar `dist-electron` klasöründe olacak
- İlk build işlemi biraz zaman alabilir (bağımlılıklar indiriliyor)

## 🆘 Sorun Giderme

**Eğer build hatası alırsan:**
1. `node_modules` klasörünü sil
2. `npm install` komutunu tekrar çalıştır
3. Build komutunu tekrar dene

**Eğer uygulama açılmazsa:**
1. `.env` dosyasının doğru yapılandırıldığından emin ol
2. Supabase bağlantı bilgilerini kontrol et
3. İnternet bağlantını kontrol et
