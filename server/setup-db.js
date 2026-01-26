const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupDatabase() {
    try {
        console.log('Veritabanına bağlanılıyor...');

        // Schema dosyasını oku
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Tablolar ve şema kuruluyor...');

        // SQL komutlarını noktalı virgül ile ayır (basit bir ayırma)
        const commands = schemaSql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        for (const sql of commands) {
            try {
                await pool.query(sql);
            } catch (err) {
                // Eğer zaten varsa hatayı yoksay
                if (err.code === '42P07' || err.code === '42710') {
                    // 42P07: relation already exists, 42710: extension/index already exists
                    continue;
                }
                console.error(`Sorgu hatası:`, err.message);
            }
        }

        console.log('Veritabanı kurulumu/güncellemesi tamamlandı!');
    } catch (err) {
        console.error('Genel kurulum hatası:', err);
    } finally {
        await pool.end();
    }
}

setupDatabase();
