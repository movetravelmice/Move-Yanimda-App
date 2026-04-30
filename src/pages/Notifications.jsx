import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useNotificationStore } from '../store/notificationStore';
import { useTourStore } from '../store/tourStore';
import { useAuthStore } from '../store/authStore';
import { Bell, CheckCheck, Megaphone, Info, Trash2, AlertTriangle, X } from 'lucide-react';

export default function Notifications() {
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
      if (user?.role === 'customer') return t.participants?.some(p => p.id === user?.id || p.email === user?.email);
      return true; // admin sees all
  }).map(t => t.id);

  const myNotifications = notifications
         .filter(n => !n.tourId || myTourIds.includes(n.tourId))
         .filter(n => !(n.deletedBy || []).includes(user?.email || 'mock_user'))
         .sort((a,b) => new Date(b.date) - new Date(a.date));

  const hasUnread = myNotifications.some(n => !n.readBy.includes(user?.email || 'mock_user'));

  return (
    <div style={{ paddingBottom: '90px', position: 'relative' }}>
      <Header title="Bildirim Merkezi" />
      
      {/* Custom Confirm Popup */}
      {confirmPopup && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
              <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <AlertTriangle size={32} color="#ef4444" />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>Emin misiniz?</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '24px', lineHeight: 1.5 }}>Tüm bildirim geçmişiniz kalıcı olarak silinecektir.</p>
                  
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button onClick={() => setConfirmPopup(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>
                          Vazgeç
                      </button>
                      <button onClick={confirmClear} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                          Evet, Temizle
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div style={{ padding: '0 16px', marginTop: '20px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Tümü</h2>
             
             <div style={{ display: 'flex', gap: '16px' }}>
                 {hasUnread && (
                    <button 
                      onClick={() => markAllAsRead(user?.email || 'mock_user')} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                        <CheckCheck size={16} /> Okundu
                    </button>
                 )}
                 {myNotifications.length > 0 && (
                    <button 
                      onClick={() => setConfirmPopup(true)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                    >
                        <Trash2 size={16} /> Temizle
                    </button>
                 )}
             </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {myNotifications.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                     <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                     <p>Henüz bir bildiriminiz bulunmuyor.</p>
                 </div>
             ) : (
                 myNotifications.map(n => {
                     const isUnread = !n.readBy.includes(user?.email || 'mock_user');
                     const isExpertAlert = n.type === 'expert_alert';

                     return (
                         <div 
                           key={n.id} 
                           onClick={() => markAsRead(n.id, user?.email || 'mock_user')}
                           style={{ 
                               background: isUnread ? '#fdf2f8' : 'var(--surface)', 
                               padding: '16px', 
                               borderRadius: '12px', 
                               border: `1px solid ${isUnread ? 'rgba(215, 20, 122, 0.2)' : 'var(--border-color)'}`,
                               display: 'flex', gap: '12px', transition: 'all 0.2s', cursor: 'pointer' 
                           }}
                         >
                             <div style={{ 
                                 width: '40px', height: '40px', borderRadius: '50%', 
                                 background: isExpertAlert ? '#fef3c7' : '#e0e7ff', 
                                 color: isExpertAlert ? '#d97706' : '#4f46e5', 
                                 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                             }}>
                                 {isExpertAlert ? <Megaphone size={20} /> : <Info size={20} />}
                             </div>
                             <div style={{ flex: 1 }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                     <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{n.title}</h3>
                                     {isUnread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '4px' }}></div>}
                                 </div>
                                 <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                                 
                                 {n.senderName && (
                                     <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>
                                         Gönderen: {n.senderName} 
                                         {user?.role === 'expert' && <span style={{color: '#94a3b8', fontStyle: 'italic', paddingLeft: '4px'}}> (Kendi İletiniz)</span>}
                                     </div>
                                 )}

                                 <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', textAlign: 'right' }}>
                                     {new Date(n.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                 </div>
                             </div>
                         </div>
                     )
                 })
             )}
         </div>
      </div>
    </div>
  )
}
