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

const isChildEmailAddress = (email) => {
    if (!email || typeof email !== 'string') return false;
    const lower = email.trim().toLowerCase();
    if (lower.startsWith('child_')) return true;
    if (lower.endsWith('.local') || lower.includes('@move.local')) return true;
    return false;
};

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
    const { host, port, user, pass, to, corporateName, accountName, accountPassword, customSubject, customHtml } = req.body;
    const senderBrand = corporateName || 'Base44 CRM';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik. Lütfen yapılandırmayı kontrol edin.' });
    }

    if (isChildEmailAddress(to)) {
        return res.status(400).json({ success: false, message: 'Çocuk profilleri ve dahili hesaplar için parola sıfırlama e-postası gönderilemez.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user: user, pass: pass }
        });

        await transporter.verify();

        const defaultHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #D7147A; margin-top: 0;">Parola Hatırlatma</h2>
                <p>Merhaba <strong>{{accountName}}</strong>,</p>
                <p>{{corporateName}} sistemine giriş yapabilmeniz için sistemde kayıtlı olan güncel parolanız aşağıdadır:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1;">
                    {{accountPassword}}
                </div>
                <p>Güvenliğiniz için sisteme giriş yaptıktan sonra "Hesap Ayarları" bölümünden parolanızı düzenli olarak değiştirmeyi unutmayın.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8;">Eğer bu talebi siz yapmadıysanız lütfen kurum yöneticinizle irtibata geçin.</p>
            </div>
        `;

        let htmlContent = customHtml || defaultHtml;
        htmlContent = htmlContent
            .replace(/{{accountName}}/g, accountName || '')
            .replace(/{{accountPassword}}/g, accountPassword || '')
            .replace(/{{corporateName}}/g, senderBrand);

        let subjectContent = customSubject || `{{corporateName}}: Parola Sıfırlama / Hatırlatma Talebi`;
        subjectContent = subjectContent
            .replace(/{{corporateName}}/g, senderBrand);

        await transporter.sendMail({
            from: `"${senderBrand} Güvenlik Birimi" <${user}>`,
            to: to,
            subject: subjectContent,
            html: htmlContent
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
    const { host, port, user, pass, to, participantName, tourName, flights, ticketPdf, ticketFiles, customSubject, customHtml } = req.body;
    const senderBrand = 'Move Travel & Mice';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik.' });
    }

    // CHILD OR LOCAL PLACEHOLDER EMAIL SUPPRESSION
    if (isChildEmailAddress(to)) {
        return res.json({ success: true, message: 'Çocuk kullanıcılar veya yerel hesaplar için e-posta gönderimi atlandı.' });
    }

    try {
        const db = admin.firestore();
        const userCheck = await db.collection('users').where('email', '==', to.trim().toLowerCase()).limit(1).get();
        if (!userCheck.empty) {
            const uData = userCheck.docs[0].data();
            if (uData.isChildProfile === true) {
                return res.json({ success: true, message: 'Çocuk profili için e-posta gönderimi atlandı.' });
            }
        }
    } catch (checkErr) {
        console.warn("Child check error in send-ticket-email:", checkErr);
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host, port: Number(port), secure: Number(port) === 465, auth: { user, pass }
        });

        let allTickets = [];
        if (Array.isArray(ticketFiles) && ticketFiles.length > 0) {
            allTickets = ticketFiles;
        } else if (ticketPdf) {
            allTickets = [ticketPdf];
        }

        let pdfHtml = '';
        if (allTickets.length > 0) {
            const ticketButtons = allTickets.map((t, idx) => {
                const url = typeof t === 'string' ? t : t?.url;
                const name = typeof t === 'object' ? (t.name || `Bilet #${idx + 1}`) : `Bilet #${idx + 1}`;
                if (!url) return '';
                return `
                    <div style="margin: 6px 0;">
                        <a href="${url}" target="_blank" style="display: inline-block; background: #D7147A; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px;">
                            📥 ${name} (Görüntüle / İndir)
                        </a>
                    </div>
                `;
            }).filter(Boolean).join('');

            if (ticketButtons) {
                pdfHtml = `
                    <div style="background: #f0fdf4; padding: 18px; border-radius: 12px; margin: 16px 0; border: 1px solid #bbf7d0; text-align: center;">
                        <div style="font-weight: bold; color: #166534; font-size: 15px; margin-bottom: 6px;">📄 Elektronik Uçak Biletiniz ${allTickets.length > 1 ? `(${allTickets.length} Adet PDF)` : '(PDF)'}</div>
                        <p style="margin: 0 0 12px 0; color: #15803d; font-size: 13px;">Uçuş biletlerinizi görüntülemek veya cihazınıza indirmek için aşağıdaki butonlara tıklayabilirsiniz:</p>
                        ${ticketButtons}
                    </div>
                `;
            }
        }

        let flightsHtml = '';
        if (flights && flights.length > 0) {
            flightsHtml = flights.map(f => `
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px dashed #cbd5e1;">
                    <div style="font-weight:bold; color: #D7147A; margin-bottom: 8px;">${f.type || 'Uçuş'} - ${f.airline || ''}</div>
                    <div><strong>Kalkış:</strong> ${f.from || '-'} <strong>Varış:</strong> ${f.to || '-'}</div>
                    <div><strong>Tarih:</strong> ${f.date || '-'} ${f.departureTime || '-'}</div>
                    <div><strong>Uçuş Kodu:</strong> ${f.flightNo || '-'}</div>
                    <div><strong>PNR:</strong> ${f.pnr || '-'}</div>
                    <div><strong>Bilet No:</strong> ${f.ticketNo || '-'}</div>
                </div>
            `).join('');
        }

        const defaultHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Biletleriniz Sisteme Eklendi</h2>
                <p>Sayın <strong>{{participantName}}</strong>,</p>
                <p><strong>{{tourName}}</strong> seyahatiniz için uçuş biletleriniz sisteme başarıyla işlenmiştir. Detayları aşağıda bulabilirsiniz:</p>
                {{pdfHtml}}
                {{flightsHtml}}
                <p>Uygulamamıza giriş yaparak seyahatiniz ile ilgili detaylara dilediğiniz zaman ulaşabilirsiniz.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
            </div>
        `;

        let htmlContent = customHtml || defaultHtml;
        htmlContent = htmlContent
            .replace(/{{participantName}}/g, participantName || '')
            .replace(/{{tourName}}/g, tourName || '')
            .replace(/{{pdfHtml}}/g, pdfHtml || '')
            .replace(/{{flightsHtml}}/g, flightsHtml || '');

        let subjectContent = customSubject || `{{corporateName}}: Uçuş Biletleriniz Sisteme Eklendi`;
        subjectContent = subjectContent
            .replace(/{{participantName}}/g, participantName || '')
            .replace(/{{tourName}}/g, tourName || '')
            .replace(/{{corporateName}}/g, senderBrand);

        await transporter.sendMail({
            from: `"${senderBrand}" <${user}>`,
            to: to,
            subject: subjectContent,
            html: htmlContent
        });

        return res.json({ success: true, message: `Bilet e-postası başarıyla gönderildi.` });
    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ success: false, message: `SMTP Hatası: ${error.message}` });
    }
});

app.post('/api/send-tour-email', async (req, res) => {
    const { host, port, user, pass, to, corporateName, participantName, tourName, password, customSubject, customHtml } = req.body;
    const senderBrand = corporateName || 'Move Travel & Mice';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik. Lütfen yapılandırmayı kontrol edin.' });
    }

    // CHILD OR LOCAL PLACEHOLDER EMAIL SUPPRESSION
    if (isChildEmailAddress(to)) {
        return res.json({ success: true, message: 'Çocuk kullanıcılar veya yerel hesaplar için e-posta gönderimi atlandı.' });
    }

    try {
        const db = admin.firestore();
        const userCheck = await db.collection('users').where('email', '==', to.trim().toLowerCase()).limit(1).get();
        if (!userCheck.empty) {
            const uData = userCheck.docs[0].data();
            if (uData.isChildProfile === true) {
                return res.json({ success: true, message: 'Çocuk profili için e-posta gönderimi atlandı.' });
            }
        }
    } catch (checkErr) {
        console.warn("Child check error in send-tour-email:", checkErr);
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user: user, pass: pass }
        });

        await transporter.verify();

        let credentialSection = '';
        if (password) {
            credentialSection = `
                <p>Sisteme giriş yapabilmeniz için kullanıcı adınız ve parolanız aşağıdadır:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px dashed #cbd5e1; text-align: center;">
                    <div style="margin-bottom: 8px;"><strong>Kullanıcı Adı:</strong> ${to}</div>
                    <div><strong>Şifre:</strong> ${password}</div>
                </div>
            `;
        }

        const defaultHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 48px; height: 48px; background: #D7147A; color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
                        M
                    </div>
                </div>
                <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Seyahat Kaydı Başarılı</h2>
                <p>Sayın <strong>{{participantName}}</strong>,</p>
                <p><strong>{{tourName}}</strong> seyahatine kaydınız başarıyla yapılmıştır.</p>
                {{credentialSection}}
                <p>Uygulamamıza giriş yaparak seyahatiniz ile ilgili uçuş, transfer, tur programı ve yetkili bilgilerine dilediğiniz zaman ulaşabilirsiniz.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
            </div>
        `;

        let htmlContent = customHtml || defaultHtml;
        htmlContent = htmlContent
            .replace(/{{participantName}}/g, participantName || '')
            .replace(/{{tourName}}/g, tourName || '')
            .replace(/{{credentialSection}}/g, credentialSection || '')
            .replace(/{{username}}/g, to || '')
            .replace(/{{password}}/g, password || '')
            .replace(/{{corporateName}}/g, senderBrand);

        let subjectContent = customSubject || `{{corporateName}}: {{tourName}} Seyahati Kaydınız Alındı`;
        subjectContent = subjectContent
            .replace(/{{participantName}}/g, participantName || '')
            .replace(/{{tourName}}/g, tourName || '')
            .replace(/{{corporateName}}/g, senderBrand);

        await transporter.sendMail({
            from: `"${senderBrand}" <${user}>`,
            to: to,
            subject: subjectContent,
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

    let cleanPhone = String(to).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.slice(2);
    }
    if (cleanPhone.length === 10 && cleanPhone.startsWith('5')) {
        cleanPhone = '90' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('05')) {
        cleanPhone = '90' + cleanPhone.slice(1);
    }

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

        const isAuthTemplate = templateName.toLowerCase().includes('otp') || templateName.toLowerCase().includes('auth') || templateName.toLowerCase().includes('password_reset');
        const codeVal = parameters && parameters.length > 0 ? String(parameters[0]) : '';

        if (isAuthTemplate && codeVal) {
            bodyData.template.components = [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: codeVal
                        }
                    ]
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                        {
                            type: "text",
                            text: codeVal
                        }
                    ]
                }
            ];
        } else if (parameters && parameters.length > 0) {
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

        let response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        let resData = await response.json();

        // Fallback: If OTP button component failed because template in Meta was created without button, retry with only body
        if (!response.ok && isAuthTemplate && bodyData.template.components && bodyData.template.components.length > 1) {
            const fallbackBodyData = {
                ...bodyData,
                template: {
                    ...bodyData.template,
                    components: [
                        {
                            type: "body",
                            parameters: [{ type: "text", text: codeVal }]
                        }
                    ]
                }
            };
            const fallbackRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fallbackBodyData)
            });
            const fallbackData = await fallbackRes.json();
            if (fallbackRes.ok) {
                return res.json({ success: true, message: 'WhatsApp mesajı başarıyla sıraya alındı.', data: fallbackData });
            }
        }

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

