const { onRequest } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
    const { host, port, user, pass, to, corporateName } = req.body;
    const senderBrand = corporateName || 'Base44';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik. Lütfen yapılandırmayı kontrol edin.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: {
                user: user,
                pass: pass
            }
        });

        // Test credentials silently first
        await transporter.verify();

        // Dispatch test email
        await transporter.sendMail({
            from: `"${senderBrand} Sistem Raporu" <${user}>`,
            to: to,
            subject: `${senderBrand}: SMTP Entegrasyon Testi Başarılı`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #10b981;">Tebrikler! Sunucu Bağlantısı Kuruldu.</h2>
                    <p>Eğer bu maili alıyorsanız, ${senderBrand} Travel CRM Arayüzünüz (Frontend) Cloud Functions ile başarıyla haberleşmiş ve kurumsal e-posta hesabınızla iletişim kurmuştur.</p>
                    <hr style="border: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #666;">Bu otomatik bir test mesajıdır. Lütfen cevaplamayınız.</p>
                </div>
            `
        });

        return res.json({ success: true, message: `Test maili belirtilen adrese başarıyla iletildi! Lütfen spam/gereksiz klasörünü kontrol edin.` });

    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ 
            success: false, 
            message: `SMTP Hatası: ${error.message}` 
        });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { host, port, user, pass, to, corporateName, accountName, accountPassword } = req.body;
    const senderBrand = corporateName || 'Base44 CRM';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik. Lütfen yapılandırmayı kontrol edin.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user: user, pass: pass }
        });

        await transporter.verify();

        await transporter.sendMail({
            from: `"${senderBrand} Güvenlik Birimi" <${user}>`,
            to: to,
            subject: `${senderBrand}: Parola Sıfırlama / Hatırlatma Talebi`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #D7147A; margin-top: 0;">Parola Hatırlatma</h2>
                    <p>Merhaba <strong>${accountName}</strong>,</p>
                    <p>${senderBrand} sistemine giriş yapabilmeniz için sistemde kayıtlı olan güncel parolanız aşağıdadır:</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1;">
                        ${accountPassword}
                    </div>
                    <p>Güvenliğiniz için sisteme giriş yaptıktan sonra "Hesap Ayarları" bölümünden parolanızı düzenli olarak değiştirmeyi unutmayın.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #94a3b8;">Eğer bu talebi siz yapmadıysanız lütfen kurum yöneticinizle irtibata geçin.</p>
                </div>
            `
        });

        return res.json({ success: true, message: `Şifre bilgisi ${to} adresine başarıyla gönderildi.` });

    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ success: false, message: `SMTP Hatası: Kurye sunucuya ulaşılamadı (${error.message})` });
    }
});

app.post('/api/send-sms', async (req, res) => {
    const { usercode, password, header, to, message } = req.body;

    if (!usercode || !password || !header || !to || !message) {
        return res.status(400).json({ success: false, message: 'SMS konfigürasyonu eksik (Abone No, Şifre, Başlık veya Alıcı).' });
    }

    try {
        const urlParams = new URLSearchParams({
            usercode: usercode,
            password: password,
            gsmno: Array.isArray(to) ? to.join(',') : to,
            message: message,
            msgheader: header,
            filter: '0'
        });

        const fetchRes = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${urlParams.toString()}`);
        const responseText = await fetchRes.text();
        
        if (responseText.startsWith('00')) {
            return res.json({ success: true, message: `Mesaj başarıyla şebekeye iletildi. (KOD: ${responseText.slice(0,25)})` });
        } else {
            let trError = "Sistem Hatası";
            if(responseText.includes('30')) trError = "Geçersiz Abone No veya Şifre.";
            if(responseText.includes('40')) trError = "Geçersiz Gönderici Başlığı (Onaysız Kaşe).";
            if(responseText.includes('20')) trError = "Mesaj metni veya limit hatası.";
            
            return res.status(400).json({ success: false, message: `Bağlantı Kuruldu Ancak Şebeke Reddetti: ${trError} (NETGSM Kodu: ${responseText})` });
        }
    } catch (error) {
        console.error("SMS Gönderim Hatası:", error);
        return res.status(500).json({ success: false, message: `Müşteri Ağı Hatası: ${error.message}` });
    }
});

// Expose the Express app as a single Cloud Function named 'backend' using Gen 2
exports.backend = onRequest({ cors: true, maxInstances: 10, invoker: "public" }, app);
