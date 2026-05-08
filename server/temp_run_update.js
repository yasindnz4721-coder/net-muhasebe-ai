const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runUpdate() {
    try {
        const sqlPath = path.join(__dirname, 'update_banka_personel.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Veritabanı güncellemesi başlatılıyor...');
        await pool.query(sql);
        console.log('✅ Veritabanı başarıyla güncellendi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Güncelleme hatası:', err);
        process.exit(1);
    }
}

runUpdate();