app.post('/api/create-whatsapp-template', async (req, res) => {
    const { wabaId, accessToken, name, category, language, bodyText, exampleValues } = req.body;

    if (!wabaId || !accessToken || !name) {
        return res.status(400).json({ success: false, message: 'WABA ID, Access Token ve Şablon Adı zorunludur.' });
    }

    try {
        let payload;
        const isAuth = category === 'AUTHENTICATION' || name.toLowerCase().includes('otp') || name.toLowerCase().includes('password_reset');

        if (isAuth) {
            payload = {
                name: name,
                category: "AUTHENTICATION",
                language: language || "tr",
                components: [
                    {
                        type: "BODY",
                        add_security_recommendation: true
                    },
                    {
                        type: "FOOTER",
                        code_expiration_minutes: 10
                    },
                    {
                        type: "BUTTONS",
                        buttons: [
                            {
                                type: "OTP",
                                otp_type: "COPY_CODE",
                                text: "Kodu Kopyala"
                            }
                        ]
                    }
                ]
            };
        } else {
            payload = {
                name: name,
                category: category || "UTILITY",
                allow_category_change: true,
                language: language || "tr",
                components: [
                    {
                        type: "BODY",
                        text: bodyText || "Sayın {{1}}, seyahat detaylarınız güncellenmiştir.",
                        example: {
                            body_text: [exampleValues && Array.isArray(exampleValues) ? exampleValues : ["Ahmet Yılmaz", "Klasik İtalya Turu", "https://move-yanimda.web.app/dashboard"]]
                        }
                    }
                ]
            };
        }

        const response = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok) {
            return res.json({ success: true, message: `Şablon (${payload.category}) başarıyla Meta / Facebook hesabınızda oluşturuldu ve onaya gönderildi!`, data: resData });
        } else {
            console.error("Meta Template Creation Error:", resData);
            const userTitle = resData.error?.error_user_title;
            const userMsg = resData.error?.error_user_msg;
            const errMsg = resData.error?.message;
            const errDetail = resData.error?.error_data?.details;
            
            let displayMsg = userMsg || userTitle || errMsg || 'Şablon oluşturulamadı.';
            if (errMsg && errMsg.toLowerCase().includes('invalid parameter')) {
                displayMsg = `Meta Hatası (Invalid parameter): Bu şablon adı ('${payload.name}') Meta hesabınızda daha önce reddedilmiş veya mevcut olabilir. Lütfen şablon adını değiştirin (Örn: 'password_reset_otp' veya 'move_auth_code').`;
            } else if (errDetail) {
                displayMsg += ` (${errDetail})`;
            }

            return res.status(response.status).json({
                success: false,
                message: displayMsg,
                data: resData
            });
        }
    } catch (error) {
        console.error("Meta Template Creation Server Error:", error);
        return res.status(500).json({ success: false, message: `Sunucu Hatası: ${error.message}` });
    }
});


