import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { 
  Camera, 
  UserCog, 
  LogOut, 
  ChevronLeft, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Building2 
} from 'lucide-react';

export default function Header({ title, subtitle, showBack = false, onBack, badge = null, marginBottom }) {
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const setActiveMode = useAuthStore(state => state.setActiveMode);
  const [greeting, setGreeting] = useState('İyi Günler');
  const getInitialGeoInfo = () => {
    try {
      const cached = sessionStorage.getItem('user_geo_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.isTurkey === 'boolean') {
          return parsed;
        }
      }
    } catch (e) {}

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isTrTz = tz === 'Europe/Istanbul';
    return {
      countryCode: isTrTz ? 'TR' : '',
      countryName: isTrTz ? 'Türkiye' : '',
      isTurkey: isTrTz,
      timezone: tz || 'Europe/Istanbul'
    };
  };

  const [geoInfo, setGeoInfo] = useState(getInitialGeoInfo);

  const [times, setTimes] = useState(() => {
    const now = new Date();
    return {
      turkey: now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }),
      local: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
  });

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isIndividualPath = location.pathname.startsWith('/individual');
  const isIndividualMode = activeMode === 'individual' || isIndividualPath || user?.userType === 'individual';

  // 1. Silent IP Geolocation check
  useEffect(() => {
    let isMounted = true;
    const detectGeo = async () => {
      try {
        const cached = sessionStorage.getItem('user_geo_info');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.isTurkey === 'boolean') {
            if (isMounted) setGeoInfo(parsed);
            return;
          }
        }

        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data && data.success !== false && data.country_code) {
          const isTr = data.country_code === 'TR' || data.country === 'Türkiye' || data.country === 'Turkey';
          const info = {
            countryCode: data.country_code,
            countryName: data.country || (isTr ? 'Türkiye' : ''),
            isTurkey: isTr,
            timezone: data.timezone?.id || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'
          };
          if (isMounted) setGeoInfo(info);
          sessionStorage.setItem('user_geo_info', JSON.stringify(info));
          return;
        }
      } catch {
        try {
          const res2 = await fetch('https://freeipapi.com/api/json');
          const data2 = await res2.json();
          if (data2 && data2.countryCode) {
            const isTr = data2.countryCode === 'TR' || data2.countryName === 'Turkey' || data2.countryName === 'Türkiye';
            const info = {
              countryCode: data2.countryCode,
              countryName: data2.countryName || (isTr ? 'Türkiye' : ''),
              isTurkey: isTr,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'
            };
            if (isMounted) setGeoInfo(info);
            sessionStorage.setItem('user_geo_info', JSON.stringify(info));
          }
        } catch (e) {
          // Fallback silently
        }
      }
    };

    detectGeo();
    return () => { isMounted = false; };
  }, []);

  // 2. Real-time clock and greeting updater
  useEffect(() => {
    const updateTimesAndGreeting = () => {
      const now = new Date();
      const turkeyHour = parseInt(now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }), 10);
      if (turkeyHour >= 6 && turkeyHour < 12) setGreeting('İyi Sabahlar');
      else if (turkeyHour >= 12 && turkeyHour < 18) setGreeting('İyi Günler');
      else if (turkeyHour >= 18 && turkeyHour < 22) setGreeting('İyi Akşamlar');
      else setGreeting('İyi Geceler');

      const tz = geoInfo.timezone;
      let localStr = '';
      try {
        localStr = now.toLocaleTimeString('tr-TR', { ...(tz ? { timeZone: tz } : {}), hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        localStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }

      setTimes({
        turkey: now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }),
        local: localStr
      });
    };

    updateTimesAndGreeting();
    const interval = setInterval(updateTimesAndGreeting, 10000); // 10 sec interval
    return () => clearInterval(interval);
  }, [geoInfo.timezone]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          
          useAuthStore.getState().updateProfile({ avatar: dataUrl });
          setShowMenu(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const formatName = (name) => {
    if (!name) return 'Henüz Giriş Yapılmamış';
    let cleanName = name.replace('.', ' ');
    return cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const displayName = user ? formatName(user.name) : 'Henüz Giriş Yapılmamış';
  
  // Default subtitle: If in Turkey: "Türkiye: 12:26", If abroad: "FR: 11:26 | Türkiye: 12:26"
  const defaultSubtitle = geoInfo.isTurkey
    ? `Türkiye: ${times.turkey}`
    : `${(geoInfo.countryCode || 'KONUM').toUpperCase()}: ${times.local} | Türkiye: ${times.turkey}`;
  const headerSubtitle = title || defaultSubtitle;
  
  const expertStatus = useSettingsStore(state => state.expertStatus);
  const setExpertStatus = useSettingsStore(state => state.setExpertStatus);

  const toggleStatus = (e) => {
     e.stopPropagation();
     if (expertStatus === 'offline') setExpertStatus('online');
     else if (expertStatus === 'online') setExpertStatus('busy');
     else setExpertStatus('offline');
  };
  
  const getStatusColor = () => {
     if (expertStatus === 'online') return '#10B981';
     if (expertStatus === 'busy') return '#FACC15';
     return '#9CA3AF';
  };
  
  const getAvatarUrl = () => {
     if (!user) {
       // 3. görsel: neutral grey silhouette avatar
       return '/guest-avatar.png';
     }
     if (user?.avatar) return user.avatar;
     return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ffffff&color=D7147A&bold=true`;
  };

  const isCorporateUser = user && (
    user.userType === 'corporate' || 
    ['admin', 'expert', 'ticketing'].includes(user.role) || 
    (user.company && user.company !== 'Bireysel')
  );

  return (
    <div className="top-header" style={{
      position: 'relative',
      borderBottomLeftRadius: '0px',
      borderBottomRightRadius: '0px',
      borderRadius: '0px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 50,
      padding: 'calc(19px + env(safe-area-inset-top, 0px)) 18px 19px 18px',
      background: 'var(--primary)',
      color: 'white',
      overflow: 'visible',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      marginBottom: marginBottom !== undefined ? marginBottom : '18px'
    }}>
      {/* Background SVG Wave decoration like Bilgebayraktar */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '140%', height: '100%', opacity: 0.12 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#ffffff" d="M0,192L48,202.7C96,213,192,235,288,224C384,213,480,171,576,165.3C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {showBack ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1, flex: 1, minWidth: 0, marginRight: '10px' }}>
          <div 
            onClick={onBack || (() => navigate(-1))} 
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', flexShrink: 0, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            title="Geri Dön"
          >
            <ChevronLeft size={20} color="#ffffff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.2px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
            {subtitle && (
              <div style={{ 
                fontSize: '10.5px', 
                color: 'rgba(255, 255, 255, 0.88)', 
                fontWeight: '500', 
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ zIndex: 1, minWidth: 0, marginRight: '10px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: '500', marginBottom: '1px' }}>
            {greeting},
          </div>
          <h1 style={{ fontSize: '15.5px', fontWeight: '800', color: '#ffffff', margin: '0 0 2px 0', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            {displayName}
          </h1>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle || headerSubtitle}
          </div>
        </div>
      )}

      {badge && (
        <div style={{ marginRight: '10px', zIndex: 1, flexShrink: 0 }}>
          {badge}
        </div>
      )}
      
      <div ref={menuRef} style={{ position: 'relative', zIndex: 100 }}>
        {/* Expert status dot (for corporate experts) */}
        {user?.role === 'expert' && !showBack && (
           <div 
             onClick={toggleStatus}
             title={`Durum: ${expertStatus === 'online' ? 'Çevrimiçi' : expertStatus === 'busy' ? 'Meşgul' : 'Çevrimdışı'}`}
             style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                zIndex: 10,
                width: '13px', height: '13px', borderRadius: '50%', cursor: 'pointer',
                backgroundColor: getStatusColor(),
                border: '2px solid var(--primary)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.2s', flexShrink: 0
             }}
           />
        )}

        {/* User Online Dot (for individual and other logged-in users) */}
        {user && user.role !== 'expert' && !showBack && (
           <div 
             title="Çevrimiçi"
             style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                zIndex: 10,
                width: '13px', height: '13px', borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid var(--primary)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                flexShrink: 0
             }}
           />
        )}

        {/* Profile Avatar Area */}
        <div 
          onClick={() => setShowMenu(!showMenu)}
          title={user ? `${displayName} Profili` : "Giriş Yap veya Kayıt Ol"}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.95)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img 
            loading="lazy" 
            src={getAvatarUrl()} 
            alt={displayName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              e.target.src = '/guest-avatar.png';
            }}
          />
        </div>

        {/* Dropdown Menu Modal */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '54px',
            right: '0',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            width: user ? '250px' : '200px',
            overflow: 'hidden',
            zIndex: 1000,
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {user ? (
              // ---------------- LOGGED IN MENU ----------------
              <>
                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', color: 'var(--text-main)', background: '#f8fafc' }}>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>{displayName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>{user?.email || 'kullanici@move.com.tr'}</div>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isIndividualMode ? '#FDF2F8' : '#eff6ff',
                      color: isIndividualMode ? '#D7147A' : '#2563eb'
                    }}>
                      {isIndividualMode 
                        ? 'Bireysel Asistan' 
                        : (user?.role === 'admin' ? 'Yönetici' : user?.role === 'ticketing' ? 'Biletleme Operasyonları' : user?.role === 'expert' ? 'Rehber / Operasyon' : user?.userType === 'individual' ? 'Bireysel Hesap' : 'Kurumsal Hesap')}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '6px' }}>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Camera size={16} color="var(--primary)" /> <span>Profil Resmini Değiştir</span>
                  </div>
                  
                  <div 
                    onClick={() => { 
                      setShowMenu(false); 
                      navigate(isIndividualMode ? '/individual/profile' : '/dashboard/profile'); 
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <UserCog size={16} color="var(--primary)" /> <span>Profil Ayarları</span>
                  </div>

                  {/* Mode Switching (Bridge between Corporate and Individual Assistant) */}
                  {isIndividualMode ? (
                    <div 
                      onClick={() => { 
                        setShowMenu(false); 
                        setActiveMode('corporate');
                        navigate('/dashboard'); 
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', color: '#2563eb', fontWeight: '700', transition: 'background 0.15s', background: '#eff6ff' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                    >
                      <Building2 size={16} color="#2563eb" /> <span>Kurumsal Profilime Geç</span>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { 
                        setShowMenu(false); 
                        setActiveMode('individual');
                        navigate('/individual/dashboard'); 
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', color: '#D7147A', fontWeight: '700', transition: 'background 0.15s', background: '#FDF2F8' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FCE7F3'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FDF2F8'}
                    >
                      <Sparkles size={16} color="#D7147A" /> <span>Bireysel Asistanıma Geç</span>
                    </div>
                  )}
                  
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 6px' }}></div>
                  
                  <div 
                    onClick={() => {
                      setShowMenu(false);
                      useAuthStore.getState().logout();
                      navigate('/welcome');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '13px', color: '#ef4444', fontWeight: '600', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} color="#ef4444" /> <span>Çıkış Yap</span>
                  </div>
                </div>
              </>
            ) : (
              // ---------------- GUEST (NOT LOGGED IN) MENU ----------------
              <>
                <div style={{ padding: '14px 14px 10px 14px', borderBottom: '1px solid #f1f5f9', color: 'var(--text-main)', background: '#f8fafc' }}>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>Move Yanımda</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Henüz giriş yapılmamış</div>
                </div>

                <div style={{ padding: '6px' }}>
                  <div 
                    onClick={() => { setShowMenu(false); navigate('/login'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '12px', color: 'var(--primary)', fontWeight: '700', background: '#fdf2f8', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fce7f3'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fdf2f8'}
                  >
                    <LogIn size={15} color="var(--primary)" /> <span>Giriş Yap</span>
                  </div>

                  <div 
                    onClick={() => { setShowMenu(false); navigate('/register'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '12px', color: '#0f172a', fontWeight: '700', transition: 'background 0.15s', marginTop: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <UserPlus size={15} color="#0f172a" /> <span>Kayıt Ol</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
