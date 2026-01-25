const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Tüm route'lar auth gerektiriyor
router.use(authMiddleware);

// Tüm carileri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM cariler WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Cariler getirme hatası:', error);
        res.status(500).json({ error: 'Cariler getirilemedi' });
    }
});

// Tek cari getir
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('SELECT * FROM cariler WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cari bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Cari getirme hatası:', error);
        res.status(500).json({ error: 'Cari getirilemedi' });
    }
});

// Yeni cari ekle
router.post('/', async (req, res) => {
    try {
        const { ad, telefon, email, adres, vergi_no, vergi_dairesi, profile_id } = req.body;

        if (!ad || !profile_id) {
            return res.status(400).json({ error: 'Cari adı ve profile_id gerekli' });
        }

        const result = await query(
            `INSERT INTO cariler (ad, telefon, email, adres, vergi_no, vergi_dairesi, profile_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [ad, telefon || '', email || '', adres || '', vergi_no || '', vergi_dairesi || '', profile_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Cari ekleme hatası:', error);
        res.status(500).json({ error: 'Cari eklenemedi' });
    }
});

// Cari güncelle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ad, telefon, email, adres, vergi_no, vergi_dairesi } = req.body;

        const result = await query(
            `UPDATE cariler 
       SET ad = $1, telefon = $2, email = $3, adres = $4, vergi_no = $5, vergi_dairesi = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
            [ad, telefon, email, adres, vergi_no, vergi_dairesi, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cari bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Cari güncelleme hatası:', error);
        res.status(500).json({ error: 'Cari güncellenemedi' });
    }
});

// Cari sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM cariler WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cari bulunamadı' });
        }

        res.json({ message: 'Cari silindi', id });
    } catch (error) {
        console.error('Cari silme hatası:', error);
        res.status(500).json({ error: 'Cari silinemedi' });
    }
});

module.exports = router;
