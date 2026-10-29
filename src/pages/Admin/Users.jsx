import React, { useState, useRef, useMemo, useEffect } from 'react';
import Header from '../../components/Header';
import { 
  Users as UsersIcon, 
  UserPlus, 
  ShieldAlert, 
  MoreVertical, 
  Briefcase, 
  Mail, 
  X, 
  Camera, 
  CheckCircle2, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  PlaneTakeoff,
  Phone,
  Filter,
  Check,
  Building2,
  Lock,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff,
  Luggage,
  CheckSquare,
  Wallet,
  Calendar,
  ShieldCheck,
  Baby
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore, formatTitleCase } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore, isUserAdmin } from '../../store/authStore';
import { normalizePhoneNumber, formatPhoneInputWithoutPrefix, checkEmailDomainTypo, toTurkishTitleCase, normalizeTurkishTitleCase } from '../../utils/userUtils';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('expert');
  const [searchQuery, setSearchQuery] = useState('');
  const allUsers = useUserStore(state => state.users) || [];
  const addUser = useUserStore(state => state.addUser);
  const updateUser = useUserStore(state => state.updateUser);
  const deleteUser = useUserStore(state => state.deleteUser);
  const currentUser = useAuthStore(state => state.user);

  const isUserChild = (u) => {
      const fullUser = allUsers.find(usr => usr.id === u.id) || u;
      if (!fullUser) return false;

      const isParent = allUsers.some(other => {
          if (!other.linkedTo) return false;
          if (Array.isArray(other.linkedTo)) return other.linkedTo.includes(fullUser.id) || other.linkedTo.includes(String(fullUser.id));
          if (typeof other.linkedTo === 'string') return other.linkedTo === String(fullUser.id);
          return false;
      });
      if (isParent) return false;

      if (fullUser.isChildProfile === true) return true;
      if (fullUser.email && fullUser.email.startsWith('child_')) return true;

      const lt = fullUser.linkedTo;
      if (Array.isArray(lt)) return lt.length > 0;
      if (typeof lt === 'string') {
          const val = lt.trim().toLowerCase();
          return val !== '' && val !== 'null' && val !== 'undefined' && val !== '[]' && val !== '-';
      }

      return false;
  };

  const getChildParents = (childUser) => {
      if (!childUser) return [];
      const parentIds = new Set();
      const lt = childUser.linkedTo;
      if (Array.isArray(lt)) {
          lt.forEach(id => { if (id && String(id).trim()) parentIds.add(String(id).trim()); });
      } else if (typeof lt === 'string' && lt.trim() && lt !== 'null' && lt !== 'undefined' && lt !== '[]' && lt !== '-') {
          try {
              const parsed = JSON.parse(lt);
              if (Array.isArray(parsed)) parsed.forEach(id => { if (id && String(id).trim()) parentIds.add(String(id).trim()); });
              else if (parsed) parentIds.add(String(parsed).trim());
          } catch (e) {
              lt.split(',').forEach(id => { if (id.trim()) parentIds.add(id.trim()); });
          }
      }
      allUsers.forEach(u => {
          if (u.id === childUser.id) return;
          const uLt = u.linkedTo;
          let includesChild = false;
          if (Array.isArray(uLt)) includesChild = uLt.includes(childUser.id) || uLt.includes(String(childUser.id));
          else if (typeof uLt === 'string') includesChild = uLt.includes(childUser.id) || uLt.includes(String(childUser.id));
          if (includesChild) parentIds.add(String(u.id));
      });
      return Array.from(parentIds).map(id => allUsers.find(u => String(u.id) === String(id))).filter(Boolean);
  };

  const [selectedIndividualSummary, setSelectedIndividualSummary] = useState(null);
  const [individualSummaryData, setIndividualSummaryData] = useState({ loading: false, travels: [], checklists: [], budgets: [] });

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    role: 'expert', 
    userType: 'corporate', 
    avatar: null, 
    password: '', 
    currentPassword: '',
    phone: '', 
    company: '', 
    parentIds: [], 
    childrenIds: [], 
    tcNo: '' 
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [revealedCardPasswords, setRevealedCardPasswords] = useState({});

  const [customerType, setCustomerType] = useState('parent');
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildSearchDropdown, setShowChildSearchDropdown] = useState(false);
  
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [showParentSearchDropdown, setShowParentSearchDropdown] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });

  // Filters & Companies
  const [companyFilter, setCompanyFilter] = useState('');
  const allCompanies = useUserStore(state => state.companies) || [];

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanyAutocomplete, setShowCompanyAutocomplete] = useState(false);
  const companyDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
        setShowCompanyAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time dynamic company list gathered from all registered users and store
  const availableCompanies = useMemo(() => {
    const compMap = new Map();

    allUsers.forEach(u => {
      const rawComp = typeof u.company === 'string' ? u.company.trim() : '';
      const comp = normalizeTurkishTitleCase(rawComp);
      if (comp && comp !== '-' && !comp.toLowerCase().includes('tgundogan')) {
        compMap.set(comp, (compMap.get(comp) || 0) + 1);
      }
    });

    allCompanies.forEach(c => {
      const rawComp = typeof c === 'string' ? c.trim() : '';
      const comp = normalizeTurkishTitleCase(rawComp);
      if (comp && comp !== '-' && !comp.toLowerCase().includes('tgundogan')) {
        if (!compMap.has(comp)) {
          compMap.set(comp, 0);
        }
      }
    });

    if (!compMap.has('Move Travel & Mice')) {
      compMap.set('Move Travel & Mice', 0);
    }

    return Array.from(compMap.entries()).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));
  }, [allUsers, allCompanies]);

  const filteredFormCompanies = useMemo(() => {
    const query = (formData.company || '').trim().toLocaleLowerCase('tr-TR');
    if (!query) {
      return availableCompanies.slice(0, 10);
    }
    return availableCompanies.filter(c => 
      c.name.toLocaleLowerCase('tr-TR').includes(query)
    );
  }, [availableCompanies, formData.company]);

  const [showChildrenInList, setShowChildrenInList] = useState(true);

  // Fetch read-only individual user summary data
  const handleOpenIndividualSummary = async (u) => {
    setSelectedIndividualSummary(u);
    setIndividualSummaryData({ loading: true, travels: [], checklists: [], budgets: [] });
    try {
      const travelsSnap = await getDocs(query(collection(db, 'individual_travels'), where('userId', '==', u.id)));
      const travels = travelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const checklistsSnap = await getDocs(query(collection(db, 'user_checklists'), where('userId', '==', u.id)));
      const checklists = checklistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const budgetsSnap = await getDocs(query(collection(db, 'travel_budgets'), where('userId', '==', u.id)));
      const budgets = budgetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setIndividualSummaryData({ loading: false, travels, checklists, budgets });
    } catch (err) {
      console.error('Bireysel özet yüklenemedi:', err);
      setIndividualSummaryData({ loading: false, travels: [], checklists: [], budgets: [] });
    }
  };
  
  const isStaffUser = (u) => u.role === 'expert' || u.role === 'admin' || u.role === 'ticketing' || u.secondaryRole === 'admin' || u.secondaryRole === 'expert' || u.secondaryRole === 'ticketing';

  // Customer counting (All unified corporate customers)
  const customerUsers = allUsers.filter(u => {
    return !isStaffUser(u) && (u.role === 'customer' || !u.role);
  });
  const childUsers = customerUsers.filter(u => isUserChild(u));
  const adultCustomerUsers = customerUsers.filter(u => !isUserChild(u));

  const stats = {
      admin: allUsers.filter(u => u.role === 'admin' || u.secondaryRole === 'admin').length,
      expert: allUsers.filter(u => u.role === 'expert' || (u.role === 'admin' && u.secondaryRole === 'expert')).length,
      ticketing: allUsers.filter(u => u.role === 'ticketing' || (u.role === 'admin' && u.secondaryRole === 'ticketing')).length,
      customer: adultCustomerUsers.length,
      children: childUsers.length,
  };

  const filteredUsers = allUsers.filter(u => {
      if (activeTab === 'customer') {
          // Must be an adult customer (not staff, not child)
          if (isStaffUser(u)) return false;
          if (u.role && u.role !== 'customer') return false;
          if (isUserChild(u)) return false;
      } else if (activeTab === 'children') {
          // Only children
          if (isStaffUser(u)) return false;
          if (!isUserChild(u)) return false;
      } else if (activeTab === 'admin') {
          if (u.role !== 'admin' && u.secondaryRole !== 'admin') return false;
      } else if (activeTab === 'expert') {
          if (u.role !== 'expert' && !(u.role === 'admin' && u.secondaryRole === 'expert')) return false;
      } else if (activeTab === 'ticketing') {
          if (u.role !== 'ticketing' && !(u.role === 'admin' && u.secondaryRole === 'ticketing')) return false;
      } else {
          // Staff tabs: expert, admin, ticketing
          if (u.role !== activeTab) return false;
      }

      const qs = (searchQuery || companyFilter || '').trim().toLowerCase();
      if (qs) {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const comp = (u.company || '').toLowerCase();
        const rawPhone = (u.phone || '').toLowerCase();
        const phoneDigits = rawPhone.replace(/\D/g, '');
        const qsDigits = qs.replace(/\D/g, '');

        const matchesName = name.includes(qs);
        const matchesEmail = email.includes(qs);
        const matchesComp = comp.includes(qs);
        const matchesPhone = rawPhone.includes(qs) || (qsDigits.length >= 3 && phoneDigits.includes(qsDigits));

        // When in children tab, also search parent names, emails, phones
        let matchesParent = false;
        if (activeTab === 'children') {
          const parents = getChildParents(u);
          matchesParent = parents.some(p => {
            const pName = (p.name || '').toLowerCase();
            const pEmail = (p.email || '').toLowerCase();
            const pPhone = (p.phone || '').toLowerCase();
            const pDigits = pPhone.replace(/\D/g, '');
            return pName.includes(qs) || pEmail.includes(qs) || pPhone.includes(qs) || (qsDigits.length >= 3 && pDigits.includes(qsDigits));
          });
        }

        if (!matchesName && !matchesEmail && !matchesComp && !matchesPhone && !matchesParent) {
          return false;
        }
      }

      return true;
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setPopupMsg({ show: true, type: 'error', title: 'Hatalı Format', text: 'Lütfen geçerli bir görsel dosyası seçin.' });
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > 256 || height > 256) {
              if (width > height) {
                  height = Math.round((height * 256) / width);
                  width = 256;
              } else {
                  width = Math.round((width * 256) / height);
                  height = 256;
              }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);
          setFormData(prev => ({ ...prev, avatar: compressedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenModal = () => {
      const isChildrenTab = activeTab === 'children';
      const isAdminTab = activeTab === 'admin';
      const defaultRole = (activeTab === 'customer' || isChildrenTab) ? 'customer' : (activeTab === 'ticketing' ? 'ticketing' : 'expert');
      const isStaffRole = defaultRole !== 'customer';
      setFormData({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        role: defaultRole, 
        secondaryRole: isAdminTab ? 'admin' : '',
        userType: 'corporate',
        avatar: null, 
        password: '', 
        currentPassword: '',
        phone: '', 
        company: isStaffRole ? 'Move Travel & Mice' : '', 
        parentIds: [], 
        childrenIds: [], 
        tcNo: '' 
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setCustomerType(isChildrenTab ? 'child' : 'parent');
      setChildSearchQuery('');
      setParentSearchQuery('');
      setEditingUserId(null);
      setShowAddModal(true);
  };

  const handleEdit = (user) => {
      const nameParts = user.name ? user.name.split(' ') : [''];
      const first = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0];
      const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      const existingLinkedTo = Array.isArray(user.linkedTo)
          ? user.linkedTo
          : (user.linkedTo && typeof user.linkedTo === 'string' && user.linkedTo.trim() && user.linkedTo !== 'null' && user.linkedTo !== 'undefined' && user.linkedTo !== '[]' && user.linkedTo !== '-' ? [user.linkedTo] : []);
      const isChildUser = isUserChild(user) || existingLinkedTo.length > 0;
      const childrenIds = allUsers.filter(u => {
          const uLinkedTo = Array.isArray(u.linkedTo) ? u.linkedTo : (u.linkedTo ? [u.linkedTo] : []);
          return uLinkedTo.includes(user.id);
      }).map(u => u.id);

      const isLegacyAdmin = user.role === 'admin';
      const resolvedRole = isLegacyAdmin ? (user.secondaryRole === 'ticketing' ? 'ticketing' : 'expert') : (user.role || 'customer');
      const resolvedSecRole = (isLegacyAdmin || user.secondaryRole === 'admin') ? 'admin' : (user.secondaryRole || '');
      const isStaff = resolvedRole !== 'customer';

      setFormData({
          firstName: first || '',
          lastName: last || '',
          email: user.email || '',
          role: resolvedRole,
          secondaryRole: resolvedSecRole,
          userType: 'corporate',
          avatar: user.avatar || null,
          phone: user.phone ? formatPhoneInputWithoutPrefix(user.phone) : '',
          company: isStaff ? 'Move Travel & Mice' : normalizeTurkishTitleCase(user.company || ''),
          password: '',
          currentPassword: user.password || '123456',
          parentIds: isChildUser ? existingLinkedTo : [],
          childrenIds: childrenIds,
          tcNo: user.tcNo || ''
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setCustomerType(isChildUser ? 'child' : 'parent');
      setChildSearchQuery('');
      setParentSearchQuery('');
      setEditingUserId(user.id);
      setShowAddModal(true);
  };

  const handleToggleStatus = (user) => {
      if (currentUser && currentUser.id === user.id) {
          setPopupMsg({ show: true, type: 'error', title: 'İşlem Reddedildi', text: 'Kendi hesabınızı pasife alamazsınız.' });
          return;
      }
      const newStatus = user.status === 'Aktif' ? 'Pasif' : 'Aktif';
      updateUser(user.id, { status: newStatus });
      setPopupMsg({ show: true, type: 'success', title: 'Durum Değiştirildi', text: `${user.name} kullanıcısı ${newStatus} durumuna getirildi.` });
  };

  const handleDelete = (id) => {
      if (id === currentUser?.id) return alert('Kendi aktif hesabınızı silemezsiniz!');
      setUserToDelete(id);
  };

  const confirmDelete = () => {
      if (userToDelete) {
          deleteUser(userToDelete);
          setUserToDelete(null);
          setPopupMsg({ show: true, type: 'success', title: 'Silindi', text: 'Kullanıcı hesabı başarıyla silindi.' });
      }
  };

  const getPasswordStrength = (pass) => {
      const upper = /[A-Z]/.test(pass || '');
      const lower = /[a-z]/.test(pass || '');
      const number = /[0-9]/.test(pass || '');
      const special = /[!@#$%^&*(),.?":{}|<>]/.test(pass || '');
      
      let score = 0;
      if (pass && pass.length > 0) {
        if (upper) score++;
        if (lower) score++;
        if (number) score++;
        if (special) score++;
      }
      
      let label = 'Çok Zayıf';
      let color = '#ef4444';
      if (score === 1) {
        label = 'Zayıf';
        color = '#ef4444';
      } else if (score === 2) {
        label = 'Orta';
        color = '#f97316';
      } else if (score === 3) {
        label = 'İyi';
        color = '#eab308';
      } else if (score >= 4) {
        label = 'Güçlü';
        color = '#10b981';
      }

      return {
          upper,
          lower,
          number,
          special,
          score,
          label,
          color
      };
  };

  const pStrength = getPasswordStrength(formData.password);
  const isPasswordValid = pStrength.upper && pStrength.lower && pStrength.number && pStrength.special;
  const canSubmit = editingUserId ? (formData.password === '' || isPasswordValid) : isPasswordValid;

  const handleSubmit = async (e) => {
      try {
          if (e) e.preventDefault();
          if (!formData.firstName) {
              setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'İsim alanı zorunludur.' });
              return;
          }

          const isChild = formData.role === 'customer' && customerType === 'child';
          const isCustomer = formData.role === 'customer';
          const hasEmail = Boolean(formData.email && formData.email.trim());
          const cleanPhone = (formData.phone || '').replace(/\D/g, '');
          const hasPhone = cleanPhone.length >= 10;

          if (!isCustomer && !hasEmail) {
              setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'Yetkili kullanıcılar için e-posta alanı zorunludur.' });
              return;
          }

          if (isCustomer && !isChild && !hasEmail && !hasPhone) {
              setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'Lütfen en az bir iletişim bilgisi (E-posta veya Telefon) girin.' });
              return;
          }

          if (!isChild && !canSubmit) {
              setPopupMsg({ show: true, type: 'error', title: 'Geçersiz Şifre', text: 'Lütfen parola kurallarına uyun (Büyük harf, küçük harf, rakam, özel karakter).' });
              return;
          }
          
          const fullName = formatTitleCase(`${formData.firstName} ${formData.lastName || ''}`.trim());
          
          let finalEmail;
          if (isChild) {
              finalEmail = formData.email ? formData.email.trim().toLowerCase() : `child_${Date.now()}@move.local`;
          } else if (hasEmail) {
              finalEmail = formData.email.trim().toLowerCase();
          } else {
              const phoneSlug = cleanPhone.startsWith('90') ? cleanPhone.slice(2) : cleanPhone;
              finalEmail = `user_${phoneSlug || Date.now()}@move.local`;
          }

          // Check for duplicate email and email domain typos
          if (!isChild && hasEmail) {
              const emailTypo = checkEmailDomainTypo(finalEmail);
              if (emailTypo) {
                  const duplicateWithCorrected = allUsers.find(u => u.id !== editingUserId && u.email?.toLowerCase() === emailTypo.suggestedEmail.toLowerCase());
                  if (duplicateWithCorrected) {
                      setPopupMsg({
                          show: true,
                          type: 'error',
                          title: 'Yazım Hatası & Mükerrer Kullanıcı',
                          text: `"${finalEmail}" adresinde yazım hatası tespit edildi (@${emailTypo.originalDomain} yerine @${emailTypo.suggestedDomain} olmalı). Sistemde zaten "${emailTypo.suggestedEmail}" e-posta adresiyle kayıtlı "${duplicateWithCorrected.name}" bulunmaktadır. Mükerrer kayıt açılmaması için lütfen kontrol edin.`
                      });
                      return;
                  }

                  if (!formData.ignoreTypo) {
                      setPopupMsg({
                          show: true,
                          type: 'error',
                          title: 'E-Posta Yazım Hatası',
                          text: `"${finalEmail}" adresinde yazım hatası olabilir. "${emailTypo.suggestedEmail}" mi demek istediniz? Formdaki "Düzelt" butonuna tıklayarak düzeltebilirsiniz.`
                      });
                      return;
                  }
              }

              if (!editingUserId) {
                  const existingUser = allUsers.find(u => u.email?.toLowerCase() === finalEmail);
                  if (existingUser) {
                      setPopupMsg({ 
                          show: true, 
                          type: 'error', 
                          title: 'Mevcut Kullanıcı', 
                          text: `"${finalEmail}" e-posta adresi sistemde zaten kayıtlı (${existingUser.name}).` 
                      });
                      return;
                  }
              } else {
                  const duplicateUser = allUsers.find(u => u.id !== editingUserId && u.email?.toLowerCase() === finalEmail);
                  if (duplicateUser) {
                      setPopupMsg({ 
                          show: true, 
                          type: 'error', 
                          title: 'E-Posta Kullanımda', 
                          text: `"${finalEmail}" e-posta adresi başka bir kullanıcı (${duplicateUser.name}) tarafından kullanılmaktadır.` 
                      });
                      return;
                  }
              }
          }

          const finalPassword = isChild && (!formData.password || formData.password.trim() === '') ? '123456' : formData.password.trim();
          
          let finalSecRole = null;
          if (formData.role !== 'customer') {
              finalSecRole = formData.secondaryRole === 'admin' ? 'admin' : null;
          }

          const userPayload = {
              name: fullName,
              email: finalEmail,
              role: formData.role,
              secondaryRole: finalSecRole,
              userType: 'corporate',
              avatar: formData.avatar,
              phone: isChild ? '-' : (formData.phone ? normalizePhoneNumber(formData.phone) : '-'),
              company: formData.role === 'customer' ? (isChild ? 'Move Travel & Mice' : normalizeTurkishTitleCase(formData.company || 'Move Travel & Mice')) : 'Move Travel & Mice',
              isChildProfile: isChild,
              tcNo: formData.role === 'customer' ? (formData.tcNo || '') : ''
          };
          if (formData.role === 'customer') {
              if (isChild) {
                  userPayload.linkedTo = formData.parentIds.length > 0 ? formData.parentIds : null;
              } else {
                  userPayload.linkedTo = null;
              }
          }
          
          if (!isChild && finalPassword && finalPassword.trim() !== '') {
              userPayload.password = finalPassword.trim();
          } else if (isChild && !editingUserId) {
              userPayload.password = finalPassword;
          }
          
          if (editingUserId) {
              updateUser(editingUserId, userPayload);
              if (currentUser && currentUser.id === editingUserId) {
                  useAuthStore.getState().updateProfile(userPayload);
              }
              
              if (formData.role === 'customer' && customerType === 'parent') {
                  const currentChildren = allUsers.filter(u => {
                      const uLinkedTo = Array.isArray(u.linkedTo) ? u.linkedTo : (u.linkedTo ? [u.linkedTo] : []);
                      return uLinkedTo.includes(editingUserId);
                  });
                  
                  for (const child of currentChildren) {
                      if (!formData.childrenIds.includes(child.id)) {
                          const existingLinkedTo = Array.isArray(child.linkedTo) ? child.linkedTo : (typeof child.linkedTo === 'string' ? [child.linkedTo] : []);
                          const newLinkedTo = existingLinkedTo.filter(id => id !== editingUserId);
                          updateUser(child.id, { linkedTo: newLinkedTo.length > 0 ? newLinkedTo : null });
                      }
                  }
                  
                  for (const childId of formData.childrenIds) {
                      if (!currentChildren.some(c => c.id === childId)) {
                          const childObj = allUsers.find(p => p.id === childId);
                          if (childObj) {
                              const existingLinkedTo = Array.isArray(childObj.linkedTo) ? childObj.linkedTo : (typeof childObj.linkedTo === 'string' ? [childObj.linkedTo] : []);
                              const cleanLinkedTo = existingLinkedTo.filter(id => id && String(id).trim() !== '');
                              if (!cleanLinkedTo.includes(editingUserId)) {
                                  updateUser(childId, { linkedTo: [...cleanLinkedTo, editingUserId] });
                              }
                          }
                      }
                  }
              }
          } else {
              const newUser = await addUser(userPayload);

              if (newUser && formData.role === 'customer' && !isChild && newUser.phone && newUser.phone !== '-' && newUser.phone.trim().length > 6) {
                  useSettingsStore.getState().sendWhatsAppNotification(
                      newUser.phone,
                      'newUserTemplate',
                      [newUser.name]
                  );
              }
              
              if (newUser && newUser.id && formData.role === 'customer' && customerType === 'parent' && formData.childrenIds.length > 0) {
                  for (const childId of formData.childrenIds) {
                      const childObj = allUsers.find(p => p.id === childId);
                      if (childObj) {
                          const existingLinkedTo = Array.isArray(childObj.linkedTo) ? childObj.linkedTo : (typeof childObj.linkedTo === 'string' ? [childObj.linkedTo] : []);
                          const cleanLinkedTo = existingLinkedTo.filter(id => id && String(id).trim() !== '');
                          if (!cleanLinkedTo.includes(newUser.id)) {
                              updateUser(childId, { linkedTo: [...cleanLinkedTo, newUser.id] });
                          }
                      }
                  }
              }
          }

          if (userPayload.company && userPayload.company !== '-' && userPayload.company !== 'Move Travel & Mice') {
              useUserStore.getState().addCompany(userPayload.company);
          }
          
          setShowAddModal(false);
          if (formData.role === 'customer') {
            setActiveTab(customerType === 'child' ? 'children' : 'customer');
          } else if (finalSecRole === 'admin' && activeTab === 'admin') {
            setActiveTab('admin');
          } else {
            setActiveTab(formData.role);
          }
          setPopupMsg({ show: true, type: 'success', title: 'Başarılı!', text: editingUserId ? `Kullanıcı profili güncellendi.` : `Yeni kullanıcı başarıyla eklendi.` });
          setEditingUserId(null);
      } catch (err) {
          alert("HATA: " + err.message);
      }
  };

  const getUserCardBorderColor = (u) => {
    // 1. Çocuk kullanıcılarda bebek mavisi
    if (isUserChild(u)) {
      return '#38bdf8';
    }
    // 2. Yöneticilerde siyah
    if (isUserAdmin(u)) {
      return '#0f172a';
    }
    // 3. Seyahat uzmanlarında uygulama ile aynı renk
    if (u.role === 'expert') {
      return 'var(--primary)';
    }
    // 4. Biletleme turkuaz
    if (u.role === 'ticketing') {
      return '#06b6d4';
    }
    // 5. Yetişkin kullanıcılarda Turuncu
    return '#f97316';
  };

  const roleTabs = [
    { key: 'expert', label: 'Uzmanlar', count: stats.expert, icon: Briefcase, color: 'var(--primary)' },
    { key: 'admin', label: 'Yöneticiler', count: stats.admin, icon: ShieldAlert, color: '#0f172a' },
    { key: 'ticketing', label: 'Biletleme', count: stats.ticketing, icon: PlaneTakeoff, color: '#06b6d4' },
    { key: 'customer', label: 'Müşteriler', count: stats.customer, icon: UsersIcon, color: '#f97316' }
  ];

  // Render full-page user add / edit view (replacing popup modal)
  if (showAddModal) {
    const isChild = formData.role === 'customer' && customerType === 'child';
    const isStaff = formData.role !== 'customer';
    const adultCustomers = allUsers.filter(u => u.role === 'customer' && !isUserChild(u));

    return (
      <div style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
        {/* Custom Popup Alert Modal */}
        {popupMsg.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '320px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.25s ease-out', borderRadius: '18px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: popupMsg.type === 'success' ? '#ecfdf5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                {popupMsg.type === 'success' ? <CheckCircle2 size={24} color="#10b981" /> : <AlertTriangle size={24} color="#ef4444" />}
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-main)', textAlign: 'center' }}>{popupMsg.title}</h2>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 16px 0', lineHeight: 1.4, width: '100%' }}>{popupMsg.text}</div>
              
              <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                Tamam
              </button>
            </div>
          </div>
        )}

        <Header 
          title={editingUserId ? "Profili Düzenle" : (isChild ? "Yeni Çocuk Kullanıcı" : "Yeni Kullanıcı Ekle")} 
          subtitle={editingUserId ? (formData.firstName ? `${formData.firstName} ${formData.lastName || ''}`.trim() : 'Kullanıcı Bilgilerini Güncelle') : 'Kullanıcı Bilgileri & Rol Tanımlama'}
          showBack 
          onBack={() => {
            setShowAddModal(false);
            setEditingUserId(null);
          }} 
        />

        <div style={{ padding: '0 16px calc(160px + env(safe-area-inset-bottom, 0px)) 16px', maxWidth: '520px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Form Card */}
            <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '18px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Category Switcher: Personel vs Müşteri */}
              <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, role: 'expert', company: 'Move Travel & Mice' });
                    setCustomerType('parent');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '9px',
                    border: 'none',
                    background: isStaff ? 'white' : 'transparent',
                    color: isStaff ? 'var(--primary)' : '#64748b',
                    fontWeight: '800',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    boxShadow: isStaff ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Briefcase size={14} /> Şirket Personeli
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, role: 'customer', secondaryRole: '', company: formData.company === 'Move Travel & Mice' ? '' : formData.company });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '9px',
                    border: 'none',
                    background: !isStaff ? 'white' : 'transparent',
                    color: !isStaff ? 'var(--primary)' : '#64748b',
                    fontWeight: '800',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    boxShadow: !isStaff ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UsersIcon size={14} /> Müşteri Portföyü
                </button>
              </div>

              {/* Avatar Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 8px 0' }}>
                <label style={{ 
                  width: '72px', height: '72px', borderRadius: '50%', 
                  background: formData.avatar ? 'transparent' : '#f8fafc', 
                  border: formData.avatar ? '2px solid var(--primary)' : '2px dashed #cbd5e1', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', overflow: 'hidden', position: 'relative',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={24} color="#94a3b8" />
                  )}
                </label>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                  {formData.avatar ? 'Fotoğrafı Değiştir' : 'Profil Fotoğrafı Yükle'}
                </div>
              </div>

              {/* If Customer: Ana Müşteri vs Çocuk Kullanıcı */}
              {!isStaff && (
                <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <button 
                    type="button"
                    onClick={() => setCustomerType('parent')}
                    style={{ flex: 1, padding: '7px', fontSize: '11.5px', borderRadius: '8px', border: 'none', background: customerType === 'parent' ? 'white' : 'transparent', color: customerType === 'parent' ? '#ea580c' : '#64748b', fontWeight: '800', boxShadow: customerType === 'parent' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}
                  >
                    Ana Müşteri (Yetişkin)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustomerType('child')}
                    style={{ flex: 1, padding: '7px', fontSize: '11.5px', borderRadius: '8px', border: 'none', background: customerType === 'child' ? 'white' : 'transparent', color: customerType === 'child' ? '#0284c7' : '#64748b', fontWeight: '800', boxShadow: customerType === 'child' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}
                  >
                    Çocuk Kullanıcı
                  </button>
                </div>
              )}

              {/* If Staff: Personel Operasyon Rolü & Admin Yetkisi */}
              {isStaff && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={14} color="var(--primary)" /> Personel Operasyon Rolü
                  </label>

                  {/* Operational Staff Role Selector: Uzman or Biletleme */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'expert' })}
                      style={{
                        padding: '9px 8px',
                        borderRadius: '10px',
                        border: (formData.role === 'expert' || formData.role === 'admin') ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: (formData.role === 'expert' || formData.role === 'admin') ? '#f0f9ff' : 'white',
                        color: (formData.role === 'expert' || formData.role === 'admin') ? '#0369a1' : '#475569',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🌍</span> Seyahat Uzmanı
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'ticketing' })}
                      style={{
                        padding: '9px 8px',
                        borderRadius: '10px',
                        border: formData.role === 'ticketing' ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: formData.role === 'ticketing' ? '#ecfdf5' : 'white',
                        color: formData.role === 'ticketing' ? '#047857' : '#475569',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🎫</span> Biletleme
                    </button>
                  </div>

                  {/* Grant Admin Access Toggle - Themed & Stylish */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, secondaryRole: prev.secondaryRole === 'admin' ? '' : 'admin' }))}
                    style={{
                      marginTop: '10px',
                      background: formData.secondaryRole === 'admin' ? '#fff1f2' : 'white',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.secondaryRole === 'admin' ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      userSelect: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: formData.secondaryRole === 'admin' ? '0 3px 10px rgba(215, 20, 122, 0.12)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        color: formData.secondaryRole === 'admin' ? 'var(--primary)' : '#1e293b',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s ease'
                      }}>
                        Bu personele Yönetici yetkisi de ver
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.35 }}>
                        İşaretlendiğinde personel hem operasyon panelini hem de Yönetim Panelini kullanabilir.
                      </span>
                    </div>

                    {/* Smooth Switch Indicator */}
                    <div style={{
                      width: '38px',
                      height: '22px',
                      borderRadius: '20px',
                      background: formData.secondaryRole === 'admin' ? 'var(--primary)' : '#e2e8f0',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: formData.secondaryRole === 'admin' ? '19px' : '3px',
                        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* First & Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>İsim *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Örn: Ahmet" 
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>Soyisim</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Yılmaz" 
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* E-Posta & Telefon (For all users except child) - 2 Ayrı Satır */}
              {!isChild && (
                <>
                  {/* Satır 1: E-Posta */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                      E-Posta {formData.role === 'customer' ? (formData.phone ? '(Opsiyonel)' : '(veya Tel)') : '*'}
                    </label>
                    <input 
                      type="email" 
                      placeholder="ahmet@mail.com" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value.toLowerCase().trim()})}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        borderRadius: '10px', 
                        border: checkEmailDomainTypo(formData.email) ? '1.5px solid #f59e0b' : '1px solid #cbd5e1', 
                        outline: 'none', 
                        fontSize: '12px', 
                        background: '#f8fafc', 
                        boxSizing: 'border-box' 
                      }}
                    />

                    {/* Email Typo Alert Banner */}
                    {checkEmailDomainTypo(formData.email) && (
                      <div style={{
                        marginTop: '6px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#b45309', fontWeight: '600' }}>
                          <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0 }} />
                          <span>Yazım hatası olabilir: <strong>{checkEmailDomainTypo(formData.email).suggestedEmail}</strong>?</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, email: checkEmailDomainTypo(formData.email).suggestedEmail }))}
                          style={{
                            background: '#d97706',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Düzelt
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Satır 2: Telefon */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                      Telefon {formData.role === 'customer' && !formData.email ? '*' : ''}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#f1f5f9', borderRight: '1px solid #cbd5e1', color: '#475569', fontSize: '11.5px', fontWeight: '700', userSelect: 'none' }}>
                        +90
                      </div>
                      <input 
                        type="tel" 
                        placeholder="5XX XXX XX XX" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: formatPhoneInputWithoutPrefix(e.target.value)})}
                        maxLength={14}
                        style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* If Child: Parent Selector */}
              {isChild && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                    Bağlı Ebeveyn (Anne / Baba) *
                  </label>
                  <select
                    value={formData.parentIds[0] || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, parentIds: val ? [val] : [] });
                    }}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="">Ebeveyn Seçin...</option>
                    {adultCustomers.map(p => (
                      <option key={p.id} value={p.id}>
                        {formatTitleCase(p.name)} ({p.email || p.phone || 'Kayıtlı'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. Kayıtlı Şifre (Ayrı Bağımsız Kart) */}
              {!isChild && editingUserId && (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '9px 12px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ 
                    width: '26px', 
                    height: '26px', 
                    borderRadius: '7px', 
                    background: 'rgba(215, 20, 122, 0.08)', 
                    border: '1px solid rgba(215, 20, 122, 0.2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0 
                  }}>
                    <Lock size={13} color="var(--primary)" />
                  </div>
                  
                  <div style={{ width: '1px', height: '14px', background: '#e2e8f0', flexShrink: 0 }} />

                  {/* Uzatılmış Şifre Kutusu (Tüm boşluğu doldurur) */}
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0,
                    fontFamily: 'monospace', 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: '#0f172a', 
                    background: '#f8fafc', 
                    padding: '6px 10px', 
                    borderRadius: '7px', 
                    border: '1px solid #e2e8f0',
                    letterSpacing: showCurrentPassword ? '0.5px' : '2.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {showCurrentPassword ? (formData.currentPassword || '123456') : '••••••••'}
                  </div>

                  {/* Sadece Göz Simgesi */}
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                    style={{
                      width: '28px',
                      height: '28px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: showCurrentPassword ? '#ef4444' : 'var(--primary)',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              )}

              {/* 2. Yeni Şifre Belirleme Kartı */}
              {!isChild && (
                <div style={{
                  background: editingUserId ? '#ffffff' : 'transparent',
                  borderRadius: editingUserId ? '14px' : '0',
                  border: editingUserId ? '1px solid #e2e8f0' : 'none',
                  padding: editingUserId ? '12px' : '0',
                  boxShadow: editingUserId ? '0 1px 3px rgba(15, 23, 42, 0.02)' : 'none'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                    {editingUserId ? 'Yeni Şifre Belirle (Değişmeyecekse Boş Bırakın)' : 'Giriş Şifresi *'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      placeholder={editingUserId ? "Değiştirmek için yeni şifre yazın..." : "••••••••"} 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      style={{ width: '100%', padding: '10px 34px 10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? "Gizle" : "Şifreyi Göster"}
                      style={{ position: 'absolute', right: '10px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#94a3b8' }}
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div style={{ marginTop: '8px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      {/* Şifre Güç Barı */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>Şifre Gücü</span>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', color: pStrength.color }}>{pStrength.label}</span>
                      </div>
                      <div style={{ height: '5px', width: '100%', display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: pStrength.score >= 1 ? pStrength.color : '#e2e8f0', transition: 'all 0.2s ease' }} />
                        <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: pStrength.score >= 2 ? pStrength.color : '#e2e8f0', transition: 'all 0.2s ease' }} />
                        <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: pStrength.score >= 3 ? pStrength.color : '#e2e8f0', transition: 'all 0.2s ease' }} />
                        <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: pStrength.score >= 4 ? pStrength.color : '#e2e8f0', transition: 'all 0.2s ease' }} />
                      </div>

                      {/* Şifre Kriterleri */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px' }}>
                        <span style={{ color: pStrength.upper ? '#10b981' : '#94a3b8', fontWeight: pStrength.upper ? '700' : '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{pStrength.upper ? '✓' : '○'}</span> Büyük Harf
                        </span>
                        <span style={{ color: pStrength.lower ? '#10b981' : '#94a3b8', fontWeight: pStrength.lower ? '700' : '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{pStrength.lower ? '✓' : '○'}</span> Küçük Harf
                        </span>
                        <span style={{ color: pStrength.number ? '#10b981' : '#94a3b8', fontWeight: pStrength.number ? '700' : '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{pStrength.number ? '✓' : '○'}</span> Rakam
                        </span>
                        <span style={{ color: pStrength.special ? '#10b981' : '#94a3b8', fontWeight: pStrength.special ? '700' : '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{pStrength.special ? '✓' : '○'}</span> Özel Karakter
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Company Name with AJAX / Live Autocomplete Search */}
              {!isChild && (
                <div ref={companyDropdownRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={13} color="var(--primary)" />
                      <span>Firma / Kurum</span>
                    </label>
                    {isStaff ? (
                      <span style={{ fontSize: '9.5px', color: 'var(--primary)', fontWeight: '700', background: 'rgba(215, 20, 122, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                        Sabit Kurum
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                        Canlı Arama & Seçim
                      </span>
                    )}
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      disabled={isStaff}
                      readOnly={isStaff}
                      placeholder={isStaff ? "Move Travel & Mice" : "Firma adı yazın veya seçin..."} 
                      value={isStaff ? 'Move Travel & Mice' : formData.company}
                      onFocus={() => !isStaff && setShowCompanyAutocomplete(true)}
                      onChange={e => {
                        if (!isStaff) {
                          setFormData({ ...formData, company: toTurkishTitleCase(e.target.value) });
                          setShowCompanyAutocomplete(true);
                        }
                      }}
                      onBlur={() => {
                        if (!isStaff && formData.company) {
                          setFormData(prev => ({ ...prev, company: normalizeTurkishTitleCase(prev.company) }));
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '10px 34px 10px 12px', 
                        borderRadius: '10px', 
                        border: showCompanyAutocomplete && !isStaff ? '1.5px solid var(--primary)' : '1px solid #cbd5e1', 
                        outline: 'none', 
                        fontSize: '12px', 
                        background: isStaff ? '#f1f5f9' : '#f8fafc', 
                        color: isStaff ? '#475569' : '#1e293b',
                        cursor: isStaff ? 'not-allowed' : 'text',
                        fontWeight: isStaff ? '700' : 'normal',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease'
                      }}
                    />

                    {/* Right action inside input: Clear or Chevron */}
                    {!isStaff && (
                      <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {formData.company ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, company: '' });
                              setShowCompanyAutocomplete(true);
                            }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#94a3b8' }}
                          >
                            <X size={14} />
                          </button>
                        ) : (
                          <ChevronDown 
                            size={14} 
                            color="#94a3b8" 
                            style={{ 
                              cursor: 'pointer',
                              transform: showCompanyAutocomplete ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.15s ease'
                            }} 
                            onClick={() => setShowCompanyAutocomplete(!showCompanyAutocomplete)}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {isStaff && (
                    <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
                      Şirket personeli otomatik olarak Move Travel & Mice kurumuna atanır.
                    </div>
                  )}

                  {/* AJAX Live Search Autocomplete Dropdown */}
                  {!isStaff && showCompanyAutocomplete && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      zIndex: 9999,
                      maxHeight: '220px',
                      overflowY: 'auto',
                      padding: '6px'
                    }}>
                      {/* Dropdown Header */}
                      <div style={{ padding: '6px 8px 4px 8px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Sistemde Kayıtlı Firmalar</span>
                        <span style={{ fontSize: '9px', fontWeight: '600' }}>{filteredFormCompanies.length} sonuç</span>
                      </div>

                      {/* Suggestions List */}
                      {filteredFormCompanies.length > 0 ? (
                        filteredFormCompanies.map((c, idx) => {
                          const isExactMatch = c.name.toLocaleLowerCase('tr-TR') === (formData.company || '').trim().toLocaleLowerCase('tr-TR');
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setFormData({ ...formData, company: normalizeTurkishTitleCase(c.name) });
                                setShowCompanyAutocomplete(false);
                              }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isExactMatch ? 'rgba(215, 20, 122, 0.08)' : 'transparent',
                                color: isExactMatch ? 'var(--primary)' : '#1e293b',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => {
                                if (!isExactMatch) e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={e => {
                                if (!isExactMatch) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isExactMatch ? 'var(--primary)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Building2 size={13} color={isExactMatch ? 'white' : '#64748b'} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: isExactMatch ? '800' : '600' }}>
                                  {c.name}
                                </span>
                              </div>
                              {c.count > 0 && (
                                <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '5px' }}>
                                  {c.count} kişi
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                          Eşleşen kayıtlı firma bulunamadı.
                        </div>
                      )}

                      {/* Option to add newly typed company if not exact match */}
                      {formData.company && formData.company.trim() && !filteredFormCompanies.some(c => c.name.toLocaleLowerCase('tr-TR') === formData.company.trim().toLocaleLowerCase('tr-TR')) && (
                        <div
                          onClick={() => {
                            const newCompName = normalizeTurkishTitleCase(formData.company);
                            useUserStore.getState().addCompany(newCompName);
                            setFormData({ ...formData, company: newCompName });
                            setShowCompanyAutocomplete(false);
                          }}
                          style={{
                            marginTop: '4px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: '#f0fdf4',
                            border: '1px dashed #86efac',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#166534',
                            fontSize: '11.5px',
                            fontWeight: '700'
                          }}
                        >
                          <span style={{ fontSize: '13px' }}>+</span>
                          <span>"{normalizeTurkishTitleCase(formData.company)}" olarak yeni firma ekle</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TC Kimlik No for Customers */}
              {!isStaff && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>T.C. Kimlik No (Opsiyonel)</label>
                  <input 
                    type="text" 
                    maxLength={11}
                    placeholder="11 haneli T.C. kimlik numarası" 
                    value={formData.tcNo}
                    onChange={e => setFormData({...formData, tcNo: e.target.value.replace(/\D/g, '')})}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              )}

            </div>

            {/* Action Buttons Card */}
            <div style={{ 
              background: 'white', 
              borderRadius: '18px', 
              border: '1px solid #e2e8f0', 
              padding: '14px 16px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex', 
              gap: '10px',
              marginBottom: '32px',
              position: 'relative',
              zIndex: 10 
            }}>
              <button 
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUserId(null);
                }}
                style={{ 
                  flex: 1, 
                  padding: '11px', 
                  borderRadius: '11px', 
                  border: '1px solid #cbd5e1', 
                  background: '#f8fafc', 
                  color: '#64748b', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Vazgeç
              </button>
              <button 
                type="submit"
                style={{ 
                  flex: 1.5, 
                  padding: '11px', 
                  borderRadius: '11px', 
                  border: 'none', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.28)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Check size={16} />
                <span>{editingUserId ? 'Profili Güncelle' : 'Kullanıcıyı Kaydet'}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', minHeight: '100vh', position: 'relative' }} onClick={() => setOpenDropdownId(null)}>
      
      {/* Custom Popup Alert Modal */}
      {popupMsg.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
              <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '320px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.25s ease-out', borderRadius: '18px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: popupMsg.type === 'success' ? '#ecfdf5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      {popupMsg.type === 'success' ? <CheckCircle2 size={24} color="#10b981" /> : <AlertTriangle size={24} color="#ef4444" />}
                  </div>
                  <h2 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-main)', textAlign: 'center' }}>{popupMsg.title}</h2>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 16px 0', lineHeight: 1.4, width: '100%' }}>{popupMsg.text}</div>
                  
                  <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                      Tamam
                  </button>
              </div>
          </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
              <Trash2 size={20} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>Kullanıcıyı Sil?</h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 16px 0' }}>Bu işlem geri alınamaz. Kullanıcı hesabı sistemden tamamen kaldırılacaktır.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setUserToDelete(null)} style={{ flex: 1, padding: '8px', borderRadius: '9px', border: '1px solid #e2e8f0', background: 'white', fontSize: '11.5px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>Vazgeç</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '8px', borderRadius: '9px', border: 'none', background: '#dc2626', color: 'white', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      <Header title="Kullanıcı Yönetimi" showBack />
      
      <div style={{ padding: '14px 16px' }}>

        {/* 1. Header Card with Title & New User Button */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '12px 14px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.2px' }}>
                Kullanıcı & Rol Yönetimi
              </h2>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                {allUsers.length} Kayıtlı Kullanıcı
              </div>
            </div>
            <button 
              onClick={handleOpenModal}
              title="Yeni Kullanıcı Ekle"
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                width: '36px',
                height: '36px',
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxShadow: '0 2px 8px rgba(215, 20, 122, 0.28)',
                transition: 'transform 0.15s ease'
              }}
            >
              <UserPlus size={17} />
            </button>
          </div>
        </div>

        {/* 2. Kare İkonlu Rol Seçici Butonlar (Kart İçinde) */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '10px 12px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          marginBottom: '12px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '10px' 
          }}>
            {roleTabs.map(tab => {
              const IconComponent = tab.icon;
              const isActive = tab.key === 'customer' 
                ? (activeTab === 'customer' || activeTab === 'children')
                : activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { 
                    if (tab.key === 'customer') {
                      if (activeTab !== 'customer' && activeTab !== 'children') {
                        setActiveTab('customer');
                      }
                    } else {
                      setActiveTab(tab.key);
                    }
                    setSearchQuery(''); 
                  }}
                  title={tab.label}
                  style={{
                    aspectRatio: '1',
                    background: isActive ? 'var(--primary)' : '#f8fafc',
                    color: isActive ? 'white' : '#64748b',
                    borderRadius: '14px',
                    border: isActive ? 'none' : '1px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(215, 20, 122, 0.28)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    padding: 0,
                    transform: isActive ? 'scale(1.02)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#1e293b';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  <IconComponent size={22} strokeWidth={isActive ? 2.4 : 2} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Rol Başlığı ve Alt Sekmeler Kartı */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: (activeTab === 'customer' || activeTab === 'children') ? '10px' : '0'
        }}>
          {/* Selected Role Title */}
          <div>
            <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>
              {activeTab === 'expert' ? 'Seyahat Uzmanları' : activeTab === 'admin' ? 'Sistem Yöneticileri' : activeTab === 'ticketing' ? 'Biletleme Personeli' : 'Müşteri Portföyü'}
            </h3>
          </div>

          {/* Müşteriler & Çocuklar Sekme Geçişi */}
          {(activeTab === 'customer' || activeTab === 'children') && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setActiveTab('customer')}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '6px', 
                  background: activeTab === 'customer' ? '#fff7ed' : '#f8fafc', 
                  color: activeTab === 'customer' ? '#ea580c' : '#64748b', 
                  border: `1.5px solid ${activeTab === 'customer' ? '#f97316' : '#e2e8f0'}`, 
                  borderRadius: '10px', 
                  padding: '8px 12px', 
                  fontSize: '11.5px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'customer' ? '0 2px 6px rgba(249, 115, 22, 0.15)' : 'none'
                }}
              >
                <UsersIcon size={14} color={activeTab === 'customer' ? '#ea580c' : '#94a3b8'} />
                <span>Yetişkinler</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('children')}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '6px', 
                  background: activeTab === 'children' ? '#f0f9ff' : '#f8fafc', 
                  color: activeTab === 'children' ? '#0284c7' : '#64748b', 
                  border: `1.5px solid ${activeTab === 'children' ? '#38bdf8' : '#e2e8f0'}`, 
                  borderRadius: '10px', 
                  padding: '8px 12px', 
                  fontSize: '11.5px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'children' ? '0 2px 6px rgba(56, 189, 248, 0.15)' : 'none'
                }}
              >
                <Baby size={14} color={activeTab === 'children' ? '#0284c7' : '#94a3b8'} />
                <span>Çocuklar</span>
              </button>
            </div>
          )}
        </div>

        {/* Kullanıcı Arama Çubuğu */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'white',
            padding: '7px 9px',
            borderRadius: '13px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '11px', pointerEvents: 'none', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder={activeTab === 'children' ? "Çocuk veya ebeveyn adı, tel, e-posta..." : "İsim, e-posta, telefon veya firma ile ara..."}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCompanyFilter(e.target.value);
                }}
                style={{ 
                  width: '100%', 
                  padding: '9.5px 28px 9.5px 33px', 
                  borderRadius: '9px', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '11.5px', 
                  outline: 'none', 
                  background: '#f8fafc',
                  color: '#1e293b',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = activeTab === 'children' ? '#c026d3' : 'var(--primary)'; e.target.style.background = '#ffffff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCompanyFilter('');
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0
                  }}
                  title="Aramayı Temizle"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Compact User Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
              Arama kriterlerine uygun kullanıcı bulunamadı.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isChild = isUserChild(user);
              const childParents = isChild ? getChildParents(user) : [];
              const cardBorderColor = getUserCardBorderColor(user);
              return (
                <div 
                  key={user.id} 
                  style={{ 
                    background: 'white', 
                    borderRadius: '14px', 
                    border: `1.5px solid ${cardBorderColor}`, 
                    padding: '11px 14px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Row: Avatar with Status Signal + Details + Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    {/* Avatar with Status Signal */}
                    <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '50%', 
                        overflow: 'hidden', 
                        border: `1.5px solid ${cardBorderColor}`, 
                        background: '#f1f5f9'
                      }}>
                        <img 
                          src={user.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=60&w=100"} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          alt={user.name} 
                        />
                      </div>

                      {/* Aktif / Pasif Signal İkonu (Sağ Üst) */}
                      <span 
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                        title={`Durum: ${user.status === 'Aktif' ? 'Aktif' : 'Pasif'} (Değiştirmek için tıklayın)`}
                        style={{
                          position: 'absolute',
                          top: '-1px',
                          right: '-1px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: user.status === 'Aktif' ? '#10b981' : '#94a3b8',
                          border: '2px solid #ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      />
                    </div>

                    {/* Dikey Ayırıcı Çizgi (Profil Resmi ile Yazılar Arasında) */}
                    <div style={{ 
                      width: '1px', 
                      alignSelf: 'stretch', 
                      minHeight: '38px', 
                      margin: '2px 0',
                      background: '#e2e8f0', 
                      flexShrink: 0,
                      borderRadius: '1px'
                    }} />

                    {/* User Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0, marginBottom: '2px' }}>
                        <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatTitleCase(user.name)}
                        </span>
                        {isChild && (
                          <span style={{ fontSize: '8.5px', background: '#f0f9ff', color: '#0284c7', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                            Çocuk
                          </span>
                        )}
                      </div>

                      {/* Contact & Company Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {/* Email */}
                        <div style={{ fontSize: '10.5px', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '4.5px', minWidth: 0, flexWrap: 'wrap' }}>
                          <Mail size={10} color="#64748b" style={{ flexShrink: 0 }} /> 
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(user.email || '').toLowerCase()}
                          </span>
                          {checkEmailDomainTypo(user.email) && (
                            <span 
                              title={`Yazım hatası tespit edildi: ${checkEmailDomainTypo(user.email).suggestedEmail}`}
                              style={{ fontSize: '9px', background: '#fef3c7', color: '#b45309', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', border: '1px solid #fde68a' }}
                            >
                              ⚠️ @{checkEmailDomainTypo(user.email).suggestedDomain} olmalı
                            </span>
                          )}
                        </div>

                        {/* Phone (Only for adults or if child has phone) */}
                        {!isChild && (
                          user.phone && user.phone !== '-' ? (
                            <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4.5px', minWidth: 0 }}>
                              <Phone size={10} color="var(--primary)" style={{ flexShrink: 0 }} /> 
                              <span>{normalizePhoneNumber(user.phone)}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4.5px', minWidth: 0 }}>
                              <Phone size={10} color="#cbd5e1" style={{ flexShrink: 0 }} /> 
                              <span>Telefon numarası eklenmemiş</span>
                            </div>
                          )
                        )}

                        {/* Company (if not child or if child has custom company) */}
                        {!isChild && user.company && (
                          <div style={{ fontSize: '10px', fontWeight: '500', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4.5px', minWidth: 0 }}>
                            <Building2 size={10} color="#64748b" style={{ flexShrink: 0 }} /> 
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{normalizeTurkishTitleCase(user.company)}</span>
                          </div>
                        )}


                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === user.id ? null : user.id); }}
                        style={{ 
                          background: openDropdownId === user.id ? '#f1f5f9' : 'transparent', 
                          border: 'none', 
                          color: '#64748b', 
                          padding: '5px', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          display: 'flex' 
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {openDropdownId === user.id && (
                        <div style={{ 
                          position: 'absolute', 
                          right: 0, 
                          top: '32px', 
                          background: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '10px', 
                          zIndex: 100, 
                          overflow: 'hidden', 
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)', 
                          minWidth: '155px' 
                        }}>
                          {/* Customer Individual Assistant Summary Button */}
                          {(activeTab === 'customer' || activeTab === 'children') && !isChild && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleOpenIndividualSummary(user); 
                                setOpenDropdownId(null); 
                              }}
                              style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '9px 12px', 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#D7147A', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                cursor: 'pointer', 
                                textAlign: 'left', 
                                borderBottom: '1px solid #f8fafc' 
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fdf2f8'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Eye size={13} color="#D7147A" />
                              </span>
                              <span style={{ width: '1px', height: '14px', background: '#e2e8f0', flexShrink: 0 }} />
                              <span style={{ flex: 1 }}>Bireysel Özet</span>
                            </button>
                          )}

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(user); setOpenDropdownId(null); }}
                            style={{ 
                              width: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              padding: '9px 12px', 
                              background: 'transparent', 
                              border: 'none', 
                              color: '#1e293b', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              cursor: 'pointer', 
                              textAlign: 'left', 
                              borderBottom: '1px solid #f8fafc' 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Edit3 size={13} color="var(--primary)" />
                            </span>
                            <span style={{ width: '1px', height: '14px', background: '#e2e8f0', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>Düzenle</span>
                          </button>

                          {/* Durum Değiştir */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); setOpenDropdownId(null); }}
                            style={{ 
                              width: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              padding: '9px 12px', 
                              background: 'transparent', 
                              border: 'none', 
                              color: user.status === 'Aktif' ? '#dc2626' : '#059669', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              cursor: 'pointer', 
                              textAlign: 'left', 
                              borderBottom: isUserAdmin(currentUser) ? '1px solid #f8fafc' : 'none' 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = user.status === 'Aktif' ? '#fef2f2' : '#ecfdf5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: user.status === 'Aktif' ? '#ef4444' : '#10b981' }} />
                            </span>
                            <span style={{ width: '1px', height: '14px', background: '#e2e8f0', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{user.status === 'Aktif' ? 'Pasife Al' : 'Aktif Yap'}</span>
                          </button>
                          
                          {isUserAdmin(currentUser) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(user.id); setOpenDropdownId(null); }}
                              style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '9px 12px', 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#ef4444', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                cursor: 'pointer', 
                                textAlign: 'left' 
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Trash2 size={13} />
                              </span>
                              <span style={{ width: '1px', height: '14px', background: '#e2e8f0', flexShrink: 0 }} />
                              <span style={{ flex: 1 }}>Sil</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Children Tab: Tanımlı Ebeveynler (Parents) Bölümü */}
                  {activeTab === 'children' && (
                    <div style={{
                      marginTop: '10px',
                      paddingTop: '9px',
                      borderTop: '1px dashed #e2e8f0',
                      width: '100%'
                    }}>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        color: '#475569', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UsersIcon size={12} color="#c026d3" />
                          <span>Tanımlı Ebeveynler</span>
                        </div>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '800', 
                          background: childParents.length > 0 ? '#ecfdf5' : '#fee2e2', 
                          color: childParents.length > 0 ? '#059669' : '#dc2626', 
                          padding: '1px 6px', 
                          borderRadius: '5px',
                          border: `1px solid ${childParents.length > 0 ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                        }}>
                          {childParents.length > 0 ? `${childParents.length} Ebeveyn` : 'Ebeveyn Yok'}
                        </span>
                      </div>

                      {childParents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {childParents.map(parent => (
                            <div key={parent.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '9px',
                              padding: '6px 8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                                  <img 
                                    src={parent.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=60&w=100"} 
                                    alt={parent.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {formatTitleCase(parent.name)}
                                  </div>
                                  {parent.phone && parent.phone !== '-' ? (
                                    <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <Phone size={9} color="#059669" /> {normalizePhoneNumber(parent.phone)}
                                    </div>
                                  ) : parent.email ? (
                                    <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      <Mail size={9} color="#94a3b8" /> {parent.email}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              {parent.phone && parent.phone !== '-' && parent.email && !parent.email.includes('@move.local') && (
                                <div style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                  {parent.email}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: '#fef2f2', 
                          border: '1px solid #fee2e2', 
                          borderRadius: '8px', 
                          padding: '6px 8px', 
                          color: '#dc2626', 
                          fontSize: '11px', 
                          fontWeight: '700' 
                        }}>
                          <AlertTriangle size={12} color="#dc2626" />
                          <span>Bu çocuk katılımcıya bağlı bir ebeveyn bulunamadı!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>



      {/* Individual User Summary Modal (Read-Only) */}
      {selectedIndividualSummary && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fdf2f8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D7147A 0%, #b80f68 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '15px'
                }}>
                  {selectedIndividualSummary.name?.charAt(0) || 'B'}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                    {formatTitleCase(selectedIndividualSummary.name)}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Bireysel Kullanıcı Veri Özeti (Salt Okunur)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedIndividualSummary(null)}
                style={{
                  background: 'white',
                  border: '1px solid #fbcfe8',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* User Quick Info */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '11px'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>E-Posta:</span>
                  <div style={{ fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedIndividualSummary.email || '-'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Telefon:</span>
                  <div style={{ fontWeight: '700', color: '#1e293b' }}>
                    {selectedIndividualSummary.phone || '-'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Kayıt Tarihi:</span>
                  <div style={{ fontWeight: '700', color: '#1e293b' }}>
                    {selectedIndividualSummary.createdAt ? new Date(selectedIndividualSummary.createdAt.seconds ? selectedIndividualSummary.createdAt.seconds * 1000 : selectedIndividualSummary.createdAt).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Hesap Durumu:</span>
                  <div style={{ fontWeight: '700', color: selectedIndividualSummary.status === 'Aktif' ? '#10b981' : '#ef4444' }}>
                    {selectedIndividualSummary.status || 'Aktif'}
                  </div>
                </div>
              </div>

              {individualSummaryData.loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  <div style={{ width: '24px', height: '24px', border: '3px solid #D7147A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px auto' }} />
                  Kullanıcı verileri yükleniyor...
                </div>
              ) : (
                <>
                  {/* Section 1: Seyahatler */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>
                        <Luggage size={14} color="#D7147A" />
                        Kayıtlı Seyahatler
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#fdf2f8', color: '#D7147A', padding: '1px 6px', borderRadius: '6px' }}>
                        {individualSummaryData.travels.length} Seyahat
                      </span>
                    </div>

                    {individualSummaryData.travels.length === 0 ? (
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                        Kayıtlı seyahat bulunmuyor.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {individualSummaryData.travels.map(t => (
                          <div key={t.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#1e293b' }}>{t.title || t.destination}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>{t.destination} • {t.startDate || '-'} {t.endDate ? ` / ${t.endDate}` : ''}</div>
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: '700', background: t.status === 'completed' ? '#f1f5f9' : '#eff6ff', color: t.status === 'completed' ? '#64748b' : '#2563eb', padding: '2px 6px', borderRadius: '4px' }}>
                              {t.status === 'completed' ? 'Tamamlandı' : t.status === 'active' ? 'Devam Ediyor' : 'Planlandı'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Kontrol Listeleri */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>
                        <CheckSquare size={14} color="#059669" />
                        Kontrol Listeleri (Checklists)
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '6px' }}>
                        {individualSummaryData.checklists.length} Liste
                      </span>
                    </div>

                    {individualSummaryData.checklists.length === 0 ? (
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                        Kayıtlı kontrol listesi bulunmuyor.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {individualSummaryData.checklists.map(c => {
                          const items = c.items || [];
                          const doneCount = items.filter(it => it.done).length;
                          return (
                            <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#1e293b' }}>{c.title}</div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>{c.category || 'Genel'}</div>
                              </div>
                              <span style={{ fontSize: '9.5px', fontWeight: '700', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>
                                {doneCount}/{items.length} Tamamlandı
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Bütçe Planları */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>
                        <Wallet size={14} color="#d97706" />
                        Bütçe & Harcama Planları
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '6px' }}>
                        {individualSummaryData.budgets.length} Bütçe
                      </span>
                    </div>

                    {individualSummaryData.budgets.length === 0 ? (
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                        Kayıtlı bütçe bulunmuyor.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {individualSummaryData.budgets.map(b => (
                          <div key={b.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#1e293b' }}>{b.title}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>Hedef: {Number(b.targetBudget || 0).toLocaleString('tr-TR')} {b.currency || 'EUR'}</div>
                            </div>
                            <span style={{ fontSize: '9.5px', fontWeight: '700', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                              {b.isShared ? 'Ortak Bütçe' : 'Bireysel Bütçe'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedIndividualSummary(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
