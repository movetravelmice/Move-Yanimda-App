import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from './settingsStore';
import { useUserStore } from './userStore';

export const useAuthStore = create(persist((set) => ({
  user: null, 
  login: (email, password) => {

      // Login'i global veritabanından çek.
      const userRecord = useUserStore.getState().findUserByEmail(email);
      
      if (!userRecord) {
          return { success: false, message: 'Sistemde kayıtlı böyle bir e-posta adresi bulunamadı.' };
      }

      if (userRecord.status === 'Pasif') {
          return { success: false, message: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' };
      }

      // Parola Doğrulaması
      if (userRecord.password !== password) {
          return { success: false, message: 'Hatalı Parola girdiniz.' };
      }

      // Uzman login olduğunda, isim senkronizasyonu
      if (userRecord.role === 'expert') {
          useSettingsStore.getState().setExpertName(userRecord.name);
      }
      
      set({ user: userRecord });
      return { success: true };
  },
  logout: () => set({ user: null }),
  updateProfile: (data) => set(state => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...data };
      if (updatedUser.role === 'expert' && data.name) {
          useSettingsStore.getState().setExpertName(data.name);
      }
      // Ayrıca ana veritabanını da güncelle (Böylece Kullanıcılar ekranı bozulmaz)
      const userStoreInstance = useUserStore.getState();
      userStoreInstance.updateUser(updatedUser.id, data).catch(console.error);
      
      useUserStore.setState({
          users: userStoreInstance.users.map(u => u.email === updatedUser.email ? { ...u, ...data } : u)
      });
      return { user: updatedUser };
  }),
}), { name: 'travel-auth-storage-v4' }));
