const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm ödemeleri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM odemeler WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Ödemeler getirme hatası:', error);
        res.status(500).json({ error: 'Ödemeler getirilemedi' });
    }
});

// Yeni ödeme ekle
router.post('/', async (req, res) => {
    try {
        const { cari_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id } = req.body;

        if (!cari_id || !tutar || !profile_id) {
            return res.status(400).json({ error: 'Cari, tutar ve profile_id gerekli' });
        }

        // --- LİMİT KONTROLÜ ---
        const tier = req.user.subscription_tier || 'temel';
        if (tier !== 'vip') {
            const limit = tier === 'tam' ? 100 : 50;

            // Mevcut ay içindeki ödeme sayısını say
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const countResult = await query(
                'SELECT COUNT(*) FROM odemeler WHERE profile_id = $1 AND created_at >= $2',
                [profile_id, firstDayOfMonth]
            );

            const currentCount = parseInt(countResult.rows[0].count);
            if (currentCount >= limit) {
                return res.status(403).json({
                    error: `Aylık ödeme/tahsilat limitinize ulaştınız (${limit}). Daha fazla işlem için paketinizi yükseltin.`
                });
            }
        }
        // ---------------------

        const result = await query(
            `INSERT INTO odemeler (cari_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [cari_id, cari_ad || '', tip || 'Tahsilat', tutar, tarih || new Date().toISOString(), odeme_yontemi || 'Nakit', aciklama || '', profile_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ödeme ekleme hatası:', error);
        res.status(500).json({ error: 'Ödeme eklenemedi' });
    }
});

// Ödeme sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM odemeler WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ödeme bulunamadı' });
        }

        res.json({ message: 'Ödeme silindi', id });
    } catch (error) {
        console.error('Ödeme silme hatası:', error);
        res.status(500).json({ error: 'Ödeme silinemedi' });
    }
});

module.exports = router;
