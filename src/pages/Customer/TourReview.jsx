import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Star, Send, Compass, MessageSquare, CheckCircle2, Heart } from 'lucide-react';
import Header from '../../components/Header';
import { useTourStore, getUserTourReview } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';

const StarRating = ({ value = 0, onChange, size = 18 }) => {
  const [hoverVal, setHoverVal] = useState(0);
  const displayVal = hoverVal > 0 ? hoverVal : value;

  return (
    <div 
      style={{ display: 'flex', gap: '5px' }}
      onMouseLeave={() => { if (onChange) setHoverVal(0); }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          onClick={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            if (onChange) onChange(star);
          }}
          fill={star <= displayVal ? '#f59e0b' : 'none'}
          color={star <= displayVal ? '#f59e0b' : '#cbd5e1'}
          style={{ cursor: onChange ? 'pointer' : 'default', transition: 'transform 0.15s' }}
          onMouseEnter={() => { if (onChange) setHoverVal(star); }}
        />
      ))}
    </div>
  );
};

const ratingLabels = {
  program: 'Genel Olarak Program',
  acentaHizmeti: 'Acenta Yetkililerinin Hizmeti',
  ucakHizmeti: 'Uçak Yolculuğu Ve Hizmeti',
  turlar: 'Katılım Sağladığınız Turlar',
  konaklamaTemizlik: 'Konaklama Temizlik & Konforu',
  konaklamaKonum: 'Konaklama Yer & Konumu',
  restoranYemek: 'Restoran & Yemek'
};

const ratingDescriptions = {
  5: 'Mükemmel bir seyahatti!',
  4: 'Çok iyi bir deneyimdi.',
  3: 'Ortalama bir deneyimdi.',
  2: 'Beklentimin altındaydı.',
  1: 'Memnun kalmadım.'
};

