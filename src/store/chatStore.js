import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useChatStore = create((set, get) => ({
  messages: [],
  mutedChats: [],
  isFirebaseInitialized: false,

  initFirestoreChats: async () => {
      if (get().isFirebaseInitialized) return;
      set({ isFirebaseInitialized: true });
      
      try {
          const messagesRef = collection(db, 'messages');
          
          onSnapshot(messagesRef, (snapshot) => {
              const fetchedMessages = [];
              snapshot.forEach(docSnap => {
                  fetchedMessages.push({ dbId: docSnap.id, ...docSnap.data() });
              });
              
              set({ messages: fetchedMessages.sort((a,b) => a.id - b.id) });
          });
      } catch (e) {
          console.error("Firebase chat dinleyicisi başlatılamadı:", e);
      }
  },
  
  addMessage: async (msg) => {
      const msgId = Date.now();
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
      const mySenderKey = myRole === 'expert' ? 'expert' : (myRole === 'admin' ? 'admin' : 'customer');
      
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
