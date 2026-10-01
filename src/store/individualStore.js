import { create } from 'zustand';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  onSnapshot, 
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Pre-seeded Checklist Templates
export const DEFAULT_CHECKLIST_TEMPLATES = [
  {
    id: 'template_yurt_disi',
    title: 'Yurt Dışı Seyahati',
    category: 'Genel',
    description: 'Pasaport, vize, sigorta ve temel yurt dışı hazırlıkları',
    items: [
      'Pasaport kontrolü (En az 6 ay geçerlilik)',
      'Vize ve giriş evrakları kontrolü',
      'Uçak bileti & PNR kontrolü',
      'Otel rezervasyon belgesi çıktısı/kaydı',
      'Yurt dışı seyahat sağlık sigortası',
      'Havalimanı transfer planı',
      'Yurt dışı kullanımına açık kredi/banka kartı',
      'Hedef ülke para birimi (Nakit döviz)',
      'Operatör yurt dışı roaming paketi',
      'Priz dönüştürücü adaptör & Şarj cihazları',
      'Powerbank (Taşınabilir şarj aleti)',
      'Kişisel reçeteli ilaçlar & Temel ilk yardım kiti',
      'Bagaj kilo sınır kontrolü ve etiketleme',
      'Kimlik & ehliyet'
    ]
  },
  {
    id: 'template_plaj_tatili',
    title: 'Plaj & Deniz Tatili',
    category: 'Tatil',
    description: 'Yaz tatili ve deniz kıyısı seyahatleri için gerekenler',
    items: [
      'Güneş kremi (Yüksek koruma faktörlü)',
      'Mayo / Bikini / Şort',
      'Hızlı kuruyan plaj havlusu',
      'Güneş gözlüğü ve koruma kılıfı',
      'Şapka ve güneş siperliği',
      'Plaj terliği ve deniz ayakkabısı',
      'Deniz gözlüğü / Şnorkel',
      'Su geçirmez telefon kılıfı',
      'Güneş sonrası nemlendirici losyon',
      'Plaj çantası'
    ]
  },
  {
    id: 'template_is_seyahati',
    title: 'İş Seyahati',
    category: 'İş',
    description: 'Toplantı, konferans ve kurumsal münferit seyahatler',
    items: [
      'Dizüstü bilgisayar ve şarj adaptörü',
      'Sunum dosyaları ve dijital yedekler',
      'Kartvizitler',
      'Toplantı kıyafetleri & Takım elbise',
      'Kırışıklık önleyici giysi kılıfı',
      'Gürültü engelleyici kulaklık',
      'Not defteri ve kaliteli tükenmez kalem',
      'Taşınabilir sunum kumandası (Clicker)',
      'Şirket harcama kartı ve fatura bilgileri'
    ]
  },
  {
    id: 'template_hafta_sonu',
    title: 'Kısa Hafta Sonu Kaçamağı',
    category: 'Hafta Sonu',
    description: 'Hafif sırt çantası ile 2-3 günlük pratik seyahat',
    items: [
      'Kabin boy sırt çantası',
      '2 günlük yedek kıyafet kombini',
      'Rahat yürüyüş ayakkabısı',
      'Seyahat boy hijyen kiti (Diş fırçası, macun, şampuan)',
      'Hızlı şarj adaptörü & Kablo',
      'Hafif yağmurluk / Rüzgarlık',
      'Taşınabilir mini şemsiye'
    ]
  },
  {
    id: 'template_cocuklu_seyahat',
    title: 'Çocuklu Seyahat',
    category: 'Aile',
    description: 'Bebek veya çocukla yapılan konforlu ve güvenli seyahat',
    items: [
      'Çocuk kimlik kartı ve aşı/sağlık kartı',
      'Bol miktarda yedek kıyafet ve çorap',
      'Ateş düşürücü, termometre ve düzenli ilaçlar',
      'Islak mendil, bebek bezi ve alt açma örtüsü',
      'Sevdiği oyuncak, boyama kitabı ve masal kitabı',
      'Biberon, suluk ve sağlıklı yol atıştırmalıkları',
      'Hafif katlanabilir puset / Baston bebek arabası',
      'Güneş şapkası ve çocuk güneş kremi'
    ]
  }
];

