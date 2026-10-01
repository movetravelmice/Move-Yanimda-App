import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Download, Eye, Bus, CalendarClock, MapPin, CheckCircle2, AlertCircle, PlaneTakeoff, Sparkles } from 'lucide-react';
import { useTourStore, isTourActive } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

export default function Transfers() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { tours } = useTourStore();
  const { user } = useAuthStore();
  const users = useUserStore(state => state.users);

  const myTours = tours.filter(t => t.participants?.some(p => p.id === user?.id || (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase())));
  const activeTour = tourId ? myTours.find(t => t.id === tourId) : (myTours.find(isTourActive) || myTours[0]);
  
  // Find primary user and their linked family members
  const myParticipant = activeTour?.participants?.find(p => p.id === user?.id || (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
  const familyParticipants = activeTour?.participants?.filter(p => p.linkedTo && (Array.isArray(p.linkedTo) ? (p.linkedTo.includes(user?.id) || p.linkedTo.includes(myParticipant?.id)) : (p.linkedTo === user?.id || p.linkedTo === myParticipant?.id))) || [];
  
  const allRelatedParticipants = myParticipant ? [myParticipant, ...familyParticipants] : [...familyParticipants];

  const getPassengerAvatar = (p) => {
      // 1. Current logged in user
      if (user && (p.id === user.id || (p.email && user.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()))) {
          if (user.avatar && !user.avatar.includes('ui-avatars.com')) {
              return user.avatar;
          }
      }
      // 2. Search in all users
      const matched = users?.find(u => 
          (p.id && u.id === p.id) ||
          (p.email && u.email && u.email.trim().toLowerCase() === p.email.trim().toLowerCase()) ||
          (p.name && u.name && u.name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      if (matched?.avatar && !matched.avatar.includes('ui-avatars.com')) {
          return matched.avatar;
      }
      // 3. Tour participant avatar
      if (p.avatar && !p.avatar.includes('ui-avatars.com')) {
          return p.avatar;
      }
      if (matched?.avatar) return matched.avatar;
      if (user?.avatar && (p.id === user?.id || p.email === user?.email)) return user.avatar;
      if (p.avatar) return p.avatar;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'M')}&background=D7147A&color=fff&bold=true`;
  };

  const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Combine transfers with passenger names
  let combinedTransfers = [];
  allRelatedParticipants.forEach(p => {
      const pTransfers = (p.transfers || []).map(t => ({ ...t, passengerName: p.name, isFamily: p.id !== myParticipant?.id }));
      combinedTransfers = [...combinedTransfers, ...pTransfers];
  });

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ 
        padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 20px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        gap: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        background: 'var(--primary)', 
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div 
          style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} 
          onClick={() => navigate(-1)}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <ChevronLeft size={20} color="#fff" />
        </div>
        <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>Uçuş ve Transfer Biletlerim</h2>
          <div style={{ fontSize: '11px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeTour?.name || 'Seyahat Operasyonu'}</div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '20px' }}>
        
        {allRelatedParticipants.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <PlaneTakeoff size={44} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px', color: 'var(--text-main)' }}>
                {user?.role !== 'customer' ? 'Müşteri Bilet Ekranı' : 'Kayıtlı Seyahat Bulunamadı'}
              </h4>
              <p style={{ fontSize: '12.5px', margin: 0, lineHeight: 1.5, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                {user?.role !== 'customer' 
                  ? 'Bu sayfa müşterilerin kişisel bilet ve transfer cüzdanıdır. Operasyonel biletleme ve katılımcı yönetimi için Katılımcılar listesini kullanabilirsiniz.' 
                  : 'Aktif bir tur kaydınız bulunmuyor.'}
              </p>
              {user?.role !== 'customer' && (
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="btn-primary" 
                  style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Ana Panele Dön
                </button>
              )}
           </div>
        ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {allRelatedParticipants.map((p) => {
                 const tickets = Array.isArray(p.ticketFiles) && p.ticketFiles.length > 0
                     ? p.ticketFiles
                     : (p.ticketPdf ? [p.ticketPdf] : []);
                 const hasTickets = tickets.length > 0;
                 const isFamily = p.id !== myParticipant?.id;

                 return (
                    <div 
                      key={p.id}
                      className="card"
                      style={{ 
                        padding: '16px', 
                        borderRadius: '16px', 
                        background: 'white', 
                        border: '1.5px solid #e2e8f0', 
                        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}
                    >
                        {/* Header inside the card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                                <FileText size={16} className="text-primary" /> Havayolu E-Biletleri
                            </div>
                            {hasTickets ? (
                                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={13} /> {tickets.length > 1 ? `${tickets.length} Bilet Hazır` : 'Bilet Hazır'}
                                </span>
                            ) : (
                                <span style={{ background: '#fffbeb', color: '#b45309', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertCircle size={13} /> Bilet Bekleniyor
                                </span>
                            )}
                        </div>

                        {/* Passenger row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                              src={getPassengerAvatar(p)} 
                              alt={p.name} 
                              style={{ width: '38px', height: '38px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                            />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{p.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isFamily ? '🎈 Bağlı Profil / Çocuk' : 'Ana Yolcu'}</div>
                            </div>
                        </div>

                        {/* PDF Info & Download Box */}
                        {hasTickets ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {tickets.map((t, tIdx) => {
                                    const ticketUrl = typeof t === 'string' ? t : t?.url;
                                    const ticketName = typeof t === 'object' ? (t.name || `Ucus_Bileti_${tIdx + 1}.pdf`) : `Ucus_Bileti_${tIdx + 1}.pdf`;
                                    const ticketSize = typeof t === 'object' ? t.size : null;

                                    return (
                                        <div key={t.id || tIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ticketName}>
                                                        {ticketName}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <span>{ticketSize ? formatFileSize(ticketSize) : 'PDF Belgesi'}</span>
                                                        {tickets.length > 1 && (
                                                            <>
                                                                <span>•</span>
                                                                <span style={{ fontWeight: '700', color: tIdx === 0 ? '#059669' : '#2563eb' }}>
                                                                    {tIdx === 0 ? 'Ana Bilet' : `Bilet #${tIdx + 1}`}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <a 
                                              href={ticketUrl} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              download={ticketName}
                                              style={{ 
                                                  width: '100%', 
                                                  padding: '10px 12px', 
                                                  borderRadius: '9px', 
                                                  background: 'linear-gradient(135deg, var(--primary) 0%, #D7147A 100%)', 
                                                  color: 'white', 
                                                  border: 'none', 
                                                  fontSize: '12.5px', 
                                                  fontWeight: '700', 
                                                  textDecoration: 'none', 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  justifyContent: 'center', 
                                                  gap: '7px',
                                                  boxShadow: '0 3px 8px rgba(255, 107, 0, 0.22)',
                                                  boxSizing: 'border-box'
                                              }}
                                            >
                                                <Eye size={15} /> Bileti Görüntüle / İndir (PDF)
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px', fontSize: '12px', color: '#92400e', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                                <span>Havayolu biletiniz seyahat operasyon ekibimiz tarafından düzenlendiğinde PDF belgesi buraya yüklenecektir.</span>
                            </div>
                        )}
                    </div>
                 );
              })}
           </div>
        )}

        {/* Transfer Section */}
        {combinedTransfers.length > 0 && (
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '24px', marginBottom: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={18} className="text-primary" /> Atanan Transferler
            </h3>
        )}

        {combinedTransfers.map((trans, index) => (
            <div key={index} className="card" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', borderRadius: '16px', padding: '16px', marginBottom: '14px', border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ backgroundColor: '#FDF2F8', color: 'var(--primary)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
                    <Bus size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>{trans.type}</div>
                        <div style={{ background: trans.isFamily ? '#fffbeb' : '#f8fafc', color: trans.isFamily ? '#d97706' : '#475569', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', border: `1px solid ${trans.isFamily ? '#fde68a' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👤 {trans.passengerName}
                        </div>
                    </div>
                    
                    {trans.date && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarClock size={14} color="var(--primary)" /> 
                        <span>{trans.date}</span>
                      </div>
                    )}
                    
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--primary)" /> 
                      <span>{trans.desc}</span>
                    </div>
                    
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Araç & Plaka:</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{trans.vehicle}</strong>
                        <strong style={{ color: 'var(--primary)', background: '#FDF2F8', padding: '2px 6px', borderRadius: '4px', border: '1px solid #F9BED8' }}>{trans.plate}</strong>
                      </div>
                    </div>
                </div>
            </div>
        ))}
        
      </div>
    </div>
  );
}
