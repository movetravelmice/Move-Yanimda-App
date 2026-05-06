import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, PlaneTakeoff, Info, Star, MessageCircle, Phone, X, UserCheck, Eye, CloudSun, Map, Utensils, Landmark, Compass, ThermometerSun } from 'lucide-react';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights } from '../../store/tourStore';
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

  const navigate = useNavigate();
  const { tours } = useTourStore();
  const user = useAuthStore(state => state.user);
  const { expertName } = useSettingsStore();
  const dynExpertUser = useUserStore(state => state.users.find(u => u.name === expertName));
  const myTours = tours.filter(t => t.participants?.some(p => p.id === user?.id || p.email === user?.email)); const activeTours = myTours.filter(t => t.status === 'active');
  const pastTours = myTours.filter(t => t.status === 'past');
  const [ratingTourId, setRatingTourId] = useState(null);
  const [generalRating, setGeneralRating] = useState(0);
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  const [reviewedTours, setReviewedTours] = useState(() => {
    const saved = localStorage.getItem('base44_reviews');
    return saved ? JSON.parse(saved) : {};
  });
  const [alreadyReviewedTourId, setAlreadyReviewedTourId] = useState(null);
  
  const [expertModalData, setExpertModalData] = useState(null);

  const [detailedRatings, setDetailedRatings] = useState({
    ulasim: 0,
    konaklama: 0,
    yemek: 0,
    rehber: 0
  });
  const [reviewMsg, setReviewMsg] = useState('');

  const handleGeneralRating = (val) => {
    setGeneralRating(val);
    setDetailedRatings({
      ulasim: 0,
      konaklama: 0,
      yemek: 0,
      rehber: 0
    });
    setReviewMsg('');
    setShowDetailedModal(true);
  };

  const submitReview = () => {
    setShowDetailedModal(false);
    let vals = Object.values(detailedRatings);
    let avgScore = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    let finalScore = avgScore > 0 ? avgScore : generalRating;
    const newReviews = { ...reviewedTours, [ratingTourId]: finalScore };
    setReviewedTours(newReviews);
    localStorage.setItem("base44_reviews", JSON.stringify(newReviews));
    useTourStore.getState().addParticipantFeedback(ratingTourId, user?.id || "cust_1", { rating: finalScore, comment: reviewMsg || finalScore.toFixed(1) + " Yildizli degerlendirme" });
    setRatingTourId(null);
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Katilacagim Turlar" />

      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '12px' }}>Güncel Turlarım</h2>
        
        {activeTours.length === 0 && (
           <p className="text-muted" style={{ fontSize: '13px', marginBottom: '24px' }}>Şu an kayıtlı olduğunuz aktif bir tur bulunmuyor.</p>
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
                              Seyahatinize <strong>{checkInWarning.hoursLeft} saat</strong> kaldı. Lütfen <strong>{checkInWarning.airline.toUpperCase()}</strong> web sayfasını ziyaret ederek check-in işleminizi tamamlayınız.
                          </p>
                      </div>
                  </div>
              )}
              <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ height: '140px', background: 'var(--primary-light)', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{tour.name}</h2>

              <div className="flex-row text-muted" style={{ marginBottom: '6px', fontSize: '14px' }}>
                <MapPin size={16} /> {tour.destinations}
              </div>
              <div className="flex-row text-muted" style={{ marginBottom: '16px', fontSize: '14px', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} /> {tour.dates}
                </div>
                {calculateDaysAndNights(tour.dates) && (
                    <div style={{ background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {calculateDaysAndNights(tour.dates)}
                    </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div 
                  onClick={() => navigate('/dashboard/transfers/' + tour.id)}
                  style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <PlaneTakeoff size={16} className="text-primary" />
                  <span style={{fontWeight: '600'}}>Uçuş & Transfer</span>
                </div>
                <div 
                  onClick={() => navigate('/dashboard/program/' + tour.id)}
                  style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <Info size={16} className="text-primary" />
                  <span style={{fontWeight: '600'}}>Tur Programı</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div 
                  onClick={() => setExpertModalData(tour.expert || { name: tour.guideName || expertName })}
                  style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <UserCheck size={16} className="text-primary" />
                  <span style={{fontWeight: '600'}}>Tur Yetkilisi</span>
                </div>
                
                <div 
                  onClick={() => navigate('/dashboard/guide/' + tour.id)}
                  style={{ background: '#e0e7ff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <Compass size={16} className="text-primary" />
                  <span style={{fontWeight: '600', color: 'var(--primary)'}}>Şehir Rehberi</span>
                </div>
              </div>
            </div>
            </div>
        );
        })}

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>Geçmiş Turlarım</h2>

        {pastTours.map(tour => (
            <div key={tour.id} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{tour.name}</h3>
                <p className="text-muted" style={{ fontSize: '12px', marginBottom: '10px' }}>{tour.dates}</p>
                
                <div style={{ display: 'flex', gap: '8px', transition: 'all 0.3s' }}>
                  {!reviewedTours[tour.id] ? (
                    ratingTourId !== tour.id ? (
                      <button onClick={() => { setRatingTourId(tour.id); setGeneralRating(0); }} style={{ padding: '6px 0', fontSize: '12px', flex: 1, border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Seyahati Puanla</button>
                    ) : (
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f6', borderRadius: '8px', padding: '6px 0' }}>
                        <StarRating value={generalRating} onChange={handleGeneralRating} size={22} />
                      </div>
                    )
                  ) : (
                    <div 
                      onClick={() => setAlreadyReviewedTourId(tour.id)} 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f6', borderRadius: '8px', padding: '6px 0', cursor: 'pointer' }}>
                      <StarRating value={reviewedTours[tour.id]} size={15} />
                    </div>
                  )}
                </div>
              </div>
            </div>
        ))}

      </div>

      {showDetailedModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', animation: 'fadeIn 0.2s ease-out' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Detaylı Değerlendirme</h2>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.4' }}>
              Seyahati genel olarak <strong>{generalRating} yıldız</strong> ile değerlendirdiniz. Daha iyi bir deneyim sunabilmemiz için detayları puanlayın.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {Object.keys(detailedRatings).map(key => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', textTransform: 'capitalize', fontWeight: '600', color: 'var(--text-main)' }}>{key}</span>
                  <StarRating
                    value={detailedRatings[key]}
                    onChange={(v) => setDetailedRatings(prev => ({ ...prev, [key]: v }))}
                    size={22}
                  />
                </div>
              ))}
            </div>

            <textarea
              placeholder="Seyahatiniz hakkında düşüncelerinizi paylaşın..."
              className="input-field"
              style={{ width: '100%', minHeight: '90px', padding: '12px', fontSize: '13px', resize: 'none', marginBottom: '20px' }}
              value={reviewMsg}
              onChange={e => setReviewMsg(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" style={{ flex: 1, border: 'none', background: '#f5f5f5', color: 'var(--text-muted)', fontSize: '14px' }} onClick={() => setShowDetailedModal(false)}>İptal</button>
              <button className="btn-primary" style={{ flex: 1, fontSize: '14px' }} onClick={submitReview}>Gönder</button>
            </div>
          </div>
        </div>
      )}

      {alreadyReviewedTourId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '320px', padding: '24px', animation: 'shake 0.4s ease-in-out', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Zaten Puanladınız</h2>
            <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px', lineHeight: '1.4' }}>
              Bu değerlendirmeyi gönderdiğiniz için teşekkür ederiz.
            </p>
            <button className="btn-primary" onClick={() => setAlreadyReviewedTourId(null)} style={{ padding: '10px 0', fontSize: '14px' }}>Tamam</button>
          </div>
        </div>
      )}

      {expertModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '24px', animation: 'fadeIn 0.2s ease-out', textAlign: 'center', position: 'relative' }}>
            <div onClick={() => setExpertModalData(null)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
            </div>

            <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', overflow: 'hidden', border: '3px solid var(--primary-light)', padding: '2px' }}>
               <img loading="lazy" src={expertModalData.avatar || dynExpertUser?.avatar || "https://ui-avatars.com/api/?name=${expertName || 'U'}&background=D7147A&color=fff"} alt="Uzman" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-main)' }}>{expertModalData.name || expertName}</h2>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '24px' }}>Bölge Seyahat Uzmanınız</p>
            
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
               <a href="tel:+905321234567" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', fontWeight: '600', transition: 'all 0.2s' }}>
                  <Phone size={18} className="text-primary" /> Hemen Ara
               </a>
               
               <a href={`https://wa.me/905321234567?text=Merhaba%20${(expertModalData.name || expertName).split(' ')[0]},%20turum%20hakk%C4%B1nda%20deste%C4%9Finize%20ihtiyac%C4%B1m%20var.`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#25D366', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', transition: 'all 0.2s' }}>
                  <MessageCircle size={18} color="#fff" /> WhatsApp'tan Yaz
               </a>
            </div>
          </div>
        </div>
      )}

    
      

</div>
  );
}

