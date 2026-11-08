import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from './settingsStore';
import { useUserStore } from './userStore';
import { normalizeEmail, normalizeTurkish } from '../utils/userUtils';
import { getApiBaseUrl } from '../utils/apiConfig';
import { getAppDeviceInfo } from '../utils/deviceUtils';

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

const LOGIN_GUARD_KEY = 'travel_login_guard_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes

const getLoginGuardState = () => {
  try {
    const raw = localStorage.getItem(LOGIN_GUARD_KEY);
    if (!raw) return { count: 0, lockUntil: 0 };
    const parsed = JSON.parse(raw);
    return {
      count: Number(parsed.count) || 0,
      lockUntil: Number(parsed.lockUntil) || 0
    };
  } catch (e) {
    return { count: 0, lockUntil: 0 };
  }
};

const recordFailedLoginAttempt = () => {
  try {
    const current = getLoginGuardState();
    const now = Date.now();
    const baseCount = current.lockUntil && now >= current.lockUntil ? 0 : current.count;
    const nextCount = baseCount + 1;
    const lockUntil = nextCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;
    localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify({ count: nextCount, lockUntil }));
    return { count: nextCount, lockUntil };
  } catch (e) {
    return { count: 1, lockUntil: 0 };
  }
};

const resetLoginGuard = () => {
  try {
    localStorage.removeItem(LOGIN_GUARD_KEY);
  } catch (e) {
    // Ignore storage errors
  }
};

const stripSensitiveAuthFields = (userObj) => {
  if (!userObj || typeof userObj !== 'object') return userObj;
  const { password: _removedPassword, ...safeUser } = userObj;
  return safeUser;
};

export const useAuthStore = create(persist((set, get) => ({
  user: null, 
  token: null,
  activeMode: null, // 'corporate' | 'individual'
  activeStaffRole: null, // 'admin' | 'expert' | 'ticketing'
  setActiveMode: (mode) => set({ activeMode: mode }),
  setActiveStaffRole: (role) => set({ activeStaffRole: role }),
  syncUserRecord: (freshData) => set(state => ({
    user: state.user ? stripSensitiveAuthFields({ ...state.user, ...freshData }) : state.user
  })),
  getActiveMode: () => {
    const state = get();
    if (state.activeMode) return state.activeMode;
    return 'corporate';
  },
  refreshTokenIfNeeded: async () => {
    const state = get();
    if (!state.user) return;
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/refresh-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id, email: state.user.email })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          set({ token: data.token, user: stripSensitiveAuthFields(data.user) });
        }
      }
    } catch (e) {
      console.warn("Session refresh error:", e);
    }
  },
  login: async (identifier, password) => {
      const cleanInput = (identifier || '').trim();
      const cleanEmail = normalizeEmail(cleanInput);
      const cleanPassword = (password || '').trim();

      // Brute-force / parola kırma koruması kontrolü
      const guard = getLoginGuardState();
      const now = Date.now();
      if (guard.lockUntil && now < guard.lockUntil) {
          const remainingSec = Math.ceil((guard.lockUntil - now) / 1000);
          return {
              success: false,
              message: `Çok fazla hatalı giriş denemesi yaptınız. Güvenliğiniz için lütfen ${remainingSec} saniye sonra tekrar deneyin.`
          };
      }

      if (!cleanInput || !cleanPassword) {
          return { success: false, message: 'Lütfen e-posta / telefon ve şifrenizi girin.' };
      }

      if (cleanEmail.endsWith('@base44.com')) {
          return { success: false, message: 'Bu demo hesabı kalıcı olarak kaldırılmıştır.' };
      }

      try {
          const deviceInfo = getAppDeviceInfo();
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/api/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  identifier: cleanInput, 
                  password: cleanPassword,
                  platform: deviceInfo.platform,
                  isNative: deviceInfo.isNative,
                  userAgent: deviceInfo.userAgent,
                  appVersion: deviceInfo.appVersion
              })
          });
          const data = await res.json();

          if (!res.ok || !data.success) {
              const nextGuard = recordFailedLoginAttempt();
              if (nextGuard.lockUntil > Date.now()) {
                  return {
                      success: false,
                      message: 'Çok fazla hatalı parola denemesi yaptınız. Hesabınız geçici olarak 3 dakika korumaya alındı.'
                  };
              }
              return { success: false, message: data.message || 'Hatalı e-posta, telefon veya şifre girdiniz.' };
          }

          // Başarılı girişte brute-force sayacını sıfırla
          resetLoginGuard();

          const userRecord = data.user;
          const token = data.token;

          if (userRecord.role === 'expert') {
              useSettingsStore.getState().setExpertName(userRecord.name);
          }

          const normalizedUser = stripSensitiveAuthFields({
              ...userRecord,
              userType: 'corporate'
          });
          const isAdmin = userRecord.role === 'admin' || userRecord.secondaryRole === 'admin';
          const initialStaffRole = isAdmin ? 'admin' : (userRecord.role || 'customer');

          set({ user: normalizedUser, token: token, activeMode: 'corporate', activeStaffRole: initialStaffRole });

          // Giriş sonrası güvenli kullanıcı listesini başlat
          useUserStore.getState().initFirestoreUsers();

          return { success: true };
      } catch (err) {
          console.error("Giriş esnasında sunucu iletişim hatası:", err);
          return { success: false, message: 'Giriş yapılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.' };
      }
  },
  logout: () => set({ user: null, token: null, activeMode: null, activeStaffRole: null }),
  updateProfile: (data) => set(state => {
      if (!state.user) return state;
      const updatedUser = stripSensitiveAuthFields({ ...state.user, ...data });
      if (updatedUser.role === 'expert' && data.name) {
          useSettingsStore.getState().setExpertName(data.name);
      }
      const userStoreInstance = useUserStore.getState();
      const targetId = updatedUser.id || userStoreInstance.findUserByEmail(updatedUser.email)?.id;
      userStoreInstance.updateUser(targetId, { ...data, email: updatedUser.email, name: updatedUser.name }).catch(console.error);
      
      return { user: updatedUser };
  }),
  recordAppActivity: async () => {
    const state = get();
    if (!state.user) return;
    const userId = state.user.id;
    const email = state.user.email;
    const pingKey = `app_active_ping_${userId || email}`;

    try {
      const lastPing = sessionStorage.getItem(pingKey);
      if (lastPing && Date.now() - Number(lastPing) < 10 * 60 * 1000) {
        return; // Son 10 dakika içinde ping gönderildi
      }
    } catch (e) {}

    try {
      const deviceInfo = getAppDeviceInfo();
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/record-app-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          platform: deviceInfo.platform,
          isNative: deviceInfo.isNative,
          userAgent: deviceInfo.userAgent,
          appVersion: deviceInfo.appVersion
        })
      });

      if (res.ok) {
        try {
          sessionStorage.setItem(pingKey, String(Date.now()));
        } catch (e) {}
        const data = await res.json();
        if (data.success && data.updates) {
          set(s => ({
            user: s.user ? stripSensitiveAuthFields({ ...s.user, ...data.updates }) : s.user
          }));
        }
      }
    } catch (err) {
      console.warn("App activity ping error:", err);
    }
  },
}), { name: 'travel-auth-storage-v4' }));
