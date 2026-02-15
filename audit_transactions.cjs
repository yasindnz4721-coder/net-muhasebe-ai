const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function audit() {
    try {
        const pid = '0f4cedf5-4c15-4c5f-a0d2-0a22ec3725b7';

        console.log('--- ALL TRANSACTIONS (ODEMELER TABLE) ---');
        const res = await pool.query('SELECT tip, tutar, aciklama, tarih, created_at FROM odemeler WHERE profile_id = $1 ORDER BY tarih ASC', [pid]);

        let totalGelir = 0;
        let totalGider = 0;

        res.rows.forEach(r => {
            const tutarNum = parseFloat(r.tutar);
            console.log(`[${r.tip}] ${tutarNum} TL - ${r.aciklama} (${r.tarih})`);

            if (['Tahsilat', 'Alınan Ödeme', 'Gelir'].includes(r.tip)) {
                totalGelir += tutarNum;
            } else if (['Ödeme', 'Gider', 'Personel Avansı', 'Taksit Ödemesi'].includes(r.tip)) {
                totalGider += tutarNum;
            } else {
                console.log(`  !! Unknown type: ${r.tip}`);
            }
        });

        console.log('\n--- CALCULATED TOTALS ---');
        console.log(`Total Gelir: ${totalGelir}`);
        console.log(`Total Gider: ${totalGider}`);
        console.log(`Balance: ${totalGelir - totalGider}`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

audit();
