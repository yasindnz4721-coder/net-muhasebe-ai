const { query, pool } = require('../db');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');

const AutomationService = {
    async checkAndRecordSalaries(profile_id) {
        try {
            const shimbi = new Date();
            // Maaş ödemelerini ayın 1'inde bir önceki ay için yapalım (daha sağlıklı hesaplama için)
            // Eğer bugün ayın 1'i değilse ve ayın 25'inden sonraysa da çalışabilir (isteğe bağlı)
            // Ama kullanıcı "ayı 1'i değil ama tetiklendi" dediği için tam 1'ine sabitleyelim.
            if (shimbi.getDate() !== 1) return;

            const hedefTarih = new Date(shimbi.getFullYear(), shimbi.getMonth() - 1, 1);
            const ay = hedefTarih.getMonth() + 1;
            const yil = hedefTarih.getFullYear();

            // Bu ay için maaş ödemesi yapılmamış personelleri bul
            const result = await query(
                `SELECT p.id, p.ad_soyad, p.maas, k.id as kasa_id
                 FROM personeller p
                 LEFT JOIN kasalar k ON k.profile_id = p.profile_id AND k.is_default = TRUE
                 WHERE p.profile_id = $1 AND p.durum = 'Aktif'
                 AND p.id NOT IN (
                     SELECT personel_id FROM odemeler 
                     WHERE profile_id = $1 AND personel_id IS NOT NULL 
                     AND EXTRACT(MONTH FROM tarih) = $2 AND EXTRACT(YEAR FROM tarih) = $3
                     AND aciklama LIKE '%Maaş Ödemesi%'
                 )`,
                [profile_id, ay, yil]
            );

            for (const p of result.rows) {
                const brütMaas = parseFloat(p.maas);

                // 1. Avansları bul
                const avansResult = await query(
                    `SELECT COALESCE(SUM(tutar), 0) as toplam_avans 
                     FROM personel_avanslar 
                     WHERE personel_id = $1 AND profile_id = $2 
                     AND EXTRACT(MONTH FROM tarih) = $3 AND EXTRACT(YEAR FROM tarih) = $4`,
                    [p.id, profile_id, ay, yil]
                );
                const toplamAvans = parseFloat(avansResult.rows[0].toplam_avans);

                // 2. Puantaj kesintilerini bul (Eksik gün)
                const puantajResult = await query(
                    `SELECT COUNT(*) as eksik_gun FROM personel_puantaj 
                     WHERE personel_id = $1 AND profile_id = $2 AND durum = 'Gelmedi' 
                     AND EXTRACT(MONTH FROM tarih) = $3 AND EXTRACT(YEAR FROM tarih) = $4`,
                    [p.id, profile_id, ay, yil]
                );
                const eksikGun = parseInt(puantajResult.rows[0].eksik_gun);
                const kesinti = (brütMaas / 30) * eksikGun;

                // Net Ödenecek
                const netTutar = Math.max(0, brütMaas - toplamAvans - kesinti);

                if (netTutar > 0 && p.kasa_id) {
                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');

                        const aciklama = `${ay}/${yil} Maaş Ödemesi (Otomatik)`;

                        // 1. Giderler tablosuna ekle (Raporlar için) - Önce bunu yapıyoruz ki ID alabilelim
                        let katRes = await client.query(
                            "SELECT id FROM gider_kategorileri WHERE profile_id = $1 AND ad = 'Personel Maaşı'",
                            [profile_id]
                        );
                        let kategoriId;
                        if (katRes.rows.length === 0) {
                            const newKat = await client.query(
                                "INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, 'Personel Maaşı', 'ri-user-star-line', '#8b5cf6') RETURNING id",
                                [profile_id]
                            );
                            kategoriId = newKat.rows[0].id;
                        } else {
                            kategoriId = katRes.rows[0].id;
                        }

                        const giderRes = await client.query(
                            `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
                             VALUES ($1, $2, $3, CURRENT_DATE, $4, 'Nakit', $5, $6) RETURNING id`,
                            [profile_id, kategoriId, netTutar, p.kasa_id, aciklama, 'sistem@otomasyon']
                        );
                        const giderId = giderRes.rows[0].id;

                        // 2. Ödemeler tablosuna ekle (Kasa takibi için) - gider_id ile bağla
                        await client.query(
                            `INSERT INTO odemeler (profile_id, personel_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, kasa_id, gider_id)
                             VALUES ($1, $2, $3, 'Ödeme', $4, CURRENT_DATE, 'Nakit', $5, $6, $7)`,
                            [profile_id, p.id, p.ad_soyad, netTutar, aciklama, p.kasa_id, giderId]
                        );

                        // 3. Kasadan düş
                        await client.query(
                            "UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2",
                            [netTutar, p.kasa_id]
                        );

                        await client.query('COMMIT');

                        await NotificationService.create(
                            profile_id,
                            'Otomatik Maaş Kaydı',
                            `${p.ad_soyad} için ${netTutar.toLocaleString('tr-TR')} TL tutarındaki ${ay}/${yil} ayı maaş ödemesi sisteme gider ve ödeme olarak kaydedildi.`,
                            'success'
                        );

                    } catch (err) {
                        await client.query('ROLLBACK');
                        console.error('Maaş kayıt işlemi hatası:', err);
                    } finally {
                        client.release();
                    }
                }
            }
        } catch (error) {
            console.error('Maaş otomasyon hatası:', error);
        }
    },

    async checkAndRecordMonthlyVAT(profile_id) {
        try {
            const shimbi = new Date();
            const ay = shimbi.getMonth(); // Önceki ay
            const yil = shimbi.getFullYear();

            // Eğer Ocak ayındaysak, geçen yılın Aralık ayına bak
            const targetAy = ay === 0 ? 12 : ay;
            const targetYil = ay === 0 ? yil - 1 : yil;

            // Kontrol: Bu ay için vergi kaydı yapılmış mı?
            const recorded = await query(
                `SELECT id FROM odemeler 
                 WHERE profile_id = $1 AND aciklama LIKE $2`,
                [profile_id, `%KDV ÖDEME YÜKÜ (${targetAy}/${targetYil})%`]
            );

            if (recorded.rows.length === 0) {
                // KDV Farkını hesapla
                const satisKDVRes = await query(
                    "SELECT SUM(kdv) as total FROM satis_faturalari WHERE profile_id = $1 AND EXTRACT(MONTH FROM tarih) = $2 AND EXTRACT(YEAR FROM tarih) = $3",
                    [profile_id, targetAy, targetYil]
                );
                const alisKDVRes = await query(
                    "SELECT SUM(kdv) as total FROM alis_faturalari WHERE profile_id = $1 AND EXTRACT(MONTH FROM tarih) = $2 AND EXTRACT(YEAR FROM tarih) = $3",
                    [profile_id, targetAy, targetYil]
                );

                const satisKDV = Number(satisKDVRes.rows[0].total || 0);
                const alisKDV = Number(alisKDVRes.rows[0].total || 0);
                const netKDV = satisKDV - alisKDV;

                if (netKDV > 0) {
                    // Merkez kasayı bul
                    const kasaRes = await query("SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE", [profile_id]);
                    const kasaId = kasaRes.rows.length > 0 ? kasaRes.rows[0].id : null;

                    if (kasaId) {
                        const client = await pool.connect();
                        try {
                            await client.query('BEGIN');

                            const aciklama = `AYLIK KDV ÖDEME YÜKÜ (${targetAy}/${targetYil}) - OTOMATİK`;

                            // 1. Giderler tablosuna ekle
                            let katRes = await client.query(
                                "SELECT id FROM gider_kategorileri WHERE profile_id = $1 AND ad = 'Vergi Ödemeleri'",
                                [profile_id]
                            );
                            let kategoriId;
                            if (katRes.rows.length === 0) {
                                const newKat = await client.query(
                                    "INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, 'Vergi Ödemeleri', 'ri-government-line', '#ef4444') RETURNING id",
                                    [profile_id]
                                );
                                kategoriId = newKat.rows[0].id;
                            } else {
                                kategoriId = katRes.rows[0].id;
                            }

                            const giderRes = await client.query(
                                `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
                                 VALUES ($1, $2, $3, CURRENT_DATE, $4, 'Nakit', $5, $6) RETURNING id`,
                                [profile_id, kategoriId, netKDV, kasaId, aciklama, 'sistem@otomasyon']
                            );
                            const giderId = giderRes.rows[0].id;

                            // 2. Ödemeler tablosuna ekle
                            await client.query(
                                `INSERT INTO odemeler (profile_id, tip, tutar, tarih, odeme_yontemi, aciklama, kasa_id, cari_ad, gider_id)
                                 VALUES ($1, 'Ödeme', $2, CURRENT_DATE, 'Nakit', $3, $4, 'VERGİ DAİRESİ', $5)`,
                                [profile_id, netKDV, aciklama, kasaId, giderId]
                            );

                            // 3. Kasadan düş
                            await client.query("UPDATE kasalar SET bakiye = bakiye - $1 WHERE id = $2", [netKDV, kasaId]);

                            await client.query('COMMIT');

                            await NotificationService.create(
                                profile_id,
                                'Otomatik KDV Tahakkuku',
                                `${targetAy}/${targetYil} dönemi için ${netKDV.toLocaleString('tr-TR')} TL KDV ödemesi kasadan düşüldü ve giderlere işlendi.`,
                                'info'
                            );
                        } catch (err) {
                            if (client) await client.query('ROLLBACK');
                            console.error('KDV otomatik kayıt hatası:', err);
                        } finally {
                            client.release();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('KDV otomasyon hatası:', error);
        }
    },

    async checkAndSendReminders(profile_id) {
        try {
            // Kullanıcının mail adresini bul (Profile'a bağlı ilk kullanıcı)
            const userRes = await query(
                `SELECT u.email FROM users u 
                 JOIN user_profiles up ON u.id = up.user_id 
                 WHERE up.profile_id = $1 LIMIT 1`,
                [profile_id]
            );
            const userEmail = userRes.rows[0]?.email;
            if (!userEmail) return;

            // 3 gün sonra vadesi gelen taksitleri bul
            const installments = await query(
                `SELECT to.*, t.cari_ad, t.aciklama as plan_aciklama 
                 FROM taksit_odemeleri to
                 JOIN taksitler t ON to.taksit_id = t.id
                 WHERE to.profile_id = $1 AND to.durum = 'Bekliyor'
                 AND to.vade_tarihi = (CURRENT_DATE + INTERVAL '3 days')`,
                [profile_id]
            );

            for (const item of installments.rows) {
                const details = `${item.cari_ad} için ${item.tutar} TL tutarındaki ${item.plan_aciklama || 'Taksit'} ödemenizin vadesine 3 gün kalmıştır.`;
                await EmailService.sendReminderEmail(userEmail, 'taksit', details);

                // Sistem içi bildirim de oluştur
                await NotificationService.create(profile_id, 'Ödeme Hatırlatması', details, 'warning');
            }
        } catch (error) {
            console.error('Hatırlatma otomasyonu hatası:', error);
        }
    },

    async checkAndProcessInstallments(profile_id) {
        try {
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

            for (const payment of duePayments.rows) {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const aciklama = `Taksit Ödemesi: ${payment.plan_aciklama || ''} (Otomatik)`;

                    // 1. Giderler tablosuna ekle
                    let katRes = await client.query(
                        "SELECT id FROM gider_kategorileri WHERE profile_id = $1 AND ad = 'Taksit Ödemeleri'",
                        [profile_id]
                    );
                    let kategoriId;
                    if (katRes.rows.length === 0) {
                        const newKat = await client.query(
                            "INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, 'Taksit Ödemeleri', 'ri-bank-card-line', '#6366f1') RETURNING id",
                            [profile_id]
                        );
                        kategoriId = newKat.rows[0].id;
                    } else {
                        kategoriId = katRes.rows[0].id;
                    }

                    const giderRes = await client.query(
                        `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
                         VALUES ($1, $2, $3, NOW(), $4, 'Nakit', $5, $6) RETURNING id`,
                        [profile_id, kategoriId, payment.tutar, defaultKasaId, aciklama, 'sistem@otomasyon']
                    );
                    const giderId = giderRes.rows[0].id;

                    // 2. Kasaya (odemeler) ekle (gider_id ile bağla)
                    const odemeResult = await client.query(
                        `INSERT INTO odemeler (cari_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id, kasa_id, gider_id)
                         VALUES ($1, $2, 'Ödeme', $3, NOW(), 'Nakit', $4, $5, $6, $7)
                         RETURNING id`,
                        [payment.cari_id, payment.cari_ad, payment.tutar, aciklama, profile_id, defaultKasaId, giderId]
                    );

                    // 3. Kasa bakiyesini güncelle
                    if (defaultKasaId) {
                        await client.query('UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [payment.tutar, defaultKasaId]);
                    }

                    // 4. Taksit ödemesini 'Ödendi' olarak işaretle
                    await client.query(
                        `UPDATE taksit_odemeleri SET durum = 'Ödendi', odeme_tarihi = NOW(), odeme_id = $1, kasa_id = $2 WHERE id = $3`,
                        [odemeResult.rows[0].id, defaultKasaId, payment.id]
                    );

                    await client.query('COMMIT');

                    await NotificationService.create(
                        profile_id,
                        'Taksit Otomatik Ödendi',
                        `${payment.cari_ad} için ${payment.tutar} TL tutarındaki taksit ödemesi kasadan düşüldü ve giderlere işlendi.`,
                        'success'
                    );
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error('Taksit otomasyon hatası:', err);
                } finally {
                    client.release();
                }
            }
        } catch (error) {
            console.error('Taksit otomasyon hatası:', error);
        }
    },

    async checkAndProcessPersonnelAdvances(profile_id) {
        try {
            const bugun = new Date().toISOString().split('T')[0];

            // Bugün vadesi gelmiş ve henüz ödenmemiş personel avanslarını bul
            const dueAdvances = await query(
                `SELECT pa.*, p.ad_soyad 
                 FROM personel_avanslar pa
                 JOIN personeller p ON pa.personel_id = p.id
                 WHERE pa.profile_id = $1 AND pa.tarih <= $2 AND pa.durum = 'Bekliyor'`,
                [profile_id, bugun]
            );

            for (const adv of dueAdvances.rows) {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    // 1. Varsayılan kasayı bul
                    const kasaResult = await client.query('SELECT id FROM kasalar WHERE profile_id = $1 AND is_default = TRUE', [profile_id]);
                    const defaultKasaId = kasaResult.rows.length > 0 ? kasaResult.rows[0].id : null;
                    const targetKasaId = adv.kasa_id || defaultKasaId;
                    const aciklama = `Personel Avansı: ${adv.aciklama || ''} (Otomatik)`;

                    // 2. Giderler tablosuna ekle
                    let katRes = await client.query(
                        "SELECT id FROM gider_kategorileri WHERE profile_id = $1 AND ad = 'Personel Avansı'",
                        [profile_id]
                    );
                    let kategoriId;
                    if (katRes.rows.length === 0) {
                        const newKat = await client.query(
                            "INSERT INTO gider_kategorileri (profile_id, ad, ikon, renk) VALUES ($1, 'Personel Avansı', 'ri-hand-coin-line', '#f59e0b') RETURNING id",
                            [profile_id]
                        );
                        kategoriId = newKat.rows[0].id;
                    } else {
                        kategoriId = katRes.rows[0].id;
                    }

                    const giderRes = await client.query(
                        `INSERT INTO giderler (profile_id, kategori_id, tutar, tarih, kasa_id, odeme_yontemi, aciklama, kullanici_email)
                         VALUES ($1, $2, $3, $4, $5, 'Nakit', $6, $7) RETURNING id`,
                        [profile_id, kategoriId, adv.tutar, adv.tarih, targetKasaId, aciklama, 'sistem@otomasyon']
                    );
                    const giderId = giderRes.rows[0].id;

                    // 3. Ödemeler defterine ekle (gider_id ile bağla)
                    const odemeResult = await client.query(
                        `INSERT INTO odemeler (cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, profile_id, kasa_id, gider_id)
                         VALUES ($1, 'Ödeme', $2, $3, 'Nakit', $4, $5, $6, $7)
                         RETURNING id`,
                        [adv.ad_soyad, adv.tutar, adv.tarih, aciklama, profile_id, targetKasaId, giderId]
                    );

                    // 4. Kasa bakiyesini güncelle
                    if (targetKasaId) {
                        await client.query('UPDATE kasalar SET bakiye = bakiye - $1, updated_at = NOW() WHERE id = $2', [adv.tutar, targetKasaId]);
                    }

                    // 5. Avansı 'Ödendi' olarak işaretle
                    await client.query(
                        `UPDATE personel_avanslar SET durum = 'Ödendi', odeme_id = $1 WHERE id = $2`,
                        [odemeResult.rows[0].id, adv.id]
                    );

                    await client.query('COMMIT');

                    await NotificationService.create(
                        profile_id,
                        'Personel Avansı Otomatik Ödendi',
                        `${adv.ad_soyad} için ${adv.tutar} TL tutarındaki avans ödemesi kasadan düşüldü ve giderlere işlendi.`,
                        'success'
                    );
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error('Personel avans otomasyon hatası:', err);
                } finally {
                    client.release();
                }
            }
        } catch (error) {
            console.error('Personel avans otomasyon hatası:', error);
        }
    }
};

module.exports = AutomationService;
