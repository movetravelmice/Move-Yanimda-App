import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Sparkles, 
  Image as ImageIcon, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronDown, 
  Map, 
  Calendar as CalendarIcon, 
  Upload, 
  Info,
  Users,
  Search,
  X,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

// Özel Temalı Uzman Seçim Açılır Menüsü (Avatar ve Bilgilerle)
function ExpertSelectDropdown({ 
  label, 
  value, 
  onChange, 
  experts = [], 
  currentUserEmail = '',
  placeholder = "-- Uzman Seçin (Yok) --", 
  allowClear = true,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const selectedExpert = experts.find(e => 
    (e.email && value && e.email.toLowerCase() === value.toLowerCase()) || 
    (e.id && e.id === value)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredExperts = experts.filter(e => {
    const qs = search.toLowerCase().trim();
    if (!qs) return true;
    return (e.name || '').toLowerCase().includes(qs) || (e.email || '').toLowerCase().includes(qs);
  });

  return (
    <div style={{ marginBottom: '14px', position: 'relative' }} ref={dropdownRef}>
      {label && (
        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </span>
          {selectedExpert && allowClear && (
            <span 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              style={{ fontSize: '10px', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}
            >
              Seçimi Kaldır
            </span>
          )}
        </label>
      )}

      {/* Trigger Box */}
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '12px',
          border: isOpen ? '1.5px solid var(--primary)' : '1px solid #cbd5e1',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
          minHeight: '46px'
        }}
      >
        {selectedExpert ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '1.5px solid var(--primary)', 
              flexShrink: 0, 
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={selectedExpert.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=60&w=100"} 
                alt={selectedExpert.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedExpert.name} {currentUserEmail && selectedExpert.email && selectedExpert.email.toLowerCase() === currentUserEmail.toLowerCase() ? '(Siz)' : ''}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedExpert.email}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <Users size={14} />
            </div>
            <span>{placeholder}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', paddingLeft: '6px' }}>
          <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
        </div>
      </div>

      {/* Floating Dropdown Menu Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'slideDown 0.15s ease-out'
        }}>
          {/* Quick Search */}
          {experts.length > 3 && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 8px' }}>
                <Search size={12} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Uzman veya e-posta ara..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', paddingLeft: '6px', width: '100%', color: '#1e293b' }}
                />
              </div>
            </div>
          )}

          <div style={{ maxHeight: '230px', overflowY: 'auto' }}>
            {allowClear && (
              <div 
                onClick={() => { onChange(''); setIsOpen(false); }}
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  background: !value ? '#f8fafc' : 'white',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = !value ? '#f8fafc' : 'white'}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Uzman Yok (Boş)</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>İkinci uzman atanmasın</div>
                </div>
              </div>
            )}

            {filteredExperts.map(exp => {
              const isSelected = (exp.email && value && exp.email.toLowerCase() === value.toLowerCase()) || exp.id === value;
              const isMe = currentUserEmail && exp.email && exp.email.toLowerCase() === currentUserEmail.toLowerCase();
              return (
                <div 
                  key={exp.id || exp.email}
                  onClick={() => { onChange(exp.email); setIsOpen(false); }}
                  style={{
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-light)' : 'white',
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'white'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ 
                      width: '34px', 
                      height: '34px', 
                      borderRadius: '50%', 
                      overflow: 'hidden', 
                      border: isSelected ? '2px solid var(--primary)' : '1px solid #e2e8f0', 
                      flexShrink: 0, 
                      background: '#f1f5f9',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                    }}>
                      <img 
                        src={exp.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=60&w=100"} 
                        alt={exp.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: isSelected ? 'var(--primary)' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.name} {isMe ? '(Siz)' : ''}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.email}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {filteredExperts.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                Eşleşen uzman bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateTour() {
    const navigate = useNavigate();
    const { tourId } = useParams();
    const { tours, addTour, editTour } = useTourStore();
    const currentUser = useAuthStore(state => state.user);
    
    const allUsers = useUserStore(state => state.users) || [];
    const currentEditingTour = tourId ? tours.find(t => t.id === tourId) : null;

    const expertsList = React.useMemo(() => {
        const list = [...allUsers.filter(u => u.role === 'expert' || u.role === 'admin')];
        
        // If current logged-in user is expert and not in list, add them
        if (currentUser && !list.some(e => e.id === currentUser.id || (e.email && e.email.toLowerCase() === currentUser.email?.toLowerCase()))) {
            list.push({
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar,
                role: currentUser.role
            });
        }

        // If tour being edited has expert1, ensure they are present in list
        if (currentEditingTour?.expert?.name) {
            const expEmail = (currentEditingTour.expert.email || '').toLowerCase().trim();
            const expName = currentEditingTour.expert.name;
            const expId = currentEditingTour.expert.id;
            const exists = list.some(e => 
                (expId && e.id === expId) || 
                (expEmail && e.email && e.email.toLowerCase() === expEmail) ||
                (e.name && e.name.toLowerCase().trim() === expName.toLowerCase().trim())
            );
            if (!exists) {
                list.push({
                    id: expId || 'tour_expert_1',
                    name: expName,
                    email: expEmail || `${expName.toLowerCase().replace(/\s+/g, '')}@move.com.tr`,
                    avatar: currentEditingTour.expert.avatar || '',
                    role: 'expert'
                });
            }
        }

        // If tour being edited has expert2, ensure they are present in list
        if (currentEditingTour?.expert2?.name) {
            const exp2Email = (currentEditingTour.expert2.email || '').toLowerCase().trim();
            const exp2Name = currentEditingTour.expert2.name;
            const exp2Id = currentEditingTour.expert2.id;
            const exists = list.some(e => 
                (exp2Id && e.id === exp2Id) || 
                (exp2Email && e.email && e.email.toLowerCase() === exp2Email) ||
                (e.name && e.name.toLowerCase().trim() === exp2Name.toLowerCase().trim())
            );
            if (!exists) {
                list.push({
                    id: exp2Id || 'tour_expert_2',
                    name: exp2Name,
                    email: exp2Email || `${exp2Name.toLowerCase().replace(/\s+/g, '')}@move.com.tr`,
                    avatar: currentEditingTour.expert2.avatar || '',
                    role: 'expert'
                });
            }
        }

        return list;
    }, [allUsers, currentUser, currentEditingTour]);

    const [tourName, setTourName] = useState('');
    const [destinations, setDestinations] = useState('');
    const [datesText, setDatesText] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [coverImage, setCoverImage] = useState('');
    
    // Expert states - NEVER default to currentUser if tourId is provided!
    const [selectedExpert1, setSelectedExpert1] = useState(() => {
        if (tourId) {
            const t = tours.find(tour => tour.id === tourId);
            if (t?.expert?.email) return t.expert.email;
        }
        return !tourId && currentUser?.role === 'expert' ? (currentUser.email || '') : '';
    });
    const [selectedExpert2, setSelectedExpert2] = useState(() => {
        if (tourId) {
            const t = tours.find(tour => tour.id === tourId);
            if (t?.expert2?.email) return t.expert2.email;
        }
        return '';
    });
    
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isManualImage, setIsManualImage] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ show: false, type: '', title: '', text: '' });
    const initialLoadedRef = useRef(false);

    // Compress image via Canvas to max 1200px width/height (<90KB)
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1200;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', 0.82) });
                        } else {
                            resolve({ blob: file, dataUrl: e.target.result });
                        }
                    }, 'image/jpeg', 0.82);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingImage(true);
        try {
            // 1. Compress image to max 1200px (guaranteed <100KB)
            const { blob, dataUrl } = await compressImage(file);
            setCoverImage(dataUrl);
            setIsManualImage(true);

            // 2. Try upload to Firebase Storage for permanent CDN URL
            try {
                const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                const { storage } = await import('../../lib/firebase');
                const safeId = tourId || 'new_' + Date.now();
                const fileRef = ref(storage, `tour_covers/${safeId}_${Date.now()}.jpg`);
                const snapshot = await uploadBytes(fileRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                if (downloadURL) {
                    setCoverImage(downloadURL);
                }
            } catch (storageErr) {
                console.warn("Storage upload failed, keeping compressed canvas dataUrl:", storageErr);
            }
        } catch (err) {
            console.error("Image processing error:", err);
            setPopupMsg({ show: true, type: 'error', title: 'Görsel Yüklenemedi', text: 'Görsel işlenirken bir sorun oluştu.' });
        } finally {
            setIsUploadingImage(false);
        }
    };

    useEffect(() => {
        if (tourId) {
            const tour = tours.find(t => t.id === tourId);
            if (tour) {
                if (!initialLoadedRef.current) {
                    initialLoadedRef.current = true;
                    setTourName(tour.name || '');
                    setDestinations(tour.destinations === 'Belirtilmedi' ? '' : (tour.destinations || ''));
                    setDatesText(tour.dates || '');
                    setCoverImage(tour.avatar || '');
                    if (tour.avatar || tour.isManualAvatar) {
                        setIsManualImage(true);
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

                // Expert 1 matching
                let exp1Match = null;
                const trNorm = (s) => (s || '').trim().toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
                const tExp1Email = (tour.expert?.email || '').toLowerCase().trim();
                const tExp1Name = tour.expert?.name || tour.guideName || '';
                const tExp1Id = tour.expert?.id || '';

                if (tExp1Email) {
                    exp1Match = expertsList.find(e => (e.email || '').toLowerCase().trim() === tExp1Email)?.email || tExp1Email;
                } else if (tExp1Id) {
                    exp1Match = expertsList.find(e => e.id === tExp1Id)?.email;
                } else if (tExp1Name) {
                    exp1Match = expertsList.find(e => trNorm(e.name) === trNorm(tExp1Name) || trNorm(e.name).includes(trNorm(tExp1Name)))?.email;
                }

                if (exp1Match) {
                    setSelectedExpert1(exp1Match);
                }

                // Expert 2 matching
                let exp2Match = null;
                const tExp2Email = (tour.expert2?.email || '').toLowerCase().trim();
                const tExp2Name = tour.expert2?.name || tour.guide2Name || '';
                const tExp2Id = tour.expert2?.id || '';

                if (tExp2Email) {
                    exp2Match = expertsList.find(e => (e.email || '').toLowerCase().trim() === tExp2Email)?.email || tExp2Email;
                } else if (tExp2Id) {
                    exp2Match = expertsList.find(e => e.id === tExp2Id)?.email;
                } else if (tExp2Name) {
                    exp2Match = expertsList.find(e => trNorm(e.name) === trNorm(tExp2Name) || trNorm(e.name).includes(trNorm(tExp2Name)))?.email;
                }

                if (exp2Match) {
                    setSelectedExpert2(exp2Match);
                } else if (!tour.expert2 && !tour.guide2Name) {
                    setSelectedExpert2('');
                }
            }
        }
    }, [tourId, tours, expertsList]);

    // AI Photo Fetcher using Wikipedia API
    useEffect(() => {
        if (destinations && destinations.trim().length > 2 && !isManualImage) {
            const timeout = setTimeout(() => {
                setIsAiLoading(true);
                
                const fetchImage = async () => {
                    const query = destinations.split(',')[0].trim();
                    let photoUrl = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800";

                    try {
                        let keyword = encodeURIComponent(query);
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
            }, 1200);

            return () => clearTimeout(timeout);
        } else if (!isManualImage && !tourId) {
             setCoverImage('');
        }
    }, [destinations, isManualImage, tourId]);

    // Smart Destination Detection in Tour Name
    const detectedDestWord = (() => {
        if (!tourName || tourName.trim().length < 3) return null;
        const trNormalize = (str) => (str || '')
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .trim();

        const normName = trNormalize(tourName);

        // 1. Check user-entered destination keywords
        if (destinations && destinations.trim().length >= 3) {
            const userDests = destinations.split(/[,-\/\s]+/).map(w => trNormalize(w)).filter(w => w.length >= 3);
            for (const destWord of userDests) {
                if (destWord && normName.includes(destWord)) {
                    return destWord.charAt(0).toUpperCase() + destWord.slice(1);
                }
            }
        }

        // 2. Common known destinations & countries
        const commonDests = [
            'italya', 'roma', 'floransa', 'venedik', 'milano', 'napoli',
            'fransa', 'paris', 'nice', 'lyon',
            'ispanya', 'madrid', 'barselona', 'barcelona', 'sevilla', 'valencia',
            'karadag', 'karadağ', 'kotor', 'budva', 'podgorica',
            'almanya', 'berlin', 'munih', 'munchen', 'frankfurt',
            'ingiltere', 'londra', 'manchester',
            'hollanda', 'amsterdam', 'rotterdam',
            'avusturya', 'viyana', 'salzburg',
            'cekya', 'prag', 'macaristan', 'budapeste', 'budapeşte',
            'yunanistan', 'atina', 'selanik', 'mikonos', 'santorini', 'girit',
            'balkan', 'balkanlar', 'bosna', 'saraybosna', 'mostar', 'makedonya', 'uskup', 'arnavutluk', 'tiran',
            'dubai', 'abu dabi', 'bae', 'misir', 'mısır', 'kahire', 'sarm', 'şarm', 'hurghada',
            'japonya', 'tokyo', 'kyoto', 'osaka',
            'tayland', 'bangkok', 'phuket', 'pattaya',
            'singapur', 'bali', 'endonezya', 'vietnam', 'kore', 'seul',
            'gurcistan', 'gürcistan', 'batum', 'tiflis', 'azerbaycan', 'baku', 'bakü',
            'turkiye', 'türkiye', 'kapadokya', 'antalya', 'mardin', 'karadeniz', 'gap', 'ege', 'istanbul', 'izmir', 'trabzon', 'bodrum', 'fethiye', 'cesme', 'çeşme'
        ];

        for (const cDest of commonDests) {
            const normCDest = trNormalize(cDest);
            if (normName.includes(normCDest)) {
                return cDest.charAt(0).toUpperCase() + cDest.slice(1);
            }
        }
        return null;
    })();

    const handleCreate = async () => {
        if (!tourName.trim()) {
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

        const existingTour = tourId ? tours.find(t => t.id === tourId) : null;
        const firstExpertObj = expertsList.find(u => 
            (u.email && (u.email || '').toLowerCase() === (selectedExpert1 || '').toLowerCase()) ||
            (u.id && u.id === selectedExpert1)
        );
        const expert1Data = firstExpertObj ? {
            id: firstExpertObj.id,
            name: firstExpertObj.name,
            avatar: firstExpertObj.avatar,
            email: (firstExpertObj.email || '').toLowerCase(),
            phone: firstExpertObj.phone || '+905321234567'
        } : (existingTour?.expert && (existingTour.expert.email === selectedExpert1 || !selectedExpert1) ? existingTour.expert : {
            name: currentUser?.name || 'Bölge Uzmanı',
            avatar: currentUser?.avatar || '',
            email: (currentUser?.email || '').toLowerCase(),
            phone: currentUser?.phone || '+905321234567'
        });

        const secondExpertObj = expertsList.find(u => 
            (u.email && (u.email || '').toLowerCase() === (selectedExpert2 || '').toLowerCase()) ||
            (u.id && u.id === selectedExpert2)
        );
        const expert2Data = secondExpertObj ? {
            id: secondExpertObj.id,
            name: secondExpertObj.name,
            avatar: secondExpertObj.avatar,
            email: (secondExpertObj.email || '').toLowerCase(),
            phone: secondExpertObj.phone || '+905321234568'
        } : (selectedExpert2 && existingTour?.expert2 && (existingTour.expert2.email === selectedExpert2 || existingTour.expert2.id === selectedExpert2) ? existingTour.expert2 : null);

        const finalDestinations = destinations?.trim() || "Belirtilmedi";

        try {
            if (tourId) {
                await editTour(tourId, {
                    name: tourName.trim(),
                    destinations: finalDestinations,
                    dates: finalDates,
                    guideName: expert1Data.name,
                    expert: expert1Data,
                    avatar: coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
                    expert2: expert2Data || null,
                    isManualAvatar: isManualImage
                });
                setPopupMsg({ show: true, type: 'success', title: 'Başarılı', text: 'Tur başarıyla güncellendi!' });
            } else {
                await addTour({
                    name: tourName.trim(),
                    destinations: finalDestinations,
                    dates: finalDates,
                    guideName: expert1Data.name,
                    expert: expert1Data,
                    expert2: expert2Data || null,
                    avatar: coverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
                    isManualAvatar: isManualImage
                });
                setPopupMsg({ show: true, type: 'success', title: 'Muazzam!', text: 'Yeni tur başarıyla yaratıldı.' });
            }
            
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            console.error("Tour save error:", err);
            setPopupMsg({ show: true, type: 'error', title: 'Hata Oluştu', text: `Tur kaydedilemedi: ${err.message || 'Lütfen bağlantınızı kontrol edin.'}` });
        }
    };

    const isAdmin = currentUser?.role === 'admin';
    const availableSecondExperts = expertsList.filter(u => u.email !== selectedExpert1);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '60px', position: 'relative' }}>
            
            {/* Custom Popup */}
            {popupMsg.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', borderRadius: '18px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: popupMsg.type === 'success' ? '#ecfdf5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                            <CheckCircle2 size={28} color={popupMsg.type === 'success' ? '#10b981' : '#ef4444'} />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-main)', textAlign: 'center' }}>{popupMsg.title}</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: popupMsg.type === 'error' ? '20px' : '0', lineHeight: 1.4 }}>{popupMsg.text}</p>
                        
                        {popupMsg.type === 'error' && (
                            <button className="btn-primary" onClick={() => setPopupMsg({ show: false, type: '', title: '', text: '' })} style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px' }}>
                                Anladım
                            </button>
                        )}
                        {popupMsg.type === 'success' && (
                            <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--primary)', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>Yönlendiriliyorsunuz...</div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: 'var(--primary)', color: 'white', padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Geri">
                        <ChevronLeft size={22} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 1px' }}>{tourId ? 'Turu Düzenle' : 'Yeni Tur Oluştur'}</h2>
                        <div style={{ fontSize: '10.5px', opacity: 0.85 }}>Sihirbaz</div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '16px' }}>
                
                {/* AI Cover Preview Section */}
                <div style={{ borderRadius: '16px', overflow: 'hidden', height: '140px', background: 'white', marginBottom: '16px', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    {coverImage ? (
                        <img loading="lazy" src={coverImage} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.4s' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ImageIcon size={36} style={{ opacity: 0.25, marginBottom: '6px' }} />
                            <div style={{ fontSize: '12px', fontWeight: '500' }}>Destinasyon yazın, AI resmi bulsun...</div>
                        </div>
                    )}

                    {isAiLoading && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <Sparkles size={26} color="var(--primary)" style={{ animation: 'pulse 1s infinite' }} />
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '6px' }}>Yapay Zeka Destinasyonu Seçiyor...</div>
                        </div>
                    )}

                    {isUploadingImage && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 10 }}>
                            <Loader2 size={26} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '6px' }}>Görsel Optimize Ediliyor...</div>
                        </div>
                    )}
                    
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 5 }}>
                        {isManualImage ? (
                            <button onClick={() => setIsManualImage(false)} style={{ border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.65)', color: '#fbbf24', padding: '5px 10px', borderRadius: '10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                                <Sparkles size={11} /> Asistan'a Dön
                            </button>
                        ) : (
                            <div style={{ background: 'rgba(0,0,0,0.65)', color: 'white', padding: '5px 10px', borderRadius: '10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                                <Sparkles size={11} color="#fbbf24" /> Akıllı Asistan
                            </div>
                        )}
                        <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.92)', color: 'var(--primary)', padding: '5px 10px', borderRadius: '10px', fontSize: '10.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                            <Upload size={11} /> {isManualImage ? 'Değiştir' : 'Görsel Yükle'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>

                {/* Form Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #edf2f7' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        Tur Temel Bilgileri
                    </h3>

                    {/* Tour Name Field */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px', display: 'block' }}>
                            Tur Adı <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                            type="text" 
                            value={tourName} 
                            onChange={e => setTourName(e.target.value)} 
                            placeholder="Örn: Bosch ile 27-30 Eylül 2026 Seyahati" 
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '12.5px', boxSizing: 'border-box' }} 
                        />
                        
                        {/* Destination Tip / Warning Banner if detected in Tour Name */}
                        {detectedDestWord && (
                            <div style={{
                                marginTop: '6px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: '#fffbeb',
                                border: '1px solid #fef3c7',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '7px',
                                fontSize: '11px',
                                color: '#92400e',
                                lineHeight: 1.35,
                                animation: 'fadeIn 0.2s'
                            }}>
                                <Info size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong>İpucu:</strong> Tur adına destinasyon ("{detectedDestWord}") yazmanıza gerek yoktur. Destinasyon tur kartında ve rehberde otomatik ayrıca gösterilmektedir.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Destinations Field */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Map size={13} color="var(--primary)" /> Destinasyonlar (Şehirler / Ülke)
                        </label>
                        <input 
                            type="text" 
                            value={destinations} 
                            onChange={e => setDestinations(e.target.value)} 
                            placeholder="Örn: Karadağ veya Roma, Floransa" 
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '12.5px', boxSizing: 'border-box' }} 
                        />
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                            Destinasyon girildiğinde kapak fotoğrafı ve rehber otomatik eşleşir.
                        </div>
                    </div>

                    {/* 1. Seyahat Uzmanı Seçimi (Baş Rehber) */}
                    <ExpertSelectDropdown 
                      label="1. Seyahat Uzmanı (Baş Rehber)"
                      value={selectedExpert1}
                      onChange={setSelectedExpert1}
                      experts={expertsList}
                      currentUserEmail={currentUser?.email}
                      placeholder="-- 1. Seyahat Uzmanı Seçin --"
                      allowClear={false}
                      required
                    />

                    {/* 2. Seyahat Uzmanı (Opsiyonel - Özel Tasarımlı Dropdown) */}
                    <ExpertSelectDropdown 
                      label="2. Seyahat Uzmanı (Opsiyonel)"
                      value={selectedExpert2}
                      onChange={setSelectedExpert2}
                      experts={availableSecondExperts}
                      currentUserEmail={currentUser?.email}
                      placeholder="-- Uzman Seçin (Yok) --"
                      allowClear={true}
                    />

                    {/* Dates Selection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CalendarIcon size={12} color="var(--primary)" /> Başlangıç Tarihi
                            </label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '12px', boxSizing: 'border-box' }} 
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CalendarIcon size={12} color="var(--primary)" /> Bitiş Tarihi
                            </label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '12px', boxSizing: 'border-box' }} 
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        className="btn-primary" 
                        onClick={handleCreate} 
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)' }}
                    >
                        <CheckCircle2 size={17} /> {tourId ? 'Değişiklikleri Kaydet' : 'Seyahati Kaydet'}
                    </button>

                </div>
            </div>
        </div>
    );
}
