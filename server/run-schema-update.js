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

        console.log('✅ Veritabanı şeması başarıyla güncellendi.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Şema güncelleme hatası:', error);
        process.exit(1);
    }
}

updateSchema();
