const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');

const router = express.Router();
router.use(authMiddleware);

// Tüm ödemeleri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        const result = await query(
            'SELECT * FROM odemeler WHERE profile_id = $1 ORDER BY created_at DESC',
            [profile_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Ödemeler getirme hatası:', error);
        res.status(500).json({ error: 'Ödemeler getirilemedi' });
    }
});

// Yeni ödeme ekle
router.post('/', async (req, res) => {
    try {
        const { cari_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id } = req.body;

        if (!cari_id || !tutar || !profile_id) {
            return res.status(400).json({ error: 'Cari, tutar ve profile_id gerekli' });
        }

        // --- LİMİT KONTROLÜ ---
        const tier = req.user.subscription_tier || 'temel';
        if (tier !== 'vip') {
            const limit = tier === 'tam' ? 100 : 50;

            // Mevcut ay içindeki ödeme sayısını say
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const countResult = await query(
                'SELECT COUNT(*) FROM odemeler WHERE profile_id = $1 AND created_at >= $2',
                [profile_id, firstDayOfMonth]
            );

            const currentCount = parseInt(countResult.rows[0].count);
            if (currentCount >= limit) {
                return res.status(403).json({
                    error: `Aylık ödeme/tahsilat limitinize ulaştınız (${limit}). Daha fazla işlem için paketinizi yükseltin.`
                });
            }
        }
        // ---------------------

        // Varsayılan kasayı bul
        const kasaResult = await query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [profile_id]);
        const defaultKasaId = kasaResult.rows.length > 0 ? kasaResult.rows[0].id : null;
        const targetKasaId = req.body.kasa_id || defaultKasaId;

        const result = await query(
            `INSERT INTO odemeler (cari_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id, kasa_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [cari_id || null, cari_ad || 'Genel', tip || 'Tahsilat', tutar, tarih || new Date().toISOString(), odeme_yontemi || 'Nakit', aciklama || '', profile_id, targetKasaId]
        );

        // Kasa bakiyesini güncelle
        if (targetKasaId) {
            const tipLower = tip.toLowerCase();
            const isTahsilat = ['tahsilat', 'alınan ödeme', 'gelir'].includes(tipLower);
            const isOdeme = ['ödeme', 'gider', 'tediye', 'personel avansı', 'taksit ödemesi'].includes(tipLower);

            const miktar = isTahsilat ? tutar : (isOdeme ? -tutar : -tutar); // Varsayılan olarak gider say
            await query('UPDATE kasalar SET bakiye = bakiye + $1, updated_at = NOW() WHERE id = $2', [miktar, targetKasaId]);
        }

        const odeme = result.rows[0];

        // Denetim kaydı
        await AuditService.log(
            profile_id,
            'EKLEME',
            'odemeler',
            odeme.id,
            `${odeme.tip} işlemi yapıldı: ₺${odeme.tutar} (${odeme.cari_ad})`,
            req.user.email
        );

        res.status(201).json(odeme);
    } catch (error) {
        console.error('Ödeme ekleme hatası:', error);
        res.status(500).json({ error: 'Ödeme eklenemedi' });
    }
});

// Ödeme sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Önce ödemeyi bulalım (kasa iadesi için)
        const checkResult = await query('SELECT * FROM odemeler WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ödeme bulunamadı' });
        }
        const odeme = checkResult.rows[0];

        // 1. Kasa bakiyesini iade et
        if (odeme.kasa_id) {
            const tipLower = odeme.tip.toLowerCase();
            const isTahsilat = ['tahsilat', 'alınan ödeme', 'gelir'].includes(tipLower);
            const isOdeme = ['ödeme', 'gider', 'tediye', 'personel avansı', 'taksit ödemesi'].includes(tipLower);

            // Tahsilat siliniyorsa bakiye azalır, Ödeme siliniyorsa bakiye artar
            const miktar = isTahsilat ? -odeme.tutar : (isOdeme ? odeme.tutar : odeme.tutar);
            await query('UPDATE kasalar SET bakiye = bakiye + $1, updated_at = NOW() WHERE id = $2', [miktar, odeme.kasa_id]);
        }

        // 2. Ödemeyi sil
        await query('DELETE FROM odemeler WHERE id = $1', [id]);

        // Denetim kaydı
        await AuditService.log(
            odeme.profile_id,
            'SİLME',
            'odemeler',
            id,
            `${odeme.tip} silindi: ₺${odeme.tutar} (${odeme.cari_ad})`,
            req.user.email
        );

        res.json({ message: 'Ödeme silindi ve kasa bakiyesi güncellendi', id });
    } catch (error) {
        console.error('Ödeme silme hatası:', error);
        res.status(500).json({ error: 'Ödeme silinemedi' });
    }
});

module.exports = router;
