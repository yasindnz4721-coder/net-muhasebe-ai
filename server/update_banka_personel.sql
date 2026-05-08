-- Veritabanı Güncelleme: Bankalar ve Personel Bakiyesi
-- Bu script mevcut tabloları genişletir

-- 1. Kasalar tablosuna tip ve banka bilgileri ekleme
ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS tip VARCHAR(20) DEFAULT 'Nakit'; -- 'Nakit' veya 'Banka'
ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS banka_adi VARCHAR(255) DEFAULT '';
ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS iban VARCHAR(34) DEFAULT '';
ALTER TABLE kasalar ADD COLUMN IF NOT EXISTS hesap_no VARCHAR(50) DEFAULT '';

-- 2. Personeller tablosuna bakiye ekleme
ALTER TABLE personeller ADD COLUMN IF NOT EXISTS bakiye DECIMAL(15, 2) DEFAULT 0;

-- 3. Ödemeler tablosuna kasa_id ekleme (eğer yoksa)
ALTER TABLE odemeler ADD COLUMN IF NOT EXISTS kasa_id UUID REFERENCES kasalar(id) ON DELETE SET NULL;
