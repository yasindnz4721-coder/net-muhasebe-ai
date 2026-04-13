-- Odemeler tablosuna gider_id ekleme
-- Bu sayede gider silindiğinde ilgili ödeme de silinebilecek

ALTER TABLE odemeler ADD COLUMN IF NOT EXISTS gider_id UUID REFERENCES giderler(id) ON DELETE CASCADE;

-- İndeks ekleyelim (sorgu performansı için)
CREATE INDEX IF NOT EXISTS idx_odemeler_gider_id ON odemeler(gider_id);