export default function TourReview() {
  const { tourId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tours, addParticipantFeedback, rateTour } = useTourStore();
  const { user } = useAuthStore();

  const tour = tours.find(t => String(t.id) === String(tourId));
  
  // Check if previously reviewed in Firestore or localStorage
  const existingReview = React.useMemo(() => {
    return getUserTourReview(tour, user);
  }, [tour, user]);

  const queryRating = searchParams.get('rating') ? parseInt(searchParams.get('rating'), 10) : null;
  const initialRating = (queryRating && queryRating >= 1 && queryRating <= 5)
    ? queryRating
    : (existingReview?.rating ? Math.round(existingReview.rating) : 0);

  const [generalRating, setGeneralRating] = useState(initialRating);
  const [detailedRatings, setDetailedRatings] = useState(() => {
    if (existingReview?.detailedRatings) {
      return {
        program: existingReview.detailedRatings.program ?? 0,
        acentaHizmeti: existingReview.detailedRatings.acentaHizmeti ?? 0,
        ucakHizmeti: existingReview.detailedRatings.ucakHizmeti ?? 0,
        turlar: existingReview.detailedRatings.turlar ?? 0,
        konaklamaTemizlik: existingReview.detailedRatings.konaklamaTemizlik ?? 0,
        konaklamaKonum: existingReview.detailedRatings.konaklamaKonum ?? 0,
        restoranYemek: existingReview.detailedRatings.restoranYemek ?? 0
      };
    }
    const base = (queryRating && queryRating >= 1 && queryRating <= 5) ? queryRating : 0;
    return {
      program: base,
      acentaHizmeti: base,
      ucakHizmeti: base,
      turlar: base,
      konaklamaTemizlik: base,
      konaklamaKonum: base,
      restoranYemek: base
    };
  });

  const [contactPref, setContactPref] = useState(existingReview?.contactPref || 'telefon');
  const [nextYearPlaces, setNextYearPlaces] = useState(existingReview?.nextYearPlaces || '');
  const [reviewMsg, setReviewMsg] = useState(existingReview?.comment || '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const previousRating = existingReview?.rating;

  useEffect(() => {
    if (queryRating && queryRating >= 1 && queryRating <= 5) {
      setGeneralRating(queryRating);
      setDetailedRatings({
        program: queryRating,
        acentaHizmeti: queryRating,
        ucakHizmeti: queryRating,
        turlar: queryRating,
        konaklamaTemizlik: queryRating,
        konaklamaKonum: queryRating,
        restoranYemek: queryRating
      });
    } else if (existingReview?.rating) {
      const rounded = Math.round(existingReview.rating);
      setGeneralRating(rounded);
      if (existingReview.detailedRatings) {
        setDetailedRatings({
          program: existingReview.detailedRatings.program ?? rounded,
          acentaHizmeti: existingReview.detailedRatings.acentaHizmeti ?? rounded,
          ucakHizmeti: existingReview.detailedRatings.ucakHizmeti ?? rounded,
          turlar: existingReview.detailedRatings.turlar ?? rounded,
          konaklamaTemizlik: existingReview.detailedRatings.konaklamaTemizlik ?? rounded,
          konaklamaKonum: existingReview.detailedRatings.konaklamaKonum ?? rounded,
          restoranYemek: existingReview.detailedRatings.restoranYemek ?? rounded
        });
      }
      if (existingReview.comment) setReviewMsg(existingReview.comment);
      if (existingReview.contactPref) setContactPref(existingReview.contactPref);
      if (existingReview.nextYearPlaces) setNextYearPlaces(existingReview.nextYearPlaces);
    }
  }, [queryRating, existingReview]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!tourId) return;

    if (!generalRating || generalRating === 0) {
      alert('Lütfen seyahatinize puan vermek için en az bir yıldız seçin.');
      return;
    }

    const vals = Object.values(detailedRatings);
    const avgScore = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const finalScore = avgScore > 0 ? Number(avgScore.toFixed(1)) : generalRating;

    // Save to local storage for immediate fallback
    try {
      const saved = localStorage.getItem('base44_reviews');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[tourId] = finalScore;
      parsed[String(tourId)] = finalScore;
      if (tour?.id) {
        parsed[tour.id] = finalScore;
        parsed[String(tour.id)] = finalScore;
      }
      localStorage.setItem('base44_reviews', JSON.stringify(parsed));
    } catch (err) {}

    const feedbackPayload = {
      rating: finalScore,
      comment: reviewMsg || `${finalScore} Yıldızlı değerlendirme`,
      detailedRatings,
      contactPref,
      nextYearPlaces,
      customerName: user?.name || 'Misafir',
      userId: user?.id || null,
      email: user?.email || null,
      date: new Date().toLocaleDateString('tr-TR')
    };

    // Save feedback to store & Firestore
    if (addParticipantFeedback) {
      await addParticipantFeedback(tourId, user || 'cust_1', feedbackPayload);
    }

    if (rateTour) {
      await rateTour(tourId, feedbackPayload);
    }

    setIsSubmitted(true);
  };

  if (!tour) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Tur Bulunamadı</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Değerlendirmek istediğiniz seyahat kaydı bulunamadı.</p>
        <button onClick={() => navigate(-1)} className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}>
          Geri Dön
        </button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
        <Header 
          title="Değerlendirme Başarılı" 
          subtitle={tour.name} 
          showBack 
          onBack={() => navigate('/dashboard/past-tours')} 
          marginBottom={0} 
        />

        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, maxWidth: '440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div className="card" style={{ background: 'white', borderRadius: '20px', padding: '32px 20px', textAlign: 'center', border: '1.5px solid #e2e8f0', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #a7f3d0' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px' }}>Görüşleriniz İçin Teşekkürler!</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 20px' }}>
              Değerlendirmeniz seyahat operasyon ekibimize iletildi. Deneyimlerinizi bizimle paylaştığınız için teşekkür ederiz.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Ana Panele Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 0px))', background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Header 
        title="Tur Değerlendirmesi" 
        subtitle={tour.name} 
        showBack 
        marginBottom={0} 
      />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px', margin: '0 auto' }}>
        
        {/* Previous Rating Notice */}
        {previousRating && (
          <div style={{ background: '#fdf2f8', border: '1px solid #fce7f3', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#db2777', fontWeight: '700' }}>
              <Heart size={14} fill="#db2777" />
              <span>Daha Önceki Puanınız: {Number(previousRating).toFixed(1)} / 5</span>
            </div>
            <span style={{ fontSize: '11px', color: '#9d174d', fontWeight: '600' }}>Güncelleyebilirsiniz</span>
          </div>
        )}

        {/* 1. GENEL PUANLAMA KARTI */}
        <div 
          className="card"
          style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1.5px solid #e2e8f0', 
            padding: '16px', 
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)' }}>
            Genel Seyahat Memnuniyeti
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 2px', lineHeight: 1.4 }}>
            Seyahatinizi genel olarak kaç yıldız ile değerlendirirsiniz?
          </p>

          <StarRating 
            value={generalRating} 
            onChange={(val) => {
              setGeneralRating(val);
              setDetailedRatings({
                program: val,
                acentaHizmeti: val,
                ucakHizmeti: val,
                turlar: val,
                konaklamaTemizlik: val,
                konaklamaKonum: val,
                restoranYemek: val
              });
            }} 
            size={28} 
          />

          <div style={{ fontSize: '12px', fontWeight: '700', color: generalRating > 0 ? '#D7147A' : '#64748b', background: generalRating > 0 ? '#FDF2F8' : '#f8fafc', padding: '3px 10px', borderRadius: '8px', border: generalRating > 0 ? '1px solid #F9BED8' : '1px solid #e2e8f0' }}>
            {generalRating > 0 ? (ratingDescriptions[generalRating] || `${generalRating} Yıldız`) : 'Puanınızı Seçin'}
          </div>
        </div>

        {/* 2. DETAYLI KATEGORİ PUANLAMALARI KARTI */}
        <div 
          className="card"
          style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1.5px solid #e2e8f0', 
            padding: '16px', 
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
              <Star size={16} className="text-primary" /> Detaylı Kategori Puanlamaları
            </div>
            <span style={{ fontSize: '10.5px', fontWeight: '700', background: '#f8fafc', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              7 Kriter
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(detailedRatings).map(key => (
              <div 
                key={key} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 10px', 
                  background: '#f8fafc', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'left', flex: 1, paddingRight: '8px' }}>
                  {ratingLabels[key] || key}
                </span>
                <div style={{ flexShrink: 0 }}>
                  <StarRating
                    value={detailedRatings[key]}
                    onChange={(v) => setDetailedRatings(prev => ({ ...prev, [key]: v }))}
                    size={17}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. İLETİŞİM TERCİHİ KARTI */}
        <div 
          className="card"
          style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1.5px solid #e2e8f0', 
            padding: '16px', 
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <Send size={16} className="text-primary" /> İletişim Tercihiniz
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
            Yeni seyahat ve tur haberlerimizi size nasıl ulaştırabiliriz?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[
              { value: 'telefon', label: 'Telefon ile bilgi almak istiyorum' },
              { value: 'brosur', label: 'Broşür ve e-bülten gönderimi ile bilgi almak istiyorum' },
              { value: 'istemiyorum', label: 'Bilgi almak istemiyorum' }
            ].map(opt => {
              const isSelected = contactPref === opt.value;
              return (
                <label 
                  key={opt.value} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    fontSize: '12px', 
                    color: isSelected ? 'var(--text-main)' : '#64748b', 
                    fontWeight: isSelected ? '700' : '500',
                    cursor: 'pointer', 
                    padding: '9px 12px', 
                    borderRadius: '10px', 
                    background: isSelected ? '#FDF2F8' : '#f8fafc', 
                    border: isSelected ? '1px solid #F9BED8' : '1px solid #e2e8f0', 
                    transition: 'all 0.15s' 
                  }}
                >
                  <input 
                    type="radio" 
                    name="contactPref" 
                    value={opt.value} 
                    checked={isSelected} 
                    onChange={() => setContactPref(opt.value)} 
                    style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 4. GELECEK YIL SEYAHAT PLANI KARTI */}
        <div 
          className="card"
          style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1.5px solid #e2e8f0', 
            padding: '16px', 
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <Compass size={16} className="text-primary" /> Gelecek Seyahatleriniz
          </div>

          <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Önümüzdeki yıl seyahat etmek istediğiniz 3 yer:
          </label>
          <input 
            type="text" 
            placeholder="Örn: Roma, Tokyo, Paris" 
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              fontSize: '12.5px', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              outline: 'none',
              background: '#f8fafc',
              boxSizing: 'border-box'
            }}
            value={nextYearPlaces}
            onChange={e => setNextYearPlaces(e.target.value)}
          />
        </div>

        {/* 5. GÖRÜŞ VE ÖNERİLER KARTI */}
        <div 
          className="card"
          style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1.5px solid #e2e8f0', 
            padding: '16px', 
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <MessageSquare size={16} className="text-primary" /> Görüş ve Önerileriniz
          </div>

          <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Seyahatiniz hakkında eklemek istediğiniz diğer düşünceleriniz:
          </label>
          <textarea
            placeholder="Seyahatiniz hakkında diğer düşüncelerinizi ve önerilerinizi paylaşın..."
            style={{ 
              width: '100%', 
              minHeight: '85px', 
              padding: '10px 12px', 
              fontSize: '12.5px', 
              resize: 'none', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              outline: 'none',
              background: '#f8fafc',
              boxSizing: 'border-box'
            }}
            value={reviewMsg}
            onChange={e => setReviewMsg(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '12px', 
              background: '#ffffff', 
              border: '1px solid #cbd5e1', 
              color: '#64748b', 
              fontSize: '13px', 
              fontWeight: '700',
              cursor: 'pointer' 
            }}
          >
            Vazgeç
          </button>
          <button 
            type="button"
            onClick={handleSubmit} 
            className="btn-primary" 
            style={{ 
              flex: 2, 
              padding: '12px', 
              borderRadius: '12px', 
              fontSize: '13px', 
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
              cursor: 'pointer' 
            }}
          >
            {existingReview?.rating ? 'Değerlendirmeyi Güncelle ve Kaydet' : 'Değerlendirmeyi Kaydet'}
          </button>
        </div>

        {/* Bottom clearance spacer to guarantee submit buttons scroll completely clear of bottom-nav & Tintin */}
        <div style={{ height: '180px', minHeight: '180px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

      </div>
    </div>
  );
}
