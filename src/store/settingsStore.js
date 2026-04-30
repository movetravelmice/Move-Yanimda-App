import { create } from 'zustand';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  expertStatus: 'offline',
  googlePlacesApiKey: 'AIzaSyDLKVedSDIIzh5fbRpUta9oShiW2omr7O4'
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
  setExpertStatus: (status) => get().updateSetting('expertStatus', status),
  setGooglePlacesApiKey: (key) => get().updateSetting('googlePlacesApiKey', key)
}));
