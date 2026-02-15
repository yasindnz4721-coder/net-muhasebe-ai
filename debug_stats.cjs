const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const pid = '0f4cedf5-4c15-4c5f-a0d2-0a22ec3725b7';
        const stats = await pool.query(`
      SELECT 
        SUM(CASE WHEN tip = 'Tahsilat' THEN tutar ELSE 0 END) as toplam_gelir,
        SUM(CASE WHEN tip = 'Ödeme' THEN tutar ELSE 0 END) as toplam_gider
      FROM odemeler WHERE profile_id = $1
    `, [pid]);
        console.log('Transaction Stats:', stats.rows[0]);

        const latest = await pool.query('SELECT * FROM odemeler WHERE profile_id = $1 ORDER BY created_at DESC LIMIT 5', [pid]);
        console.log('Latest Transactions:', latest.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
