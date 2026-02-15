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
            const kasalar = await pool.query('SELECT * FROM kasalar WHERE profile_id = $1', [pid]);
            console.log('Kasalar:', kasalar.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
