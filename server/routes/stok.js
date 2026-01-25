const express = require('express');
const { pool, query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm stok hareketlerini getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM stok_hareketleri WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Stok hareketleri getirme hatası:', error);
        res.status(500).json({ error: 'Stok hareketleri getirilemedi' });
    }
});

// Yeni stok hareketi ekle (Giriş, Çıkış, Üretim)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { urun_id, urun_ad, hareket_tipi, miktar, tarih, aciklama, profile_id, cari_id, cari_ad } = req.body;

        if (!urun_id || !hareket_tipi || miktar === undefined || !profile_id) {
            return res.status(400).json({ error: 'Ürün, hareket tipi, miktar ve profile_id gerekli' });
        }

        await client.query('BEGIN');

        // Hareketi kaydet
        const result = await client.query(
            `INSERT INTO stok_hareketleri (urun_id, urun_ad, hareket_tipi, miktar, tarih, aciklama, profile_id, cari_id, cari_ad)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [urun_id, urun_ad || '', hareket_tipi, miktar, tarih || new Date().toISOString(), aciklama || '', profile_id, cari_id || null, cari_ad || '']
        );

        // Ürün stok miktarını güncelle
        const miktarNum = parseFloat(miktar);
        let updateQuery = '';
        if (hareket_tipi === 'Giriş' || hareket_tipi === 'Üretim') {
            updateQuery = 'UPDATE urunler SET stok_miktari = stok_miktari + $1, updated_at = NOW() WHERE id = $2';
        } else if (hareket_tipi === 'Çıkış') {
            updateQuery = 'UPDATE urunler SET stok_miktari = stok_miktari - $1, updated_at = NOW() WHERE id = $2';
        }

        if (updateQuery) {
            await client.query(updateQuery, [miktarNum, urun_id]);
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Stok hareketi ekleme hatası:', error);
        res.status(500).json({ error: 'Stok hareketi eklenemedi' });
    } finally {
        client.release();
    }
});

// Stok hareketi sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM stok_hareketleri WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Stok hareketi bulunamadı' });
        }

        res.json({ message: 'Stok hareketi silindi', id });
    } catch (error) {
        console.error('Stok hareketi silme hatası:', error);
        res.status(500).json({ error: 'Stok hareketi silinemedi' });
    }
});

module.exports = router;
