const express = require('express');
const { query } = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Sadece admin erişebilir
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    next();
};

// Tüm kullanıcıları ve şirketlerini getir
router.get('/users', adminOnly, async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                u.id, 
                u.email, 
                u.role, 
                u.subscription_tier, 
                u.is_approved,
                u.payment_method,
                u.created_at,
                p.name as company_name
            FROM users u
            LEFT JOIN profiles p ON u.current_profile_id = p.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Admin kullanıcı listeleme hatası:', error);
        res.status(500).json({ error: 'Kullanıcı listesi alınamadı' });
    }
});

// Sistem istatistikleri
router.get('/stats', adminOnly, async (req, res) => {
    try {
        const usersCount = await query('SELECT COUNT(*) FROM users');
        const profilesCount = await query('SELECT COUNT(*) FROM profiles');
        const invoicesCount = await query(`SELECT 
            (SELECT COUNT(*) FROM satis_faturalari) +
            (SELECT COUNT(*) FROM alis_faturalari) as total`);


        res.json({
            users: parseInt(usersCount.rows[0].count),
            profiles: parseInt(profilesCount.rows[0].count),
            totalInvoices: parseInt(invoicesCount.rows[0].total)
        });
    } catch (error) {
        console.error('Admin istatistik hatası:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
});

// Kullanıcı onayla
router.post('/approve-user', adminOnly, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });

        await query('UPDATE users SET is_approved = TRUE WHERE id = $1', [userId]);
        res.json({ message: 'Kullanıcı başarıyla onaylandı' });
    } catch (error) {
        console.error('Kullanıcı onaylama hatası:', error);
        res.status(500).json({ error: 'Kullanıcı onaylanamadı' });
    }
});

// Kullanıcı sil
router.delete('/users/:userId', adminOnly, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'Kullanıcı ID gerekli' });

        // Admin kendisini silemesin
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
        }

        await query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
        console.error('Kullanıcı silme hatası:', error);
        res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
});

// Yeni kullanıcı oluştur (Admin Kontrollü)
router.post('/create-user', adminOnly, async (req, res) => {
    try {
        const { email, password, companyName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
        }

        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const profileId = crypto.randomUUID();
        const profileName = companyName || email.split('@')[0];

        // 1. Profil oluştur
        await query(
            'INSERT INTO profiles (id, name, logo_url) VALUES ($1, $2, $3)',
            [profileId, profileName, '']
        );

        // 2. Kullanıcı oluştur
        const userResult = await query(
            'INSERT INTO users (email, password_hash, current_profile_id, subscription_tier, is_approved, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [email.toLowerCase(), passwordHash, profileId, 'pro', true, 'user']
        );

        const userId = userResult.rows[0].id;

        // 3. Kullanıcı-Profil ilişkisi
        await query(
            'INSERT INTO user_profiles (user_id, profile_id) VALUES ($1, $2)',
            [userId, profileId]
        );

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: { id: userId, email: email.toLowerCase() }
        });
    } catch (error) {
        console.error('Admin kullanıcı oluşturma hatası:', error);
        res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
    }
});

module.exports = router;
