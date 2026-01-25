const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Bağlantı testi ve Otomatik Yeniden Bağlanma
const connectWithRetry = async () => {
  console.log('🔄 Veritabanına bağlanılıyor...');
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL veritabanına başarıyla bağlandı');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL bağlantı hatası! 5 saniye içinde tekrar denenecek...', err.message);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

pool.on('error', (err) => {
  console.error('❌ Beklenmedik havuz hatası:', err);
  if (err.code === '57P01') { // Admin shutdown
    connectWithRetry();
  }
});

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query:', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query hatası:', error);
    throw error;
  }
};

module.exports = { pool, query };
