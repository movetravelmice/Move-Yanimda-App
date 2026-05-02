import React, { useState } from 'react';
import { Settings, Users, Database, ArrowRight, Play, CheckCircle2, UserCircle2, ArchiveRestore, Edit3, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useTourStore, calculateDaysAndNights } from '../../store/tourStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUserStore } from '../../store/userStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { tours, setTourStatus } = useTourStore();
  const { expertName } = useSettingsStore();
  const allUsers = useUserStore(state => state.users);

  const activeTours = tours.filter(t => t.status === 'active');
  const pastTours = tours.filter(t => t.status === 'past');

  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredActiveTours = activeTours.filter(tour => {
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
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Sistem Komuta Merkezi" />
      
      <div style={{ padding: '24px 16px' }}>

        {/* ANALYTICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)', position: 'relative', overflow: 'hidden' }}>
                <Play size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.2 }} />
                <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '8px' }}>Aktif Seyahatler</div>
                <div style={{ fontSize: '32px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeTours.length} <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>Tur Açık</span>
                </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)', position: 'relative', overflow: 'hidden' }}>
                <CheckCircle2 size={40} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.2 }} />
                <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '8px' }}>Tamamlananlar</div>
                <div style={{ fontSize: '32px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {pastTours.length} <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>Arşivlendi</span>
                </div>
            </div>
        </div>

        {/* ACTIVE EXPERTS TOURS REPORT */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)', flex: 1 }}>Aktif Temsilci Operasyonları</h2>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '6px 10px', width: '130px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <Search size={14} color="#94a3b8" />
                <input 
                    type="text" 
                    placeholder="Tur ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', paddingLeft: '6px', width: '100%', color: 'var(--text-main)' }}
                />
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredActiveTours.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', background: '#f8fafc', borderRadius: '12px' }}>Arama kriterlerine uygun aktif tur bulunamadı.</div>
            ) : (
                filteredActiveTours.map((tour, idx) => {
                    const expertNameReference = tour.guideName || tour.expert?.name;
                    const expertUser = allUsers.find(u => u.name === expertNameReference);
                    const representativeAvatar = expertUser?.avatar;

                    return (
                    <div key={tour.id || idx} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ height: '110px', width: '100%', position: 'relative' }}>
                            <img src={tour.avatar} alt="Tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                            <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tour.name}</div>
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
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
                                    {representativeAvatar || (tour.expert?.avatar) ? (
                                        <img src={representativeAvatar || tour.expert?.avatar} alt="Uzman" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <UserCircle2 size={36} color="#94a3b8" style={{ marginTop: '2px' }} />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Yetkili Temsilci</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{expertNameReference || "Bilinmiyor"}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => setTourStatus(tour.id, 'past')}
                                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <ArchiveRestore size={16} /> Bitir
                                </button>
                            </div>
                        </div>

                        {/* Admin Action Bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '0 16px 16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <div onClick={() => navigate('/dashboard/program-edit/' + tour.id)} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid #e2e8f0' }}>
                              <Edit3 size={16} className="text-primary" />
                              <span style={{fontWeight: '600', color: 'var(--text-main)'}}>Program</span>
                            </div>
                            <div onClick={() => navigate('/dashboard/participants/' + tour.id)} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid #e2e8f0' }}>
                              <Users size={16} className="text-primary" />
                              <span style={{fontWeight: '600', color: 'var(--text-main)'}}>Katılımcılar ({tour.participants?.length || 0})</span>
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
        </div>

        {/* SETTINGS CARD */}
        <div style={{ marginTop: '48px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-main)' }}>Sistem Yönetim Araçları</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Görünüm, API ve Raporlama modüllerini aşağıdan yapılandırın.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
                onClick={() => navigate('admin-settings')}
                style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <Settings color="#3b82f6" size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)', marginBottom: '4px' }}>Sistem Ayarları</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duyuru görseli, Harita API Key...</div>
                    </div>
                </div>
                <ArrowRight size={20} color="#94a3b8" />
            </div>

            <div 
                onClick={() => navigate('admin-users')}
                style={{ padding: '20px', background: '#fff7ed', borderRadius: '16px', border: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <Users color="#f97316" size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)', marginBottom: '4px' }}>Yetkilendirme ve Kullanıcılar</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sistem erişimlerini ve uzmanları yönetin</div>
                    </div>
                </div>
                <ArrowRight size={20} color="#f97316" />
            </div>

            <div 
                onClick={() => navigate('admin-past-operations')}
                style={{ padding: '20px', background: '#f0fdf6', borderRadius: '16px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '32px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <ArchiveRestore color="#10b981" size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#065f46', marginBottom: '4px' }}>Tamamlanan Operasyonlar Raporu</div>
                        <div style={{ fontSize: '12px', color: '#166534', opacity: 0.8 }}>Müşteri yorumları, puanlar ve arşivlenmiş veriler...</div>
                    </div>
                </div>
                <ArrowRight size={20} color="#10b981" />
            </div>
        </div>

      </div>
    </div>
  );
}
