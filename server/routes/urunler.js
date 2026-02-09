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
        const {
            ad, kategori_id, birim, stok_miktari, profile_id,
            urun_tipi, urun_cinsi, urun_kodu, urun_barkodu,
            alis_fiyati, satis_fiyati, alis_kdv_dahil, satis_kdv_dahil,
            kdv_orani, otv_orani, oiv_orani, stok_takibi, stok_uyari_limiti
        } = req.body;

        if (!ad || !profile_id) {
            return res.status(400).json({ error: 'Ürün adı ve profile_id gerekli' });
        }

        const result = await query(
            `INSERT INTO urunler (
                ad, kategori_id, birim, stok_miktari, profile_id,
                urun_tipi, urun_cinsi, urun_kodu, urun_barkodu,
                alis_fiyati, satis_fiyati, alis_kdv_dahil, satis_kdv_dahil,
                kdv_orani, otv_orani, oiv_orani, stok_takibi, stok_uyari_limiti
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *`,
            [
                ad, kategori_id || null, birim || 'Adet', stok_miktari || 0, profile_id,
                urun_tipi || 'Ürün', urun_cinsi || '', urun_kodu || '', urun_barkodu || '',
                alis_fiyati || 0, satis_fiyati || 0, alis_kdv_dahil || false, satis_kdv_dahil || false,
                kdv_orani || 20, otv_orani || 0, oiv_orani || 0, stok_takibi !== undefined ? stok_takibi : true, stok_uyari_limiti || 10
            ]
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
        const {
            ad, kategori_id, birim, stok_miktari,
            urun_tipi, urun_cinsi, urun_kodu, urun_barkodu,
            alis_fiyati, satis_fiyati, alis_kdv_dahil, satis_kdv_dahil,
            kdv_orani, otv_orani, oiv_orani, stok_takibi, stok_uyari_limiti
        } = req.body;

        const result = await query(
            `UPDATE urunler 
            SET ad = $1, kategori_id = $2, birim = $3, stok_miktari = $4, 
                urun_tipi = $5, urun_cinsi = $6, urun_kodu = $7, urun_barkodu = $8,
                alis_fiyati = $9, satis_fiyati = $10, alis_kdv_dahil = $11, satis_kdv_dahil = $12,
                kdv_orani = $13, otv_orani = $14, oiv_orani = $15, stok_takibi = $16, stok_uyari_limiti = $17,
                updated_at = NOW()
            WHERE id = $18
            RETURNING *`,
            [
                ad, kategori_id, birim, stok_miktari,
                urun_tipi, urun_cinsi, urun_kodu, urun_barkodu,
                alis_fiyati, satis_fiyati, alis_kdv_dahil, satis_kdv_dahil,
                kdv_orani, otv_orani, oiv_orani, stok_takibi, stok_uyari_limiti,
                id
            ]
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
