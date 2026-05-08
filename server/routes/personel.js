const express = require('express');
const router = express.Router();
const { query } = require('../db');
const AuditService = require('../services/auditService');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

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
        const personel = result.rows[0];

        // Denetim kaydı
        await AuditService.log(
            profile_id,
            'EKLEME',
            'personeller',
            personel.id,
            `Yeni personel eklendi: ${personel.ad_soyad}`,
            req.user.email
        );

        res.status(201).json(personel);
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
        const personel = result.rows[0];

        // Denetim kaydı
        await AuditService.log(
            personel.profile_id,
            'GÜNCELLEME',
            'personeller',
            personel.id,
            `Personel bilgileri güncellendi: ${personel.ad_soyad}`,
            req.user.email
        );

        res.json(personel);
    } catch (error) {
        console.error('Personel güncelleme hatası:', error);
        res.status(500).json({ error: 'Personel güncellenemedi' });
    }
});

// Personel sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Önce personel bilgilerini al (log için)
        const personelResult = await query('SELECT ad_soyad, profile_id FROM personeller WHERE id = $1', [id]);
        if (personelResult.rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı' });
        const p = personelResult.rows[0];

        await query('DELETE FROM personeller WHERE id = $1', [id]);

        await AuditService.log(
            p.profile_id,
            'SİLME',
            'personeller',
            id,
            `Personel silindi: ${p.ad_soyad}`,
            req.user.email
        );

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
             DO UPDATE SET durum = EXCLUDED.durum, notlar = EXCLUDED.notlar
             RETURNING *`,
            [id, tarih, durum, notlar || '', profile_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Puantaj kaydetme hatası:', error);
        res.status(500).json({ error: 'Puantaj kaydedilemedi' });
    }
});

// AVANS İŞLEMLERİ

// Belirli bir ay için avansları getir
router.get('/:id/avanslar', async (req, res) => {
    try {
        const { id } = req.params;
        const { yil, ay } = req.query;

        const result = await query(
            `SELECT * FROM personel_avanslar 
             WHERE personel_id = $1 AND EXTRACT(YEAR FROM tarih) = $2 AND EXTRACT(MONTH FROM tarih) = $3
             ORDER BY tarih ASC`,
            [id, yil, ay]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Avans getirme hatası:', error);
        res.status(500).json({ error: 'Avans bilgileri getirilemedi' });
    }
});

// Avans kaydet
router.post('/:id/avanslar', async (req, res) => {
    try {
        const { id } = req.params;
        const { tarih, tutar, aciklama, profile_id } = req.body;

        // 1. Personel bilgilerini al
        const pResult = await query('SELECT ad_soyad FROM personeller WHERE id = $1', [id]);
        if (pResult.rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı' });
        const adSoyad = pResult.rows[0].ad_soyad;

        // 2. Varsayılan kasayı bul
        const kasaResult = await query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [profile_id]);
        const defaultKasaId = kasaResult.rows.length > 0 ? kasaResult.rows[0].id : null;

        const bugun = new Date().toISOString().split('T')[0];
        const isFuture = tarih > bugun;

        // 3. Avansı kaydet
        const result = await query(
            `INSERT INTO personel_avanslar (personel_id, tarih, tutar, aciklama, profile_id, kasa_id, durum)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [id, tarih, tutar, aciklama || '', profile_id, defaultKasaId, isFuture ? 'Bekliyor' : 'Ödendi']
        );

        // 4. Eğer bugün veya geçmişse ödemeler defterine ekle ve kasadan düş
        if (!isFuture) {
            const odemeResult = await query(
                `INSERT INTO odemeler (cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id, kasa_id)
                 VALUES ($1, 'Ödeme', $2, $3, 'Nakit', $4, $5, $6)
                 RETURNING id`,
                [adSoyad, tutar, tarih, `Personel Avansı: ${aciklama || ''}`, profile_id, defaultKasaId]
            );

            await query('UPDATE personel_avanslar SET odeme_id = $1 WHERE id = $2', [odemeResult.rows[0].id, result.rows[0].id]);

            if (defaultKasaId) {
                await query('UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [tutar, defaultKasaId]);
            }

            // 5. Otomatik gider kaydı oluştur (Ana Kasa raporlaması için)
            // "Personel Avansı" kategorisini bul veya oluştur
            let katResult = await query(
                "SELECT id FROM gider_kategorileri WHERE profile_id = $1 AND ad = 'Personel Avansı'",
                [profile_id]
            );
            if (katResult.rows.length === 0) {
                katResult = await query(
                    "INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, 'Personel Avansı', 'ri-hand-coin-line', '#f59e0b') RETURNING id",
                    [profile_id]
                );
            }
            const kategoriId = katResult.rows[0].id;

            // Gideri kaydet (kasadan düşme yok — zaten yukarıda düşüldü)
            await query(
                `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
                 VALUES ($1, $2, $3, $4, $5, 'Nakit', $6, $7)`,
                [profile_id, kategoriId, tutar, tarih, defaultKasaId, `Personel Avansı: ${adSoyad} - ${aciklama || ''}`, req.user.email]
            );

            // 6. Personel bakiyesini güncelle (borçlandır/alacağını azalt)
            await query('UPDATE personeller SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [tutar, id]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Avans kaydetme hatası:', error);
        res.status(500).json({ error: 'Avans kaydedilemedi' });
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
        const devamsizlikKesintisi = eksikGun * gunlukUcret;

        // O ayki toplam avansları al
        const aResult = await query(
            `SELECT COALESCE(SUM(tutar), 0) as toplam_avans FROM personel_avanslar 
             WHERE personel_id = $1 
             AND EXTRACT(YEAR FROM tarih) = $2 AND EXTRACT(MONTH FROM tarih) = $3`,
            [id, yil, ay]
        );
        const toplamAvans = parseFloat(aResult.rows[0].toplam_avans);

        const toplamKesinti = devamsizlikKesintisi + toplamAvans;
        const odenecekMaas = Math.max(0, aylikMaas - toplamKesinti);

        res.json({
            aylik_maas: aylikMaas,
            eksik_gun: eksikGun,
            kesinti: devamsizlikKesintisi,
            toplam_avans: toplamAvans,
            toplam_kesinti: toplamKesinti,
            odenecek_maas: odenecekMaas,
            yil,
            ay
        });
    } catch (error) {
        console.error('Maaş hesaplama hatası:', error);
        res.status(500).json({ error: 'Maaş özeti hesaplanamadı' });
    }
});

