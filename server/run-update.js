const { query } = require('./db');

async function updateStatuses() {
    try {
        console.log('🔄 Durumlar güncelleniyor...');
        await query("UPDATE satis_faturalari SET durum = 'Onaylandı' WHERE durum IN ('Beklemede', 'Ödendi')");
        await query("UPDATE alis_faturalari SET durum = 'Onaylandı' WHERE durum IN ('Beklemede', 'Ödendi')");
        console.log('✅ Tüm durumlar başarıyla "Onaylandı" olarak güncellendi.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Güncelleme hatası:', error);
        process.exit(1);
    }
}

updateStatuses();
