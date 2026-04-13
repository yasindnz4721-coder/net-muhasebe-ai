import { query } from './server/db.js';

async function searchInTransactions() {
    try {
        console.log('--- İşlem Kayıtlarında Arama ---');

        // 1. Ödemeler tablosunda cari_ad veya aciklama içinde ara
        const oRes = await query(
            "SELECT COUNT(*) as count FROM odemeler WHERE cari_ad ILIKE '%Ali Keser%' OR aciklama ILIKE '%Ali Keser%'"
        );
        console.log(`Ödemelerdeki eşleşme sayısı: ${oRes.rows[0].count}`);

        // 2. Satış faturalarında ara
        const sRes = await query(
            "SELECT COUNT(*) as count FROM satis_faturalari WHERE cari_ad ILIKE '%Ali Keser%' OR aciklama ILIKE '%Ali Keser%'"
        );
        console.log(`Satış Faturalarındaki eşleşme sayısı: ${sRes.rows[0].count}`);

        // 3. Alış faturalarında ara
        const aRes = await query(
            "SELECT COUNT(*) as count FROM alis_faturalari WHERE cari_ad ILIKE '%Ali Keser%' OR aciklama ILIKE '%Ali Keser%'"
        );
        console.log(`Alış Faturalarındaki eşleşme sayısı: ${aRes.rows[0].count}`);

        if (oRes.rows[0].count > 0 || sRes.rows[0].count > 0 || aRes.rows[0].count > 0) {
            const details = await query(
                "SELECT 'Ödeme' as tip, tutar, tarih, aciklama FROM odemeler WHERE cari_ad ILIKE '%Ali Keser%' OR aciklama ILIKE '%Ali Keser%' " +
                "UNION ALL " +
                "SELECT 'Satış' as tip, toplam as tutar, tarih, aciklama FROM satis_faturalari WHERE cari_ad ILIKE '%Ali Keser%' OR aciklama ILIKE '%Ali Keser%' " +
                "ORDER BY tarih DESC"
            );
            console.log('\n--- İşlem Detayları ---');
            details.rows.forEach(r => {
                console.log(`[${r.tip}] ${r.tarih.toISOString().split('T')[0]} - ${r.tutar} TL - ${r.aciklama}`);
            });
        } else {
            // Hiç bulunamazsa "Ali" ve "Keser" olarak ayrı ayrı ara
            const aliRes = await query("SELECT COUNT(*) FROM odemeler WHERE cari_ad ILIKE '%Ali%' OR aciklama ILIKE '%Ali%'");
            const keserRes = await query("SELECT COUNT(*) FROM odemeler WHERE cari_ad ILIKE '%Keser%' OR aciklama ILIKE '%Keser%'");
            console.log(`\n"Ali" geçen işlem sayısı: ${aliRes.rows[0].count}`);
            console.log(`"Keser" geçen işlem sayısı: ${keserRes.rows[0].count}`);
        }

    } catch (error) {
        console.error('Sorgu hatası:', error);
    } finally {
        process.exit();
    }
}

searchInTransactions();
