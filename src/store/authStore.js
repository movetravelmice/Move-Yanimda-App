import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from './settingsStore';
import { useUserStore } from './userStore';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const isUserAdmin = (u) => Boolean(u && (u.role === 'admin' || u.secondaryRole === 'admin'));
export const getUserSecondaryRole = (u) => {
  if (!u) return null;
  if (u.role === 'admin') return (u.secondaryRole === 'expert' || u.secondaryRole === 'ticketing') ? u.secondaryRole : null;
  if (u.secondaryRole === 'admin') return (u.role === 'expert' || u.role === 'ticketing') ? u.role : null;
  return null;
};
export const hasDualRole = (u) => Boolean(isUserAdmin(u) && getUserSecondaryRole(u));

export const useAuthStore = create(persist((set, get) => ({
  user: null, 
  activeMode: null, // 'corporate' | 'individual'
  activeStaffRole: null, // 'admin' | 'expert' | 'ticketing'
  setActiveMode: (mode) => set({ activeMode: mode }),
  setActiveStaffRole: (role) => set({ activeStaffRole: role }),
  syncUserRecord: (freshData) => set(state => ({ user: state.user ? { ...state.user, ...freshData } : state.user })),
  getActiveMode: () => {
    const state = get();
    if (state.activeMode) return state.activeMode;
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

      if (cleanEmail.endsWith('@base44.com')) {
          return { success: false, message: 'Bu demo hesabı kalıcı olarak kaldırılmıştır.' };
      }

      const matchCandidate = (u) => {
          if (!u) return false;
          const uEmail = (u.email || '').trim().toLowerCase();
          if (uEmail && uEmail === cleanEmail) return true;
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

      // 1. RAM'deki (Zustand) kullanıcılar arasında şifresi eşleşen kullanıcıyı bul
      const memoryUsers = useUserStore.getState().users || [];
      const memoryCandidates = memoryUsers.filter(matchCandidate);
      let userRecord = memoryCandidates.find(u => (u.password || '').trim() === cleanPassword);

      // 2. Eğer yerel hafızada şifreyle eşleşen bulunamadıysa, Firestore'dan doğrudan çek
      if (!userRecord) {
          try {
              const usersRef = collection(db, 'users');
              const allSnap = await getDocs(usersRef);
              const firestoreCandidates = [];
              allSnap.forEach(docSnap => {
                  const d = { id: docSnap.id, ...docSnap.data() };
                  if (matchCandidate(d)) {
                      firestoreCandidates.push(d);
                  }
              });

              userRecord = firestoreCandidates.find(u => (u.password || '').trim() === cleanPassword);

              // Eğer aday hesaplar varsa ama şifre uyuşmadıysa hatalı parola dön
              if (!userRecord && (memoryCandidates.length > 0 || firestoreCandidates.length > 0)) {
                  return { success: false, message: 'Hatalı Parola girdiniz.' };
              }

              // Bulunan kullanıcıyı yerel state'e ekle
              if (userRecord) {
                  const currentUsers = useUserStore.getState().users;
                  if (!currentUsers.some(u => u.id === userRecord.id)) {
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

      if (!userRecord) {
          return { success: false, message: 'Sistemde kayıtlı kullanıcı hesabı bulunamadı.' };
      }

      if (userRecord.status === 'Pasif') {
          return { success: false, message: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' };
      }

      // Parola Doğrulaması (Çift Güvenlik Kontrolü)
      const recordPassword = (userRecord.password || '').trim();
      if (recordPassword !== cleanPassword) {
          return { success: false, message: 'Hatalı Parola girdiniz.' };
      }

      // Uzman login olduğunda, isim senkronizasyonu
      if (userRecord.role === 'expert') {
          useSettingsStore.getState().setExpertName(userRecord.name);
      }
      
      const normalizedUser = {
          ...userRecord,
          userType: 'corporate'
      };
      const isAdmin = userRecord.role === 'admin' || userRecord.secondaryRole === 'admin';
      const initialStaffRole = isAdmin ? 'admin' : (userRecord.role || 'customer');
      set({ user: normalizedUser, activeMode: 'corporate', activeStaffRole: initialStaffRole });
      return { success: true };
  },
  logout: () => set({ user: null, activeMode: null, activeStaffRole: null }),
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
