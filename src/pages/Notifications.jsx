import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useNotificationStore } from '../store/notificationStore';
import { useTourStore } from '../store/tourStore';
import { useAuthStore } from '../store/authStore';
import { 
  Bell, 
  CheckCheck, 
  Megaphone, 
  Info, 
  Trash2, 
  AlertTriangle, 
  X, 
  Send, 
  Sparkles, 
  ExternalLink, 
  ChevronRight 
} from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tours } = useTourStore();
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  const [confirmPopup, setConfirmPopup] = useState(false);

  const confirmClear = () => {
    clearNotifications(user?.email || 'mock_user');
    setConfirmPopup(false);
  };

  const myTourIds = tours.filter(t => {
    if (user?.role === 'expert') return (t.guideName === user?.name) || (t.expert?.name === user?.name);
    if (user?.role === 'customer') return t.participants?.some(p => p.id === user?.id || (p.email && user?.email && p.email.toLowerCase() === user.email.toLowerCase()));
    return true; // admin sees all
  }).map(t => t.id);

  const myNotifications = notifications
    .filter(n => {
      // 1. Check if deleted by user
      if ((n.deletedBy || []).includes(user?.email || 'mock_user')) return false;

      // 2. Admins see all notifications
      if (user?.role === 'admin') return true;

      // 2.1 Senders always see their own sent notifications
      if (n.senderId === user?.id || (n.senderName && n.senderName === user?.name)) return true;

      // 3. Target matching
      const target = n.target || (n.tourId ? 'tour' : 'all');
      if (target === 'all') return true;
      if (target === 'individual') return user?.userType === 'individual' || user?.role === 'customer';
      if (target === 'corporate') return user?.userType === 'corporate' || ['admin', 'expert', 'customer', 'ticketing'].includes(user?.role);
      if (target === 'tour' && n.tourId) return myTourIds.includes(n.tourId);

      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const hasUnread = myNotifications.some(n => !n.readBy.includes(user?.email || 'mock_user'));

  const canSendBroadcast = ['admin', 'expert', 'ticketing'].includes(user?.role);

  return (
    <div style={{ paddingBottom: '90px', position: 'relative' }}>
      <Header title="Bildirim Merkezi" />
      
      {/* Custom Confirm Clear Popup */}
      {confirmPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '320px', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-main)', textAlign: 'center' }}>Emin misiniz?</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '20px', lineHeight: 1.4 }}>Tüm bildirim geçmişiniz kalıcı olarak silinecektir.</p>
            
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={() => setConfirmPopup(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                Vazgeç
              </button>
              <button onClick={confirmClear} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px', marginTop: '16px' }}>
        {/* Broadcast CTA Banner for Admin, Expert, Ticketing */}
        {canSendBroadcast && (
          <button
            type="button"
            onClick={() => navigate('/dashboard/broadcast')}
            style={{
              width: '100%',
              marginBottom: '12px',
              padding: '12px 16px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(215, 20, 122, 0.28)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Megaphone size={17} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '800' }}>
                  Toplu Push & Web Bildirimi Gönder
                </div>
                <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                  {user?.role === 'expert'
                    ? 'Tur katılımcılarına veya kullanıcılara anlık push bildirim iletin'
                    : user?.role === 'ticketing'
                      ? 'Biletleme ve operasyon anlık duyuru iletimi'
                      : 'Tarayıcı, mobil ve web anlık ekran iletimi'}
                </div>
              </div>
            </div>

            <ChevronRight size={16} />
          </button>
        )}

        {/* Action Bar Card */}
        <div 
          className="card" 
          style={{ 
            padding: '10px 14px', 
            marginBottom: '12px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Tümü</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: '#f1f5f9', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>{myNotifications.length}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {hasUnread && (
              <button 
                onClick={() => markAllAsRead(user?.email || 'mock_user')} 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
              >
                <CheckCheck size={14} /> Okundu
              </button>
            )}
            {myNotifications.length > 0 && (
              <button 
                onClick={() => setConfirmPopup(true)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
              >
                <Trash2 size={14} /> Temizle
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {myNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
              <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '13px', margin: 0, fontWeight: '600' }}>Henüz bir bildiriminiz bulunmuyor.</p>
              <p style={{ fontSize: '11px', marginTop: '4px', color: '#94a3b8' }}>
                Yöneticiler veya rehberler tarafından gönderilen anlık bildirimler burada listelenir.
              </p>
            </div>
          ) : (
            myNotifications.map(n => {
              const isUnread = !n.readBy.includes(user?.email || 'mock_user');
              const isExpertAlert = n.type === 'expert_alert' || n.type === 'alert';
              const isPromo = n.type === 'promo';

              return (
                <div 
                  key={n.id} 
                  onClick={() => {
                    markAsRead(n.id, user?.email || 'mock_user');
                    if (n.actionUrl) {
                      window.location.href = n.actionUrl;
                    }
                  }}
                  style={{ 
                    background: isUnread ? '#fff5f9' : 'var(--surface)', 
                    padding: '13px 15px', 
                    borderRadius: '14px', 
                    border: `1.2px solid ${isUnread ? '#F9BED8' : 'var(--border-color)'}`,
                    display: 'flex', 
                    gap: '12px', 
                    transition: 'all 0.2s', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: isExpertAlert ? '#fef2f2' : (isPromo ? '#FDF2F8' : '#eff6ff'), 
                    color: isExpertAlert ? '#ef4444' : (isPromo ? '#D7147A' : '#3b82f6'), 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {isExpertAlert ? <AlertTriangle size={17} /> : (isPromo ? <Sparkles size={17} /> : <Megaphone size={17} />)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '6px' }}>
                      <h3 
                        title={n.title}
                        style={{ 
                          fontSize: '13px', 
                          fontWeight: '800', 
                          color: '#0f172a', 
                          margin: 0, 
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        {n.title}
                      </h3>
                      {isUnread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D7147A', flexShrink: 0 }} />}
                    </div>

                    <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {n.message}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      {n.senderName ? (
                        <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#D7147A' }}>
                          Gönderen: {n.senderName}
                        </div>
                      ) : <div />}

                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {new Date(n.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {n.actionUrl && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#2563eb', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>Sayfaya Git</span> <ExternalLink size={11} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
