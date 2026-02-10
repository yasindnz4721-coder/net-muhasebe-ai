const { query } = require('../db');
const NotificationService = require('./notificationService');

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
    }
};

module.exports = AutomationService;
