const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
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

app.post('/api/send-ticket-email', async (req, res) => {
    const { host, port, user, pass, to, participantName, tourName, flights } = req.body;
    const senderBrand = 'Move Travel & Mice';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host, port: Number(port), secure: Number(port) === 465, auth: { user, pass }
        });

        let flightsHtml = flights.map(f => `
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px dashed #cbd5e1;">
                <div style="font-weight:bold; color: #D7147A; margin-bottom: 8px;">${f.type || 'Uçuş'} - ${f.airline || ''}</div>
                <div><strong>Kalkış:</strong> ${f.from || '-'} <strong>Varış:</strong> ${f.to || '-'}</div>
                <div><strong>Tarih:</strong> ${f.date || '-'} ${f.departureTime || '-'}</div>
                <div><strong>Uçuş Kodu:</strong> ${f.flightNo || '-'}</div>
                <div><strong>PNR:</strong> ${f.pnr || '-'}</div>
                <div><strong>Bilet No:</strong> ${f.ticketNo || '-'}</div>
            </div>
        `).join('');

        let htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Biletleriniz Sisteme Eklendi</h2>
                <p>Sayın <strong>${participantName}</strong>,</p>
                <p><strong>${tourName}</strong> seyahatiniz için uçuş biletleriniz sisteme başarıyla işlenmiştir. Detayları aşağıda bulabilirsiniz:</p>
                ${flightsHtml}
                <p>Uygulamamıza giriş yaparak seyahatiniz ile ilgili detaylara dilediğiniz zaman ulaşabilirsiniz.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"${senderBrand}" <${user}>`,
            to: to,
            subject: `${senderBrand}: Uçuş Biletleriniz Sisteme Eklendi`,
            html: htmlContent
        });

        return res.json({ success: true, message: `Bilet e-postası başarıyla gönderildi.` });
    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ success: false, message: `SMTP Hatası: ${error.message}` });
    }
});

app.post('/api/send-tour-email', async (req, res) => {
    const { host, port, user, pass, to, corporateName, participantName, tourName, password } = req.body;
    const senderBrand = corporateName || 'Move Travel & Mice';

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

        let htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 48px; height: 48px; background: #D7147A; color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
                        M
                    </div>
                </div>
                <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Seyahat Kaydı Başarılı</h2>
                <p>Sayın <strong>${participantName}</strong>,</p>
                <p><strong>${tourName}</strong> seyahatine kaydınız başarıyla yapılmıştır.</p>
        `;

        if (password) {
            htmlContent += `
                <p>Sisteme giriş yapabilmeniz için kullanıcı adınız ve parolanız aşağıdadır:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px dashed #cbd5e1; text-align: center;">
                    <div style="margin-bottom: 8px;"><strong>Kullanıcı Adı:</strong> ${to}</div>
                    <div><strong>Şifre:</strong> ${password}</div>
                </div>
            `;
        }

        htmlContent += `
                <p>Uygulamamıza giriş yaparak seyahatiniz ile ilgili uçuş, transfer, tur programı ve yetkili bilgilerine dilediğiniz zaman ulaşabilirsiniz.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"${senderBrand}" <${user}>`,
            to: to,
            subject: `${senderBrand}: ${tourName} Seyahati Kaydınız Alındı`,
            html: htmlContent
        });

        return res.json({ success: true, message: `Bilgilendirme e-postası ${to} adresine başarıyla gönderildi.` });

    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ success: false, message: `SMTP Hatası: ${error.message}` });
    }
});

