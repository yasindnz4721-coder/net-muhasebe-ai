const express = require('express');
const { pool, query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm alış faturalarını getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM alis_faturalari WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Alış faturaları getirme hatası:', error);
        res.status(500).json({ error: 'Alış faturaları getirilemedi' });
    }
});

// Yeni alış faturası ekle
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { cari_id, cari_ad, fatura_no, tarih, tutar, kdv, toplam, durum, aciklama, urunler, profile_id } = req.body;

        if (!cari_id || !fatura_no || !profile_id) {
            return res.status(400).json({ error: 'Cari, fatura no ve profile_id gerekli' });
        }

        await client.query('BEGIN');

        // Kullanıcının PRO olup olmadığını kontrol et
        const userResult = await client.query(
            'SELECT subscription_tier FROM users WHERE id = (SELECT id FROM profiles WHERE id = $1)',
            [profile_id]
        );
        const isPro = userResult.rows[0]?.subscription_tier === 'pro';

        // Faturayı kaydet
        const result = await client.query(
            `INSERT INTO alis_faturalari (cari_id, cari_ad, fatura_no, tarih, tutar, kdv, toplam, durum, aciklama, urunler, profile_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [cari_id, cari_ad || '', fatura_no, tarih || new Date().toISOString(), tutar || 0, kdv || 0, toplam || 0, durum || 'Onaylandı', aciklama || '', JSON.stringify(urunler || []), profile_id]
        );

        const fatura = result.rows[0];

        // PRO ise stokları otomatik artır
        if (isPro && urunler && Array.isArray(urunler)) {
            for (const urun of urunler) {
                if (urun.urun_id) {
                    // Stok artır
                    await client.query(
                        'UPDATE urunler SET stok_miktari = stok_miktari + $1, updated_at = NOW() WHERE id = $2',
                        [urun.miktar, urun.urun_id]
                    );

                    // Hareket kaydı
                    await client.query(
                        `INSERT INTO stok_hareketleri (urun_id, urun_ad, hareket_tipi, miktar, tarih, aciklama, profile_id, cari_id, cari_ad)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            urun.urun_id,
                            urun.urun_ad,
                            'Giriş',
                            urun.miktar,
                            tarih || new Date().toISOString(),
                            `Alış Faturası: ${fatura_no}`,
                            profile_id,
                            cari_id,
                            cari_ad || ''
                        ]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json(fatura);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Alış faturası ekleme hatası:', error);
        res.status(500).json({ error: 'Alış faturası eklenemedi' });
    } finally {
        client.release();
    }
});

// Alış faturası güncelle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cari_id, cari_ad, fatura_no, tarih, tutar, kdv, toplam, durum, aciklama, urunler } = req.body;

        const result = await query(
            `UPDATE alis_faturalari 
             SET cari_id = $1, cari_ad = $2, fatura_no = $3, tarih = $4, tutar = $5, kdv = $6, toplam = $7, durum = $8, aciklama = $9, urunler = $10 
             WHERE id = $11 RETURNING *`,
            [cari_id, cari_ad, fatura_no, tarih, tutar, kdv, toplam, durum, aciklama, JSON.stringify(urunler || []), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fatura bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Alış faturası güncelleme hatası:', error);
        res.status(500).json({ error: 'Alış faturası güncellenemedi' });
    }
});

// Alış faturası sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM alis_faturalari WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fatura bulunamadı' });
        }

        res.json({ message: 'Fatura silindi', id });
    } catch (error) {
        console.error('Alış faturası silme hatası:', error);
        res.status(500).json({ error: 'Alış faturası silinemedi' });
    }
});

module.exports = router;
