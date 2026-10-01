import { create } from 'zustand';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const DEFAULT_POPULAR_ROUTES = [
  {
    id: 'roma',
    city: 'Roma',
    country: 'İtalya',
    flag: '🇮🇹',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
    currency: 'EUR',
    time: '-1 Saat',
    flight: '2.5 Saat',
    plug: 'Tip C/F',
    isActive: true,
    order: 1
  },
  {
    id: 'londra',
    city: 'Londra',
    country: 'İngiltere',
    flag: '🇬🇧',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
    currency: 'GBP',
    time: '-2 Saat',
    flight: '4 Saat',
    plug: 'Tip G (Adaptör)',
    isActive: true,
    order: 2
  },
  {
    id: 'paris',
    city: 'Paris',
    country: 'Fransa',
    flag: '🇫🇷',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    currency: 'EUR',
    time: '-1 Saat',
    flight: '3.5 Saat',
    plug: 'Tip C/E',
    isActive: true,
    order: 3
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'BAE',
    flag: '🇦🇪',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
    currency: 'AED',
    time: '+1 Saat',
    flight: '4.5 Saat',
    plug: 'Tip G',
    isActive: true,
    order: 4
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japonya',
    flag: '🇯🇵',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    currency: 'JPY',
    time: '+6 Saat',
    flight: '11 Saat',
    plug: 'Tip A/B (100V)',
    isActive: true,
    order: 5
  },
  {
    id: 'barselona',
    city: 'Barselona',
    country: 'İspanya',
    flag: '🇪🇸',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800',
    currency: 'EUR',
    time: '-1 Saat',
    flight: '3.5 Saat',
    plug: 'Tip C/F',
    isActive: true,
    order: 6
  },
  {
    id: 'amsterdam',
    city: 'Amsterdam',
    country: 'Hollanda',
    flag: '🇳🇱',
    image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&q=80&w=800',
    currency: 'EUR',
    time: '-1 Saat',
    flight: '3.5 Saat',
    plug: 'Tip C/F',
    isActive: false,
    order: 7
  },
  {
    id: 'new-york',
    city: 'New York',
    country: 'ABD',
    flag: '🇺🇸',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800',
    currency: 'USD',
    time: '-7 Saat',
    flight: '10.5 Saat',
    plug: 'Tip A/B (110V)',
    isActive: false,
    order: 8
  }
];

const defaultSettings = {
  expertName: "Ayşe Yılmaz",
  systemAnnouncementAvatar: "https://images.unsplash.com/photo-1614064641913-6b7ae81395b6?auto=format&fit=crop&q=80&w=150", 
  expertProfileAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
  tourGroupAvatar: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&q=80&w=150",
  customerAvatar: null,
  corporateName: 'Move Yanımda',
  corporateLogo: null,
  smtpConfig: { host: 'smtp.gmail.com', port: '465', user: '', pass: '' },
  isSmtpVerified: false,
  netgsmConfig: { usercode: '', password: '', header: '' },
  whatsappConfig: {
    phoneId: '',
    accessToken: '',
    wabaId: '',
    isEnabled: false,
    newUserTemplate: 'welcome_customer',
    newTourTemplate: 'tour_registration',
    passwordResetTemplate: 'password_reset_otp',
    ticketAddedTemplate: 'ticket_pdf_ready',
    checkInTemplate: 'checkin_reminder',
    tourReviewTemplate: 'tour_review_reminder'
  },
  expertStatus: 'offline',
  googlePlacesApiKey: 'AIzaSyDLKVedSDIIzh5fbRpUta9oShiW2omr7O4',
  akbankApiKey: '',
  geminiConfig: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-3-flash-preview',
    isEnabled: true,
    systemPrompt: `Sen Move Travel & MICE şirketinin akıllı seyahat asistanı Tintin'sin.
Görevin misafirlerimize seyahatleri boyunca uçuşları, otelleri, transferleri, günlük tur programları, hava durumu, yerel lezzetler ve gezilecek yerler hakkında profesyonel, doğru ve net rehberlik yapmaktır.
Misafirin seyahat bilgilerine (uçuş, otel, tur programı, rehber vb.) sahipsin. Sorulan sorulara elindeki bu gerçek seyahat bilgilerini kullanarak yanıt ver.
KURALLAR:
- ASLA bayrak emojisi veya ülke kodu (us, me, tr vb.) kullanma.
- Emoji kullanımını minimumda tut veya hiç kullanma. Sade, temiz, kurumsal ve ferah bir dil kullan.
- Cevapların okunaklı ve profesyonel olsun.`,
    maxTokens: 4096,
    temperature: 0.7,
    dailyLimit: 50
  },
  popularRoutes: DEFAULT_POPULAR_ROUTES
};

