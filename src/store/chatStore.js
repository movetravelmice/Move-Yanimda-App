import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCurrentSessionUser, isStaffSessionUser } from '../utils/userUtils';

export const useChatStore = create((set, get) => ({
  messages: [],
  mutedChats: [],
  isFirebaseInitialized: false,
  _unsubscribe: null,
  _activeSessionKey: null,

  resetChats: () => {
      const unsub = get()._unsubscribe;
      if (typeof unsub === 'function') {
          try { unsub(); } catch (e) {}
      }
      set({ messages: [], isFirebaseInitialized: false, _unsubscribe: null, _activeSessionKey: null });
  },

  initFirestoreChats: async (forceRestart = false) => {
      const sessionUser = getCurrentSessionUser();
      if (!sessionUser) {
          get().resetChats();
          return;
      }
      const sessionKey = `${sessionUser.id || ''}_${sessionUser.role || 'customer'}`;
      if (!forceRestart && get().isFirebaseInitialized && get()._activeSessionKey === sessionKey) return;

      const prevUnsub = get()._unsubscribe;
      if (typeof prevUnsub === 'function') {
          try { prevUnsub(); } catch (e) {}
      }

      set({ isFirebaseInitialized: true, _activeSessionKey: sessionKey });
      
      try {
          const messagesRef = collection(db, 'messages');
          
          const unsub = onSnapshot(messagesRef, (snapshot) => {
              const currentSession = getCurrentSessionUser();
              if (!currentSession) {
                  set({ messages: [] });
                  return;
              }
              const isStaff = isStaffSessionUser(currentSession);
              const myId = String(currentSession.id || '');
              const myEmail = String(currentSession.email || '').trim().toLowerCase();

              const fetchedMessages = [];
              snapshot.forEach(docSnap => {
                  const data = docSnap.data() || {};
                  const cid = String(data.chatId || '');

                  // Müşteri oturumlarında başka müşterilerin 1:1 özel (admin veya expert) mesajlarını belleğe alma
                  if (!isStaff) {
                      if (cid.startsWith('admin_')) {
                          const targetKey = cid.slice('admin_'.length).toLowerCase();
                          if (targetKey !== myId.toLowerCase() && (!myEmail || targetKey !== myEmail)) {
                              return;
                          }
                      } else if (cid.includes('_expert_') || cid.includes('_expert2_')) {
                          const parts = cid.split(/_expert2?_/);
                          const targetKey = (parts[1] || '').toLowerCase();
                          if (targetKey !== myId.toLowerCase() && (!myEmail || targetKey !== myEmail)) {
                              return;
                          }
                      }
                  }

                  fetchedMessages.push({ dbId: docSnap.id, ...data });
              });
              
              set({ messages: fetchedMessages.sort((a,b) => a.id - b.id) });
          });
          set({ _unsubscribe: unsub });
      } catch (e) {
          console.error("Firebase chat dinleyicisi başlatılamadı:", e);
      }
  },
  
  addMessage: async (msg) => {
      const msgId = msg.id || Date.now();
      const newMsg = { ...msg, id: msgId };
      try { await setDoc(doc(db, 'messages', String(msgId)), newMsg); } catch (e) {}
  },
  
  updateMessageStatus: async (id, status) => {
      const msg = get().messages.find(m => m.id === id);
      if(msg && msg.dbId) {
          try { await updateDoc(doc(db, 'messages', msg.dbId), { status }); } catch (e) {}
      }
  },

  markRoomAsRead: (chatId, myRole) => {
      const mySenderKey = myRole === 'expert' ? 'expert' : (myRole === 'admin' ? 'admin' : (myRole === 'ticketing' ? 'ticketing' : 'customer'));
      
      get().messages.forEach(async (m) => {
          if (m.chatId === chatId && m.status !== 'read' && m.sender !== mySenderKey) {
              if (m.dbId) {
                  try { await updateDoc(doc(db, 'messages', m.dbId), { status: 'read' }); } catch (e) {}
              }
          }
      });
  },

  toggleMute: (chatId) => set(state => ({
      mutedChats: state.mutedChats.includes(chatId) 
          ? state.mutedChats.filter(id => id !== chatId) 
          : [...state.mutedChats, chatId]
  })),

  clearMessages: (chatId) => {
      get().messages.forEach(async (m) => {
          if (m.chatId === chatId && m.dbId) {
              try { await deleteDoc(doc(db, 'messages', m.dbId)); } catch (e) {}
          }
      });
  }
}));
