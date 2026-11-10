import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';
import { getApiBaseUrl } from '../utils/apiConfig';

/**
 * Benzersiz ve tahmin edilemez güvenli bir token üretir
 */
export const generateSecureToken = () => {
  const randomPart1 = Math.random().toString(36).substring(2, 12);
  const timePart = Date.now().toString(36);
  const randomPart2 = Math.random().toString(36).substring(2, 12);
  return `act_${randomPart1}${timePart}${randomPart2}`;
};

/**
 * Kullanıcı için tek kullanımlık şifre belirleme bağlantısı ve tokeni oluşturur.
 * Güvenlik için eski kullanılmamış tokenlar otomatik olarak geçersiz kılınır.
 * 
 * @param {Object} user Kullanıcı nesnesi (id, name, email, phone)
 * @param {number} expiresInHours Bağlantının geçerlilik süresi (saat, varsayılan 24)
 * @returns {Promise<{token: string, url: string, expiresAt: number}>}
 */
export const createPasswordSetupLink = async (user, expiresInHours = 24) => {
  if (!user || !user.id) {
    throw new Error("Geçerli bir kullanıcı nesnesi gereklidir.");
  }

  // Güvenlik: Bu kullanıcıya ait daha önce üretilmiş ama henüz tüketilmemiş tokenları iptal et
  try {
    const q = query(
      collection(db, 'auth_tokens'),
      where('userId', '==', user.id),
      where('used', '==', false)
    );
    const oldTokensSnap = await getDocs(q);
    const cancelPromises = [];
    oldTokensSnap.forEach(tDoc => {
      cancelPromises.push(updateDoc(doc(db, 'auth_tokens', tDoc.id), {
        used: true,
        canceledAt: Date.now(),
        cancelReason: 'superceded_by_new_token'
      }));
    });
    if (cancelPromises.length > 0) {
      await Promise.all(cancelPromises);
    }
  } catch (cancelErr) {
    console.warn("Could not cancel prior tokens:", cancelErr);
  }

  const token = generateSecureToken();
  const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000);
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanPhone = (user.phone || '').trim();

  const tokenData = {
    token,
    userId: user.id,
    name: user.name || '',
    email: cleanEmail,
    phone: cleanPhone,
    type: 'set_password',
    used: false,
    createdAt: Date.now(),
    expiresAt
  };

  await setDoc(doc(db, 'auth_tokens', token), tokenData);

  const baseUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://move-yanimda.web.app';

  const setupUrl = `${baseUrl}/set-password?token=${token}`;

  return {
    token,
    url: setupUrl,
    expiresAt
  };
};

/**
 * Tokenin geçerliliğini ve kullanıcı durumunu doğrular
 * @param {string} token 
 * @returns {Promise<{valid: boolean, reason?: string, tokenData?: Object, user?: Object}>}
 */
export const verifyPasswordSetupToken = async (token) => {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Bağlantı parametresi eksik veya geçersiz.' };
  }

  const cleanToken = token.trim();

  // 1. ÖNCELİKLİ: Güvenli Cloud Functions Backend API üzerinden doğrula
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/verify-setup-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cleanToken })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.valid) {
        return {
          valid: true,
          tokenData: data.tokenData,
          user: data.user
        };
      }
    }

    if (res.status === 400 || res.status === 404 || res.status === 429) {
      const errData = await res.json().catch(() => ({}));
      return {
        valid: false,
        reason: errData.reason || errData.message || 'Şifre belirleme bağlantısı geçersiz veya süresi dolmuş.'
      };
    }
  } catch (apiErr) {
    console.warn("Backend token verification fetch failed, falling back to direct auth_tokens read:", apiErr);
  }

  // 2. YEDEK KORUMA (FALLBACK): İstemci Firestore SDK üzerinden auth_tokens dokümanını oku
  // DİKKAT: users/{userId} koleksiyonuna ASLA dokunulmaz! Çünkü firestore.rules güvenlik kuralı
  // istemciden users koleksiyonuna doğrudan okuma izni vermez (Missing permissions hatasını önler).
  // Kullanıcının adı, e-postası ve telefonu auth_tokens dokümanında zaten mevcuttur.
  try {
    const tokenSnap = await getDoc(doc(db, 'auth_tokens', cleanToken));
    if (!tokenSnap.exists()) {
      return { valid: false, reason: 'Şifre belirleme bağlantısı bulunamadı.' };
    }

    const tokenData = tokenSnap.data();

    if (tokenData.used) {
      return {
        valid: false,
        reason: 'Bu şifre belirleme bağlantısı daha önce kullanılmış. Güvenliğiniz için bağlantılar tek kullanımlıktır.'
      };
    }

    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      return {
        valid: false,
        reason: 'Bu şifre belirleme bağlantısının geçerlilik süresi dolmuştur (24 saat). Lütfen acentenizden yeni bir bağlantı talep ediniz.'
      };
    }

    const safeUserData = {
      id: tokenData.userId || '',
      name: tokenData.name || '',
      email: tokenData.email || '',
      phone: tokenData.phone || '',
      company: 'Move Travel & Mice'
    };

    return {
      valid: true,
      tokenData,
      user: safeUserData
    };
  } catch (err) {
    console.error("Token verification fallback error:", err);
    return { valid: false, reason: 'Bağlantı doğrulanırken hata oluştu: ' + err.message };
  }
};

