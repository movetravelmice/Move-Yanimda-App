import React, { useState, useRef, useEffect } from 'react';
import Header from '../../components/Header';
import { Users as UsersIcon, UserPlus, ShieldAlert, MoreVertical, Briefcase, Mail, X, Camera, CheckCircle2, Search, Edit3, Trash2, AlertTriangle, ChevronDown, PlaneTakeoff } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('expert');
  const allUsers = useUserStore(state => state.users);
  const addUser = useUserStore(state => state.addUser);
  const updateUser = useUserStore(state => state.updateUser);
  const deleteUser = useUserStore(state => state.deleteUser);
  const cleanLargeAvatars = useUserStore(state => state.cleanLargeAvatars);
  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
      // Çöken tarayıcı kotalarını kurtarmak için devasa base64 resim stringlerini temizle
      cleanLargeAvatars();
  }, [cleanLargeAvatars]);

  const isUserChild = (u) => {
      const fullUser = allUsers.find(usr => usr.id === u.id) || u;
      if (!fullUser) return false;

      // An adult is someone who is a parent to ANYONE
      const isParent = allUsers.some(other => {
          if (!other.linkedTo) return false;
          if (Array.isArray(other.linkedTo)) return other.linkedTo.includes(fullUser.id) || other.linkedTo.includes(String(fullUser.id));
          if (typeof other.linkedTo === 'string') return other.linkedTo === String(fullUser.id);
          return false;
      });
      if (isParent) return false;

      // If they are explicitly marked as a child
      if (fullUser.isChildProfile === true) return true;
      
      // If they have a child email
      if (fullUser.email && fullUser.email.startsWith('child_')) return true;

      // If they have a linkedTo field (and are not a parent)
      const lt = fullUser.linkedTo;
      if (Array.isArray(lt)) return lt.length > 0;
      if (typeof lt === 'string') {
          const val = lt.trim().toLowerCase();
          return val !== '' && val !== 'null' && val !== 'undefined' && val !== '[]' && val !== '-';
      }

      return false;
  };

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'expert', avatar: null, password: '', phone: '', company: '', parentIds: [], childrenIds: [] });
  const avatarFileRef = useRef(null);

  const [customerType, setCustomerType] = useState('parent');
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildSearchDropdown, setShowChildSearchDropdown] = useState(false);
  
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [showParentSearchDropdown, setShowParentSearchDropdown] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });

  // Filters
  const [companyFilter, setCompanyFilter] = useState('');
  const allCompanies = useUserStore(state => state.companies);

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanyAutocomplete, setShowCompanyAutocomplete] = useState(false);
  const allCompaniesSafe = Array.isArray(allCompanies) ? allCompanies.map(c => String(c || '')) : ['Move Travel & Mice'];
  const filteredFormCompanies = allCompaniesSafe.filter(c => c && c.toLowerCase().includes((formData.company || '').toLowerCase()));

  const [showChildrenInList, setShowChildrenInList] = useState(true);
  const filteredUsers = allUsers.filter(u => {
      if (u.role !== activeTab) return false;
      if (activeTab === 'customer') {
          if (!showChildrenInList && isUserChild(u)) return false;
          if (companyFilter && (!u.company || !u.company.toLowerCase().includes(companyFilter.toLowerCase()))) return false;
      }
      return true;
  });

  const stats = {
      admin: allUsers.filter(u => u.role === 'admin').length,
      expert: allUsers.filter(u => u.role === 'expert').length,
      ticketing: allUsers.filter(u => u.role === 'ticketing').length,
      customer: allUsers.filter(u => u.role === 'customer').length,
  };

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
      setFormData({ firstName: '', lastName: '', email: '', role: activeTab, avatar: null, password: '', phone: '', company: '', parentIds: [], childrenIds: [] });
      setCustomerType('parent');
      setChildSearchQuery('');
      setEditingUserId(null);
      setShowAddModal(true);
  };

  const handleEdit = (user) => {
      // Split name safely
      const nameParts = user.name ? user.name.split(' ') : [''];
      const first = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0];
      const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      const existingLinkedTo = Array.isArray(user.linkedTo) ? user.linkedTo : (user.linkedTo ? [user.linkedTo] : []);
      const isChildUser = existingLinkedTo.length > 0;
      
      const childrenIds = allUsers.filter(u => {
          const uLinkedTo = Array.isArray(u.linkedTo) ? u.linkedTo : (u.linkedTo ? [u.linkedTo] : []);
          return uLinkedTo.includes(user.id);
      }).map(u => u.id);

      setFormData({
          firstName: first || '',
          lastName: last || '',
          email: user.email || '',
          role: user.role || 'customer',
          avatar: user.avatar || null,
          phone: user.phone || '',
          company: user.company || '',
          password: '',
          parentIds: isChildUser ? existingLinkedTo : [],
          childrenIds: childrenIds
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
  
  // If editing, password is optional. If creating, it's mandatory.
  const canSubmit = editingUserId ? (formData.password === '' || isPasswordValid) : isPasswordValid;

  const handleSubmit = async (e) => {
      try {
          if (e) e.preventDefault();
          if (!formData.firstName) {
              setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'İsim alanı zorunludur.' });
              return;
          }
          
          if (formData.role !== 'customer' || customerType === 'parent') {
              if (!formData.email) {
                  setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'E-posta alanı zorunludur.' });
                  return;
              }
              if (!canSubmit) {
                  setPopupMsg({ show: true, type: 'error', title: 'Geçersiz Şifre', text: 'Lütfen geçerli bir parola belirleyin.' });
                  return;
              }
          }
          
          const fullName = `${formData.firstName} ${formData.lastName || ''}`.trim();
          
          const isChild = formData.role === 'customer' && customerType === 'child';
          const finalEmail = isChild && !formData.email ? `child_${Date.now()}@move.local` : formData.email;
          const finalPassword = isChild && (!formData.password || formData.password.trim() === '') ? '123456' : formData.password;
          
          const userPayload = {
              name: fullName,
              email: finalEmail,
              role: formData.role,
              avatar: formData.avatar,
              phone: isChild ? '-' : (formData.phone || '-'),
              company: formData.role === 'customer' ? (isChild ? 'Move Travel & Mice' : (formData.company || 'Move Travel & Mice')) : 'Move Travel & Mice',
              isChildProfile: isChild
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
          
          // Optional: If they switched from child to parent, maybe we should clear their linkedTo? 
          // For now, let's just make sure we don't accidentally overwrite existing linkedTo unless we need to.
          
          if (editingUserId) {
              updateUser(editingUserId, userPayload);
              if (currentUser && currentUser.id === editingUserId) {
                  useAuthStore.getState().updateProfile(userPayload);
              }
              
                  // Update children if needed
              if (formData.role === 'customer' && customerType === 'parent') {
                  const currentChildren = allUsers.filter(u => {
                      const uLinkedTo = Array.isArray(u.linkedTo) ? u.linkedTo : (u.linkedTo ? [u.linkedTo] : []);
                      return uLinkedTo.includes(editingUserId);
                  });
                  
                  // Remove from removed children
                  for (const child of currentChildren) {
                      if (!formData.childrenIds.includes(child.id)) {
                          const existingLinkedTo = Array.isArray(child.linkedTo) ? child.linkedTo : (typeof child.linkedTo === 'string' ? [child.linkedTo] : []);
                          const newLinkedTo = existingLinkedTo.filter(id => id !== editingUserId);
                          updateUser(child.id, { linkedTo: newLinkedTo.length > 0 ? newLinkedTo : null });
                      }
                  }
                  
                  // Add to new children
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
              
              // Wait for user to be created and link children if it returns an object or if we can handle it
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

              if (isChild && formData.parentIds.length > 0) {
                  const parentNames = formData.parentIds.map(pid => allUsers.find(p => p.id === pid)?.name).filter(Boolean).join(', ');
                  setPopupMsg({ 
                      show: true, 
                      type: 'success', 
                      title: 'Çocuk Profili Oluşturuldu!', 
                      text: (
                          <div style={{ textAlign: 'left', width: '100%' }}>
                              <p style={{marginBottom: '12px', color: 'var(--text-main)', fontWeight: 'bold'}}>Aşağıdaki e-posta ebeveynlere gönderildi:</p>
                              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontFamily: 'sans-serif', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                      <div style={{ width: '48px', height: '48px', background: '#D7147A', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>
                                          M
                                      </div>
                                  </div>
                                  <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
                                      <b>Sayın {parentNames || 'Müşterimiz'},</b><br/><br/>
                                      Move sistemine <b>{newUser.name}</b> adlı çocuğunuzun profili başarıyla eklenmiş ve sizin hesabınıza bağlanmıştır.<br/><br/>
                                      <div style={{ background: '#fdf2f8', padding: '12px', borderRadius: '8px', border: '1px solid #fbcfe8', color: '#D7147A', textAlign: 'center', margin: '16px 0', fontSize: '13px', fontWeight: '600' }}>
                                          Sisteme giriş yaparak "Profil" sayfanız üzerinden çocuğunuzun sağlık ve acil durum bilgilerini hemen yönetmeye başlayabilirsiniz.
                                      </div>
                                      Bizi tercih ettiğiniz için teşekkür ederiz.<br/><br/>
                                      <span style={{fontSize: '12px', color: '#94a3b8'}}>Move Travel & Mice</span>
                                  </div>
                              </div>
                          </div>
                      ) 
                  });
              } else {
                  setPopupMsg({ show: true, type: 'success', title: 'Başarılı!', text: `Kullanıcı profili başarıyla oluşturuldu.` });
              }
          }
          
          setShowAddModal(false);
          setActiveTab(formData.role);
          
          if (editingUserId) {
              setPopupMsg({ show: true, type: 'success', title: 'Başarılı!', text: `Kullanıcı profili başarıyla güncellendi.` });
          }
          setEditingUserId(null);
      } catch (err) {
          alert("HATA OLUŞTU: " + err.message);
      }
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh', position: 'relative' }} onClick={() => setOpenDropdownId(null)}>
      
      {/* Custom Popup */}
      {popupMsg.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
              <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '340px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: popupMsg.type === 'success' ? '#ecfdf5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      {popupMsg.type === 'success' ? <CheckCircle2 size={32} color="#10b981" /> : <AlertTriangle size={32} color="#ef4444" />}
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>{popupMsg.title}</h2>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: popupMsg.type === 'error' ? '24px' : '0', lineHeight: 1.5, width: '100%' }}>{popupMsg.text}</div>
                  
                  {popupMsg.type === 'error' && (
                      <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '12px', borderRadius: '12px', marginTop: '16px' }}>
                          Anladım
                      </button>
                  )}
                  {popupMsg.type === 'success' && (
                      <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', width: '100%' }}>
                          <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '12px', borderRadius: '12px' }}>Kapat</button>
                      </div>
                  )}
              </div>
          </div>
      )}

      <Header title="Kullanıcı Erişimi" showBack />
      
      <div style={{ padding: '24px 16px' }}>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Erişim ve Yetkiler</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sistem rollerini gruplar halinde yönetin.</p>
            </div>
            <button 
                onClick={handleOpenModal}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.2)' }}>
                <UserPlus size={16} /> Yeni Ekle
            </button>
        </div>

        {/* Role Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div 
                onClick={() => setActiveTab('admin')}
                style={{ background: activeTab === 'admin' ? 'var(--primary)' : 'white', color: activeTab === 'admin' ? 'white' : 'var(--text-main)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${activeTab === 'admin' ? 'var(--primary)' : '#e2e8f0'}`, transition: 'all 0.2s', boxShadow: activeTab === 'admin' ? '0 8px 16px rgba(215,20,122,0.2)' : 'none' }}>
                <ShieldAlert size={24} style={{ margin: '0 auto 8px auto', opacity: activeTab === 'admin' ? 1 : 0.6 }} />
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Yöneticiler</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{stats.admin} Kişi</div>
            </div>

            <div 
                onClick={() => setActiveTab('expert')}
                style={{ background: activeTab === 'expert' ? 'var(--primary)' : 'white', color: activeTab === 'expert' ? 'white' : 'var(--text-main)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${activeTab === 'expert' ? 'var(--primary)' : '#e2e8f0'}`, transition: 'all 0.2s', boxShadow: activeTab === 'expert' ? '0 8px 16px rgba(215,20,122,0.2)' : 'none' }}>
                <Briefcase size={24} style={{ margin: '0 auto 8px auto', opacity: activeTab === 'expert' ? 1 : 0.6 }} />
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Uzmanlar</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{stats.expert} Kişi</div>
            </div>

            <div 
                onClick={() => setActiveTab('ticketing')}
                style={{ background: activeTab === 'ticketing' ? 'var(--primary)' : 'white', color: activeTab === 'ticketing' ? 'white' : 'var(--text-main)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${activeTab === 'ticketing' ? 'var(--primary)' : '#e2e8f0'}`, transition: 'all 0.2s', boxShadow: activeTab === 'ticketing' ? '0 8px 16px rgba(215,20,122,0.2)' : 'none' }}>
                <PlaneTakeoff size={24} style={{ margin: '0 auto 8px auto', opacity: activeTab === 'ticketing' ? 1 : 0.6 }} />
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Biletleme</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{stats.ticketing} Kişi</div>
            </div>

            <div 
                onClick={() => setActiveTab('customer')}
                style={{ background: activeTab === 'customer' ? 'var(--primary)' : 'white', color: activeTab === 'customer' ? 'white' : 'var(--text-main)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${activeTab === 'customer' ? 'var(--primary)' : '#e2e8f0'}`, transition: 'all 0.2s', boxShadow: activeTab === 'customer' ? '0 8px 16px rgba(215,20,122,0.2)' : 'none' }}>
                <UsersIcon size={24} style={{ margin: '0 auto 8px auto', opacity: activeTab === 'customer' ? 1 : 0.6 }} />
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Müşteriler</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{stats.customer} Kişi</div>
            </div>
        </div>

        {/* User List Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {activeTab === 'admin' ? 'Sistem Yöneticileri' : activeTab === 'expert' ? 'Aktif Seyahat Uzmanları' : activeTab === 'ticketing' ? 'Biletleme Uzmanları' : 'Müşteri Portföyü'}
            </h3>
            
            {activeTab === 'customer' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                        onClick={() => setShowChildrenInList(!showChildrenInList)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showChildrenInList ? '#fdf4ff' : 'white', color: showChildrenInList ? '#c026d3' : '#64748b', border: `1px solid ${showChildrenInList ? '#fae8ff' : '#e2e8f0'}`, borderRadius: '12px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: showChildrenInList ? '#c026d3' : '#cbd5e1' }}></div>
                        Çocuklar
                    </button>
                    <div style={{ position: 'relative', width: '200px' }}>
                        <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text"
                            placeholder="Firmalarda Ara..."
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                        />
                    </div>
                </div>
            )}
        </div>
        
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'visible' }}>
            {filteredUsers.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Bu grupta henüz kullanıcı bulunmuyor.
                </div>
            ) : (
                filteredUsers.map((user, idx) => (
                    <div key={user.id} style={{ padding: '16px', borderBottom: idx !== filteredUsers.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={user.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {user.name}
                                {user.role === 'admin' && <ShieldAlert size={14} color="#ef4444" />}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <Mail size={12} /> {user.email}
                            </div>
                            {user.role === 'customer' && user.company && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 'bold' }}>
                                    <Briefcase size={12} /> {user.company}
                                </div>
                            )}
                        </div>
                        <div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                                style={{ background: user.status === 'Aktif' ? '#dcfce7' : '#fee2e2', color: user.status === 'Aktif' ? '#166534' : '#991b1b', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: user.status === 'Aktif' ? '#166534' : '#991b1b' }}></div>
                                {user.status === 'Aktif' ? 'Aktif' : 'Pasif'}
                            </button>
                        </div>
                        
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === user.id ? null : user.id); }}
                                style={{ background: openDropdownId === user.id ? '#f1f5f9' : 'transparent', border: 'none', color: '#94a3b8', padding: '6px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s', display: 'flex' }}>
                                <MoreVertical size={20} />
                            </button>
                            
                            {openDropdownId === user.id && (
                                <div style={{ position: 'absolute', right: 0, top: '40px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', zIndex: 10, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '150px' }}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(user); setOpenDropdownId(null); }}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f8fafc' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Edit3 size={14} color="var(--primary)" /> Profili Düzenle
                                    </button>
                                    
                                    {currentUser?.role === 'admin' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(user.id); setOpenDropdownId(null); }}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Trash2 size={14} /> Kullanıcıyı Sil
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
              <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                  
                  {/* Modal Header */}
                  <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {editingUserId ? <Edit3 size={20} color="var(--primary)" /> : <UserPlus size={20} color="var(--primary)" />}
                          {editingUserId ? 'Profili Güncelle' : 'Yeni Kullanıcı'}
                      </h3>
                      <button onClick={() => setShowAddModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <X size={16} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                      
                      {/* Customer Type Toggle */}
                      {formData.role === 'customer' && (
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <button 
                                  onClick={() => setCustomerType('parent')}
                                  style={{ flex: 1, padding: '10px 4px', fontSize: '13px', whiteSpace: 'nowrap', borderRadius: '8px', border: 'none', background: customerType === 'parent' ? 'white' : 'transparent', color: customerType === 'parent' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: customerType === 'parent' ? 'bold' : '500', boxShadow: customerType === 'parent' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                  Ana Müşteri
                              </button>
                              <button 
                                  onClick={() => setCustomerType('child')}
                                  style={{ flex: 1, padding: '10px 4px', fontSize: '13px', whiteSpace: 'nowrap', borderRadius: '8px', border: 'none', background: customerType === 'child' ? 'white' : 'transparent', color: customerType === 'child' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: customerType === 'child' ? 'bold' : '500', boxShadow: customerType === 'child' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                  Çocuk Kullanıcı
                              </button>
                          </div>
                      )}

                      {/* Avatar Upload */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                          <label style={{ 
                                width: '80px', height: '80px', borderRadius: '50%', 
                                background: formData.avatar ? 'transparent' : '#f1f5f9', 
                                border: formData.avatar ? 'none' : '2px dashed #cbd5e1', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                cursor: 'pointer', overflow: 'hidden', position: 'relative', 
                                transition: 'all 0.2s' 
                          }}>
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: 'none' }}
                                  onChange={handleImageUpload}
                              />
                              
                              {formData.avatar ? (
                                  <img src={formData.avatar} alt="Seçilen Yüz" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                  <Camera size={28} color="#94a3b8" />
                              )}
                              
                              {!formData.avatar && (
                                <div style={{ position: 'absolute', bottom: '8px', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>YÜKLE</div>
                              )}
                          </label>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Gerçek bir portre veya yetki amblemi yükleyin</div>
                      </div>

                      {/* Inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>İsim</label>
                                  <input 
                                      type="text" 
                                      required
                                      placeholder="Örn: Emir" 
                                      value={formData.firstName}
                                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                                  />
                              </div>
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Soyisim</label>
                                  <input 
                                      type="text" 
                                      required
                                      placeholder="Örn: Yılmaz" 
                                      value={formData.lastName}
                                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                                  />
                              </div>
                          </div>
                          
                              {!(formData.role === 'customer' && customerType === 'child') && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                      <div>
                                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>E-Posta Adresi</label>
                                          <input 
                                              type="email" 
                                              required
                                              placeholder="emir@mail.com" 
                                              value={formData.email}
                                              onChange={e => setFormData({...formData, email: e.target.value})}
                                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                                          />
                                      </div>

                                      <div>
                                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Telefon No</label>
                                          <input 
                                              type="tel" 
                                              required
                                              placeholder="555..." 
                                              value={formData.phone}
                                              onChange={e => setFormData({...formData, phone: e.target.value})}
                                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                                          />
                                      </div>
                                  </div>
                              )}

                              {!(formData.role === 'customer' && customerType === 'child') && (
                                  <div style={{ position: 'relative' }}>
                                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Atanacak Rol</label>
                                      <div 
                                          tabIndex={0}
                                          onBlur={() => setTimeout(() => setShowRoleDropdown(false), 200)}
                                          onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                          style={{ 
                                              position: 'relative',
                                              width: '100%', 
                                              padding: '10px 36px 10px 12px', 
                                              borderRadius: showRoleDropdown ? '8px 8px 0 0' : '8px', 
                                              border: '1px solid var(--border-color)', 
                                              background: 'white',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              fontSize: '13px',
                                              transition: 'border-radius 0.2s ease',
                                              outline: 'none'
                                          }}>
                                          <span style={{ flex: 1, color: formData.role ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                              {formData.role === 'admin' ? 'Sistem Yöneticisi' : formData.role === 'expert' ? 'Bölge Uzmanı' : formData.role === 'ticketing' ? 'Biletleme Uzmanı' : formData.role === 'customer' ? 'Müşteri' : 'Rol Seçin...'}
                                          </span>
                                          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: `translateY(-50%) ${showRoleDropdown ? 'rotate(180deg)' : 'rotate(0)'}`, pointerEvents: 'none', color: 'var(--text-muted)', transition: 'transform 0.2s ease' }}>
                                              <ChevronDown size={16} />
                                          </div>
                                      </div>

                                      {showRoleDropdown && (
                                          <div style={{ 
                                              position: 'absolute', top: '100%', left: 0, right: 0, 
                                              background: 'white', 
                                              border: '1px solid var(--border-color)', 
                                              borderTop: 'none',
                                              borderRadius: '0 0 8px 8px', 
                                              boxShadow: '0 8px 16px rgba(0,0,0,0.08)', 
                                              zIndex: 1000, 
                                              overflow: 'hidden' 
                                          }}>
                                              {[
                                                  { val: 'admin', label: 'Sistem Yöneticisi' },
                                                  { val: 'expert', label: 'Bölge Uzmanı' },
                                                  { val: 'ticketing', label: 'Biletleme Uzmanı' },
                                                  { val: 'customer', label: 'Müşteri' }
                                              ].map((r, i) => (
                                                  <div 
                                                      key={r.val}
                                                      onClick={() => {
                                                          setFormData({...formData, role: r.val});
                                                          setShowRoleDropdown(false);
                                                      }}
                                                      style={{ padding: '10px 12px', cursor: 'pointer', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center', fontSize: '13px' }}
                                                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                  >
                                                      <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{r.label}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              )}
                       
                              {!(formData.role === 'customer' && customerType === 'child') && (
                               <div style={{ position: 'relative' }}>
                                   <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Firma/Şirket Adı</label>
                                   <div style={{ position: 'relative' }}>
                                       <input 
                                           type="text" 
                                           name={`random_comp_adm_${Math.random()}`}
                                           autoComplete="off"
                                           data-lpignore="true"
                                           data-form-type="other"
                                           autoCorrect="off"
                                           spellCheck="false"
                                           required
                                           placeholder="Örn: Move Travel & Mice Global" 
                                           value={formData.company}
                                           onChange={e => {
                                               setFormData({...formData, company: e.target.value});
                                               setShowCompanyAutocomplete(true);
                                           }}
                                           onFocus={() => setShowCompanyAutocomplete(true)}
                                           onBlur={() => setTimeout(() => setShowCompanyAutocomplete(false), 200)}
                                           style={{ 
                                               width: '100%', 
                                               padding: '10px 36px 10px 12px', 
                                               borderRadius: showCompanyAutocomplete && filteredFormCompanies.length > 0 ? '8px 8px 0 0' : '8px', 
                                               border: '1px solid var(--border-color)', 
                                               outline: 'none', 
                                               fontSize: '13px',
                                               background: 'white',
                                               transition: 'border-radius 0.2s ease'
                                           }}
                                       />
                                       <div style={{ position: 'absolute', right: '12px', top: '50%', transform: `translateY(-50%) ${showCompanyAutocomplete ? 'rotate(180deg)' : 'rotate(0)'}`, pointerEvents: 'none', color: 'var(--text-muted)', transition: 'transform 0.2s ease' }}>
                                           <ChevronDown size={16} />
                                       </div>
                                   </div>
                                   {showCompanyAutocomplete && filteredFormCompanies.length > 0 && (
                                       <div style={{ 
                                           position: 'absolute', top: '100%', left: 0, right: 0, 
                                           background: 'white', 
                                           border: '1px solid var(--border-color)', 
                                           borderTop: 'none',
                                           borderRadius: '0 0 8px 8px', 
                                           boxShadow: '0 8px 16px rgba(0,0,0,0.08)', 
                                           zIndex: 1000, 
                                           overflow: 'hidden' 
                                       }}>
                                           {filteredFormCompanies.map((c, i) => (
                                               <div 
                                                 key={i}
                                                 onClick={() => {
                                                     setFormData({...formData, company: c});
                                                     setShowCompanyAutocomplete(false);
                                                 }}
                                                 style={{ padding: '10px 12px', cursor: 'pointer', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center', fontSize: '13px' }}
                                                 onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                 onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                               >
                                                   <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{c}</span>
                                               </div>
                                           ))}
                                       </div>
                                   )}
                               </div>
                              )}
                              
                              {formData.role === 'customer' && customerType === 'parent' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          👨‍👩‍👧 Bağlı Çocuklar
                                      </div>

                                      <div style={{ position: 'relative' }}>
                                          <input 
                                              type="text" 
                                              placeholder="Çocuk ismi yazarak arayın..." 
                                              value={childSearchQuery}
                                              onChange={e => {
                                                  setChildSearchQuery(e.target.value);
                                                  setShowChildSearchDropdown(true);
                                              }}
                                              onFocus={() => setShowChildSearchDropdown(true)}
                                              onBlur={() => setTimeout(() => setShowChildSearchDropdown(false), 200)}
                                              style={{ width: '100%', padding: '10px 12px', borderRadius: showChildSearchDropdown && childSearchQuery.length > 0 ? '8px 8px 0 0' : '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: 'white', transition: 'border-radius 0.2s' }}
                                          />
                                          {showChildSearchDropdown && childSearchQuery.length > 0 && (
                                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', zIndex: 1000, overflow: 'hidden', maxHeight: '150px', overflowY: 'auto' }}>
                                                  {allUsers.filter(u => u.role === 'customer' && u.id !== editingUserId && !formData.childrenIds.includes(u.id) && isUserChild(u) && u.name.toLowerCase().includes(childSearchQuery.toLowerCase())).map(u => (
                                                      <div 
                                                          key={u.id}
                                                          onMouseDown={(e) => {
                                                              // use onMouseDown so it fires before onBlur
                                                              e.preventDefault();
                                                              setFormData({...formData, childrenIds: [...formData.childrenIds, u.id]});
                                                              setChildSearchQuery('');
                                                              setShowChildSearchDropdown(false);
                                                          }}
                                                          style={{ padding: '10px 12px', cursor: 'pointer', borderTop: '1px solid #f8fafc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                      >
                                                          <img src={u.avatar} style={{width: '24px', height: '24px', borderRadius: '50%'}} />
                                                          <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{u.name}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>

                                      {formData.childrenIds.length > 0 && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {formData.childrenIds.map(childId => {
                                                  const cObj = allUsers.find(u => u.id === childId);
                                                  if(!cObj) return null;
                                                  return (
                                                      <div key={childId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              <img src={cObj.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>{cObj.name}</span>
                                                          </div>
                                                          <button 
                                                              type="button"
                                                              onClick={() => setFormData({...formData, childrenIds: formData.childrenIds.filter(id => id !== childId)})}
                                                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                          >
                                                              <Trash2 size={14} />
                                                          </button>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )}
                                  </div>
                              )}
                              
                              {formData.role === 'customer' && customerType === 'child' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#fdf2f8', padding: '16px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          👨‍👩‍👧 Bağlı Ebeveynler (Birden fazla seçilebilir)
                                      </div>

                                      <div style={{ position: 'relative' }}>
                                          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                              <Search size={16} />
                                          </div>
                                          <input 
                                              type="text" 
                                              placeholder="Ebeveyn isim veya soyisim yazın..." 
                                              value={parentSearchQuery}
                                              onChange={e => {
                                                  setParentSearchQuery(e.target.value);
                                                  setShowParentSearchDropdown(true);
                                              }}
                                              onFocus={() => setShowParentSearchDropdown(true)}
                                              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: showParentSearchDropdown && parentSearchQuery.length > 0 ? '8px 8px 0 0' : '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: 'white', transition: 'border-radius 0.2s' }}
                                          />
                                          {showParentSearchDropdown && parentSearchQuery.length > 0 && (
                                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', zIndex: 1000, overflow: 'hidden', maxHeight: '150px', overflowY: 'auto' }}>
                                                  {allUsers.filter(u => u.role === 'customer' && u.id !== editingUserId && !formData.parentIds.includes(u.id) && !isUserChild(u) && u.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).map(u => (
                                                      <div 
                                                          key={u.id}
                                                          onMouseDown={(e) => {
                                                              e.preventDefault();
                                                              setFormData({...formData, parentIds: [...formData.parentIds, u.id]});
                                                              setParentSearchQuery('');
                                                              setShowParentSearchDropdown(false);
                                                          }}
                                                          style={{ padding: '10px 12px', cursor: 'pointer', borderTop: '1px solid #f8fafc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                      >
                                                          <img src={u.avatar} style={{width: '24px', height: '24px', borderRadius: '50%'}} />
                                                          <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{u.name}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>

                                      {formData.parentIds.length > 0 && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {formData.parentIds.map(parentId => {
                                                  const pObj = allUsers.find(u => u.id === parentId);
                                                  if(!pObj) return null;
                                                  return (
                                                      <div key={parentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              <img src={pObj.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>{pObj.name}</span>
                                                          </div>
                                                          <button 
                                                              type="button"
                                                              onClick={() => setFormData({...formData, parentIds: formData.parentIds.filter(id => id !== parentId)})}
                                                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                          >
                                                              <Trash2 size={14} />
                                                          </button>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )}
                                  </div>
                              )}
                          {!(formData.role === 'customer' && customerType === 'child') && (
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Atanacak Şifre</label>
                                  <input 
                                      type="text" 
                                      required={!editingUserId}
                                      placeholder={editingUserId ? "Değiştirmek istemiyorsanız boş bırakın" : "Güvenli bir şifre girin"} 
                                      value={formData.password}
                                      onChange={e => setFormData({...formData, password: e.target.value})}
                                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', marginBottom: '8px' }}
                                  />
                                  
                                  {/* Password Strength Radars */}
                                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                     <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-main)' }}>Parola Gücü Kriterleri</div>
                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: pStrength.upper ? '#10B981' : 'var(--text-muted)' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: pStrength.upper ? '#10B981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{pStrength.upper && <CheckCircle2 size={10} />}</div>
                                            1 Büyük Harf
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: pStrength.lower ? '#10B981' : 'var(--text-muted)' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: pStrength.lower ? '#10B981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{pStrength.lower && <CheckCircle2 size={10} />}</div>
                                            1 Küçük Harf
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: pStrength.number ? '#10B981' : 'var(--text-muted)' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: pStrength.number ? '#10B981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{pStrength.number && <CheckCircle2 size={10} />}</div>
                                            1 Rakam (0-9)
                                         </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: pStrength.special ? '#10B981' : 'var(--text-muted)' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: pStrength.special ? '#10B981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{pStrength.special && <CheckCircle2 size={10} />}</div>
                                            Özel Karakter (!@#$)
                                         </div>
                                     </div>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Submit */}
                      <button 
                         type="button" 
                         onClick={handleSubmit}
                         style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', marginTop: '24px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.2)', transition: 'all 0.2s' }}>
                          <CheckCircle2 size={18} /> {editingUserId ? 'Değişiklikleri Kaydet' : 'Kaydı Tamamla'}
                      </button>

                  </div>
              </div>
          </div>
      )}
      {/* Delete Confirmation Modal */}
      {userToDelete && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
              <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '380px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                  
                  <div style={{ background: '#fef2f2', padding: '32px 20px', textAlign: 'center', borderBottom: '1px solid #fee2e2' }}>
                      <div style={{ background: '#f87171', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 8px 16px rgba(248,113,113,0.3)' }}>
                          <AlertTriangle size={32} color="white" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>Emin Misiniz?</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c', opacity: 0.8 }}>Bu kullanıcı sistemden kalıcı olarak silinecek ve tüm erişimi anında kesilecektir. Bu işlem geri alınamaz!</p>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', gap: '12px', background: 'white' }}>
                      <button onClick={() => setUserToDelete(null)} style={{ flex: 1, background: 'white', color: 'var(--text-main)', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                          Geri Dön
                      </button>
                      <button onClick={confirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', transition: 'all 0.2s' }}>
                          Kalıcı Olarak Sil
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
