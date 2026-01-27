const express = require('express');
const { query } = require('../db');
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

module.exports = router;
