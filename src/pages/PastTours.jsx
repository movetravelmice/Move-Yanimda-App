import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Eye, Search, Star, MapPin, X, Users, Info, MessageCircle, UserCheck, Compass, PlaneTakeoff, Phone, Timer } from 'lucide-react';
import Header from '../components/Header';
import { useTourStore, calculateDaysAndNights, getTourExperts, isTourPast } from '../store/tourStore';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';

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

export default function PastTours() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const allUsers = useUserStore(state => state.users);
  const { expertName } = useSettingsStore();
  const { tours, setTourStatus, rateTour } = useTourStore();
  
  const isExpert = user?.role === 'expert';
  const myTours = tours.filter(t => {
    if (isExpert) {
      return (t.guideName === user?.name) || 
             (t.expert?.name === user?.name) || 
             (t.expert?.email === user?.email) || 
             (t.expert2?.name === user?.name) || 
             (t.expert2?.email === user?.email);
    }
    return t.participants?.some(p => p.id === user?.id || (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
  });

  const pastTours = myTours.filter(isTourPast);
  const [searchTerm, setSearchTerm] = useState('');
  const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });
  const [expertModalData, setExpertModalData] = useState(null);
  
  // Rating state for customer
  const [ratingTourId, setRatingTourId] = useState(null);
  const [generalRating, setGeneralRating] = useState(0);

  const [reviewedTours, setReviewedTours] = useState(() => {
    const saved = localStorage.getItem('base44_reviews');
    return saved ? JSON.parse(saved) : {};
  });

  const filteredPastTours = pastTours.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.destinations && t.destinations.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.dates && t.dates.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleGeneralRating = async (tourId, rating) => {
    setGeneralRating(rating);
    try {
      await rateTour(tourId, {
        customerName: user?.name || 'Misafir',
        rating: rating,
        comment: `${rating} Yıldızlı değerlendirme`,
        date: new Date().toLocaleDateString('tr-TR')
      });
      const newReviews = { ...reviewedTours, [tourId]: rating };
      setReviewedTours(newReviews);
      localStorage.setItem('base44_reviews', JSON.stringify(newReviews));
      setRatingTourId(null);
      setPopupMsg({ show: true, type: 'success', title: 'Teşekkürler!', text: 'Değerlendirmeniz başarıyla kaydedildi.' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header />

      <div style={{ padding: '0 16px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Page Top Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              width: '38px', 
              height: '38px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <ChevronLeft size={20} color="var(--text-main)" />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Geçmiş Turlarım</h1>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Toplam {pastTours.length} Tur Kaydı</span>
          </div>
          <div style={{ width: '38px' }}></div>
        </div>

        {/* Search Filter Bar */}
        {pastTours.length > 2 && (
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Geçmiş turlarda ara (isim, destinasyon, tarih)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchTerm && (
              <X 
                size={16} 
                color="#94a3b8" 
                onClick={() => setSearchTerm('')} 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} 
              />
            )}
          </div>
        )}

        {/* Tour List */}
        {filteredPastTours.length === 0 ? (
          <div className="card" style={{ padding: '36px 20px', textAlign: 'center', borderRadius: '16px', border: '1px solid #edf2f7', marginTop: '16px' }}>
            <Calendar size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#475569', margin: '0 0 6px 0' }}>
              {searchTerm ? 'Aramanızla eşleşen geçmiş tur bulunamadı' : 'Henüz geçmiş bir turunuz bulunmuyor'}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {searchTerm ? 'Lütfen farklı arama terimleri deneyiniz.' : 'Tamamlanan turlarınız otomatik olarak bu sayfada listelenecektir.'}
            </p>
          </div>
        ) : (
          filteredPastTours.map(tour => {
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

                  {/* Top Right Status Badge */}
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

                  {isExpert ? (
                    /* Expert Action Buttons (Only Eye Active, others Passive) */
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
                  ) : (
                    /* Customer Past Tour Actions (4 Passive Squares + Rating Strip) */
                    <div>
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
                  )}

                </div>
              </div>
            );
          })
        )}

      </div>

      {/* Expert Info Modal */}
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

      {/* Popup Message Modal */}
      {popupMsg.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '24px', animation: 'scaleUp 0.2s ease-out', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>{popupMsg.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.4 }}>{popupMsg.text}</p>
            <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '10px 0', borderRadius: '10px' }}>
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
