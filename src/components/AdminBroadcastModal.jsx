import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bell, 
  Megaphone, 
  AlertTriangle, 
  Sparkles, 
  Info, 
  Users, 
  Globe, 
  Luggage, 
  Building2, 
  Monitor, 
  Smartphone, 
  ExternalLink,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTourStore } from '../store/tourStore';
import { useNotificationStore } from '../store/notificationStore';
import { triggerDeviceNotification } from '../hooks/useDeviceNotifications';

const AUDIENCE_OPTIONS = [
  {
    key: 'all',
    label: 'Tüm Kullanıcılar (Herkes)',
    description: 'Sistemdeki tüm kayıtlı ve misafir kullanıcılar',
    icon: Globe,
    color: '#D7147A',
    bg: '#FDF2F8'
  },
  {
    key: 'individual',
    label: 'Bireysel Seyahatçiler',
    description: 'Bireysel seyahat asistanı ve bağımsız kullanıcılar',
    icon: Luggage,
    color: '#9333ea',
    bg: '#FAF5FF'
  },
  {
    key: 'corporate',
    label: 'Kurumsal Kullanıcılar',
    description: 'Şirket çalışanları ve kurumsal yolcular',
    icon: Building2,
    color: '#2563eb',
    bg: '#EFF6FF'
  },
  {
    key: 'tour',
    label: 'Belirli Bir Tur',
    description: 'Yalnızca seçilen turun katılımcı ve rehberleri',
    icon: Users,
    color: '#059669',
    bg: '#ECFDF5'
  }
];

const NOTIF_TYPE_OPTIONS = [
  {
    key: 'announcement',
    label: 'Genel Duyuru',
    description: 'Standart duyuru ve genel bilgilendirme',
    icon: Megaphone,
    color: '#D7147A',
    bg: '#FDF2F8',
    badge: '📢 Duyuru'
  },
  {
    key: 'info',
    label: 'Bilgilendirme',
    description: 'Seyahat veya sistem bilgilendirmesi',
    icon: Info,
    color: '#2563eb',
    bg: '#EFF6FF',
    badge: 'ℹ️ Bilgi'
  },
  {
    key: 'alert',
    label: 'Önemli Uyarı',
    description: 'Acil durum veya kritik seyahat uyarısı',
    icon: AlertTriangle,
    color: '#d97706',
    bg: '#FFFBEB',
    badge: '⚠️ Uyarı'
  },
  {
    key: 'promo',
    label: 'Fırsat / Kampanya',
    description: 'Özel teklif, indirim veya kampanya',
    icon: Sparkles,
    color: '#059669',
    bg: '#ECFDF5',
    badge: '🎉 Fırsat'
  }
];

