const { query } = require('../db');

const NotificationService = {
    async create(profile_id, baslik, mesaj, tip = 'info') {
        try {
            // Bugün aynı başlıkla bildirim atılmış mı kontrol et (spam engellemek için)
            const exists = await query(
                `SELECT id FROM bildirimler 
                 WHERE profile_id = $1 AND baslik = $2 
                 AND olusturma_tarihi >= CURRENT_DATE`,
                [profile_id, baslik]
            );

            if (exists.rows.length === 0) {
                await query(
                    'INSERT INTO bildirimler (profile_id, baslik, mesaj, tip) VALUES ($1, $2, $3, $4)',
                    [profile_id, baslik, mesaj, tip]
                );
            }
        } catch (error) {
            console.error('Bildirim oluşturma hatası:', error);
        }
    },

    async checkAll(profile_id) {
        await this.checkLowCash(profile_id);
        await this.checkUpcomingInstallments(profile_id);
        // Expense increase check is more complex, skipping for initial version
    },

    async checkLowCash(profile_id) {
        const result = await query(
            "SELECT bakiye FROM kasalar WHERE profile_id = $1 AND is_default = TRUE",
            [profile_id]
        );
        if (result.rows.length > 0) {
            const bakiye = parseFloat(result.rows[0].bakiye);
            if (bakiye < 1000 && bakiye >= 0) {
                await this.create(profile_id, 'Düşük Kasa Uyarısı', `Ana kasa bakiyeniz ${bakiye} TL'ye düştü. Harcamalarınıza dikkat edin.`, 'warning');
            } else if (bakiye < 0) {
                await this.create(profile_id, 'Kasa Eksiye Düştü!', `Ana kasa bakiyeniz ${bakiye} TL ile eksiye düştü!`, 'error');
            }
        }
    },

    async checkUpcomingInstallments(profile_id) {
        const result = await query(
            `SELECT t.cari_ad, o.vade_tarihi, o.tutar 
             FROM taksit_odemeleri o
             JOIN taksitler t ON o.taksit_id = t.id
             WHERE o.profile_id = $1 AND o.durum = 'Bekliyor'
             AND o.vade_tarihi <= CURRENT_DATE + INTERVAL '3 days'
             AND o.vade_tarihi >= CURRENT_DATE`,
            [profile_id]
        );

        for (const row of result.rows) {
            await this.create(
                profile_id,
                'Yaklaşan Taksit',
                `${row.cari_ad} için ${new Date(row.vade_tarihi).toLocaleDateString('tr-TR')} tarihli ${row.tutar} TL taksit ödemesi yaklaşıyor.`,
                'info'
            );
        }
    }
};

module.exports = NotificationService;
