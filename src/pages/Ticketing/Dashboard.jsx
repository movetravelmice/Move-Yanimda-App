import React, { useState } from 'react';
import { Search, UserCircle2, Edit3, Users, PlaneTakeoff, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';

export default function TicketingDashboard() {
  const navigate = useNavigate();
  const { tours } = useTourStore();
  const allUsers = useUserStore(state => state.users);

  const activeTours = tours.filter(t => t.status === 'active');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPanoGroup, setExpandedPanoGroup] = useState(null);

  const missingTicketsGroups = activeTours.map(tour => {
      const missingUsers = (tour.participants || []).filter(p => !p.flights || p.flights.length < 2 || !p.flights[0]?.pnr || !p.flights[1]?.pnr);
      return { tour, missingUsers };
  }).filter(group => group.missingUsers.length > 0);
  
  const currentTours = activeTours;
  
  const filteredTours = currentTours.filter(tour => {
      const qs = searchQuery.toLowerCase();
      const tourName = tour.name?.toLowerCase() || '';
      const expertNameRef = (tour.guideName || tour.expert?.name || '').toLowerCase();
      return tourName.includes(qs) || expertNameRef.includes(qs);
  });

  const calculateDaysLeft = (datesString) => {
      try {
          if (!datesString) return 'Aktif';
          const match = datesString.toLowerCase().match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})/);
          if (match) {
              const trMonths = {
                  'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
                  'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
              };
              const targetDate = new Date(parseInt(match[3]), trMonths[match[2]], parseInt(match[1]));
              const diffTime = targetDate - new Date();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays > 0) return `${diffDays} gün kaldı`;
              else if (diffDays === 0) return `Bugün başlıyor`;
              else return `Devam ediyor`;
          }
          return 'Aktif';
      } catch (e) {
          return 'Aktif';
      }
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      <Header title="Biletleme Operasyonları" />
      
      <div style={{ padding: '24px 16px' }}>

        {/* EKSİK BİLET PANOSU */}
        {missingTicketsGroups.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#d97706' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Uçuş bilgisi Tanımlanmamış Kullanıcı Mevcut!</h3>
             </div>
             <p style={{ fontSize: '13px', color: '#b45309', margin: '0 0 16px', lineHeight: 1.5 }}>
                Aşağıdaki aktif turlarda gidiş veya dönüş bileti (PNR) tanımlanmamış yolcular bulunmaktadır. Biletleri acil olarak sisteme işleyiniz.
             </p>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {missingTicketsGroups.map((grp) => (
                    <div key={grp.tour.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #fef3c7' }}>
                        <div 
                           onClick={() => setExpandedPanoGroup(expandedPanoGroup === grp.tour.id ? null : grp.tour.id)}
                           style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedPanoGroup === grp.tour.id ? '#fef3c7' : 'white', transition: 'background 0.2s' }}
                        >
                           <div>
                               <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>{grp.tour.name}</div>
                               <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>{grp.missingUsers.length} Yolcu Bekliyor</div>
                           </div>
                           <div style={{ color: '#d97706' }}>
                               {expandedPanoGroup === grp.tour.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                           </div>
                        </div>

                        {expandedPanoGroup === grp.tour.id && (
                           <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                               {grp.missingUsers.map(u => (
                                   <div 
                                      key={u.id} 
                                      onClick={() => navigate(`/dashboard/participants/${grp.tour.id}?openTransfer=${u.id}`)}
                                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#fffbeb', borderRadius: '8px', cursor: 'pointer', border: '1px solid #fde68a' }}
                                   >
                                      <img src={u.avatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                      <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#92400e' }}>{u.name}</div>
                                      <div style={{ fontSize: '11px', background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Bilet Ekle</div>
                                   </div>
                               ))}
                           </div>
                        )}
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* PANO END */} 

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-main)', flex: 1 }}>
                Tüm Seyahatler
                <div style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Operasyonel takip ve katılımcı yönetimi</div>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px', width: '160px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <Search size={16} color="#94a3b8" />
                <input 
                    type="text" 
                    placeholder="Tur veya uzman ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', paddingLeft: '8px', width: '100%', color: 'var(--text-main)' }}
                />
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTours.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <PlaneTakeoff size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    Arama kriterlerine uygun seyahat bulunamadı.
                </div>
            ) : (
                filteredTours.map((tour, idx) => {
                    const expertNameReference = tour.guideName || tour.expert?.name;
                    const expertUser = allUsers.find(u => u.name === expertNameReference);
                    const representativeAvatar = expertUser?.avatar;

                    return (
                    <div key={tour.id || idx} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'transform 0.2s' }}>
                        <div style={{ height: '110px', width: '100%', position: 'relative' }}>
                            <img src={tour.avatar} alt="Tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                            <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{tour.name}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {calculateDaysAndNights(tour.dates) && (
                                        <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                                            {calculateDaysAndNights(tour.dates)}
                                        </div>
                                    )}
                                    <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                                        {calculateDaysLeft(tour.dates)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
                                    {representativeAvatar || (tour.expert?.avatar) ? (
                                        <img src={representativeAvatar || tour.expert?.avatar} alt="Uzman" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <UserCircle2 size={36} color="#94a3b8" style={{ marginTop: '2px' }} />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', fontWeight: 'bold' }}>Yetkili & Bölge Uzmanı</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{expertNameReference || "Bilinmiyor"}</div>
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Tarihler</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{tour.dates || '-'}</div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 16px 16px', borderTop: '1px solid #f8fafc', paddingTop: '16px' }}>
                            <button 
                              onClick={() => navigate('/dashboard/program-edit/' + tour.id)} 
                              style={{ background: '#f1f5f9', color: 'var(--primary)', border: 'none', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            >
                              <Edit3 size={16} />
                              Programı İncele
                            </button>
                            <button 
                              onClick={() => navigate('/dashboard/participants/' + tour.id)} 
                              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.2)' }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(215, 20, 122, 0.3)'}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(215, 20, 122, 0.2)'}
                            >
                              <Users size={16} />
                              Katılımcılar ({tour.participants?.length || 0})
                            </button>
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