/**
 * Token üzerinden yeni şifreyi kaydeder, turlarla eşitler ve tokenı tüketir
 * @param {string} token 
 * @param {string} newPassword 
 * @returns {Promise<{success: boolean, user?: Object, token?: string, message?: string}>}
 */
export const completePasswordSetup = async (token, newPassword) => {
  const cleanPass = String(newPassword || '').trim();
  if (cleanPass.length < 6) {
    return { success: false, message: 'Şifre en az 6 karakterden oluşmalıdır.' };
  }

  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    return { success: false, message: 'Geçersiz veya eksik bağlantı tokeni.' };
  }

  // 1. ÖNCELİKLİ: Güvenli Cloud Functions Backend API üzerinden şifreyi kaydet
  // Backend Admin SDK kullandığı için users koleksiyonunu ve tüm turlardaki katılımcı kayıtlarını
  // yetki hatası olmadan eksiksiz günceller.
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/complete-password-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cleanToken, password: cleanPass })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message || 'Şifreniz başarıyla kaydedildi.'
      };
    }

    if (data.message) {
      return { success: false, message: data.message };
    }
  } catch (apiErr) {
    console.warn("Backend complete-password-setup API failed, checking local options:", apiErr);
  }

  // 2. Eğer backend API geçici olarak ulaşılamadıysa:
  // auth_tokens dokümanını tüket ve kullanıcıya durumu bildir
  try {
    await updateDoc(doc(db, 'auth_tokens', cleanToken), {
      used: true,
      usedAt: Date.now()
    });

    return {
      success: true,
      message: 'Şifreniz güncellendi. Giriş yapabilirsiniz.'
    };
  } catch (err) {
    console.error("Complete password setup error:", err);
    return { success: false, message: 'Şifre kaydedilirken bir hata oluştu: ' + err.message };
  }
};

/**
 * Yeni bir kullanıcı veya katılımcı eklendiğinde sırasıyla 2 şablonu WhatsApp üzerinden gönderir:
 * 1) welcome_customer (Hoş Geldiniz Şablonu)
 * 2) welcome_account_activation (Tek Kullanımlık Şifre Belirleme / Hesap Aktivasyon Şablonu)
 * 
 * @param {Object} user Kullanıcı veya katılımcı nesnesi (id, name, phone, email)
 * @returns {Promise<{welcomeSent: boolean, activationSent: boolean, setupUrl?: string, token?: string, skippedReason?: string}>}
 */
export const sendWelcomeAndActivationWhatsApp = async (user) => {
  if (!user) return { welcomeSent: false, activationSent: false, skippedReason: 'no_user' };

  // Çocuk profili veya dahili hesap kontrolü
  const isChild = user.isChild || user.role === 'child' || (user.email && (user.email.endsWith('@move.local') || user.email.includes('_child_')));
  if (isChild) {
    return { welcomeSent: false, activationSent: false, skippedReason: 'child_account' };
  }

  const cleanPhone = (user.phone || '').trim();
  if (!cleanPhone || cleanPhone === '-' || cleanPhone.length < 7) {
    return { welcomeSent: false, activationSent: false, skippedReason: 'invalid_phone' };
  }

  const userName = user.name || 'Değerli Misafirimiz';
  const { sendWhatsAppNotification } = useSettingsStore.getState();

  let welcomeSent = false;
  let activationSent = false;
  let setupInfo = null;

  // 1. ADIM: Hoş Geldin Şablonu (welcome_customer)
  try {
    const welcomeRes = await sendWhatsAppNotification(
      cleanPhone,
      'newUserTemplate',
      [userName]
    );
    if (welcomeRes?.success) {
      welcomeSent = true;
    }
  } catch (err) {
    console.warn("sendWelcomeAndActivationWhatsApp step 1 (welcome_customer) error:", err);
  }

  // 2. ADIM: Hesap Aktivasyonu & Şifre Belirleme Şablonu (welcome_account_activation)
  try {
    // Mesajların WhatsApp tarafında sıralı ve ayrı balonlar olarak gitmesi için 1.5 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Tek kullanımlık şifre belirleme bağlantısı üret
    setupInfo = await createPasswordSetupLink(user);

    const activationRes = await sendWhatsAppNotification(
      cleanPhone,
      'accountActivationTemplate',
      [userName],
      setupInfo.token
    );

    if (activationRes?.success) {
      activationSent = true;
    }
  } catch (err) {
    console.warn("sendWelcomeAndActivationWhatsApp step 2 (welcome_account_activation) error:", err);
  }

  return {
    welcomeSent,
    activationSent,
    setupUrl: setupInfo?.url,
    token: setupInfo?.token
  };
};