export default function AdminBroadcastModal({ isOpen, onClose }) {
  const user = useAuthStore(state => state.user);
  const tours = useTourStore(state => state.tours);
  const addNotification = useNotificationStore(state => state.addNotification);

  // Form states
  const [targetAudience, setTargetAudience] = useState('all'); // 'all', 'individual', 'corporate', 'tour'
  const [selectedTourId, setSelectedTourId] = useState(tours[0]?.id || '');
  const [notifType, setNotifType] = useState('announcement'); // 'announcement', 'info', 'alert', 'promo'
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [previewPlatform, setPreviewPlatform] = useState('desktop'); // 'desktop' or 'mobile'
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Dropdown states
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [notifTypeOpen, setNotifTypeOpen] = useState(false);

  const audienceDropdownRef = useRef(null);
  const notifTypeDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (audienceDropdownRef.current && !audienceDropdownRef.current.contains(event.target)) {
        setAudienceOpen(false);
      }
      if (notifTypeDropdownRef.current && !notifTypeDropdownRef.current.contains(event.target)) {
        setNotifTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const currentAudience = AUDIENCE_OPTIONS.find(a => a.key === targetAudience) || AUDIENCE_OPTIONS[0];
  const currentNotifType = NOTIF_TYPE_OPTIONS.find(t => t.key === notifType) || NOTIF_TYPE_OPTIONS[0];
  const CurrentAudienceIcon = currentAudience.icon;
  const CurrentNotifTypeIcon = currentNotifType.icon;

  if (!isOpen) return null;

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Lütfen bildirim başlığı ve mesajını doldurun.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Save to Firestore (Real-time distribution via snapshot listener to all devices)
      await addNotification({
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        target: targetAudience,
        tourId: targetAudience === 'tour' ? selectedTourId : null,
        actionUrl: actionUrl.trim() || null,
        senderName: user?.name || (user?.role === 'expert' ? 'Seyahat Uzmanı' : user?.role === 'ticketing' ? 'Biletleme Ekibi' : 'Sistem Yöneticisi'),
        senderId: user?.id || user?.role || 'staff',
        senderRole: user?.role || 'admin'
      });

      // 2. Also trigger a confirmation notification on sender device
      await triggerDeviceNotification(title.trim(), {
        body: message.trim(),
        data: { url: actionUrl.trim() || null }
      });

      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      alert("Bildirim gönderilirken bir hata oluştu: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getNotificationIcon = () => {
    switch (notifType) {
      case 'alert':
        return <AlertTriangle size={16} color="#ef4444" />;
      case 'promo':
        return <Sparkles size={16} color="#f59e0b" />;
      case 'info':
        return <Info size={16} color="#3b82f6" />;
      default:
        return <Megaphone size={16} color="#D7147A" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1.2px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fff5f9 0%, #ffffff 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(215, 20, 122, 0.22)',
              flexShrink: 0
            }}>
              <Megaphone size={16} />
            </div>

            {/* Dikey ayırıcı çizgi */}
            <div style={{
              width: '1.2px',
              height: '24px',
              background: '#F9BED8',
              borderRadius: '1px',
              flexShrink: 0
            }} />

            <div>
              <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Toplu Push & Web Bildirimi Gönder
              </h2>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                OneSignal tarzı anlık masaüstü, mobil ve uygulama içi iletim
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {sendSuccess ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
              Bildirim Başarıyla Yayınlandı!
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Hedeflenen kullanıcıların bilgisayarlarına, mobil cihazlarına ve bildirim merkezine anında iletildi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendBroadcast} style={{ padding: '20px' }}>
            {/* 1. Hedef Kitle Seçimi (Dropdown) */}
            <div 
              ref={audienceDropdownRef}
              style={{ 
                marginBottom: '16px', 
                position: 'relative', 
                zIndex: audienceOpen ? 40 : 20 
              }}
            >
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                1. Hedef Kitle (Audience)
              </label>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => {
                  setAudienceOpen(!audienceOpen);
                  setNotifTypeOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: audienceOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
                  background: audienceOpen ? '#FFF9FB' : '#ffffff',
                  boxShadow: audienceOpen ? '0 0 0 3px rgba(215, 20, 122, 0.1), 0 2px 6px rgba(0,0,0,0.03)' : '0 1px 2px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: currentAudience.bg,
                    color: currentAudience.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CurrentAudienceIcon size={16} />
                  </div>
                  {/* Dikey ayırıcı çizgi */}
                  <div style={{
                    width: '1.2px',
                    height: '22px',
                    background: '#e2e8f0',
                    borderRadius: '1px',
                    flexShrink: 0
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>
                      {currentAudience.label}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentAudience.description}
                    </div>
                  </div>
                </div>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: audienceOpen ? '#FDF2F8' : '#f8fafc',
                  color: audienceOpen ? '#D7147A' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginLeft: '6px',
                  transition: 'transform 0.2s ease'
                }}>
                  <ChevronDown size={15} style={{ transform: audienceOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {audienceOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1.2px solid #e2e8f0',
                  boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
                  padding: '5px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  {AUDIENCE_OPTIONS.map((item) => {
                    const isSelected = targetAudience === item.key;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setTargetAudience(item.key);
                          setAudienceOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 9px',
                          borderRadius: '10px',
                          border: isSelected ? '1px solid #FCE7F3' : '1px solid transparent',
                          background: isSelected ? '#FDF2F8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: item.bg,
                            color: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconComponent size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '600', color: isSelected ? '#D7147A' : '#1e293b' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#D7147A',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: '6px'
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tur Seçici (Yalnızca tur seçilmişse) */}
              {targetAudience === 'tour' && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  background: '#FDF2F8',
                  borderRadius: '12px',
                  border: '1.2px solid #FBCFE8'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#D7147A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '6px'
                  }}>
                    <Users size={13} />
                    <span>Bildirimin Gönderileceği Tur</span>
                  </div>
                  <select
                    value={selectedTourId}
                    onChange={e => setSelectedTourId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #F472B6',
                      background: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    {tours
                      .slice()
                      .sort((a, b) => {
                        const isMyA = (a.guideName === user?.name) || (a.expert?.name === user?.name);
                        const isMyB = (b.guideName === user?.name) || (b.expert?.name === user?.name);
                        if (isMyA && !isMyB) return -1;
                        if (!isMyA && isMyB) return 1;
                        return 0;
                      })
                      .map(t => {
                        const isMy = (t.guideName === user?.name) || (t.expert?.name === user?.name);
                        return (
                          <option key={t.id} value={t.id}>
                            {isMy ? '⭐ [Turum] ' : ''}{t.name} ({t.dates || 'Tarih Yok'})
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Bildirim Türü (Dropdown) */}
            <div 
              ref={notifTypeDropdownRef}
              style={{ 
                marginBottom: '14px', 
                position: 'relative', 
                zIndex: notifTypeOpen ? 35 : 10 
              }}
            >
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                2. Bildirim Türü
              </label>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => {
                  setNotifTypeOpen(!notifTypeOpen);
                  setAudienceOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: notifTypeOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
                  background: notifTypeOpen ? '#FFF9FB' : '#ffffff',
                  boxShadow: notifTypeOpen ? '0 0 0 3px rgba(215, 20, 122, 0.1), 0 2px 6px rgba(0,0,0,0.03)' : '0 1px 2px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: currentNotifType.bg,
                    color: currentNotifType.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CurrentNotifTypeIcon size={16} />
                  </div>
                  {/* Dikey ayırıcı çizgi */}
                  <div style={{
                    width: '1.2px',
                    height: '22px',
                    background: '#e2e8f0',
                    borderRadius: '1px',
                    flexShrink: 0
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>
                      {currentNotifType.label}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentNotifType.description}
                    </div>
                  </div>
                </div>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: notifTypeOpen ? '#FDF2F8' : '#f8fafc',
                  color: notifTypeOpen ? '#D7147A' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginLeft: '6px',
                  transition: 'transform 0.2s ease'
                }}>
                  <ChevronDown size={15} style={{ transform: notifTypeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {notifTypeOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1.2px solid #e2e8f0',
                  boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
                  padding: '5px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  {NOTIF_TYPE_OPTIONS.map((item) => {
                    const isSelected = notifType === item.key;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setNotifType(item.key);
                          setNotifTypeOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 9px',
                          borderRadius: '10px',
                          border: isSelected ? '1px solid #FCE7F3' : '1px solid transparent',
                          background: isSelected ? '#FDF2F8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: item.bg,
                            color: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconComponent size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '600', color: isSelected ? '#D7147A' : '#1e293b' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#D7147A',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginLeft: '6px'
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Başlık & İçerik */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>
                  Bildirim Başlığı *
                </label>
                <span style={{ fontSize: '10px', color: title.length > 55 ? '#D7147A' : '#94a3b8' }}>
                  {title.length}/65 karakter
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 65))}
                placeholder="Örn: ✈️ Yeni İtalya Rotaları & Özel İndirim Başladı!"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.2px solid #e2e8f0',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Bildirim Mesajı (Body) *
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Kullanıcıların ekranında görünecek detaylı bildirim metnini yazın..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.2px solid #e2e8f0',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Tıklanınca Açılacak Sayfa (Opsiyonel URL / Rota)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={e => setActionUrl(e.target.value)}
                placeholder="Örn: /individual/travels veya /city-guide"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.2px solid #e2e8f0',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 4. ONESIGNAL CANLI ÖNİZLEME (MOCKUP) */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '16px',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Canlı Bildirim Önizlemesi
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('desktop')}
                    style={{
                      background: previewPlatform === 'desktop' ? '#334155' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: previewPlatform === 'desktop' ? '#ffffff' : '#94a3b8',
                      padding: '2px 7px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Monitor size={11} /> Masaüstü
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('mobile')}
                    style={{
                      background: previewPlatform === 'mobile' ? '#334155' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: previewPlatform === 'mobile' ? '#ffffff' : '#94a3b8',
                      padding: '2px 7px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Smartphone size={11} /> Mobil
                  </button>
                </div>
              </div>

              {/* Mockup Card */}
              {previewPlatform === 'desktop' ? (
                /* Windows/Mac Web Notification Toast */
                <div style={{
                  background: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid #475569',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#ffffff'
                  }}>
                    <Bell size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Move Yanımda • şimdi</span>
                      <X size={11} color="#64748b" />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', lineHeight: '1.25' }}>
                      {title || 'Bildirim Başlığınız Burada Görünecek'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.3' }}>
                      {message || 'Yazdığınız bildirim mesajı tarayıcıda bu şekilde görüntülenecek...'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile Lockscreen Notification */
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    background: '#D7147A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <Bell size={14} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#ffffff' }}>MOVE YANIMDA</span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>şimdi</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                      {title || 'Bildirim Başlığınız'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>
                      {message || 'Mobil kilit ekranında böyle belirecek...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSending}
                style={{
                  flex: 2,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: isSending ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)'
                }}
              >
                {isSending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Yayınlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Tüm Kanallara Yayınla</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