app.get('/api/tcmb-rates', async (req, res) => {
    try {
        const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
        const xmlText = await response.text();
        const rates = { TRY: 1 };
        const regex = /<Currency[^>]*?CurrencyCode="([^"]*)"[\s\S]*?<ForexSelling>([^<]*?)<\/ForexSelling>/g;
        let match;
        while ((match = regex.exec(xmlText)) !== null) {
            const code = match[1];
            const selling = parseFloat(match[2]);
            if (code && !isNaN(selling)) {
                rates[code.toUpperCase()] = selling;
            }
        }
        res.json({ success: true, rates });
    } catch (error) {
        console.error("TCMB Hata:", error);
        res.status(500).json({ success: false, message: 'TCMB kurları alınamadı' });
    }
});

app.get('/api/akbank-rates', async (req, res) => {
    const apikey = req.query.apikey;

    if (apikey) {
        try {
            const todayStr = new Date().toISOString().slice(0, 10);
            const response = await fetch(`https://api.akbank.com/api/v2/investment/currency-exchangerates?currencyDate=${todayStr}`, {
                headers: {
                    'apikey': apikey,
                    'Content-Type': 'application/json'
                }
            });
            const resData = await response.json();
            
            if (response.ok) {
                const rates = { TRY: 1 };
                let list = [];
                if (resData && resData.data && Array.isArray(resData.data.currencyExchangeRates)) {
                    list = resData.data.currencyExchangeRates;
                } else if (resData && Array.isArray(resData.currencyExchangeRates)) {
                    list = resData.currencyExchangeRates;
                } else if (Array.isArray(resData)) {
                    list = resData;
                }

                list.forEach(item => {
                    const code = item.currencyCode || item.code;
                    const val = item.currencySellRate || item.sellRate || item.rate;
                    if (code && val) {
                        rates[code.toUpperCase()] = parseFloat(val);
                    }
                });

                if (Object.keys(rates).length > 1) {
                    return res.json({ success: true, provider: 'akbank-api', rates });
                }
            }
        } catch (apiError) {
            console.error("Akbank API hatası:", apiError);
        }
    }

    // Fallback: Fetch TCMB rates and add a +0.2% retail spread to simulate Akbank rates
    try {
        const tcmbResponse = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
        const xmlText = await tcmbResponse.text();
        const rates = { TRY: 1 };
        const regex = /<Currency[^>]*?CurrencyCode="([^"]*)"[\s\S]*?<ForexSelling>([^<]*?)<\/ForexSelling>/g;
        let match;
        while ((match = regex.exec(xmlText)) !== null) {
            const code = match[1];
            const selling = parseFloat(match[2]);
            if (code && !isNaN(selling)) {
                rates[code.toUpperCase()] = parseFloat((selling * 1.002).toFixed(4));
            }
        }
        
        if (Object.keys(rates).length > 1) {
            return res.json({ success: true, provider: 'akbank-simulated', rates });
        }
    } catch (err) {
        console.error("Fallback TCMB hatası:", err);
    }

    // Hardcoded fallback
    const baseRates = {
        TRY: 1, USD: 33.5200, EUR: 36.2800, GBP: 42.1800, JPY: 0.2220,
        CHF: 37.2200, CAD: 24.5800, AUD: 22.1500, CNY: 4.6200, RUB: 0.3630, AED: 9.1500
    };
    return res.json({ success: true, provider: 'akbank-hardcoded', rates: baseRates });
});

