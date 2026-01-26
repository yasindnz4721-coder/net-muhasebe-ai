const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Kullanıcı kaydı (Ortak Hesap Desteği)
router.post('/register', async (req, res) => {
    try {
        const { email, password, companyName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
        }

        // E-postaları ayır ve temizle
        const emails = email.split(',').map(e => e.trim().toLowerCase()).filter(e => e);

        if (emails.length === 0) {
            return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin' });
        }

        // Şifre hashleme
        const passwordHash = await bcrypt.hash(password, 10);

        // 1. Ortak Profil oluştur
        const profileId = require('crypto').randomUUID();
        const firstEmail = emails[0];
        const profileName = companyName || firstEmail.split('@')[0];

        await query(
            'INSERT INTO profiles (id, name, logo_url) VALUES ($1, $2, $3)',
            [profileId, profileName, '']
        );

        const createdUsers = [];

        // 2. Her e-posta için kullanıcı oluştur (zaten varsa sadece bağla)
        for (const userEmail of emails) {
            let userId;
            const existingUser = await query('SELECT id FROM users WHERE email = $1', [userEmail]);

            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].id;
                // Mevcut kullanıcının varsayılan profilini bu yeni profil yap (opsiyonel)
                await query('UPDATE users SET current_profile_id = $1 WHERE id = $2', [profileId, userId]);
            } else {
                const userResult = await query(
                    'INSERT INTO users (email, password_hash, current_profile_id, subscription_tier) VALUES ($1, $2, $3, $4) RETURNING id',
                    [userEmail, passwordHash, profileId, 'pro']
                );

                userId = userResult.rows[0].id;
            }

            // 3. Kullanıcı-Profil ilişkisini kur
            await query(
                'INSERT INTO user_profiles (user_id, profile_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, profileId]
            );

            createdUsers.push({ id: userId, email: userEmail });
        }

        const primaryEmail = emails[0];
        const primaryUserQuery = await query('SELECT id, email, role FROM users WHERE email = $1', [primaryEmail]);

        const primaryUser = primaryUserQuery.rows[0];

        // JWT token oluştur (ilk kullanıcı için)
        const token = jwt.sign(
            { id: primaryUser.id, email: primaryUser.email, role: primaryUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: primaryUser,
            token,
            shared_with: createdUsers.slice(1).map(u => u.email)
        });

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ error: 'Kayıt işlemi başarısız' });
    }
});

// Giriş
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
        }

        // Kullanıcı bul
        const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
        }

        const user = result.rows[0];

        // Şifre kontrolü
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                subscription_tier: user.subscription_tier
            },
            token
        });

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }
});

// Mevcut kullanıcı bilgisi
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT id, email, role, subscription_tier, created_at FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('Kullanıcı bilgisi hatası:', error);
        res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı' });
    }
});

// Şifre güncelleme
router.post('/update-password', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);

        res.json({ message: 'Şifre başarıyla güncellendi' });
    } catch (error) {
        console.error('Şifre güncelleme hatası:', error);
        res.status(500).json({ error: 'Şifre güncellenemedi' });
    }
});

// Çıkış (client-side token silme yeterli, ama endpoint olsun)
router.post('/logout', (req, res) => {
    res.json({ message: 'Çıkış başarılı' });
});

module.exports = router;
