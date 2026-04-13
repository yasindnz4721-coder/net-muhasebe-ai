const express = require('express');
const router = express.Router();
const { query, pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');

router.use(authMiddleware);

// Kategorileri getir
router.get('/kategoriler', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        let result = await query('SELECT * FROM gider_kategorileri WHERE profile_id = $1 ORDER BY ad ASC', [profile_id]);

        // Eğer kategori yoksa varsayılanları ekle
        if (result.rows.length === 0) {
            const varsayilanlar = [
                { ad: 'Kira', ikon: 'ri-home-office-line', renk: '#ef4444' },
                { ad: 'Mutfak/Gıda', ikon: 'ri-restaurant-line', renk: '#f59e0b' },
                { ad: 'Doğalgaz', ikon: 'ri-fire-line', renk: '#3b82f6' },
                { ad: 'Elektrik', ikon: 'ri-flashlight-line', renk: '#eab308' },
                { ad: 'Su', ikon: 'ri-drop-line', renk: '#0ea5e9' },
                { ad: 'İnternet', ikon: 'ri-global-line', renk: '#6366f1' },
                { ad: 'Personel Maaşı', ikon: 'ri-user-star-line', renk: '#8b5cf6' },
                { ad: 'Ofis Malzemeleri', ikon: 'ri-pencil-ruler-line', renk: '#ec4899' }
            ];

            for (const v of varsayilanlar) {
                await query(
                    'INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, $2, $3, $4)',
                    [profile_id, v.ad, v.ikon, v.renk]
                );
            }
            result = await query('SELECT * FROM gider_kategorileri WHERE profile_id = $1 ORDER BY ad ASC', [profile_id]);
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Kategori getirme hatası:', error);
        res.status(500).json({ error: 'Kategoriler alınamadı' });
    }
});

// Giderleri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        const result = await query(`
            SELECT g.*, gk.ad as kategori_ad, gk.ikon as kategori_ikon, gk.renk as kategori_renk, k.ad as kasa_ad
            FROM giderler g
            LEFT JOIN gider_kategorileri gk ON g.kategori_id = gk.id
            LEFT JOIN kasalar k ON g.kasa_id = k.id
            WHERE g.profile_id = $1
            ORDER BY g.tarih DESC
        `, [profile_id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Gider getirme hatası:', error);
        res.status(500).json({ error: 'Giderler alınamadı' });
    }
});

// Yeni gider ekle
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama } = req.body;

        if (!profile_id || !tutar || !kasa_id) {
            return res.status(400).json({ error: 'Eksik bilgi' });
        }

        await client.query('BEGIN');

        // 1. Gideri kaydet
        const giderResult = await client.query(
            `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [profile_id, kategori_id, tutar, tarih || new Date(), kasa_id, odeme_yontemi || 'Nakit', aciklama, req.user.email]
        );

        const gider = giderResult.rows[0];

        // 2. Ödemeler tablosuna kaydet (Kasa takibi için)
        await client.query(
            `INSERT INTO odemeler (profile_id, tip, tutar, tarih, odeme_yontemi, aciklama, kasa_id, cari_ad, gider_id)
             VALUES ($1, 'Ödeme', $2, $3, $4, $5, $6, $7, $8)`,
            [profile_id, tutar, tarih || new Date(), odeme_yontemi || 'Nakit', `Gider Kaydı: ${aciklama || 'Genel Gider'}`, kasa_id, 'GENEL GİDER', gider.id]
        );

        // 3. Kasa bakiyesini düş
        await client.query(
            'UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2',
            [tutar, kasa_id]
        );

        // 4. Denetim kaydı
        await AuditService.log(profile_id, 'EKLEME', 'giderler', gider.id, `Gider eklendi: ${tutar} TL - ${aciklama}`, req.user.email);

        await client.query('COMMIT');
        res.status(201).json(gider);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Gider ekleme hatası:', error);
        res.status(500).json({ error: 'Gider kaydedilemedi' });
    } finally {
        client.release();
    }
});

// Gider sil
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const giderResult = await client.query('SELECT * FROM giderler WHERE id = $1', [id]);
        if (giderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Gider bulunamadı' });
        }
        const gider = giderResult.rows[0];

        // 1. Gideri sil
        await client.query('DELETE FROM giderler WHERE id = $1', [id]);

        // 2. Kasa bakiyesini iade et
        if (gider.kasa_id) {
            await client.query(
                'UPDATE kasalar SET bakiye = bakiye + $1, updated_at = NOW() WHERE id = $2',
                [gider.tutar, gider.kasa_id]
            );
        }

        // 3. Denetim kaydı
        await AuditService.log(gider.profile_id, 'SİLME', 'giderler', id, `Gider silindi: ${gider.tutar} TL`, req.user.email);

        await client.query('COMMIT');
        res.json({ message: 'Gider silindi' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Gider silme hatası:', error);
        res.status(500).json({ error: 'Gider silinemedi' });
    } finally {
        client.release();
    }
});

module.exports = router;
