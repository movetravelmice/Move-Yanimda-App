import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, PlaneTakeoff, Info, Star, MessageCircle, Phone, X, UserCheck, Eye, CloudSun, Map, Utensils, Landmark, Compass, ThermometerSun, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights, getTourExperts, isTourActive, isTourPast } from '../../store/tourStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

const StarRating = ({ value, onChange, size = 16 }) => {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          onClick={() => onChange && onChange(star)}
          fill={star <= value ? 'var(--primary)' : 'none'}
          color={star <= value ? 'var(--primary)' : 'var(--text-muted)'}
          style={{ cursor: onChange ? 'pointer' : 'default', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => { if (onChange) e.currentTarget.style.transform = 'scale(1.2)' }}
          onMouseLeave={(e) => { if (onChange) e.currentTarget.style.transform = 'scale(1)' }}
        />
      ))}
    </div>
  );
};


export default function CustomerDashboard() {
  const ratingLabels = {
    program: 'Genel Olarak Program',
    acentaHizmeti: 'Acenta Yetkililerinin Hizmeti',
    ucakHizmeti: 'Uçak Yolculuğu Ve Hizmeti',
    turlar: 'Katılım Sağladığınız Turlar',
    konaklamaTemizlik: 'Konaklama Temizlik & Konforu',
    konaklamaKonum: 'Konaklama Yer & Konumu',
    restoranYemek: 'Restoran & Yemek'
  };

  const navigate = useNavigate();
  const { tours } = useTourStore();
  const user = useAuthStore(state => state.user);
  const allUsers = useUserStore(state => state.users);
  const { expertName } = useSettingsStore();
  const myTours = tours.filter(t => t.participants?.some(p => 
    p.id === user?.id || 
    (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase())
  ));
  const activeTours = myTours.filter(isTourActive);
  const pastTours = myTours.filter(isTourPast);
  const [reviewedTours, setReviewedTours] = useState(() => {
    const saved = localStorage.getItem("base44_reviews");
    return saved ? JSON.parse(saved) : {};
  });
  const [expertModalData, setExpertModalData] = useState(null);

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Katilacagim Turlar" />

      <div style={{ padding: '0 16px', marginTop: '14px' }}>
        {activeTours.length === 0 && (
           <div style={{ textAlign: 'center', padding: '24px 16px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', marginBottom: '16px' }}>
             <p className="text-muted" style={{ fontSize: '12.5px', margin: 0 }}>Şu an kayıtlı olduğunuz aktif bir tur bulunmuyor.</p>
           </div>
        )}

        {activeTours.map(tour => {
            let checkInWarning = null;
            const myParticipant = tour.participants?.find(p => p.id === user?.id || p.email === user?.email);
            const outgoingFlight = myParticipant?.flights?.find(f => f.type === 'Gidiş Uçuşu' || f.type === 'Gidis Ucusu') || myParticipant?.flights?.[0];

            if (outgoingFlight && tour.dates) {
                let flightDateObj = null;
                const startDateStr = tour.dates.split(' - ')[0].trim();
                const p = startDateStr.split(' ');
                
                if (p.length >= 2) {
                    const d = parseInt(p[0]);
                    const mStr = p[1]?.toLowerCase()
                        .replace('ı', 'i').replace('ş', 's').replace('ğ', 'g').replace('ü', 'u').replace('ö', 'o').replace('ç', 'c');
                    const monthsDict = { 'ocak': 0, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayis': 4, 'haziran': 5, 'temmuz': 6, 'agustos': 7, 'eylul': 8, 'ekim': 9, 'kasim': 10, 'aralik': 11 };
                    const m = monthsDict[mStr];
                    const y = p[2] ? parseInt(p[2]) : new Date().getFullYear();
                    
                    if (!isNaN(d) && m !== undefined) {
                        flightDateObj = new Date(y, m, d);
                    }
                }

                // Fallback to DD.MM.YYYY
                if (!flightDateObj && startDateStr.includes('.')) {
                    const parts = startDateStr.split('.');
                    if (parts.length >= 2) {
                        const y = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
                        flightDateObj = new Date(y, parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }

                if (flightDateObj) {
                    if (outgoingFlight.departureTime) {
                        const timeParts = outgoingFlight.departureTime.split(':');
                        if (timeParts.length === 2) {
                            flightDateObj.setHours(parseInt(timeParts[0]) || 0);
                            flightDateObj.setMinutes(parseInt(timeParts[1]) || 0);
                        }
                    }
                    
                    const now = new Date();
                    const diffMs = flightDateObj.getTime() - now.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    
                    if (diffHours > 0 && diffHours <= 48) {
                        checkInWarning = {
                            hoursLeft: diffHours,
                            airline: outgoingFlight.airline || 'İlgili Havayolu'
                        };
                    }
                }
            }

            const { expert1, expert2 } = getTourExperts(tour, allUsers, user);
            return (
            <div key={tour.id} style={{ position: 'relative' }}>
              {checkInWarning && (
                  <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '12px 16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}>
                          <PlaneTakeoff size={20} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Check-in Hatırlatması</h4>
                           <p style={{ margin: '4px 0 0 0', fontSize: '13px', lineHeight: '1.4', opacity: 0.9 }}>
                               Seyahatinize <strong>{checkInWarning.hoursLeft} saat</strong> kaldı. Uçuşunuza 24 saat kala ( <strong>{checkInWarning.airline.toUpperCase()}</strong> ) web sitesi veya mobil uygulaması üzerinden online check-in işleminizi gerçekleştirmenizi rica ederiz.
                           </p>
                      </div>
                  </div>
              )}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                overflow: 'hidden', 
                marginBottom: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                {/* Card Header inside active tour card */}
                <div style={{ padding: '9px 14px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    Güncel Turlarım
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--primary)', background: '#FDF2F8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #F9BED8' }}>
                    Aktif Seyahat
                  </span>
                </div>

                {/* Top Full-Bleed Cover Image */}
                <div style={{ height: '160px', position: 'relative', width: '100%', overflow: 'hidden', background: 'var(--primary-light)' }}>
                  <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Top Left Badge: Pure Overlapping Circular Profile Photos */}
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

                  {/* Destination Overlay */}
                  {tour.destinations && tour.destinations !== 'Belirtilmedi' && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '11.5px', fontWeight: '600', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                       <MapPin size={13} color="#ffffff" />
                       <span>{tour.destinations}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '14px 16px 16px 16px' }}>
                  <h2 style={{ fontSize: '13.5px', fontWeight: '700', margin: '0 0 8px 0', padding: '0 2px', color: '#1e293b', lineHeight: '1.4', letterSpacing: '-0.2px' }}>{tour.name}</h2>

                  {/* Date & Duration Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '12px', gap: '8px', overflow: 'hidden', flexWrap: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'clamp(10px, 2.9vw, 12px)', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                        <Calendar size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tour.dates}</span>
                    </div>
                    {calculateDaysAndNights(tour.dates) && (
                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 'clamp(9.5px, 2.7vw, 11px)', fontWeight: '700', padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {calculateDaysAndNights(tour.dates)}
                        </span>
                    )}
                  </div>

                  {/* Side-by-Side Harmonic Color-Coded Square Action Boxes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <button 
                      onClick={() => navigate('/dashboard/transfers/' + tour.id)}
                      title="Uçuş ve Bilet Bilgileri"
                      style={{ aspectRatio: '1', width: '100%', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#dbeafe'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <PlaneTakeoff size={21} color="#2563eb" strokeWidth={2.2} />
                    </button>

                    <button 
                      onClick={() => navigate('/dashboard/program/' + tour.id)}
                      title="Tur Programı"
                      style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(71,85,105,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Info size={21} color="#475569" strokeWidth={2.2} />
                    </button>

                    <button 
                      onClick={() => {
                        setExpertModalData({ expert1, expert2 });
                      }}
                      title="Tur Yetkilisi"
                      style={{ aspectRatio: '1', width: '100%', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#86efac'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(22,163,74,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#dcfce7'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <UserCheck size={21} color="#16a34a" strokeWidth={2.2} />
                    </button>

                    <button 
                      onClick={() => navigate('/dashboard/guide/' + tour.id)}
                      title="Şehir Rehberi"
                      style={{ aspectRatio: '1', width: '100%', background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FCE7F3'; e.currentTarget.style.borderColor = '#E54B98'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FDF2F8'; e.currentTarget.style.borderColor = '#FCE7F3'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Compass size={21} color="#D7147A" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
        );
        })}

        {/* Display Only Latest 3 Past Tours with Active Tour Card Design */}
        {pastTours.slice(0, 3).map(tour => {
            const pastDaysNights = calculateDaysAndNights(tour.dates);
            const { expert1: pastExp1, expert2: pastExp2 } = getTourExperts(tour, allUsers, user);
            return (
            <div 
              key={tour.id} 
              style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                overflow: 'hidden', 
                marginBottom: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {/* Card Header inside past tour card */}
              <div style={{ padding: '9px 14px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#64748b' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                  Geçmiş Turlarım
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  Tamamlandı
                </span>
              </div>

              {/* Top Full-Bleed Cover Image */}
              <div style={{ height: '160px', position: 'relative', width: '100%', overflow: 'hidden', background: '#f1f5f9' }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.92 }} />
                
                {/* Subtle Gradient Shadow */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />

                {/* Top Left Badge: Pure Overlapping Circular Profile Photos */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpertModalData({ expert1: pastExp1, expert2: pastExp2 });
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
                        src={pastExp1.avatar} 
                        alt={pastExp1.name || "Uzman 1"} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    {pastExp2 && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ffffff', marginLeft: '-10px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 1, background: '#eff6ff' }}>
                        <img 
                          src={pastExp2.avatar} 
                          alt={pastExp2.name || "Uzman 2"} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Right Quick Status Badge */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', color: '#ffffff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 2 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}></span>
                  Geçmiş Tur
                </div>

                {/* Destination Overlay */}
                {tour.destinations && tour.destinations !== 'Belirtilmedi' && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '11.5px', fontWeight: '600', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                       <MapPin size={13} color="#ffffff" />
                       <span>{tour.destinations}</span>
                    </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '14px 16px 16px 16px' }}>
                <h2 style={{ fontSize: '13.5px', fontWeight: '700', margin: '0 0 8px 0', padding: '0 2px', color: '#1e293b', lineHeight: '1.4', letterSpacing: '-0.2px' }}>
                    {tour.name}
                </h2>

                {/* Date & Duration Strip (Single line responsive) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '12px', gap: '8px', overflow: 'hidden', flexWrap: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'clamp(10px, 2.9vw, 12px)', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                      <Calendar size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tour.dates}</span>
                  </div>
                  {pastDaysNights && (
                      <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 'clamp(9.5px, 2.7vw, 11px)', fontWeight: '700', padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {pastDaysNights}
                      </span>
                  )}
                </div>

                {/* Side-by-Side 4 Truly Passive/Disabled Square Action Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <button 
                    disabled
                    title="Pasif"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <PlaneTakeoff size={21} color="#94a3b8" strokeWidth={2} />
                  </button>

                  <button 
                    disabled
                    title="Pasif"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <Info size={21} color="#94a3b8" strokeWidth={2} />
                  </button>

                  <button 
                    disabled
                    title="Pasif"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <UserCheck size={21} color="#94a3b8" strokeWidth={2} />
                  </button>

                  <button 
                    disabled
                    title="Pasif"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <Compass size={21} color="#94a3b8" strokeWidth={2} />
                  </button>
                </div>

                {/* Rating Banner Strip */}
                <div>
                  {!reviewedTours[tour.id] ? (
                    <div 
                      onClick={() => navigate('/dashboard/review/' + tour.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: '12px', padding: '9px 14px', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#D7147A' }}>
                        <Star size={15} color="#D7147A" fill="#D7147A" />
                        <span>Seyahati Puanlayın</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <StarRating 
                          value={0} 
                          onChange={(val) => navigate('/dashboard/review/' + tour.id + '?rating=' + val)} 
                          size={19} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => navigate('/dashboard/review/' + tour.id)} 
                      title="Değerlendirmenizi Görüntüleyin / Güncelleyin"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fdf2f8', border: '1px solid #fce7f3', borderRadius: '12px', padding: '9px 14px', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fce7f3'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fdf2f8'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#db2777' }}>
                        <Star size={15} color="#db2777" fill="#db2777" />
                        <span>Puanınız: {Number(reviewedTours[tour.id]).toFixed(1)} / 5</span>
                      </div>
                      <StarRating value={reviewedTours[tour.id]} size={16} />
                    </div>
                  )}
                </div>

              </div>
            </div>
            );
        })}

        {/* View All Past Tours Button if more than 3 */}
        {pastTours.length > 3 && (
          <button 
            onClick={() => navigate('/dashboard/past-tours')}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#ffffff', 
              border: '1px dashed #cbd5e1', 
              borderRadius: '14px', 
              color: 'var(--primary)', 
              fontSize: '12.5px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              marginTop: '4px',
              marginBottom: '16px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#ffffff'; }}
          >
            Tüm Geçmiş Turları Görüntüle ({pastTours.length} Tur) <ChevronRight size={15} />
          </button>
        )}

      </div>

      {expertModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px', animation: 'fadeIn 0.2s ease-out', textAlign: 'center', position: 'relative' }}>
            <div onClick={() => setExpertModalData(null)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>
                {expertModalData.expert2 ? 'Seyahat Uzmanlarımız' : 'Seyahat Uzmanı'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[expertModalData.expert1, expertModalData.expert2].filter(Boolean).map((exp, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-light)', flexShrink: 0 }}>
                               <img loading="lazy" src={exp.avatar} alt={exp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px', color: 'var(--text-main)' }}>{exp.name}</h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{idx === 0 ? 'Ana Seyahat Uzmanı' : '2. Seyahat Uzmanı'}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                           <a href={`tel:${exp.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-main)', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}>
                              <Phone size={14} className="text-primary" /> Ara
                           </a>
                           <a href={`https://wa.me/${exp.phone.replace(/[^0-9]/g, '')}?text=Merhaba%20${exp.name.split(' ')[0]},%20turum%20hakk%C4%B1nda%20deste%C4%9Finize%20ihtiyac%C4%B1m%20var.`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: '#25D366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }}>
                              <MessageCircle size={14} color="#fff" /> WhatsApp
                           </a>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

    
      

</div>
  );
}