// ==========================================
// TINTIN AI - GOOGLE GEMINI CLOUD FUNCTION ENGINE
// ==========================================

const tintinStats = {
    totalRequests: 0,
    dailyRequests: 0,
    lastResetDate: new Date().toDateString(),
    errors: 0
};

const userRequestCounts = new Map();

const checkRateLimit = (userId, dailyLimit = 50) => {
    const today = new Date().toDateString();
    
    if (tintinStats.lastResetDate !== today) {
        tintinStats.dailyRequests = 0;
        tintinStats.lastResetDate = today;
    }
    
    if (!userId) return { allowed: true, remaining: dailyLimit };
    
    const userStat = userRequestCounts.get(userId);
    if (!userStat || userStat.date !== today) {
        userRequestCounts.set(userId, { count: 1, date: today });
        return { allowed: true, remaining: Math.max(0, dailyLimit - 1) };
    }
    
    if (userStat.count >= dailyLimit) {
        return { allowed: false, remaining: 0 };
    }
    
    userStat.count += 1;
    return { allowed: true, remaining: Math.max(0, dailyLimit - userStat.count) };
};

let cachedRates = null;
let lastRatesFetchTime = 0;

const fetchLiveExchangeRates = async () => {
    const now = Date.now();
    if (cachedRates && (now - lastRatesFetchTime < 1000 * 60 * 15)) {
        return cachedRates;
    }
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.TRY) {
            const usdTry = Number(data.rates.TRY);
            const eurTry = usdTry / Number(data.rates.EUR);
            const gbpTry = usdTry / Number(data.rates.GBP);
            const chfTry = usdTry / Number(data.rates.CHF);
            const aedTry = usdTry / Number(data.rates.AED);
            const jpyTry = (usdTry / Number(data.rates.JPY)) * 100;

            cachedRates = {
                USD: usdTry.toFixed(2),
                EUR: eurTry.toFixed(2),
                GBP: gbpTry.toFixed(2),
                CHF: chfTry.toFixed(2),
                AED: aedTry.toFixed(2),
                JPY_100: jpyTry.toFixed(2),
                date: new Date().toLocaleDateString('tr-TR')
            };
            lastRatesFetchTime = now;
            return cachedRates;
        }
    } catch (e) {
        console.error("Live rates lookup error in Tintin:", e.message);
    }
    return cachedRates;
};

