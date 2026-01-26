const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function forceReset() {
    try {
        console.log('🗑️ Mevcut tablolar siliniyor...');
        const dropTablesQuery = `
            DROP TABLE IF EXISTS stok_hareketleri CASCADE;
            DROP TABLE IF EXISTS odemeler CASCADE;
            DROP TABLE IF EXISTS alis_faturalari CASCADE;
            DROP TABLE IF EXISTS satis_faturalari CASCADE;
            DROP TABLE IF EXISTS urunler CASCADE;
            DROP TABLE IF EXISTS cariler CASCADE;
            DROP TABLE IF EXISTS kategoriler CASCADE;
            DROP TABLE IF EXISTS user_profiles CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS profiles CASCADE;
        `;
        await pool.query(dropTablesQuery);
        console.log('✅ Tablolar silindi.');

        console.log('🏗️ Yeni şema kuruluyor...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Basit split (Semicolon might be inside strings but for schema.sql it's usually safe)
        const commands = schemaSql.split(';').map(c => c.trim()).filter(c => c);
        for (const sql of commands) {
            await pool.query(sql);
        }
        console.log('✅ Yeni şema başarıyla kuruldu!');

    } catch (err) {
        console.error('❌ Hata:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

forceReset();
