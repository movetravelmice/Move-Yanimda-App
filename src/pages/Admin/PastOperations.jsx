import React from 'react';
import Header from '../../components/Header';
import { useTourStore } from '../../store/tourStore';
import { Star, Users, MapPin, Search } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("PastOperations Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '16px' }}>Sistem Çöktü (React Runtime Error)</h1>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#f87171', color: 'white', padding: '16px', borderRadius: '8px', marginTop: '16px', overflowX: 'auto', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function PastOperationsContent() {
  const { tours } = useTourStore();
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  
  // Filter for past/completed tours safely
  const pastTours = (tours || []).filter(t => t?.status === 'past');

  const uniqueYears = React.useMemo(() => {
     const years = new Set();
     pastTours.forEach(tour => {
         const match = tour.dates?.match(/\b(20[2-9]\d)\b/);
         if (match) years.add(match[1]);
         else years.add(new Date().getFullYear().toString());
     });
     years.add(new Date().getFullYear().toString());
     return Array.from(years).sort((a,b) => b.localeCompare(a));
  }, [pastTours]);

  const filteredPastTours = React.useMemo(() => {
      if (selectedYear === 'Tümü') return pastTours;
      return pastTours.filter(tour => {
          const match = tour.dates?.match(/\b(20[2-9]\d)\b/);
          const tourYear = match ? match[1] : new Date().getFullYear().toString();
          return tourYear === selectedYear;
      });
  }, [pastTours, selectedYear]);

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      <Header title="Tamamlanan Operasyonlar" showBack />
      
      <div style={{ padding: '24px 16px' }}>

        <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Geçmiş Operasyon Analizleri</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Arşivlenmiş turların katılımcı listelerini ve misafir geri bildirimlerini detaylı inceleyin.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
           {uniqueYears.map(year => (
               <div 
                   key={year}
                   onClick={() => setSelectedYear(year)}
                   style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', background: selectedYear === year ? 'var(--primary)' : 'white', color: selectedYear === year ? 'white' : 'var(--text-muted)', border: `1px solid ${selectedYear === year ? 'var(--primary)' : '#e2e8f0'}`, boxShadow: selectedYear === year ? '0 4px 6px rgba(59, 130, 246, 0.2)' : 'none' }}>
                   {year} Sezonu
               </div>
           ))}
           <div 
               onClick={() => setSelectedYear('Tümü')}
               style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', background: selectedYear === 'Tümü' ? 'var(--primary)' : 'white', color: selectedYear === 'Tümü' ? 'white' : 'var(--text-muted)', border: `1px solid ${selectedYear === 'Tümü' ? 'var(--primary)' : '#e2e8f0'}`, boxShadow: selectedYear === 'Tümü' ? '0 4px 6px rgba(59, 130, 246, 0.2)' : 'none' }}>
               Tüm Zamanlar
           </div>
        </div>

        {filteredPastTours.length === 0 ? (
            <div style={{ padding: '40px 32px', textAlign: 'center', color: 'var(--text-muted)', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Seçili yıla ait arşivlenmiş operasyon bulunmuyor.</span>
            </div>
        ) : (
            filteredPastTours.map((tour, idx) => {
                // Safely calculate feedback metrics
                const safeParticipants = tour.participants || [];
                const filteredFeedbacks = safeParticipants.filter(p => p && p.feedback);
                
                let avgRating = 0;
                if (filteredFeedbacks.length > 0) {
                    const totalScore = filteredFeedbacks.reduce((sum, p) => sum + Number(p.feedback?.rating || 0), 0);
                    avgRating = (totalScore / filteredFeedbacks.length).toFixed(1);
                }

                const ratingLabels = {
                    program: 'Genel Olarak Program',
                    acentaHizmeti: 'Acenta Yetkililerinin Hizmeti',
                    ucakHizmeti: 'Uçak Yolculuğu Ve Hizmeti',
                    turlar: 'Katılım Sağladığınız Turlar',
                    konaklamaTemizlik: 'Konaklama Temizlik & Konforu',
                    konaklamaKonum: 'Konaklama Yer & Konumu',
                    restoranYemek: 'Restoran & Yemek'
                };

                const detailedAverages = {
                    program: 0,
                    acentaHizmeti: 0,
                    ucakHizmeti: 0,
                    turlar: 0,
                    konaklamaTemizlik: 0,
                    konaklamaKonum: 0,
                    restoranYemek: 0
                };

                if (filteredFeedbacks.length > 0) {
                    const counts = { program: 0, acentaHizmeti: 0, ucakHizmeti: 0, turlar: 0, konaklamaTemizlik: 0, konaklamaKonum: 0, restoranYemek: 0 };
                    filteredFeedbacks.forEach(p => {
                        const det = p.feedback.detailedRatings || {};
                        Object.keys(detailedAverages).forEach(key => {
                            if (det[key] !== undefined && Number(det[key]) > 0) {
                                detailedAverages[key] += Number(det[key]);
                                counts[key]++;
                            }
                        });
                    });
                    Object.keys(detailedAverages).forEach(key => {
                        if (counts[key] > 0) {
                            detailedAverages[key] = (detailedAverages[key] / counts[key]).toFixed(1);
                        } else {
                            detailedAverages[key] = null;
                        }
                    });
                }

                return (
                    <div key={tour.id || idx} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px', overflow: 'hidden' }}>
                        
                        {/* Tour Header Banner */}
                        <div style={{ height: '100px', width: '100%', position: 'relative' }}>
                            <img src={tour.avatar || "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&q=80&w=400"} alt="Tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))' }}></div>
                            <div style={{ position: 'absolute', bottom: '12px', left: '16px', color: 'white' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '2px' }}>{tour.name || "Bilinmeyen Tur"}</div>
                                <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
                                    <MapPin size={12} /> {tour.destinations || "Rotası Belirtilmemiş"} ({tour.dates || "Tarih Yok"})
                                </div>
                            </div>
                        </div>

                        {/* Analytic Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e2e8f0' }}>
                            <div style={{ background: 'white', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Users size={24} color="#6366f1" style={{ marginBottom: '8px' }} />
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>{safeParticipants.length}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Katılımcı Sayısı</div>
                            </div>
                            <div style={{ background: 'white', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Star size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>{avgRating > 0 ? avgRating : "-"}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ortalama Puan</div>
                            </div>
                        </div>

                        {/* Category Averages Section */}
                        {filteredFeedbacks.length > 0 && (
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '12px' }}>Kategori Bazlı Değerlendirme Ortalamaları</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                                    {Object.keys(detailedAverages).map(key => {
                                        const score = detailedAverages[key];
                                        if (score === null) return null;
                                        return (
                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ratingLabels[key]}</span>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                                    <Star size={12} fill="#d97706" color="#d97706" /> {score}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Participant Listing & Feedback */}
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Müşteri Geri Bildirimleri</h3>
                            
                            {safeParticipants.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {safeParticipants.map((user, pidx) => (
                                        <div key={user?.id || pidx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <img src={user?.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100"} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="User" />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>{user?.name || "Bilinmeyen Yolcu"}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: '#e2e8f0', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>Seyahat Yolcusu</div>
                                                </div>
                                                {user?.feedback && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                                                        <Star size={14} fill="currentColor" /> {Number(user.feedback.rating || 0).toFixed(1)}
                                                    </div>
                                                )}
                                            </div>

                                            {user?.feedback ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                                    {/* Detailed Ratings */}
                                                    {user.feedback.detailedRatings && (
                                                        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soru Bazlı Değerlendirme</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {Object.keys(ratingLabels).map(key => {
                                                                    const val = user.feedback.detailedRatings[key] || 0;
                                                                    return (
                                                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '12px', color: '#475569' }}>{ratingLabels[key]}</span>
                                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                                    <Star 
                                                                                        key={star} 
                                                                                        size={12} 
                                                                                        fill={star <= val ? '#f59e0b' : 'none'} 
                                                                                        color={star <= val ? '#f59e0b' : '#cbd5e1'} 
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Contact preferences & Next year places */}
                                                    {(user.feedback.contactPref || user.feedback.nextYearPlaces) && (
                                                        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {user.feedback.contactPref && (
                                                                <div style={{ fontSize: '12px' }}>
                                                                    <strong style={{ color: 'var(--text-main)' }}>İletişim Tercihi: </strong>
                                                                    <span style={{ color: '#475569' }}>
                                                                        {user.feedback.contactPref === 'telefon' && 'Telefon İle Bilgi Almak İstiyorum'}
                                                                        {user.feedback.contactPref === 'brosur' && 'Broşür Gönderimi İle Bilgi Almak İstiyorum'}
                                                                        {user.feedback.contactPref === 'istemiyorum' && 'Bilgi Almak İstemiyorum'}
                                                                        {user.feedback.contactPref !== 'telefon' && user.feedback.contactPref !== 'brosur' && user.feedback.contactPref !== 'istemiyorum' && user.feedback.contactPref}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {user.feedback.nextYearPlaces && (
                                                                <div style={{ fontSize: '12px' }}>
                                                                    <strong style={{ color: 'var(--text-main)' }}>Önümüzdeki Yıl Seyahat Etmek İstediği Yerler: </strong>
                                                                    <span style={{ color: '#475569' }}>{user.feedback.nextYearPlaces}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Written Comment */}
                                                    <div style={{ fontSize: '13px', color: '#334155', background: 'white', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #6366f1', fontStyle: 'italic' }}>
                                                        "{user.feedback.comment || 'Detaylı puanlama yaptı, yazılı görüş belirtmedi.'}"
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', background: 'white', padding: '8px', borderRadius: '8px' }}>
                                                    Müşteri henüz değerlendirme bırakmadı.
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Bu tura kayıtlı müşteri verisi bulunmuyor.</div>
                            )}
                        </div>

                    </div>
                );
            })
        )}

      </div>
    </div>
  );
}

export default function PastOperations() {
  return (
    <ErrorBoundary>
      <PastOperationsContent />
    </ErrorBoundary>
  );
}
