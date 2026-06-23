import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const excelSerialToDate = (serial) => {
    const s = Number(serial);
    if (isNaN(s) || s < 1) return null;
    const days = s - (s < 60 ? 0 : 1);
    const ms = Math.round((days - 25568) * 86400 * 1000);
    const date = new Date(ms);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const excelSerialToTime = (serial) => {
    const s = Number(serial);
    if (isNaN(s) || s < 0 || s >= 1) return null;
    const totalMinutes = Math.round(s * 1440);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
};

const parseStandardDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanDate = String(dateStr).replace(/\//g, '.').replace(/-/g, '.');
    const parts = cleanDate.split('.');
    if (parts.length === 3) {
        if (parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    return String(dateStr);
};

const parseExcelDateValue = (val) => {
    if (!val) return { date: '', departureTime: '', arrivalTime: '' };
    const str = String(val).trim();
    const parts = str.split(/\s*(?:-|\s)\s*/).filter(Boolean);
    
    let date = '';
    let departureTime = '';
    let arrivalTime = '';
    
    if (parts.length > 0) {
        const part1 = parts[0];
        if (/^\d+$/.test(part1)) {
            date = excelSerialToDate(part1) || '';
        } else {
            date = parseStandardDate(part1);
        }
    }
    
    if (parts.length > 1) {
        const part2 = parts[1];
        if (/^0\.\d+$/.test(part2) || /^\d+$/.test(part2)) {
            departureTime = excelSerialToTime(part2) || '';
        } else {
            departureTime = part2;
        }
    }
    
    if (parts.length > 2) {
        const part3 = parts[2];
        if (/^0\.\d+$/.test(part3) || /^\d+$/.test(part3)) {
            arrivalTime = excelSerialToTime(part3) || '';
        } else {
            arrivalTime = part3;
        }
    }
    
    return { date, departureTime, arrivalTime };
};

const parseTimeValue = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (/^0\.\d+$/.test(str) || /^\d+$/.test(str)) {
        return excelSerialToTime(str) || str;
    }
    return str;
};

const sanitizeFlightData = (flight) => {
    if (!flight || !flight.date) return flight;
    const dateStr = String(flight.date).trim();
    
    if (/^\d{5}/.test(dateStr)) {
        const parsed = parseExcelDateValue(dateStr);
        if (parsed.date) {
            return {
                ...flight,
                date: parsed.date,
                departureTime: flight.departureTime && !/^0\.\d+$/.test(String(flight.departureTime).trim())
                    ? flight.departureTime 
                    : parsed.departureTime || flight.departureTime || '',
                arrivalTime: flight.arrivalTime && !/^0\.\d+$/.test(String(flight.arrivalTime).trim())
                    ? flight.arrivalTime 
                    : parsed.arrivalTime || flight.arrivalTime || ''
            };
        }
    }
    
    let updated = false;
    const cleanFlight = { ...flight };
    if (flight.departureTime && (/^0\.\d+$/.test(String(flight.departureTime).trim()) || /^\d+$/.test(String(flight.departureTime).trim()))) {
        cleanFlight.departureTime = excelSerialToTime(flight.departureTime) || flight.departureTime;
        updated = true;
    }
    if (flight.arrivalTime && (/^0\.\d+$/.test(String(flight.arrivalTime).trim()) || /^\d+$/.test(String(flight.arrivalTime).trim()))) {
        cleanFlight.arrivalTime = excelSerialToTime(flight.arrivalTime) || flight.arrivalTime;
        updated = true;
    }
    
    return updated ? cleanFlight : flight;
};

export const useTourStore = create((set, get) => ({
  tours: [],
  isFirebaseInitialized: false,

  initFirestoreTours: async () => {
      if (get().isFirebaseInitialized) return;
      set({ isFirebaseInitialized: true });
      
      try {
          const toursRef = collection(db, 'tours');
          
          onSnapshot(toursRef, async (snapshot) => {
              const fetchedTours = [];
              for (const docSnap of snapshot.docs) {
                  const tourData = docSnap.data();
                  let tourModified = false;
                  
                  if (tourData.participants) {
                      const updatedParticipants = tourData.participants.map(p => {
                          if (p.flights && p.flights.length > 0) {
                              let flightsModified = false;
                              const updatedFlights = p.flights.map(f => {
                                  const sf = sanitizeFlightData(f);
                                  if (sf !== f) {
                                      flightsModified = true;
                                      tourModified = true;
                                  }
                                  return sf;
                              });
                              if (flightsModified) {
                                  return { ...p, flights: updatedFlights };
                              }
                          }
                          return p;
                      });
                      if (tourModified) {
                          tourData.participants = updatedParticipants;
                          try {
                              await updateDoc(doc(db, 'tours', docSnap.id), { participants: updatedParticipants });
                          } catch (e) {
                              console.error("Firestore repair failed:", e);
                          }
                      }
                  }
                  fetchedTours.push({ id: docSnap.id, ...tourData });
              }
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
  },

  checkAndSendFlightReminders: async (users, whatsappConfig, sendWhatsAppNotification) => {
      const now = new Date();
      const tours = get().tours;
      
      tours.forEach(async (tour) => {
          if (tour.status !== 'active') return;
          
          let updatedParticipants = false;
          const newParticipants = tour.participants.map(p => {
              const globalUser = users.find(u => u.id === p.id || u.email === p.email) || p;
              const outgoingFlight = p.flights?.find(f => f.type === 'Gidiş Uçuşu' || f.type === 'Gidis Ucusu') || p.flights?.[0];
              
              if (outgoingFlight && outgoingFlight.date && !p.checkInReminderSent) {
                  try {
                      const flightDateObj = new Date(outgoingFlight.date);
                      if (outgoingFlight.departureTime) {
                          const timeParts = outgoingFlight.departureTime.split(':');
                          if (timeParts.length === 2) {
                              flightDateObj.setHours(parseInt(timeParts[0]) || 0);
                              flightDateObj.setMinutes(parseInt(timeParts[1]) || 0);
                          }
                      }
                      
                      const diffMs = flightDateObj.getTime() - now.getTime();
                      const diffHours = diffMs / (1000 * 60 * 60);
                      
                      if (diffHours > 0 && diffHours <= 48) {
                          if (globalUser.phone && globalUser.phone !== '-') {
                              sendWhatsAppNotification(
                                  globalUser.phone,
                                  'checkInTemplate',
                                  [p.name, tour.name, String(Math.floor(diffHours)), outgoingFlight.airline || 'Havayolu']
                              );
                          }
                          updatedParticipants = true;
                          return { ...p, checkInReminderSent: true };
                      }
                  } catch (err) {
                      console.error("Failed parsing check-in flight date:", err);
                  }
              }
              return p;
          });
          
          if (updatedParticipants) {
              try {
                  await updateDoc(doc(db, 'tours', tour.id), { participants: newParticipants });
              } catch (e) {
                  console.error("Failed to save checkInReminderSent flag:", e);
              }
          }
      });
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
