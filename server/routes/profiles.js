const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Kullanıcının mevcut profilini getir
router.get('/', async (req, res) => {
    try {
        const profileId = req.user.profile_id;
        console.log('DEBUG: Profil istenen Profile ID:', profileId);

        if (!profileId) {
            console.log('DEBUG: profile_id eksik (req.user içinde yok)');
            return res.status(404).json({ error: 'Kullanıcının aktif profili bulunamadı' });
        }

        // Profili getir
        const result = await query(
            'SELECT * FROM profiles WHERE id = $1',
            [profileId]
        );
        console.log('DEBUG: Profil Sorgu Sonucu:', result.rows);

        if (result.rows.length === 0) {
            console.log('DEBUG: Profil tablosunda bu ID bulunamadı:', profileId);
            return res.status(404).json({ error: 'Profil bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profil getirme hatası:', error);
        res.status(500).json({ error: 'Profil getirilemedi' });
    }
});

// Profil güncelle
router.put('/', async (req, res) => {
    try {
        const profileId = req.user.profile_id;
        const { name, logo_url } = req.body;

        if (!profileId) {
            return res.status(404).json({ error: 'Kullanıcının aktif profili bulunamadı' });
        }

        const result = await query(
            'UPDATE profiles SET name = $1, logo_url = $2 WHERE id = $3 RETURNING *',
            [name, logo_url || '', profileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({ error: 'Profil güncellenemedi' });
    }
});

module.exports = router;