export const useIndividualStore = create((set, get) => ({
  travels: [],
  checklists: [],
  budgets: [],
  expenses: [],
  invitations: [],
  isLoading: false,
  unsubscribers: [],

  // 1. Initialize streams for current individual user
  initUserStreams: (userId, userEmail) => {
    // Clean up previous listeners
    get().clearStreams();

    if (!userId) return;

    const unsubs = [];
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    // A. Travels Stream
    try {
      const travelsQuery = query(collection(db, 'individual_travels'), where('userId', '==', userId));
      const unsubTravels = onSnapshot(travelsQuery, (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort by start date ascending
        list.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
        set({ travels: list });
      }, (err) => console.error("Travels stream error:", err));
      unsubs.push(unsubTravels);
    } catch (e) {
      console.error("Travels query init error:", e);
    }

    // B. Checklists Stream
    try {
      const checklistsQuery = query(collection(db, 'user_checklists'), where('userId', '==', userId));
      const unsubChecklists = onSnapshot(checklistsQuery, (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        set({ checklists: list });
      }, (err) => console.error("Checklists stream error:", err));
      unsubs.push(unsubChecklists);
    } catch (e) {
      console.error("Checklists query init error:", e);
    }

    // C. Budgets Stream (Owner OR Member)
    try {
      const budgetsRef = collection(db, 'travel_budgets');
      const unsubBudgets = onSnapshot(budgetsRef, (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const isOwner = data.userId === userId;
          const isMember = Array.isArray(data.members) && data.members.some(
            m => m.userId === userId || (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail)
          );
          if (isOwner || isMember) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        set({ budgets: list });
      }, (err) => console.error("Budgets stream error:", err));
      unsubs.push(unsubBudgets);
    } catch (e) {
      console.error("Budgets query init error:", e);
    }

    // D. Expenses Stream
    try {
      const expensesRef = collection(db, 'budget_expenses');
      const unsubExpenses = onSnapshot(expensesRef, (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        set({ expenses: list });
      }, (err) => console.error("Expenses stream error:", err));
      unsubs.push(unsubExpenses);
    } catch (e) {
      console.error("Expenses query init error:", e);
    }

    // E. Invitations Stream (Sent or Received)
    try {
      const invRef = collection(db, 'budget_invitations');
      const unsubInv = onSnapshot(invRef, (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.inviterId === userId || (cleanEmail && data.inviteeEmail && data.inviteeEmail.toLowerCase() === cleanEmail)) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        set({ invitations: list });
      }, (err) => console.error("Invitations stream error:", err));
      unsubs.push(unsubInv);
    } catch (e) {
      console.error("Invitations query init error:", e);
    }

    set({ unsubscribers: unsubs });
  },

  clearStreams: () => {
    const { unsubscribers } = get();
    unsubscribers.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    set({ unsubscribers: [], travels: [], checklists: [], budgets: [], expenses: [], invitations: [] });
  },

  // ==========================================
  // TRAVEL ACTIONS
  // ==========================================
  addTravel: async (travelData) => {
    const travelId = 'travel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newTravel = {
      id: travelId,
      ...travelData,
      createdAt: new Date().toISOString()
    };

    // Her yeni seyahat için otomatik seyahat bütçesi oluştur
    const budgetId = 'bgt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const autoBudget = {
      id: budgetId,
      title: newTravel.title || 'Seyahat Bütçesi',
      travelId: travelId,
      totalBudget: 0,
      currency: 'TRY',
      userId: newTravel.userId || 'guest_user',
      members: [
        {
          userId: newTravel.userId || 'guest_user',
          name: travelData.userName || 'Ben',
          email: (travelData.userEmail || '').toLowerCase(),
          role: 'owner',
          status: 'accepted'
        }
      ],
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update for both travel and its budget
    set(state => ({
      travels: [...state.travels, newTravel],
      budgets: [...state.budgets, autoBudget]
    }));

    try {
      await Promise.all([
        setDoc(doc(db, 'individual_travels', travelId), newTravel),
        setDoc(doc(db, 'travel_budgets', budgetId), autoBudget)
      ]);
      return { ...newTravel, budgetId };
    } catch (e) {
      console.error("Travel & Auto-Budget save error:", e);
      throw e;
    }
  },

  ensureTravelBudgets: async (currentUser) => {
    const { travels, budgets } = get();
    if (!travels || travels.length === 0) return;

    for (const travel of travels) {
      const existing = budgets.find(b => b.travelId === travel.id || (b.title === travel.title && (!b.travelId || b.travelId === travel.id)));
      if (existing) {
        if (!existing.travelId) {
          existing.travelId = travel.id;
          setDoc(doc(db, 'travel_budgets', existing.id), { travelId: travel.id }, { merge: true }).catch(console.error);
        }
        continue;
      }

      // Check Firestore directly before creating to prevent duplicate creation
      try {
        const q = query(collection(db, 'travel_budgets'), where('travelId', '==', travel.id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          continue; // Already exists in Firestore
        }
      } catch (err) {
        console.warn("ensureTravelBudgets Firestore check skipped:", err);
      }

      const budgetId = 'bgt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const autoBudget = {
        id: budgetId,
        title: travel.title || 'Seyahat Bütçesi',
        travelId: travel.id,
        totalBudget: 0,
        currency: 'TRY',
        userId: currentUser?.id || travel.userId || 'guest_user',
        members: [
          {
            userId: currentUser?.id || travel.userId || 'guest_user',
            name: currentUser?.name || 'Ben',
            email: (currentUser?.email || '').toLowerCase(),
            role: 'owner',
            status: 'accepted'
          }
        ],
        createdAt: new Date().toISOString()
      };

      set(state => ({
        budgets: [...state.budgets, autoBudget]
      }));

      try {
        await setDoc(doc(db, 'travel_budgets', budgetId), autoBudget);
      } catch (err) {
        console.error("Auto budget creation error for travel:", travel.id, err);
      }
    }
  },

  updateTravel: async (travelId, updateData) => {
    set(state => ({
      travels: state.travels.map(t => t.id === travelId ? { ...t, ...updateData } : t),
      budgets: updateData.title 
        ? state.budgets.map(b => b.travelId === travelId ? { ...b, title: updateData.title } : b)
        : state.budgets
    }));

    try {
      await setDoc(doc(db, 'individual_travels', travelId), updateData, { merge: true });
      if (updateData.title) {
        const relatedBudget = get().budgets.find(b => b.travelId === travelId);
        if (relatedBudget) {
          await setDoc(doc(db, 'travel_budgets', relatedBudget.id), { title: updateData.title }, { merge: true });
        }
      }
    } catch (e) {
      console.error("Travel update error:", e);
      throw e;
    }
  },

  deleteTravel: async (travelId) => {
    const relatedBudget = get().budgets.find(b => b.travelId === travelId);
    set(state => ({
      travels: state.travels.filter(t => t.id !== travelId),
      budgets: state.budgets.filter(b => b.travelId !== travelId),
      expenses: relatedBudget ? state.expenses.filter(e => e.budgetId !== relatedBudget.id) : state.expenses
    }));

    try {
      await deleteDoc(doc(db, 'individual_travels', travelId));
      if (relatedBudget) {
        await deleteDoc(doc(db, 'travel_budgets', relatedBudget.id));
        const expQuery = query(collection(db, 'budget_expenses'), where('budgetId', '==', relatedBudget.id));
        const snap = await getDocs(expQuery);
        snap.forEach(d => deleteDoc(d.ref).catch(console.error));
      }
    } catch (e) {
      console.error("Travel delete error:", e);
      throw e;
    }
  },

  // ==========================================
  // CHECKLIST ACTIONS
  // ==========================================
  createChecklist: async (checklistData) => {
    const listId = 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newList = {
      id: listId,
      ...checklistData,
      items: (checklistData.items || []).map((text, idx) => ({
        id: 'item_' + Date.now() + '_' + idx,
        text: typeof text === 'string' ? text : text.text,
        completed: typeof text === 'object' ? Boolean(text.completed) : false,
        order: idx
      })),
      createdAt: new Date().toISOString()
    };

    set(state => ({ checklists: [...state.checklists, newList] }));

    try {
      await setDoc(doc(db, 'user_checklists', listId), newList);
      return newList;
    } catch (e) {
      console.error("Checklist create error:", e);
      throw e;
    }
  },

  createFromTemplate: async (template, userId, travelId = null) => {
    const listId = 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newList = {
      id: listId,
      userId,
      travelId: travelId || null,
      title: template.title,
      category: template.category || 'Genel',
      items: template.items.map((itemText, idx) => ({
        id: 'item_' + Date.now() + '_' + idx,
        text: itemText,
        completed: false,
        order: idx
      })),
      createdAt: new Date().toISOString()
    };

    set(state => ({ checklists: [...state.checklists, newList] }));

    try {
      await setDoc(doc(db, 'user_checklists', listId), newList);
      return newList;
    } catch (e) {
      console.error("Template checklist create error:", e);
      throw e;
    }
  },

  toggleChecklistItem: async (checklistId, itemId) => {
    const currentList = get().checklists.find(c => c.id === checklistId);
    if (!currentList) return;

    const updatedItems = currentList.items.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    set(state => ({
      checklists: state.checklists.map(c => c.id === checklistId ? { ...c, items: updatedItems } : c)
    }));

    try {
      await setDoc(doc(db, 'user_checklists', checklistId), { items: updatedItems }, { merge: true });
    } catch (e) {
      console.error("Checklist item toggle error:", e);
    }
  },

  addChecklistItem: async (checklistId, text) => {
    if (!text || !text.trim()) return;
    const currentList = get().checklists.find(c => c.id === checklistId);
    if (!currentList) return;

    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      text: text.trim(),
      completed: false,
      order: (currentList.items || []).length
    };

    const updatedItems = [...(currentList.items || []), newItem];

    set(state => ({
      checklists: state.checklists.map(c => c.id === checklistId ? { ...c, items: updatedItems } : c)
    }));

    try {
      await setDoc(doc(db, 'user_checklists', checklistId), { items: updatedItems }, { merge: true });
    } catch (e) {
      console.error("Checklist item add error:", e);
    }
  },

  deleteChecklistItem: async (checklistId, itemId) => {
    const currentList = get().checklists.find(c => c.id === checklistId);
    if (!currentList) return;

    const updatedItems = currentList.items.filter(item => item.id !== itemId);

    set(state => ({
      checklists: state.checklists.map(c => c.id === checklistId ? { ...c, items: updatedItems } : c)
    }));

    try {
      await setDoc(doc(db, 'user_checklists', checklistId), { items: updatedItems }, { merge: true });
    } catch (e) {
      console.error("Checklist item delete error:", e);
    }
  },

  deleteChecklist: async (checklistId) => {
    set(state => ({
      checklists: state.checklists.filter(c => c.id !== checklistId)
    }));

    try {
      await deleteDoc(doc(db, 'user_checklists', checklistId));
    } catch (e) {
      console.error("Checklist delete error:", e);
      throw e;
    }
  },

  toggleAllChecklistItems: async (checklistId, completed = true) => {
    const currentList = get().checklists.find(c => c.id === checklistId);
    if (!currentList) return;

    const updatedItems = (currentList.items || []).map(item => ({
      ...item,
      completed
    }));

    set(state => ({
      checklists: state.checklists.map(c => c.id === checklistId ? { ...c, items: updatedItems } : c)
    }));

    try {
      await setDoc(doc(db, 'user_checklists', checklistId), { items: updatedItems }, { merge: true });
    } catch (e) {
      console.error("Toggle all items error:", e);
    }
  },

  duplicateChecklist: async (checklistId, userId) => {
    const currentList = get().checklists.find(c => c.id === checklistId);
    if (!currentList) return;

    const newListId = 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const duplicated = {
      ...currentList,
      id: newListId,
      userId: userId || currentList.userId,
      title: `${currentList.title} (Kopya)`,
      items: (currentList.items || []).map((item, idx) => ({
        id: 'item_' + Date.now() + '_' + idx,
        text: item.text,
        completed: false,
        order: idx
      })),
      createdAt: new Date().toISOString()
    };

    set(state => ({ checklists: [...state.checklists, duplicated] }));

    try {
      await setDoc(doc(db, 'user_checklists', newListId), duplicated);
      return duplicated;
    } catch (e) {
      console.error("Duplicate checklist error:", e);
    }
  },

  // ==========================================
  // BUDGET & EXPENSES ACTIONS
  // ==========================================
  createBudget: async (budgetData, ownerUser) => {
    const budgetId = 'bgt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newBudget = {
      id: budgetId,
      ...budgetData,
      totalBudget: Number(budgetData.totalBudget) || 0,
      currency: budgetData.currency || 'TRY',
      members: [
        {
          userId: ownerUser.id,
          name: ownerUser.name,
          email: (ownerUser.email || '').toLowerCase(),
          role: 'owner',
          status: 'accepted'
        }
      ],
      createdAt: new Date().toISOString()
    };

    set(state => ({ budgets: [...state.budgets, newBudget] }));

    try {
      await setDoc(doc(db, 'travel_budgets', budgetId), newBudget);
      return newBudget;
    } catch (e) {
      console.error("Budget create error:", e);
      throw e;
    }
  },

  updateBudget: async (budgetId, data) => {
    set(state => ({
      budgets: state.budgets.map(b => b.id === budgetId ? { ...b, ...data } : b)
    }));

    try {
      await setDoc(doc(db, 'travel_budgets', budgetId), data, { merge: true });
    } catch (e) {
      console.error("Budget update error:", e);
      throw e;
    }
  },

  deleteBudget: async (budgetId) => {
    set(state => ({
      budgets: state.budgets.filter(b => b.id !== budgetId),
      expenses: state.expenses.filter(e => e.budgetId !== budgetId)
    }));

    try {
      await deleteDoc(doc(db, 'travel_budgets', budgetId));
      // Delete attached expenses
      const expQuery = query(collection(db, 'budget_expenses'), where('budgetId', '==', budgetId));
      const snap = await getDocs(expQuery);
      snap.forEach(d => deleteDoc(d.ref).catch(console.error));
    } catch (e) {
      console.error("Budget delete error:", e);
      throw e;
    }
  },

  addExpense: async (expenseData) => {
    const expenseId = 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newExpense = {
      id: expenseId,
      ...expenseData,
      amount: Number(expenseData.amount) || 0,
      date: expenseData.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    };

    set(state => ({ expenses: [...state.expenses, newExpense] }));

    try {
      await setDoc(doc(db, 'budget_expenses', expenseId), newExpense);
      return newExpense;
    } catch (e) {
      console.error("Expense add error:", e);
      throw e;
    }
  },

  updateExpense: async (expenseId, updateData) => {
    set(state => ({
      expenses: state.expenses.map(e => e.id === expenseId ? { ...e, ...updateData } : e)
    }));

    try {
      await updateDoc(doc(db, 'budget_expenses', expenseId), updateData);
    } catch (e) {
      console.error("Expense update error:", e);
      throw e;
    }
  },

  deleteExpense: async (expenseId) => {
    set(state => ({
      expenses: state.expenses.filter(e => e.id !== expenseId)
    }));

    try {
      await deleteDoc(doc(db, 'budget_expenses', expenseId));
    } catch (e) {
      console.error("Expense delete error:", e);
      throw e;
    }
  },

  // ==========================================
  // SHARED BUDGET INVITATIONS & SETTLEMENT
  // ==========================================
  createBudgetInvitation: async ({ budgetId, travelTitle, inviterUser, inviteeEmail }) => {
    const cleanEmail = (inviteeEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Geçerli bir davetli e-posta adresi girin.');
    }

    const token = 'inv_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = {
      id: token,
      token,
      budgetId,
      travelTitle: travelTitle || 'Seyahat Bütçesi',
      inviterId: inviterUser.id,
      inviterName: inviterUser.name,
      inviterEmail: (inviterUser.email || '').toLowerCase(),
      inviteeEmail: cleanEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    set(state => ({ invitations: [...state.invitations, invitation] }));

    try {
      await setDoc(doc(db, 'budget_invitations', token), invitation);
      return invitation;
    } catch (e) {
      console.error("Invitation create error:", e);
      throw e;
    }
  },

  acceptInvitation: async (token, acceptingUser) => {
    try {
      const invRef = doc(db, 'budget_invitations', token);
      const invSnap = await getDoc(invRef);

      if (!invSnap.exists()) {
        throw new Error('Davet bağlantısı geçersiz veya bulunamadı.');
      }

      const invData = invSnap.data();
      if (invData.status === 'accepted') {
        return { success: true, message: 'Bu davet zaten kabul edilmiş.', budgetId: invData.budgetId };
      }

      if (new Date() > new Date(invData.expiresAt)) {
        throw new Error('Bu davet bağlantısının süresi dolmuştur.');
      }

      // 1. Update invitation status
      await setDoc(invRef, { status: 'accepted', acceptedAt: new Date().toISOString() }, { merge: true });

      // 2. Add user to budget members
      const budgetRef = doc(db, 'travel_budgets', invData.budgetId);
      const budgetSnap = await getDoc(budgetRef);

      if (budgetSnap.exists()) {
        const bData = budgetSnap.data();
        const existingMembers = bData.members || [];
        const isAlreadyMember = existingMembers.some(
          m => m.userId === acceptingUser.id || m.email?.toLowerCase() === acceptingUser.email?.toLowerCase()
        );

        if (!isAlreadyMember) {
          const updatedMembers = [
            ...existingMembers,
            {
              userId: acceptingUser.id,
              name: acceptingUser.name,
              email: (acceptingUser.email || '').toLowerCase(),
              role: 'member',
              status: 'accepted'
            }
          ];
          await setDoc(budgetRef, { members: updatedMembers }, { merge: true });
        }
      }

      return { success: true, budgetId: invData.budgetId };
    } catch (e) {
      console.error("Accept invitation error:", e);
      throw e;
    }
  },

  // Calculate settlement matrix for a budget
  calculateSettlement: (budgetId) => {
    const budget = get().budgets.find(b => b.id === budgetId);
    if (!budget) return { netBalances: {}, settlements: [] };

    const budgetExpenses = get().expenses.filter(e => e.budgetId === budgetId);
    const members = budget.members || [];

    // netBalances: { [name or id]: number (positive = to receive, negative = owes) }
    const netBalances = {};
    members.forEach(m => {
      netBalances[m.name] = 0;
    });

    budgetExpenses.forEach(exp => {
      const payerName = exp.paidByName || (exp.paidBy?.name) || 'Bilinmeyen';
      const amount = Number(exp.amount) || 0;

      if (netBalances[payerName] === undefined) {
        netBalances[payerName] = 0;
      }
      netBalances[payerName] += amount;

      // Deduct shares
      if (exp.splitType === 'custom' && Array.isArray(exp.splits) && exp.splits.length > 0) {
        exp.splits.forEach(s => {
          const sName = s.name || s.userName;
          if (netBalances[sName] === undefined) netBalances[sName] = 0;
          netBalances[sName] -= (Number(s.amount) || 0);
        });
      } else {
        // Equal split among all budget members
        const activeMembers = (exp.participants && exp.participants.length > 0) 
          ? exp.participants 
          : members.map(m => m.name);

        const share = amount / (activeMembers.length || 1);
        activeMembers.forEach(mName => {
          if (netBalances[mName] === undefined) netBalances[mName] = 0;
          netBalances[mName] -= share;
        });
      }
    });

    // Simplify debts (settlement algorithms)
    const debtors = [];
    const creditors = [];

    Object.entries(netBalances).forEach(([name, balance]) => {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ name, amount: -rounded });
      } else if (rounded > 0.01) {
        creditors.push({ name, amount: rounded });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const minAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(minAmount * 100) / 100,
        currency: budget.currency || 'TRY'
      });

      debtor.amount -= minAmount;
      creditor.amount -= minAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return {
      netBalances,
      settlements
    };
  }
}));
