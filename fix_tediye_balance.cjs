const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pid = '0f4cedf5-4c15-4c5f-a0d2-0a22ec3725b7';

        const kasaRes = await client.query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [pid]);
        const kid = kasaRes.rows[0].id;

        // Tediye, Odeme, Gider, Personel Avansi, Taksit Odemesi tiplerini GIDER sayiyoruz
        const statsRes = await client.query(`
      SELECT 
        SUM(CASE WHEN tip IN ('Tahsilat', 'Alınan Ödeme', 'Gelir') THEN tutar ELSE 0 END) as gelir,
        SUM(CASE WHEN tip IN ('Ödeme', 'Gider', 'Tediye', 'Personel Avansı', 'Taksit Ödemesi') THEN tutar ELSE 0 END) as gider
      FROM odemeler WHERE profile_id = $1
    `, [pid]);

        const gelir = parseFloat(statsRes.rows[0].gelir || 0);
        const gider = parseFloat(statsRes.rows[0].gider || 0);
        const bakiye = gelir - gider;

        console.log(`Gelir: ${gelir}, Gider: ${gider}, New Balance: ${bakiye}`);

        // Kasayi guncelle
        await client.query('UPDATE kasalar SET bakiye = $1, updated_at = NOW() WHERE id = $2', [bakiye, kid]);

        // Eksik kasa_id'leri tamamla
        await client.query('UPDATE odemeler SET kasa_id = $1 WHERE profile_id = $2 AND kasa_id IS NULL', [kid, pid]);

        await client.query('COMMIT');
        console.log('✅ Balance synchronized successfully to ' + bakiye);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
