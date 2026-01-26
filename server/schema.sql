-- Muhasebe Uygulaması PostgreSQL Şeması
-- Bu dosyayı PostgreSQL'de çalıştırarak tabloları oluşturun

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiller tablosu (Önce bunu oluşturmalıyız çünkü kullanıcılar buna referans verecek)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  current_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role VARCHAR(50) DEFAULT 'user',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı-Profil İlişki tablosu (Ortak kullanım için)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, profile_id)
);


-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS kategoriler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad VARCHAR(255) NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cariler tablosu
CREATE TABLE IF NOT EXISTS cariler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad VARCHAR(255) NOT NULL,
  telefon VARCHAR(50) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  adres TEXT DEFAULT '',
  vergi_no VARCHAR(50) DEFAULT '',
  vergi_dairesi VARCHAR(100) DEFAULT '',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürünler tablosu
CREATE TABLE IF NOT EXISTS urunler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad VARCHAR(255) NOT NULL,
  kategori_id UUID REFERENCES kategoriler(id) ON DELETE SET NULL,
  birim VARCHAR(50) DEFAULT 'Adet',
  stok_miktari DECIMAL(15, 2) DEFAULT 0,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satış faturaları tablosu
CREATE TABLE IF NOT EXISTS satis_faturalari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL,
  cari_ad VARCHAR(255) DEFAULT '',
  fatura_no VARCHAR(100) NOT NULL,
  tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tutar DECIMAL(15, 2) DEFAULT 0,
  kdv DECIMAL(15, 2) DEFAULT 0,
  toplam DECIMAL(15, 2) DEFAULT 0,
  durum VARCHAR(50) DEFAULT 'Onaylandı',
  aciklama TEXT DEFAULT '',
  urunler JSONB DEFAULT '[]',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alış faturaları tablosu
CREATE TABLE IF NOT EXISTS alis_faturalari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL,
  cari_ad VARCHAR(255) DEFAULT '',
  fatura_no VARCHAR(100) NOT NULL,
  tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tutar DECIMAL(15, 2) DEFAULT 0,
  kdv DECIMAL(15, 2) DEFAULT 0,
  toplam DECIMAL(15, 2) DEFAULT 0,
  durum VARCHAR(50) DEFAULT 'Onaylandı',
  aciklama TEXT DEFAULT '',
  urunler JSONB DEFAULT '[]',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ödemeler tablosu
CREATE TABLE IF NOT EXISTS odemeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL,
  cari_ad VARCHAR(255) DEFAULT '',
  tip VARCHAR(50) DEFAULT 'Tahsilat',
  tutar DECIMAL(15, 2) NOT NULL,
  tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  odeme_yontemi VARCHAR(50) DEFAULT 'Nakit',
  aciklama TEXT DEFAULT '',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stok hareketleri tablosu
CREATE TABLE IF NOT EXISTS stok_hareketleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urun_id UUID REFERENCES urunler(id) ON DELETE SET NULL,
  urun_ad VARCHAR(255) DEFAULT '',
  hareket_tipi VARCHAR(50) NOT NULL,
  miktar DECIMAL(15, 2) NOT NULL,
  tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aciklama TEXT DEFAULT '',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_cariler_profile_id ON cariler(profile_id);
CREATE INDEX IF NOT EXISTS idx_urunler_profile_id ON urunler(profile_id);
CREATE INDEX IF NOT EXISTS idx_satis_faturalari_profile_id ON satis_faturalari(profile_id);
CREATE INDEX IF NOT EXISTS idx_alis_faturalari_profile_id ON alis_faturalari(profile_id);
CREATE INDEX IF NOT EXISTS idx_odemeler_profile_id ON odemeler(profile_id);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_profile_id ON stok_hareketleri(profile_id);
CREATE INDEX IF NOT EXISTS idx_kategoriler_profile_id ON kategoriler(profile_id);
