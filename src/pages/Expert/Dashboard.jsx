import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Edit3, Eye, MessageCircle, Users, Megaphone, X, Send, Plus, Trash2, Timer, RotateCcw, Phone, ChevronRight, Info, CheckCircle2 } from 'lucide-react';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights, getTourExperts, isTourActive, isTourPast } from '../../store/tourStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import ExpertRollCallPanel from '../../components/ExpertRollCallPanel';

export default function ExpertDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { users: allUsers } = useUserStore();
  const { tours, editTour, startRollCall, endRollCall, setTourStatus } = useTourStore();
  const { addNotification } = useNotificationStore();
  const myTours = tours.filter(t => 
      (t.guideName === user?.name) || 
      (t.expert?.name === user?.name) || 
      (t.expert?.email === user?.email) || 
      (t.expert2?.name === user?.name) || 
      (t.expert2?.email === user?.email)
  );
  const activeTours = myTours.filter(isTourActive);
  const pastTours = myTours.filter(isTourPast);

  const [dynamicTitle, setDynamicTitle] = useState("Konum alınıyor...");
  const clockRef = useRef(null);

  const [broadcastTourId, setBroadcastTourId] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });
  const [expertModalData, setExpertModalData] = useState(null);

  const [promptTourId, setPromptTourId] = useState(null);
  const [rollCallDuration, setRollCallDuration] = useState(3);
  const [activeRollCallTourId, setActiveRollCallTourId] = useState(null);
  const [missingListModal, setMissingListModal] = useState({ show: false, tourId: null, missing: [] });

  const handleStartRollCallPrompt = (tourId) => {
      const tour = tours.find(t => t.id === tourId);
      if (tour?.rollCall?.active && tour.rollCall.endTime > Date.now()) {
          setActiveRollCallTourId(tourId);
          return;
      }
      setPromptTourId(tourId);
      setRollCallDuration(3);
  };

  const confirmStartRollCall = () => {
      if (promptTourId && rollCallDuration > 0) {
          const tId = promptTourId;
          startRollCall(tId, rollCallDuration);
          setPromptTourId(null);
          setActiveRollCallTourId(tId);
      }
  };

  const handleAllPresent = (tourId) => {
      endRollCall(tourId);
      setPopupMsg({ show: true, type: 'success', title: 'Eksiksiz!', text: 'Yoklama eksiksiz tamamlandı! Bütün yolcularınız araçta.' });
  };

  const handleTimeUpMissing = (tourId, missing) => {
      endRollCall(tourId);
      setMissingListModal({ show: true, tourId, missing });
  };

  const handleBroadcastSubmit = () => {
      if (!broadcastMsg.trim() || !broadcastTourId) return;

      const activeTour = tours.find(t => t.id === broadcastTourId);

      addNotification({
          type: 'expert_alert',
          title: ` ${activeTour?.name} Anonsu`,
          message: broadcastMsg,
          tourId: broadcastTourId,
          senderName: user?.name || 'Tur Uzmanı'
      });

      setBroadcastTourId(null);
      setBroadcastMsg("");
      setPopupMsg({ show: true, type: 'success', title: 'Muazzam!', text: 'Bildiriminiz başarıyla tüm katılımcılara fırlatıldı!' });
  };

  useEffect(() => {
    const startClock = (countryName) => {
        const tick = () => {
             const options = { hour: '2-digit', minute: '2-digit' };
             const trTime = new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', ...options });
             const localTime = new Date().toLocaleTimeString('tr-TR', options);
             
             if (countryName.toLowerCase() === 'Türkiye' || countryName.toLowerCase() === 'turkey') {
                 setDynamicTitle(` Türkiye Saati: ${trTime}`);
             } else {
                 setDynamicTitle(` TR: ${trTime} |  ${countryName}: ${localTime}`);
             }
        };
        tick();
        if (clockRef.current) clearInterval(clockRef.current);
        clockRef.current = setInterval(tick, 15000); 
    };

    const fetchCountry = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=tr`);
            const data = await res.json();
            const country = data.address?.country || 'Yerel';
            startClock(country);
        } catch(e) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
            const city = tz.split('/')[1]?.replace('_', ' ') || "Yerel";
            startClock(city);
        }
    };

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchCountry(pos.coords.latitude, pos.coords.longitude),
            (err) => {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
                const city = tz.split('/')[1]?.replace('_', ' ') || "Yerel";
                startClock(city);
            }
        );
    } else {
        startClock("Yerel");
    }

    return () => {
        if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  return (
    <div style={{ paddingBottom: '90px', position: 'relative' }}>
      
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

      <Header title={dynamicTitle} />
      
      <div style={{ padding: '0 16px', paddingBottom: '32px' }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', marginTop: '8px', marginBottom: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', margin: '0', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>Atandığım Aktif Turlar</h2>
            <button onClick={() => navigate('/dashboard/create-tour')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(215, 20, 122, 0.25)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Plus size={14} strokeWidth={3} /> Yeni Tur Ekle
            </button>
        </div>
        
        {activeTours.length === 0 && (
           <p className="text-muted" style={{ fontSize: '13px', padding: '8px 4px' }}>Şu an atandığınız aktif bir tur bulunmuyor.</p>
        )}

        {activeTours.map(tour => {
            const daysNights = calculateDaysAndNights(tour.dates);
            const { expert1, expert2 } = getTourExperts(tour, allUsers, user);
            return (
            <div key={tour.id} style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1px solid #edf2f7', 
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                overflow: 'hidden', 
                marginBottom: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              {/* Top Full-Bleed Cover Image with Frosted Action Bar */}
              <div style={{ height: '160px', position: 'relative', width: '100%', overflow: 'hidden', background: 'var(--primary-light)' }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Subtle Gradient Shadow for Readability */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />

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
                {tour.destinations && tour.destinations !== 'Belirtilmedi' && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '11.5px', fontWeight: '600', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                       <MapPin size={13} color="#ffffff" />
                       <span>{tour.destinations}</span>
                    </div>
                )}
              </div>

              {/* Card Body Content */}
              <div style={{ padding: '14px 16px 16px 16px' }}>
                
                {/* Tour Title */}
                <h2 style={{ fontSize: '13.5px', fontWeight: '700', margin: '0 0 8px 0', padding: '0 2px', color: '#1e293b', lineHeight: '1.4', letterSpacing: '-0.2px' }}>
                    {tour.name}
                </h2>

                {/* Active Live Sayım Indicator Banner */}
                {tour.rollCall?.active && tour.rollCall.endTime > Date.now() && (
                    <div 
                      onClick={() => setActiveRollCallTourId(tour.id)} 
                      style={{ 
                          background: 'linear-gradient(135deg, #FDF2F8, #fef2f2)', 
                          border: '1px solid #F9BED8', 
                          borderRadius: '12px', 
                          padding: '9px 12px', 
                          marginBottom: '10px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(215, 20, 122, 0.08)',
                          transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D7147A', boxShadow: '0 0 0 3px rgba(215, 20, 122, 0.2)' }} />
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#8E0C51', lineHeight: 1.2 }}>Canlı Sayım Sürüyor</div>
                                <div style={{ fontSize: '10.5px', color: '#B01064' }}>
                                    {tour.rollCall.attendees?.length || 0} / {tour.participants?.length || 0} Kişi Onayladı
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#D7147A', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                            <Timer size={13} /> Sayıma Git
                        </div>
                    </div>
                )}

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

                {/* Side-by-Side 5 Harmonic Color-Coded Square Action Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <button 
                    onClick={() => navigate('/dashboard/program-edit/' + tour.id)} 
                    title="Programı Düzenle"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(71,85,105,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Edit3 size={19} color="#475569" strokeWidth={2.2} />
                  </button>

                  <button 
                    onClick={() => navigate('/dashboard/participants/' + tour.id)} 
                    title={`Katılımcılar (${tour.participants?.length || 0})`}
                    style={{ aspectRatio: '1', width: '100%', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#dbeafe'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Users size={19} color="#2563eb" strokeWidth={2.2} />
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
                    <MessageCircle size={19} color="#16a34a" strokeWidth={2.2} />
                  </button>

                  <button 
                    onClick={() => setBroadcastTourId(tour.id)} 
                    title="Acil Anons & Bildirim"
                    style={{ aspectRatio: '1', width: '100%', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Megaphone size={19} color="#ef4444" strokeWidth={2.2} />
                  </button>

                  <button 
                    onClick={() => handleStartRollCallPrompt(tour.id)} 
                    title="Yoklama / Sayım Başlat"
                    style={{ aspectRatio: '1', width: '100%', background: '#FDF2F8', border: '1px solid #FCE7F3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FCE7F3'; e.currentTarget.style.borderColor = '#E54B98'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FDF2F8'; e.currentTarget.style.borderColor = '#FCE7F3'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Timer size={19} color="#D7147A" strokeWidth={2.2} />
                  </button>
                </div>

              </div>
            </div>
            );
        })}

        {/* Past Tours Header Card */}
        <div className="card" style={{ padding: '10px 14px', marginTop: '20px', marginBottom: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', margin: '0', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
              Geçmiş Turlarım {pastTours.length > 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>({pastTours.length})</span>}
            </h2>
            {pastTours.length > 3 && (
              <button 
                onClick={() => navigate('/dashboard/past-tours')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}
              >
                Tümünü Gör ({pastTours.length}) <ChevronRight size={14} />
              </button>
            )}
        </div>
        
        {pastTours.length === 0 && (
           <p className="text-muted" style={{ fontSize: '13px', padding: '0 4px' }}>Henüz geçmiş bir turunuz bulunmuyor.</p>
        )}

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

                {/* Side-by-Side 5 Action Boxes (Only Eye Active, others Passive) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {/* 1. Analizler (AKTİF) */}
                  <button 
                    onClick={() => navigate('/dashboard/past-tour/' + tour.id)}
                    title="Analizler & Puanlar"
                    style={{ aspectRatio: '1', width: '100%', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#dbeafe'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Eye size={19} color="#2563eb" strokeWidth={2.2} />
                  </button>

                  {/* 2. Katılımcılar (PASİF) */}
                  <button 
                    disabled
                    title="Katılımcılar (Pasif)"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none', position: 'relative' }}
                  >
                    <Users size={19} color="#94a3b8" strokeWidth={2} />
                    {tour.participants && tour.participants.length > 0 && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '-4px', 
                        right: '-4px', 
                        background: '#cbd5e1', 
                        color: '#475569', 
                        fontSize: '10px', 
                        fontWeight: '800', 
                        padding: '1px 5px', 
                        borderRadius: '10px'
                      }}>
                        {tour.participants.length}
                      </span>
                    )}
                  </button>

                  {/* 3. Tur Programı (PASİF) */}
                  <button 
                    disabled
                    title="Tur Programı (Pasif)"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <Info size={19} color="#94a3b8" strokeWidth={2} />
                  </button>

                  {/* 4. Sohbet Geçmişi (PASİF) */}
                  <button 
                    disabled
                    title="Sohbet (Pasif)"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <MessageCircle size={19} color="#94a3b8" strokeWidth={2} />
                  </button>

                  {/* 5. Sayım / Yoklama (PASİF - Tekrar Aktif Etme Yok) */}
                  <button 
                    disabled
                    title="Sayım (Pasif)"
                    style={{ aspectRatio: '1', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.55, pointerEvents: 'none', outline: 'none' }}
                  >
                    <Timer size={19} color="#94a3b8" strokeWidth={2} />
                  </button>
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

      {broadcastTourId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', animation: 'fadeIn 0.2s ease-out', position: 'relative' }}>
            <div onClick={() => setBroadcastTourId(null)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#d97706' }}>
                <Megaphone size={24} />
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Acil Anons & Bildirim</h2>
            </div>
            
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '24px', lineHeight: '1.4' }}>
              Göndereceğiniz mesaj, bu seyahatte bulunan tüm müşterilerin cihazlarına anında bildirim olarak düşecektir. Sadece acil güncellemeler ve hatırlatmalar için kullanınız.
            </p>

            <textarea
              placeholder="Örn: Değerli misafirlerimiz, otobüsümüz 15 dk içinde hareket edecektir. Lütfen lobide toplanınız."
              className="input-field"
              style={{ width: '100%', minHeight: '120px', padding: '12px', fontSize: '14px', resize: 'none', marginBottom: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              autoFocus
            />

            <button 
              className="btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', padding: '14px' }} 
              onClick={handleBroadcastSubmit}
              disabled={!broadcastMsg.trim()}
            >
              <Send size={18} /> Tüm Katılımcılara Fırlat
            </button>
          </div>
        </div>
      )}

      {promptTourId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '330px', padding: '20px 18px', animation: 'scaleUp 0.2s ease-out', position: 'relative', borderRadius: '20px' }}>
                <div onClick={() => setPromptTourId(null)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={18} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Timer size={18} />
                    </div>
                    <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>Sayım & Yoklama</h2>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                    Yoklama süresini belirleyin. Katılımcıların cihazlarına buradayım bildirimi gönderilecektir:
                </p>

                {/* Quick Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                    {[1, 2, 3, 5].map(mins => (
                        <button
                            key={mins}
                            type="button"
                            onClick={() => setRollCallDuration(mins)}
                            style={{
                                padding: '8px 4px',
                                borderRadius: '8px',
                                border: rollCallDuration === mins ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                                background: rollCallDuration === mins ? 'var(--primary-light)' : '#f8fafc',
                                color: rollCallDuration === mins ? 'var(--primary)' : 'var(--text-main)',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            {mins} Dk
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Özel Süre (Dk):</span>
                    <input 
                        type="number" 
                        value={rollCallDuration} 
                        onChange={e => setRollCallDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', textAlign: 'center', outline: 'none', background: '#f8fafc' }}
                        min="1" max="60"
                    />
                </div>

                <button 
                    onClick={confirmStartRollCall} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                     <Timer size={15} /> Sayımı Başlat
                </button>
            </div>
        </div>
      )}

      {missingListModal.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
              <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '4px solid #fecaca', margin: '0 auto 16px' }}>
                      <Users size={28} color="#ef4444" />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>Eksik Katılımcılar</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '20px' }}>Yoklama süresi bitti. Aşağıdaki katılımcılar henüz onay vermedi:</p>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {missingListModal.missing.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <img src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}`} alt={m.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                              <span style={{ fontSize: '14px', fontWeight: '600' }}>{m.name}</span>
                          </div>
                      ))}
                      {missingListModal.missing.length === 0 && (
                           <div style={{ fontSize: '13px', textAlign: 'center', color: 'var(--text-muted)' }}>Bulunamadı.</div>
                      )}
                  </div>
                  
                  <button className="btn-primary" onClick={() => setMissingListModal({ show: false, tourId: null, missing: [] })} style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
                      Anladım
                  </button>
              </div>
          </div>
      )}

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
                                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px 0', color: 'var(--text-main)' }}>{exp.name}</h3>
                                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>{idx === 0 ? '1. Seyahat Uzmanı' : '2. Seyahat Uzmanı'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                            <a 
                              href={`tel:${exp.phone}`}
                              style={{ flex: 1, padding: '10px 0', borderRadius: '10px', background: '#ffffff', border: '1px solid #cbd5e1', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                            >
                                <Phone size={15} color="var(--primary)" /> Ara
                            </a>
                            <a 
                              href={`https://wa.me/${exp.phone.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ flex: 1, padding: '10px 0', borderRadius: '10px', background: '#25D366', color: 'white', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(37,211,102,0.3)' }}
                            >
                                <MessageCircle size={15} color="white" /> WhatsApp
                            </a>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Fullscreen Live Roll Call Overlay */}
      {activeRollCallTourId && (
        <ExpertRollCallPanel 
          tour={tours.find(t => t.id === activeRollCallTourId)} 
          onClose={() => setActiveRollCallTourId(null)} 
          onAllPresent={(tId) => handleAllPresent(tId)} 
          onTimeUpMissing={(tId, missing) => handleTimeUpMissing(tId, missing)} 
        />
      )}

    </div>
  );
}
