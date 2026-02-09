const { query } = require('./db');

async function updateSchema() {
    try {
        console.log('🔄 Veritabanı şeması güncelleniyor (Stok Hareketleri)...');
        await query('ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL');
        await query("ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_ad VARCHAR(255) DEFAULT ''");

        console.log('🔄 Veritabanı şeması güncelleniyor (Ürünler Genişletme)...');
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_tipi VARCHAR(50) DEFAULT 'Ürün'");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_cinsi VARCHAR(100) DEFAULT ''");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_kodu VARCHAR(100) DEFAULT ''");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS urun_barkodu VARCHAR(100) DEFAULT ''");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS alis_fiyati DECIMAL(15, 2) DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS satis_fiyati DECIMAL(15, 2) DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS alis_kdv_dahil BOOLEAN DEFAULT FALSE");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS satis_kdv_dahil BOOLEAN DEFAULT FALSE");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS kdv_orani INTEGER DEFAULT 20");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS otv_orani INTEGER DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS oiv_orani INTEGER DEFAULT 0");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS stok_takibi BOOLEAN DEFAULT TRUE");
        await query("ALTER TABLE urunler ADD COLUMN IF NOT EXISTS stok_uyari_limiti DECIMAL(15, 2) DEFAULT 10");

        console.log('🔄 Veritabanı şeması güncelleniyor (Personel Modülü)...');
        await query(`
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
            )
        `);
        await query(`
             CREATE TABLE IF NOT EXISTS personel_puantaj (
                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                 personel_id UUID REFERENCES personeller(id) ON DELETE CASCADE,
                 tarih DATE NOT NULL,
                 durum VARCHAR(50) DEFAULT 'Geldi',
                 notlar TEXT DEFAULT '',
                 profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                 UNIQUE(personel_id, tarih)
             )
         `);
        await query(`
            CREATE TABLE IF NOT EXISTS personel_avanslar (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                personel_id UUID REFERENCES personeller(id) ON DELETE CASCADE,
                tarih DATE NOT NULL,
                tutar DECIMAL(15, 2) NOT NULL,
                aciklama TEXT DEFAULT '',
                profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('🔄 Veritabanı şeması güncelleniyor (Ücretsiz Deneme)...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE');
        await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE");
        await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card'");
        await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active'");

        console.log('✅ Veritabanı şeması başarıyla güncellendi.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Şema güncelleme hatası:', error);
        process.exit(1);
    }
}

updateSchema();
