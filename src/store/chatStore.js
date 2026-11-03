import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { findMatchingParticipant, getCurrentSessionUser, isStaffSessionUser } from '../utils/userUtils';
import { useTourStore } from './tourStore';

export const useChatStore = create((set, get) => ({
  messages: [],
  mutedChats: [],
  isFirebaseInitialized: false,
  _unsubscribe: null,
  _unsubscribeTourSync: null,
  _activeSessionKey: null,

  resetChats: () => {
      const unsub = get()._unsubscribe;
      if (typeof unsub === 'function') {
          try { unsub(); } catch (e) {}
      }
      const unsubTour = get()._unsubscribeTourSync;
      if (typeof unsubTour === 'function') {
          try { unsubTour(); } catch (e) {}
      }
      set({ messages: [], isFirebaseInitialized: false, _unsubscribe: null, _unsubscribeTourSync: null, _activeSessionKey: null });
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
      const prevTourUnsub = get()._unsubscribeTourSync;
      if (typeof prevTourUnsub === 'function') {
          try { prevTourUnsub(); } catch (e) {}
      }

      set({ isFirebaseInitialized: true, _activeSessionKey: sessionKey });
      
      try {
          const messagesRef = collection(db, 'messages');
          let latestRawDocs = [];

          const filterAndApplyMessages = () => {
              const currentSession = getCurrentSessionUser();
              if (!currentSession) {
                  set({ messages: [] });
                  return;
              }
              const isStaff = isStaffSessionUser(currentSession);
              const myId = String(currentSession.id || '').trim().toLowerCase();
              const myEmail = String(currentSession.email || '').trim().toLowerCase();

              // Kullanıcının katılımcısı olduğu turları ve o turlardaki katılımcı ID'lerini belirle
              const allowedTourIds = new Set();
              const allowedParticipantIds = new Set();
              if (myId) allowedParticipantIds.add(myId);
              if (myEmail) allowedParticipantIds.add(myEmail);

              if (!isStaff) {
                  const currentTours = useTourStore.getState().tours || [];
                  currentTours.forEach(t => {
                      if (t.id) {
                          const sId = String(t.id);
                          allowedTourIds.add(sId);
                          allowedTourIds.add(sId.replace(/^tour_/, ''));
                          allowedTourIds.add(`tour_${sId.replace(/^tour_/, '')}`);
                      }
                      const matchedP = findMatchingParticipant(t.participants, currentSession);
                      if (matchedP) {
                          if (matchedP.id) allowedParticipantIds.add(String(matchedP.id).trim().toLowerCase());
                          if (matchedP.email) allowedParticipantIds.add(String(matchedP.email).trim().toLowerCase());
                      }
                  });
              }

              const fetchedMessages = [];
              latestRawDocs.forEach(docItem => {
                  const data = docItem.data || {};
                  const cid = String(data.chatId || '');

                  // Müşteri oturumlarında sıkı veri izolasyonu:
                  // Yalnızca genel duyuru, kendi turunun grup sohbeti ve kendisine ait 1:1 uzman sohbetlerini belleğe al
                  if (!isStaff) {
                      if (cid === 'announcement' || cid === 'expert_direct') {
                          // Genel duyurular ve demo sohbeti herkese açık
                      } else if (cid.startsWith('tour_') || cid.startsWith('group_')) {
                          const rawTourId = cid.replace(/^(tour_|group_)/, '');
                          const isAllowedTour = allowedTourIds.has(cid) || 
                                                allowedTourIds.has(rawTourId) || 
                                                allowedTourIds.has(`tour_${rawTourId}`) || 
                                                allowedTourIds.has(`group_${rawTourId}`);
                          if (!isAllowedTour) {
                              return;
                          }
                      } else if (cid.startsWith('direct_')) {
                          // Personel kendi arasındaki özel sohbetler (direct_admin_..., direct_ticketing_...) müşteriye kapalıdır
                          if (cid.startsWith('direct_admin_') || cid.startsWith('direct_ticketing_')) {
                              return;
                          }
                          // Format: direct_${tourId}_${participantId} veya direct_${tourId}_${participantId}_exp2
                          const withoutPrefix = cid.slice('direct_'.length);
                          const normalizedTarget = withoutPrefix.endsWith('_exp2')
                              ? withoutPrefix.slice(0, -'_exp2'.length)
                              : withoutPrefix;

                          let isMyDirectChat = false;
                          allowedParticipantIds.forEach(pid => {
                              if (pid && (normalizedTarget.toLowerCase().endsWith(`_${pid}`) || normalizedTarget.toLowerCase().includes(pid))) {
                                  isMyDirectChat = true;
                              }
                          });
                          if (!isMyDirectChat) {
                              return;
                          }
                      } else if (cid.startsWith('admin_')) {
                          const targetKey = cid.slice('admin_'.length).toLowerCase();
                          if (!allowedParticipantIds.has(targetKey)) {
                              return;
                          }
                      } else if (cid.includes('_expert_') || cid.includes('_expert2_')) {
                          const parts = cid.split(/_expert2?_/);
                          const targetKey = (parts[1] || '').toLowerCase();
                          if (!allowedParticipantIds.has(targetKey)) {
                              return;
                          }
                      } else {
                          // Tanımsız veya başka bir kullanıcıya ait oda formatlarını reddet
                          return;
                      }
                  }

                  fetchedMessages.push({ dbId: docItem.id, ...data });
              });
              
              set({ messages: fetchedMessages.sort((a,b) => (Number(a.id || a.dbId) || 0) - (Number(b.id || b.dbId) || 0)) });
          };
          
          const unsub = onSnapshot(messagesRef, (snapshot) => {
              latestRawDocs = [];
              snapshot.forEach(docSnap => {
                  latestRawDocs.push({ id: docSnap.id, data: docSnap.data() || {} });
              });
              filterAndApplyMessages();
          });

          // Tur listesi güncellendiğinde mesaj filtrelemesini yeniden çalıştır
          const unsubTourSync = useTourStore.subscribe(() => {
              if (latestRawDocs.length > 0) {
                  filterAndApplyMessages();
              }
          });

          set({ _unsubscribe: unsub, _unsubscribeTourSync: unsubTourSync });
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
      const currentSession = getCurrentSessionUser();
      if (!isStaffSessionUser(currentSession)) {
          console.warn("Yetkisiz sohbet geçmişi silme girişimi engellendi.");
          return;
      }
      get().messages.forEach(async (m) => {
          if (m.chatId === chatId && m.dbId) {
              try { await deleteDoc(doc(db, 'messages', m.dbId)); } catch (e) {}
          }
      });
  }
}));
