const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migration_shared_accounts.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Migration başlatılıyor...');
        await pool.query(sql);
        console.log('✅ Migration başarıyla tamamlandı!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration hatası:', err);
        process.exit(1);
    }
}

runMigration();
