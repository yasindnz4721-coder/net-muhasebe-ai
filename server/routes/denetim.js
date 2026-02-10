const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Denetim kayıtlarını getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        const result = await query(
            'SELECT * FROM denetim_kayitlari WHERE profile_id = $1 ORDER BY olusturma_tarihi DESC LIMIT 100',
            [profile_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Denetim kayıtları getirme hatası:', error);
        res.status(500).json({ error: 'Kayıtlar alınamadı' });
    }
});

module.exports = router;
