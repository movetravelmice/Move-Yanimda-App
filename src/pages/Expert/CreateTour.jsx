import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, CheckCircle2, ChevronLeft, Map, Calendar as CalendarIcon, Upload } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

export default function CreateTour() {
    const navigate = useNavigate();
    const { tourId } = useParams();
    const { tours, addTour, editTour } = useTourStore();
    const currentUser = useAuthStore(state => state.user);
    
    const allUsers = useUserStore(state => state.users);
    const expertsList = allUsers.filter(u => u.role === 'expert');
    const otherExperts = expertsList.filter(u => u.email !== currentUser?.email);

    const [tourName, setTourName] = useState('');
    const [destinations, setDestinations] = useState('');
    const [datesText, setDatesText] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [selectedExpert2, setSelectedExpert2] = useState('');
    
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isManualImage, setIsManualImage] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setCoverImage(event.target.result);
            setIsManualImage(true);
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (tourId) {
            const tour = tours.find(t => t.id === tourId);
            if (tour) {
                setTourName(tour.name);
                setDestinations(tour.destinations);
                setDatesText(tour.dates);
                setCoverImage(tour.avatar);
                
                if (tour.expert2) {
                    setSelectedExpert2(tour.expert2.email || '');
                } else {
                    setSelectedExpert2('');
                }
                
                if (tour.dates && tour.dates.includes(' - ')) {
                    try {
                        const [startPart, endPart] = tour.dates.split(' - ');
                        const parseDateTr = (dateStr) => {
                            const monthsDict = { 'ocak': 1, 'şubat': 2, 'subat': 2, 'mart': 3, 'nisan': 4, 'mayıs': 5, 'mayis': 5, 'haziran': 6, 'temmuz': 7, 'ağustos': 8, 'agustos': 8, 'eylül': 9, 'eylul': 9, 'ekim': 10, 'kasım': 11, 'kasim': 11, 'aralık': 12, 'aralik': 12 };
                            const p = dateStr.trim().split(' ');
                            if (p.length >= 2) {
                                const d = parseInt(p[0]);
                                const mStr = p[1]?.toLowerCase().replace('ı', 'i').replace('ş', 's').replace('ğ', 'g').replace('ü', 'u').replace('ö', 'o').replace('ç', 'c');
                                const m = monthsDict[mStr];
                                const y = p[2] ? parseInt(p[2]) : new Date().getFullYear();
                                if (!isNaN(d) && m !== undefined) {
                                    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                }
                            }
                            return '';
                        };
                        setStartDate(parseDateTr(startPart));
                        setEndDate(parseDateTr(endPart));
                    } catch(e) {}
                }
            }
        }
    }, [tourId, tours]);

    // AI Photo Fetcher using Wikipedia API
    useEffect(() => {
        if (destinations.length > 2 && !isManualImage) {
            const timeout = setTimeout(() => {
                setIsAiLoading(true);
                
                const fetchImage = async () => {
                    const query = destinations.split(',')[0].trim();
                    let photoUrl = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800"; // default fallback

                    try {
                        let keyword = encodeURIComponent(query);
                        // Convert common keywords to match wiki easily (e.g., capitalize first letter)
                        keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                        
                        let response = await fetch(`https://tr.wikipedia.org/api/rest_v1/page/summary/${keyword}`);
                        if (!response.ok) {
                           response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${keyword}`);
                        }
                        
                        if (response.ok) {
                           const data = await response.json();
                           if (data.originalimage && data.originalimage.source) {
                               photoUrl = data.originalimage.source;
                           } else if (data.thumbnail && data.thumbnail.source) {
                               photoUrl = data.thumbnail.source.replace(/\/\d+px-/, '/800px-'); 
                           }
                        }
                    } catch (e) {
                         console.error("AI Photo fetch failed", e);
                    }

                    if (!isManualImage) setCoverImage(photoUrl);
                    setIsAiLoading(false);
                };

                fetchImage();
            }, 1200); // 1.2s typing delay

            return () => clearTimeout(timeout);
        } else if (!isManualImage) {
             setCoverImage('');
        }
    }, [destinations, isManualImage]);

    const handleCreate = () => {
        if (!tourName) {
            setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'Lütfen Tur Adını doldurun.' });
            return;
        }

        let finalDates = datesText;
        if (startDate && endDate) {
            finalDates = `${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(startDate))} - ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(endDate))}`;
        } else if (!finalDates) {
            setPopupMsg({ show: true, type: 'error', title: 'Eksik Bilgi', text: 'Lütfen tarih alanlarını doldurun.' });
            return;
        }

        const secondExpertObj = otherExperts.find(u => u.email === selectedExpert2);
        const expert2Data = secondExpertObj ? {
            name: secondExpertObj.name,
            avatar: secondExpertObj.avatar,
            email: secondExpertObj.email,
            phone: secondExpertObj.phone || '+905321234568'
        } : null;

        if (tourId) {
            editTour(tourId, {
                name: tourName,
                destinations: destinations || "Belirtilmedi",
                dates: finalDates,
                avatar: coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
                expert2: expert2Data || null
            });
            setPopupMsg({ show: true, type: 'success', title: 'Başarılı', text: 'Tur başarıyla güncellendi!' });
        } else {
            addTour({
                name: tourName,
                destinations: destinations || "Belirtilmedi",
                dates: finalDates,
                guideName: currentUser?.name || 'Bilinmiyor',
                expert: { 
                    name: currentUser?.name || 'Bilinmiyor',
                    avatar: currentUser?.avatar || '',
                    email: currentUser?.email || ''
                },
                expert2: expert2Data || null,
                avatar: coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800"
            });
            setPopupMsg({ show: true, type: 'success', title: 'Muazzam!', text: 'Yeni tur başarıyla yaratıldı.' });
        }
        
        setTimeout(() => navigate('/dashboard'), 2000);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '60px', position: 'relative' }}>
            
            {/* Custom Popup */}
            {popupMsg.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: popupMsg.type === 'success' ? '#ecfdf5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <CheckCircle2 size={32} color={popupMsg.type === 'success' ? '#10b981' : '#ef4444'} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>{popupMsg.title}</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: popupMsg.type === 'error' ? '24px' : '0', lineHeight: 1.5 }}>{popupMsg.text}</p>
                        
                        {popupMsg.type === 'error' && (
                            <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '12px', borderRadius: '12px' }}>
                                Anladım
                            </button>
                        )}
                        {popupMsg.type === 'success' && (
                            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>Yönlendiriliyorsunuz...</div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '4px' }}>
                        <ChevronLeft size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px' }}>{tourId ? 'Turu Düzenle' : 'Yeni Tur Oluştur'}</h2>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>Sihirbaz</div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '24px 16px' }}>
                
                {/* AI Cover Preview Section */}
                <div style={{ borderRadius: '24px', overflow: 'hidden', height: '200px', background: 'white', marginBottom: '32px', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                    {coverImage ? (
                        <img loading="lazy" src={coverImage} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.5s' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '8px' }} />
                            <div style={{ fontSize: '13px' }}>Destinasyon yazın, AI resmi bulsun...</div>
                        </div>
                    )}

                    {isAiLoading && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <Sparkles size={32} color="var(--primary)" style={{ animation: 'pulse 1s infinite' }} />
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>Yapay Zeka Destinasyonu Seçiyor...</div>
                        </div>
                    )}
                    
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                        {isManualImage ? (
                            <button onClick={() => setIsManualImage(false)} style={{ border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fbbf24', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                                <Sparkles size={12} /> Asistan'a Dön
                            </button>
                        ) : (
                            <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                                <Sparkles size={12} color="#fbbf24" /> Akıllı Asistan
                            </div>
                        )}
                        <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Upload size={12} /> {isManualImage ? 'Seçimi Değiştir' : 'Görsel Yükle'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-main)' }}>Tur Bilgileri</h3>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Tur Adı (Zorunlu)</label>
                        <input 
                            type="text" 
                            value={tourName} 
                            onChange={e => setTourName(e.target.value)} 
                            placeholder="Örn: Klasik İtalya Turu" 
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: '#f8fafc', fontSize: '15px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Map size={14} /> Destinasyonlar (AI Algılar)
                        </label>
                        <input 
                            type="text" 
                            value={destinations} 
                            onChange={e => setDestinations(e.target.value)} 
                            placeholder="Örn: Roma, Floransa, Venedik" 
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: '#f8fafc', fontSize: '15px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>2. Seyahat Uzmanı (Seçmeli)</label>
                        <select
                            value={selectedExpert2}
                            onChange={e => setSelectedExpert2(e.target.value)}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: '#f8fafc', fontSize: '15px', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                            <option value="">-- Uzman Seçin (Yok) --</option>
                            {otherExperts.map(exp => (
                                <option key={exp.id} value={exp.email}>{exp.name} ({exp.email})</option>
                            ))}
                        </select>
                    </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarIcon size={14} /> Başlangıç Tarihi
                                </label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)} 
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: '#f8fafc', fontSize: '14px' }} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarIcon size={14} /> Bitiş Tarihi
                                </label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)} 
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: '#f8fafc', fontSize: '14px' }} 
                                />
                            </div>
                        </div>

                    <button 
                        className="btn-primary" 
                        onClick={handleCreate} 
                        style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <CheckCircle2 size={22} /> {tourId ? 'Değişiklikleri Kaydet' : 'Seyahati Kaydet'}
                    </button>

                </div>
            </div>
        </div>
    );
}
