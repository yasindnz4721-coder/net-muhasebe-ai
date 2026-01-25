const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm ürünleri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM urunler WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Ürünler getirme hatası:', error);
        res.status(500).json({ error: 'Ürünler getirilemedi' });
    }
});

// Yeni ürün ekle
router.post('/', async (req, res) => {
    try {
        const { ad, kategori_id, birim, stok_miktari, profile_id } = req.body;

        if (!ad || !profile_id) {
            return res.status(400).json({ error: 'Ürün adı ve profile_id gerekli' });
        }

        const result = await query(
            `INSERT INTO urunler (ad, kategori_id, birim, stok_miktari, profile_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [ad, kategori_id || null, birim || 'Adet', stok_miktari || 0, profile_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        res.status(500).json({ error: 'Ürün eklenemedi' });
    }
});

// Ürün güncelle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ad, kategori_id, birim, stok_miktari } = req.body;

        const result = await query(
            `UPDATE urunler 
       SET ad = $1, kategori_id = $2, birim = $3, stok_miktari = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
            [ad, kategori_id, birim, stok_miktari, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        res.status(500).json({ error: 'Ürün güncellenemedi' });
    }
});

// Ürün sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM urunler WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }

        res.json({ message: 'Ürün silindi', id });
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        res.status(500).json({ error: 'Ürün silinemedi' });
    }
});

module.exports = router;
