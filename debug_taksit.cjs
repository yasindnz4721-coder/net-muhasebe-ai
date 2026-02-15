const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const profiles = await pool.query("SELECT id, name FROM profiles WHERE name ILIKE '%deneme%'");
        console.log('Profiles found:', profiles.rows);

        if (profiles.rows.length > 0) {
            const pid = profiles.rows[0].id;
            const taksitler = await pool.query('SELECT * FROM taksitler WHERE profile_id = $1', [pid]);
            console.log('Taksitler:', taksitler.rows);

            if (taksitler.rows.length > 0) {
                const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'taksit_odemeleri'");
                console.log('Columns in taksit_odemeleri:', columns.rows);

                const tid = taksitler.rows[0].id;
                const odemeler = await pool.query('SELECT id, vade_tarihi, tutar, durum FROM taksit_odemeleri WHERE taksit_id = $1 ORDER BY vade_tarihi ASC LIMIT 5', [tid]);
                odemeler.rows.forEach(r => {
                    console.log(`ID: ${r.id}, Vade: ${r.vade_tarihi} (${typeof r.vade_tarihi}), Tutar: ${r.tutar}, Durum: ${r.durum}`);
                });
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
