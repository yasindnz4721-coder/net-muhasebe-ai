const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const pid = '0f4cedf5-4c15-4c5f-a0d2-0a22ec3725b7';
        const status = await pool.query('SELECT id, vade_tarihi, durum FROM taksit_odemeleri WHERE profile_id = $1 ORDER BY vade_tarihi ASC', [pid]);
        console.log('Taksit Odemeleri Status:');
        status.rows.forEach(r => {
            console.log(`Vade: ${r.vade_tarihi.toISOString()}, Durum: ${r.durum}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
