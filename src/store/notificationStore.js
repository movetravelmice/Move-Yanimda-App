import { create } from 'zustand';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultNotifications = [
    {
       id: 'sys_1',
       type: 'system',
       title: '✈️ Biletleriniz Yüklendi',
       message: 'Avrupa Rüyası seyahatiniz için uçuş detayları ve biletleriniz sisteme tanımlanmıştır. Uçuş & Transfer sekmesinden detaylara hızlıca ulaşabilirsiniz.',
       tourId: 'tour_avrupa_ruyasi',
       date: new Date(Date.now() - 3600000).toISOString(),
       readBy: [],
       deletedBy: []
    }
];

export const useNotificationStore = create((set, get) => ({
  notifications: defaultNotifications,
  isFirebaseInitialized: false,

  initFirestoreNotifications: async () => {
      if (get().isFirebaseInitialized) return;
      set({ isFirebaseInitialized: true });
      
      try {
          const notificationsRef = collection(db, 'notifications');
          const snap = await getDocs(notificationsRef);
          
          if (snap.empty) {
              for (const n of defaultNotifications) {
                  await setDoc(doc(notificationsRef, n.id), n);
              }
          }
          
          onSnapshot(notificationsRef, (snapshot) => {
              const fetched = [];
              snapshot.forEach(docSnap => fetched.push({ dbId: docSnap.id, ...docSnap.data() }));
              
              set({ notifications: fetched.sort((a,b) => new Date(b.date) - new Date(a.date)) });
          });
      } catch (e) {
          console.error("Firebase bildirimleri başlatılamadı:", e);
      }
  },

  addNotification: async (notification) => {
      const id = Date.now().toString();
      const newNotif = { 
          id, 
          date: new Date().toISOString(), 
          readBy: [], 
          deletedBy: [],
          ...notification 
      };
      try { await setDoc(doc(db, 'notifications', id), newNotif); } catch (e) {}
  },
  
  markAsRead: async (id, userId) => {
      const notif = get().notifications.find(n => n.id === id);
      if (notif && !notif.readBy.includes(userId)) {
          const newReadBy = [...notif.readBy, userId];
          if (notif.dbId) {
              try { await updateDoc(doc(db, 'notifications', notif.dbId), { readBy: newReadBy }); } catch (e) {}
          }
      }
  },
  
  markAllAsRead: (userId) => {
      get().notifications.forEach(async (n) => {
          if (!n.readBy.includes(userId) && n.dbId) {
               try { await updateDoc(doc(db, 'notifications', n.dbId), { readBy: [...n.readBy, userId] }); } catch (e) {}
          }
      });
  },
  
  clearNotifications: (userId) => {
      get().notifications.forEach(async (n) => {
          const currentDeletedBy = n.deletedBy || [];
          if (!currentDeletedBy.includes(userId) && n.dbId) {
               try { await updateDoc(doc(db, 'notifications', n.dbId), { deletedBy: [...currentDeletedBy, userId] }); } catch (e) {}
          }
      });
  }
}));
