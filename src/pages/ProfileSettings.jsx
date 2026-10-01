import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import Header from '../components/Header';
import { 
  User, Mail, Phone, Lock, Save, LogOut, Camera, Plane, 
  History, BellRing, BellOff, ChevronRight, ArrowLeft, 
  ShieldCheck, HeartPulse, Building2, CheckCircle2, ChevronDown, Check, X,
  Sparkles
} from 'lucide-react';
import { useTourStore, isTourActive, isTourPast } from '../store/tourStore';
import { useUserStore, formatTitleCase } from '../store/userStore';
import { triggerDeviceNotification } from '../hooks/useDeviceNotifications';
import ConfirmModal from '../components/ConfirmModal';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NativeSettings = registerPlugin('NativeSettings');

export default function ProfileSettings({ hideHeader = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const setActiveMode = useAuthStore(state => state.setActiveMode);
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

  const isIndividual = hideHeader || 
    location.pathname.startsWith('/individual') || 
    activeMode === 'individual' || 
    user?.userType === 'individual' || 
    user?.role === 'individual' || 
    targetUser?.role === 'individual';
  const isCorporate = !isIndividual && (
    (targetUser?.userType === 'corporate' || user?.userType === 'corporate') || 
    ['admin', 'expert', 'ticketing'].includes(targetUser?.role || user?.role) || 
    (targetUser?.company && targetUser.company !== 'Bireysel')
  );
  const isCorporateAccount = Boolean(
    user && (
      user.userType === 'corporate' || 
      ['admin', 'expert', 'ticketing', 'customer'].includes(user?.role) || 
      (targetUser && ['admin', 'expert', 'ticketing', 'customer'].includes(targetUser?.role)) ||
      (user?.company && user.company !== 'Bireysel' && user.company !== 'Bireysel Kullanıcı')
    )
  );

  const isNative = Capacitor.isNativePlatform();
  const [notifPermission, setNotifPermission] = useState('checking');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const checkNotificationPermission = async () => {
      try {
          if (isNative) {
              const status = await LocalNotifications.checkPermissions();
              setNotifPermission(status.display);
              const isGranted = status.display === 'granted';
              if (user && user.pushEnabled !== isGranted) {
                  updateProfile({ pushEnabled: isGranted });
              }
          } else if ('Notification' in window) {
              setNotifPermission(Notification.permission);
              const isGranted = Notification.permission === 'granted';
              if (user && user.pushEnabled !== isGranted) {
                  updateProfile({ pushEnabled: isGranted });
              }
          } else {
              setNotifPermission('unsupported');
          }
      } catch (e) {
          console.error("Capacitor local notifications check failed", e);
          setNotifPermission('unsupported');
      }
  };

  useEffect(() => {
     checkNotificationPermission();

     const handleFocus = () => {
         checkNotificationPermission();
     };
     window.addEventListener('focus', handleFocus);
     document.addEventListener('visibilitychange', handleFocus);
     return () => {
         window.removeEventListener('focus', handleFocus);
         document.removeEventListener('visibilitychange', handleFocus);
     };
  }, [user]);

  const [testNotifFeedback, setTestNotifFeedback] = useState(null);

  const handleSendTestNotification = async () => {
      const success = await triggerDeviceNotification("Move Yanımda", {
          body: isNative 
            ? "📱 Mobil cihaz bildirimleriniz başarıyla çalışıyor! 🚀" 
            : "💻 Masaüstü ve tarayıcı bildirimleriniz başarıyla çalışıyor! 🚀"
      });
      if (success) {
          setTestNotifFeedback("Bildirim ekranınıza iletildi!");
          setTimeout(() => setTestNotifFeedback(null), 3500);
      } else {
          setTestNotifFeedback("Bildirim gönderilemedi. İzinleri kontrol edin.");
          setTimeout(() => setTestNotifFeedback(null), 3500);
      }
  };

  const handleOpenNativeSettings = async () => {
      try {
          await NativeSettings.openAppSettings();
      } catch (e) {
          if (Capacitor.getPlatform() === 'ios') {
              try {
                  window.location.href = 'app-settings:';
              } catch (err) {}
          }
      }
  };

  const requestNotifPermission = async () => {
      try {
          if (isNative) {
              const status = await LocalNotifications.requestPermissions();
              setNotifPermission(status.display);
              const granted = status.display === 'granted';
              updateProfile({ pushEnabled: granted });
              if (granted) {
                  triggerDeviceNotification("Move Yanımda", { body: "Mobil bildirimleriniz başarıyla açıldı! 🎉" });
              } else if (status.display === 'denied') {
                  await handleOpenNativeSettings();
              }
          } else if ('Notification' in window) {
              const res = await Notification.requestPermission();
              setNotifPermission(res);
              const granted = res === 'granted';
              updateProfile({ pushEnabled: granted });
              if (granted) {
                  triggerDeviceNotification("Move Yanımda", { body: "Masaüstü ve tarayıcı bildirimleriniz başarıyla açıldı! 🎉" });
              }
          }
      } catch (e) {
          console.error("Notification request failed", e);
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
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const size = Math.min(img.width, img.height);
            const canvas = document.createElement('canvas');
            canvas.width = 250;
            canvas.height = 250;
            const ctx = canvas.getContext('2d');
            
            const startX = (img.width - size) / 2;
            const startY = (img.height - size) / 2;
            
            ctx.drawImage(img, startX, startY, size, size, 0, 0, 250, 250);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            if (isChildProfile && targetUser?.id) {
                await updateUser(targetUser.id, { avatar: dataUrl });
            } else {
                updateProfile({ avatar: dataUrl });
                if (user?.id) {
                    await updateUser(user.id, { avatar: dataUrl });
                }
            }
            setIsSaved(true);
            setToastPopup({
                title: 'Profil Resmi Güncellendi!',
                message: 'Yeni fotoğrafınız başarıyla yüklendi ve sisteme kaydedildi.',
                avatar: dataUrl,
                type: 'success'
            });
            setTimeout(() => setIsSaved(false), 3500);
            setTimeout(() => setToastPopup(null), 4000);
          } catch (err) {
            console.error("Avatar yükleme hatası:", err);
            alert("Fotoğraf kaydedilirken bir hata oluştu.");
          } finally {
            setIsUploadingAvatar(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanPhoneForInput = (phoneStr) => {
    if (!phoneStr || phoneStr === '-') return '';
    let cleaned = String(phoneStr).trim();
    if (cleaned.startsWith('+90')) {
      cleaned = cleaned.substring(3).trim();
    } else if (cleaned.startsWith('0090')) {
      cleaned = cleaned.substring(4).trim();
    } else if (cleaned.startsWith('90') && cleaned.length > 10) {
      cleaned = cleaned.substring(2).trim();
    } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
      cleaned = cleaned.substring(1).trim();
    }
    return formatPhoneNumber(cleaned);
  };

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    const cleanDigits = digits.startsWith('0') ? digits.substring(1).slice(0, 10) : digits.slice(0, 10);
    if (cleanDigits.length <= 3) return cleanDigits;
    if (cleanDigits.length <= 6) return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3)}`;
    if (cleanDigits.length <= 8) return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6)}`;
    return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6, 8)} ${cleanDigits.slice(8, 10)}`;
  };

  const isPersonnel = ['expert', 'admin', 'ticketing'].includes(targetUser?.role || user?.role);
  const defaultCompany = isPersonnel ? 'Move Travel & Mice' : (targetUser?.company || user?.company || 'Bireysel');

  const getDisplayCompany = (compVal) => {
    if (isPersonnel) return 'Move Travel & Mice';
    const c = compVal !== undefined ? compVal : (formData?.company || targetUser?.company || user?.company || '');
    if (!c || c.trim().toLowerCase() === 'bireysel' || c.trim().toLowerCase() === 'bireysel kullanıcı' || isIndividual || targetUser?.role === 'individual' || user?.role === 'individual') {
      return 'Bireysel Kullanıcı';
    }
    return c;
  };

  const nameParts = (targetUser?.name || '').trim().split(' ');
  const defaultFirst = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || '';
  const defaultLast = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const [formData, setFormData] = useState({
    firstName: defaultFirst,
    lastName: defaultLast,
    email: targetUser?.email || '',
    phone: cleanPhoneForInput(targetUser?.phone),
    company: defaultCompany,
    password: '',
    passportCountry: targetUser?.passportCountry || '',
    passportNo: targetUser?.passportNo || '',
    passportExp: targetUser?.passportExp || '',
    tcNo: targetUser?.tcNo || '',
    bloodType: targetUser?.bloodType || '',
    birthDate: targetUser?.birthDate || '',
    emergencyContactName: targetUser?.emergencyContactName || '',
    emergencyContactPhone: cleanPhoneForInput(targetUser?.emergencyContactPhone),
    allergies: targetUser?.allergies || '',
    medications: targetUser?.medications || '',
    dietaryReq: targetUser?.dietaryReq || ''
  });

  useEffect(() => {
    const np = (targetUser?.name || '').trim().split(' ');
    const df = np.length > 1 ? np.slice(0, -1).join(' ') : np[0] || '';
    const dl = np.length > 1 ? np[np.length - 1] : '';
    const isStaff = ['expert', 'admin', 'ticketing'].includes(targetUser?.role || user?.role);
    setFormData({
        firstName: df,
        lastName: dl,
        email: targetUser?.email || '',
        phone: cleanPhoneForInput(targetUser?.phone),
        company: isStaff ? 'Move Travel & Mice' : (targetUser?.company || user?.company || 'Bireysel'),
        password: '',
        passportCountry: targetUser?.passportCountry || '',
        passportNo: targetUser?.passportNo || '',
        passportExp: targetUser?.passportExp || '',
        tcNo: targetUser?.tcNo || '',
        bloodType: targetUser?.bloodType || '',
        birthDate: targetUser?.birthDate || '',
        emergencyContactName: targetUser?.emergencyContactName || '',
        emergencyContactPhone: cleanPhoneForInput(targetUser?.emergencyContactPhone),
        allergies: targetUser?.allergies || '',
        medications: targetUser?.medications || '',
        dietaryReq: targetUser?.dietaryReq || ''
    });
  }, [targetUser, user]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toastPopup, setToastPopup] = useState(null);
  const [isBloodTypeOpen, setIsBloodTypeOpen] = useState(false);
  const bloodTypeRef = useRef(null);

  const BLOOD_TYPES = [
    { value: 'A+', label: 'A RH Pozitif (+)', code: 'A+' },
    { value: 'A-', label: 'A RH Negatif (-)', code: 'A-' },
    { value: 'B+', label: 'B RH Pozitif (+)', code: 'B+' },
    { value: 'B-', label: 'B RH Negatif (-)', code: 'B-' },
    { value: 'AB+', label: 'AB RH Pozitif (+)', code: 'AB+' },
    { value: 'AB-', label: 'AB RH Negatif (-)', code: 'AB-' },
    { value: '0+', label: '0 (Sıfır) RH Pozitif (+)', code: '0+' },
    { value: '0-', label: '0 (Sıfır) RH Negatif (-)', code: '0-' },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bloodTypeRef.current && !bloodTypeRef.current.contains(e.target)) {
        setIsBloodTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const isStaff = ['expert', 'admin', 'ticketing'].includes(targetUser?.role || user?.role);
    const finalCompany = isStaff ? 'Move Travel & Mice' : (formData.company || targetUser?.company || 'Bireysel');
    
    const rawPhone = (formData.phone || '').trim();
    const formattedPhone = rawPhone ? `+90 ${rawPhone}` : '';

    const rawEmergPhone = (formData.emergencyContactPhone || '').trim();
    const formattedEmergPhone = rawEmergPhone ? (rawEmergPhone.startsWith('+') ? rawEmergPhone : `+90 ${rawEmergPhone}`) : '';

    const updates = { 
        name: formatTitleCase(fullName || targetUser?.name || 'Misafir'), 
        email: (formData.email || '').trim().toLowerCase() || targetUser?.email, 
        phone: formattedPhone, 
        company: finalCompany,
        avatar: targetUser?.avatar || user?.avatar || undefined,
        passportCountry: formData.passportCountry,
        passportNo: formData.passportNo,
        passportExp: formData.passportExp,
        tcNo: formData.tcNo,
        bloodType: formData.bloodType,
        birthDate: formData.birthDate,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formattedEmergPhone,
        allergies: formData.allergies,
        medications: formData.medications,
        dietaryReq: formData.dietaryReq,
        identityLastEditedBy: (user?.name || 'Kullanıcı') + (isChildProfile ? ` (${targetUser.name} Profili)` : ' (Kendi Hesabı)'),
        identityLastEditedAt: new Date().toISOString()
    };
    if (formData.password && formData.password.trim() !== '') {
        updates.password = formData.password.trim();
    }
    
    try {
        if (isChildProfile) {
            await updateUser(targetUser.id, updates);
        } else {
            updateProfile(updates);
            if (user?.id) {
                await updateUser(user.id, updates);
            }
        }
        
        setIsSaved(true);
        setToastPopup({
            title: 'Bilgiler Kaydedildi!',
            message: 'Profil ve kimlik bilgileriniz başarıyla güncellendi.',
            type: 'success'
        });
        setTimeout(() => setIsSaved(false), 3500);
        setTimeout(() => setToastPopup(null), 3500);
        setFormData(prev => ({ ...prev, password: '' })); // reset password input
    } catch (err) {
        console.error("Profil güncelleme hatası:", err);
        alert("Profil kaydedilirken bir hata oluştu: " + (err.message || err));
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const myTours = tours.filter(t => {
      if (user?.role === 'expert') return (t.guideName === user?.name) || (t.expert?.name === user?.name);
      if (user?.role === 'customer') return t.participants?.some(p => p.id === user?.id || p.email === user?.email);
      return true;
  });
  
  const activeCount = myTours.filter(isTourActive).length;
  const pastCount = myTours.filter(isTourPast).length;

  const getRoleBadge = () => {
    if (isIndividual) {
      return { text: 'Bireysel Kullanıcı', bg: '#FDF2F8', color: '#D7147A', border: '#F9BED8' };
    }
    const role = targetUser?.role || user?.role;
    if (role === 'expert') return { text: 'Seyahat Uzmanı', bg: '#FDF2F8', color: '#D7147A', border: '#F9BED8' };
    if (role === 'admin') return { text: 'Yönetici (Admin)', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    if (role === 'ticketing') return { text: 'Biletleme Operasyonları', bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' };
    if (role === 'individual') return { text: 'Bireysel Kullanıcı', bg: '#FDF2F8', color: '#D7147A', border: '#F9BED8' };
    return { text: 'Misafir', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div style={{ paddingBottom: '110px', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative' }}>
      
      {/* Toast Notification Pop-up */}
      {toastPopup && (
        <div style={{
          position: 'fixed',
          top: 'calc(16px + env(safe-area-inset-top, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 32px)',
          maxWidth: '380px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #a7f3d0',
          boxShadow: '0 12px 36px rgba(16, 185, 129, 0.22), 0 4px 14px rgba(0,0,0,0.06)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(8px)'
        }}>
          {/* Avatar Thumbnail or Check Badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {toastPopup.avatar ? (
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #10b981', overflow: 'hidden', background: '#f0fdf4' }}>
                <img src={toastPopup.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CheckCircle2 size={22} color="#10b981" />
              </div>
            )}
            {toastPopup.avatar && (
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#10b981',
                color: 'white',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid white'
              }}>
                <Check size={11} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>{toastPopup.title}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.35 }}>
              {toastPopup.message}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setToastPopup(null)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              flexShrink: 0
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {!isIndividual && (
        <Header title={isChildProfile ? `${formatName(targetUser.name)}` : "Hesap Ayarları"} />
      )}

      <div style={{ padding: '0 16px', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0 auto' }}>
          
          {isChildProfile && (
              <button 
                  onClick={() => navigate(isIndividual ? '/individual/profile' : '/dashboard/profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: 'var(--text-main)', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <ArrowLeft size={15} /> Kendi Profilime Dön
              </button>
          )}

          {/* Profile Hero Card */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '20px', 
            padding: '22px 16px', 
            border: '1px solid #edf2f7', 
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            marginBottom: '16px' 
          }}>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />
              
              {/* Avatar Frame with Camera Badge */}
              <div 
                  onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                  style={{ 
                    position: 'relative', 
                    width: '84px', 
                    height: '84px', 
                    borderRadius: '50%', 
                    backgroundColor: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '3px solid #FCE7F3', 
                    boxShadow: '0 6px 16px rgba(215, 20, 122, 0.15)', 
                    cursor: isUploadingAvatar ? 'wait' : 'pointer',
                    marginBottom: '12px'
                  }}
              >
                  <img loading="lazy" src={getAvatarUrl()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', opacity: isUploadingAvatar ? 0.4 : 1 }} />
                  
                  {isUploadingAvatar ? (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '22px', height: '22px', border: '2.5px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-2px', 
                      right: '-2px', 
                      background: 'var(--primary)', 
                      color: 'white', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      border: '2.5px solid white',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                        <Camera size={13} />
                    </div>
                  )}
              </div>

              {/* Name, Email & Role */}
              <h2 style={{ fontSize: '16.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '-0.2px' }}>
                {displayName}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                {targetUser?.email || 'kullanici@move.com.tr'}
              </div>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                background: roleBadge.bg, 
                color: roleBadge.color, 
                border: `1px solid ${roleBadge.border}`,
                padding: '4px 12px', 
                borderRadius: '12px' 
              }}>
                {roleBadge.text}
              </span>
          </div>

          {/* User Travel Statistics */}
          {(!isAdmin && targetUser?.role !== 'ticketing' && !isChildProfile) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #edf2f7', 
                padding: '14px 10px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                minWidth: 0
              }}>
                  <div style={{ background: '#FDF2F8', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <History size={17} color="var(--primary)" />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>{pastCount}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '3px', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>Geçmiş Seyahatler</div>
                  </div>
              </div>

              <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #edf2f7', 
                padding: '14px 10px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                minWidth: 0
              }}>
                  <div style={{ background: '#ecfdf5', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Plane size={17} color="#10B981" />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#10B981', lineHeight: 1.1 }}>{activeCount}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '3px', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>Aktif Seyahat</div>
                  </div>
              </div>
          </div>
          )}

          {/* Mode Switching Bridge Card */}
          {!isChildProfile && (
            isIndividual ? (
              // Bireysel Asistanda iken: Kurumsal Profile Geçiş Kutusu
              isCorporateAccount && (
                <div 
                  onClick={() => {
                    setActiveMode('corporate');
                    navigate('/dashboard/profile');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                    borderRadius: '16px',
                    border: '1.2px solid #bfdbfe',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.06)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                      Kurumsal Profilim
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>
                      Şirket seyahatleriniz, biletleme ve operasyon paneli
                    </div>
                  </div>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                    }}
                    title="Kurumsal Profilime Geç"
                  >
                    <ChevronRight size={20} />
                  </div>
                </div>
              )
            ) : (
              // Kurumsal Profilde iken: Bireysel Seyahat Asistanı Kutusu
              <div 
                onClick={() => {
                  setActiveMode('individual');
                  navigate('/individual/profile');
                }}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
                  borderRadius: '16px',
                  border: '1.2px solid #F9BED8',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(215, 20, 122, 0.06)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                    Bireysel Seyahat Asistanı
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>
                    Kişisel tatilleriniz, valiz listeleriniz ve bütçeniz
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(215, 20, 122, 0.25)'
                  }}
                  title="Bireysel Seyahat Asistanına Geç"
                >
                  <ChevronRight size={20} />
                </div>
              </div>
            )
          )}

          {/* Success Notification Alert */}
          {isSaved && (
              <div style={{ 
                padding: '12px 16px', 
                background: '#ecfdf5', 
                border: '1px solid #a7f3d0', 
                color: '#065f46', 
                borderRadius: '14px', 
                fontSize: '13px', 
                fontWeight: '700', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                marginBottom: '16px', 
                animation: 'fadeIn 0.3s' 
              }}>
                  <CheckCircle2 size={17} color="#10b981" /> Profil bilgileriniz başarıyla güncellendi!
              </div>
          )}

          <form onSubmit={handleSubmit}>
              
              {/* CARD 1: Kişisel & İletişim Bilgileri */}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '18px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                padding: '18px 16px', 
                marginBottom: '16px' 
              }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={14} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>Kişisel & İletişim Bilgileri</span>
                 </div>

                 {/* Name & Surname Fields */}
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                     <div>
                       <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                           İsim
                       </label>
                       <input 
                         type="text" 
                         value={formData.firstName}
                         onChange={e => setFormData({...formData, firstName: e.target.value})}
                         readOnly={!isAdmin}
                         style={{ 
                           width: '100%', 
                           padding: '10px 12px', 
                           fontSize: '13px', 
                           fontWeight: '600', 
                           background: !isAdmin ? '#f8fafc' : '#ffffff', 
                           color: !isAdmin ? '#64748b' : '#1e293b', 
                           border: '1px solid #e2e8f0', 
                           borderRadius: '11px', 
                           outline: 'none',
                           boxSizing: 'border-box'
                         }}
                         title={!isAdmin ? "Kilitli: Bu alanı yalnızca Yönetici (Admin) değiştirebilir" : ""}
                       />
                     </div>
                     <div>
                       <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                           Soyisim
                       </label>
                       <input 
                         type="text" 
                         value={formData.lastName}
                         onChange={e => setFormData({...formData, lastName: e.target.value})}
                         readOnly={!isAdmin}
                         style={{ 
                           width: '100%', 
                           padding: '10px 12px', 
                           fontSize: '13px', 
                           fontWeight: '600', 
                           background: !isAdmin ? '#f8fafc' : '#ffffff', 
                           color: !isAdmin ? '#64748b' : '#1e293b', 
                           border: '1px solid #e2e8f0', 
                           borderRadius: '11px', 
                           outline: 'none',
                           boxSizing: 'border-box'
                         }}
                         title={!isAdmin ? "Kilitli: Bu alanı yalnızca Yönetici (Admin) değiştirebilir" : ""}
                       />
                     </div>
                 </div>
                 
                 {/* Email */}
                 {!isChildProfile && (
                 <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Mail size={13} color="var(--primary)" /> E-posta Adresi
                    </label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      readOnly={!isAdmin}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        background: !isAdmin ? '#f8fafc' : '#ffffff', 
                        color: !isAdmin ? '#64748b' : '#1e293b', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '11px', 
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      title={!isAdmin ? "Kilitli: Bu alanı yalnızca Yönetici (Admin) değiştirebilir" : ""}
                    />
                 </div>
                 )}

                 {/* Phone */}
                 {!isChildProfile && (
                 <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Phone size={13} color="var(--primary)" /> Telefon Numarası
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'stretch', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '11px', 
                      background: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         padding: '0 12px', 
                         background: '#f8fafc', 
                         borderRight: '1px solid #e2e8f0', 
                         color: '#475569', 
                         fontSize: '12.5px', 
                         fontWeight: '700',
                         userSelect: 'none'
                       }}>
                          <span>+90</span>
                       </div>
                       <input 
                         type="tel" 
                         value={formData.phone}
                         onChange={e => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                         placeholder="532 123 45 67"
                         maxLength={14}
                         style={{ 
                           flex: 1, 
                           padding: '10px 12px', 
                           fontSize: '13px', 
                           fontWeight: '600', 
                           color: '#1e293b', 
                           background: 'transparent', 
                           border: 'none', 
                           outline: 'none',
                           boxSizing: 'border-box'
                         }}
                       />
                    </div>
                 </div>
                 )}

                 {/* Firma / Kurum Adı */}
                 {!isChildProfile && (
                 <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={13} color="var(--primary)" /> Firma / Kurum Adı
                        </label>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '500' }}>
                            <Lock size={10} /> {isPersonnel ? 'Move Travel personeli için sabittir' : (getDisplayCompany() === 'Bireysel Kullanıcı' ? 'Hesap türü sabittir' : 'Firma adı sabittir')}
                        </span>
                    </div>
                    <input 
                      type="text" 
                      value={getDisplayCompany()}
                      readOnly={true}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#64748b', 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '11px', 
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed'
                      }}
                      title="Firma adı / hesap türü sabittir ve bu ekrandan değiştirilemez."
                    />
                 </div>
                 )}
              </div>

              {/* CARD 2: Bildirimler & Güvenlik */}
              {!isChildProfile && (
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '18px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                padding: '18px 16px', 
                marginBottom: '16px' 
              }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={14} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>Tercihler & Güvenlik</span>
                 </div>

                 {/* Push Notifications Tile */}
                 <div style={{ 
                   background: '#f8fafc', 
                   border: '1.2px solid #e2e8f0', 
                   borderRadius: '14px', 
                   padding: '13px 15px', 
                   marginBottom: '16px'
                 }}>
                    <div style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                         <div style={{ 
                           width: '34px', 
                           height: '34px', 
                           borderRadius: '10px', 
                           background: notifPermission === 'granted' ? '#ecfdf5' : '#FDF2F8', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           flexShrink: 0
                         }}>
                           {notifPermission === 'granted' ? <BellRing size={17} color="#10b981" /> : <BellOff size={17} color="#f59e0b" />}
                         </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                              {isNative 
                                ? 'Mobil Cihaz Bildirimleri (Push)' 
                                : 'Tarayıcı & Masaüstü Bildirimleri'}
                            </div>
                            <div style={{ fontSize: '11px', color: notifPermission === 'granted' ? '#059669' : (notifPermission === 'denied' ? '#ef4444' : '#d97706'), fontWeight: '600', marginTop: '1px' }}>
                              {notifPermission === 'granted' 
                                ? 'Açık (Tüm anlık bildirimleri alabilirsiniz)' 
                                : notifPermission === 'denied' 
                                ? (isNative ? 'Kapalı (Telefon ayarlarından bildirimlere izin verin)' : 'Kapalı (Tarayıcı kilit simgesinden izin verin)') 
                                : notifPermission === 'unsupported' 
                                ? (isNative ? 'Cihazda Desteklenmiyor' : 'Tarayıcıda Desteklenmiyor') 
                                : 'Kapalı (Bildirim izni henüz verilmedi)'}
                            </div>
                          </div>
                       </div>

                       {notifPermission !== 'granted' && notifPermission !== 'denied' && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                           <button 
                             type="button" 
                             onClick={requestNotifPermission} 
                             style={{ 
                               background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', 
                               color: 'white', 
                               border: 'none', 
                               padding: '6px 12px', 
                               borderRadius: '8px', 
                               fontSize: '11.5px', 
                               fontWeight: '700', 
                               cursor: 'pointer',
                               boxShadow: '0 2px 6px rgba(215, 20, 122, 0.22)'
                             }}
                           >
                             Bildirimleri Aç
                           </button>
                         </div>
                       )}

                       {notifPermission === 'denied' && isNative && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                           <button 
                             type="button" 
                             onClick={handleOpenNativeSettings}
                             style={{ 
                               background: '#ef4444', 
                               color: 'white', 
                               border: 'none', 
                               padding: '6px 12px', 
                               borderRadius: '8px', 
                               fontSize: '11.5px', 
                               fontWeight: '700', 
                               cursor: 'pointer',
                               boxShadow: '0 2px 6px rgba(239, 68, 68, 0.22)'
                             }}
                           >
                             Ayarları Aç
                           </button>
                         </div>
                       )}
                    </div>

                    {notifPermission === 'granted' && (
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          type="button" 
                          onClick={handleSendTestNotification} 
                          style={{ 
                            width: '100%',
                            background: '#ffffff', 
                            color: '#059669', 
                            border: '1.2px solid #a7f3d0', 
                            padding: '8px 14px', 
                            borderRadius: '10px', 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 3px rgba(16, 185, 129, 0.08)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ecfdf5';
                            e.currentTarget.style.borderColor = '#6ee7b7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#a7f3d0';
                          }}
                          title="Masaüstü bildirimini test et"
                        >
                          <BellRing size={13} /> Test Gönder
                        </button>
                      </div>
                    )}

                    {testNotifFeedback && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: testNotifFeedback.includes('iletildi') ? '#059669' : '#dc2626', 
                        fontWeight: '700', 
                        marginTop: '8px', 
                        textAlign: 'center' 
                      }}>
                        {testNotifFeedback.includes('iletildi') ? '✓ ' : '⚠️ '}{testNotifFeedback}
                      </div>
                    )}
                 </div>

                 {/* Password Input */}
                 <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lock size={13} color="var(--primary)" /> Yeni Parola Belirle
                    </label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="Değiştirmek istemiyorsanız boş bırakın"
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#1e293b', 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '11px', 
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                 </div>
              </div>
              )}
              
              {/* CARD 3: Customer Identity Section */}
              {targetUser?.role === 'customer' && (
              <>
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '18px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                padding: '18px 16px', 
                marginBottom: '16px' 
              }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                       <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <ShieldCheck size={14} color="var(--primary)" />
                       </div>
                       <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                           {isChildProfile ? 'Çocuğa Ait Kimlik Bilgileri' : 'Kimlik & Pasaport Bilgileri'}
                       </span>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                       <div style={{ gridColumn: '1 / -1' }}>
                           <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>T.C. Kimlik Numarası</label>
                           <input 
                             type="text" 
                             maxLength={11} 
                             placeholder="Örn: 12345678901" 
                             value={formData.tcNo} 
                             onChange={e => setFormData({...formData, tcNo: e.target.value.replace(/\D/g, '')})} 
                             style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #e2e8f0', background: '#ffffff', boxSizing: 'border-box' }} 
                           />
                       </div>
                       {user?.role !== 'customer' && (
                           <>
                               <div>
                                   <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>Ülke Pasaportu</label>
                                   <input 
                                     type="text" 
                                     placeholder="Örn: Türkiye" 
                                     value={formData.passportCountry} 
                                     onChange={e => setFormData({...formData, passportCountry: e.target.value})} 
                                     style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #e2e8f0', background: '#ffffff', boxSizing: 'border-box' }} 
                                   />
                               </div>
                               <div>
                                   <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>Pasaport No</label>
                                   <input 
                                     type="text" 
                                     placeholder="Örn: U12345678" 
                                     value={formData.passportNo} 
                                     onChange={e => setFormData({...formData, passportNo: e.target.value})} 
                                     style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #e2e8f0', background: '#ffffff', boxSizing: 'border-box' }} 
                                   />
                               </div>
                               <div>
                                   <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>P. Geçerlilik T.</label>
                                   <input 
                                     type="date" 
                                     value={formData.passportExp} 
                                     onChange={e => setFormData({...formData, passportExp: e.target.value})} 
                                     style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #e2e8f0', background: '#ffffff', boxSizing: 'border-box' }} 
                                   />
                               </div>
                               <div>
                                   <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' }}>Doğum Tarihi</label>
                                   <input 
                                     type="date" 
                                     value={formData.birthDate} 
                                     onChange={e => setFormData({...formData, birthDate: e.target.value})} 
                                     style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #e2e8f0', background: '#ffffff', boxSizing: 'border-box' }} 
                                   />
                               </div>
                           </>
                       )}
                   </div>
              </div>

              {/* CARD 4: Health Section */}
              <div style={{ 
                background: '#fffbeb', 
                borderRadius: '18px', 
                border: '1px solid #fef08a', 
                boxShadow: '0 4px 18px rgba(234, 179, 8, 0.05)', 
                padding: '18px 16px', 
                marginBottom: '16px' 
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid rgba(254, 240, 138, 0.6)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <HeartPulse size={14} color="#a16207" />
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#a16207' }}>
                          {isChildProfile ? 'Çocuğa Ait Sağlık & Acil Durum' : 'Sağlık & Acil Durum Bilgileri'}
                      </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#a16207', marginBottom: '6px', display: 'block' }}>Kan Grubu</label>
                          <div ref={bloodTypeRef} style={{ position: 'relative' }}>
                              <button
                                type="button"
                                onClick={() => setIsBloodTypeOpen(!isBloodTypeOpen)}
                                style={{
                                  width: '100%',
                                  padding: '9.5px 12px',
                                  borderRadius: '11px',
                                  border: isBloodTypeOpen ? '1.5px solid #eab308' : '1px solid #fde047',
                                  background: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  boxSizing: 'border-box',
                                  textAlign: 'left',
                                  boxShadow: isBloodTypeOpen ? '0 0 0 3px rgba(234, 179, 8, 0.15)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  {formData.bloodType ? (
                                    <>
                                      <span style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        padding: '1px 6px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        flexShrink: 0,
                                        lineHeight: 1.3
                                      }}>
                                        {formData.bloodType}
                                      </span>
                                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {BLOOD_TYPES.find(b => b.value === formData.bloodType)?.label || formData.bloodType}
                                      </span>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>
                                      {isChildProfile ? 'Kan Grubunu Seçin...' : 'Kan Grubunuzu Seçin...'}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  {formData.bloodType && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData({ ...formData, bloodType: '' });
                                      }}
                                      title="Seçimi Temizle"
                                      style={{
                                        padding: '2px',
                                        borderRadius: '50%',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                    >
                                      <X size={13} />
                                    </div>
                                  )}
                                  <ChevronDown
                                    size={15}
                                    color="#a16207"
                                    style={{
                                      transform: isBloodTypeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.2s ease'
                                    }}
                                  />
                                </div>
                              </button>

                              {/* Dropdown Menu Popup */}
                              {isBloodTypeOpen && (
                                <div style={{
                                  position: 'absolute',
                                  top: 'calc(100% + 6px)',
                                  left: 0,
                                  right: 0,
                                  zIndex: 50,
                                  background: '#ffffff',
                                  borderRadius: '14px',
                                  border: '1px solid #fef08a',
                                  boxShadow: '0 12px 28px rgba(161, 98, 7, 0.12), 0 4px 10px rgba(0, 0, 0, 0.04)',
                                  padding: '6px',
                                  maxHeight: '260px',
                                  overflowY: 'auto',
                                  animation: 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {BLOOD_TYPES.map((bt) => {
                                      const isSelected = formData.bloodType === bt.value;
                                      return (
                                        <div
                                          key={bt.value}
                                          onClick={() => {
                                            setFormData({ ...formData, bloodType: bt.value });
                                            setIsBloodTypeOpen(false);
                                          }}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 10px',
                                            borderRadius: '9px',
                                            background: isSelected ? '#fef9c3' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.12s ease'
                                          }}
                                          onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.background = '#fefce8';
                                          }}
                                          onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                              background: isSelected ? '#dc2626' : '#fee2e2',
                                              color: isSelected ? '#ffffff' : '#dc2626',
                                              border: isSelected ? '1px solid #dc2626' : '1px solid #fecaca',
                                              borderRadius: '6px',
                                              padding: '1px 6px',
                                              fontSize: '11px',
                                              fontWeight: '800',
                                              minWidth: '28px',
                                              textAlign: 'center',
                                              lineHeight: 1.3
                                            }}>
                                              {bt.code}
                                            </span>
                                            <span style={{
                                              fontSize: '12.5px',
                                              fontWeight: isSelected ? '700' : '500',
                                              color: isSelected ? '#854d0e' : '#334155'
                                            }}>
                                              {bt.label}
                                            </span>
                                          </div>

                                          {isSelected && (
                                            <div style={{
                                              width: '20px',
                                              height: '20px',
                                              borderRadius: '50%',
                                              background: '#eab308',
                                              color: 'white',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              flexShrink: 0
                                            }}>
                                              <Check size={12} strokeWidth={3} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                      </div>
                      
                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#a16207', marginBottom: '6px', display: 'block' }}>Alerjiler</label>
                          <input 
                            type="text" 
                            placeholder="Örn: Penisilin, Fıstık (Yoksa boş bırakın)" 
                            value={formData.allergies} 
                            onChange={e => setFormData({...formData, allergies: e.target.value})} 
                            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #fde047', background: 'white', boxSizing: 'border-box' }} 
                          />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#a16207', marginBottom: '6px', display: 'block' }}>Düzenli Kullanılan İlaçlar</label>
                          <input 
                            type="text" 
                            placeholder="Örn: Tansiyon ilacı, İnsülin (Yoksa boş bırakın)" 
                            value={formData.medications} 
                            onChange={e => setFormData({...formData, medications: e.target.value})} 
                            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #fde047', background: 'white', boxSizing: 'border-box' }} 
                          />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#a16207', marginBottom: '6px', display: 'block' }}>Özel Beslenme Planı</label>
                          <input 
                            type="text" 
                            placeholder="Örn: Vegan, Vejetaryen, Glütensiz (Yoksa boş bırakın)" 
                            value={formData.dietaryReq} 
                            onChange={e => setFormData({...formData, dietaryReq: e.target.value})} 
                            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #fde047', background: 'white', boxSizing: 'border-box' }} 
                          />
                      </div>

                      <div>
                          <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#a16207', marginBottom: '6px', display: 'block' }}>Acil Durum Kişisi</label>
                          <input 
                            type="text" 
                            placeholder="Örn: Mehmet Yılmaz" 
                            value={formData.emergencyContactName} 
                            onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} 
                            style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '11px', border: '1px solid #fde047', background: 'white', boxSizing: 'border-box' }} 
                          />
                      </div>
                      <div>
                          <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#a16207', marginBottom: '6px', display: 'block' }}>Acil Durum Tel</label>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'stretch', 
                            border: '1px solid #fde047', 
                            borderRadius: '11px', 
                            background: 'white',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '0 8px', 
                              background: '#fef9c3', 
                              borderRight: '1px solid #fde047', 
                              color: '#a16207', 
                              fontSize: '11.5px', 
                              fontWeight: '700',
                              userSelect: 'none'
                            }}>
                               +90
                            </div>
                            <input 
                              type="tel" 
                              placeholder="532 000 00 00" 
                              value={formData.emergencyContactPhone} 
                              onChange={e => setFormData({...formData, emergencyContactPhone: formatPhoneNumber(e.target.value)})} 
                              maxLength={14}
                              style={{ width: '100%', padding: '10px 10px', fontSize: '13px', border: 'none', outline: 'none', background: 'transparent', boxSizing: 'border-box' }} 
                            />
                          </div>
                      </div>
                  </div>
              </div>
              </>
              )}

              {/* CARD: Bottom Action Buttons (Kaydet & Çıkış Yap) */}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                padding: '12px', 
                marginBottom: '16px',
                display: 'grid', 
                gridTemplateColumns: !isChildProfile ? '1fr 1fr' : '1fr', 
                gap: '10px',
                alignItems: 'center'
              }}>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="btn-primary" 
                    style={{ 
                      width: '100%', 
                      padding: '11px 8px', 
                      fontSize: '12.5px', 
                      fontWeight: '700', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      background: isSaved ? '#10b981' : 'var(--primary)',
                      borderColor: isSaved ? '#10b981' : 'var(--primary)',
                      color: '#ffffff',
                      boxShadow: isSaved ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(215, 20, 122, 0.25)',
                      transition: 'all 0.25s ease',
                      cursor: isSaving ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                      {isSaved ? (
                        <>
                          <CheckCircle2 size={16} /> Kaydedildi! ✓
                        </>
                      ) : isSaving ? (
                        <>
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <Save size={15} /> Kaydet
                        </>
                      )}
                  </button>

                  {!isChildProfile && (
                      <button 
                        type="button"
                        onClick={handleLogout}
                        style={{ 
                           background: '#fff5f5', 
                           border: '1px solid #fecaca', 
                           color: '#ef4444', 
                           padding: '11px 8px', 
                           borderRadius: '12px', 
                           fontSize: '12.5px', 
                           fontWeight: '700', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center', 
                           gap: '6px', 
                           cursor: 'pointer', 
                           transition: 'all 0.2s', 
                           width: '100%',
                           whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
                      >
                         <LogOut size={15} /> Çıkış Yap
                      </button>
                  )}
              </div>
          </form>

          {/* Floating Toast Notification */}
          {isSaved && (
            <div style={{
              position: 'fixed',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '50px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              zIndex: 9999,
              border: '1px solid #334155',
              whiteSpace: 'nowrap'
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Profil bilgileri başarıyla kaydedildi!</span>
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
                              <div style={{ marginBottom: '16px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      👨‍👩‍👧‍👦 Bağlı Çocuklarım
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {linkedChildren.map(c => (
                                          <div key={c.id} onClick={() => navigate(isIndividual ? `/individual/profile?childId=${c.id}` : `/dashboard/profile?childId=${c.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                  <img src={getAvatarUrl(c)} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                                                  <div>
                                                      <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>{c.name}</div>
                                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sağlık & Acil Durum Bilgileri</div>
                                                  </div>
                                              </div>
                                              <ChevronRight size={16} color="var(--text-muted)" />
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      }
                      return null;
                  })()
              )}
              </>
          )}
      </div>
      {/* In-App Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Oturumu Sonlandır"
        message="Oturumunuzu sonlandırmak istediğinize emin misiniz? Tekrar giriş yaparak hesabınıza dilediğiniz zaman erişebilirsiniz."
        confirmText="Çıkış Yap"
        cancelText="Vazgeç"
        type="danger"
        icon={LogOut}
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
