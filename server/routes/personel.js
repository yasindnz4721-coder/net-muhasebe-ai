const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Tüm personelleri getir
router.get('/', async (req, res) => {
    try {
        const { profile_id } = req.query;
        if (!profile_id) return res.status(400).json({ error: 'profile_id gerekli' });

        const result = await query(
            'SELECT * FROM personeller WHERE profile_id = $1 ORDER BY ad_soyad ASC',
            [profile_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Personel listesi hatası:', error);
        res.status(500).json({ error: 'Personeller getirilemedi' });
    }
});

// Yeni personel ekle
router.post('/', async (req, res) => {
    try {
        const {
            ad_soyad, unvan, tckn, telefon, email, adres,
            ise_giris_tarihi, maas, iban, profile_id
        } = req.body;

        if (!ad_soyad || !profile_id) {
            return res.status(400).json({ error: 'Ad soyad ve profile_id gerekli' });
        }

        const result = await query(
            `INSERT INTO personeller (
                ad_soyad, unvan, tckn, telefon, email, adres, 
                ise_giris_tarihi, maas, iban, profile_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [ad_soyad, unvan || '', tckn || '', telefon || '', email || '', adres || '', ise_giris_tarihi || new Date(), maas || 0, iban || '', profile_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Personel ekleme hatası:', error);
        res.status(500).json({ error: 'Personel eklenemedi' });
    }
});

// Personel güncelle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ad_soyad, unvan, tckn, telefon, email, adres,
            ise_giris_tarihi, maas, iban, durum
        } = req.body;

        const result = await query(
            `UPDATE personeller SET 
                ad_soyad = $1, unvan = $2, tckn = $3, telefon = $4, 
                email = $5, adres = $6, ise_giris_tarihi = $7, 
                maas = $8, iban = $9, durum = $10, updated_at = NOW()
            WHERE id = $11 RETURNING *`,
            [ad_soyad, unvan, tckn, telefon, email, adres, ise_giris_tarihi, maas, iban, durum, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Personel güncelleme hatası:', error);
        res.status(500).json({ error: 'Personel güncellenemedi' });
    }
});

// Personel sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM personeller WHERE id = $1', [id]);
        res.json({ message: 'Personel başarıyla silindi' });
    } catch (error) {
        console.error('Personel silme hatası:', error);
        res.status(500).json({ error: 'Personel silinemedi' });
    }
});

// PUANTAJ İŞLEMLERİ

// Belirli bir ay için puantaj getir
router.get('/:id/puantaj', async (req, res) => {
    try {
        const { id } = req.params;
        const { yil, ay } = req.query;

        const result = await query(
            `SELECT * FROM personel_puantaj 
             WHERE personel_id = $1 AND EXTRACT(YEAR FROM tarih) = $2 AND EXTRACT(MONTH FROM tarih) = $3
             ORDER BY tarih ASC`,
            [id, yil, ay]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Puantaj getirme hatası:', error);
        res.status(500).json({ error: 'Puantaj bilgileri getirilemedi' });
    }
});

// Puantaj kaydet/güncelle
router.post('/:id/puantaj', async (req, res) => {
    try {
        const { id } = req.params;
        const { tarih, durum, notlar, profile_id } = req.body;

        const result = await query(
            `INSERT INTO personel_puantaj (personel_id, tarih, durum, notlar, profile_id)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (personel_id, tarih) 
             DO UPDATE SET durum = EXCLUDED.durum,向 notlar = EXCLUDED.notlar
             RETURNING *`,
            [id, tarih, durum, notlar || '', profile_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Puantaj kaydetme hatası:', error);
        res.status(500).json({ error: 'Puantaj kaydedilemedi' });
    }
});

// Aylık Maaş Özeti Hesapla
router.get('/:id/maas-ozeti', async (req, res) => {
    try {
        const { id } = req.params;
        const { yil, ay } = req.query;

        // Personel maaşını al
        const pResult = await query('SELECT maas FROM personeller WHERE id = $1', [id]);
        if (pResult.rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı' });
        const aylikMaas = parseFloat(pResult.rows[0].maas);

        // O ayki "Gelmedi" günlerini say
        const qResult = await query(
            `SELECT COUNT(*) as eksik_gun FROM personel_puantaj 
             WHERE personel_id = $1 AND durum = 'Gelmedi' 
             AND EXTRACT(YEAR FROM tarih) = $2 AND EXTRACT(MONTH FROM tarih) = $3`,
            [id, yil, ay]
        );

        const eksikGun = parseInt(qResult.rows[0].eksik_gun);
        const gunlukUcret = aylikMaas / 30;
        const kesinti = eksikGun * gunlukUcret;
        const odenecekMaas = Math.max(0, aylikMaas - kesinti);

        res.json({
            aylik_maas: aylikMaas,
            eksik_gun: eksikGun,
            kesinti: kesinti,
            odenecek_maas: odenecekMaas,
            yil,
            ay
        });
    } catch (error) {
        console.error('Maaş hesaplama hatası:', error);
        res.status(500).json({ error: 'Maaş özeti hesaplanamadı' });
    }
});

module.exports = router;
