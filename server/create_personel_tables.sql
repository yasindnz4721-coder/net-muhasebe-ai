-- Personel ve Puantaj tablolarını oluşturma
-- Cari AI sistemiyle uyumlu modül genişletmesi

-- Personeller tablosu
CREATE TABLE IF NOT EXISTS personeller (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_soyad VARCHAR(255) NOT NULL,
  unvan VARCHAR(255) DEFAULT '',
  tckn VARCHAR(11) DEFAULT '',
  telefon VARCHAR(50) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  adres TEXT DEFAULT '',
  ise_giris_tarihi DATE DEFAULT CURRENT_DATE,
  maas DECIMAL(15, 2) DEFAULT 0,
  iban VARCHAR(34) DEFAULT '',
  durum VARCHAR(50) DEFAULT 'Aktif',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personel Puantaj tablosu (Günlük takip)
CREATE TABLE IF NOT EXISTS personel_puantaj (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personel_id UUID REFERENCES personeller(id) ON DELETE CASCADE,
  tarih DATE NOT NULL,
  durum VARCHAR(50) DEFAULT 'Geldi', -- 'Geldi', 'Gelmedi', 'İzinli', 'Raporlu'
  notlar TEXT DEFAULT '',
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personel_id, tarih)
);

CREATE INDEX IF NOT EXISTS idx_personeller_profile_id ON personeller(profile_id);
CREATE INDEX IF NOT EXISTS idx_personel_puantaj_personel_id ON personel_puantaj(personel_id);
CREATE INDEX IF NOT EXISTS idx_personel_puantaj_tarih ON personel_puantaj(tarih);
