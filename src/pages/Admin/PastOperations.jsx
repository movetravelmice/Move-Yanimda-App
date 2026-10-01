import React, { useState, useMemo } from 'react';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights, isTourPast } from '../../store/tourStore';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Users, 
  MapPin, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  Calendar, 
  Trash2, 
  MessageSquare,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileText,
  Phone,
  Mail,
  Award,
  BarChart2
} from 'lucide-react';

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
        <div style={{ padding: '24px', background: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>Sayfa Yüklenirken Bir Hata Oluştu</h2>
          <p style={{ fontSize: '12px' }}>{this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function PastOperationsContent() {
  const navigate = useNavigate();
  const { tours, setTourStatus, deleteTour } = useTourStore();
  const [successToast, setSuccessToast] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalTour, setReportModalTour] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [modalFilterTab, setModalFilterTab] = useState('feedbacks'); // 'feedbacks' | 'all'

  // Filter for past/completed tours safely
  const pastTours = (tours || []).filter(isTourPast);

  const uniqueYears = useMemo(() => {
    const years = new Set();
    pastTours.forEach(tour => {
      const match = tour.dates?.match(/\b(20[2-9]\d)\b/);
      if (match) years.add(match[1]);
      else years.add(new Date().getFullYear().toString());
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [pastTours]);

  const filteredPastTours = useMemo(() => {
    return pastTours.filter(tour => {
      const match = tour.dates?.match(/\b(20[2-9]\d)\b/);
      const tourYear = match ? match[1] : new Date().getFullYear().toString();
      const matchesYear = selectedYear === 'Tümü' || tourYear === selectedYear;
      
      const qs = searchQuery.toLowerCase().trim();
      if (!qs) return matchesYear;

      const tourName = (tour.name || '').toLowerCase();
      const dest = (tour.destinations || tour.destination || '').toLowerCase();
      const matchesSearch = tourName.includes(qs) || dest.includes(qs);

      return matchesYear && matchesSearch;
    });
  }, [pastTours, selectedYear, searchQuery]);

  const ratingLabels = {
    program: 'Genel Program',
    acentaHizmeti: 'Acenta Yetkili Hizmeti',
    ucakHizmeti: 'Uçak & Havayolu Hizmeti',
    turlar: 'Rehber & Tur Programı',
    konaklamaTemizlik: 'Konaklama Temizliği',
    konaklamaKonum: 'Otel & Lokasyon',
    restoranYemek: 'Restoran & Yemek Kalitesi'
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      <Header title="Tamamlanan Operasyonlar" showBack />
      
      {/* Success Toast */}
      {successToast && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: '#059669', 
          color: 'white', 
          padding: '10px 16px', 
          borderRadius: '10px', 
          fontSize: '11.5px', 
          fontWeight: '700', 
          zIndex: 99999, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)', 
          animation: 'slideDown 0.25s ease-out' 
        }}>
          <CheckCircle2 size={15} /> {successToast}
        </div>
      )}

      {/* Delete Tour Confirmation Modal */}
      {deleteConfirmModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 99999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '16px', 
          backdropFilter: 'blur(4px)' 
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '20px', 
            maxWidth: '340px', 
            width: '100%', 
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              background: '#fee2e2', 
              color: '#dc2626', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 12px auto' 
            }}>
              <Trash2 size={20} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
              Operasyonu Kalıcı Olarak Sil?
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              <strong>"{deleteConfirmModal.name}"</strong> operasyon kaydı ve katılımcı geri bildirimleri kalıcı olarak silinecektir.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setDeleteConfirmModal(null)}
                style={{ 
                  flex: 1, 
                  padding: '9px', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  background: 'white', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: '#475569', 
                  cursor: 'pointer' 
                }}
              >
                Vazgeç
              </button>
              <button 
                onClick={async () => {
                  await deleteTour(deleteConfirmModal.id);
                  setDeleteConfirmModal(null);
                  setSuccessToast(`"${deleteConfirmModal.name}" kalıcı olarak silindi.`);
                  setTimeout(() => setSuccessToast(null), 3000);
                }}
                style={{ 
                  flex: 1, 
                  padding: '9px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  background: '#dc2626', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: 'white', 
                  cursor: 'pointer' 
                }}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAYLI DEĞERLENDİRME & RAPOR MODALI */}
      {reportModalTour && (() => {
        const safeParticipants = reportModalTour.participants || [];
        const filteredFeedbacks = safeParticipants.filter(p => p && p.feedback);
        
        let avgRating = 0;
        if (filteredFeedbacks.length > 0) {
          const totalScore = filteredFeedbacks.reduce((sum, p) => sum + Number(p.feedback?.rating || 0), 0);
          avgRating = (totalScore / filteredFeedbacks.length).toFixed(1);
        }

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

        const displayedUsers = modalFilterTab === 'feedbacks' ? filteredFeedbacks : safeParticipants;

        return (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(15, 23, 42, 0.65)', 
            zIndex: 99999, 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'center', 
            backdropFilter: 'blur(5px)' 
          }}>
            <div style={{ 
              background: '#f8fafc', 
              width: '100%', 
              maxWidth: '480px', 
              maxHeight: '90vh', 
              borderRadius: '24px 24px 0 0', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
              animation: 'slideUp 0.25s ease-out'
            }}>
              
              {/* Modal Header */}
              <div style={{ 
                padding: '16px 20px', 
                background: 'white', 
                borderBottom: '1px solid #e2e8f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '0 0 2px 0' }}>
                    Operasyon Değerlendirme Raporu
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {reportModalTour.name}
                  </span>
                </div>
                <div 
                  onClick={() => setReportModalTour(null)}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: '#f1f5f9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer',
                    color: '#64748b' 
                  }}
                >
                  <X size={18} />
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                
                {/* Executive Scorecard */}
                <div style={{ 
                  background: 'white', 
                  borderRadius: '16px', 
                  padding: '14px', 
                  border: '1px solid #e2e8f0', 
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Star size={20} fill="#d97706" color="#d97706" /> {avgRating > 0 ? avgRating : '-'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                      Genel Ortalama
                    </div>
                  </div>

                  <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>
                      {filteredFeedbacks.length} / {safeParticipants.length}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                      Katılımcı Anketi
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {filteredFeedbacks.length > 0 && (
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '14px', 
                    border: '1px solid #e2e8f0', 
                    marginBottom: '14px' 
                  }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BarChart2 size={14} color="#2563eb" /> Kategori Bazlı Puan Dağılımı
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.keys(detailedAverages).map(key => {
                        const score = detailedAverages[key];
                        if (score === null) return null;
                        const percent = (Number(score) / 5) * 100;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                            <span style={{ width: '140px', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ratingLabels[key]}
                            </span>
                            <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${percent}%`, height: '100%', background: score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} />
                            </div>
                            <span style={{ width: '32px', textAlign: 'right', fontWeight: '800', color: '#1e293b' }}>
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <button 
                    onClick={() => setModalFilterTab('feedbacks')}
                    style={{ 
                      flex: 1, 
                      padding: '7px', 
                      borderRadius: '10px', 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      cursor: 'pointer',
                      background: modalFilterTab === 'feedbacks' ? '#2563eb' : 'white', 
                      color: modalFilterTab === 'feedbacks' ? 'white' : '#64748b',
                      boxShadow: modalFilterTab === 'feedbacks' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                      border: '1px solid ' + (modalFilterTab === 'feedbacks' ? '#2563eb' : '#e2e8f0')
                    }}
                  >
                    Anketi Dolduranlar ({filteredFeedbacks.length})
                  </button>
                  <button 
                    onClick={() => setModalFilterTab('all')}
                    style={{ 
                      flex: 1, 
                      padding: '7px', 
                      borderRadius: '10px', 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      cursor: 'pointer',
                      background: modalFilterTab === 'all' ? '#2563eb' : 'white', 
                      color: modalFilterTab === 'all' ? 'white' : '#64748b',
                      boxShadow: modalFilterTab === 'all' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                      border: '1px solid ' + (modalFilterTab === 'all' ? '#2563eb' : '#e2e8f0')
                    }}
                  >
                    Tüm Katılımcılar ({safeParticipants.length})
                  </button>
                </div>

                {/* Participant Reviews List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displayedUsers.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#94a3b8', fontSize: '11.5px' }}>
                      {modalFilterTab === 'feedbacks' ? 'Henüz anket dolduran misafir bulunmuyor.' : 'Katılımcı bulunamadı.'}
                    </div>
                  ) : (
                    displayedUsers.map((user, pidx) => (
                      <div 
                        key={user?.id || pidx} 
                        style={{ 
                          background: 'white', 
                          borderRadius: '12px', 
                          padding: '12px', 
                          border: '1px solid #e2e8f0' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: user?.feedback ? '8px' : '0' }}>
                          <img 
                            src={user?.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100"} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                            alt="User" 
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#1e293b' }}>
                              {user?.name || "Bilinmeyen Misafir"}
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              {user?.phone || user?.email || "Kayıtlı Misafir"}
                            </span>
                          </div>

                          {user?.feedback?.rating ? (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '3px', 
                              background: '#fef3c7', 
                              color: '#b45309', 
                              padding: '2px 7px', 
                              borderRadius: '8px', 
                              fontWeight: '800', 
                              fontSize: '11.5px',
                              border: '1px solid #fde68a'
                            }}>
                              <Star size={12} fill="#d97706" color="#d97706" /> {Number(user.feedback.rating).toFixed(1)}
                            </div>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Değerlendirmedi
                            </span>
                          )}
                        </div>

                        {/* Feedback Details */}
                        {user?.feedback && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {user.feedback.comment && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#334155', 
                                background: '#f8fafc', 
                                padding: '8px 10px', 
                                borderRadius: '8px', 
                                borderLeft: '3px solid #2563eb', 
                                fontStyle: 'italic',
                                lineHeight: 1.35
                              }}>
                                "{user.feedback.comment}"
                              </div>
                            )}

                            {(user.feedback.contactPref || user.feedback.nextYearPlaces) && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px', color: '#475569' }}>
                                {user.feedback.contactPref && (
                                  <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                    📞 {user.feedback.contactPref === 'telefon' ? 'Telefonla aransın' : user.feedback.contactPref === 'brosur' ? 'Broşür istiyor' : user.feedback.contactPref}
                                  </span>
                                )}
                                {user.feedback.nextYearPlaces && (
                                  <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                    ✈️ Gelecek yıl: {user.feedback.nextYearPlaces}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                <button 
                  onClick={() => setReportModalTour(null)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '12px', 
                    background: '#2563eb', 
                    color: 'white', 
                    border: 'none', 
                    fontSize: '12.5px', 
                    fontWeight: '700', 
                    cursor: 'pointer' 
                  }}
                >
                  Kapat
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MAIN CONTENT AREA */}
      <div style={{ padding: '14px 16px' }}>

        {/* 1. Header Filter Strip */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '12px 14px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <h2 style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.2px' }}>
                Geçmiş Operasyonlar
              </h2>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                Arşivlenmiş turlar ve müşteri memnuniyet raporları
              </span>
            </div>
            <span style={{ 
              fontSize: '10.5px', 
              background: '#eff6ff', 
              color: '#2563eb', 
              fontWeight: '800', 
              padding: '2px 8px', 
              borderRadius: '8px', 
              border: '1px solid #dbeafe' 
            }}>
              {filteredPastTours.length} Tur
            </span>
          </div>

          {/* Search Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '9px', 
            padding: '5px 8px',
            marginBottom: '10px'
          }}>
            <Search size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Arşivde tur veya rota ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', paddingLeft: '6px', width: '100%', color: '#1e293b' }}
            />
            {searchQuery && (
              <div onClick={() => setSearchQuery('')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <X size={12} />
              </div>
            )}
          </div>

          {/* Season Filter Pills */}
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            overflowX: 'auto', 
            msOverflowStyle: 'none', 
            scrollbarWidth: 'none',
            paddingBottom: '2px'
          }}>
            {uniqueYears.map(year => (
              <button 
                key={year}
                onClick={() => setSelectedYear(year)}
                style={{ 
                  padding: '4px 10px', 
                  borderRadius: '14px', 
                  fontSize: '10.5px', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap', 
                  background: selectedYear === year ? 'var(--primary)' : '#f8fafc', 
                  color: selectedYear === year ? 'white' : '#64748b', 
                  border: `1px solid ${selectedYear === year ? 'var(--primary)' : '#e2e8f0'}`,
                  transition: 'all 0.15s',
                  lineHeight: 1.2
                }}
              >
                {year} Sezonu
              </button>
            ))}
            <button 
              onClick={() => setSelectedYear('Tümü')}
              style={{ 
                padding: '4px 10px', 
                borderRadius: '14px', 
                fontSize: '10.5px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                whiteSpace: 'nowrap', 
                background: selectedYear === 'Tümü' ? 'var(--primary)' : '#f8fafc', 
                color: selectedYear === 'Tümü' ? 'white' : '#64748b', 
                border: `1px solid ${selectedYear === 'Tümü' ? 'var(--primary)' : '#e2e8f0'}`,
                transition: 'all 0.15s',
                lineHeight: 1.2
              }}
            >
              Tüm Zamanlar
            </button>
          </div>
        </div>

        {/* 2. Compact Past Tour Cards Feed */}
        {filteredPastTours.length === 0 ? (
          <div style={{ 
            padding: '36px 20px', 
            textAlign: 'center', 
            color: '#64748b', 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Search size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Seçili filtreye uygun arşivlenmiş operasyon bulunamadı.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredPastTours.map((tour, idx) => {
              const daysNights = calculateDaysAndNights(tour.dates);
              const safeParticipants = tour.participants || [];
              const filteredFeedbacks = safeParticipants.filter(p => p && p.feedback);
              
              let avgRating = 0;
              if (filteredFeedbacks.length > 0) {
                const totalScore = filteredFeedbacks.reduce((sum, p) => sum + Number(p.feedback?.rating || 0), 0);
                avgRating = (totalScore / filteredFeedbacks.length).toFixed(1);
              }

              return (
                <div 
                  key={tour.id || idx} 
                  style={{ 
                    background: 'white', 
                    borderRadius: '18px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)', 
                    overflow: 'hidden',
                    transition: 'transform 0.18s'
                  }}
                >
                  
                  {/* Top Cover Image with Floating Badges & Action Buttons */}
                  <div style={{ height: '125px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={tour.avatar || "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&q=80&w=400"} 
                      alt="Tour" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 100%)' }} />

                    {/* Top Left: Arşiv Pill */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span style={{ 
                        background: 'rgba(255, 255, 255, 0.92)', 
                        backdropFilter: 'blur(6px)', 
                        color: '#d97706', 
                        fontSize: '10px', 
                        fontWeight: '800', 
                        padding: '3px 8px', 
                        borderRadius: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                      }}>
                        📦 Arşivlendi
                      </span>
                    </div>

                    {/* Top Right: Glass Actions (Restore & Delete) */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          await setTourStatus(tour.id, 'active');
                          setSuccessToast(`"${tour.name}" aktif turlara geri alındı.`);
                          setTimeout(() => setSuccessToast(null), 3500);
                        }}
                        title="Turu Aktife Döndür"
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          background: 'rgba(255,255,255,0.92)', 
                          backdropFilter: 'blur(6px)', 
                          border: 'none', 
                          color: '#2563eb', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transition: 'transform 0.15s'
                        }}
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmModal(tour);
                        }}
                        title="Turu Kalıcı Olarak Sil"
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          background: 'rgba(255,255,255,0.92)', 
                          backdropFilter: 'blur(6px)', 
                          border: 'none', 
                          color: '#dc2626', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transition: 'transform 0.15s'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Bottom Info inside Cover */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', color: 'white' }}>
                      <div style={{ fontWeight: '800', fontSize: '13.5px', marginBottom: '2px', lineHeight: 1.25, letterSpacing: '-0.2px', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                        {tour.name || "Bilinmeyen Tur"}
                      </div>
                      <div style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <MapPin size={11} style={{ flexShrink: 0 }} /> 
                          <span>{tour.destinations || tour.destination || "Rota Yok"}</span>
                        </div>
                        {daysNights && (
                          <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '1px 6px', borderRadius: '6px', fontSize: '9.5px', fontWeight: '700' }}>
                            {daysNights}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '12px 14px' }}>
                    
                    {/* Date Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '10px' }}>
                      <Calendar size={12} color="var(--primary)" />
                      <span>{tour.dates || "Tarih Belirtilmemiş"}</span>
                    </div>

                    {/* 3-Pill Executive Metric Row */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '8px', 
                      background: '#f8fafc', 
                      padding: '8px 10px', 
                      borderRadius: '12px', 
                      border: '1px solid #edf2f7',
                      marginBottom: '12px'
                    }}>
                      {/* Katılımcı */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', lineHeight: 1.1 }}>
                          {safeParticipants.length}
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                          Misafir
                        </div>
                      </div>

                      {/* Ortalama Puan */}
                      <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#d97706', lineHeight: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <Star size={12} fill="#d97706" color="#d97706" /> {avgRating > 0 ? avgRating : '-'}
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                          Puan
                        </div>
                      </div>

                      {/* Geri Bildirim */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb', lineHeight: 1.1 }}>
                          {filteredFeedbacks.length}
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                          Anket
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <button 
                        onClick={() => setReportModalTour(tour)}
                        style={{ 
                          background: '#eff6ff', 
                          color: '#2563eb', 
                          border: '1px solid #dbeafe', 
                          padding: '8px 10px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <BarChart2 size={13} /> Değerlendirmeler ({filteredFeedbacks.length})
                      </button>

                      <button 
                        onClick={() => navigate(`/dashboard/participants/${tour.id}`)}
                        style={{ 
                          background: 'white', 
                          color: '#475569', 
                          border: '1px solid #e2e8f0', 
                          padding: '8px 10px', 
                          borderRadius: '10px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Users size={13} /> Misafirler ({safeParticipants.length})
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
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
