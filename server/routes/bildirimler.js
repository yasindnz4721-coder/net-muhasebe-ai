const express = require('express');
const router = express.Router();
const { query } = require('../db');
const NotificationService = require('../services/notificationService');
const AutomationService = require('../services/automationService');

// Tüm bildirimleri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        // Otomasyonları ve bildirimleri kontrol et
        await AutomationService.checkAndRecordSalaries(profile_id);
        await NotificationService.checkAll(profile_id);

        const result = await query(
            'SELECT * FROM bildirimler WHERE profile_id = $1 ORDER BY olusturma_tarihi DESC LIMIT 50',
            [profile_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Bildirimler getirme hatası:', error);
        res.status(500).json({ error: 'Bildirimler alınamadı' });
    }
});

// Bildirimi okundu olarak işaretle
router.post('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE bildirimler SET okundu = TRUE WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Bildirim okuma hatası:', error);
        res.status(500).json({ error: 'İşlem başarısız' });
    }
});

// Tümünü okundu olarak işaretle
router.post('/read-all', async (req, res) => {
    try {
        const { profile_id } = req.body;
        await query('UPDATE bildirimler SET okundu = TRUE WHERE profile_id = $1', [profile_id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Tüm bildirimleri okuma hatası:', error);
        res.status(500).json({ error: 'İşlem başarısız' });
    }
});

module.exports = router;
