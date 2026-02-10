const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm taksit planlarını getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        const result = await query(
            'SELECT * FROM taksitler WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Taksitler getirme hatası:', error);
        res.status(500).json({ error: 'Taksitler getirilemedi' });
    }
});

// Yeni taksit planı ekle (ve ödeme tablosunu oluştur)
router.post('/', async (req, res) => {
    try {
        const { cari_id, cari_ad, toplam_tutar, taksit_tutari, taksit_sayisi, odeme_gunu, baslangic_tarihi, aciklama, profile_id } = req.body;

        if (!toplam_tutar || !taksit_tutari || !taksit_sayisi || !profile_id) {
            return res.status(400).json({ error: 'Gerekli alanlar eksik' });
        }

        // 1. Taksit planını kaydet (cari_id ve cari_ad artık opsiyonel)
        const planResult = await query(
            `INSERT INTO taksitler (cari_id, cari_ad, toplam_tutar, taksit_tutari, taksit_sayisi, odeme_gunu, baslangic_tarihi, aciklama, profile_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [cari_id || null, cari_ad || 'Genel', toplam_tutar, taksit_tutari, taksit_sayisi, odeme_gunu, baslangic_tarihi, aciklama, profile_id]
        );

        const planId = planResult.rows[0].id;

        // 2. Taksit ödemelerini oluştur
        for (let i = 0; i < taksit_sayisi; i++) {
            const tempDate = new Date(baslangic_tarihi);
            tempDate.setMonth(tempDate.getMonth() + i);

            // Ayın kaç gün olduğunu kontrol et
            const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
            const actualDay = Math.min(odeme_gunu, daysInMonth);

            const vadeTarihi = new Date(tempDate.getFullYear(), tempDate.getMonth(), actualDay);

            await query(
                `INSERT INTO taksit_odemeleri (taksit_id, vade_tarihi, tutar, profile_id)
                 VALUES ($1, $2, $3, $4)`,
                [planId, vadeTarihi.toISOString().split('T')[0], taksit_tutari, profile_id]
            );
        }

        res.status(201).json(planResult.rows[0]);
    } catch (error) {
        console.error('Taksit ekleme hatası:', error);
        res.status(500).json({ error: 'Taksit eklenemedi' });
    }
});

// Taksit ödemelerini getir
router.get('/takip', async (req, res) => {
    try {
        const { profile_id, yil, ay } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        let sql = `
            SELECT to.*, t.cari_ad, t.aciklama as plan_aciklama 
            FROM taksit_odemeleri to
            JOIN taksitler t ON to.taksit_id = t.id
            WHERE to.profile_id = $1
        `;
        const params = [profile_id];

        if (yil && ay) {
            sql += ` AND EXTRACT(YEAR FROM to.vade_tarihi) = $2 AND EXTRACT(MONTH FROM to.vade_tarihi) = $3`;
            params.push(yil, ay);
        }

        sql += ` ORDER BY to.vade_tarihi ASC`;

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Taksit takip hatası:', error);
        res.status(500).json({ error: 'Takip verileri getirilemedi' });
    }
});

// Otomatik ödeme kontrolü ve kasadan düşme
router.post('/check-payments', async (req, res) => {
    try {
        const { profile_id } = req.body;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        const bugun = new Date().toISOString().split('T')[0];

        // Varsayılan kasayı bul
        const kasaResult = await query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [profile_id]);
        const defaultKasaId = kasaResult.rows.length > 0 ? kasaResult.rows[0].id : null;

        // Bugün vadesi gelmiş ve henüz ödenmemiş taksitleri bul
        const duePayments = await query(
            `SELECT to.*, t.cari_id, t.cari_ad, t.aciklama as plan_aciklama 
             FROM taksit_odemeleri to
             JOIN taksitler t ON to.taksit_id = t.id
             WHERE to.profile_id = $1 AND to.vade_tarihi <= $2 AND to.durum = 'Bekliyor'`,
            [profile_id, bugun]
        );

        const processed = [];

        for (const payment of duePayments.rows) {
            // 1. Kasaya (odemeler) gider olarak ekle
            const odemeResult = await query(
                `INSERT INTO odemeler (cari_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id, kasa_id)
                 VALUES ($1, $2, 'Ödeme', $3, NOW(), 'Nakit', $4, $5, $6)
                 RETURNING id`,
                [payment.cari_id, payment.cari_ad, payment.tutar, `Taksit Ödemesi: ${payment.plan_aciklama || ''}`, profile_id, defaultKasaId]
            );

            // 2. Kasa bakiyesini güncelle
            if (defaultKasaId) {
                await query('UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [payment.tutar, defaultKasaId]);
            }

            // 3. Taksit ödemesini 'Ödendi' olarak işaretle
            await query(
                `UPDATE taksit_odemeleri SET durum = 'Ödendi', odeme_tarihi = NOW(), odeme_id = $1, kasa_id = $2 WHERE id = $3`,
                [odemeResult.rows[0].id, defaultKasaId, payment.id]
            );

            processed.push(payment.id);
        }

        res.json({ message: `${processed.length} taksit otomatik olarak ödendi.`, count: processed.length });
    } catch (error) {
        console.error('Taksit kontrol hatası:', error);
        res.status(500).json({ error: 'Taksitler kontrol edilemedi' });
    }
});

// Taksit planını sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM taksitler WHERE id = $1', [id]);
        res.json({ message: 'Taksit planı silindi' });
    } catch (error) {
        console.error('Taksit silme hatası:', error);
        res.status(500).json({ error: 'Taksit silinemedi' });
    }
});

module.exports = router;
