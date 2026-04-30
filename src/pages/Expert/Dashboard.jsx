import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Edit3, Eye, MessageCircle, Users, Megaphone, X, Send, Plus, CheckCircle2, Trash2, Timer } from 'lucide-react';
import Header from '../../components/Header';
import { useTourStore } from '../../store/tourStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import ExpertRollCallPanel from '../../components/ExpertRollCallPanel';

export default function ExpertDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tours, editTour, startRollCall, endRollCall } = useTourStore();
  const { addNotification } = useNotificationStore();
  const myTours = tours.filter(t => (t.guideName === user?.name) || (t.expert?.name === user?.name));
  const activeTours = myTours.filter(t => t.status === 'active');
  const pastTours = myTours.filter(t => t.status === 'past');

  const [dynamicTitle, setDynamicTitle] = useState("Konum alınıyor...");
  const clockRef = useRef(null);

  const [broadcastTourId, setBroadcastTourId] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });

  const [promptTourId, setPromptTourId] = useState(null);
  const [rollCallDuration, setRollCallDuration] = useState(3);
  const [missingListModal, setMissingListModal] = useState({ show: false, tourId: null, missing: [] });

  const handleStartRollCallPrompt = (tourId) => {
      setPromptTourId(tourId);
      setRollCallDuration(3);
  };

  const confirmStartRollCall = () => {
      if (promptTourId && rollCallDuration > 0) {
          startRollCall(promptTourId, rollCallDuration);
          setPromptTourId(null);
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
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>Atandığım Aktif Turlar</h2>
            <button onClick={() => navigate('/dashboard/create-tour')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Plus size={16} strokeWidth={3} /> Yeni Tur Ekle
            </button>
        </div>
        
        {activeTours.length === 0 && (
           <p className="text-muted" style={{ fontSize: '13px' }}>Şu an atandığınız aktif bir tur bulunmuyor.</p>
        )}

        {activeTours.map(tour => (
            <div key={tour.id} className="card" style={{ marginBottom: '24px' }}>
              <div style={{ height: '140px', background: 'var(--primary-light)', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden', position: 'relative' }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                   UZMANI BENİM
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{tour.name}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div onClick={() => handleStartRollCallPrompt(tour.id)} style={{ cursor: 'pointer', background: '#fdf2f8', padding: '6px', borderRadius: '6px' }} title="Sayım Başlat">
                       <Timer size={16} className="text-primary" />
                    </div>
                    <div onClick={() => navigate(`/dashboard/create-tour/${tour.id}`)} style={{ cursor: 'pointer', background: '#f1f5f9', padding: '6px', borderRadius: '6px' }} title="Turu Düzenle">
                       <Edit3 size={16} className="text-primary" />
                    </div>
                </div>
              </div>

              {tour.rollCall?.active && tour.rollCall.endTime > Date.now() && (
                  <ExpertRollCallPanel tour={tour} onAllPresent={handleAllPresent} onTimeUpMissing={handleTimeUpMissing} />
              )}

              <div className="flex-row text-muted" style={{ marginBottom: '6px', fontSize: '14px' }}>
                <MapPin size={16} /> {tour.destinations}
              </div>
              <div className="flex-row text-muted" style={{ marginBottom: '16px', fontSize: '14px' }}>
                <Calendar size={16} /> {tour.dates}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div onClick={() => navigate('/dashboard/program-edit/' + tour.id)} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <Edit3 size={16} className="text-primary" />
                  <span style={{fontWeight: '600', color: 'var(--text-main)'}}>Programı Düzenle</span>
                </div>
                <div onClick={() => navigate('/dashboard/participants/' + tour.id)} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <Users size={16} className="text-primary" />
                  <span style={{fontWeight: '600', color: 'var(--text-main)'}}>Katılımcılar ({tour.participants?.length || 0})</span>
                </div>
                <div onClick={() => navigate(`/dashboard/chat/${tour.id}`)} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <MessageCircle size={16} className="text-primary" />
                  <span style={{fontWeight: '600', color: 'var(--text-main)'}}>Gruba Sohbet</span>
                </div>
                <div onClick={() => setBroadcastTourId(tour.id)} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <Megaphone size={16} style={{ color: '#d97706' }} />
                  <span style={{fontWeight: '600', color: '#d97706'}}>Acil Anons</span>
                </div>
              </div>
            </div>
        ))}

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>Geçmiş Turlarım</h2>
        
        {pastTours.length === 0 && (
           <p className="text-muted" style={{ fontSize: '13px' }}>Henüz geçmiş bir turunuz bulunmuyor.</p>
        )}

        {pastTours.map(tour => (
            <div key={tour.id} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', opacity: 0.9 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{tour.name}</h3>
                <p className="text-muted" style={{ fontSize: '12px', marginBottom: '10px' }}>{tour.dates}</p>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => navigate('/dashboard/past-tour/' + tour.id)} style={{ padding: '6px 0', fontSize: '12px', flex: 1, border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--text-main)', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                        <Eye size={14} /> Analizleri Görüntüle
                    </button>
                </div>
              </div>
            </div>
        ))}

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
            <div className="card" style={{ width: '100%', maxWidth: '320px', padding: '24px', animation: 'scaleUp 0.2s ease-out', position: 'relative' }}>
                <div onClick={() => setPromptTourId(null)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={20} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--primary)' }}>
                    <Timer size={24} />
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Sayım Süresi</h2>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Yoklama için kaç dakika süre vermek istiyorsunuz?</p>
                <input 
                    type="number" 
                    value={rollCallDuration} 
                    onChange={e => setRollCallDuration(parseInt(e.target.value) || 0)}
                    className="input-field"
                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box', marginBottom: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px', textAlign: 'center' }}
                    min="1" max="60"
                />
                <button onClick={confirmStartRollCall} className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
                     Başlat
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

    </div>
  );
}
