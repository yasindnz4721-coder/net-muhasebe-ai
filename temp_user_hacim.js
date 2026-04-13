import { query } from './server/db.js';

async function checkUserHacim() {
    const email = 'aliahmet344344@gmail.com';
    try {
        console.log(`--- ${email} Kapsamlı Analiz ---`);

        // 1. Kullanıcıyı ve Profilini Bul
        const userRes = await query(
            "SELECT u.id, up.profile_id FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE u.email ILIKE $1",
            [email]
        );

        if (userRes.rows.length === 0) {
            console.log('Kullanıcı bulunamadı.');
            process.exit();
        }

        const profileIds = userRes.rows.map(r => r.profile_id);
        console.log(`Bağlı Profil Sayısı: ${profileIds.length}`);

        for (const pid of profileIds) {
            console.log(`\nProfil ID: ${pid} için istatistikler:`);

            const satis = await query("SELECT COUNT(*) FROM satis_faturalari WHERE profile_id = $1", [pid]);
            const alis = await query("SELECT COUNT(*) FROM alis_faturalari WHERE profile_id = $1", [pid]);
            const ödeme = await query("SELECT COUNT(*) FROM odemeler WHERE profile_id = $1", [pid]);
            const stok = await query("SELECT COUNT(*) FROM stok_hareketleri WHERE profile_id = $1", [pid]);
            const personel = await query("SELECT COUNT(*) FROM personeller WHERE profile_id = $1", [pid]);
            const cari = await query("SELECT COUNT(*) FROM cariler WHERE profile_id = $1", [pid]);
            const gider = await query("SELECT COUNT(*) FROM giderler WHERE profile_id = $1", [pid]);

            console.log(`- Satış Faturaları: ${satis.rows[0].count}`);
            console.log(`- Alış Faturaları: ${alis.rows[0].count}`);
            console.log(`- Ödemeler / Tahsilatlar: ${ödeme.rows[0].count}`);
            console.log(`- Stok Hareketleri: ${stok.rows[0].count}`);
            console.log(`- Personel Kayıtları: ${personel.rows[0].count}`);
            console.log(`- Cari Kayıtları: ${cari.rows[0].count}`);
            console.log(`- Gider Kayıtları: ${gider.rows[0].count}`);

            const toplam = parseInt(satis.rows[0].count) +
                parseInt(alis.rows[0].count) +
                parseInt(ödeme.rows[0].count) +
                parseInt(stok.rows[0].count);

            console.log(`TOTAL ANA İŞLEM: ${toplam}`);
        }

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        process.exit();
    }
}

checkUserHacim();