const fetchLiveWeatherForCity = async (cityName) => {
    if (!cityName) return null;
    try {
        const cleanName = cityName
            .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '')
            .replace(/[^\p{L}\p{N}\s,-]/gu, '')
            .trim();
        if (cleanName.length < 2) return null;

        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=tr&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
            const { latitude, longitude, name, country } = geoData.results[0];
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const weatherData = await weatherRes.json();
            if (weatherData && weatherData.current_weather) {
                const cur = weatherData.current_weather;
                let condition = "Açık ve Güneşli";
                const code = cur.weathercode;
                if (code >= 1 && code <= 3) condition = "Parçalı Bulutlu";
                else if (code >= 45 && code <= 48) condition = "Sisli";
                else if (code >= 51 && code <= 67) condition = "Yağmurlu";
                else if (code >= 71 && code <= 82) condition = "Karlı";
                else if (code >= 95) condition = "Gök Gürültülü Fırtınalı";

                const daily = weatherData.daily || {};
                const todayMax = daily.temperature_2m_max?.[0] !== undefined ? `${Math.round(daily.temperature_2m_max[0])}°C` : null;
                const todayMin = daily.temperature_2m_min?.[0] !== undefined ? `${Math.round(daily.temperature_2m_min[0])}°C` : null;
                const tomorrowMax = daily.temperature_2m_max?.[1] !== undefined ? `${Math.round(daily.temperature_2m_max[1])}°C` : null;
                const tomorrowMin = daily.temperature_2m_min?.[1] !== undefined ? `${Math.round(daily.temperature_2m_min[1])}°C` : null;

                return {
                    city: name,
                    country: country,
                    temperature: `${Math.round(cur.temperature)}°C`,
                    condition: condition,
                    windspeed: `${cur.windspeed} km/s`,
                    todayMax,
                    todayMin,
                    tomorrowMax,
                    tomorrowMin
                };
            }
        }
    } catch (e) {
        console.error("Live weather lookup error in Tintin:", e.message);
    }
    return null;
};

