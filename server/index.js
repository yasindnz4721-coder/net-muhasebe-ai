const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // React frontend ile çakışmaması için
    crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Gzip sıkıştırma
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate Limiting (Kötüye kullanımı önlemek için)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 1000, // IP başına limit (1000 isteğe çıkarıldı)
    message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' }
});
app.use('/api/', limiter);

// Frontend dosyalarını sunmak için (Build sonrası)
app.use(express.static(path.join(__dirname, '../out')));

// Routes
const authRoutes = require('./routes/auth');
const carilerRoutes = require('./routes/cariler');
const urunlerRoutes = require('./routes/urunler');
const kategorilerRoutes = require('./routes/kategoriler');
const satisFaturalariRoutes = require('./routes/satis-faturalari');
const alisFaturalariRoutes = require('./routes/alis-faturalari');
const odemelerRoutes = require('./routes/odemeler');
const stokRoutes = require('./routes/stok');
const profilesRoutes = require('./routes/profiles');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/cariler', carilerRoutes);
app.use('/api/urunler', urunlerRoutes);
app.use('/api/kategoriler', kategorilerRoutes);
app.use('/api/satis-faturalari', satisFaturalariRoutes);
app.use('/api/alis-faturalari', alisFaturalariRoutes);
app.use('/api/odemeler', odemelerRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const { pool } = require('./db');
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Sunucu hatası', message: err.message });
});

// Catch-all route (Frontend Client-side routing için)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../out/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server http://0.0.0.0:${PORT} adresinde çalışıyor`);
});
