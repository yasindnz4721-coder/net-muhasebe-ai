import { query } from './server/db.js';

async function globalSearch() {
    try {
        const searchTerms = ['Ali', 'Keser'];
        const tables = ['personeller', 'cariler', 'odemeler', 'satis_faturalari', 'alis_faturalari', 'giderler'];

        console.log('--- Küresel Arama Başlatıldı ---');

        for (const table of tables) {
            let column = 'ad';
            if (table === 'personeller' || table === 'users') column = 'ad_soyad';
            if (table === 'odemeler' || table === 'satis_faturalari' || table === 'alis_faturalari') column = 'cari_ad';
            if (table === 'giderler') column = 'aciklama';

            const res = await query(`SELECT * FROM ${table} WHERE ${column} ILIKE '%Keser%'`);
            if (res.rows.length > 0) {
                console.log(`\n[${table}] Tablosunda Bulundu:`);
                res.rows.forEach(r => console.log(`- ${r[column]} (ID: ${r.id})`));

                // Eğer bu bir personel veya cari ise işlemlerini say
                const id = res.rows[0].id;
                const counts = await query(
                    `SELECT 
                        (SELECT COUNT(*) FROM odemeler WHERE personel_id = $1 OR cari_id = $1) as o,
                        (SELECT COUNT(*) FROM satis_faturalari WHERE cari_id = $1) as s,
                        (SELECT COUNT(*) FROM alis_faturalari WHERE cari_id = $1) as a`,
                    [id]
                );
                console.log(`  İşlem Sayıları -> Ödemeler: ${counts.rows[0].o}, Satış: ${counts.rows[0].s}, Alış: ${counts.rows[0].a}`);
            }
        }

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        process.exit();
    }
}

globalSearch();
