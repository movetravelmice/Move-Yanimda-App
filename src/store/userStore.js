import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultUsers = [];

export const formatTitleCase = (str) => {
    if (!str) return '';
    return String(str)
        .trim()
        .split(/\s+/)
        .map(word => {
            if (!word) return '';
            const first = word.charAt(0).toLocaleUpperCase('tr-TR');
            const rest = word.slice(1).toLocaleLowerCase('tr-TR');
            return first + rest;
        })
        .join(' ');
};

const isDemoUser = (user, id) => {
    if (!user && !id) return false;
    const docId = String(id || user?.id || '');
    const email = String(user?.email || '').toLowerCase().trim();
    return docId === 'sys_admin' || docId === 'sys_expert' || docId === 'sys_customer' || email.endsWith('@base44.com');
};

export const useUserStore = create((set, get) => ({
    users: [],
    companies: ['Move Travel & Mice'],
    isFirebaseInitialized: false,

    initFirestoreUsers: async () => {
        if (get().isFirebaseInitialized) return;
        set({ isFirebaseInitialized: true });
        
        try {
            const usersRef = collection(db, 'users');
            
            // Listen
            onSnapshot(usersRef, (snapshot) => {
                const fetchedUsers = [];
                const fetchedCompanies = new Set();
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const userId = data.id || docSnap.id;
                    const rawEmail = data.email ? String(data.email).trim() : '';
                    const cleanEmail = rawEmail.toLowerCase();
                    const rawName = data.name ? String(data.name).trim() : '';
                    const cleanName = formatTitleCase(rawName);
                    const userRecord = { ...data, id: userId, email: cleanEmail, name: cleanName };
                    
                    // Kalıcı olarak demo/base44 hesaplarını Firestore'dan temizle
                    if (isDemoUser(userRecord, userId)) {
                        deleteDoc(docSnap.ref).catch(err => console.log("Demo hesap silme hatası:", err));
                        return; // UI listesine ekleme
                    }

                    // E-posta ve İsim normalizasyonunu (Küçük e-posta, Baş harfi büyük isim) veritabanına da eşitle
                    const dbUpdates = {};
                    if (rawEmail && rawEmail !== cleanEmail) {
                        dbUpdates.email = cleanEmail;
                    }
                    if (rawName && rawName !== cleanName) {
                        dbUpdates.name = cleanName;
                    }
                    if (Object.keys(dbUpdates).length > 0) {
                        setDoc(doc(db, 'users', userId), dbUpdates, { merge: true }).catch(err => console.log("User normalization sync error:", err));
                    }

                    // Sanitize old placeholder or deleted company names
                    if (userRecord.company && (userRecord.company.includes('Base44') || userRecord.company.toLowerCase().includes('tgundogan'))) {
                        const fixedCompany = userRecord.role === 'customer' ? 'Bireysel' : 'Move Travel & Mice';
                        setDoc(doc(db, 'users', userId), { company: fixedCompany }, { merge: true }).catch(err => console.log(err));
                        userRecord.company = fixedCompany;
                    }
                    fetchedUsers.push(userRecord);
                    if (userRecord.company && !userRecord.company.toLowerCase().includes('tgundogan')) {
                        fetchedCompanies.add(userRecord.company);
                    }
                });

                const cleanCompanyList = Array.from(fetchedCompanies).filter(c => c && !c.toLowerCase().includes('tgundogan'));
                set({ 
                    users: fetchedUsers,
                    companies: cleanCompanyList.length > 0 ? cleanCompanyList : ['Move Travel & Mice']
                });
            });
        } catch (e) {
            console.error("Firebase bağlanamadı, yerel veriler kullanılıyor", e);
        }
    },
    
    addUser: async (userObj) => {
        const role = userObj.role || 'customer';
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const newUserId = role + '_' + Date.now() + '_' + randomSuffix;
        const normalizedName = formatTitleCase(userObj.name || '');
        const safeName = normalizedName ? encodeURIComponent(normalizedName) : 'User';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true`;
        const normalizedEmail = (userObj.email || '').trim().toLowerCase();
        
        const newUser = { 
            ...userObj, 
            name: normalizedName,
            id: newUserId, 
            role: role,
            status: 'Aktif',
            email: normalizedEmail,
            password: userObj.password ? String(userObj.password).trim() : '123456',
            avatar: userObj.avatar || fallbackAvatar 
        };
        
        // Optimistic UI Update
        const currentUsers = get().users;
        set({ users: [newUser, ...currentUsers.filter(u => u.email?.toLowerCase() !== normalizedEmail)] });

        try {
            await setDoc(doc(db, 'users', newUserId), newUser);
        } catch (e) {
            console.error("User eklenemedi:", e);
        }
        return newUser;
    },

    updateUser: async (id, updatedData) => {
        const dataToUpdate = {};
        Object.keys(updatedData).forEach(k => {
            if (updatedData[k] !== undefined) {
                dataToUpdate[k] = updatedData[k];
            }
        });

        if (dataToUpdate.name) {
            dataToUpdate.name = formatTitleCase(dataToUpdate.name);
        }

        if (dataToUpdate.email) {
            dataToUpdate.email = String(dataToUpdate.email).trim().toLowerCase();
        }

        const normalizedEmail = (dataToUpdate.email || '').toLowerCase();
        let targetId = id;
        
        // Find existing user if id wasn't specified or to find their real doc id
        const currentUsers = get().users;
        const existing = currentUsers.find(u => (id && u.id === id) || (normalizedEmail && u.email?.toLowerCase() === normalizedEmail));
        if (existing && !targetId) {
            targetId = existing.id;
        }

        // Optimistic UI update
        set({
            users: currentUsers.map(u => {
                const isMatch = (targetId && u.id === targetId) || (normalizedEmail && u.email?.toLowerCase() === normalizedEmail);
                return isMatch ? { ...u, ...dataToUpdate } : u;
            })
        });

        // Also if avatar changed, sync to AuthStore if this user is current logged in user
        try {
            const authState = useAuthStore.getState();
            if (authState?.user) {
                const authUser = authState.user;
                if ((targetId && authUser.id === targetId) || (normalizedEmail && authUser.email?.toLowerCase() === normalizedEmail)) {
                    useAuthStore.setState({ user: { ...authUser, ...dataToUpdate } });
                }
            }
        } catch (e) {}

        // Persist to Firestore
        try {
            if (targetId) {
                await setDoc(doc(db, 'users', targetId), { ...dataToUpdate, id: targetId }, { merge: true });
            } else if (normalizedEmail) {
                const q = query(collection(db, 'users'), where('email', '==', dataToUpdate.email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    for (const d of snap.docs) {
                        await setDoc(d.ref, dataToUpdate, { merge: true });
                    }
                } else {
                    const newId = 'user_' + Date.now();
                    await setDoc(doc(db, 'users', newId), { ...dataToUpdate, id: newId }, { merge: true });
                }
            }
        } catch (e) {
            console.error("User guncellenemedi:", e);
        }
    },

    deleteUser: async (id) => {
        // Optimistic delete
        const currentUsers = get().users;
        set({ users: currentUsers.filter(u => u.id !== id) });
        
        try {
            await deleteDoc(doc(db, 'users', id));
        } catch (e) {
            console.error("Kullanici silinemedi:", e);
        }
    },

    addCompany: (companyName) => set((state) => {
        if (!companyName || String(companyName).toLowerCase().includes('tgundogan')) return state;
        if (!state.companies.includes(companyName)) {
            return { companies: [...state.companies, companyName] };
        }
        return state;
    }),

    findUserByEmail: (identifier) => {
        if (!identifier) return null;
        const clean = String(identifier).trim().toLowerCase();
        const cleanDigits = clean.replace(/\D/g, '');
        return get().users.find(u => {
            if (u.email && u.email.trim().toLowerCase() === clean) return true;
            if (cleanDigits.length >= 10) {
                const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
                if (uPhoneDigits.length >= 10 && (uPhoneDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(uPhoneDigits.slice(-10)))) return true;
                const uEmailDigits = (u.email || '').replace(/\D/g, '');
                if (uEmailDigits.length >= 10 && uEmailDigits.includes(cleanDigits.slice(-10))) return true;
            }
            return false;
        });
    }
}));
