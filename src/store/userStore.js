import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultUsers = [
    {
        id: 'sys_admin',
        email: 'admin@base44.com',
        password: 'Base44!',
        name: 'Sistem Yöneticisi',
        role: 'admin',
        phone: '-',
        company: 'Move Travel & Mice',
        status: 'Aktif',
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=60&w=100"
    },
    {
        id: 'sys_expert',
        email: 'uzman@base44.com',
        password: 'Base44!',
        name: 'Bölge Uzmanı',
        role: 'expert',
        phone: '-',
        company: 'Move Travel & Mice',
        status: 'Aktif',
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=60&w=100"
    },
    {
        id: 'sys_customer',
        email: 'musteri@base44.com',
        password: 'Base44!',
        name: 'Demo Müşterisi',
        role: 'customer',
        phone: '-',
        company: 'Move Travel & Mice',
        status: 'Aktif',
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=60&w=100"
    }
];

export const useUserStore = create((set, get) => ({
    users: defaultUsers,
    companies: ['Move Travel & Mice'],
    isFirebaseInitialized: false,

    initFirestoreUsers: async () => {
        if (get().isFirebaseInitialized) return;
        set({ isFirebaseInitialized: true });
        
        try {
            const usersRef = collection(db, 'users');
            const snap = await getDocs(usersRef);
            
            // Seed if empty
            if (snap.empty) {
                for (const u of defaultUsers) {
                    await setDoc(doc(usersRef, u.id), u);
                }
            }
            
            // Listen
            onSnapshot(usersRef, (snapshot) => {
                const fetchedUsers = [];
                const fetchedCompanies = new Set();
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.company && data.company.includes('Base44')) {
                        updateDoc(doc(db, 'users', data.id), { company: 'Move Travel & Mice' }).catch(err => console.log(err));
                        data.company = 'Move Travel & Mice';
                    }
                    fetchedUsers.push(data);
                    if (data.company) fetchedCompanies.add(data.company);
                });

                set({ 
                    users: fetchedUsers,
                    companies: fetchedCompanies.size > 0 ? Array.from(fetchedCompanies) : ['Move Travel & Mice']
                });
            });
        } catch (e) {
            console.error("Firebase bağlanamadı, yerel veriler kullanılıyor", e);
        }
    },
    
    addUser: async (userObj) => {
        const role = userObj.role || 'customer';
        const newUserId = role + '_' + Date.now();
        const safeName = userObj.name ? encodeURIComponent(userObj.name) : 'User';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true`;
        
        const newUser = { 
            ...userObj, 
            id: newUserId, 
            role: role,
            status: 'Aktif',
            password: userObj.password || '123456',
            avatar: userObj.avatar || fallbackAvatar 
        };
        
        // Optimistic UI Update
        const currentUsers = get().users;
        set({ users: [newUser, ...currentUsers] });

        try {
            await setDoc(doc(db, 'users', newUserId), newUser);
        } catch (e) {
            console.error("User eklenemedi:", e);
        }
        return newUser;
    },

    updateUser: async (id, updatedData) => {
        const safeName = updatedData.name ? encodeURIComponent(updatedData.name) : 'User';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true`;
        
        const dataToUpdate = { ...updatedData };
        if (dataToUpdate.avatar === undefined && dataToUpdate.name) {
             dataToUpdate.avatar = fallbackAvatar;
        }

        try {
            await updateDoc(doc(db, 'users', id), dataToUpdate);
        } catch (e) {
            console.error("User guncellenemedi:", e);
        }
    },

    cleanLargeAvatars: async () => {
        // Firebase ile gerek kalmayabilir ancak mevcut state için:
        get().users.forEach(async (u) => {
             if (u.avatar && u.avatar.length > 50000 && u.avatar.startsWith('data:image')) {
                  const safeName = u.name ? encodeURIComponent(u.name) : 'User';
                  await updateDoc(doc(db, 'users', u.id), { avatar: `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true` });
             }
        });
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
        // Yalnızca state güncelleniyor, kullanıcı kaydolduğunda Firebase'e işlenecek
        if (!state.companies.includes(companyName)) {
            return { companies: [...state.companies, companyName] };
        }
        return state;
    }),

    findUserByEmail: (email) => {
        return get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
}));