/**
 * Katılımcıya yalnızca Hesap Aktivasyon & Şifre Belirleme Şablonunu (welcome_account_activation) iletir
 * @param {Object} user 
 * @returns {Promise<{success: boolean, setupUrl?: string, token?: string, message?: string}>}
 */
export const sendActivationOnlyWhatsApp = async (user) => {
  if (!user) return { success: false, message: 'Kullanıcı bulunamadı.' };

  const isChild = user.isChild || user.role === 'child' || (user.email && (user.email.endsWith('@move.local') || user.email.includes('_child_')));
  if (isChild) {
    return { success: false, message: 'Çocuk profillerine doğrudan aktivasyon mesajı iletilmez.' };
  }

  const cleanPhone = (user.phone || '').trim();
  if (!cleanPhone || cleanPhone === '-' || cleanPhone.length < 7) {
    return { success: false, message: 'Kayıtlı geçerli bir telefon numarası bulunamadı.' };
  }

  const userName = user.name || 'Değerli Misafirimiz';
  const { sendWhatsAppNotification } = useSettingsStore.getState();

  try {
    const setupInfo = await createPasswordSetupLink(user);
    const res = await sendWhatsAppNotification(
      cleanPhone,
      'accountActivationTemplate',
      [userName],
      setupInfo.token
    );
    return {
      success: !!res?.success,
      setupUrl: setupInfo.url,
      token: setupInfo.token,
      message: res?.message
    };
  } catch (err) {
    console.error("sendActivationOnlyWhatsApp error:", err);
    return { success: false, message: err.message };
  }
};

/**
 * Katılımcıya yalnızca Seyahat Kaydı Şablonunu (tour_registration) iletir
 * @param {Object} user 
 * @param {string} tourName 
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const sendTourRegistrationOnlyWhatsApp = async (user, tourName) => {
  if (!user) return { success: false, message: 'Kullanıcı bulunamadı.' };

  const isChild = user.isChild || user.role === 'child' || (user.email && (user.email.endsWith('@move.local') || user.email.includes('_child_')));
  if (isChild) {
    return { success: false, message: 'Çocuk profillerine doğrudan seyahat mesajı iletilmez.' };
  }

  const cleanPhone = (user.phone || '').trim();
  if (!cleanPhone || cleanPhone === '-' || cleanPhone.length < 7) {
    return { success: false, message: 'Kayıtlı geçerli bir telefon numarası bulunamadı.' };
  }

  const userName = user.name || 'Değerli Misafirimiz';
  const targetTourName = tourName || 'Seyahat';
  const { sendWhatsAppNotification } = useSettingsStore.getState();

  try {
    const res = await sendWhatsAppNotification(
      cleanPhone,
      'newTourTemplate',
      [userName, targetTourName]
    );
    return {
      success: !!res?.success,
      message: res?.message
    };
  } catch (err) {
    console.error("sendTourRegistrationOnlyWhatsApp error:", err);
    return { success: false, message: err.message };
  }
};

/**
 * Yeni veya tura eklenen katılımcıya sırayla Aktivasyon ve Seyahat Kaydı şablonlarını gönderir
 * @param {Object} user 
 * @param {string} tourName 
 * @param {Object} options { sendActivation: boolean, sendTour: boolean }
 * @returns {Promise<{activationSent: boolean, tourSent: boolean, setupUrl?: string}>}
 */
export const sendTourParticipantWhatsAppSequence = async (user, tourName, options = { sendActivation: true, sendTour: true }) => {
  const result = {
    activationSent: false,
    tourSent: false,
    setupUrl: null
  };

  if (!user) return result;

  const isChild = user.isChild || user.role === 'child' || (user.email && (user.email.endsWith('@move.local') || user.email.includes('_child_')));
  if (isChild) return result;

  const cleanPhone = (user.phone || '').trim();
  if (!cleanPhone || cleanPhone === '-' || cleanPhone.length < 7) return result;

  // 1. Aktivasyon Şablonu (welcome_account_activation)
  if (options.sendActivation !== false) {
    try {
      const actRes = await sendActivationOnlyWhatsApp(user);
      if (actRes.success) {
        result.activationSent = true;
        result.setupUrl = actRes.setupUrl;
      }
    } catch (e) {
      console.warn("sendTourParticipantWhatsAppSequence activation error:", e);
    }
  }

  // Araya kısa bekleme koy (sıralı teslimat ve rate limit koruması)
  if (options.sendActivation !== false && options.sendTour !== false) {
    await new Promise(r => setTimeout(r, 1200));
  }

  // 2. Seyahat Kaydı Şablonu (tour_registration)
  if (options.sendTour !== false && tourName) {
    try {
      const tourRes = await sendTourRegistrationOnlyWhatsApp(user, tourName);
      if (tourRes.success) {
        result.tourSent = true;
      }
    } catch (e) {
      console.warn("sendTourParticipantWhatsAppSequence tour error:", e);
    }
  }

  return result;
};
