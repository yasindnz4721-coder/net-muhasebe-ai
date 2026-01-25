# 🚀 NetMuhasebe.ai - Paylaşım Rehberi

Bu uygulama artık profesyonel bir paket haline getirildi. Başka bir bilgisayarda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

## 📦 Kurulum Dosyasını Oluşturma
Uygulamayı bir `.exe` haline getirmek için şu komutu kullanın:
```bash
npm run electron:build:win
```
Bu işlem sonunda `dist_electron` klasörü içinde **"Net Muhasebe Setup 1.0.0.exe"** adlı bir dosya oluşacaktır.

## 🔗 Başka Bilgisayarda Çalıştırma Şartları

### 1. Veritabanı (Kritik)
Şu anki sisteminiz **Yerel PostgreSQL** kullanmaktadır. Başka bir bilgisayarda çalışması için iki seçeneğiniz var:

*   **Seçenek A (Bulut Veritabanı - Tavsiye Edilen):** Veritabanınızı internete (Supabase, Neon vb.) taşıyarak uygulamanın her yerde anında çalışmasını sağlayabilirsiniz. Bana "Veritabanını Buluta Taşı" derseniz bunu yapabilirim.
*   **Seçenek B (Yerel Kurulum):** Uygulamayı kurduğunuz her bilgisayarda PostgreSQL yüklü olmalı ve şema (tablolar) oluşturulmalıdır.

## 📂 Dosyaları Gönderme
Sadece oluşturduğunuz `.exe` dosyasını arkadaşınıza veya müşterinize göndermeniz yeterlidir. O dosyaya çift tıkladıklarında uygulama bilgisayarlarına kurulacaktır.

---
*Net Muhasebe - Geleceğin Muhasebe Çözümü*
