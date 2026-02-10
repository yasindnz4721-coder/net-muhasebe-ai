const { query } = require('../db');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');

const AutomationService = {
    async checkAndRecordSalaries(profile_id) {
        try {
            const shimbi = new Date();
            const ay = shimbi.getMonth() + 1;
            const yil = shimbi.getFullYear();

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
                 )`,
                [profile_id, ay, yil]
            );

            for (const p of result.rows) {
                // Bugün ayın kaçı? Eğer ayın sonu geldiyse veya 5'inden sonraysa otomatik kaydet (örnek kural)
                if (shimbi.getDate() >= 25) {
                    await query(
                        `INSERT INTO odemeler (profile_id, personel_id, cari_ad, tip, tutar, tarih, odeme_yontemi, aciklama, kasa_id)
                         VALUES ($1, $2, $3, 'Ödeme', $4, CURRENT_DATE, 'Nakit', $5, $6)`,
                        [profile_id, p.id, p.ad_soyad, p.maas, `${ay}/${yil} Maaş Ödemesi (Otomatik)`, p.kasa_id]
                    );

                    await NotificationService.create(
                        profile_id,
                        'Otomatik Maaş Kaydı',
                        `${p.ad_soyad} için ${p.maas} TL tutarındaki ${ay}/${yil} ayı maaş ödemesi sisteme gider olarak kaydedildi.`,
                        'success'
                    );
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
                        await query(
                            `INSERT INTO odemeler (profile_id, tip, tutar, tarih, odeme_yontemi, aciklama, kasa_id, cari_ad)
                             VALUES ($1, 'Ödeme', $2, CURRENT_DATE, 'Nakit', $3, $4, 'VERGİ DAİRESİ')`,
                            [profile_id, netKDV, `AYLIK KDV ÖDEME YÜKÜ (${targetAy}/${targetYil}) - OTOMATIK`, kasaId]
                        );

                        // Kasadan düş
                        await query("UPDATE kasalar SET bakiye = bakiye - $1 WHERE id = $2", [netKDV, kasaId]);

                        await NotificationService.create(
                            profile_id,
                            'Otomatik KDV Tahakkuku',
                            `${targetAy}/${targetYil} dönemi için ${netKDV.toLocaleString('tr-TR')} TL KDV ödemesi kasadan düşüldü.`,
                            'info'
                        );
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
    }
};

module.exports = AutomationService;