// Maaş Öde (Gider Kaydı Oluşturur)
router.post('/:id/maas-odemesi', async (req, res) => {
    try {
        const { id } = req.params;
        const { tutar, tarih, aciklama, profile_id, kasa_id } = req.body;

        if (!tutar || !profile_id || !kasa_id) {
            return res.status(400).json({ error: 'Tutar, profile_id ve kasa_id gerekli' });
        }

        // 1. Personel bilgilerini al
        const pResult = await query('SELECT ad_soyad FROM personeller WHERE id = $1', [id]);
        if (pResult.rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı' });
        const adSoyad = pResult.rows[0].ad_soyad;

        // 2. Ödemeler tablosuna kaydet
        const odemeResult = await query(
            `INSERT INTO odemeler (cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id, kasa_id)
             VALUES ($1, 'Ödeme', $2, $3, 'Nakit', $4, $5, $6)
             RETURNING id`,
            [adSoyad, tutar, tarih || new Date(), `Maaş Ödemesi: ${aciklama || ''}`, profile_id, kasa_id]
        );

        // 3. Kasadan düş
        await query('UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [tutar, kasa_id]);

        // 4. "Personel Maaşı" kategorisini bul veya oluştur
        let katResult = await query(
            "SELECT id FROM gider_kategorileri WHERE profile_id = $1 AND ad = 'Personel Maaşı'",
            [profile_id]
        );
        if (katResult.rows.length === 0) {
            katResult = await query(
                "INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, 'Personel Maaşı', 'ri-user-star-line', '#8b5cf6') RETURNING id",
                [profile_id]
            );
        }
        const kategoriId = katResult.rows[0].id;

        // 5. Gider kaydı oluştur
        const giderResult = await query(
            `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
             VALUES ($1, $2, $3, $4, $5, 'Nakit', $6, $7)
             RETURNING id`,
            [profile_id, kategoriId, tutar, tarih || new Date(), kasa_id, `Maaş Ödemesi: ${adSoyad} - ${aciklama || ''}`, req.user.email]
        );

        // 6. Denetim kaydı
        await AuditService.log(
            profile_id,
            'EKLEME',
            'giderler',
            giderResult.rows[0].id,
            `Maaş ödemesi giderlere işlendi: ${adSoyad} - ${tutar} TL`,
            req.user.email
        );

        // 7. Personel bakiyesini güncelle
        await query('UPDATE personeller SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [tutar, id]);

        res.json({ success: true, message: 'Maaş ödemesi başarıyla kaydedildi' });
    } catch (error) {
        console.error('Maaş ödeme hatası:', error);
        res.status(500).json({ error: 'Maaş ödemesi kaydedilemedi' });
    }
});

// Maaş Tahakkuku (Hakediş Kaydı - Bakiyeyi Artırır)
router.post('/:id/maas-tahakkuku', async (req, res) => {
    try {
        const { id } = req.params;
        const { tutar, tarih, aciklama, profile_id } = req.body;

        if (!tutar || !profile_id) {
            return res.status(400).json({ error: 'Tutar ve profile_id gerekli' });
        }

        // Personel bilgilerini al
        const pResult = await query('SELECT ad_soyad FROM personeller WHERE id = $1', [id]);
        if (pResult.rows.length === 0) return res.status(404).json({ error: 'Personel bulunamadı' });
        const adSoyad = pResult.rows[0].ad_soyad;

        // Personel bakiyesini artır (Alacaklandır)
        await query('UPDATE personeller SET bakiye = bakiye + $1, updated_at = NOW() WHERE id = $2', [tutar, id]);

        // Denetim kaydı
        await AuditService.log(
            profile_id,
            'GÜNCELLEME',
            'personeller',
            id,
            `Maaş hakedişi kaydedildi: ${adSoyad} - ${tutar} TL`,
            req.user.email
        );

        res.json({ success: true, message: 'Maaş hakedişi başarıyla kaydedildi' });
    } catch (error) {
        console.error('Maaş hakediş hatası:', error);
        res.status(500).json({ error: 'Maaş hakedişi kaydedilemedi' });
    }
});

module.exports = router;
