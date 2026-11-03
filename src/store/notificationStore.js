import { create } from 'zustand';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
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
              snapshot.forEach(docSnap => {
                  const data = docSnap.data() || {};
                  fetched.push({ 
                      dbId: docSnap.id, 
                      ...data, 
                      readBy: Array.isArray(data.readBy) ? data.readBy : [],
                      deletedBy: Array.isArray(data.deletedBy) ? data.deletedBy : []
                  });
              });
              
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
  },

  deleteNotificationForUser: async (id, userId) => {
      const notif = get().notifications.find(n => n.id === id || n.dbId === id);
      if (!notif || !userId) return;
      const currentDeletedBy = Array.isArray(notif.deletedBy) ? notif.deletedBy : [];
      if (!currentDeletedBy.includes(userId)) {
          const updatedDeletedBy = [...currentDeletedBy, userId];
          const targetId = notif.dbId || notif.id;
          try {
              await updateDoc(doc(db, 'notifications', targetId), { deletedBy: updatedDeletedBy });
              set(state => ({
                  notifications: state.notifications.map(n => (n.id === id || n.dbId === id) ? { ...n, deletedBy: updatedDeletedBy } : n)
              }));
          } catch (e) {
              console.error("Bildirim silinemedi (kullanıcı):", e);
          }
      }
  },

  deleteNotificationCompletely: async (id) => {
      const notif = get().notifications.find(n => n.id === id || n.dbId === id);
      const targetId = notif?.dbId || id;
      try {
          await deleteDoc(doc(db, 'notifications', targetId));
          set(state => ({
              notifications: state.notifications.filter(n => n.id !== id && n.dbId !== id && n.id !== targetId && n.dbId !== targetId)
          }));
      } catch (e) {
          console.error("Bildirim tamamen silinemedi:", e);
      }
  }
}));
