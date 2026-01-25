const { query } = require('./db');

async function updateSchema() {
    try {
        console.log('🔄 Veritabanı şeması güncelleniyor (Stok Hareketleri)...');
        await query('ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_id UUID REFERENCES cariler(id) ON DELETE SET NULL');
        await query("ALTER TABLE stok_hareketleri ADD COLUMN IF NOT EXISTS cari_ad VARCHAR(255) DEFAULT ''");
        console.log('✅ Veritabanı şeması başarıyla güncellendi.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Şema güncelleme hatası:', error);
        process.exit(1);
    }
}

updateSchema();
