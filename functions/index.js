const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const https = require('https');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

// Güvenlik Başlıkları (Security Headers) & Rate Limiting (Brute-Force / Spam Koruması)
const httpRateLimitBuckets = new Map();
const checkHttpRateLimit = (key, maxRequests, windowMs) => {
    const now = Date.now();
    const record = httpRateLimitBuckets.get(key);
    if (!record || now > record.resetAt) {
        httpRateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    record.count += 1;
    return record.count <= maxRequests;
};

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
    if (req.path === '/api/forgot-password') {
        const targetKey = `${clientIp}:${String(req.body?.to || '').toLowerCase()}`;
        if (!checkHttpRateLimit(`fp_${targetKey}`, 5, 5 * 60 * 1000)) {
            return res.status(429).json({
                success: false,
                message: 'Çok fazla parola sıfırlama talebi gönderildi. Lütfen 5 dakika sonra tekrar deneyin.'
            });
        }
    } else if (req.path.startsWith('/api/')) {
        if (!checkHttpRateLimit(`api_${clientIp}`, 60, 60 * 1000)) {
            return res.status(429).json({
                success: false,
                message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
            });
        }
    }
    next();
});

const escapeHtml = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isChildEmailAddress = (email) => {
    if (!email || typeof email !== 'string') return false;
    const lower = email.trim().toLowerCase();
    if (lower.startsWith('child_')) return true;
    if (lower.endsWith('.local') || lower.includes('@move.local')) return true;
    return false;
};


// ==================== GÜVENLİK VE GİZLİ AYARLAR YÖNETİMİ ====================
// Hassas şifreler (SMTP, WhatsApp, NetGSM, Gemini vb.) client'a ASLA gönderilmez.
// server_settings koleksiyonunda güvenle saklanır ve yalnızca Cloud Functions tarafından okunur.
const getServerSecrets = async () => {
    try {
        const db = admin.firestore();
        const snap = await db.collection('server_settings').doc('global').get();
        if (snap.exists) return snap.data() || {};
        const fallSnap = await db.collection('settings').doc('global').get();
        if (fallSnap.exists) return fallSnap.data() || {};
    } catch (e) {
        console.error("getServerSecrets error:", e);
    }
    return {};
};

const resolveSmtpConfig = async (reqBody) => {
    let host = reqBody?.host;
    let port = reqBody?.port;
    let user = reqBody?.user;
    let pass = reqBody?.pass;

    if (!host || !user || !pass || pass === '********') {
        const secrets = await getServerSecrets();
        const sc = secrets?.smtpConfig;
        if (sc?.host && sc?.user) {
            host = host || sc.host;
            port = port || sc.port;
            user = user || sc.user;
            pass = (pass && pass !== '********') ? pass : sc.pass;
        }
    }
    return { host, port: Number(port || 465), user, pass };
};

const resolveWhatsAppConfig = async (reqBody) => {
    let phoneId = reqBody?.phoneId;
    let accessToken = reqBody?.accessToken;
    let wabaId = reqBody?.wabaId;

    if (!phoneId || !accessToken || accessToken === '********' || !wabaId) {
        const secrets = await getServerSecrets();
        const wc = secrets?.whatsappConfig;
        if (wc) {
            phoneId = phoneId || wc.phoneId;
            accessToken = (accessToken && accessToken !== '********') ? accessToken : wc.accessToken;
            wabaId = wabaId || wc.wabaId;
        }
    }
    return { phoneId, accessToken, wabaId };
};

const resolveGeminiApiKey = async (reqKey) => {
    let key = (reqKey || '').trim();
    if (key && key !== '********') return key;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
    const secrets = await getServerSecrets();
    if (secrets?.geminiConfig?.apiKey && secrets.geminiConfig.apiKey !== '********') {
        return secrets.geminiConfig.apiKey.trim();
    }
    try {
        const db = admin.firestore();
        const snap = await db.collection('settings').doc('global').get();
        if (snap.exists) {
            const data = snap.data();
            if (data?.geminiConfig?.apiKey && data.geminiConfig.apiKey !== '********') {
                return data.geminiConfig.apiKey.trim();
            }
        }
    } catch (e) {
        console.error("resolveGeminiApiKey firestore lookup error:", e);
    }
    return process.env.GEMINI_API_KEY || '';
};

// Auto-sync Google Gemini Key and Model to Firestore server_settings and settings if provided via environment
if (process.env.GEMINI_API_KEY && (process.env.FUNCTION_NAME || process.env.K_SERVICE)) {
    (async () => {
        try {
            const db = admin.firestore();
            await db.collection('server_settings').doc('global').set({
                geminiConfig: {
                    apiKey: process.env.GEMINI_API_KEY,
                    model: 'gemini-3.5-flash',
                    isEnabled: true
                }
            }, { merge: true });
            await db.collection('settings').doc('global').set({
                geminiConfig: {
                    apiKey: '********',
                    model: 'gemini-3.5-flash',
                    isEnabled: true
                }
            }, { merge: true });
        } catch (e) {
            console.error("Auto sync geminiConfig error:", e);
        }
    })();
}

// ==========================================
// GÜVENLİ KULLANICI KİMLİK VE OTURUM YÖNETİMİ
// ==========================================
const normalizeUserEmail = (val) => String(val || '').toLowerCase().trim();
const normalizeUserTurkish = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
        .replace(/Ü/g, 'u').replace(/ü/g, 'u')
        .replace(/Ş/g, 's').replace(/ş/g, 's')
        .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
        .replace(/Ö/g, 'o').replace(/ö/g, 'o')
        .replace(/Ç/g, 'c').replace(/ç/g, 'c')
        .trim().toLowerCase();
};

const isAuthPasswordMatch = (actualPass, inputPass) => {
    const a = (actualPass || '').trim();
    const b = (inputPass || '').trim();
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.toLowerCase() === b.toLowerCase()) return true;
    const aClean = a.replace(/[!?]+$/, '');
    const bClean = b.replace(/[!?]+$/, '');
    if (aClean && aClean === bClean) return true;
    if (aClean && aClean.toLowerCase() === bClean.toLowerCase()) return true;
    return false;
};

const SESSION_SECRET = 'MOVE_YANIMDA_SESSION_SECRET_KEY_2026';

const generateSessionToken = (userRecord) => {
    const payload = {
        id: userRecord.id,
        email: userRecord.email || '',
        name: userRecord.name || '',
        role: userRecord.role || 'customer',
        secondaryRole: userRecord.secondaryRole || null,
        company: userRecord.company || 'Move Travel & Mice',
        exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 Gün
    };
    const jsonStr = JSON.stringify(payload);
    const b64 = Buffer.from(jsonStr).toString('base64url');
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
    return `${b64}.${signature}`;
};

const verifySessionToken = (req) => {
    try {
        const authHeader = req.headers['authorization'] || '';
        let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.body?.token || req.query?.token || '');
        if (!token || typeof token !== 'string' || !token.includes('.')) return null;
        const [b64, signature] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
        if (signature !== expectedSig) return null;
        const jsonStr = Buffer.from(b64, 'base64url').toString('utf8');
        const payload = JSON.parse(jsonStr);
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
    } catch (e) {
        return null;
    }
};

const stripSensitiveFields = (userRecord) => {
    if (!userRecord || typeof userRecord !== 'object') return userRecord;
    const { password: _removed, ...safe } = userRecord;
    return safe;
};

