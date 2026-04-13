import { query } from './server/db.js';

async function listAllProfilesAndCounts() {
    try {
        console.log('--- Sistem Genel İşlem Dağılımı ---');

        const profiles = await query("SELECT id, name FROM profiles");

        for (const p of profiles.rows) {
            const satis = await query("SELECT COUNT(*) FROM satis_faturalari WHERE profile_id = $1", [p.id]);
            const alis = await query("SELECT COUNT(*) FROM alis_faturalari WHERE profile_id = $1", [p.id]);
            const ödeme = await query("SELECT COUNT(*) FROM odemeler WHERE profile_id = $1", [p.id]);
            const gider = await query("SELECT COUNT(*) FROM giderler WHERE profile_id = $1", [p.id]);

            const total = parseInt(satis.rows[0].count) +
                parseInt(alis.rows[0].count) +
                parseInt(ödeme.rows[0].count) +
                parseInt(gider.rows[0].count);

            if (total > 0) {
                const users = await query(
                    "SELECT u.email FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE up.profile_id = $1",
                    [p.id]
                );
                console.log(`\nProfil: ${p.name} (${p.id})`);
                console.log(`Kullanıcılar: ${users.rows.map(u => u.email).join(', ')}`);
                console.log(`- Satış: ${satis.rows[0].count}`);
                console.log(`- Alış: ${alis.rows[0].count}`);
                console.log(`- Ödemeler: ${ödeme.rows[0].count}`);
                console.log(`- Giderler: ${gider.rows[0].count}`);
                console.log(`TOTAL: ${total}`);
            }
        }

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        process.exit();
    }
}

listAllProfilesAndCounts();
