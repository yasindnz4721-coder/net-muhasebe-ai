const jwt = require('jsonwebtoken');
const { query } = require('../db');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kullanıcının mevcut profilini ve rolünü veritabanından doğrula
        const userResult = await query(
            'SELECT role, current_profile_id, subscription_tier, trial_ends_at, subscription_status FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = userResult.rows[0];

        // 14 Günlük Deneme Kontrolü
        if (user.subscription_status === 'expired' || (user.trial_ends_at && new Date() > new Date(user.trial_ends_at))) {
            // Eğer daha önce expired olarak işaretlenmemişse güncelle
            if (user.subscription_status !== 'expired') {
                await query("UPDATE users SET subscription_status = 'expired' WHERE id = $1", [decoded.id]);
            }
            return res.status(403).json({
                error: 'Ücretsiz deneme süreniz sona erdi. Lütfen devam etmek için üyeliğinizi yenileyin.',
                code: 'TRIAL_EXPIRED'
            });
        }

        req.user = {
            ...decoded,
            role: user.role,
            profile_id: user.current_profile_id,
            subscription_tier: user.subscription_tier,
            trial_ends_at: user.trial_ends_at,
            subscription_status: user.subscription_status
        };


        next();
    } catch (error) {
        console.error('Auth middleware hatası:', error);
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
};

module.exports = authMiddleware;
