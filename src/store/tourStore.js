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

export const calculateDaysAndNights = (datesStr) => {
    if (!datesStr || !datesStr.includes(' - ')) return '';
    try {
        const parts = datesStr.split(' - ');
        const months = { 'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5, 'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11 };
        
        const parseDateString = (str) => {
            const p = str.trim().split(' ');
            if (p.length !== 3) return null;
            const d = parseInt(p[0]);
            const m = months[p[1].toLowerCase()];
            const y = parseInt(p[2]);
            if (isNaN(d) || m === undefined || isNaN(y)) return null;
            return new Date(y, m, d);
        };
        
        const d1 = parseDateString(parts[0]);
        const d2 = parseDateString(parts[1]);
        if (!d1 || !d2) return '';
        
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 0) {
            const nights = diffDays - 1;
            return `${diffDays} Gün ${nights} Gece`;
        }
    } catch (e) {
        return '';
    }
    return '';
};
