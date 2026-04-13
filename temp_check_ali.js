import { query } from './server/db.js';

async function checkAliKeser() {
    try {
        console.log('--- Ali Keser Genişletilmiş Sorgu ---');

        // 1. Personel olarak ara (Daha esnek)
        const pRes = await query("SELECT id, ad_soyad FROM personeller WHERE ad_soyad ILIKE '%Ali%' OR ad_soyad ILIKE '%Keser%'");
        console.log('Benzer Personeller:', pRes.rows);

        // 2. Cari olarak ara (Daha esnek)
        const cRes = await query("SELECT id, ad FROM cariler WHERE ad ILIKE '%Ali%' OR ad ILIKE '%Keser%'");
        console.log('Benzer Cariler:', cRes.rows);

        // 3. User olarak ara
        const uRes = await query("SELECT id, email FROM users WHERE email ILIKE '%Ali%' OR email ILIKE '%Keser%'");
        console.log('Benzer Users:', uRes.rows);

        // Eğer Ali Keser tam eşleşme ile bulunursa detayları dök
        const exactMatch = [...pRes.rows, ...cRes.rows].find(r =>
            (r.ad_soyad && r.ad_soyad.toLowerCase().includes('ali keser')) ||
            (r.ad && r.ad.toLowerCase().includes('ali keser'))
        );

        if (exactMatch) {
            const id = exactMatch.id;
            console.log(`\n--- ${exactMatch.ad_soyad || exactMatch.ad} için Detaylar ---`);

            // İşlemleri say
            const oCount = await query("SELECT COUNT(*) FROM odemeler WHERE personel_id = $1 OR cari_id = $1", [id]);
            const sCount = await query("SELECT COUNT(*) FROM satis_faturalari WHERE cari_id = $1", [id]);
            const alCount = await query("SELECT COUNT(*) FROM alis_faturalari WHERE cari_id = $1", [id]);

            console.log(`- Ödemeler/Tahsilatlar: ${oCount.rows[0].count}`);
            console.log(`- Satış Faturaları: ${sCount.rows[0].count}`);
            console.log(`- Alış Faturaları: ${alCount.rows[0].count}`);
        } else {
            console.log('\n"Ali Keser" isminde tam eşleşme bulunamadı. Yukarıdaki listeyi kontrol edin.');
        }

    } catch (error) {
        console.error('Sorgu hatası:', error);
    } finally {
        process.exit();
    }
}

checkAliKeser();
