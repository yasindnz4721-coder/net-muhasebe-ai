const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Kullanıcının profilini getir
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            'SELECT * FROM profiles WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
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
        const userId = req.user.id;
        const { name, logo_url } = req.body;
        console.log('Profil güncelleme isteği:', { userId, body: req.body });

        const result = await query(
            'UPDATE profiles SET name = $1, logo_url = $2 WHERE id = $3 RETURNING *',
            [name, logo_url || '', userId]
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
