const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const profile_id = '0f4cedf5-4c15-4c5f-a0d2-0a22ec3725b7';

        // Simulating upcoming=true query
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sql = `
        SELECT o.*, t.cari_ad, t.aciklama as plan_aciklama 
        FROM taksit_odemeleri o
        JOIN taksitler t ON o.taksit_id = t.id
        WHERE o.profile_id = $1 AND o.vade_tarihi <= $2 AND o.durum = 'Bekliyor'
        ORDER BY o.vade_tarihi ASC
    `;
        const params = [profile_id, endDate];

        console.log('Running query with params:', params);
        const res = await pool.query(sql, params);
        console.log('Results count:', res.rows.length);
        res.rows.forEach(r => {
            console.log(`Vade: ${r.vade_tarihi}, Cari: ${r.cari_ad}, Durum: ${r.durum}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