const defaultTemplateNames = {
    newUserTemplate: 'welcome_customer',
    newTourTemplate: 'tour_registration',
    passwordResetTemplate: 'password_reset_otp',
    ticketAddedTemplate: 'ticket_pdf_ready',
    checkInTemplate: 'checkin_reminder',
    tourReviewTemplate: 'tour_review_reminder'
};

const normalizePhoneForWhatsApp = (rawPhone) => {
    if (!rawPhone || rawPhone === '-') return '';
    let cleaned = String(rawPhone).replace(/\D/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.slice(2);
    }
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '9' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('5')) {
        cleaned = '90' + cleaned;
    }
    return cleaned;
};

export const useSettingsStore = create((set, get) => ({
  ...defaultSettings,
  isFirebaseInitialized: false,

  initFirestoreSettings: async () => {
      if (get().isFirebaseInitialized) return;
      set({ isFirebaseInitialized: true });
      
      try {
          const docRef = doc(db, 'settings', 'global');
          const snap = await getDoc(docRef);
          
          if (!snap.exists()) {
              await setDoc(docRef, defaultSettings);
          }
          
          onSnapshot(docRef, (docSnap) => {
              if (docSnap.exists()) {
                  set({ ...docSnap.data() });
              }
          });
      } catch (e) {
          console.error("Firebase settings dinleyicisi başlatılamadı:", e);
      }
  },

  updateSetting: async (key, val) => {
      try { await updateDoc(doc(db, 'settings', 'global'), { [key]: val }); } catch (e) {}
  },

  setExpertName: (name) => get().updateSetting('expertName', name),
  setSystemAnnouncementAvatar: (url) => get().updateSetting('systemAnnouncementAvatar', url),
  setExpertProfileAvatar: (url) => get().updateSetting('expertProfileAvatar', url),
  setTourGroupAvatar: (url) => get().updateSetting('tourGroupAvatar', url),
  setCustomerAvatar: (url) => get().updateSetting('customerAvatar', url),
  setCorporateName: (name) => get().updateSetting('corporateName', name),
  setCorporateLogo: (base64) => get().updateSetting('corporateLogo', base64),
  setSmtpConfig: (config) => {
      const newConfig = { ...get().smtpConfig, ...config };
      get().updateSetting('smtpConfig', newConfig);
      get().updateSetting('isSmtpVerified', false);
  },
  setSmtpVerified: (status) => get().updateSetting('isSmtpVerified', status),
  setNetgsmConfig: (config) => {
      const newConfig = { ...get().netgsmConfig, ...config };
      get().updateSetting('netgsmConfig', newConfig);
  },
  setWhatsappConfig: (config) => {
      const newConfig = { ...get().whatsappConfig, ...config };
      get().updateSetting('whatsappConfig', newConfig);
  },
  sendWhatsAppNotification: async (to, templateKey, parameters) => {
      const config = get().whatsappConfig;
      if (!config || !config.isEnabled || !config.phoneId || !config.accessToken) {
          console.log("WhatsApp notifications disabled or unconfigured.");
          return { success: false, message: 'WhatsApp bildirimleri kapalı veya yapılandırılmamış.' };
      }

      const normalizedPhone = normalizePhoneForWhatsApp(to);
      if (!normalizedPhone || normalizedPhone.length < 9) {
          console.warn(`Geçersiz WhatsApp telefon numarası: '${to}'`);
          return { success: false, message: `Geçersiz telefon numarası: ${to}` };
      }

      const templateName = config[templateKey] || defaultTemplateNames[templateKey] || templateKey;
      if (!templateName) {
          console.warn(`Template name for ${templateKey} is not configured.`);
          return { success: false, message: `Şablon ismi (${templateKey}) yapılandırılmamış.` };
      }

      try {
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const baseUrl = isDev ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
          const res = await fetch(`${baseUrl}/api/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  phoneId: config.phoneId,
                  accessToken: config.accessToken,
                  to: normalizedPhone,
                  templateName: templateName,
                  languageCode: 'tr',
                  parameters: parameters
              })
          });
          const data = await res.json();
          return { success: res.ok, message: data.message };
      } catch(e) {
          console.error("WhatsApp notification error:", e);
          return { success: false, message: e.message };
      }
  },
  setExpertStatus: (status) => get().updateSetting('expertStatus', status),
  setGooglePlacesApiKey: (key) => get().updateSetting('googlePlacesApiKey', key),
  setAkbankApiKey: (key) => get().updateSetting('akbankApiKey', key),
  setGeminiConfig: (config) => {
    const current = get().geminiConfig || defaultSettings.geminiConfig;
    const newConfig = { ...current, ...config };
    get().updateSetting('geminiConfig', newConfig);
  },
  setPopularRoutes: (routes) => get().updateSetting('popularRoutes', routes)
}));
