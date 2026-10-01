import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatTitleCase } from './userStore';

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

export const parseTourEndDate = (datesString) => {
    if (!datesString || typeof datesString !== 'string') return null;
    const str = datesString.trim().toLowerCase();

    const trMonths = {
        'ocak': 0, 'subat': 1, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayis': 4, 'mayıs': 4,
        'haziran': 5, 'temmuz': 6, 'agustos': 7, 'ağustos': 7, 'eylul': 8, 'eylül': 8,
        'ekim': 9, 'kasim': 10, 'kasım': 10, 'aralik': 11, 'aralık': 11
    };

    try {
        // 1. Check for standard DD.MM.YYYY or DD/MM/YYYY or YYYY-MM-DD
        const dotMatches = str.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/g);
        if (dotMatches && dotMatches.length > 0) {
            const last = dotMatches[dotMatches.length - 1];
            const parts = last.split(/[./]/);
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            const dt = new Date(y, m, d, 23, 59, 59, 999);
            if (!isNaN(dt.getTime())) return dt;
        }

        const isoMatches = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/g);
        if (isoMatches && isoMatches.length > 0) {
            const last = isoMatches[isoMatches.length - 1];
            const parts = last.split('-');
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            const dt = new Date(y, m, d, 23, 59, 59, 999);
            if (!isNaN(dt.getTime())) return dt;
        }

        // 2. Turkish month names with explicit year: "14 eylül 2026 - 17 eylül 2026" or "14 eylül 2026"
        const monthYearRegex = /(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/gi;
        const myMatches = [...str.matchAll(monthYearRegex)];
        if (myMatches.length > 0) {
            const lastMatch = myMatches[myMatches.length - 1];
            const d = parseInt(lastMatch[1], 10);
            const monthKey = lastMatch[2].toLowerCase();
            const y = parseInt(lastMatch[3], 10);
            const m = trMonths[monthKey];
            if (m !== undefined && !isNaN(d) && !isNaN(y)) {
                return new Date(y, m, d, 23, 59, 59, 999);
            }
        }

        // 3. Turkish month range where year is only at the end: "14 - 17 eylül 2026" or "14 eylül - 17 eylül 2026"
        const rangeWithEndYear = str.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})/i);
        if (rangeWithEndYear) {
            const d = parseInt(rangeWithEndYear[2], 10);
            const monthKey = rangeWithEndYear[3].toLowerCase();
            const y = parseInt(rangeWithEndYear[4], 10);
            const m = trMonths[monthKey];
            if (m !== undefined && !isNaN(d) && !isNaN(y)) {
                return new Date(y, m, d, 23, 59, 59, 999);
            }
        }

        // 4. Fallback: find any 4-digit year and month in string
        const yearMatch = str.match(/\b(20\d{2})\b/);
        const y = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        for (const [mName, mIdx] of Object.entries(trMonths)) {
            if (str.includes(mName)) {
                const numbers = str.match(/\b(\d{1,2})\b/g);
                if (numbers && numbers.length > 0) {
                    const d = parseInt(numbers[numbers.length - 1], 10);
                    if (d <= 31) {
                        return new Date(y, mIdx, d, 23, 59, 59, 999);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Date parse error:', e);
    }

    return null;
};

export const isTourPast = (tour) => {
    if (!tour) return false;
    if (tour.status === 'past') return true;
    if (tour.status === 'cancelled') return false;
    const endDate = parseTourEndDate(tour.dates);
    if (endDate && endDate < new Date()) {
        return true;
    }
    return false;
};

export const isTourActive = (tour) => {
    if (!tour) return false;
    if (tour.status === 'cancelled') return false;
    return !isTourPast(tour);
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

export const sanitizeForFirestore = (obj) => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
    }
    const cleanObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleanObj[key] = sanitizeForFirestore(value);
        }
    }
    return cleanObj;
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
                          let participantModified = false;
                          const rawName = p.name ? String(p.name).trim() : '';
                          const cleanName = formatTitleCase(rawName);
                          const rawEmail = p.email ? String(p.email).trim() : '';
                          const cleanEmail = rawEmail.toLowerCase();
                          
                          let newFlights = p.flights;
                          if (p.flights && p.flights.length > 0) {
                              const updatedFlights = p.flights.map(f => {
                                  const sf = sanitizeFlightData(f);
                                  if (sf !== f) {
                                      participantModified = true;
                                      tourModified = true;
                                  }
                                  return sf;
                              });
                              if (participantModified) {
                                  newFlights = updatedFlights;
                              }
                          }
                          
                          if ((rawName && rawName !== cleanName) || (rawEmail && rawEmail !== cleanEmail)) {
                              tourModified = true;
                          }

                          return { 
                              ...p, 
                              name: cleanName || p.name, 
                              email: cleanEmail || p.email, 
                              flights: newFlights 
                          };
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

                  // Auto-sync completed/expired tours to past status in Firestore
                  const endDate = parseTourEndDate(tourData.dates);
                  if (tourData.status !== 'past' && tourData.status !== 'cancelled' && endDate && endDate < new Date()) {
                      tourData.status = 'past';
                      try {
                          await updateDoc(doc(db, 'tours', docSnap.id), { status: 'past' });
                      } catch (e) {
                          console.error("Auto-sync past tour status failed:", e);
                      }
                  }

                  fetchedTours.push({ id: docSnap.id, ...tourData });
              }
              set({ tours: fetchedTours.reverse() });
              get().cleanupExpiredTourAttachments().catch(console.error);
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
          participants: newTour.participants || []
      };
      set(state => ({ tours: [tourData, ...state.tours] }));
      try { 
          await setDoc(doc(db, 'tours', tourId), tourData); 
      } catch (e) {
          console.error("Error adding tour:", e);
      }
  },
  
  addParticipantToTour: async (tourId, userObj) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      const cleanEmail = (userObj.email || '').trim().toLowerCase();
      const cleanName = formatTitleCase(userObj.name || '');
      const sanitizedUserObj = { ...userObj, name: cleanName, email: cleanEmail };
      const exists = (tour.participants || []).some(p => p.id === userObj.id || (p.email && p.email.trim().toLowerCase() === cleanEmail));
      if (!exists) {
          const newParticipants = [...(tour.participants || []), sanitizedUserObj];
          const sanitized = sanitizeForFirestore(newParticipants);
          set(state => ({
              tours: state.tours.map(t => t.id === tourId ? { ...t, participants: sanitized } : t)
          }));
          try { await updateDoc(doc(db, 'tours', tourId), { participants: sanitized }); } catch (e) {
              console.error("Firestore addParticipantToTour failed:", e);
          }
      }
  },

  removeParticipantFromTour: async (tourId, participantId) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      const newParticipants = (tour.participants || []).filter(p => p.id !== participantId);
      const sanitized = sanitizeForFirestore(newParticipants);
      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, participants: sanitized } : t)
      }));
      try { await updateDoc(doc(db, 'tours', tourId), { participants: sanitized }); } catch (e) {
          console.error("Firestore removeParticipantFromTour failed:", e);
      }
  },

  updateParticipantTransfers: async (tourId, participantId, flights, transfers, ticketPdf = null, ticketFiles = null) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) throw new Error("Tur bulunamadı.");

      if (ticketPdf && typeof ticketPdf.url === 'string' && ticketPdf.url.startsWith('data:')) {
          throw new Error("Bilet PDF doğrudan Firebase Storage alanına yüklenmelidir (Base64 formatı Firestore sınırını aşmaktadır).");
      }

      const newParticipants = (tour.participants || []).map(p => {
          if (p.id === participantId) {
              const updated = { ...p };
              if (transfers !== undefined) updated.transfers = transfers;
              if (flights !== undefined) updated.flights = flights;
              if (ticketPdf !== undefined) updated.ticketPdf = ticketPdf;
              if (ticketFiles !== undefined) updated.ticketFiles = ticketFiles;
              return updated;
          }
          return p;
      });

      const sanitizedParticipants = sanitizeForFirestore(newParticipants);
      await updateDoc(doc(db, 'tours', tourId), { participants: sanitizedParticipants });

      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, participants: sanitizedParticipants } : t)
      }));
  },

  updateParticipantTicket: async (tourId, participantId, ticketPdf, ticketFiles = []) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) throw new Error("Tur bulunamadı.");

      if (ticketPdf && typeof ticketPdf.url === 'string' && ticketPdf.url.startsWith('data:')) {
          throw new Error("Bilet PDF doğrudan Firebase Storage alanına yüklenmelidir (Base64 formatı Firestore sınırını aşmaktadır).");
      }

      const newParticipants = (tour.participants || []).map(p => 
          p.id === participantId ? { ...p, ticketPdf: ticketPdf || null, ticketFiles: ticketFiles || [] } : p
      );

      const sanitizedParticipants = sanitizeForFirestore(newParticipants);
      await updateDoc(doc(db, 'tours', tourId), { participants: sanitizedParticipants });

      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, participants: sanitizedParticipants } : t)
      }));
  },

  updateTourProgram: async (tourId, newProgram) => {
      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, program: newProgram } : t)
      }));
      try { await updateDoc(doc(db, 'tours', tourId), { program: newProgram }); } catch (e) {}
  },

  editTour: async (tourId, newData) => {
      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, ...newData } : t)
      }));
      try { 
          const sanitized = {};
          Object.keys(newData).forEach(k => {
              if (newData[k] !== undefined) {
                  sanitized[k] = newData[k];
              }
          });
          await updateDoc(doc(db, 'tours', tourId), sanitized); 
      } catch (e) {
          console.error("Error editing tour:", e);
          throw e;
      }
  },

  addParticipantFeedback: async (tourId, participantIdentifier, feedbackData) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      let found = false;
      let updatedParticipants = (tour.participants || []).map(p => {
          if (p.id === participantIdentifier || p.name === participantIdentifier) {
              found = true;
              return { ...p, feedback: feedbackData };
          }
          return p;
      });
      if (!found && updatedParticipants.length > 0) {
          updatedParticipants[0] = { ...updatedParticipants[0], feedback: feedbackData };
      }
      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, participants: updatedParticipants } : t)
      }));
      try { await updateDoc(doc(db, 'tours', tourId), { participants: updatedParticipants }); } catch (e) {}
  },

  rateTour: async (tourId, reviewData) => {
      const tour = get().tours.find(t => t.id === tourId);
      if (!tour) return;
      const reviews = tour.reviews ? [...tour.reviews, reviewData] : [reviewData];
      set(state => ({
          tours: state.tours.map(t => t.id === tourId ? { ...t, reviews } : t)
      }));
      try { await updateDoc(doc(db, 'tours', tourId), { reviews }); } catch (e) {}
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
              const isChild = globalUser.isChildProfile === true || (globalUser.email && (globalUser.email.startsWith('child_') || globalUser.email.endsWith('.local') || globalUser.email.includes('@move.local')));
              if (isChild) return p;

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
  },

  checkAndSendTourReviewReminders: async (users, whatsappConfig, sendWhatsAppNotification) => {
      const now = new Date();
      const tours = get().tours;
      
      tours.forEach(async (tour) => {
          if (tour.status === 'cancelled') return;
          const endDate = parseTourEndDate(tour.dates);
          if (!endDate) return;

          const diffMs = now.getTime() - endDate.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // Tur bitişinden 24 saat veya daha fazla süre geçtiyse
          if (diffHours >= 24) {
              let updatedParticipants = false;
              const newParticipants = (tour.participants || []).map(p => {
                  const globalUser = users.find(u => u.id === p.id || u.email === p.email) || p;
                  const isChild = globalUser.isChildProfile === true || (globalUser.email && (globalUser.email.startsWith('child_') || globalUser.email.endsWith('.local') || globalUser.email.includes('@move.local')));
                  if (isChild) return p;
                  
                  if (!p.reviewReminderSent) {
                      const userPhone = globalUser.phone || p.phone;
                      if (userPhone && userPhone !== '-' && userPhone.length >= 9) {
                          const reviewLink = `https://move-yanimda.web.app/dashboard/review/${tour.id}`;
                          sendWhatsAppNotification(
                              userPhone,
                              'tourReviewTemplate',
                              [p.name, tour.name, reviewLink]
                          );
                      }
                      updatedParticipants = true;
                      return { ...p, reviewReminderSent: true };
                  }
                  return p;
              });

              if (updatedParticipants) {
                  try {
                      await updateDoc(doc(db, 'tours', tour.id), { participants: newParticipants });
                  } catch (e) {
                      console.error("Failed to save reviewReminderSent flag:", e);
                  }
              }
          }
      });
  },

  cleanupExpiredTourAttachments: async () => {
      const toursList = get().tours;

      for (const tour of toursList) {
          if (tour.status === 'past' && tour.programFiles && tour.programFiles.length > 0) {
              const endDate = parseTourEndDate(tour.dates);
              if (endDate) {
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  
                  if (endDate < thirtyDaysAgo) {
                      console.log(`Cleaning up expired attachments for tour: ${tour.name}`);
                      
                      const { ref, deleteObject } = await import('firebase/storage');
                      const { storage } = await import('../lib/firebase');
                      
                      for (const file of tour.programFiles) {
                          try {
                              const fileRef = ref(storage, file.url);
                              await deleteObject(fileRef);
                          } catch (err) {
                              console.error(`Failed to delete storage file ${file.name}:`, err);
                          }
                      }
                      
                      try {
                          await updateDoc(doc(db, 'tours', tour.id), { programFiles: [] });
                      } catch (err) {
                          console.error(`Failed to clear Firestore files for tour ${tour.name}:`, err);
                      }
                  }
              }
          }
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

export const getTourExperts = (tour, allUsers = [], currentUser = null) => {
    if (!tour) return { expert1: null, expert2: null };

    const trNorm = (s) => (s || '').trim().toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');

    const exp1Name = tour.expert?.name || tour.guideName || (currentUser?.role === 'expert' ? currentUser.name : '1. Seyahat Uzmanı');
    const exp1Email = tour.expert?.email || (currentUser?.role === 'expert' && (trNorm(currentUser.name) === trNorm(exp1Name) || !exp1Name) ? currentUser.email : '');
    const exp1Id = tour.expert?.id || '';

    // Search in allUsers
    let user1 = allUsers?.find(u => 
        (exp1Id && u.id === exp1Id) ||
        (exp1Email && u.email && u.email.toLowerCase() === exp1Email.toLowerCase()) ||
        (exp1Name && u.name && trNorm(u.name) === trNorm(exp1Name)) ||
        (tour.guideName && u.name && trNorm(u.name) === trNorm(tour.guideName)) ||
        (exp1Name && u.name && (trNorm(u.name).includes(trNorm(exp1Name)) || trNorm(exp1Name).includes(trNorm(u.name))))
    );

    // If current logged-in user is expert and matches (or is this tour's expert)
    if (!user1 && currentUser?.role === 'expert') {
        if (!tour.expert?.name || 
            tour.expert?.name === currentUser.name || 
            tour.guideName === currentUser.name || 
            (currentUser.name && trNorm(currentUser.name) === trNorm(exp1Name)) ||
            (currentUser.email && exp1Email && currentUser.email.toLowerCase() === exp1Email.toLowerCase()) ||
            (currentUser.name && exp1Name && (trNorm(currentUser.name).includes(trNorm(exp1Name)) || trNorm(exp1Name).includes(trNorm(currentUser.name))))
        ) {
            user1 = currentUser;
        }
    }

    // Determine avatar for Expert 1
    const isCurrentUserExpert1 = !!(currentUser && (
        (currentUser.id && user1 && currentUser.id === user1.id) ||
        (currentUser.email && exp1Email && currentUser.email.toLowerCase() === exp1Email.toLowerCase()) ||
        (currentUser.name && exp1Name && trNorm(currentUser.name) === trNorm(exp1Name))
    ));

    let avatar1 = null;
    if (user1?.avatar && !user1.avatar.includes('ui-avatars.com')) {
        avatar1 = user1.avatar;
    } else if (tour.expert?.avatar && !tour.expert.avatar.includes('ui-avatars.com')) {
        avatar1 = tour.expert.avatar;
    } else if (isCurrentUserExpert1 && currentUser?.avatar && !currentUser.avatar.includes('ui-avatars.com')) {
        avatar1 = currentUser.avatar;
    } else if (user1?.avatar) {
        avatar1 = user1.avatar;
    } else if (tour.expert?.avatar) {
        avatar1 = tour.expert.avatar;
    } else if (isCurrentUserExpert1 && currentUser?.avatar) {
        avatar1 = currentUser.avatar;
    } else {
        avatar1 = `https://ui-avatars.com/api/?name=${encodeURIComponent(exp1Name || '1')}&background=D7147A&color=fff&bold=true`;
    }

    const phone1 = (user1 && user1.phone && user1.phone !== '-') ? user1.phone : (tour.expert?.phone || (isCurrentUserExpert1 ? currentUser?.phone : '+905321234567'));
    const email1 = exp1Email || user1?.email || tour.expert?.email || (isCurrentUserExpert1 ? currentUser?.email : '');

    const expert1 = {
        name: exp1Name,
        avatar: avatar1,
        email: email1,
        phone: phone1
    };

    let expert2 = null;
    if (tour.expert2 || tour.guide2Name) {
        const exp2Name = tour.expert2?.name || tour.guide2Name;
        const exp2Email = tour.expert2?.email || '';
        const exp2Id = tour.expert2?.id || '';

        let user2 = allUsers?.find(u => 
            (exp2Id && u.id === exp2Id) ||
            (exp2Email && u.email && u.email.toLowerCase() === exp2Email.toLowerCase()) ||
            (exp2Name && u.name && trNorm(u.name) === trNorm(exp2Name)) ||
            (exp2Name && u.name && (trNorm(u.name).includes(trNorm(exp2Name)) || trNorm(exp2Name).includes(trNorm(u.name))))
        );

        let avatar2 = null;
        if (user2?.avatar && !user2.avatar.includes('ui-avatars.com')) {
            avatar2 = user2.avatar;
        } else if (tour.expert2?.avatar && !tour.expert2.avatar.includes('ui-avatars.com')) {
            avatar2 = tour.expert2.avatar;
        } else if (currentUser?.avatar && !currentUser.avatar.includes('ui-avatars.com') && (
            (currentUser.email && exp2Email && currentUser.email.toLowerCase() === exp2Email.toLowerCase()) ||
            (currentUser.name && exp2Name && trNorm(currentUser.name) === trNorm(exp2Name))
        )) {
            avatar2 = currentUser.avatar;
        } else if (user2?.avatar) {
            avatar2 = user2.avatar;
        } else if (tour.expert2?.avatar) {
            avatar2 = tour.expert2.avatar;
        } else {
            avatar2 = `https://ui-avatars.com/api/?name=${encodeURIComponent(exp2Name || '2')}&background=2563eb&color=fff&bold=true`;
        }

        const phone2 = (user2 && user2.phone && user2.phone !== '-') ? user2.phone : '+905321234568';
        const email2 = exp2Email || user2?.email || '';

        expert2 = {
            name: exp2Name,
            avatar: avatar2,
            email: email2,
            phone: phone2
        };
    }

    return { expert1, expert2 };
};
