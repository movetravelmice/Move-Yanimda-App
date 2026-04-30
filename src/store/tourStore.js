import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useTourStore = create((set, get) => ({
  tours: [],
  isFirebaseInitialized: false,

  initFirestoreTours: async () => {
      if (get().isFirebaseInitialized) return;
      set({ isFirebaseInitialized: true });
      
      try {
          const toursRef = collection(db, 'tours');
          
          onSnapshot(toursRef, (snapshot) => {
              const fetchedTours = [];
              snapshot.forEach(docSnap => {
                  fetchedTours.push({ id: docSnap.id, ...docSnap.data() });
              });
              
              // Sort so newest dates appear first or keep natural order
              set({ tours: fetchedTours.reverse() });
          });
      } catch (e) {
          console.error("Firebase tour dinleyicisi başlatılamadı:", e);
      }
  },

  setTourStatus: async (tourId, newStatus) => {
      try { await updateDoc(doc(db, 'tours', tourId), { status: newStatus }); } catch (e) {}
  },

  addTour: async (newTour) => {
      const tourId = 'tour_' + Date.now();
      const tourData = {
          ...newTour,
          id: tourId,
          status: 'active',
          participants: []
      };
      try { await setDoc(doc(db, 'tours', tourId), tourData); } catch (e) {}
  },
  
  addParticipantToTour: async (tourId, userObj) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      const exists = tour.participants.some(p => p.id === userObj.id || p.email === userObj.email);
      if (!exists) {
          const newParticipants = [...tour.participants, userObj];
          try { await updateDoc(doc(db, 'tours', tourId), { participants: newParticipants }); } catch (e) {}
      }
  },

  removeParticipantFromTour: async (tourId, participantId) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      const newParticipants = tour.participants.filter(p => p.id !== participantId);
      try { await updateDoc(doc(db, 'tours', tourId), { participants: newParticipants }); } catch (e) {}
  },

  updateParticipantTransfers: async (tourId, participantId, flights, transfers) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      const newParticipants = tour.participants.map(p => 
          p.id === participantId ? { ...p, flights, transfers } : p
      );
      try { await updateDoc(doc(db, 'tours', tourId), { participants: newParticipants }); } catch (e) {}
  },

  updateTourProgram: async (tourId, newProgram) => {
      try { await updateDoc(doc(db, 'tours', tourId), { program: newProgram }); } catch (e) {}
  },

  editTour: async (tourId, newData) => {
      try { await updateDoc(doc(db, 'tours', tourId), newData); } catch (e) {}
  },

  addParticipantFeedback: async (tourId, participantIdentifier, feedbackData) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      let found = false;
      let updatedParticipants = tour.participants.map(p => {
          if (p.id === participantIdentifier || p.name === participantIdentifier) {
              found = true;
              return { ...p, feedback: feedbackData };
          }
          return p;
      });
      if (!found && updatedParticipants.length > 0) {
          updatedParticipants[0] = { ...updatedParticipants[0], feedback: feedbackData };
      }
      try { await updateDoc(doc(db, 'tours', tourId), { participants: updatedParticipants }); } catch (e) {}
  },

  deleteTour: async (tourId) => {
      try { await deleteDoc(doc(db, 'tours', tourId)); } catch (e) {}
  },
    
  clearAllTours: async () => {
      get().tours.forEach(async (t) => {
          try { await deleteDoc(doc(db, 'tours', t.id)); } catch (e) {}
      });
  },

  startRollCall: async (tourId, durationMinutes = 3) => {
      try {
          await updateDoc(doc(db, 'tours', tourId), {
              rollCall: {
                  active: true,
                  startTime: Date.now(),
                  endTime: Date.now() + durationMinutes * 60 * 1000,
                  attendees: []
              }
          });
      } catch (e) {}
  },

  endRollCall: async (tourId) => {
      try {
          await updateDoc(doc(db, 'tours', tourId), {
              'rollCall.active': false
          });
      } catch (e) {}
  },

  markRollCallPresent: async (tourId, userObj) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour || !tour.rollCall) return;
      
      const attendees = tour.rollCall.attendees || [];
      const exists = attendees.some(p => p.id === userObj.id || p.email === userObj.email);
      
      if (!exists) {
          const newAttendees = [...attendees, { 
              id: userObj.id || 'cust_'+Date.now(),
              name: userObj.name,
              email: userObj.email,
              avatar: userObj.avatar,
              timestamp: Date.now()
          }];
          try {
              await updateDoc(doc(db, 'tours', tourId), {
                  'rollCall.attendees': newAttendees
              });
          } catch (e) {}
      }
  }
}));
