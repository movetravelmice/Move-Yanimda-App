import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { 
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
  CheckCircle2,
  Loader2,
  X,
  History,
  Calendar,
  CheckCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTourStore } from '../../store/tourStore';
import { useNotificationStore } from '../../store/notificationStore';
import { triggerDeviceNotification } from '../../hooks/useDeviceNotifications';

export default function BroadcastNotification() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const tours = useTourStore(state => state.tours);
  const { notifications, addNotification } = useNotificationStore();

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

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Lütfen bildirim başlığı ve mesajını doldurun.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Save to Firestore (Real-time distribution to all devices via listener)
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

      // 2. Trigger native/web device notification on sender
      await triggerDeviceNotification(title.trim(), {
        body: message.trim(),
        data: { url: actionUrl.trim() || null }
      });

      setSendSuccess(true);
    } catch (err) {
      alert("Bildirim gönderilirken bir hata oluştu: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setMessage('');
    setActionUrl('');
    setSendSuccess(false);
  };

  const recentBroadcasts = notifications
    .filter(n => n.senderRole || n.target)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 10);

  const getTargetBadge = (target, tourId) => {
    switch (target) {
      case 'individual':
        return <span style={{ fontSize: '10px', background: '#fdf2f8', color: '#be185d', padding: '2px 7px', borderRadius: '6px', fontWeight: '700' }}>Bireysel</span>;
      case 'corporate':
        return <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: '6px', fontWeight: '700' }}>Kurumsal</span>;
      case 'tour': {
        const tr = tours.find(t => t.id === tourId);
        return <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#047857', padding: '2px 7px', borderRadius: '6px', fontWeight: '700' }}>Tur: {tr?.name || 'Seçili Tur'}</span>;
      }
      default:
        return <span style={{ fontSize: '10px', background: '#FDF2F8', color: '#B01064', padding: '2px 7px', borderRadius: '6px', fontWeight: '700' }}>Herkes (Tümü)</span>;
    }
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
      <Header title="Toplu Bildirim Gönder" showBack onBack={() => navigate(-1)} />

      <div style={{ padding: '14px 16px', maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Top Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FDF2F8 0%, #ffffff 100%)',
          borderRadius: '16px',
          border: '1.5px solid #F9BED8',
          padding: '14px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(215, 20, 122, 0.06)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(215, 20, 122, 0.25)'
          }}>
            <Megaphone size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Toplu Push & Web Bildirimi
            </h2>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              OneSignal tarzı anlık masaüstü, mobil kilit ekranı ve uygulama içi bildirim iletimi
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {sendSuccess ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #a7f3d0',
            padding: '32px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
              Bildirim Başarıyla Yayınlandı!
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Hedeflenen kullanıcıların bilgisayarlarına, mobil cihazlarına ve bildirim merkezine anında iletildi.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleResetForm}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yeni Bildirim Gönder
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)'
                }}
              >
                Ana Panele Dön
              </button>
            </div>
          </div>
        ) : (
          /* Main Form Card */
          <form 
            onSubmit={handleSendBroadcast} 
            style={{
              background: 'white',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '18px 18px',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              marginBottom: '20px'
            }}
          >
            {/* 1. Hedef Kitle Seçimi */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '8px' }}>
                1. Hedef Kitle (Audience)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTargetAudience('all')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: targetAudience === 'all' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: targetAudience === 'all' ? '#FDF2F8' : '#ffffff',
                    color: targetAudience === 'all' ? '#D7147A' : '#475569',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Globe size={16} color={targetAudience === 'all' ? '#D7147A' : '#94a3b8'} />
                  <span>Tüm Kullanıcılar (Herkes)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('individual')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: targetAudience === 'individual' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: targetAudience === 'individual' ? '#FDF2F8' : '#ffffff',
                    color: targetAudience === 'individual' ? '#D7147A' : '#475569',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Luggage size={16} color={targetAudience === 'individual' ? '#D7147A' : '#94a3b8'} />
                  <span>Bireysel Seyahatçiler</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('corporate')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: targetAudience === 'corporate' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: targetAudience === 'corporate' ? '#FDF2F8' : '#ffffff',
                    color: targetAudience === 'corporate' ? '#D7147A' : '#475569',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Building2 size={16} color={targetAudience === 'corporate' ? '#D7147A' : '#94a3b8'} />
                  <span>Kurumsal Kullanıcılar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('tour')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: targetAudience === 'tour' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: targetAudience === 'tour' ? '#FDF2F8' : '#ffffff',
                    color: targetAudience === 'tour' ? '#D7147A' : '#475569',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Users size={16} color={targetAudience === 'tour' ? '#D7147A' : '#94a3b8'} />
                  <span>Belirli Bir Tur</span>
                </button>
              </div>

              {/* Tur Seçici (Yalnızca tur seçilmişse) */}
              {targetAudience === 'tour' && (
                <div style={{ marginTop: '10px' }}>
                  <select
                    value={selectedTourId}
                    onChange={e => setSelectedTourId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1.2px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#1e293b'
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

            {/* 2. Bildirim Türü */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '8px' }}>
                2. Bildirim Türü
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'announcement', label: '📢 Genel Duyuru' },
                  { key: 'info', label: 'ℹ️ Bilgilendirme' },
                  { key: 'alert', label: '⚠️ Önemli Uyarı' },
                  { key: 'promo', label: '🎉 Fırsat / Kampanya' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setNotifType(item.key)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '10px',
                      border: notifType === item.key ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                      background: notifType === item.key ? '#FDF2F8' : '#ffffff',
                      color: notifType === item.key ? '#D7147A' : '#64748b',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Başlık & İçerik */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>
                  Bildirim Başlığı *
                </label>
                <span style={{ fontSize: '10.5px', color: title.length > 55 ? '#D7147A' : '#94a3b8', fontWeight: '600' }}>
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
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.2px solid #e2e8f0',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Bildirim Mesajı (Body) *
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Kullanıcıların ekranında görünecek detaylı bildirim metnini yazın..."
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.2px solid #e2e8f0',
                  fontSize: '12.5px',
                  lineHeight: '1.45',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  background: '#f8fafc'
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Tıklanınca Açılacak Sayfa (Opsiyonel URL / Rota)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={e => setActionUrl(e.target.value)}
                placeholder="Örn: /individual/travels veya /city-guide"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1.2px solid #e2e8f0',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* 4. ONESIGNAL CANLI ÖNİZLEME (MOCKUP) */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '20px',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Canlı Bildirim Önizlemesi (Live Preview)
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
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
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
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
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
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#ffffff'
                  }}>
                    <Bell size={17} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Move Yanımda • şimdi</span>
                      <X size={12} color="#64748b" />
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#ffffff', lineHeight: '1.25' }}>
                      {title || 'Bildirim Başlığınız Burada Görünecek'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', lineHeight: '1.35' }}>
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
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#D7147A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <Bell size={15} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#ffffff' }}>MOVE YANIMDA</span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>şimdi</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', marginTop: '3px' }}>
                      {title || 'Bildirim Başlığınız'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                      {message || 'Mobil kilit ekranında böyle belirecek...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSending}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  cursor: isSending ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(215, 20, 122, 0.3)'
                }}
              >
                {isSending ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Yayınlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Tüm Kanallara Yayınla (Push)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Son Gönderilen Bildirimler Geçmişi */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <History size={16} color="#64748b" />
            <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              Son Gönderilen Toplu Bildirimler
            </h3>
          </div>

          {recentBroadcasts.length === 0 ? (
            <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
              Henüz gönderilmiş toplu bildirim bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentBroadcasts.map((n, idx) => (
                <div 
                  key={n.id || idx}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getTargetBadge(n.target, n.tourId)}
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {n.senderName || 'Yetkili'}
                      </span>
                    </div>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      {n.date ? new Date(n.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.35 }}>
                    {n.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
