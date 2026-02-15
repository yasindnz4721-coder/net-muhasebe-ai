const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function sync() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pid = '0f4cedf5-4c15-4c5f-a0d2-0a22ec3725b7'; // deneme profili

        // 1. Varsayılan kasayı bul
        const kasaRes = await client.query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [pid]);
        if (kasaRes.rows.length === 0) {
            console.log('Varsayılan kasa bulunamadı!');
            return;
        }
        const kid = kasaRes.rows[0].id;
        console.log('Main cash register ID:', kid);

        // 2. kasa_id'si null olanları ana kasaya bağla
        const updateRes = await client.query('UPDATE odemeler SET kasa_id = $1 WHERE profile_id = $2 AND kasa_id IS NULL', [kid, pid]);
        console.log(`Updated ${updateRes.rowCount} transactions with kasa_id.`);

        // 3. Bakiyeyi yeniden hesapla
        const statsRes = await client.query(`
      SELECT 
        SUM(CASE WHEN tip IN ('Tahsilat', 'Alınan Ödeme', 'Gelir') THEN tutar ELSE 0 END) as gelir,
        SUM(CASE WHEN tip IN ('Ödeme', 'Gider') THEN tutar ELSE 0 END) as gider
      FROM odemeler WHERE kasa_id = $1
    `, [kid]);

        const bakiye = parseFloat(statsRes.rows[0].gelir || 0) - parseFloat(statsRes.rows[0].gider || 0);
        console.log(`Calculated Balance: ${bakiye}`);

        // 4. Kasayı güncelle
        await client.query('UPDATE kasalar SET bakiye = $1, updated_at = NOW() WHERE id = $2', [bakiye, kid]);
        console.log('Cash register balance updated successfully.');

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

sync();
