import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from './settingsStore';
import { useUserStore } from './userStore';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useAuthStore = create(persist((set, get) => ({
  user: null, 
  activeMode: null, // 'corporate' | 'individual'
  setActiveMode: (mode) => set({ activeMode: mode }),
  getActiveMode: () => {
    const state = get();
    if (state.activeMode) return state.activeMode;
    if (!state.user) return 'individual';
    if (state.user.userType === 'individual' || state.user.role === 'customer') return 'individual';
    return 'corporate';
  },
  login: async (identifier, password) => {
      const cleanInput = (identifier || '').trim();
      const cleanEmail = cleanInput.toLowerCase();
      const cleanPassword = (password || '').trim();
      const cleanDigits = cleanInput.replace(/\D/g, '');

      if (!cleanInput || !cleanPassword) {
          return { success: false, message: 'Lütfen e-posta / telefon ve şifrenizi girin.' };
      }

      // 1. Login'i öncelikle RAM'deki (Zustand) kullanıcı listesinde ara
      let userRecord = useUserStore.getState().findUserByEmail(cleanInput);
      
      // 2. Eğer yerel hafızada bulunamadıysa (mobil açılış gecikmesi), doğrudan Firestore'dan çek
      if (!userRecord) {
          try {
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('email', '==', cleanEmail));
              const snap = await getDocs(q);
              
              if (!snap.empty) {
                  userRecord = { id: snap.docs[0].id, ...snap.docs[0].data() };
              } else {
                  // E-posta büyük/küçük harf veya telefon uyumsuzluğuna karşı tüm listeyi tara (Fallback)
                  const allSnap = await getDocs(usersRef);
                  allSnap.forEach(docSnap => {
                      const d = docSnap.data();
                      if (d.email && d.email.trim().toLowerCase() === cleanEmail) {
                          userRecord = { id: docSnap.id, ...d };
                      } else if (cleanDigits.length >= 10) {
                          const uPhone = (d.phone || '').replace(/\D/g, '');
                          const uEmail = (d.email || '').replace(/\D/g, '');
                          if (uPhone && (uPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(uPhone.slice(-10)))) {
                              userRecord = { id: docSnap.id, ...d };
                          } else if (uEmail && uEmail.includes(cleanDigits.slice(-10))) {
                              userRecord = { id: docSnap.id, ...d };
                          }
                      }
                  });
              }

              // Bulunan kullanıcıyı yerel state'e de ekle
              if (userRecord) {
                  const currentUsers = useUserStore.getState().users;
                  if (!currentUsers.some(u => u.id === userRecord.id || (u.email && u.email.toLowerCase() === cleanEmail))) {
                      useUserStore.setState({ users: [userRecord, ...currentUsers] });
                  }
              }
          } catch (err) {
              console.error("Giriş esnasında Firestore kullanıcı sorgulama hatası:", err);
              if (err?.code === 'permission-denied') {
                  return { success: false, message: 'Firebase izin hatası (Permission Denied). Lütfen Firestore kurallarınızı kontrol edin.' };
              }
          }
      }
      
      if (cleanEmail.endsWith('@base44.com')) {
          return { success: false, message: 'Bu demo hesabı kalıcı olarak kaldırılmıştır.' };
      }

      if (!userRecord) {
          return { success: false, message: 'Sistemde kayıtlı kullanıcı hesabı bulunamadı.' };
      }

      if (userRecord.status === 'Pasif') {
          return { success: false, message: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' };
      }

      // Parola Doğrulaması
      const recordPassword = (userRecord.password || '').trim();
      if (recordPassword !== cleanPassword) {
          return { success: false, message: 'Hatalı Parola girdiniz.' };
      }

      // Uzman login olduğunda, isim senkronizasyonu
      if (userRecord.role === 'expert') {
          useSettingsStore.getState().setExpertName(userRecord.name);
      }
      
      const defaultMode = (userRecord.userType === 'individual' || userRecord.role === 'customer') ? 'individual' : 'corporate';
      set({ user: userRecord, activeMode: defaultMode });
      return { success: true };
  },
  logout: () => set({ user: null, activeMode: null }),
  updateProfile: (data) => set(state => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...data };
      if (updatedUser.role === 'expert' && data.name) {
          useSettingsStore.getState().setExpertName(data.name);
      }
      // Ayrıca ana veritabanını da güncelle (Böylece Kullanıcılar ekranı ve Firestore eşitlenir)
      const userStoreInstance = useUserStore.getState();
      const targetId = updatedUser.id || userStoreInstance.findUserByEmail(updatedUser.email)?.id;
      userStoreInstance.updateUser(targetId, { ...data, email: updatedUser.email, name: updatedUser.name }).catch(console.error);
      
      return { user: updatedUser };
  }),
}), { name: 'travel-auth-storage-v4' }));