app.post('/api/send-whatsapp', async (req, res) => {
    const { phoneId, accessToken, to, templateName, languageCode, parameters } = req.body;

    if (!phoneId || !accessToken || !to || !templateName) {
        return res.status(400).json({ success: false, message: 'WhatsApp API ayarları veya alıcı/şablon bilgisi eksik.' });
    }

    const cleanPhone = to.replace(/[^0-9]/g, '');

    try {
        const bodyData = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: languageCode || 'tr'
                }
            }
        };

        if (parameters && parameters.length > 0) {
            bodyData.template.components = [
                {
                    type: "body",
                    parameters: parameters.map(p => ({
                        type: "text",
                        text: String(p)
                    }))
                }
            ];
        }

        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        const resData = await response.json();

        if (response.ok) {
            return res.json({ success: true, message: 'WhatsApp mesajı başarıyla sıraya alındı.', data: resData });
        } else {
            console.error("WhatsApp API Error:", resData);
            return res.status(response.status).json({ 
                success: false, 
                message: `WhatsApp API Hatası: ${resData.error?.message || 'Bilinmeyen Hata'}`, 
                data: resData 
            });
        }
    } catch (error) {
        console.error("WhatsApp Sunucu Hatası:", error);
        return res.status(500).json({ success: false, message: `WhatsApp Sunucu Hatası: ${error.message}` });
    }
});

app.get('/api/tcmb-rates', async (req, res) => {
    try {
        const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
        const xml = await response.text();
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error("TCMB Hata:", error);
        res.status(500).json({ success: false, message: 'TCMB kurları alınamadı' });
    }
});

exports.checkinReminder = onSchedule("every 1 hours", async (event) => {
    try {
        const db = admin.firestore();
        const settingsSnap = await db.collection('settings').doc('global').get();
        if (!settingsSnap.exists) return;
        const smtpConfig = settingsSnap.data().smtpConfig;
        if (!smtpConfig?.host || !smtpConfig?.user) return;

        const transporter = nodemailer.createTransport({
            host: smtpConfig.host, port: Number(smtpConfig.port),
            secure: Number(smtpConfig.port) === 465,
            auth: { user: smtpConfig.user, pass: smtpConfig.pass }
        });

        const now = new Date();
        const toursSnap = await db.collection('tours').get();
        
        for (const tourDoc of toursSnap.docs) {
            const tour = tourDoc.data();
            if (!tour.participants) continue;
            
            for (const p of tour.participants) {
                if (!p.flights) continue;
                for (let i = 0; i < p.flights.length; i++) {
                    const f = p.flights[i];
                    if (!f.date || !f.departureTime || f.type !== 'Gidiş Uçuşu') continue;
                    
                    const flightDate = new Date(`${f.date}T${f.departureTime}:00`);
                    if (isNaN(flightDate.getTime())) continue;
                    
                    const diffHours = (flightDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    
                    // Trigger strictly if exactly 47-48 hours remaining (runs every hour, so it will hit once)
                    if (diffHours > 47 && diffHours <= 48) {
                        const usersSnap = await db.collection('users').where('id', '==', p.id).get();
                        if (usersSnap.empty) continue;
                        const userObj = usersSnap.docs[0].data();
                        if (!userObj.email || !userObj.email.includes('@')) continue;

                        let htmlContent = `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="width: 48px; height: 48px; background: #D7147A; color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
                                        M
                                    </div>
                                </div>
                                <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Check-in Hatırlatması</h2>
                                <p>Sayın <strong>${p.name}</strong>,</p>
                                <p><strong>${tour.name}</strong> seyahatinize 48 saatten az bir zaman kaldı!</p>
                                <p>Lütfen <strong>${f.airline || 'havayolu'}</strong> web sayfasını ziyaret ederek check-in işleminizi tamamlayınız.</p>
                                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px dashed #cbd5e1; text-align: center;">
                                    <div style="margin-bottom: 8px;"><strong>PNR:</strong> ${f.pnr || '-'}</div>
                                    <div><strong>Bilet No:</strong> ${f.ticketNo || '-'}</div>
                                </div>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
                            </div>
                        `;

                        await transporter.sendMail({
                            from: `"Move Travel & Mice" <${smtpConfig.user}>`,
                            to: userObj.email,
                            subject: `Seyahatinize 48 Saat Kaldı - Check-in Hatırlatması`,
                            html: htmlContent
                        });
                    }
                }
            }
        }
    } catch (e) { console.error("Cron Error", e); }
});

// Expose the Express app as a single Cloud Function named 'backend' using Gen 2
exports.backend = onRequest({ cors: true, maxInstances: 10 }, app);
