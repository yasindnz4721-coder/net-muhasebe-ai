const { query } = require('../db');

const AuditService = {
    async log(profile_id, islem_tipi, tablo_adi, kayit_id, aciklama, kullanici_email) {
        try {
            await query(
                `INSERT INTO denetim_kayitlari (profile_id, islem_tipi, tablo_adi, kayit_id, aciklama, kullanici_email)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [profile_id, islem_tipi, tablo_adi, kayit_id, aciklama, kullanici_email]
            );
        } catch (error) {
            console.error('Denetim kaydı oluşturma hatası:', error);
        }
    }
};

module.exports = AuditService;
