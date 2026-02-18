const express = require('express');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');
const AuditService = require('../services/auditService');

const router = express.Router();

// Tüm route'lar auth gerektiriyor
router.use(authMiddleware);

// Tüm carileri getir (bakiyeleri hesaplanmış)
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;

        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id gerekli' });
        }

        // Carileri getir ve bakiyeyi satış/alış faturaları ve ödemelerden hesapla
        const result = await query(
            `SELECT c.*,
                COALESCE((SELECT SUM(toplam) FROM satis_faturalari WHERE cari_id = c.id), 0) as satis_toplam,
                COALESCE((SELECT SUM(toplam) FROM alis_faturalari WHERE cari_id = c.id), 0) as alis_toplam,
                COALESCE((SELECT SUM(tutar) FROM odemeler WHERE cari_id = c.id AND (tip = 'Tahsilat' OR tip = 'Ödeme Alındı' OR tip = 'Alınan Ödeme')), 0) as tahsilat_toplam,
                COALESCE((SELECT SUM(tutar) FROM odemeler WHERE cari_id = c.id AND (tip = 'Ödeme' OR tip = 'Tediye')), 0) as odeme_toplam
            FROM cariler c
            WHERE c.profile_id = $1
            ORDER BY c.created_at DESC`,
            [profile_id]
        );

        // Bakiyeyi hesapla: Satış faturası = cari bize borçlu, Alış faturası = biz cariye borçluyuz
        // Tahsilat = cari borcunu ödedi, Ödeme = biz borcumuzu ödedik
        const rows = result.rows.map(row => ({
            ...row,
            bakiye: Number(row.satis_toplam) - Number(row.tahsilat_toplam) - Number(row.alis_toplam) + Number(row.odeme_toplam)
        }));

        res.json(rows);
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

        const cari = result.rows[0];

        // Denetim kaydı
        await AuditService.log(
            profile_id,
            'EKLEME',
            'cariler',
            cari.id,
            `Yeni cari eklendi: ${cari.ad}`,
            req.user.email
        );

        res.status(201).json(cari);
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

        const cari = result.rows[0];

        // Denetim kaydı
        await AuditService.log(
            cari.profile_id,
            'GÜNCELLEME',
            'cariler',
            cari.id,
            `Cari bilgileri güncellendi: ${cari.ad}`,
            req.user.email
        );

        res.json(cari);
    } catch (error) {
        console.error('Cari güncelleme hatası:', error);
        res.status(500).json({ error: 'Cari güncellenemedi' });
    }
});

// Cari sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM cariler WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cari bulunamadı' });
        }

        const deletedCari = result.rows[0];

        // Denetim kaydı
        await AuditService.log(
            deletedCari.profile_id,
            'SİLME',
            'cariler',
            deletedCari.id,
            `Cari silindi: ${deletedCari.ad}`,
            req.user.email
        );

        res.json({ message: 'Cari silindi', id: deletedCari.id });
    } catch (error) {
        console.error('Cari silme hatası:', error);
        res.status(500).json({ error: 'Cari silinemedi' });
    }
});

module.exports = router;
