const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'netmuhasebe.al@gmail.com',
        // Bu şifre env dosyasından gelmeli. Eğer kullanıcı henüz şifre vermediyse 
        // pasif kalır veya hata verir.
        pass: process.env.EMAIL_PASSWORD
    }
});

const EmailService = {
    async sendWelcomeEmail(email) {
        if (!process.env.EMAIL_PASSWORD) {
            console.warn('EMAIL_PASSWORD tanımlanmadığı için hoşgeldin maili gönderilemedi.');
            return;
        }

        const mailOptions = {
            from: '"Net Muhasebe AI" <netmuhasebe.al@gmail.com>',
            to: email,
            subject: 'Aramıza Hoş Geldiniz! 🚀 | Net Muhasebe AI',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h1 style="color: #4f46e5;">Net Muhasebe AI'ya Hoş Geldiniz!</h1>
                    <p>Merhaba,</p>
                    <p>İşletmenizi akıllıca yönetmeye başladığınız için çok mutluyuz. Net Muhasebe AI ile artık tüm finansal süreçleriniz kontrolünüz altında.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Neler Yapabilirsiniz?</h3>
                        <ul>
                            <li>Gelişmiş fatura takibi</li>
                            <li>Üretim ve stok yönetimi</li>
                            <li>Personel maaş ve yan hak takibi</li>
                            <li>Yapay zeka analizleri</li>
                        </ul>
                    </div>
                    <p>Herhangi bir sorunuz olursa bu maili cevaplayarak teknik desteğimize ulaşabilirsiniz.</p>
                    <p>Başarılar dileriz,<br><strong>Net Muhasebe AI Ekibi</strong></p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Hoşgeldin maili gönderildi: ${email}`);
        } catch (error) {
            console.error('Mail gönderme hatası:', error);
        }
    },

    async sendReminderEmail(email, type, details) {
        if (!process.env.EMAIL_PASSWORD) return;

        const subjects = {
            'taksit': '📌 Ödeme Hatırlatması: Yaklaşan Taksitleriniz',
            'cek': '💳 Çek Ödeme Hatırlatması',
            'vergi': '📝 Vergi Tahakkuk Bildirimi'
        };

        const mailOptions = {
            from: '"Net Muhasebe AI" <netmuhasebe.al@gmail.com>',
            to: email,
            subject: subjects[type] || 'Net Muhasebe Bildirimi',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5;">İşlem Hatırlatması</h2>
                    <p>Merhaba, sistemimizde vadesi yaklaşan bir işleminiz bulunmaktadır.</p>
                    <div style="background: #fef2f2; padding: 20px; border-radius: 10px; border: 1px solid #fee2e2; margin: 20px 0;">
                        <p><strong>Detaylar:</strong></p>
                        <p>${details}</p>
                    </div>
                    <p>Lütfen gerekli kontrolleri yaparak işlemlerinizi zamanında tamamlamayı unutmayın.</p>
                    <p>İyi çalışmalar,<br><strong>Net Muhasebe AI Otomasyon Sistemi</strong></p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Hatırlatma maili gönderildi: ${email}`);
        } catch (error) {
            console.error('Reminder mail gönderme hatası:', error);
        }
    }
};

module.exports = EmailService;
