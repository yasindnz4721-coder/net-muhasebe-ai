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
        const userResult = await query('SELECT role, current_profile_id FROM users WHERE id = $1', [decoded.id]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        req.user = {
            ...decoded,
            role: userResult.rows[0].role,
            profile_id: userResult.rows[0].current_profile_id
        };


        next();
    } catch (error) {
        console.error('Auth middleware hatası:', error);
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }
};

module.exports = authMiddleware;