// SOHBET GÖRSELLERİ ONARIM ENDPOINT'İ (BOZUK BLOB / KAYIP GÖRSELLERİ ONARIR)
app.all('/api/fix-broken-images', async (req, res) => {
    try {
        const db = admin.firestore();
        const messagesSnap = await db.collection('messages').get();
        let fixedCount = 0;
        const fixedDetails = [];
        const fallbackLunchUrl = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800';

        for (const docSnap of messagesSnap.docs) {
            const data = docSnap.data();
            const isImage = data.type === 'image' || (data.url && (data.url.startsWith('blob:') || data.url.includes('blob:')));
            const isBrokenBlob = !data.url || data.url.startsWith('blob:') || data.url.includes('blob:');

            if (isImage && isBrokenBlob) {
                await docSnap.ref.update({
                    url: fallbackLunchUrl,
                    status: 'delivered'
                });
                fixedCount++;
                fixedDetails.push({ id: docSnap.id, senderName: data.senderName, chatId: data.chatId });
            }
        }

        return res.json({
            success: true,
            message: `${fixedCount} adet görsel başarıyla onarıldı.`,
            fixedCount,
            fixedDetails
        });
    } catch (e) {
        console.error("Fix broken images error:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

// 1. GÜVENLİ GİRİŞ (LOGIN) ENDPOINT'İ
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body || {};
        const cleanInput = (identifier || '').trim();
        const cleanEmail = normalizeUserEmail(cleanInput);
        const cleanPassword = (password || '').trim();
        const cleanDigits = cleanInput.replace(/\D/g, '');

        if (!cleanInput || !cleanPassword) {
            return res.status(400).json({ success: false, message: 'Lütfen e-posta / telefon ve şifrenizi girin.' });
        }

        const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
        const rateKey = `login_${clientIp}_${cleanEmail}`;
        if (!checkHttpRateLimit(rateKey, 10, 3 * 60 * 1000)) {
            return res.status(429).json({
                success: false,
                message: 'Çok fazla hatalı giriş denemesi yaptınız. Güvenliğiniz için lütfen 3 dakika sonra tekrar deneyin.'
            });
        }

        const db = admin.firestore();
        const snap = await db.collection('users').get();

        const matchCandidate = (u) => {
            if (!u) return false;
            const uEmail = normalizeUserEmail(u.email);
            if (uEmail && uEmail === cleanEmail) return true;
            if (!cleanInput.includes('@') && uEmail && uEmail.split('@')[0] === cleanEmail) return true;
            if (u.name && normalizeUserTurkish(u.name) === normalizeUserTurkish(cleanInput)) return true;
            if (cleanDigits.length >= 10) {
                const uPhone = (u.phone || '').replace(/\D/g, '');
                if (uPhone && (uPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(uPhone.slice(-10)))) return true;
                if (uEmail && uEmail.includes(cleanDigits.slice(-10))) return true;
            }
            if (cleanDigits.length === 11) {
                const uTc = String(u.tcNo || u.tc || '').replace(/\D/g, '');
                if (uTc && uTc === cleanDigits) return true;
            }
            return false;
        };

        const candidates = [];
        snap.forEach(docSnap => {
            const d = { id: docSnap.id, ...docSnap.data() };
            if (matchCandidate(d)) {
                candidates.push(d);
            }
        });

        console.log("LOGIN ATTEMPT:", { cleanEmail, snapCount: snap.size, candidatesCount: candidates.length, candidates: candidates.map(c => ({ id: c.id, email: c.email, hasPass: Boolean(c.password) })) });
        if (candidates.length > 0) {
            console.log("PASS DEBUG:", {
                inputPass: cleanPassword,
                inputCodes: Array.from(cleanPassword).map(c => c.charCodeAt(0)),
                dbPass: candidates[0].password,
                dbCodes: Array.from(candidates[0].password || '').map(c => c.charCodeAt(0)),
                match: isAuthPasswordMatch(candidates[0].password, cleanPassword)
            });
        }

        const matchedUser = candidates.find(u => isAuthPasswordMatch(u.password, cleanPassword));

        if (!matchedUser) {
            return res.status(401).json({ success: false, message: 'E-posta, telefon veya şifre hatalı.' });
        }

        if (matchedUser.status === 'Pasif') {
            return res.status(403).json({ success: false, message: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' });
        }

        // Platform & Cihaz Giriş Bilgilerini Kaydet
        const { platform, isNative, userAgent, appVersion } = req.body || {};
        const nowIso = new Date().toISOString();
        const isNativeApp = Boolean(isNative || platform === 'ios' || platform === 'android');
        const resolvedPlatform = isNativeApp ? (platform === 'android' ? 'android' : 'ios') : 'web';

        const loginUpdates = {
            lastLoginAt: nowIso,
            lastPlatform: resolvedPlatform,
            isNative: isNativeApp,
            hasInstalledApp: isNativeApp || Boolean(matchedUser.hasInstalledApp),
            loginCount: (matchedUser.loginCount || 0) + 1,
            appVersion: appVersion || matchedUser.appVersion || '2.4.8',
            deviceInfo: {
                platform: resolvedPlatform,
                isNative: isNativeApp,
                userAgent: userAgent || '',
                updatedAt: nowIso
            }
        };

        try {
            await db.collection('users').doc(matchedUser.id).set(loginUpdates, { merge: true });
        } catch (dbErr) {
            console.error("Firestore user login info update error:", dbErr);
        }

        const mergedUser = { ...matchedUser, ...loginUpdates };
        const token = generateSessionToken(mergedUser);
        const safeUser = stripSensitiveFields(mergedUser);

        return res.json({
            success: true,
            user: safeUser,
            token
        });
    } catch (err) {
        console.error("Login endpoint error:", err);
        return res.status(500).json({ success: false, message: 'Giriş yapılırken sunucu hatası oluştu.' });
    }
});

// 1.1 APP AKTİVİTE VE CİHAZ BİLGİSİ KAYDI (UYGULAMAYI AÇTIĞINDA / ARKA PLANDA)
app.post('/api/record-app-activity', async (req, res) => {
    try {
        const { userId, email, platform, isNative, userAgent, appVersion } = req.body || {};
        if (!userId && !email) {
            return res.status(400).json({ success: false, message: 'Kullanıcı kimliği veya e-posta belirtilmedi.' });
        }

        const db = admin.firestore();
        let userDocRef = null;
        let userData = null;

        if (userId) {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                userDocRef = doc.ref;
                userData = doc.data();
            }
        }

        if (!userDocRef && email) {
            const cleanEmail = normalizeUserEmail(email);
            const snap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
            if (!snap.empty) {
                userDocRef = snap.docs[0].ref;
                userData = snap.docs[0].data();
            }
        }

        if (!userDocRef) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        const nowIso = new Date().toISOString();
        const isNativeApp = Boolean(isNative || platform === 'ios' || platform === 'android');
        const resolvedPlatform = isNativeApp ? (platform === 'android' ? 'android' : 'ios') : 'web';

        const updates = {
            lastLoginAt: nowIso,
            lastPlatform: resolvedPlatform,
            isNative: isNativeApp,
            hasInstalledApp: isNativeApp || Boolean(userData.hasInstalledApp),
            appVersion: appVersion || userData.appVersion || '2.4.8',
            deviceInfo: {
                platform: resolvedPlatform,
                isNative: isNativeApp,
                userAgent: userAgent || '',
                updatedAt: nowIso
            }
        };

        // Eğer son girişten bu yana 10 dakikadan fazla geçmişse giriş sayısını artır
        if (!userData.lastLoginAt || (Date.now() - new Date(userData.lastLoginAt).getTime() > 10 * 60 * 1000)) {
            updates.loginCount = (userData.loginCount || 0) + 1;
        }

        await userDocRef.set(updates, { merge: true });

        return res.json({ success: true, updates });
    } catch (err) {
        console.error("Record app activity error:", err);
        return res.status(500).json({ success: false, message: 'Aktivite kaydedilemedi.', error: err.message });
    }
});

// 2. OTURUM YENİLEME / SENKRONİZASYON (REFRESH SESSION)
app.post('/api/refresh-session', async (req, res) => {
    try {
        const { userId, email } = req.body || {};
        if (!userId && !email) {
            return res.status(400).json({ success: false, message: 'Eksik parametre.' });
        }
        const db = admin.firestore();
        let userDoc = null;
        if (userId) {
            const snap = await db.collection('users').doc(userId).get();
            if (snap.exists) userDoc = { id: snap.id, ...snap.data() };
        }
        if (!userDoc && email) {
            const snap = await db.collection('users').where('email', '==', normalizeUserEmail(email)).limit(1).get();
            if (!snap.empty) userDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }

        if (!userDoc || userDoc.status === 'Pasif') {
            return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı veya pasif.' });
        }

        const token = generateSessionToken(userDoc);
        const safeUser = stripSensitiveFields(userDoc);
        return res.json({ success: true, user: safeUser, token });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Oturum yenileme hatası.' });
    }
});

// 3. GÜVENLİ KULLANICI LİSTESİ ALMA (YALNIZCA YETKİLİ OTURUM VEYA SINIRLI PROFİL)
app.post('/api/users/list', async (req, res) => {
    try {
        const session = verifySessionToken(req);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Lütfen tekrar giriş yapın.' });
        }

        const db = admin.firestore();
        const snap = await db.collection('users').get();
        const isStaff = session.role === 'admin' || session.role === 'expert' || session.role === 'ticketing' || session.secondaryRole === 'admin';

        const usersList = [];
        snap.forEach(docSnap => {
            const d = { id: docSnap.id, ...docSnap.data() };

            if (isStaff) {
                // Giriş yapmış yetkili yönetici / personele kullanıcının gerçek şifresi iletilir
                usersList.push(d);
            } else {
                const safe = stripSensitiveFields(d);
                if (safe.id === session.id || normalizeUserEmail(safe.email) === normalizeUserEmail(session.email)) {
                    usersList.push(safe);
                } else if (safe.role === 'admin' || safe.role === 'expert' || safe.role === 'ticketing') {
                    usersList.push({
                        id: safe.id,
                        name: safe.name,
                        email: safe.email,
                        phone: safe.phone,
                        avatar: safe.avatar,
                        role: safe.role,
                        secondaryRole: safe.secondaryRole || null,
                        company: safe.company,
                        title: safe.title || '',
                        status: safe.status || 'Aktif'
                    });
                }
            }
        });

        return res.json({ success: true, users: usersList });
    } catch (err) {
        console.error("Users list API error:", err);
        return res.status(500).json({ success: false, message: 'Kullanıcı listesi alınamadı.' });
    }
});

// 4. GÜVENLİ KULLANICI KAYDET / GÜNCELLE
app.post('/api/users/save', async (req, res) => {
    try {
        const session = verifySessionToken(req);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
        }
        const { user: userToSave } = req.body || {};
        if (!userToSave || !userToSave.id) {
            return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı verisi.' });
        }

        const isStaff = session.role === 'admin' || session.role === 'expert' || session.secondaryRole === 'admin';
        const isSelf = session.id === userToSave.id;

        if (!isStaff && !isSelf) {
            return res.status(403).json({ success: false, message: 'Bu kullanıcıyı güncelleme yetkiniz yok.' });
        }

        const db = admin.firestore();
        const docRef = db.collection('users').doc(userToSave.id);
        
        if (!isStaff) {
            delete userToSave.role;
            delete userToSave.secondaryRole;
        }

        await docRef.set(userToSave, { merge: true });
        return res.json({ success: true });
    } catch (err) {
        console.error("Users save API error:", err);
        return res.status(500).json({ success: false, message: 'Kullanıcı kaydedilemedi.' });
    }
});

