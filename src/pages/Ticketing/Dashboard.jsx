import React, { useState } from 'react';
import { 
  Search, 
  Edit3, 
  Users, 
  PlaneTakeoff, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Megaphone, 
  X, 
  Send, 
  Phone, 
  CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights, getTourExperts, isTourActive } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export default function TicketingDashboard() {
  const navigate = useNavigate();
  const { tours } = useTourStore();
  const allUsers = useUserStore(state => state.users);
  const user = useAuthStore(state => state.user);
  const { addNotification } = useNotificationStore();

  const activeTours = tours.filter(isTourActive);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPanoGroup, setExpandedPanoGroup] = useState(null);
  const [expertModalData, setExpertModalData] = useState(null);

  const [broadcastTourId, setBroadcastTourId] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });

  const missingTicketsGroups = activeTours.map(tour => {
      const missingUsers = (tour.participants || []).filter(p => !p.ticketPdf && (!p.ticketFiles || p.ticketFiles.length === 0));
      return { tour, missingUsers };
  }).filter(group => group.missingUsers.length > 0);
  
  const filteredTours = activeTours.filter(tour => {
      const qs = searchQuery.toLowerCase();
      const tourName = tour.name?.toLowerCase() || '';
      const expertNameRef = (tour.guideName || tour.expert?.name || '').toLowerCase();
      const destination = (tour.destinations || tour.destination || '').toLowerCase();
      return tourName.includes(qs) || expertNameRef.includes(qs) || destination.includes(qs);
  });

  const handleBroadcastSubmit = () => {
      if (!broadcastMsg.trim() || !broadcastTourId) return;

      const activeTour = tours.find(t => t.id === broadcastTourId);

      addNotification({
          type: 'expert_alert',
          title: ` ${activeTour?.name} Biletleme Anonsu`,
          message: broadcastMsg,
          tourId: broadcastTourId,
          senderName: user?.name || 'Biletleme Uzmanı'
      });

      setBroadcastTourId(null);
      setBroadcastMsg("");
      setPopupMsg({ show: true, type: 'success', title: 'Başarılı!', text: 'Bildiriminiz tüm katılımcılara başarıyla iletildi!' });
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      <Header title="Biletleme Operasyonları" />
      
      {/* Custom Popup */}
      {popupMsg.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
              <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: popupMsg.type === 'success' ? '#ecfdf5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <CheckCircle2 size={32} color={popupMsg.type === 'success' ? '#10b981' : '#ef4444'} />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>{popupMsg.title}</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '24px', lineHeight: 1.5 }}>{popupMsg.text}</p>
                  
                  <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '12px', borderRadius: '12px' }}>
                      Harika
                  </button>
              </div>
          </div>
      )}

      {/* Broadcast Message Modal */}
      {broadcastTourId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Megaphone size={16} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Biletleme Anonsu Gönder</h2>
                    </div>
                    <div onClick={() => setBroadcastTourId(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    Bu mesaj ilgili turun tüm katılımcılarına yüksek öncelikli anlık bildirim olarak iletilecektir.
                </p>

                <textarea
                    rows={4}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Bilet, uçuş değişikliği veya transfer ile ilgili anonsunuzu buraya yazın..."
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', resize: 'none', background: '#f8fafc' }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setBroadcastTourId(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                        Vazgeç
                    </button>
                    <button onClick={handleBroadcastSubmit} className="btn-primary" style={{ flex: 2, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                        <Send size={15} /> Gönder
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Expert Details Modal */}
      {expertModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px', animation: 'fadeIn 0.2s ease-out', textAlign: 'center', position: 'relative' }}>
            <div onClick={() => setExpertModalData(null)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>
                {expertModalData.expert2 ? 'Seyahat Uzmanlarımız' : 'Seyahat Uzmanı'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[expertModalData.expert1, expertModalData.expert2].filter(Boolean).map((exp, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '10px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-light)', flexShrink: 0 }}>
                               <img loading="lazy" src={exp.avatar} alt={exp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px 0', color: 'var(--text-main)' }}>{exp.name}</h3>
                                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>{idx === 0 ? '1. Seyahat Uzmanı' : '2. Seyahat Uzmanı'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', fontSize: '12px', textAlign: 'left', background: 'white', padding: '10px 12px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                            {exp.phone && (
                                <a href={`tel:${exp.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                    <Phone size={13} /> {exp.phone}
                                </a>
                            )}
                            {exp.email && (
                                <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    ✉️ {exp.email}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn-primary" onClick={() => setExpertModalData(null)} style={{ marginTop: '16px', width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px' }}>
                Kapat
            </button>
          </div>
        </div>
      )}
      
      <div style={{ padding: '16px' }}>

        {/* EKSİK BİLET PANOSU (MİNİMAL & ELEGANT) */}
        {missingTicketsGroups.length > 0 && (
          <div style={{ 
              background: '#fffdf5', 
              border: '1px solid #fef08a', 
              borderRadius: '14px', 
              padding: '10px 12px', 
              marginBottom: '14px', 
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.04)' 
          }}>
             {/* Üst Başlık Şeridi */}
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309' }}>
                   <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                   <span style={{ fontSize: '12.5px', fontWeight: '700', letterSpacing: '-0.1px' }}>Bileti Eksik Katılımcılar</span>
                </div>
                <span style={{ fontSize: '10.5px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                   {missingTicketsGroups.reduce((acc, g) => acc + g.missingUsers.length, 0)} Katılımcı
                </span>
             </div>

             {/* Tur Listesi */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {missingTicketsGroups.map((grp) => (
                    <div key={grp.tour.id} style={{ background: 'white', borderRadius: '9px', overflow: 'hidden', border: '1px solid #fef3c7', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div 
                           onClick={() => setExpandedPanoGroup(expandedPanoGroup === grp.tour.id ? null : grp.tour.id)}
                           style={{ 
                               padding: '7px 10px', 
                               display: 'flex', 
                               justifyContent: 'space-between', 
                               alignItems: 'center', 
                               cursor: 'pointer', 
                               background: expandedPanoGroup === grp.tour.id ? '#fef9c3' : 'white', 
                               transition: 'all 0.15s' 
                           }}
                        >
                           <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                               <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                   {grp.tour.name}
                               </div>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                               <span style={{ fontSize: '10.5px', color: '#d97706', fontWeight: '700', background: '#fffbeb', padding: '1px 6px', borderRadius: '5px', border: '1px solid #fef3c7' }}>
                                   {grp.missingUsers.length} Bekliyor
                               </span>
                               <div style={{ color: '#d97706', display: 'flex', alignItems: 'center' }}>
                                   {expandedPanoGroup === grp.tour.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                               </div>
                           </div>
                        </div>

                        {expandedPanoGroup === grp.tour.id && (
                           <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#fffdf7', borderTop: '1px solid #fef3c7' }}>
                               {grp.missingUsers.map(u => (
                                   <div 
                                      key={u.id} 
                                      onClick={() => navigate(`/dashboard/participants/${grp.tour.id}?openTransfer=${u.id}`)}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'white', borderRadius: '7px', cursor: 'pointer', border: '1px solid #fef08a', transition: 'all 0.15s' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#fef9c3'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                   >
                                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name?.charAt(0) || 'U')}&background=D7147A&color=fff`} alt="Avatar" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                      <div style={{ flex: 1, fontSize: '11.5px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                                      <div style={{ fontSize: '10px', background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '6px', fontWeight: '700', whiteSpace: 'nowrap' }}>PDF Yükle</div>
                                   </div>
                               ))}
                           </div>
                        )}
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* Tüm Seyahatler Kart Başlığı */}
        <div className="card" style={{ 
            padding: '12px 14px', 
            marginBottom: '10px', 
            borderRadius: '14px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'white'
        }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
                  Tüm Seyahatler <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>({filteredTours.length})</span>
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Operasyonel takip ve bilet yönetimi</div>
            </div>
        </div>

        {/* Seyahat Arama Barı İçin Ayrı Kart */}
        <div className="card" style={{ 
            padding: '10px 14px', 
            marginBottom: '14px', 
            borderRadius: '14px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', 
            background: 'white'
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '8px 12px',
                gap: '8px'
            }}>
                <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input 
                    type="text" 
                    placeholder="Seyahat veya destinasyon ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        outline: 'none', 
                        fontSize: '12.5px', 
                        width: '100%', 
                        color: 'var(--text-main)' 
                    }}
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#94a3b8' }}
                        title="Temizle"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>

        {/* Modern Tour Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTours.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <PlaneTakeoff size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    Arama kriterlerine uygun seyahat bulunamadı.
                </div>
            ) : (
                filteredTours.map((tour) => {
                    const daysNights = calculateDaysAndNights(tour.dates);
                    const { expert1, expert2 } = getTourExperts(tour, allUsers, user);

                    return (
                    <div key={tour.id} style={{ 
                        background: '#ffffff', 
                        borderRadius: '16px', 
                        border: '1px solid #edf2f7', 
                        boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                        overflow: 'hidden', 
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}>
                      {/* Top Full-Bleed Cover Image with Frosted Overlapping Badges */}
                      <div style={{ height: '160px', position: 'relative', width: '100%', overflow: 'hidden', background: 'var(--primary-light)' }}>
                        <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        
                        {/* Subtle Gradient Shadow for Readability */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />

                        {/* Top Left Badge: Overlapping Circular Profile Photos */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpertModalData({ expert1, expert2 });
                          }}
                          title="Seyahat Uzmanlarını Görüntüle"
                          style={{ 
                              position: 'absolute', 
                              top: '10px', 
                              left: '10px', 
                              background: 'rgba(255, 255, 255, 0.95)', 
                              backdropFilter: 'blur(8px)', 
                              padding: '3px', 
                              borderRadius: '30px', 
                              boxShadow: '0 2px 10px rgba(0,0,0,0.15)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              cursor: 'pointer', 
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                              zIndex: 2 
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 2, background: 'var(--primary-light)' }}>
                              <img 
                                src={expert1.avatar} 
                                alt={expert1.name || "Uzman 1"} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            </div>
                            {expert2 && (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ffffff', marginLeft: '-10px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 1, background: '#eff6ff' }}>
                                <img 
                                  src={expert2.avatar} 
                                  alt={expert2.name || "Uzman 2"} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top Right Quick Actions (Edit) */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 2 }}>
                            <div 
                              onClick={() => navigate(`/dashboard/create-tour/${tour.id}`)} 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }} 
                              title="Turu Düzenle"
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                               <Edit3 size={15} color="#475569" />
                            </div>
                        </div>

                        {/* Bottom Overlay Info inside cover (if destinations available) */}
                        {(tour.destinations || tour.destination) && (
                            <div style={{ position: 'absolute', bottom: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '11.5px', fontWeight: '600', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                               <MapPin size={13} color="#ffffff" />
                               <span>{tour.destinations || tour.destination}</span>
                            </div>
                        )}
                      </div>

                      {/* Card Body Content */}
                      <div style={{ padding: '14px 16px 16px 16px' }}>
                        
                        {/* Tour Title */}
                        <h2 style={{ fontSize: '13.5px', fontWeight: '700', margin: '0 0 8px 0', padding: '0 2px', color: '#1e293b', lineHeight: '1.4', letterSpacing: '-0.2px' }}>
                            {tour.name}
                        </h2>

                        {/* Date & Duration Strip */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '12px', gap: '8px', overflow: 'hidden', flexWrap: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'clamp(10px, 2.9vw, 12px)', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                              <Calendar size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tour.dates}</span>
                          </div>
                          {daysNights && (
                              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 'clamp(9.5px, 2.7vw, 11px)', fontWeight: '700', padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  {daysNights}
                              </span>
                          )}
                        </div>

                        {/* Side-by-Side 4 Harmonic Color-Coded Square Action Boxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          <button 
                            onClick={() => navigate('/dashboard/program-edit/' + tour.id)} 
                            title="Programı Düzenle / İncele"
                            style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(71,85,105,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <Edit3 size={18} color="#475569" strokeWidth={2.2} />
                          </button>

                          <button 
                            onClick={() => navigate('/dashboard/participants/' + tour.id)} 
                            title={`Katılımcılar & Bilet Yönetimi (${tour.participants?.length || 0})`}
                            style={{ aspectRatio: '1', width: '100%', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#dbeafe'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <Users size={18} color="#2563eb" strokeWidth={2.2} />
                            {tour.participants && tour.participants.length > 0 && (
                              <span style={{ 
                                position: 'absolute', 
                                top: '-4px', 
                                right: '-4px', 
                                background: '#2563eb', 
                                color: 'white', 
                                fontSize: '10px', 
                                fontWeight: '800', 
                                padding: '1px 5px', 
                                borderRadius: '10px',
                                boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                              }}>
                                {tour.participants.length}
                              </span>
                            )}
                          </button>

                          <button 
                            onClick={() => navigate(`/dashboard/chat/${tour.id}`)} 
                            title="Gruba Sohbet"
                            style={{ aspectRatio: '1', width: '100%', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#86efac'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(22,163,74,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#dcfce7'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <MessageCircle size={18} color="#16a34a" strokeWidth={2.2} />
                          </button>

                          <button 
                            onClick={() => setBroadcastTourId(tour.id)} 
                            title="Acil Biletleme Anonsu & Bildirim"
                            style={{ aspectRatio: '1', width: '100%', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <Megaphone size={18} color="#ef4444" strokeWidth={2.2} />
                          </button>
                        </div>

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
