import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizePhoneNumber, toTurkishTitleCase, normalizeTurkishTitleCase, normalizeEmail, getCurrentSessionUser, isStaffSessionUser, isRelatedFamilyOrSelf } from '../utils/userUtils';
import { getApiBaseUrl } from '../utils/apiConfig';
import { useAuthStore } from './authStore';

const defaultUsers = [];

export const formatTitleCase = (str) => normalizeTurkishTitleCase(str);

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
    _unsubscribe: null,
    _activeSessionKey: null,

    resetUsers: () => {
        const unsub = get()._unsubscribe;
        if (typeof unsub === 'function') {
            try { unsub(); } catch (e) {}
        }
        set({ users: [], isFirebaseInitialized: false, _unsubscribe: null, _activeSessionKey: null });
    },

    initFirestoreUsers: async (forceRestart = false) => {
        const sessionUser = getCurrentSessionUser();
        if (!sessionUser) {
            get().resetUsers();
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
            const baseUrl = getApiBaseUrl();
            let token = useAuthStore.getState().token;
            if (!token) {
                await useAuthStore.getState().refreshTokenIfNeeded();
                token = useAuthStore.getState().token;
            }

            const res = await fetch(`${baseUrl}/api/users/list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ token })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.users)) {
                    const fetchedUsers = [];
                    const fetchedCompanies = new Set();
                    data.users.forEach(userRecord => {
                        const rawCompany = userRecord.company ? String(userRecord.company).trim() : '';
                        const cleanCompany = rawCompany ? formatTitleCase(rawCompany) : '';
                        const formatted = {
                            ...userRecord,
                            name: formatTitleCase(userRecord.name || ''),
                            email: normalizeEmail(userRecord.email || ''),
                            phone: normalizePhoneNumber(userRecord.phone || ''),
                            company: cleanCompany || ((userRecord.role || 'customer') === 'customer' ? 'Bireysel' : 'Move Travel & Mice')
                        };
                        fetchedUsers.push(formatted);
                        if (cleanCompany && !cleanCompany.toLowerCase().includes('tgundogan')) {
                            fetchedCompanies.add(cleanCompany);
                        }
                    });

                    const cleanCompanyList = Array.from(fetchedCompanies).filter(c => c && !c.toLowerCase().includes('tgundogan'));
                    set({ 
                        users: fetchedUsers,
                        companies: cleanCompanyList.length > 0 ? cleanCompanyList : ['Move Travel & Mice']
                    });
                }
            }
        } catch (e) {
            console.warn("Kullanıcı listesi API üzerinden alınamadı:", e);
        }
    },
    
    addUser: async (userObj) => {
        const normalizedName = formatTitleCase(userObj.name || '');
        const normalizedEmail = (userObj.email || '').trim().toLowerCase();
        const role = userObj.role || 'customer';
        const cleanPhone = userObj.phone ? normalizePhoneNumber(userObj.phone) : '-';

        // Check if user already exists (by email if real email, or by tcNo)
        const currentUsers = get().users || [];
        const isChild = Boolean(userObj.isChildProfile || normalizedEmail.startsWith('child_') || normalizedEmail.startsWith('cocuk_'));
        
        let existingUser = null;
        if (!isChild && normalizedEmail && !normalizedEmail.endsWith('@move.local')) {
            existingUser = currentUsers.find(u => u.email && u.email.trim().toLowerCase() === normalizedEmail);
        }
        if (!existingUser && userObj.tcNo && String(userObj.tcNo).length === 11) {
            existingUser = currentUsers.find(u => u.tcNo === String(userObj.tcNo));
        }

        const rawComp = userObj.company || (role === 'customer' ? 'Bireysel' : 'Move Travel & Mice');
        const normalizedCompany = formatTitleCase(rawComp);

        if (existingUser) {
            const updates = {};
            if (userObj.company && userObj.company !== 'Move Travel & Mice' && existingUser.company === 'Move Travel & Mice') {
                updates.company = normalizedCompany;
            }
            if (cleanPhone !== '-' && (!existingUser.phone || existingUser.phone === '-')) {
                updates.phone = cleanPhone;
            }
            if (userObj.tcNo && !existingUser.tcNo) {
                updates.tcNo = userObj.tcNo;
            }
            if (userObj.passportNo && !existingUser.passportNo) updates.passportNo = userObj.passportNo;
            if (userObj.passportExp && !existingUser.passportExp) updates.passportExp = userObj.passportExp;
            if (userObj.birthDate && !existingUser.birthDate) updates.birthDate = userObj.birthDate;
            if (userObj.gender && !existingUser.gender) updates.gender = userObj.gender;
            if (userObj.title && !existingUser.title) updates.title = userObj.title;
            if (Object.keys(updates).length > 0) {
                await get().updateUser(existingUser.id, updates);
                return { ...existingUser, ...updates };
            }
            return existingUser;
        }

        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const newUserId = role + '_' + Date.now() + '_' + randomSuffix;
        const safeName = normalizedName ? encodeURIComponent(normalizedName) : 'User';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true`;
        
        const newUser = { 
            ...userObj, 
            name: normalizedName,
            id: newUserId, 
            role: role,
            userType: userObj.userType || (isChild ? 'child' : 'corporate'),
            company: normalizedCompany,
            status: 'Aktif',
            phone: cleanPhone,
            email: normalizedEmail,
            password: userObj.password ? String(userObj.password).trim() : '123456',
            avatar: userObj.avatar || fallbackAvatar,
            isChildProfile: isChild,
            tcNo: userObj.tcNo || '',
            passportNo: userObj.passportNo || '',
            passportExp: userObj.passportExp || '',
            birthDate: userObj.birthDate || '',
            gender: userObj.gender || '',
            title: userObj.title || ''
        };
        
        // Optimistic UI Update
        set({ users: [newUser, ...currentUsers.filter(u => u.id !== newUserId)] });

        try {
            const baseUrl = getApiBaseUrl();
            let token = useAuthStore.getState().token;
            if (!token) {
                await useAuthStore.getState().refreshTokenIfNeeded();
                token = useAuthStore.getState().token;
            }
            await fetch(`${baseUrl}/api/users/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ token, user: newUser })
            });
        } catch (e) {
            console.error("User eklenemedi:", e);
        }
        return newUser;
    },

    updateUser: async (id, updatedData) => {
        const authUser = useAuthStore.getState()?.user;
        const isStaffCaller = isStaffSessionUser(authUser);

        const dataToUpdate = {};
        Object.keys(updatedData).forEach(k => {
            if (updatedData[k] !== undefined) {
                dataToUpdate[k] = updatedData[k];
            }
        });

        // Yetkisiz rol yükseltmeyi (Privilege Escalation) engelle:
        // Personel olmayan kullanıcılar role veya secondaryRole alanlarını değiştiremez
        if (!isStaffCaller) {
            delete dataToUpdate.role;
            delete dataToUpdate.secondaryRole;
        }

        if (dataToUpdate.name) {
            dataToUpdate.name = formatTitleCase(dataToUpdate.name);
        }

        if (dataToUpdate.company) {
            dataToUpdate.company = formatTitleCase(dataToUpdate.company);
        }

        if (dataToUpdate.phone) {
            dataToUpdate.phone = normalizePhoneNumber(dataToUpdate.phone);
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

        // Oturum açmış personel olmayan kullanıcı yalnızca kendi veya ailesinin kaydını güncelleyebilir
        if (authUser && !isStaffCaller) {
            const targetRecord = existing || { id: targetId, email: normalizedEmail };
            if (!isRelatedFamilyOrSelf(targetRecord, authUser)) {
                console.warn("Yetkisiz kullanıcı güncelleme girişimi engellendi.");
                return;
            }
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
                const currentAuthUser = authState.user;
                if ((targetId && currentAuthUser.id === targetId) || (normalizedEmail && currentAuthUser.email?.toLowerCase() === normalizedEmail)) {
                    const { password: _ignoredPass, ...safeSyncData } = dataToUpdate;
                    useAuthStore.setState({ user: { ...currentAuthUser, ...safeSyncData } });
                }
            }
        } catch (e) {}

        // Persist to Server API
        try {
            if (targetId) {
                const baseUrl = getApiBaseUrl();
                let token = useAuthStore.getState().token;
                if (!token) {
                    await useAuthStore.getState().refreshTokenIfNeeded();
                    token = useAuthStore.getState().token;
                }
                await fetch(`${baseUrl}/api/users/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({ token, user: { ...dataToUpdate, id: targetId } })
                });
                
                // Automatically sync participant details and tour experts if email, name, phone, avatar or password changed
                if (dataToUpdate.email || dataToUpdate.name || dataToUpdate.phone || dataToUpdate.avatar || dataToUpdate.password) {
                    try {
                        const toursRef = collection(db, 'tours');
                        const toursSnap = await getDocs(toursRef);
                        for (const tDoc of toursSnap.docs) {
                            const tData = tDoc.data();
                            const parts = tData.participants || [];
                            let updated = false;
                            const tourUpdates = {};

                            const newParts = parts.map(p => {
                                const isTargetParticipant = (targetId && p.id === targetId) ||
                                    (existing?.tcNo && p.tcNo && String(p.tcNo).replace(/\D/g, '') === String(existing.tcNo).replace(/\D/g, '')) ||
                                    (existing?.email && p.email && p.email.toLowerCase() === existing.email.toLowerCase()) ||
                                    (existing?.name && p.name && normalizeTurkishTitleCase(p.name) === normalizeTurkishTitleCase(existing.name));

                                if (isTargetParticipant) {
                                    updated = true;
                                    return {
                                        ...p,
                                        email: dataToUpdate.email !== undefined ? dataToUpdate.email : p.email,
                                        name: dataToUpdate.name || p.name,
                                        phone: dataToUpdate.phone !== undefined ? dataToUpdate.phone : p.phone,
                                        password: dataToUpdate.password !== undefined ? dataToUpdate.password : p.password
                                    };
                                }
                                return p;
                            });
                            if (updated) tourUpdates.participants = newParts;

                            // Sync assigned tour.expert
                            if (tData.expert && (tData.expert.id === targetId || (existing?.email && tData.expert.email?.toLowerCase() === existing.email.toLowerCase()))) {
                                tourUpdates.expert = {
                                    ...tData.expert,
                                    name: dataToUpdate.name || tData.expert.name,
                                    phone: dataToUpdate.phone !== undefined ? dataToUpdate.phone : tData.expert.phone,
                                    email: dataToUpdate.email !== undefined ? dataToUpdate.email : tData.expert.email,
                                    avatar: dataToUpdate.avatar || tData.expert.avatar
                                };
                            }

                            // Sync assigned tour.expert2
                            if (tData.expert2 && (tData.expert2.id === targetId || (existing?.email && tData.expert2.email?.toLowerCase() === existing.email.toLowerCase()))) {
                                tourUpdates.expert2 = {
                                    ...tData.expert2,
                                    name: dataToUpdate.name || tData.expert2.name,
                                    phone: dataToUpdate.phone !== undefined ? dataToUpdate.phone : tData.expert2.phone,
                                    email: dataToUpdate.email !== undefined ? dataToUpdate.email : tData.expert2.email,
                                    avatar: dataToUpdate.avatar || tData.expert2.avatar
                                };
                            }

                            if (Object.keys(tourUpdates).length > 0) {
                                await updateDoc(tDoc.ref, tourUpdates);
                            }
                        }

                        // Also sync local useTourStore state in memory for immediate UI responsiveness
                        try {
                            const tourStoreMod = await import('./tourStore.js');
                            if (tourStoreMod?.useTourStore) {
                                tourStoreMod.useTourStore.setState(state => ({
                                    tours: (state.tours || []).map(t => {
                                        const parts = t.participants || [];
                                        let modified = false;
                                        const updatedParts = parts.map(p => {
                                            const isTarget = (targetId && p.id === targetId) ||
                                                (existing?.tcNo && p.tcNo && String(p.tcNo).replace(/\D/g, '') === String(existing.tcNo).replace(/\D/g, '')) ||
                                                (existing?.email && p.email && p.email.toLowerCase() === existing.email.toLowerCase()) ||
                                                (existing?.name && p.name && normalizeTurkishTitleCase(p.name) === normalizeTurkishTitleCase(existing.name));
                                            if (isTarget) {
                                                modified = true;
                                                return {
                                                    ...p,
                                                    ...(dataToUpdate.email !== undefined ? { email: dataToUpdate.email } : {}),
                                                    ...(dataToUpdate.name !== undefined ? { name: dataToUpdate.name } : {}),
                                                    ...(dataToUpdate.phone !== undefined ? { phone: dataToUpdate.phone } : {}),
                                                    ...(dataToUpdate.password !== undefined ? { password: dataToUpdate.password } : {})
                                                };
                                            }
                                            return p;
                                        });
                                        return modified ? { ...t, participants: updatedParts } : t;
                                    })
                                }));
                            }
                        } catch (e) {}
                    } catch (tourSyncErr) {
                        console.warn("Tour participants & experts auto-sync error:", tourSyncErr);
                    }
                }
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
        const authUser = useAuthStore.getState()?.user;
        if (!isStaffSessionUser(authUser)) {
            console.warn("Yetkisiz kullanıcı silme girişimi engellendi.");
            return;
        }
        // Optimistic delete
        const currentUsers = get().users;
        set({ users: currentUsers.filter(u => u.id !== id) });
        
        try {
            const baseUrl = getApiBaseUrl();
            let token = useAuthStore.getState().token;
            if (!token) {
                await useAuthStore.getState().refreshTokenIfNeeded();
                token = useAuthStore.getState().token;
            }
            await fetch(`${baseUrl}/api/users/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ token, id })
            });
        } catch (e) {
            console.error("Kullanici silinemedi:", e);
        }
    },

    addCompany: (companyName) => set((state) => {
        if (!companyName || String(companyName).toLowerCase().includes('tgundogan')) return state;
        const cleanComp = formatTitleCase(companyName);
        if (!state.companies.includes(cleanComp)) {
            return { companies: [...state.companies, cleanComp] };
        }
        return state;
    }),

    findUserByEmail: (identifier) => {
        if (!identifier) return null;
        const clean = normalizeEmail(identifier);
        const cleanDigits = String(identifier).replace(/\D/g, '');
        return get().users.find(u => {
            if (u.email && normalizeEmail(u.email) === clean) return true;
            if (cleanDigits.length >= 10) {
                const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
                if (uPhoneDigits.length >= 10 && (uPhoneDigits.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(uPhoneDigits.slice(-10)))) return true;
                const uEmailDigits = (u.email || '').replace(/\D/g, '');
                if (uEmailDigits.length >= 10 && uEmailDigits.includes(cleanDigits.slice(-10))) return true;
            }
            if (cleanDigits.length === 11) {
                const uTc = String(u.tcNo || u.tc || '').replace(/\D/g, '');
                if (uTc && uTc === cleanDigits) return true;
            }
            return false;
        });
    }
}));
