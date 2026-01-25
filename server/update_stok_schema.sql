-- Stok hareketleri tablosuna cari bilgilerini ekle
ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL;
ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_ad VARCHAR(255) DEFAULT '';

-- Mevcut 'Giriş' ve 'Çıkış' tiplerine ek olarak 'Üretim' tipi de desteklenecek.
-- Mevcut verilerde cari bilgisi boş kalabilir.