const extractCityCandidates = (msg, travelContext) => {
    const list = [];
    if (!msg) return list;

    const cleanWords = msg
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"”’]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3);

    const stopWords = new Set([
        'hava', 'durumu', 'nasil', 'nasıl', 'bugun', 'bugün', 'yarin', 'yarın',
        'derece', 'sicaklik', 'sıcaklık', 'yagmur', 'yağmur', 'gunluk', 'günlük',
        'var', 'yok', 'mi', 'mı', 'mu', 'mü', 'acaba', 'bakar', 'misin', 'mısın',
        'merhaba', 'selam', 'tintin', 'bilgi', 'verir', 'misiniz', 'nedir', 'öğrenmek',
        'göster', 'goster', 'tavsiye', 'eder', 'misiniz'
    ]);

    for (const rawWord of cleanWords) {
        const lower = rawWord.toLowerCase();
        if (stopWords.has(lower)) continue;

        const stripped = rawWord
            .replace(/(['’](da|de|ta|te|ya|ye|a|e|nın|nin|nun|nün|ın|in|un|ün|daki|deki))$/i, '')
            .replace(/(daki|deki)$/i, '')
            .replace(/(da|de|ta|te|nın|nin|nun|nün|ya|ye)$/i, '');

        if (stripped.length >= 3 && !stopWords.has(stripped.toLowerCase())) {
            list.push(stripped);
        }
    }

    if (Array.isArray(travelContext.allUserTours)) {
        for (const t of travelContext.allUserTours) {
            const dest = t.destination || t.destinations || t.tourName || '';
            const splitCities = dest.split(/\s*[-&,]\s*|\s+ve\s+/i);
            for (const c of splitCities) {
                const cleanC = c.trim();
                if (cleanC.length > 2 && !list.includes(cleanC)) {
                    list.push(cleanC);
                }
            }
        }
    }

    return list;
};

// 1. Test Gemini Connection Endpoint
app.post('/api/tintin/test-connection', async (req, res) => {
    const { apiKey = process.env.GEMINI_API_KEY || '', model = 'gemini-3.6-flash' } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
        return res.status(400).json({ 
            success: false, 
            message: 'Geçersiz veya eksik Gemini API Key.' 
        });
    }

    const cleanKey = apiKey.trim();
    const cleanModel = (model || 'gemini-3.5-flash').trim();

    try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;
        
        const testPayload = {
            contents: [
                {
                    parts: [
                        { text: "Merhaba, bağlantı testi yapıyorum. Tek kelimeyle 'Bağlantı başarılı' diye cevap ver." }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.1
            }
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        const data = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return res.json({ 
                success: true, 
                message: `Google Gemini (${cleanModel}) API bağlantısı başarılı!`,
                model: cleanModel
            });
        } else {
            const errMsg = data?.error?.message || response.statusText || 'Bilinmeyen API hatası.';
            return res.status(response.status || 400).json({ 
                success: false, 
                message: `Gemini API Hatası: ${errMsg}`,
                details: data?.error 
            });
        }
    } catch (error) {
        console.error("Gemini Test Bağlantı Hatası:", error);
        return res.status(500).json({ 
            success: false, 
            message: `Sunucu Ağ Hatası: ${error.message}` 
        });
    }
});

// 2. Tintin Chat Endpoint
app.post('/api/tintin/chat', async (req, res) => {
    const { 
        userId = 'guest', 
        message, 
        history = [], 
        conversationHistory = [], 
        travelContext = {}, 
        settings = {},
        apiKey: directApiKey,
        model: directModel,
        systemPrompt: directSystemPrompt,
        temperature: directTemp,
        maxTokens: directMaxTokens
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Mesaj içeriği boş olamaz.' });
    }

    const apiKey = (directApiKey || settings.apiKey || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
        return res.status(400).json({ 
            success: false, 
            message: 'Gemini API Key yapılandırılmamış.' 
        });
    }

    const dailyLimit = Number(settings.dailyLimit) || 50;
    const rateCheck = checkRateLimit(userId, dailyLimit);
    if (!rateCheck.allowed) {
        return res.status(429).json({ 
            success: false, 
            message: `Günlük soru limitinize (${dailyLimit} istek) ulaştınız. Lütfen yarın tekrar deneyin.` 
        });
    }

    const rawModel = (directModel || settings.model || 'gemini-3.5-flash').trim();
    const model = (rawModel.startsWith('gemini-1.') || rawModel.startsWith('gemini-2.5')) ? 'gemini-3.5-flash' : rawModel;
    const maxTokens = Math.max(Number(directMaxTokens) || Number(settings.maxTokens) || 4096, 4096);
    const temperature = typeof directTemp === 'number' ? directTemp : (typeof settings.temperature === 'number' ? settings.temperature : 0.7);

    let liveWeatherContext = '';
    const userMsgLower = message.toLowerCase();
    const isWeatherQuery = userMsgLower.includes('hava') || userMsgLower.includes('yağmur') || userMsgLower.includes('sıcaklık') || userMsgLower.includes('derece') || userMsgLower.includes('güneş') || userMsgLower.includes('rüzgar') || userMsgLower.includes('fırtına') || userMsgLower.includes('kar') || userMsgLower.includes('weather');

    if (isWeatherQuery) {
        const candidateCities = extractCityCandidates(message, travelContext);
        let foundWeather = null;

        for (const candidate of candidateCities) {
            foundWeather = await fetchLiveWeatherForCity(candidate);
            if (foundWeather) break;
        }

        if (foundWeather) {
            liveWeatherContext = `\n[CANLI GÜNCEL HAVA DURUMU BİLGİSİ (${foundWeather.city}, ${foundWeather.country})]:
- Anlık Sıcaklık: ${foundWeather.temperature}
- Durum: ${foundWeather.condition}
- Bugün: En Yüksek ${foundWeather.todayMax || '-'}, En Düşük ${foundWeather.todayMin || '-'}
- Yarın: En Yüksek ${foundWeather.tomorrowMax || '-'}, En Düşük ${foundWeather.tomorrowMin || '-'}
- Rüzgar Hızı: ${foundWeather.windspeed}`;
        }
    }

    let liveCurrencyContext = '';
    const isCurrencyQuery = userMsgLower.includes('kur') || userMsgLower.includes('kurlar') || userMsgLower.includes('döviz') || userMsgLower.includes('dolar') || userMsgLower.includes('euro') || userMsgLower.includes('avro') || userMsgLower.includes('sterlin') || userMsgLower.includes('para birimi') || userMsgLower.includes('kaç tl') || userMsgLower.includes('tl kaç') || userMsgLower.includes('exchange');

    if (isCurrencyQuery) {
        const liveRates = await fetchLiveExchangeRates();
        if (liveRates) {
            liveCurrencyContext = `\n[CANLI GÜNCEL DÖVİZ KURLARI (Piyasa / TCMB Değerleri - ${liveRates.date})]:
- 1 Dolar (USD): ~${liveRates.USD} TL
- 1 Euro (EUR): ~${liveRates.EUR} TL
- 1 İngiliz Sterlini (GBP): ~${liveRates.GBP} TL
- 1 İsviçre Frangı (CHF): ~${liveRates.CHF} TL
- 1 BAE Dirhemi (AED): ~${liveRates.AED} TL
- 100 Japon Yeni (JPY): ~${liveRates.JPY_100} TL`;
        }
    }

    const defaultSystemPrompt = `Sen "Tintin", Move Travel & MICE seyahat uygulamasının akıllı, güvenilir ve seyahat uzmanı yapay zeka asistanısın.
GÖREVLERİN:
1. Misafirlerin seyahat, uçuş, otel, hava durumu, kurlar ve gezi rotaları hakkında sorularını net, nazik ve Türkçe yanıtla.
2. ASLA bayrak emojileri veya ülke kodları kullanma. Emojileri minimumda tut.`;

    const customSystemPrompt = directSystemPrompt ? directSystemPrompt.trim() : (settings.systemPrompt ? settings.systemPrompt.trim() : defaultSystemPrompt);

    let contextText = `\n\n[KULLANICI VE SEYAHAT VERİLERİ]:\n`;
    if (travelContext.userName) contextText += `- Misafir Adı: ${travelContext.userName}\n`;
    if (travelContext.userCompany || travelContext.company) contextText += `- Firma: ${travelContext.userCompany || travelContext.company}\n`;

    if (liveWeatherContext) contextText += `\n${liveWeatherContext}\n`;
    if (liveCurrencyContext) contextText += `\n${liveCurrencyContext}\n`;

    if (Array.isArray(travelContext.allUserTours) && travelContext.allUserTours.length > 0) {
        contextText += `\n[KULLANICININ KAYITLI SEYAHATLERİ]:\n`;
        travelContext.allUserTours.forEach((t, idx) => {
            contextText += `\n--- SEYAHAT #${idx + 1}: ${t.tourName || t.name || 'Seyahat'} ---\n`;
            contextText += `- Durum: ${t.status || 'Aktif'}\n`;
            contextText += `- Tarihler: ${t.dates || '-'}\n`;
            contextText += `- Destinasyon: ${t.destination || t.destinations || '-'}\n`;
            if (t.hotel) {
                const h = typeof t.hotel === 'string' ? { name: t.hotel } : t.hotel;
                contextText += `- Otel: ${h.name || '-'} | Adres: ${h.address || '-'}\n`;
            }
        });
    }

    const contents = [];
    const rawHistory = conversationHistory.length > 0 ? conversationHistory : history;
    const recentHistory = Array.isArray(rawHistory) ? rawHistory.slice(-10) : [];
    
    recentHistory.forEach(item => {
        if (item.parts && item.role) {
            contents.push(item);
        } else if (item.sender === 'user' && item.text) {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if ((item.sender === 'tintin' || item.sender === 'assistant' || item.sender === 'model') && item.text) {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
    });

    contents.push({ role: 'user', parts: [{ text: message.trim() }] });

    const requestPayload = {
        systemInstruction: {
            parts: [{ text: customSystemPrompt + contextText }]
        },
        contents: contents,
        generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature,
            topP: 0.95
        }
    };

    const candidateModels = Array.from(new Set([
        model,
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3-flash-preview',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.5-flash-lite'
    ]));

    let lastError = null;
    let replyText = null;
    let usage = {};

    for (const currentModel of candidateModels) {
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            const data = await response.json();

            if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                replyText = data.candidates[0].content.parts[0].text;
                usage = data.usageMetadata || {};
                tintinStats.totalRequests += 1;
                tintinStats.dailyRequests += 1;
                break;
            } else {
                const status = response.status;
                const errMsg = data?.error?.message || response.statusText;
                lastError = data?.error || { message: errMsg };
                if (status === 429 || status === 503 || status === 404 || status === 500) {
                    continue;
                } else {
                    break;
                }
            }
        } catch (fetchErr) {
            lastError = fetchErr;
        }
    }

    if (replyText) {
        return res.json({
            success: true,
            reply: replyText,
            usage: usage,
            remainingRequests: rateCheck.remaining
        });
    } else {
        tintinStats.errors += 1;
        const rawErrMsg = lastError?.message || 'Gemini API yanıt üretemedi.';
        return res.status(500).json({
            success: false,
            message: `Tintin yanıt veremedi: ${rawErrMsg}`,
            details: lastError
        });
    }
});

app.get('/api/tintin/stats', (req, res) => {
    res.json({ success: true, stats: tintinStats });
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

                        // CHILD SUPPRESSION GUARD
                        if (userObj.isChildProfile === true || isChildEmailAddress(userObj.email)) continue;
                        if (userObj.linkedTo && (Array.isArray(userObj.linkedTo) ? userObj.linkedTo.length > 0 : String(userObj.linkedTo).trim() !== '')) {
                            continue;
                        }

                        let htmlContent = `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="width: 48px; height: 48px; background: #D7147A; color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
                                        M
                                    </div>
                                </div>
                                <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Check-in Hatırlatması</h2>
                                <p>Sayın <strong>${p.name}</strong>,</p>
                                <p>Seyahatinize <strong>${Math.floor(diffHours)} saat</strong> kaldı.</p>
                                <p>Uçuşunuza 24 saat kala ( <strong>${f.airline || 'havayolu'}</strong> ) web sitesi veya mobil uygulaması üzerinden online check-in işleminizi gerçekleştirmenizi rica ederiz.</p>
                                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px dashed #cbd5e1; text-align: center;">
                                    <div style="margin-bottom: 8px;"><strong>PNR:</strong> ${f.pnr || '-'}</div>
                                    <div><strong>Bilet No:</strong> ${f.ticketNo || '-'}</div>
                                </div>
                                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
                                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir.</p>
                            </div>
                        `;

                        await transporter.sendMail({
                            from: `"Move Travel & Mice" <${smtpConfig.user}>`,
                            to: userObj.email,
                            subject: `Seyahatinize ${Math.floor(diffHours)} Saat Kaldı - Check-in Hatırlatması`,
                            html: htmlContent
                        });
                    }
                }
            }
        }
    } catch (e) { console.error("Cron Error", e); }
});

