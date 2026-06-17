import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import Header from '../components/Header';
import { User, Mail, Phone, Lock, Save, LogOut, Camera, Plane, History, BellRing, BellOff, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import { useUserStore } from '../store/userStore';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const logout = useAuthStore(state => state.logout);
  const { tours } = useTourStore();
  const { users: allUsers, updateUser } = useUserStore();

  const searchParams = new URLSearchParams(window.location.search);
  const childId = searchParams.get('childId');

  // Determine which user to display
  let targetUser = user;
  let isChildProfile = false;
  
  if (childId && user) {
      const childObj = allUsers.find(u => u.id === childId);
      if (childObj) {
          const linkedToArr = Array.isArray(childObj.linkedTo) ? childObj.linkedTo : (childObj.linkedTo ? [childObj.linkedTo] : []);
          if (linkedToArr.includes(user.id)) {
              targetUser = childObj;
              isChildProfile = true;
          }
      }
  }

  const [notifPermission, setNotifPermission] = useState('unsupported');

  useEffect(() => {
     if ('Notification' in window) {
         setNotifPermission(Notification.permission);
     }
  }, []);

  const requestNotifPermission = async () => {
      if ('Notification' in window) {
          const res = await Notification.requestPermission();
          setNotifPermission(res);
          updateProfile({ pushEnabled: res === 'granted' });
      }
  };

  const formatName = (name) => {
    if (!name) return 'Misafir';
    let cleanName = name.replace('.', ' ');
    return cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  const displayName = targetUser ? formatName(targetUser.name) : 'Misafir';

  const getAvatarUrl = (u = targetUser) => {
     if (u?.avatar) return u.avatar;
     const dName = u ? formatName(u.name) : 'Misafir';
     return `https://ui-avatars.com/api/?name=${dName}&background=fff&color=D7147A&bold=true`;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          if (isChildProfile) {
              updateUser(targetUser.id, { avatar: dataUrl });
          } else {
              updateProfile({ avatar: dataUrl });
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const nameParts = (targetUser?.name || '').trim().split(' ');
  const defaultFirst = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || '';
  const defaultLast = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const [formData, setFormData] = useState({
    firstName: defaultFirst,
    lastName: defaultLast,
    email: targetUser?.email || '',
    phone: targetUser?.phone || '',
    company: targetUser?.company || '',
    password: '',
    passportCountry: targetUser?.passportCountry || '',
    passportNo: targetUser?.passportNo || '',
    passportExp: targetUser?.passportExp || '',
    tcNo: targetUser?.tcNo || '',
    bloodType: targetUser?.bloodType || '',
    birthDate: targetUser?.birthDate || '',
    emergencyContactName: targetUser?.emergencyContactName || '',
    emergencyContactPhone: targetUser?.emergencyContactPhone || '',
    allergies: targetUser?.allergies || '',
    medications: targetUser?.medications || '',
    dietaryReq: targetUser?.dietaryReq || ''
  });

  useEffect(() => {
    const np = (targetUser?.name || '').trim().split(' ');
    const df = np.length > 1 ? np.slice(0, -1).join(' ') : np[0] || '';
    const dl = np.length > 1 ? np[np.length - 1] : '';
    setFormData({
        firstName: df,
        lastName: dl,
        email: targetUser?.email || '',
        phone: targetUser?.phone || '',
        company: targetUser?.company || '',
        password: '',
        passportCountry: targetUser?.passportCountry || '',
        passportNo: targetUser?.passportNo || '',
        passportExp: targetUser?.passportExp || '',
        tcNo: targetUser?.tcNo || '',
        bloodType: targetUser?.bloodType || '',
        birthDate: targetUser?.birthDate || '',
        emergencyContactName: targetUser?.emergencyContactName || '',
        emergencyContactPhone: targetUser?.emergencyContactPhone || '',
        allergies: targetUser?.allergies || '',
        medications: targetUser?.medications || '',
        dietaryReq: targetUser?.dietaryReq || ''
    });
  }, [targetUser]);
  
  const [isSaved, setIsSaved] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const updates = { 
        name: fullName, 
        email: formData.email, 
        phone: formData.phone, 
        company: formData.company,
        passportCountry: formData.passportCountry,
        passportNo: formData.passportNo,
        passportExp: formData.passportExp,
        tcNo: formData.tcNo,
        bloodType: formData.bloodType,
        birthDate: formData.birthDate,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        allergies: formData.allergies,
        medications: formData.medications,
        dietaryReq: formData.dietaryReq,
        identityLastEditedBy: user?.name + (isChildProfile ? ` (${targetUser.name} Profili)` : ' (Kendi Hesabı)'),
        identityLastEditedAt: new Date().toISOString()
    };
    if (formData.password.trim() !== '') {
        updates.password = formData.password.trim();
    }
    
    if (isChildProfile) {
        updateUser(targetUser.id, updates);
    } else {
        updateProfile(updates);
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    setFormData(prev => ({ ...prev, password: '' })); // reset input
  };

  const handleLogout = () => {
     if (window.confirm('Oturumu sonlandırmak istediğinize emin misiniz?')) {
         logout();
         navigate('/login');
     }
  };

  const myTours = tours.filter(t => {
      if (user?.role === 'expert') return (t.guideName === user?.name) || (t.expert?.name === user?.name);
      if (user?.role === 'customer') return t.participants?.some(p => p.id === user?.id || p.email === user?.email);
      return true;
  });
  
  const activeCount = myTours.filter(t => t.status === 'active').length;
  const pastCount = myTours.filter(t => t.status === 'past').length;

  return (
    <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5' }}>
      
      <Header title={isChildProfile ? `${formatName(targetUser.name)}` : "Hesap Ayarları"} />

      <div style={{ padding: '0 16px', marginTop: '24px' }}>
          
          {isChildProfile && (
              <button 
                  onClick={() => navigate('/dashboard/profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: 'var(--text-main)', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <ArrowLeft size={16} /> Kendi Profilime Dön
              </button>
          )}

          {/* Avatar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />
              
              <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}
              >
                  <img loading="lazy" src={getAvatarUrl()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
                      <Camera size={16} />
                  </div>
              </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
              
              {isSaved && (
                  <div style={{ padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px', animation: 'fadeIn 0.3s' }}>
                      Profiliniz başarıyla güncellendi! ✅
                  </div>
              )}

              <form onSubmit={handleSubmit}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                     <div className="input-group">
                       <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                           İsim
                       </label>
                       <input 
                         type="text" 
                         className="input-field" 
                         value={formData.firstName}
                         onChange={e => setFormData({...formData, firstName: e.target.value})}
                         readOnly={!isAdmin}
                         style={{ padding: '12px', fontSize: '14px', marginTop: '6px', background: !isAdmin ? '#f1f5f9' : 'white', color: !isAdmin ? '#64748b' : 'inherit' }}
                         title={!isAdmin ? "Kilitli: Bu alanı yalnızca Yönetici (Admin) değiştirebilir" : ""}
                       />
                     </div>
                     <div className="input-group">
                       <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                           Soyisim
                       </label>
                       <input 
                         type="text" 
                         className="input-field" 
                         value={formData.lastName}
                         onChange={e => setFormData({...formData, lastName: e.target.value})}
                         readOnly={!isAdmin}
                         style={{ padding: '12px', fontSize: '14px', marginTop: '6px', background: !isAdmin ? '#f1f5f9' : 'white', color: !isAdmin ? '#64748b' : 'inherit' }}
                         title={!isAdmin ? "Kilitli: Bu alanı yalnızca Yönetici (Admin) değiştirebilir" : ""}
                       />
                     </div>
                 </div>
                 
                 {isChildProfile ? null : (
                 <div className="input-group" style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                       <Mail size={14} className="text-primary" /> E-posta Adresi
                   </label>
                   <input 
                     type="email" 
                     className="input-field" 
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                     readOnly={!isAdmin}
                     style={{ padding: '12px', fontSize: '14px', marginTop: '6px', background: !isAdmin ? '#f1f5f9' : 'white', color: !isAdmin ? '#64748b' : 'inherit' }}
                     title={!isAdmin ? "Kilitli: Bu alanı yalnızca Yönetici (Admin) değiştirebilir" : ""}
                   />
                 </div>
                 )}

                 {isChildProfile ? null : (
                 <div className="input-group" style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                       <Phone size={14} className="text-primary" /> Telefon Numarası
                   </label>
                   <input 
                     type="tel" 
                     className="input-field" 
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                     placeholder="Örn: 0532 123 45 67"
                     style={{ padding: '12px', fontSize: '14px', marginTop: '6px' }}
                   />
                 </div>
                 )}

                 {isChildProfile ? null : (
                 <div className="input-group" style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                       <User size={14} className="text-primary" /> Firma / Şirket Adı
                   </label>
                   <input 
                     type="text" 
                     className="input-field" 
                     value={formData.company}
                     onChange={e => setFormData({...formData, company: e.target.value})}
                     placeholder="Örn: Move Travel & Mice"
                     style={{ padding: '12px', fontSize: '14px', marginTop: '6px' }}
                   />
                 </div>
                 )}

                 {isChildProfile ? null : (
                 <div className="input-group" style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                       {notifPermission === 'granted' ? <BellRing size={14} className="text-primary" /> : <BellOff size={14} style={{color: '#f59e0b'}} />} 
                       Cihaz Bildirimleri (Push)
                   </label>
                   <div style={{ padding: '12px', fontSize: '14px', marginTop: '6px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: notifPermission==='granted' ? '#10B981' : '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <span>
                            {notifPermission === 'granted' ? 'Açık (Bildirim Alabilirsiniz)' : 
                             notifPermission === 'denied' ? 'Kapalı (Tarayıcıdan Engellendi)' : 
                             notifPermission === 'unsupported' ? 'Desteklenmiyor (Güvenli Değil)' :
                             'Bekleniyor (İzin Verilmedi)'}
                       </span>
                       {notifPermission === 'default' && (
                           <button type="button" onClick={requestNotifPermission} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(215, 20, 122, 0.2)' }}>İzin İste</button>
                       )}
                   </div>
                 </div>
                 )}

                 {isChildProfile ? null : (
                 <div className="input-group" style={{ marginBottom: '24px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                       <Lock size={14} className="text-primary" /> Yeni Parola Belirle
                   </label>
                   <input 
                     type="password" 
                     className="input-field" 
                     value={formData.password}
                     onChange={e => setFormData({...formData, password: e.target.value})}
                     placeholder="Geçerli parolayı değiştirmek için girin"
                     style={{ padding: '12px', fontSize: '14px', marginTop: '6px' }}
                   />
                 </div>
                 )}
                 
                 {targetUser?.role === 'customer' && (
                     <>
                     <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isChildProfile ? 'Çocuğa Ait Kimlik & Pasaport Bilgileri' : 'Kimlik & Pasaport Bilgileri'}
                          </h3>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>T.C. Kimlik Numarası</label>
                                  <input type="text" maxLength={11} placeholder="Örn: 12345678901" value={formData.tcNo} onChange={e => setFormData({...formData, tcNo: e.target.value.replace(/\D/g, '')})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                              </div>
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Ülke Pasaportu</label>
                                  <input type="text" placeholder="Örn: Türkiye" value={formData.passportCountry} onChange={e => setFormData({...formData, passportCountry: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                              </div>
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Pasaport No</label>
                                  <input type="text" placeholder="Örn: U12345678" value={formData.passportNo} onChange={e => setFormData({...formData, passportNo: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                              </div>
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>P. Geçerlilik T.</label>
                                  <input type="date" value={formData.passportExp} onChange={e => setFormData({...formData, passportExp: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                              </div>
                              <div>
                                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Doğum Tarihi</label>
                                  <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                              </div>
                          </div>
                      </div>

                     <div style={{ background: '#fdfce8', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #fef08a' }}>
                         <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: '#a16207', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             {isChildProfile ? 'Çocuğa Ait Sağlık & Acil Durum Bilgileri' : 'Sağlık & Acil Durum Bilgileri'}
                         </h3>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                             <div style={{ gridColumn: '1 / -1' }}>
                                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Kan Grubu</label>
                                 <div style={{ position: 'relative' }}>
                                     <select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #fde047', background: 'white', color: 'var(--text-main)', fontSize: '15px', fontWeight: 'bold', appearance: 'none', cursor: 'pointer' }}>
                                         <option value="">{isChildProfile ? 'Lütfen Kan Grubunu Seçin...' : 'Lütfen Kan Grubunuzu Seçin...'}</option>
                                         <option value="A+">A RH Pozitif (+)</option><option value="A-">A RH Negatif (-)</option>
                                         <option value="B+">B RH Pozitif (+)</option><option value="B-">B RH Negatif (-)</option>
                                         <option value="AB+">AB RH Pozitif (+)</option><option value="AB-">AB RH Negatif (-)</option>
                                         <option value="0+">0 (Sıfır) RH Pozitif (+)</option><option value="0-">0 (Sıfır) RH Negatif (-)</option>
                                     </select>
                                     <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a16207' }}>▼</div>
                                 </div>
                             </div>
                             
                             <div style={{ gridColumn: '1 / -1' }}>
                                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Alerjiler</label>
                                 <input type="text" placeholder="Örn: Penisilin, Fıstık (Yoksa boş bırakın)" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', background: 'white' }} />
                             </div>
                             <div style={{ gridColumn: '1 / -1' }}>
                                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Düzenli Kullanılan İlaçlar</label>
                                 <input type="text" placeholder="Örn: Tansiyon ilacı, İnsülin (Yoksa boş bırakın)" value={formData.medications} onChange={e => setFormData({...formData, medications: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', background: 'white' }} />
                             </div>
                             <div style={{ gridColumn: '1 / -1' }}>
                                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Özel Beslenme Planı</label>
                                 <input type="text" placeholder="Örn: Vegan, Vejetaryen, Glütensiz (Yoksa boş bırakın)" value={formData.dietaryReq} onChange={e => setFormData({...formData, dietaryReq: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', background: 'white' }} />
                             </div>

                             <div>
                                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Acil Durum Kişisi (İsim Soyisim)</label>
                                 <input type="text" placeholder="Örn: Mehmet Yılmaz" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', background: 'white' }} />
                             </div>
                             <div>
                                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Acil Durum Telefonu</label>
                                 <input type="tel" placeholder="Örn: 0532 000 0000" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', background: 'white' }} />
                             </div>
                         </div>
                     </div>
                     </>
                 )}

                 <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                     <Save size={18} /> Değişiklikleri Kaydet
                 </button>
              </form>
          </div>

          {/* User Travel Statistics */}
          {(!isAdmin && targetUser?.role !== 'ticketing' && !isChildProfile) && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      <History size={18} className="text-primary" />
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{pastCount}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', marginTop: '2px', textAlign: 'center' }}>Geçmiş {user?.role === 'expert' ? 'Turlarım' : 'Seyahatler'}</span>
              </div>
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#dcfce7', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      <Plane size={18} color="#10B981" />
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{activeCount}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', marginTop: '2px', textAlign: 'center' }}>Aktif {user?.role === 'expert' ? 'Turlarım' : 'Seyahat'}</span>
              </div>
          </div>
          )}

          {(!isChildProfile) && (
              <>
              {/* Linked Children List */}
              {user?.role === 'customer' && (
                  (() => {
                      const linkedChildren = allUsers.filter(u => u.role === 'customer' && (Array.isArray(u.linkedTo) ? u.linkedTo.includes(user.id) : u.linkedTo === user.id));
                      if (linkedChildren.length > 0) {
                          return (
                              <div style={{ marginBottom: '24px' }}>
                                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      👨‍👩‍👧‍👦 Bağlı Çocuklarım
                                  </h3>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {linkedChildren.map(c => (
                                          <div key={c.id} onClick={() => navigate(`/dashboard/profile?childId=${c.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                  <img src={getAvatarUrl(c)} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                  <div>
                                                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>{c.name}</div>
                                                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sağlık & Acil Durum Bilgilerini Düzenle</div>
                                                  </div>
                                              </div>
                                              <ChevronRight size={18} color="var(--text-muted)" />
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      }
                      return null;
                  })()
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                 <button 
                    onClick={handleLogout}
                    style={{ 
                       background: 'white', 
                       border: '1px solid #fecaca', 
                       color: '#ef4444', 
                       padding: '14px 24px', 
                       borderRadius: '12px', 
                       fontSize: '14px', 
                       fontWeight: 'bold', 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: '8px', 
                       cursor: 'pointer', 
                       transition: 'all 0.2s', 
                       width: '100%', 
                       justifyContent: 'center',
                       boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
                    }}
                 >
                     <LogOut size={18} /> Oturumu Sonlandır (Çıkış Yap)
                 </button>
              </div>
              </>
          )}
      </div>
    </div>
  );
}
