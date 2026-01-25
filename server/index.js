const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

app.use('/api/auth', authRoutes);
app.use('/api/cariler', carilerRoutes);
app.use('/api/urunler', urunlerRoutes);
app.use('/api/kategoriler', kategorilerRoutes);
app.use('/api/satis-faturalari', satisFaturalariRoutes);
app.use('/api/alis-faturalari', alisFaturalariRoutes);
app.use('/api/odemeler', odemelerRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/profiles', profilesRoutes);

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
