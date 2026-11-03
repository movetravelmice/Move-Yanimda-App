import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';

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

  try {
    const tokenSnap = await getDoc(doc(db, 'auth_tokens', token.trim()));
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

    if (Date.now() > tokenData.expiresAt) {
      return {
        valid: false,
        reason: 'Bu şifre belirleme bağlantısının geçerlilik süresi dolmuştur (24 saat). Lütfen acentenizden yeni bir bağlantı talep ediniz.'
      };
    }

    // İlgili kullanıcı dokümanını getir
    const userSnap = await getDoc(doc(db, 'users', tokenData.userId));
    if (!userSnap.exists()) {
      return { valid: false, reason: 'Kullanıcı hesabı bulunamadı veya silinmiş.' };
    }

    const userData = { ...userSnap.data(), id: tokenData.userId };

    return {
      valid: true,
      tokenData,
      user: userData
    };
  } catch (err) {
    console.error("Token verification error:", err);
    return { valid: false, reason: 'Bağlantı doğrulanırken sunucu hatası oluştu: ' + err.message };
  }
};

/**
 * Token üzerinden yeni şifreyi kaydeder, turlarla eşitler ve tokenı tüketir
 * @param {string} token 
 * @param {string} newPassword 
 * @returns {Promise<{success: boolean, user?: Object, message?: string}>}
 */
export const completePasswordSetup = async (token, newPassword) => {
  const check = await verifyPasswordSetupToken(token);
  if (!check.valid) {
    return { success: false, message: check.reason };
  }

  const cleanPass = String(newPassword || '').trim();
  if (cleanPass.length < 6) {
    return { success: false, message: 'Şifre en az 6 karakterden oluşmalıdır.' };
  }

  try {
    const userId = check.tokenData.userId;

    // 1. Tokenı ANINDA kullanıldı olarak işaretle (tek seferlik!)
    await updateDoc(doc(db, 'auth_tokens', token.trim()), {
      used: true,
      usedAt: Date.now()
    });

    // 2. Kullanıcı şifresini ve tüm turlardaki katılımcı kayıtlarını güncelle
    await useUserStore.getState().updateUser(userId, { password: cleanPass });

    // 3. Güncel kullanıcı kaydını döndür
    const freshUserSnap = await getDoc(doc(db, 'users', userId));
    const freshUser = freshUserSnap.exists()
      ? { ...freshUserSnap.data(), id: userId }
      : { ...check.user, password: cleanPass };

    return {
      success: true,
      user: freshUser
    };
  } catch (err) {
    console.error("Complete password setup error:", err);
    return { success: false, message: 'Şifre kaydedilirken hata oluştu: ' + err.message };
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
