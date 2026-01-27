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

        // Stokları otomatik artır
        if (urunler && Array.isArray(urunler)) {
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
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { cari_id, cari_ad, fatura_no, tarih, tutar, kdv, toplam, durum, aciklama, urunler, profile_id } = req.body;

        await client.query('BEGIN');

        // 1. Eski faturayı bul ve stokları geri al (azalt)
        const oldFaturaResult = await client.query('SELECT urunler, fatura_no FROM alis_faturalari WHERE id = $1', [id]);
        if (oldFaturaResult.rows.length > 0) {
            const oldUrunler = typeof oldFaturaResult.rows[0].urunler === 'string'
                ? JSON.parse(oldFaturaResult.rows[0].urunler)
                : oldFaturaResult.rows[0].urunler;

            if (oldUrunler && Array.isArray(oldUrunler)) {
                for (const urun of oldUrunler) {
                    if (urun.urun_id) {
                        await client.query(
                            'UPDATE urunler SET stok_miktari = stok_miktari - $1 WHERE id = $2',
                            [urun.miktar, urun.urun_id]
                        );
                        // İptal hareketi
                        await client.query(
                            `INSERT INTO stok_hareketleri (urun_id, urun_ad, hareket_tipi, miktar, tarih, aciklama, profile_id, cari_id, cari_ad)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                            [urun.urun_id, urun.urun_ad, 'Çıkış', urun.miktar, new Date().toISOString(), `Fatura Düzenleme (Geri Alım): ${oldFaturaResult.rows[0].fatura_no}`, profile_id, cari_id, cari_ad || '']
                        );
                    }
                }
            }
        }

        // 2. Faturayı güncelle
        const result = await client.query(
            `UPDATE alis_faturalari 
             SET cari_id = $1, cari_ad = $2, fatura_no = $3, tarih = $4, tutar = $5, kdv = $6, toplam = $7, durum = $8, aciklama = $9, urunler = $10 
             WHERE id = $11 RETURNING *`,
            [cari_id, cari_ad, fatura_no, tarih, tutar, kdv, toplam, durum, aciklama, JSON.stringify(urunler || []), id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Fatura bulunamadı' });
        }

        // 3. Yeni stokları artır
        if (urunler && Array.isArray(urunler)) {
            for (const urun of urunler) {
                if (urun.urun_id) {
                    await client.query(
                        'UPDATE urunler SET stok_miktari = stok_miktari + $1 WHERE id = $2',
                        [urun.miktar, urun.urun_id]
                    );
                    await client.query(
                        `INSERT INTO stok_hareketleri (urun_id, urun_ad, hareket_tipi, miktar, tarih, aciklama, profile_id, cari_id, cari_ad)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [urun.urun_id, urun.urun_ad, 'Giriş', urun.miktar, tarih, `Alış Faturası (Güncelleme): ${fatura_no}`, profile_id, cari_id, cari_ad || '']
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Alış faturası güncelleme hatası:', error);
        res.status(500).json({ error: 'Alış faturası güncellenemedi' });
    } finally {
        client.release();
    }
});

// Alış faturası sil
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        // 1. Faturayı ve ürünleri bul
        const faturaResult = await client.query('SELECT urunler, fatura_no, profile_id, cari_id, cari_ad FROM alis_faturalari WHERE id = $1', [id]);
        if (faturaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Fatura bulunamadı' });
        }

        const fatura = faturaResult.rows[0];
        const urunler = typeof fatura.urunler === 'string' ? JSON.parse(fatura.urunler) : fatura.urunler;

        // 2. Stokları geri al (azalt)
        if (urunler && Array.isArray(urunler)) {
            for (const urun of urunler) {
                if (urun.urun_id) {
                    await client.query(
                        'UPDATE urunler SET stok_miktari = stok_miktari - $1 WHERE id = $2',
                        [urun.miktar, urun.urun_id]
                    );
                    await client.query(
                        `INSERT INTO stok_hareketleri (urun_id, urun_ad, hareket_tipi, miktar, tarih, aciklama, profile_id, cari_id, cari_ad)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [urun.urun_id, urun.urun_ad, 'Çıkış', urun.miktar, new Date().toISOString(), `Alış Faturası İptal: ${fatura.fatura_no}`, fatura.profile_id, fatura.cari_id, fatura.cari_ad]
                    );
                }
            }
        }

        // 3. Faturayı sil
        await client.query('DELETE FROM alis_faturalari WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: 'Fatura silindi', id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Alış faturası silme hatası:', error);
        res.status(500).json({ error: 'Alış faturası silinemedi' });
    } finally {
        client.release();
    }
});

module.exports = router;
