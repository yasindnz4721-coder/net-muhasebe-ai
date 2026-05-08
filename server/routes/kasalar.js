const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm kasaları getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        let result;
        try {
            result = await query(
                'SELECT * FROM kasalar WHERE profile_id = $1 ORDER BY is_default DESC, tip ASC, ad ASC',
                [profile_id]
            );
        } catch (e) {
            // tip sütunu henüz yoksa basit sıralama kullan
            result = await query(
                'SELECT * FROM kasalar WHERE profile_id = $1 ORDER BY is_default DESC, ad ASC',
                [profile_id]
            );
        }

        // Eğer hiç kasa yoksa otomatik oluştur
        if (result.rows.length === 0) {
            await query(
                'INSERT INTO kasalar (ad, bakiye, profile_id, is_default) VALUES ($1, $2, $3, $4)',
                ['Ana Kasa', 0, profile_id, true]
            );
            result = await query(
                'SELECT * FROM kasalar WHERE profile_id = $1 ORDER BY is_default DESC, ad ASC',
                [profile_id]
            );
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Kasalar getirme hatası:', error);
        res.status(500).json({ error: 'Kasalar getirilemedi' });
    }
});

// Yeni kasa/banka ekle
router.post('/', async (req, res) => {
    try {
        const { ad, bakiye, profile_id, tip, banka_adi, iban, hesap_no } = req.body;
        if (!ad || !profile_id) return res.status(400).json({ error: 'Ad ve profile_id gerekli' });

        let result;
        try {
            // Önce yeni sütunlarla dene
            result = await query(
                'INSERT INTO kasalar (ad, bakiye, profile_id, tip, banka_adi, iban, hesap_no) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [ad, bakiye || 0, profile_id, tip || 'Nakit', banka_adi || '', iban || '', hesap_no || '']
            );
        } catch (insertError) {
            // Yeni sütunlar yoksa sadece temel alanlarla ekle
            console.log('Banka sütunları bulunamadı, temel alanlarla ekleniyor:', insertError.message);
            result = await query(
                'INSERT INTO kasalar (ad, bakiye, profile_id) VALUES ($1, $2, $3) RETURNING *',
                [ad, bakiye || 0, profile_id]
            );
        }
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Kasa/Banka ekleme hatası:', error);
        res.status(500).json({ error: 'Kasa/Banka eklenemedi' });
    }
});

module.exports = router;
