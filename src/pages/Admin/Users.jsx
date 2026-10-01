import React, { useState, useRef } from 'react';
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
  Luggage,
  CheckSquare,
  Wallet,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore, formatTitleCase } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

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

  // Segment Filter State (Tümü / Kurumsal / Bireysel)
  const [segmentFilter, setSegmentFilter] = useState('all'); // 'all' | 'corporate' | 'individual'
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
    phone: '', 
    company: '', 
    parentIds: [], 
    childrenIds: [], 
    tcNo: '' 
  });

  const [customerType, setCustomerType] = useState('parent');
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildSearchDropdown, setShowChildSearchDropdown] = useState(false);
  
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [showParentSearchDropdown, setShowParentSearchDropdown] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });

  // Filters
  const [companyFilter, setCompanyFilter] = useState('');
  const allCompanies = useUserStore(state => state.companies) || [];

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanyAutocomplete, setShowCompanyAutocomplete] = useState(false);
  const allCompaniesSafe = Array.isArray(allCompanies) ? allCompanies.map(c => String(c || '')).filter(c => c && !c.toLowerCase().includes('tgundogan')) : ['Move Travel & Mice'];
  const filteredFormCompanies = allCompaniesSafe.filter(c => c && c.toLowerCase().includes((formData.company || '').toLowerCase()));

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
  
  // Customer counting (Corporate vs Individual customers)
  const customerUsers = allUsers.filter(u => {
    const isIndiv = u.userType === 'individual';
    const isStaff = u.role === 'expert' || u.role === 'admin' || u.role === 'ticketing';
    return !isStaff && (u.role === 'customer' || isIndiv);
  });
  const customerTotalCount = customerUsers.length;
  const customerCorporateCount = customerUsers.filter(u => u.userType !== 'individual').length;
  const customerIndividualCount = customerUsers.filter(u => u.userType === 'individual').length;

  const stats = {
      admin: allUsers.filter(u => u.role === 'admin' && u.userType !== 'individual').length,
      expert: allUsers.filter(u => u.role === 'expert' && u.userType !== 'individual').length,
      ticketing: allUsers.filter(u => u.role === 'ticketing' && u.userType !== 'individual').length,
      customer: customerTotalCount,
  };

  const filteredUsers = allUsers.filter(u => {
      const isIndiv = u.userType === 'individual';

      if (activeTab === 'customer') {
          // Must be a customer (not staff)
          const isStaff = u.role === 'expert' || u.role === 'admin' || u.role === 'ticketing';
          if (isStaff) return false;
          if (u.role !== 'customer' && !isIndiv) return false;

          // Segment Filter within customer tab
          if (segmentFilter === 'corporate' && isIndiv) return false;
          if (segmentFilter === 'individual' && !isIndiv) return false;

          // For corporate customers, check children and company filters
          if (!isIndiv) {
              if (!showChildrenInList && isUserChild(u)) return false;
              if (companyFilter && (!u.company || !u.company.toLowerCase().includes(companyFilter.toLowerCase()))) return false;
          }
      } else {
          // Staff tabs: expert, admin, ticketing
          if (u.role !== activeTab) return false;
          if (isIndiv) return false;
      }

      const qs = searchQuery.toLowerCase().trim();
      if (qs) {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const comp = (u.company || '').toLowerCase();
        if (!name.includes(qs) && !email.includes(qs) && !phone.includes(qs) && !comp.includes(qs)) {
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
      setFormData({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        role: activeTab === 'customer' ? 'customer' : (activeTab || 'expert'), 
        userType: 'corporate',
        avatar: null, 
        password: '', 
        phone: '', 
        company: '', 
        parentIds: [], 
        childrenIds: [], 
        tcNo: '' 
      });
      setCustomerType('parent');
      setChildSearchQuery('');
      setParentSearchQuery('');
      setEditingUserId(null);
      setShowAddModal(true);
  };

  const handleEdit = (user) => {
      const nameParts = user.name ? user.name.split(' ') : [''];
      const first = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0];
      const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      const existingLinkedTo = Array.isArray(user.linkedTo) ? user.linkedTo : (user.linkedTo ? [user.linkedTo] : []);
      const isChildUser = existingLinkedTo.length > 0;
      const isIndividual = user.userType === 'individual';
      
      const childrenIds = allUsers.filter(u => {
          const uLinkedTo = Array.isArray(u.linkedTo) ? u.linkedTo : (u.linkedTo ? [u.linkedTo] : []);
          return uLinkedTo.includes(user.id);
      }).map(u => u.id);

      setFormData({
          firstName: first || '',
          lastName: last || '',
          email: user.email || '',
          role: isIndividual ? 'customer' : (user.role || 'customer'),
          userType: isIndividual ? 'individual' : 'corporate',
          avatar: user.avatar || null,
          phone: user.phone || '',
          company: isIndividual ? 'Bireysel' : (user.company || ''),
          password: '',
          parentIds: isChildUser ? existingLinkedTo : [],
          childrenIds: childrenIds,
          tcNo: user.tcNo || ''
      });
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
      return {
          upper: /[A-Z]/.test(pass),
          lower: /[a-z]/.test(pass),
          number: /[0-9]/.test(pass),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
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

          if (!editingUserId && formData.userType === 'individual') {
              setPopupMsg({ show: true, type: 'error', title: 'İşlem İzin Verilmiyor', text: 'Bireysel kullanıcılar yalnızca kayıt ekranından kendi hesaplarını oluşturabilir.' });
              return;
          }
          
          const isIndividual = formData.userType === 'individual';
          const isChild = !isIndividual && formData.role === 'customer' && customerType === 'child';
          const isCustomer = isIndividual || formData.role === 'customer';
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

          const finalPassword = isChild && (!formData.password || formData.password.trim() === '') ? '123456' : formData.password.trim();
          
          const userPayload = {
              name: fullName,
              email: finalEmail,
              role: isIndividual ? 'customer' : formData.role,
              userType: isIndividual ? 'individual' : 'corporate',
              avatar: formData.avatar,
              phone: isChild ? '-' : (formData.phone || '-'),
              company: isIndividual ? 'Bireysel' : (formData.role === 'customer' ? (isChild ? 'Move Travel & Mice' : (formData.company || 'Move Travel & Mice')) : 'Move Travel & Mice'),
              isChildProfile: isChild,
              tcNo: formData.role === 'customer' ? (formData.tcNo || '') : ''
          };
          if (!editingUserId && isIndividual) {
              userPayload.createdAt = new Date().toISOString();
          }
          if (formData.role === 'customer' && !isIndividual) {
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
          
          setShowAddModal(false);
          if (isIndividual) {
              setActiveTab('customer');
              setSegmentFilter('individual');
          } else {
              setActiveTab(formData.role);
          }
          setPopupMsg({ show: true, type: 'success', title: 'Başarılı!', text: editingUserId ? `Kullanıcı profili güncellendi.` : `Yeni kullanıcı başarıyla eklendi.` });
          setEditingUserId(null);
      } catch (err) {
          alert("HATA: " + err.message);
      }
  };

  const roleTabs = [
    { key: 'expert', label: 'Uzmanlar', count: stats.expert, icon: Briefcase, color: '#D7147A' },
    { key: 'admin', label: 'Yöneticiler', count: stats.admin, icon: ShieldAlert, color: '#2563eb' },
    { key: 'ticketing', label: 'Biletleme', count: stats.ticketing, icon: PlaneTakeoff, color: '#d97706' },
    { key: 'customer', label: 'Müşteriler', count: stats.customer, icon: UsersIcon, color: '#059669' }
  ];

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh', position: 'relative' }} onClick={() => setOpenDropdownId(null)}>
      
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
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                padding: '6px 11px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                fontSize: '11px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                boxShadow: '0 2px 6px rgba(215, 20, 122, 0.25)',
                transition: 'transform 0.15s'
              }}
            >
              <UserPlus size={13} /> Yeni Kullanıcı
            </button>
          </div>

          {/* Search Input inside Header Card */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '9px', 
            padding: '6px 10px', 
            marginTop: '10px' 
          }}>
            <Search size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="İsim, e-posta veya telefon ile ara..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', paddingLeft: '6px', width: '100%', color: '#1e293b' }}
            />
            {searchQuery && (
              <div onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <X size={12} />
              </div>
            )}
          </div>
        </div>

        {/* 2. Kare İkonlu Rol Seçici Butonlar (Yazısız ve Sayısız) - Her zaman üstte */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px', 
          marginBottom: '14px' 
        }}>
          {roleTabs.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                title={tab.label}
                style={{
                  aspectRatio: '1',
                  background: isActive ? 'var(--primary)' : 'white',
                  color: isActive ? 'white' : '#64748b',
                  borderRadius: '16px',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  boxShadow: isActive ? '0 4px 14px rgba(215, 20, 122, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  padding: 0,
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                <IconComponent size={22} strokeWidth={isActive ? 2.4 : 2} />
              </button>
            );
          })}
        </div>

        {/* Selected Role Title & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeTab === 'customer' ? '10px' : '12px', padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>
              {activeTab === 'expert' ? 'Seyahat Uzmanları' : activeTab === 'admin' ? 'Sistem Yöneticileri' : activeTab === 'ticketing' ? 'Biletleme Personeli' : 'Müşteri Portföyü'}
            </h3>
            <span style={{ fontSize: '9.5px', fontWeight: '800', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '6px', border: '1px solid rgba(215, 20, 122, 0.15)' }}>
              {filteredUsers.length} Kişi
            </span>
          </div>
        </div>

        {/* Kurumsal ve Bireysel Segment Filtresi: Sadece Müşteri Portföyü sekmesindeyken gösterilir */}
        {activeTab === 'customer' && (
          <div style={{ marginBottom: '14px' }}>
            {/* Segmented Filter: [ Tümü ] [ Kurumsal ] [ Bireysel ] */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              marginBottom: '10px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => { setSegmentFilter('all'); setSearchQuery(''); }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: segmentFilter === 'all' ? 'white' : 'transparent',
                  color: segmentFilter === 'all' ? '#1e293b' : '#64748b',
                  boxShadow: segmentFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Tümü ({customerTotalCount})
              </button>
              <button
                type="button"
                onClick={() => { setSegmentFilter('corporate'); setSearchQuery(''); }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: segmentFilter === 'corporate' ? '#eff6ff' : 'transparent',
                  color: segmentFilter === 'corporate' ? '#2563eb' : '#64748b',
                  border: segmentFilter === 'corporate' ? '1px solid #bfdbfe' : '1px solid transparent',
                  boxShadow: segmentFilter === 'corporate' ? '0 2px 6px rgba(37, 99, 235, 0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Kurumsal ({customerCorporateCount})
              </button>
              <button
                type="button"
                onClick={() => { setSegmentFilter('individual'); setSearchQuery(''); }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: segmentFilter === 'individual' ? '#fdf2f8' : 'transparent',
                  color: segmentFilter === 'individual' ? '#D7147A' : '#64748b',
                  border: segmentFilter === 'individual' ? '1px solid #fbcfe8' : '1px solid transparent',
                  boxShadow: segmentFilter === 'individual' ? '0 2px 6px rgba(215, 20, 122, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Bireysel ({customerIndividualCount})
              </button>
            </div>

            {/* Bireysel Segment Banner */}
            {segmentFilter === 'individual' ? (
              <div style={{
                background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)',
                border: '1px solid #fbcfe8',
                borderRadius: '14px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#D7147A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e293b' }}>Bireysel Seyahat Kullanıcıları</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Kişisel asistan kullanan kayıtlı bireysel kullanıcı portföyü</div>
                </div>
              </div>
            ) : (
              /* Kurumsal & Tümü için Çocuklar ve Firma Filtresi */
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'white',
                padding: '8px 10px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <button 
                  type="button"
                  onClick={() => setShowChildrenInList(!showChildrenInList)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    background: showChildrenInList ? 'var(--primary-light)' : '#f8fafc', 
                    color: showChildrenInList ? 'var(--primary)' : '#64748b', 
                    border: `1px solid ${showChildrenInList ? 'var(--primary)' : '#e2e8f0'}`, 
                    borderRadius: '8px', 
                    padding: '4px 8px', 
                    fontSize: '10.5px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: showChildrenInList ? 'var(--primary)' : '#cbd5e1' }} />
                  Çocuklar ({allUsers.filter(u => u.role === 'customer' && u.userType !== 'individual' && isUserChild(u)).length})
                </button>

                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Firma Filtrele..." 
                    value={companyFilter}
                    onChange={e => setCompanyFilter(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '4px 8px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '10.5px', 
                      outline: 'none', 
                      background: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Compact User Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
              Arama kriterlerine uygun kullanıcı bulunamadı.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isChild = isUserChild(user);
              return (
                <div 
                  key={user.id} 
                  style={{ 
                    background: 'white', 
                    borderRadius: '14px', 
                    border: '1px solid #e2e8f0', 
                    padding: '10px 12px',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Avatar */}
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    border: user.role === 'admin' ? '1.5px solid #2563eb' : user.role === 'expert' ? '1.5px solid var(--primary)' : '1px solid #e2e8f0', 
                    flexShrink: 0,
                    background: '#f1f5f9'
                  }}>
                    <img 
                      src={user.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=60&w=100"} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      alt={user.name} 
                    />
                  </div>

                  {/* User Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', minWidth: 0 }}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatTitleCase(user.name)}
                      </span>
                      {/* Bireysel / Kurumsal / Çocuk etiketleri sadece Müşteri Portföyü sekmesinde gösterilir */}
                      {activeTab === 'customer' && (
                        user.userType === 'individual' ? (
                          <span style={{ fontSize: '8.5px', background: '#fdf2f8', color: '#be185d', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', border: '1px solid #fbcfe8', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Sparkles size={8} /> BİREYSEL
                          </span>
                        ) : (
                          <span style={{ fontSize: '8.5px', background: '#eff6ff', color: '#1d4ed8', fontWeight: '800', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                            KURUMSAL
                          </span>
                        )
                      )}
                      {activeTab === 'customer' && isChild && (
                        <span style={{ fontSize: '8.5px', background: '#fdf4ff', color: '#c026d3', fontWeight: '800', padding: '1px 4px', borderRadius: '4px', border: '1px solid #fae8ff' }}>
                          Çocuk
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', minWidth: 0 }}>
                      <Mail size={10} style={{ flexShrink: 0 }} /> 
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(user.email || '').toLowerCase()}</span>
                    </div>

                    {user.phone && user.phone !== '-' && (
                      <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px', minWidth: 0 }}>
                        <Phone size={9} style={{ flexShrink: 0 }} /> 
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {user.userType === 'individual' ? (
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Calendar size={9} style={{ flexShrink: 0 }} />
                        <span>Kayıt: {user.createdAt ? (new Date(user.createdAt.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString('tr-TR')) : 'Mevcut'}</span>
                      </div>
                    ) : (
                      user.company && (
                        <div style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px', minWidth: 0 }}>
                          <Building2 size={9} style={{ flexShrink: 0 }} /> 
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.company}</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* For Individual Users: Read-only Summary Button */}
                  {user.userType === 'individual' && (
                    <button 
                      onClick={() => handleOpenIndividualSummary(user)}
                      style={{ 
                        background: '#fdf2f8', 
                        color: '#D7147A', 
                        border: '1px solid #fbcfe8', 
                        cursor: 'pointer', 
                        fontSize: '9.5px', 
                        fontWeight: '800', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '3px',
                        flexShrink: 0
                      }}
                      title="Bireysel Veri Özetini İncele (Salt Okunur)"
                    >
                      <Eye size={11} /> Özet
                    </button>
                  )}

                  {/* Status Toggle Button */}
                  <button 
                    onClick={() => handleToggleStatus(user)}
                    style={{ 
                      background: user.status === 'Aktif' ? '#ecfdf5' : '#fef2f2', 
                      color: user.status === 'Aktif' ? '#059669' : '#dc2626', 
                      border: `1px solid ${user.status === 'Aktif' ? '#a7f3d0' : '#fecaca'}`, 
                      cursor: 'pointer', 
                      fontSize: '9.5px', 
                      fontWeight: '800', 
                      padding: '3px 7px', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      flexShrink: 0
                    }}
                    title="Durumu Değiştir"
                  >
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: user.status === 'Aktif' ? '#10b981' : '#ef4444' }} />
                    {user.status === 'Aktif' ? 'Aktif' : 'Pasif'}
                  </button>

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
                        minWidth: '140px' 
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(user); setOpenDropdownId(null); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: 'transparent', border: 'none', color: '#1e293b', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Edit3 size={12} color="var(--primary)" /> Düzenle
                        </button>
                        
                        {currentUser?.role === 'admin' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(user.id); setOpenDropdownId(null); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={12} /> Sil
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '380px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {editingUserId ? <Edit3 size={15} color="var(--primary)" /> : <UserPlus size={15} color="var(--primary)" />}
                {editingUserId ? 'Profili Düzenle' : 'Yeni Kullanıcı Oluştur'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={14} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>

              {/* Customer Type Selector (Corporate Customer Only) */}
              {formData.userType !== 'individual' && formData.role === 'customer' && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <button 
                    onClick={() => setCustomerType('parent')}
                    style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '7px', border: 'none', background: customerType === 'parent' ? 'white' : 'transparent', color: customerType === 'parent' ? 'var(--primary)' : '#64748b', fontWeight: '700', boxShadow: customerType === 'parent' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}
                  >
                    Ana Müşteri
                  </button>
                  <button 
                    onClick={() => setCustomerType('child')}
                    style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '7px', border: 'none', background: customerType === 'child' ? 'white' : 'transparent', color: customerType === 'child' ? 'var(--primary)' : '#64748b', fontWeight: '700', boxShadow: customerType === 'child' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}
                  >
                    Çocuk Kullanıcı
                  </button>
                </div>
              )}

              {/* Avatar Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', 
                  background: formData.avatar ? 'transparent' : '#f8fafc', 
                  border: formData.avatar ? '2px solid var(--primary)' : '2px dashed #cbd5e1', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', overflow: 'hidden', position: 'relative'
                }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={22} color="#94a3b8" />
                  )}
                </label>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Profil Fotoğrafı Yükle</div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* First & Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>İsim *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Örn: Ahmet" 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>Soyisim</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Yılmaz" 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                {!(formData.role === 'customer' && customerType === 'child') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                        E-Posta {formData.role === 'customer' ? (formData.phone ? '(Opsiyonel)' : '(veya Tel)') : '*'}
                      </label>
                      <input 
                        type="email" 
                        placeholder="ahmet@mail.com" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value.toLowerCase().trim()})}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                        Telefon {formData.role === 'customer' && !formData.email ? '*' : ''}
                      </label>
                      <input 
                        type="tel" 
                        placeholder="555..." 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}

                {/* Role Selector & Corporate Role Protection */}
                {formData.userType === 'individual' ? (
                  <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#be185d', fontWeight: '800', fontSize: '11.5px' }}>
                      <ShieldCheck size={14} /> Bireysel Kullanıcı (Rol Korumalı)
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                      Bireysel kullanıcılara kurumsal yetkiler (Uzman, Yönetici, Biletleme) atanamaz. Rol 'Müşteri (Bireysel)' olarak kilitlidir.
                    </div>
                  </div>
                ) : (
                  !(formData.role === 'customer' && customerType === 'child') && (
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>Sistem Rolü</label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box', fontWeight: '600' }}
                      >
                        <option value="expert">Bölge Uzmanı / Rehber</option>
                        <option value="admin">Sistem Yöneticisi</option>
                        <option value="ticketing">Biletleme Uzmanı</option>
                        <option value="customer">Müşteri</option>
                      </select>
                    </div>
                  )
                )}

                {/* Password Field with Validation Hint */}
                {!(formData.role === 'customer' && customerType === 'child') && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>
                      {editingUserId ? 'Yeni Şifre (Değişmeyecekse Boş Bırakın)' : 'Giriş Şifresi *'}
                    </label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                    {formData.password && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px', fontSize: '9px' }}>
                        <span style={{ color: pStrength.upper ? '#10b981' : '#94a3b8' }}>{pStrength.upper ? '✓' : '○'} Büyük Harf</span>
                        <span style={{ color: pStrength.lower ? '#10b981' : '#94a3b8' }}>{pStrength.lower ? '✓' : '○'} Küçük Harf</span>
                        <span style={{ color: pStrength.number ? '#10b981' : '#94a3b8' }}>{pStrength.number ? '✓' : '○'} Rakam</span>
                        <span style={{ color: pStrength.special ? '#10b981' : '#94a3b8' }}>{pStrength.special ? '✓' : '○'} Özel Karakter</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Company Name (Corporate Only) */}
                {formData.userType !== 'individual' && !(formData.role === 'customer' && customerType === 'child') && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>Firma / Kurum</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Move Travel & Mice" 
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                Vazgeç
              </button>
              <button 
                onClick={handleSubmit}
                style={{ flex: 1.2, padding: '9px', borderRadius: '9px', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(215, 20, 122, 0.25)' }}
              >
                {editingUserId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>

          </div>
        </div>
      )}

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
