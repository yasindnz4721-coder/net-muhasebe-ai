import { query } from './server/db.js';

async function checkUserActivity() {
    const email = 'aliahmet344344@gmail.com';
    try {
        console.log(`--- ${email} Aktivite Raporu ---`);

        // 1. Denetim kayıtlarından toplam işlem sayısı (Her türlü ekleme, silme, güncelleme)
        const auditRes = await query(
            "SELECT COUNT(*) as total FROM denetim_kayitlari WHERE kullanici_email = $1",
            [email]
        );
        console.log(`Toplam Denetim Kaydı (İşlem): ${auditRes.rows[0].total}`);

        // 2. Gider tablosunda oluşturduğu kayıtlar
        const giderRes = await query(
            "SELECT COUNT(*) as total FROM giderler WHERE kullanici_email = $1",
            [email]
        );
        console.log(`Toplam Gider Kaydı: ${giderRes.rows[0].total}`);

        // 3. İşlem tiplerine göre dağılım
        const typesRes = await query(
            "SELECT islem_tipi, COUNT(*) as count FROM denetim_kayitlari WHERE kullanici_email = $1 GROUP BY islem_tipi",
            [email]
        );
        if (typesRes.rows.length > 0) {
            console.log('\nİşlem Dağılımı:');
            typesRes.rows.forEach(r => {
                console.log(`- ${r.islem_tipi}: ${r.count}`);
            });
        }

    } catch (error) {
        console.error('Sorgu hatası:', error);
    } finally {
        process.exit();
    }
}

checkUserActivity();