exports.tourReviewReminder = onSchedule("every 1 hours", async (event) => {
    try {
        const db = admin.firestore();
        const settingsSnap = await db.collection('settings').doc('global').get();
        if (!settingsSnap.exists) return;
        const settingsData = settingsSnap.data() || {};
        const whatsappConfig = settingsData.whatsappConfig;

        const parseEndDate = (datesString) => {
            if (!datesString || typeof datesString !== 'string') return null;
            const str = datesString.trim().toLowerCase();
            const trMonths = {
                'ocak': 0, 'subat': 1, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayis': 4, 'mayıs': 4,
                'haziran': 5, 'temmuz': 6, 'agustos': 7, 'ağustos': 7, 'eylul': 8, 'eylül': 8,
                'ekim': 9, 'kasim': 10, 'kasım': 10, 'aralik': 11, 'aralık': 11
            };
            try {
                const dotMatches = str.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/g);
                if (dotMatches && dotMatches.length > 0) {
                    const last = dotMatches[dotMatches.length - 1];
                    const parts = last.split(/[./]/);
                    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 23, 59, 59);
                }
                const isoMatches = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/g);
                if (isoMatches && isoMatches.length > 0) {
                    const last = isoMatches[isoMatches.length - 1];
                    const parts = last.split('-');
                    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59);
                }
                const monthYearRegex = /(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/gi;
                const myMatches = [...str.matchAll(monthYearRegex)];
                if (myMatches.length > 0) {
                    const lastMatch = myMatches[myMatches.length - 1];
                    const d = parseInt(lastMatch[1], 10);
                    const m = trMonths[lastMatch[2].toLowerCase()];
                    const y = parseInt(lastMatch[3], 10);
                    if (m !== undefined && !isNaN(d) && !isNaN(y)) return new Date(y, m, d, 23, 59, 59);
                }
            } catch (e) {}
            return null;
        };

        const now = new Date();
        const toursSnap = await db.collection('tours').get();

        for (const tourDoc of toursSnap.docs) {
            const tour = tourDoc.data();
            if (tour.status === 'cancelled' || !tour.participants || tour.participants.length === 0) continue;

            const endDate = parseEndDate(tour.dates);
            if (!endDate) continue;

            const diffHours = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);

            // 24 saat veya daha fazla geçtiyse
            if (diffHours >= 24) {
                let updatedParticipants = false;
                const updatedList = [];

                for (const p of tour.participants) {
                    if (!p.reviewReminderSent) {
                        const userSnap = await db.collection('users').where('id', '==', p.id).get();
                        let phone = p.phone;
                        if (!userSnap.empty) {
                            const uObj = userSnap.docs[0].data();
                            if (uObj.isChildProfile === true || isChildEmailAddress(uObj.email)) continue;
                            if (uObj.linkedTo && (Array.isArray(uObj.linkedTo) ? uObj.linkedTo.length > 0 : String(uObj.linkedTo).trim() !== '')) continue;
                            if (!phone || phone === '-') {
                                phone = uObj.phone;
                            }
                        }

                        if (whatsappConfig?.isEnabled && whatsappConfig?.phoneId && whatsappConfig?.accessToken && phone) {
                            const cleanPhone = String(phone).replace(/[^0-9]/g, '');
                            if (cleanPhone.length >= 9) {
                                const templateName = whatsappConfig.tourReviewTemplate || 'tour_review_reminder';
                                const reviewLink = `https://move-yanimda.web.app/dashboard/review/${tourDoc.id}`;

                                await fetch(`https://graph.facebook.com/v20.0/${whatsappConfig.phoneId}/messages`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        messaging_product: "whatsapp",
                                        recipient_type: "individual",
                                        to: cleanPhone,
                                        type: "template",
                                        template: {
                                            name: templateName,
                                            language: { code: 'tr' },
                                            components: [{
                                                type: "body",
                                                parameters: [
                                                    { type: "text", text: p.name || 'Misafir' },
                                                    { type: "text", text: tour.name || 'Seyahat' },
                                                    { type: "text", text: reviewLink }
                                                ]
                                            }]
                                        }
                                    })
                                }).catch(err => console.error("Cloud Function WhatsApp review notification error:", err));
                            }
                        }

                        updatedParticipants = true;
                        updatedList.push({ ...p, reviewReminderSent: true });
                    } else {
                        updatedList.push(p);
                    }
                }

                if (updatedParticipants) {
                    await db.collection('tours').doc(tourDoc.id).update({ participants: updatedList });
                }
            }
        }
    } catch (e) {
        console.error("Tour review reminder cron error:", e);
    }
});

// Expose the Express app as a single Cloud Function named 'backend' using Gen 2
exports.backend = onRequest({ cors: true, maxInstances: 10 }, app);

