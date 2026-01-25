const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm kategorileri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM kategoriler WHERE profile_id = $1 ORDER BY ad ASC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Kategoriler getirme hatası:', error);
        res.status(500).json({ error: 'Kategoriler getirilemedi' });
    }
});

// Yeni kategori ekle
router.post('/', async (req, res) => {
    try {
        const { ad, profile_id } = req.body;

        if (!ad || !profile_id) {
            return res.status(400).json({ error: 'Kategori adı ve profile_id gerekli' });
        }

        const result = await query(
            'INSERT INTO kategoriler (ad, profile_id) VALUES ($1, $2) RETURNING *',
            [ad, profile_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Kategori ekleme hatası:', error);
        res.status(500).json({ error: 'Kategori eklenemedi' });
    }
});

// Kategori sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM kategoriler WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kategori bulunamadı' });
        }

        res.json({ message: 'Kategori silindi', id });
    } catch (error) {
        console.error('Kategori silme hatası:', error);
        res.status(500).json({ error: 'Kategori silinemedi' });
    }
});

module.exports = router;
