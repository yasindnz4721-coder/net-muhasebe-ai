-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS bildirimler (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
    baslik VARCHAR(255) NOT NULL,
    mesaj TEXT NOT NULL,
    tip VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    okundu BOOLEAN DEFAULT FALSE,
    olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bildirimler_profile_id ON bildirimler(profile_id);
CREATE INDEX IF NOT EXISTS idx_bildirimler_okundu ON bildirimler(okundu);
