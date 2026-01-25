
const { Client } = require('pg');
require('dotenv').config();

// Varsayılan postgres veritabanına bağlan
const connectionString = process.env.DATABASE_URL.replace('/muhasebe', '/postgres');

const client = new Client({
    connectionString: connectionString,
});

async function createDatabase() {
    try {
        console.log('PostgreSQL sunucusuna bağlanılıyor...');
        await client.connect();

        console.log("'muhasebe' veritabanı kontrol ediliyor...");

        // Veritabanı var mı kontrol et
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'muhasebe'");

        if (res.rowCount === 0) {
            console.log("'muhasebe' veritabanı oluşturuluyor...");
            // Veritabanını oluştur
            await client.query('CREATE DATABASE muhasebe');
            console.log("'muhasebe' veritabanı başarıyla oluşturuldu!");
        } else {
            console.log("'muhasebe' veritabanı zaten mevcut.");
        }

    } catch (err) {
        console.error('Veritabanı oluşturma hatası:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