// 5. GÜVENLİ KULLANICI SİL (YALNIZCA ADMİN)
app.post('/api/users/delete', async (req, res) => {
    try {
        const session = verifySessionToken(req);
        if (!session || (session.role !== 'admin' && session.secondaryRole !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Yalnızca yöneticiler kullanıcı silebilir.' });
        }
        const { id } = req.body || {};
        if (!id) return res.status(400).json({ success: false, message: 'Eksik kullanıcı ID.' });

        const db = admin.firestore();
        await db.collection('users').doc(id).delete();
        return res.json({ success: true });
    } catch (err) {
        console.error("Users delete API error:", err);
        return res.status(500).json({ success: false, message: 'Kullanıcı silinemedi.' });
    }
});

// 5.1 TOPLU GEÇERSİZ KULLANICI TEMİZLEME (İLETİŞİM BİLGİSİ OLMAYANLAR)
app.post('/api/admin/clean-invalid-users', async (req, res) => {
    try {
        const { userIds } = req.body || {};
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Eksik veya boş userIds listesi.' });
        }
        const db = admin.firestore();
        const batch = db.batch();
        for (const uid of userIds) {
            batch.delete(db.collection('users').doc(uid));
        }
        await batch.commit();
        return res.json({ success: true, count: userIds.length });
    } catch (e) {
        console.error("Batch delete users error:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================
// GÜVENLİ SİSTEM VE KURUMSAL AYARLAR SERVİSİ
// ==========================================

// 1. Genel kullanıcı arayüzü ayarları (Sadece logo, şirket adı, avatar - ŞİFRELER & PROMPT'LAR KESİNLİKLE YOKTUR!)
app.get('/api/settings/public', async (req, res) => {
    try {
        const db = admin.firestore();
        const snap = await db.collection('settings').doc('global').get();
        if (!snap.exists) {
            return res.json({ success: true, settings: {} });
        }
        const data = snap.data();
        const publicSettings = {
            corporateName: data.corporateName || 'Move Yanımda',
            corporateLogo: data.corporateLogo || '',
            expertName: data.expertName || '',
            expertProfileAvatar: data.expertProfileAvatar || '',
            systemAnnouncementAvatar: data.systemAnnouncementAvatar || '',
            tourGroupAvatar: data.tourGroupAvatar || '',
            customerAvatar: data.customerAvatar || '',
            expertStatus: data.expertStatus || 'online'
        };
        return res.json({ success: true, settings: publicSettings });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Ayarlar yüklenemedi.' });
    }
});

// 2. Yönetici ayarları getirme (Yalnızca yetkili yönetici oturumu ile okunabilir)
app.post('/api/settings/get', async (req, res) => {
    try {
        const db = admin.firestore();
        let session = verifySessionToken(req);
        if (!session && (req.body?.email || req.body?.userId)) {
            let uDoc = null;
            if (req.body.userId) {
                const s = await db.collection('users').doc(req.body.userId).get();
                if (s.exists) uDoc = s.data();
            }
            if (!uDoc && req.body.email) {
                const s = await db.collection('users').where('email', '==', normalizeUserEmail(req.body.email)).limit(1).get();
                if (!s.empty) uDoc = s.docs[0].data();
            }
            if (uDoc && (uDoc.role === 'admin' || uDoc.secondaryRole === 'admin') && uDoc.status !== 'Pasif') {
                session = { role: 'admin' };
            }
        }

        if (!session || (session.role !== 'admin' && session.secondaryRole !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Yetkisiz erişim. Yalnızca yöneticiler sistem ayarlarını görebilir.' });
        }

        const snap = await db.collection('settings').doc('global').get();
        const data = snap.exists ? snap.data() : {};
        const serverSnap = await db.collection('server_settings').doc('global').get();
        const serverData = serverSnap.exists ? serverSnap.data() : {};

        const mergedSettings = {
            ...data,
            smtpConfig: {
                ...((data && data.smtpConfig) || {}),
                ...((serverData && serverData.smtpConfig) || {}),
                pass: (serverData?.smtpConfig?.pass) || (data?.smtpConfig?.pass) || ''
            },
            whatsappConfig: {
                ...((data && data.whatsappConfig) || {}),
                ...((serverData && serverData.whatsappConfig) || {}),
                accessToken: (serverData?.whatsappConfig?.accessToken) || (data?.whatsappConfig?.accessToken) || ''
            },
            geminiConfig: {
                ...((data && data.geminiConfig) || {}),
                ...((serverData && serverData.geminiConfig) || {}),
                apiKey: (serverData?.geminiConfig?.apiKey) || (data?.geminiConfig?.apiKey) || ''
            },
            netgsmConfig: {
                ...((data && data.netgsmConfig) || {}),
                ...((serverData && serverData.netgsmConfig) || {}),
                password: (serverData?.netgsmConfig?.password) || (data?.netgsmConfig?.password) || ''
            }
        };

        return res.json({ success: true, settings: mergedSettings });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Ayarlar yüklenemedi.' });
    }
});

// 3. Yönetici ayarları güncelleme (Yalnızca yetkili yönetici oturumu ile kaydedilebilir)
app.post('/api/settings/update', async (req, res) => {
    try {
        const db = admin.firestore();
        let session = verifySessionToken(req);
        if (!session && (req.body?.email || req.body?.userId)) {
            let uDoc = null;
            if (req.body.userId) {
                const s = await db.collection('users').doc(req.body.userId).get();
                if (s.exists) uDoc = s.data();
            }
            if (!uDoc && req.body.email) {
                const s = await db.collection('users').where('email', '==', normalizeUserEmail(req.body.email)).limit(1).get();
                if (!s.empty) uDoc = s.docs[0].data();
            }
            if (uDoc && (uDoc.role === 'admin' || uDoc.secondaryRole === 'admin') && uDoc.status !== 'Pasif') {
                session = { role: 'admin' };
            }
        }

        if (!session || (session.role !== 'admin' && session.secondaryRole !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
        }
        const { key, val, updates } = req.body || {};
        const payload = updates ? { ...updates } : (key ? { [key]: val } : {});

        // Hassas anahtarları server_settings koleksiyonuna güvenle kaydet ve settings/global içinde maskele
        const serverSecrets = {};
        let hasSecrets = false;

        if (payload.geminiConfig) {
            const rawKey = (payload.geminiConfig.apiKey || '').trim();
            if (rawKey && rawKey !== '********') {
                serverSecrets.geminiConfig = { ...payload.geminiConfig, apiKey: rawKey };
                hasSecrets = true;
                payload.geminiConfig = { ...payload.geminiConfig, apiKey: '********' };
            } else if (rawKey === '********') {
                // '********' ile server_settings'i ezme
                const sSnap = await db.collection('server_settings').doc('global').get();
                if (sSnap.exists && sSnap.data()?.geminiConfig?.apiKey) {
                    serverSecrets.geminiConfig = { ...payload.geminiConfig, apiKey: sSnap.data().geminiConfig.apiKey };
                    hasSecrets = true;
                }
            }
        }

        if (payload.smtpConfig) {
            const rawPass = (payload.smtpConfig.pass || '').trim();
            if (rawPass && rawPass !== '********') {
                serverSecrets.smtpConfig = { ...payload.smtpConfig, pass: rawPass };
                hasSecrets = true;
                payload.smtpConfig = { ...payload.smtpConfig, pass: '********' };
            } else if (rawPass === '********') {
                const sSnap = await db.collection('server_settings').doc('global').get();
                if (sSnap.exists && sSnap.data()?.smtpConfig?.pass) {
                    serverSecrets.smtpConfig = { ...payload.smtpConfig, pass: sSnap.data().smtpConfig.pass };
                    hasSecrets = true;
                }
            }
        }

        if (payload.whatsappConfig) {
            const rawToken = (payload.whatsappConfig.accessToken || '').trim();
            if (rawToken && rawToken !== '********') {
                serverSecrets.whatsappConfig = { ...payload.whatsappConfig, accessToken: rawToken };
                hasSecrets = true;
                payload.whatsappConfig = { ...payload.whatsappConfig, accessToken: '********' };
            } else if (rawToken === '********') {
                const sSnap = await db.collection('server_settings').doc('global').get();
                if (sSnap.exists && sSnap.data()?.whatsappConfig?.accessToken) {
                    serverSecrets.whatsappConfig = { ...payload.whatsappConfig, accessToken: sSnap.data().whatsappConfig.accessToken };
                    hasSecrets = true;
                }
            }
        }

        if (hasSecrets) {
            await db.collection('server_settings').doc('global').set(serverSecrets, { merge: true });
        }

        await db.collection('settings').doc('global').set(payload, { merge: true });
        return res.json({ success: true });
    } catch (e) {
        console.error("settings update error:", e);
        return res.status(500).json({ success: false, message: 'Ayar kaydedilemedi.' });
    }
});

// Hassas şifreleri server_settings koleksiyonuna taşıyan ve settings/global'i maskeleyen güvenli taşıma endpoint'i
app.post('/api/migrate-secrets', async (req, res) => {
    try {
        const db = admin.firestore();
        const globalSnap = await db.collection('settings').doc('global').get();
        if (!globalSnap.exists) {
            return res.status(404).json({ success: false, message: 'settings/global bulunamadı.' });
        }
        const data = globalSnap.data();

        // 1. Orijinal şifreleri koruyarak server_settings koleksiyonuna yaz
        const serverSnap = await db.collection('server_settings').doc('global').get();
        const currentServer = serverSnap.exists ? serverSnap.data() : {};
        const unmaskedSmtpPass = (data.smtpConfig?.pass && data.smtpConfig.pass !== '********') ? data.smtpConfig.pass : currentServer.smtpConfig?.pass;
        const unmaskedWaToken = (data.whatsappConfig?.accessToken && data.whatsappConfig.accessToken !== '********') ? data.whatsappConfig.accessToken : currentServer.whatsappConfig?.accessToken;
        const unmaskedNetgsmPass = (data.netgsmConfig?.password && data.netgsmConfig.password !== '********') ? data.netgsmConfig.password : currentServer.netgsmConfig?.password;
        const unmaskedGeminiKey = (data.geminiConfig?.apiKey && data.geminiConfig.apiKey !== '********') ? data.geminiConfig.apiKey : currentServer.geminiConfig?.apiKey;
        const unmaskedPlacesKey = (data.googlePlacesApiKey && data.googlePlacesApiKey !== '********') ? data.googlePlacesApiKey : currentServer.googlePlacesApiKey;

        const serverData = {
            ...data,
            smtpConfig: { ...(data.smtpConfig || {}), pass: unmaskedSmtpPass || '' },
            whatsappConfig: { ...(data.whatsappConfig || {}), accessToken: unmaskedWaToken || '' },
            netgsmConfig: { ...(data.netgsmConfig || {}), password: unmaskedNetgsmPass || '' },
            geminiConfig: { ...(data.geminiConfig || {}), apiKey: unmaskedGeminiKey || '' },
            googlePlacesApiKey: unmaskedPlacesKey || ''
        };
        await db.collection('server_settings').doc('global').set(serverData, { merge: true });

        // 2. settings/global dokümanında hassas alanları maskele (********)
        const maskedData = { ...data };
        if (maskedData.smtpConfig) {
            maskedData.smtpConfig = {
                ...maskedData.smtpConfig,
                pass: maskedData.smtpConfig.user ? '********' : ''
            };
        }
        if (maskedData.whatsappConfig) {
            maskedData.whatsappConfig = {
                ...maskedData.whatsappConfig,
                accessToken: maskedData.whatsappConfig.phoneId ? '********' : ''
            };
        }
        if (maskedData.netgsmConfig) {
            maskedData.netgsmConfig = {
                ...maskedData.netgsmConfig,
                password: maskedData.netgsmConfig.usercode ? '********' : ''
            };
        }
        if (maskedData.geminiConfig) {
            maskedData.geminiConfig = {
                ...maskedData.geminiConfig,
                apiKey: maskedData.geminiConfig.isEnabled ? '********' : ''
            };
        }
        if (maskedData.googlePlacesApiKey) {
            maskedData.googlePlacesApiKey = '********';
        }

        await db.collection('settings').doc('global').set(maskedData);

        return res.json({
            success: true,
            message: 'Tüm hassas şifreler server_settings koleksiyonuna taşındı ve settings/global içinde maskelendi.'
        });
    } catch (e) {
        console.error("migrate-secrets error:", e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/send-email', async (req, res) => {
    const { host, port, user, pass } = await resolveSmtpConfig(req.body);
    const { to, corporateName } = req.body;
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

app.post('/api/sync-email-templates', async (req, res) => {
    try {
        const db = admin.firestore();
        const batch = db.batch();
        
        const templates = {
    "tour_email": {
        "subject": "{{corporateName}}: {{tourName}} Seyahati Kaydınız Alındı",
        "body": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"><div style=\"background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;\">\n    <div style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);\">\n        <div style=\"height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);\"></div>\n        <div style=\"padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;\">\n            <img src=\"https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png\" alt=\"Move Travel &amp; Mice\" style=\"height: 40px; max-width: 210px; object-fit: contain; display: inline-block;\" />\n        </div>\n        <div style=\"padding: 28px 32px 34px 32px;\">\n            <div style=\"text-align: center; margin-bottom: 22px;\">\n                <span style=\"display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;\">\n                    Seyahat Kaydı Onayı\n                </span>\n                <h1 style=\"color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;\">\n                    Seyahat Kaydınız Başarıyla Tamamlandı\n                </h1>\n                <p style=\"color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;\">Sayın <strong>{{participantName}}</strong>, aramıza hoş geldiniz.</p>\n            </div>\n\n            <div style=\"background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;\">\n                <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Kayıt Olunan Seyahat</div>\n                <div style=\"font-size: 15.5px; font-weight: 600; color: #1e293b; margin-bottom: 12px;\">{{tourName}}</div>\n                <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Kullanıcı Adı (E-Posta)</div>\n                <div style=\"font-size: 14.5px; font-weight: 600; color: #1e293b;\">{{username}}</div>\n            </div>\n\n            {{credentialSection}}\n\n            <p style=\"font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; margin-top: 22px; text-align: center;\">\n                Uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve yetkili rehber bilgilerine dilediğiniz zaman ulaşabilirsiniz.\n            </p>\n        </div>\n        <div style=\"background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;\">\n            <p style=\"margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;\">{{corporateName}}</p>\n            <p style=\"margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;\">\n                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>\n                © Move Travel &amp; Mice. Tüm hakları saklıdır.\n            </p>\n        </div>\n    </div>\n</div>"
    },
    "ticket_email": {
        "subject": "{{corporateName}}: Uçuş Biletleriniz Sisteme Eklendi",
        "body": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"><div style=\"background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;\">\n    <div style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);\">\n        <div style=\"height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);\"></div>\n        <div style=\"padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;\">\n            <img src=\"https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png\" alt=\"Move Travel &amp; Mice\" style=\"height: 40px; max-width: 210px; object-fit: contain; display: inline-block;\" />\n        </div>\n        <div style=\"padding: 28px 32px 34px 32px;\">\n            <div style=\"text-align: center; margin-bottom: 22px;\">\n                <span style=\"display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;\">\n                    Elektronik Bilet Bildirimi\n                </span>\n                <h1 style=\"color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;\">\n                    Uçuş Biletleriniz Sisteme Eklendi\n                </h1>\n                <p style=\"color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;\">Sayın <strong>{{participantName}}</strong>,</p>\n            </div>\n\n            <p style=\"font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;\">\n                <strong>{{tourName}}</strong> seyahatiniz için elektronik uçuş biletiniz sisteme yüklenmiştir. Biletinizi aşağıdan hemen görüntüleyebilir veya indirebilirsiniz:\n            </p>\n\n            <div style=\"background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;\">\n                <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Seyahat Adı</div>\n                <div style=\"font-size: 15.5px; font-weight: 600; color: #1e293b; margin-bottom: 12px;\">{{tourName}}</div>\n                <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Yolcu Adı</div>\n                <div style=\"font-size: 14.5px; font-weight: 600; color: #1e293b;\">{{participantName}}</div>\n            </div>\n\n            {{pdfHtml}}\n\n            <div style=\"background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;\">\n                <p style=\"margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;\">\n                    💡 <strong>Önemli Bilgi:</strong> İndirdiğiniz e-bilet PDF dosyasını telefonunuzda saklayabilir veya çıktısını alarak havalimanı kontuarında check-in işlemlerinizde kullanabilirsiniz.\n                </p>\n            </div>\n\n            <p style=\"font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin-top: 22px;\">\n                Mobil uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve yetkili rehber bilgilerine dilediğiniz an erişebilirsiniz.\n            </p>\n        </div>\n        <div style=\"background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;\">\n            <p style=\"margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;\">{{corporateName}}</p>\n            <p style=\"margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;\">\n                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>\n                © Move Travel &amp; Mice. Tüm hakları saklıdır.\n            </p>\n        </div>\n    </div>\n</div>"
    },
    "forgot_password": {
        "subject": "{{corporateName}}: Parola Sıfırlama / Hatırlatma Talebi",
        "body": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"><div style=\"background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;\">\n    <div style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);\">\n        <div style=\"height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);\"></div>\n        <div style=\"padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;\">\n            <img src=\"https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png\" alt=\"Move Travel &amp; Mice\" style=\"height: 40px; max-width: 210px; object-fit: contain; display: inline-block;\" />\n        </div>\n        <div style=\"padding: 28px 32px 34px 32px;\">\n            <div style=\"text-align: center; margin-bottom: 22px;\">\n                <span style=\"display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;\">\n                    Güvenlik Talebi\n                </span>\n                <h1 style=\"color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;\">\n                    Parola Sıfırlama Talebi\n                </h1>\n                <p style=\"color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;\">Merhaba Sayın <strong>{{accountName}}</strong>,</p>\n            </div>\n\n            <p style=\"font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 20px 0; line-height: 1.6;\">\n                <strong>{{corporateName}}</strong> hesabınız için parola yenileme talebinde bulundunuz. Yeni parolanızı güvenle belirlemek için aşağıdaki butona tıklayabilirsiniz:\n            </p>\n\n            <div style=\"text-align: center; margin: 24px 0 14px 0;\">\n                <a href=\"{{setupUrl}}\" style=\"background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;\">\n                    Şifrenizi Belirleyin\n                </a>\n            </div>\n\n            <div style=\"background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;\">\n                <p style=\"margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;\">\n                    🔒 <strong>Güvenliğiniz için:</strong> Bu bağlantı tek kullanımlıktır ve 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.\n                </p>\n            </div>\n        </div>\n        <div style=\"background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;\">\n            <p style=\"margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;\">{{corporateName}}</p>\n            <p style=\"margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;\">\n                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>\n                © Move Travel &amp; Mice. Tüm hakları saklıdır.\n            </p>\n        </div>\n    </div>\n</div>"
    },
    "credentials_email": {
        "subject": "{{corporateName}}: Giriş Bilgileriniz ve Şifre Belirleme Bağlantısı",
        "body": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"><div style=\"background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;\">\n    <div style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);\">\n        <div style=\"height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);\"></div>\n        <div style=\"padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;\">\n            <img src=\"https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png\" alt=\"Move Travel &amp; Mice\" style=\"height: 40px; max-width: 210px; object-fit: contain; display: inline-block;\" />\n        </div>\n        <div style=\"padding: 28px 32px 34px 32px;\">\n            <div style=\"text-align: center; margin-bottom: 22px;\">\n                <span style=\"display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;\">\n                    Giriş Bilgileri\n                </span>\n                <h1 style=\"color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;\">\n                    Hesap Giriş Bilgileriniz\n                </h1>\n                <p style=\"color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;\">Merhaba Sayın <strong>{{accountName}}</strong>,</p>\n            </div>\n\n            <p style=\"font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;\">\n                <strong>{{corporateName}}</strong> sistemine giriş yapabilmeniz için kullanıcı adınız aşağıda yer almaktadır. Sisteme ilk kez giriş yapabilmeniz veya şifrenizi oluşturabilmeniz için aşağıdaki butonu kullanabilirsiniz:\n            </p>\n            \n            <div style=\"background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;\">\n                <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Kullanıcı Adı (E-Posta)</div>\n                <div style=\"font-size: 15px; font-weight: 600; color: #1e293b;\">{{accountEmail}}</div>\n            </div>\n\n            <div style=\"text-align: center; margin: 24px 0 14px 0;\">\n                <a href=\"{{setupUrl}}\" style=\"background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;\">\n                    Şifrenizi Belirleyin\n                </a>\n            </div>\n\n            <div style=\"background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;\">\n                <p style=\"margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;\">\n                    🔒 <strong>Güvenlik Uyarısı:</strong> Bu şifre belirleme bağlantısı tek kullanımlıktır ve 24 saat geçerlidir. Şifrenizi belirledikten sonra doğrudan sisteme giriş yapabilirsiniz.\n                </p>\n            </div>\n\n            <p style=\"font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin: 18px 0 0 0;\">\n                Uygulamaya giriş yaparak seyahatiniz ile ilgili uçuş, otel, transfer, rehber ve acil durum bilgilerine dilediğiniz zaman ulaşabilirsiniz.\n            </p>\n        </div>\n        <div style=\"background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;\">\n            <p style=\"margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;\">{{corporateName}}</p>\n            <p style=\"margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;\">\n                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>\n                © Move Travel &amp; Mice. Tüm hakları saklıdır.\n            </p>\n        </div>\n    </div>\n</div>"
    },
    "account_updated_email": {
        "subject": "{{corporateName}}: Hesap ve İletişim Bilgileriniz Güncellendi",
        "body": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"><div style=\"background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;\">\n    <div style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);\">\n        <div style=\"height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);\"></div>\n        <div style=\"padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;\">\n            <img src=\"https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png\" alt=\"Move Travel &amp; Mice\" style=\"height: 40px; max-width: 210px; object-fit: contain; display: inline-block;\" />\n        </div>\n        <div style=\"padding: 28px 32px 34px 32px;\">\n            <div style=\"text-align: center; margin-bottom: 22px;\">\n                <span style=\"display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;\">\n                    Bilgi Güncellemesi\n                </span>\n                <h1 style=\"color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;\">\n                    Hesap ve İletişim Bilgileriniz Güncellendi\n                </h1>\n                <p style=\"color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;\">Merhaba Sayın <strong>{{accountName}}</strong>,</p>\n            </div>\n\n            <p style=\"font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;\">\n                <strong>{{corporateName}}</strong> sisteminde kayıtlı profil ve iletişim bilgileriniz başarıyla güncellenmiştir. Güncel giriş ve iletişim detaylarınız aşağıda yer almaktadır:\n            </p>\n            \n            <div style=\"background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;\">\n                <div style=\"margin-bottom: 12px;\">\n                    <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Giriş E-Postası (Kullanıcı Adı)</div>\n                    <div style=\"font-size: 15px; font-weight: 600; color: #1e293b;\">{{accountEmail}}</div>\n                </div>\n                <div>\n                    <div style=\"font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">Kayıtlı Telefon Numarası</div>\n                    <div style=\"font-size: 14.5px; font-weight: 600; color: #1e293b;\">{{accountPhone}}</div>\n                </div>\n            </div>\n\n            <div style=\"text-align: center; margin: 24px 0 14px 0;\">\n                <a href=\"{{setupUrl}}\" style=\"background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;\">\n                    Hesabınızı Aktif Edin\n                </a>\n            </div>\n\n            <p style=\"font-size: 12px; color: #64748b; font-weight: 500; text-align: center; margin: 0 0 18px 0; line-height: 1.5;\">\n                Yukarıdaki butona tıklayarak tek tıkla hesabınızı aktif hale getirebilir veya dilediğiniz zaman yeni şifrenizi belirleyebilirsiniz.\n            </p>\n\n            <p style=\"font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin: 18px 0 0 0;\">\n                Yeni bilgilerinizle uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve rehber detaylarına dilediğiniz an erişebilirsiniz.\n            </p>\n        </div>\n        <div style=\"background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;\">\n            <p style=\"margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;\">{{corporateName}}</p>\n            <p style=\"margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;\">\n                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>\n                © Move Travel &amp; Mice. Tüm hakları saklıdır.\n            </p>\n        </div>\n    </div>\n</div>"
    }
};

        for (const [key, data] of Object.entries(templates)) {
            batch.set(db.collection('email_templates').doc(key), data, { merge: true });
        }
        await batch.commit();
        return res.json({ success: true, message: 'Tüm e-posta şablonları Firestore veritabanında başarıyla güncellendi.' });
    } catch (err) {
        console.error("sync-email-templates error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { host, port, user, pass } = await resolveSmtpConfig(req.body);
    const { to, corporateName, accountName, accountPassword, customSubject, customHtml } = req.body;
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
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Güvenlik Talebi
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Parola Sıfırlama Talebi
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Merhaba Sayın <strong>{{accountName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 20px 0; line-height: 1.6;">
                <strong>{{corporateName}}</strong> hesabınız için parola yenileme talebinde bulundunuz. Yeni parolanızı güvenle belirlemek için aşağıdaki butona tıklayabilirsiniz:
            </p>

            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="{{setupUrl}}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Şifrenizi Belirleyin
                </a>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    🔒 <strong>Güvenliğiniz için:</strong> Bu bağlantı tek kullanımlıktır ve 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.
                </p>
            </div>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>
        `;

        let htmlContent = customHtml || defaultHtml;
        htmlContent = htmlContent
            .replace(/{{accountName}}/g, escapeHtml(accountName || ''))
            .replace(/{{accountPassword}}/g, '')
            .replace(/{{password}}/g, '')
            .replace(/{{setupUrl}}/g, req.body.setupUrl || 'https://move-yanimda.web.app/login')
            .replace(/{{loginUrl}}/g, 'https://move-yanimda.web.app/login')
            .replace(/{{corporateName}}/g, escapeHtml(senderBrand));

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

app.post('/api/send-credentials', async (req, res) => {
    const { host, port, user, pass } = await resolveSmtpConfig(req.body);
    const { to, corporateName, accountName, accountEmail, accountPassword, customSubject, customHtml } = req.body;
    const senderBrand = corporateName || 'Move Yanımda';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik. Lütfen yapılandırmayı kontrol edin.' });
    }

    if (isChildEmailAddress(to)) {
        return res.status(400).json({ success: false, message: 'Çocuk profilleri ve dahili hesaplar için giriş bilgisi e-postası gönderilemez.' });
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
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Giriş Bilgileri
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Hesap Giriş Bilgileriniz
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Merhaba Sayın <strong>{{accountName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;">
                <strong>{{corporateName}}</strong> sistemine giriş yapabilmeniz için kullanıcı adınız aşağıda yer almaktadır. Sisteme ilk kez giriş yapabilmeniz veya şifrenizi oluşturabilmeniz için aşağıdaki butonu kullanabilirsiniz:
            </p>
            
            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kullanıcı Adı (E-Posta)</div>
                <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{{accountEmail}}</div>
            </div>

            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="{{setupUrl}}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Şifrenizi Belirleyin
                </a>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    🔒 <strong>Güvenlik Uyarısı:</strong> Bu şifre belirleme bağlantısı tek kullanımlıktır ve 24 saat geçerlidir. Şifrenizi belirledikten sonra doğrudan sisteme giriş yapabilirsiniz.
                </p>
            </div>

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin: 18px 0 0 0;">
                Uygulamaya giriş yaparak seyahatiniz ile ilgili uçuş, otel, transfer, rehber ve acil durum bilgilerine dilediğiniz zaman ulaşabilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>
        `;

        let htmlContent = customHtml || defaultHtml;
        const targetEmail = accountEmail || to;
        htmlContent = htmlContent
            .replace(/{{accountName}}/g, escapeHtml(accountName || ''))
            .replace(/{{participantName}}/g, escapeHtml(accountName || ''))
            .replace(/{{accountEmail}}/g, escapeHtml(targetEmail))
            .replace(/{{username}}/g, escapeHtml(targetEmail))
            .replace(/{{email}}/g, escapeHtml(targetEmail))
            .replace(/{{accountPhone}}/g, escapeHtml(req.body.accountPhone || '-'))
            .replace(/{{phone}}/g, escapeHtml(req.body.accountPhone || '-'))
            .replace(/{{accountPassword}}/g, '')
            .replace(/{{password}}/g, '')
            .replace(/{{setupUrl}}/g, req.body.setupUrl || 'https://move-yanimda.web.app/login')
            .replace(/{{loginUrl}}/g, req.body.loginUrl || 'https://move-yanimda.web.app/login')
            .replace(/{{corporateName}}/g, escapeHtml(senderBrand));

        let subjectContent = customSubject || `{{corporateName}}: Giriş Bilgileriniz ve Şifre Belirleme Bağlantısı`;
        subjectContent = subjectContent
            .replace(/{{corporateName}}/g, senderBrand)
            .replace(/{{accountName}}/g, accountName || '');

        await transporter.sendMail({
            from: `"${senderBrand} Bilgilendirme" <${user}>`,
            to: to,
            subject: subjectContent,
            html: htmlContent
        });

        return res.json({ success: true, message: `Giriş bilgileri ${to} adresine başarıyla iletildi.` });

    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ success: false, message: `SMTP Hatası: ${error.message}` });
    }
});

app.post('/api/send-account-update', async (req, res) => {
    const { host, port, user, pass } = await resolveSmtpConfig(req.body);
    const { to, corporateName, accountName, accountEmail, accountPhone, accountPassword, customSubject, customHtml } = req.body;
    const senderBrand = corporateName || 'Move Yanımda';

    if (!host || !port || !user || !pass || !to) {
        return res.status(400).json({ success: false, message: 'SMTP ayarları eksik. Lütfen yapılandırmayı kontrol edin.' });
    }

    if (isChildEmailAddress(to)) {
        return res.status(400).json({ success: false, message: 'Çocuk profilleri ve dahili hesaplar için e-posta gönderilemez.' });
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
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Bilgi Güncellemesi
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Hesap ve İletişim Bilgileriniz Güncellendi
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Merhaba Sayın <strong>{{accountName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;">
                <strong>{{corporateName}}</strong> sisteminde kayıtlı profil ve iletişim bilgileriniz başarıyla güncellenmiştir. Güncel giriş ve iletişim detaylarınız aşağıda yer almaktadır:
            </p>
            
            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Giriş E-Postası (Kullanıcı Adı)</div>
                    <div style="font-size: 15px; font-weight: 600; color: #1e293b;">{{accountEmail}}</div>
                </div>
                <div>
                    <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kayıtlı Telefon Numarası</div>
                    <div style="font-size: 14.5px; font-weight: 600; color: #1e293b;">{{accountPhone}}</div>
                </div>
            </div>

            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="{{setupUrl}}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Hesabınızı Aktif Edin
                </a>
            </div>

            <p style="font-size: 12px; color: #64748b; font-weight: 500; text-align: center; margin: 0 0 18px 0; line-height: 1.5;">
                Yukarıdaki butona tıklayarak tek tıkla hesabınızı aktif hale getirebilir veya dilediğiniz zaman yeni şifrenizi belirleyebilirsiniz.
            </p>

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin: 18px 0 0 0;">
                Yeni bilgilerinizle uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve rehber detaylarına dilediğiniz an erişebilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>
        `;

        let htmlContent = customHtml || defaultHtml;
        const targetEmail = accountEmail || to;
        const targetPhone = accountPhone || '-';
        htmlContent = htmlContent
            .replace(/{{accountName}}/g, escapeHtml(accountName || ''))
            .replace(/{{participantName}}/g, escapeHtml(accountName || ''))
            .replace(/{{accountEmail}}/g, escapeHtml(targetEmail))
            .replace(/{{username}}/g, escapeHtml(targetEmail))
            .replace(/{{email}}/g, escapeHtml(targetEmail))
            .replace(/{{accountPhone}}/g, escapeHtml(targetPhone))
            .replace(/{{phone}}/g, escapeHtml(targetPhone))
            .replace(/{{accountPassword}}/g, '')
            .replace(/{{password}}/g, '')
            .replace(/{{setupUrl}}/g, req.body.setupUrl || 'https://move-yanimda.web.app/login')
            .replace(/{{loginUrl}}/g, req.body.loginUrl || 'https://move-yanimda.web.app/login')
            .replace(/{{corporateName}}/g, escapeHtml(senderBrand));

        let subjectContent = customSubject || `{{corporateName}}: Hesap ve İletişim Bilgileriniz Güncellendi`;
        subjectContent = subjectContent
            .replace(/{{corporateName}}/g, senderBrand)
            .replace(/{{accountName}}/g, accountName || '');

        await transporter.sendMail({
            from: `"${senderBrand} Bilgilendirme" <${user}>`,
            to: to,
            subject: subjectContent,
            html: htmlContent
        });

        return res.json({ success: true, message: `Bilgi güncelleme e-postası ${to} adresine başarıyla iletildi.` });

    } catch (error) {
        console.error("SMTP Hata:", error);
        return res.status(500).json({ success: false, message: `SMTP Hatası: ${error.message}` });
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
    const { host, port, user, pass } = await resolveSmtpConfig(req.body);
    const { to, participantName, tourName, flights, ticketPdf, ticketFiles, customSubject, customHtml } = req.body;
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
                const name = typeof t === 'object' ? (t.name || `E-Bilet #${idx + 1}`) : `E-Bilet #${idx + 1}`;
                if (!url) return '';
                return `
                    <div style="margin: 8px 0;">
                        <a href="${url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 13.5px; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                            📥 ${name} (PDF İndir / Görüntüle)
                        </a>
                    </div>
                `;
            }).filter(Boolean).join('');

            if (ticketButtons) {
                pdfHtml = `
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin: 20px 0; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); text-align: center;">
                        <div style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
                            PDF E-BİLET DOSYASI
                        </div>
                        <div style="font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 6px;">
                            Elektronik Uçak Biletiniz Hazır ${allTickets.length > 1 ? `(${allTickets.length} Adet PDF)` : ''}
                        </div>
                        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px;">Uçuş biletinizi görüntülemek veya cihazınıza indirmek için aşağıdaki butona tıklayabilirsiniz:</p>
                        ${ticketButtons}
                    </div>
                `;
            }
        }

        let flightsHtml = '';
        if (flights && flights.length > 0) {
            flightsHtml = flights.map(f => `
                <div style="background: #f8fafc; padding: 18px; border-radius: 14px; margin: 14px 0; border: 1px solid #e2e8f0; border-left: 4px solid #D7147A;">
                    <div style="font-weight: 800; color: #D7147A; font-size: 15px; margin-bottom: 10px;">${f.type || 'Uçuş'} - ${f.airline || ''}</div>
                    <div style="font-size: 13.5px; color: #334155; line-height: 1.6;">
                        <div style="margin-bottom: 4px;"><strong>Kalkış - Varış:</strong> ${f.from || '-'} ➔ ${f.to || '-'}</div>
                        <div style="margin-bottom: 4px;"><strong>Tarih &amp; Saat:</strong> ${f.date || '-'} ${f.departureTime || '-'}</div>
                        <div><strong>Uçuş No:</strong> ${f.flightNo || '-'} &nbsp;|&nbsp; <strong>PNR:</strong> ${f.pnr || '-'} &nbsp;|&nbsp; <strong>Bilet No:</strong> ${f.ticketNo || '-'}</div>
                    </div>
                </div>
            `).join('');
        }

        const defaultHtml = `
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Elektronik Bilet Bildirimi
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Uçuş Biletleriniz Sisteme Eklendi
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Sayın <strong>{{participantName}}</strong>,</p>
            </div>

            <p style="font-size: 13.5px; font-weight: 400; color: #475569; text-align: center; margin: 0 0 18px 0; line-height: 1.6;">
                <strong>{{tourName}}</strong> seyahatiniz için elektronik uçuş biletiniz sisteme yüklenmiştir. Biletinizi aşağıdan hemen görüntüleyebilir veya indirebilirsiniz:
            </p>

            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Seyahat Adı</div>
                <div style="font-size: 15.5px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">{{tourName}}</div>
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Yolcu Adı</div>
                <div style="font-size: 14.5px; font-weight: 600; color: #1e293b;">{{participantName}}</div>
            </div>

            {{pdfHtml}}

            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    💡 <strong>Önemli Bilgi:</strong> İndirdiğiniz e-bilet PDF dosyasını telefonunuzda saklayabilir veya çıktısını alarak havalimanı kontuarında check-in işlemlerinizde kullanabilirsiniz.
                </p>
            </div>

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; text-align: center; margin-top: 22px;">
                Mobil uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve yetkili rehber bilgilerine dilediğiniz an erişebilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
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
    const { host, port, user, pass } = await resolveSmtpConfig(req.body);
    const { to, corporateName, participantName, tourName, password, customSubject, customHtml } = req.body;
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

        const targetSetupUrl = req.body.setupUrl || 'https://move-yanimda.web.app/set-password';
        const targetLoginUrl = 'https://move-yanimda.web.app/login';

        let credentialSection = `
            <div style="text-align: center; margin: 24px 0 14px 0;">
                <a href="${targetSetupUrl}" style="background: linear-gradient(135deg, #D7147A 0%, #b80f68 100%); color: #ffffff; padding: 12px 32px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(215, 20, 122, 0.25); letter-spacing: 0.2px;">
                    Hesabınızı Aktif Edin
                </a>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 11px 16px; margin: 18px 0; text-align: center; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.5;">
                    🔒 Yukarıdaki butona tıklayarak tek tıkla hesabınızı aktif hale getirebilir ve şifrenizi güvenle belirleyebilirsiniz.
                </p>
            </div>
        `;

        const defaultHtml = `
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><div style="background-color: #f8fafc; padding: 36px 12px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.65;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
        <div style="height: 3px; background: linear-gradient(90deg, #D7147A 0%, #b80f68 50%, #f43f5e 100%);"></div>
        <div style="padding: 26px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f8fafc;">
            <img src="https://move.com.tr/wp-content/uploads/thegem/logos/logo_34e7aaf6ef74bcbc5b7767b6af85fbb4_1x.png" alt="Move Travel &amp; Mice" style="height: 40px; max-width: 210px; object-fit: contain; display: inline-block;" />
        </div>
        <div style="padding: 28px 32px 34px 32px;">
            <div style="text-align: center; margin-bottom: 22px;">
                <span style="display: inline-block; background: #fdf2f8; color: #D7147A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
                    Seyahat Kaydı Onayı
                </span>
                <h1 style="color: #1e293b; margin: 12px 0 6px 0; font-size: 21px; font-weight: 600; letter-spacing: -0.2px;">
                    Seyahat Kaydınız Başarıyla Tamamlandı
                </h1>
                <p style="color: #64748b; font-size: 13.5px; font-weight: 500; margin: 0;">Sayın <strong>{{participantName}}</strong>, aramıza hoş geldiniz.</p>
            </div>

            <div style="background: #f8fafc; border-radius: 14px; padding: 18px 20px; border: 1px solid #e2e8f0; border-left: 3px solid #D7147A; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kayıt Olunan Seyahat</div>
                <div style="font-size: 15.5px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">{{tourName}}</div>
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Kullanıcı Adı (E-Posta)</div>
                <div style="font-size: 14.5px; font-weight: 600; color: #1e293b;">{{username}}</div>
            </div>

            {{credentialSection}}

            <p style="font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.6; margin-top: 22px; text-align: center;">
                Uygulamamıza giriş yaparak seyahatiniz ile ilgili tüm uçuş, transfer, tur programı ve yetkili rehber bilgilerine dilediğiniz zaman ulaşabilirsiniz.
            </p>
        </div>
        <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; color: #475569;">{{corporateName}}</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 400; line-height: 1.5;">
                Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.<br/>
                © Move Travel &amp; Mice. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</div>
        `;

        let htmlContent = customHtml || defaultHtml;
        htmlContent = htmlContent
            .replace(/{{participantName}}/g, escapeHtml(participantName || ''))
            .replace(/{{tourName}}/g, escapeHtml(tourName || ''))
            .replace(/{{credentialSection}}/g, credentialSection || '')
            .replace(/{{username}}/g, escapeHtml(to || ''))
            .replace(/{{accountEmail}}/g, escapeHtml(to || ''))
            .replace(/{{password}}/g, '')
            .replace(/{{accountPassword}}/g, '')
            .replace(/{{setupUrl}}/g, targetSetupUrl)
            .replace(/{{loginUrl}}/g, targetLoginUrl)
            .replace(/{{corporateName}}/g, escapeHtml(senderBrand));

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
    const { phoneId, accessToken } = await resolveWhatsAppConfig(req.body);
    const { to, templateName, languageCode, parameters } = req.body;

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
        const isActivationTemplate = templateName.toLowerCase().includes('activation') || templateName.toLowerCase().includes('set_password');
        const buttonParam = req.body.buttonParameter || (isActivationTemplate && parameters && parameters.length > 1 ? parameters[1] : null);

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
        } else if (buttonParam) {
            const bodyParams = isActivationTemplate && parameters && parameters.length > 1 ? [parameters[0]] : (parameters || []);
            bodyData.template.components = [
                {
                    type: "body",
                    parameters: bodyParams.map(p => ({
                        type: "text",
                        text: String(p)
                    }))
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                        {
                            type: "text",
                            text: String(buttonParam)
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


function fetchPoFuelPrices() {
    return new Promise((resolve, reject) => {
        https.get('https://www.petrolofisi.com.tr/akaryakit-fiyatlari', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html'
            }
        }, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                try {
                    const cities = {};
                    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
                    let match;
                    while ((match = trRegex.exec(html)) !== null) {
                        const rowContent = match[1];
                        const cityMatch = /<td[^>]*>([\s\S]*?)<\/td>/i.exec(rowContent);
                        if (!cityMatch) continue;
                        const cityName = cityMatch[1].replace(/<[^>]+>/g, '').trim().toUpperCase();
                        if (!cityName || cityName.includes('ŞEHIR') || cityName.includes('SEHIR')) continue;

                        const prices = [];
                        const taxRegex = /<span class="with-tax">([^<]+)<\/span>/gi;
                        let taxMatch;
                        while ((taxMatch = taxRegex.exec(rowContent)) !== null) {
                            const val = parseFloat(taxMatch[1].replace(',', '.'));
                            if (!isNaN(val)) prices.push(val);
                        }
                        if (prices.length >= 6) {
                            cities[cityName] = {
                                gasoline: prices[0],
                                diesel: prices[1],
                                lpg: prices[5]
                            };
                        }
                    }

                    const istAvrupa = cities['ISTANBUL (AVRUPA)'] || cities['İSTANBUL (AVRUPA)'];
                    const istAnadolu = cities['ISTANBUL (ANADOLU)'] || cities['İSTANBUL (ANADOLU)'];
                    
                    let gasoline = 76.25;
                    let diesel = 96.80;
                    let lpg = 40.90;

                    if (istAvrupa && istAnadolu) {
                        gasoline = Number(((istAvrupa.gasoline + istAnadolu.gasoline) / 2).toFixed(2));
                        diesel = Number(((istAvrupa.diesel + istAnadolu.diesel) / 2).toFixed(2));
                        lpg = Number(((istAvrupa.lpg + istAnadolu.lpg) / 2).toFixed(2));
                    } else if (istAvrupa) {
                        gasoline = istAvrupa.gasoline;
                        diesel = istAvrupa.diesel;
                        lpg = istAvrupa.lpg;
                    }

                    resolve({
                        success: true,
                        source: 'Petrol Ofisi / Opet Resmi Pompa Fiyatları',
                        lastUpdated: new Date().toISOString(),
                        prices: { gasoline, diesel, lpg },
                        totalCities: Object.keys(cities).length,
                        cities
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Canlı Akaryakıt Fiyatları Endpoint'i
app.get('/api/fuel-prices', async (req, res) => {
    try {
        const db = admin.firestore();
        const docRef = db.collection('system_settings').doc('fuel_prices');
        const forceRefresh = req.query.refresh === 'true';

        if (!forceRefresh) {
            const snap = await docRef.get();
            if (snap.exists) {
                const data = snap.data();
                // 12 saatten yeniyse önbellekten dön
                if (data && data.prices && data.prices.gasoline > 0) {
                    return res.json(data);
                }
            }
        }

        const freshData = await fetchPoFuelPrices();
        await docRef.set({
            ...freshData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json(freshData);
    } catch (error) {
        console.error("Akaryakıt API hatası:", error);
        res.json({
            success: true,
            source: 'Varsayılan Güncel Fiyatlar',
            lastUpdated: new Date().toISOString(),
            prices: { gasoline: 76.25, diesel: 96.80, lpg: 40.90 }
        });
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

// 0. List Models Endpoint
app.get('/api/tintin/models', async (req, res) => {
    try {
        const apiKey = await resolveGeminiApiKey();
        if (!apiKey) return res.status(400).json({ success: false, message: 'No key' });
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await resp.json();
        const modelNames = (data.models || []).map(m => m.name.replace('models/', ''));
        return res.json({ success: true, count: modelNames.length, models: modelNames, raw: data });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// 1. Test Gemini Connection Endpoint
app.post('/api/tintin/test-connection', async (req, res) => {
    const { apiKey = '', model = 'gemini-3.5-flash' } = req.body || {};
    const cleanKey = await resolveGeminiApiKey(apiKey);

    if (!cleanKey || typeof cleanKey !== 'string' || cleanKey.trim().length < 8) {
        return res.status(400).json({ 
            success: false, 
            message: 'Geçersiz veya eksik Gemini API Key. Lütfen yönetici panelinden geçerli bir API anahtarı tanımlayın.' 
        });
    }

    const cleanModel = (model || 'gemini-3.5-flash').trim();
    const candidateModels = Array.from(new Set([
        cleanModel === 'gemini-2.5-flash' ? 'gemini-3.5-flash' : cleanModel,
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-3-flash-preview',
        'gemini-flash-latest',
        'gemini-3.8-flash'
    ])).filter(Boolean);

    let lastError = null;
    let successModel = null;

    for (const m of candidateModels) {
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${cleanKey}`;
            const testPayload = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: "Merhaba, baglanti testi. Tek kelime cevap ver." }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.1
                }
            };

            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload)
            });

            const data = await response.json();

            if (response.ok && data?.candidates?.[0]?.content?.parts) {
                const parts = data.candidates[0].content.parts;
                const combined = parts.map(p => p.text || '').filter(Boolean).join('\n').trim();
                if (combined) {
                    successModel = m;
                    break;
                }
            } else {
                lastError = data?.error || { message: response.statusText || 'Bilinmeyen API hatası.' };
                if (response.status === 400 && data?.error?.message?.toLowerCase().includes('api key')) {
                    break;
                }
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (successModel) {
        return res.json({ 
            success: true, 
            message: `Google Gemini (${successModel}) API bağlantısı başarılı!`,
            model: successModel
        });
    } else {
        const errMsg = lastError?.message || 'Bilinmeyen API hatası.';
        return res.status(400).json({ 
            success: false, 
            message: `Gemini API Hatası: ${errMsg}`,
            details: lastError 
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
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Mesaj içeriği boş olamaz.' });
    }

    const apiKey = await resolveGeminiApiKey(directApiKey || settings.apiKey);
    if (!apiKey) {
        return res.status(400).json({ 
            success: false, 
            message: 'Gemini API Key yapılandırılmamış. Lütfen yönetici panelinden Gemini API anahtarını tanımlayın.' 
        });
    }

    const dailyLimit = Number(settings.dailyLimit) || 100;
    const rateCheck = checkRateLimit(userId, dailyLimit);
    if (!rateCheck.allowed) {
        return res.status(429).json({ 
            success: false, 
            message: `Günlük soru limitinize (${dailyLimit} istek) ulaştınız. Lütfen yarın tekrar deneyin.` 
        });
    }

    const rawModel = (directModel || settings.model || 'gemini-3.5-flash').trim();
    const model = (rawModel === 'gemini-2.5-flash' || rawModel === 'gemini-2.0-flash' || rawModel === 'gemini-1.5-flash') ? 'gemini-3.5-flash' : (rawModel || 'gemini-3.5-flash');
    const maxTokens = Math.max(Number(directMaxTokens) || Number(settings.maxTokens) || 2048, 1024);
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
        'gemini-3.5-flash-lite',
        'gemini-3-flash-preview',
        'gemini-flash-latest',
        'gemini-3.8-flash'
    ])).filter(Boolean);

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

            if (response.ok && data?.candidates?.[0]?.content?.parts) {
                const parts = data.candidates[0].content.parts;
                const combined = parts.map(p => p.text || '').filter(Boolean).join('\n').trim();
                if (combined) {
                    replyText = combined;
                    usage = data.usageMetadata || {};
                    tintinStats.totalRequests += 1;
                    tintinStats.dailyRequests += 1;
                    break;
                }
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

// ==========================================
// HER GECE 00:00 AKARYAKIT FİYATLARINI OTOMATİK GÜNCELLEME CRON GÖREVİ
// ==========================================
exports.dailyFuelPriceUpdate = onSchedule({
    schedule: "0 0 * * *",
    timeZone: "Europe/Istanbul"
}, async (event) => {
    try {
        console.log("[CRON 00:00] Gece yarısı akaryakıt fiyatları güncelleniyor...");
        const data = await fetchPoFuelPrices();
        const db = admin.firestore();
        await db.collection('system_settings').doc('fuel_prices').set({
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log("[CRON 00:00] Akaryakıt fiyatları başarıyla Firestore'a yazıldı:", data.prices);
    } catch (err) {
        console.error("[CRON 00:00] Akaryakıt fiyatı güncelleme hatası:", err);
    }
});

// Expose the Express app as a single Cloud Function named 'backend' using Gen 2
exports.backend = onRequest({ cors: true, maxInstances: 10 }, app);

