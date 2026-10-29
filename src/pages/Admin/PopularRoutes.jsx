import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Edit2,
  Edit3,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Plane,
  Zap,
  Coins,
  Eye,
  EyeOff,
  Upload,
  Link2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore, DEFAULT_POPULAR_ROUTES } from '../../store/settingsStore';
import CountryFlag, { getCurrencySymbol } from '../../components/CountryFlag';
import ConfirmModal from '../../components/ConfirmModal';
import { fetchDestinationPhoto } from '../../services/destinationImageService';

const formatDuration = (val) => val ? String(val).replace(/\bsa\b/gi, 'Saat').trim() : '';

// Preset high quality photos for quick selection in modal
const PHOTO_PRESETS = [
  { city: 'Roma', country: 'İtalya', flag: '🇮🇹', url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800' },
  { city: 'Londra', country: 'İngiltere', flag: '🇬🇧', url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800' },
  { city: 'Paris', country: 'Fransa', flag: '🇫🇷', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800' },
  { city: 'Dubai', country: 'BAE', flag: '🇦🇪', url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800' },
  { city: 'Tokyo', country: 'Japonya', flag: '🇯🇵', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800' },
  { city: 'Barselona', country: 'İspanya', flag: '🇪🇸', url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800' },
  { city: 'Amsterdam', country: 'Hollanda', flag: '🇳🇱', url: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&q=80&w=800' },
  { city: 'New York', country: 'ABD', flag: '🇺🇸', url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800' },
  { city: 'Viyana', country: 'Avusturya', flag: '🇦🇹', url: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=800' },
  { city: 'Prag', country: 'Çekya', flag: '🇨🇿', url: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&q=80&w=800' },
  { city: 'İstanbul', country: 'Türkiye', flag: '🇹🇷', url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=800' },
  { city: 'Atina', country: 'Yunanistan', flag: '🇬🇷', url: 'https://images.unsplash.com/photo-1555993539-1732916b8235?auto=format&fit=crop&q=80&w=800' }
];

export default function PopularRoutes() {
  const navigate = useNavigate();
  const { popularRoutes, setPopularRoutes } = useSettingsStore();

  const routes = (popularRoutes && Array.isArray(popularRoutes) && popularRoutes.length > 0)
    ? popularRoutes
    : DEFAULT_POPULAR_ROUTES;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [saveToast, setSaveToast] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [infoModalMsg, setInfoModalMsg] = useState(null);

  // AI & Manuel Resim Yükleme state
  const [isAiLoadingImage, setIsAiLoadingImage] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef(null);

  // Compress image via Canvas to max 1200px width/height (<100KB)
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
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImage(file);
      setFormData(prev => ({ ...prev, image: compressedDataUrl }));
    } catch (err) {
      console.error("Resim yükleme hatası:", err);
      setAlertMsg("Fotoğraf işlenirken bir sorun oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleFindAiImage = async (customCity, customCountry) => {
    const city = customCity !== undefined ? customCity : formData.city;
    const country = customCountry !== undefined ? customCountry : formData.country;
    if (!city || !city.trim()) {
      setAlertMsg("Lütfen önce bir şehir adı giriniz.");
      return;
    }
    setIsAiLoadingImage(true);
    setAlertMsg('');
    try {
      const photoUrl = await fetchDestinationPhoto(city.trim(), (country || '').trim());
      if (photoUrl) {
        setFormData(prev => ({ ...prev, image: photoUrl }));
      }
    } catch (err) {
      console.warn("AI görsel arama hatası:", err);
    } finally {
      setIsAiLoadingImage(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    city: '',
    country: '',
    flag: '🌍',
    image: '',
    currency: 'EUR',
    time: '-1 sa',
    flight: '3 sa',
    plug: 'Tip C/F',
    isActive: true
  });

  const activeCount = routes.filter(r => r.isActive).length;

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      city: '',
      country: '',
      flag: '🌍',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
      currency: 'EUR',
      time: '-1 Saat',
      flight: '3 Saat',
      plug: 'Tip C/F',
      isActive: activeCount < 6
    });
    setAlertMsg('');
    setShowManualUrl(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      city: route.city || '',
      country: route.country || '',
      flag: route.flag || '🌍',
      image: route.image || '',
      currency: route.currency || 'EUR',
      time: formatDuration(route.time) || '-1 Saat',
      flight: formatDuration(route.flight) || '3 Saat',
      plug: route.plug || 'Tip C/F',
      isActive: Boolean(route.isActive)
    });
    setAlertMsg('');
    setShowManualUrl(false);
    setModalOpen(true);
  };

  const handleToggleActive = (id) => {
    const target = routes.find(r => r.id === id);
    if (!target) return;

    if (!target.isActive && activeCount >= 6) {
      setInfoModalMsg("Vitrinde en fazla 6 rota aktif olabilir! Lütfen önce başka bir rotayı pasife alın.");
      return;
    }

    const updated = routes.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setPopularRoutes(updated);
    showToast();
  };

  const handleMoveOrder = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routes.length) return;

    const copy = [...routes];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setPopularRoutes(copy);
    showToast();
  };

  const handleDelete = (id) => {
    if (routes.length <= 4) {
      setInfoModalMsg("En az 4 adet rota kayıtlı olmalıdır.");
      return;
    }
    const target = routes.find(r => r.id === id);
    setRouteToDelete(target || { id });
  };

  const confirmDeleteRoute = () => {
    if (!routeToDelete) return;
    const updated = routes.filter(r => r.id !== routeToDelete.id);
    setPopularRoutes(updated);
    setRouteToDelete(null);
    showToast();
  };

  const handleResetDefaults = () => {
    setShowResetConfirm(true);
  };

  const confirmResetDefaults = () => {
    setShowResetConfirm(false);
    setPopularRoutes(DEFAULT_POPULAR_ROUTES);
    showToast();
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formData.city.trim() || !formData.country.trim()) {
      setAlertMsg("Lütfen şehir ve ülke adını giriniz.");
      return;
    }

    if (formData.isActive && !editingRoute?.isActive && activeCount >= 6) {
      setAlertMsg("Vitrinde en fazla 6 rota aktif olabilir. Lütfen 'Vitrinde Göster' kutucuğunun işaretini kaldırın veya mevcut aktif rotalardan birini pasife alın.");
      return;
    }

    let updated;
    if (editingRoute) {
      // Edit existing
      updated = routes.map(r => r.id === editingRoute.id ? {
        ...r,
        ...formData
      } : r);
    } else {
      // Add new
      const newId = formData.city.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      const newRoute = {
        id: newId,
        ...formData,
        order: routes.length + 1
      };
      updated = [newRoute, ...routes];
    }

    setPopularRoutes(updated);
    setModalOpen(false);
    showToast();
  };

  const showToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // -------------------------------------------------------------
  // ROTA EKLE / DÜZENLEME TAM SAYFA GÖRÜNÜMÜ
  // -------------------------------------------------------------
  if (modalOpen) {
    return (
      <div style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
        <Header
          title={editingRoute ? `${editingRoute.city} Rotasını Düzenle` : 'Yeni Popüler Rota Ekle'}
          showBack
          onBack={() => setModalOpen(false)}
        />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 14px' }}>
          {alertMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecdd3',
              color: '#dc2626',
              padding: '12px 14px',
              borderRadius: '14px',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
            }}>
              <AlertTriangle size={17} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: '600' }}>{alertMsg}</span>
            </div>
          )}

          {/* CANLI KART ÖNİZLEMESİ */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            marginBottom: '16px',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#D7147A" />
              <span>Canlı Kart Önizlemesi</span>
            </div>

            {/* Önizleme Kartı */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: formData.isActive ? '1.5px solid #F9BED8' : '1px solid #edf2f7',
              boxShadow: formData.isActive ? '0 4px 18px rgba(215, 20, 122, 0.08)' : '0 4px 18px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 1', overflow: 'hidden', background: '#0f172a' }}>
                <img
                  src={formData.image || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800'}
                  alt={formData.city || 'Şehir'}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.5) 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Bayrak & Para Birimi */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  padding: '3px 9px',
                  borderRadius: '30px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 2
                }}>
                  <CountryFlag flag={formData.flag} country={formData.country} size="sm" />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                    {getCurrencySymbol(formData.currency) && (
                      <span style={{ color: '#d97706', marginRight: '3px', fontWeight: '900' }}>{getCurrencySymbol(formData.currency)}</span>
                    )}
                    {formData.currency || 'EUR'}
                  </span>
                </div>

                {/* Ülke */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  zIndex: 2
                }}>
                  <MapPin size={13} color="#ffffff" />
                  <span>{formData.country || 'Ülke Adı'}</span>
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  zIndex: 2
                }}>
                  Önizleme
                </div>
              </div>

              <div style={{ padding: '14px 16px 16px 16px' }}>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  margin: '0 0 10px 0',
                  padding: '0 2px',
                  color: '#1e293b',
                  lineHeight: '1.4',
                  letterSpacing: '-0.2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{formData.city || 'Şehir Adı'}</span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>({formData.country || 'Ülke'})</span>
                </h2>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid #f1f5f9',
                  gap: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#475569',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <Clock size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>{formatDuration(formData.time) || '-1 Saat'}</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <Plane size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>{formatDuration(formData.flight) || '3 Saat'}</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <Zap size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>{formData.plug || 'Tip C/F'}</span>
                  </div>

                  <span style={{
                    background: formData.isActive ? 'var(--primary-light)' : '#f1f5f9',
                    color: formData.isActive ? 'var(--primary)' : '#64748b',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    padding: '3px 7px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {formData.isActive ? 'Vitrinde' : 'Yedek Rota'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveModal}>
            {/* 1. KART: ŞEHİR & ÜLKE BİLGİLERİ */}
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="#D7147A" />
                <span>Şehir ve Konum Bilgileri</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Şehir Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    onBlur={e => {
                      if (e.target.value.trim().length >= 3 && (!formData.image || formData.image.includes('images.unsplash.com/photo-1552832230') || formData.image.includes('photo-1502602898657'))) {
                        handleFindAiImage(e.target.value.trim(), formData.country);
                      }
                    }}
                    placeholder="Örn: Roma, Tokyo..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Ülke Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    onBlur={e => {
                      if (formData.city && formData.city.trim().length >= 3 && (!formData.image || formData.image.includes('images.unsplash.com/photo-1552832230') || formData.image.includes('photo-1502602898657'))) {
                        handleFindAiImage(formData.city.trim(), e.target.value.trim());
                      }
                    }}
                    placeholder="Örn: İtalya, Japonya..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Bayrak / Ülke Kodu
                  </label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={e => setFormData({ ...formData, flag: e.target.value })}
                    placeholder="Örn: IT, JP veya 🇮🇹"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Para Birimi
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="EUR, USD, JPY, GBP..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. KART: SEYAHAT PRATİK BİLGİLERİ */}
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#D7147A" />
                <span>Seyahat Pratik Bilgileri</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Saat Farkı
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    placeholder="-1 Saat, +6 Saat"
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Uçuş Süresi
                  </label>
                  <input
                    type="text"
                    value={formData.flight}
                    onChange={e => setFormData({ ...formData, flight: e.target.value })}
                    placeholder="2.5 Saat, 11 Saat"
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Priz Tipi
                  </label>
                  <input
                    type="text"
                    value={formData.plug}
                    onChange={e => setFormData({ ...formData, plug: e.target.value })}
                    placeholder="Tip C/F, Tip A/B"
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
              </div>
            </div>

            {/* 3. KART: KAPAK GÖRSELİ (AI OTOMATİK + MANUEL YÜKLEME) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#D7147A" />
                  <span>Kapak Görseli</span>
                </div>
                <span style={{ fontSize: '11px', color: '#D7147A', fontWeight: '700', background: '#FDF2F8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #F9BED8' }}>
                  Yapay Zeka Destekli
                </span>
              </div>

              {/* Görsel Önizleme Thumbnail ve AI / Manuel Butonları */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '14px', flexWrap: 'wrap' }}>
                {/* Thumbnail */}
                <div style={{
                  width: '90px',
                  height: '66px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  flexShrink: 0,
                  position: 'relative',
                  border: '1px solid #cbd5e1'
                }}>
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Kapak"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}
                  {isAiLoadingImage && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(15, 23, 42, 0.7)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      gap: '2px'
                    }}>
                      <Loader2 size={18} className="animate-spin" />
                      <span style={{ fontSize: '8px', fontWeight: '700' }}>AI</span>
                    </div>
                  )}
                </div>

                {/* Butonlar */}
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* AI ile Şehir Fotoğrafı Bul */}
                    <button
                      type="button"
                      onClick={() => handleFindAiImage()}
                      disabled={isAiLoadingImage}
                      style={{
                        flex: 1,
                        minWidth: '130px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                        color: '#D7147A',
                        border: '1px solid #F9BED8',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: isAiLoadingImage ? 'wait' : 'pointer',
                        boxShadow: '0 2px 6px rgba(215, 20, 122, 0.12)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isAiLoadingImage ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>AI Aranıyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} color="#D7147A" />
                          <span>AI ile Resim Bul</span>
                        </>
                      )}
                    </button>

                    {/* Manuel Resim Yükle Butonu */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Upload size={14} color="#475569" />
                      <span>Resim Yükle</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Yapay zeka şehir ve ülke adına göre en uygun fotoğrafı bulur veya galerinizden seçebilirsiniz.
                  </div>
                </div>
              </div>

              {/* Opsiyonel Manuel URL Akordeon */}
              <div style={{ marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '2px 0'
                  }}
                >
                  <Link2 size={12} />
                  <span>{showManualUrl ? 'Görsel URL Alanını Kapat' : 'Veya Manuel URL ile Belirle'}</span>
                </button>

                {showManualUrl && (
                  <div style={{ marginTop: '6px' }}>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      style={{
                        width: '100%',
                        padding: '9px 11px',
                        borderRadius: '9px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#f8fafc'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Hızlı Popüler Şehir Fotoğrafları */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
                  Veya Popüler Şehirlerden Seçin:
                </div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {PHOTO_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        city: formData.city || p.city,
                        country: formData.country || p.country,
                        flag: (!formData.flag || formData.flag === '🌍') ? p.flag : formData.flag,
                        image: p.url
                      })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CountryFlag flag={p.flag} country={p.country} size="sm" />
                      <span>{p.city}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. KART: VİTRİNDE GÖSTER AYARI */}
            <div style={{
              background: '#FDF2F8',
              border: '1.5px solid #F9BED8',
              borderRadius: '18px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="#D7147A" />
                  <span>Vitrinde Göster (Aktif 6 Rota)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Ana sayfadaki kaydırmalı rota vitrininde ziyaretçilere sergilenir
                </div>
              </div>

              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#D7147A', cursor: 'pointer' }}
              />
            </div>

            {/* 5. AKSİYON BUTONLARI */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 10
            }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                İptal / Vazgeç
              </button>

              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: '13px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(215, 20, 122, 0.28)'
                }}
              >
                {editingRoute ? 'Güncellemeyi Kaydet' : 'Rotayı Kaydet'}
              </button>
            </div>

            {/* Alt Menü ve Tintin Butonu İçin Ekstra Boşluk Alanı */}
            <div style={{ height: '110px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 0px))', background: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
      <Header title="Popüler Rotalar Vitrini" showBack />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 14px' }}>

        {/* 1. ÜST BİLGİ & DURUM KARTI */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#FDF2F8',
                color: '#D7147A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Compass size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Popüler Rotalar & Vitrin Seçimi
                </h1>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Ana sayfa açılışında ziyaretçilere gösterilen 6 rotayı yönetin
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '11.5px',
            color: '#475569',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #f1f5f9'
          }}>
            <Sparkles size={16} color="#D7147A" style={{ flexShrink: 0 }} />
            <span>
              Burada seçtiğiniz aktif <strong>6 şehir</strong>, ana sayfada görseli, para birimi, saat farkı ve priz bilgileriyle kaydırmalı kart olarak sunulur. Ziyaretçiler karta tıkladığında yapay zeka şehir rehberine erişir.
            </span>
          </div>

          {/* Aksiyon Butonları */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={handleOpenAdd}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(215, 20, 122, 0.22)'
              }}
            >
              <PlusCircle size={15} />
              <span>Yeni Rota Ekle</span>
            </button>
          </div>
        </div>

        {/* 2. ROTA KARTLARI LİSTESİ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {routes.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              Henüz kayıtlı bir rota bulunamadı.
            </div>
          ) : (
            routes.map((r, index) => {
              const isFeatured = Boolean(r.isActive);
              return (
                <div
                  key={r.id || index}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: isFeatured ? '1.5px solid #F9BED8' : '1px solid #edf2f7',
                    boxShadow: isFeatured ? '0 4px 18px rgba(215, 20, 122, 0.08)' : '0 4px 18px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Top Full-Bleed Cover Image with Badges */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 1', overflow: 'hidden', background: '#0f172a' }}>
                    <img
                      loading="lazy"
                      src={r.image}
                      alt={r.city}
                      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                    />

                    {/* Subtle Gradient Shadow */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.5) 100%)',
                      pointerEvents: 'none'
                    }} />

                    {/* Top Left Badge: Flag & Currency */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        padding: '3px 9px',
                        borderRadius: '30px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        zIndex: 2
                      }}
                    >
                      <CountryFlag flag={r.flag} country={r.country} size="sm" />
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                        {getCurrencySymbol(r.currency) && (
                          <span style={{ color: '#d97706', marginRight: '3px', fontWeight: '900' }}>{getCurrencySymbol(r.currency)}</span>
                        )}
                        {r.currency}
                      </span>
                    </div>

                    {/* Bottom Left inside cover: Country Name */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                      zIndex: 2
                    }}>
                      <MapPin size={13} color="#ffffff" />
                      <span>{r.country}</span>
                    </div>

                    {/* Bottom Right inside cover: Order index */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      background: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      zIndex: 2
                    }}>
                      Sıra #{index + 1}
                    </div>
                  </div>

                  {/* Card Body Content */}
                  <div style={{ padding: '14px 16px 16px 16px' }}>

                    {/* Route Title */}
                    <h2 style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      margin: '0 0 10px 0',
                      padding: '0 2px',
                      color: '#1e293b',
                      lineHeight: '1.4',
                      letterSpacing: '-0.2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{r.city}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>({r.country})</span>
                    </h2>

                    {/* Info Strip (Time, Flight, Plug & Badge) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                      marginBottom: '12px',
                      gap: '8px',
                      overflow: 'hidden',
                      flexWrap: 'nowrap'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'clamp(10px, 2.9vw, 11.5px)',
                        color: '#475569',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <Clock size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span>{formatDuration(r.time)}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <Plane size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span>{formatDuration(r.flight)}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <Zap size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span>{r.plug}</span>
                      </div>

                      <span style={{
                        background: isFeatured ? 'var(--primary-light)' : '#f1f5f9',
                        color: isFeatured ? 'var(--primary)' : '#64748b',
                        fontSize: 'clamp(9.5px, 2.7vw, 11px)',
                        fontWeight: '700',
                        padding: '3px 7px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {isFeatured ? 'Vitrinde' : 'Yedek Rota'}
                      </span>
                    </div>

                    {/* Side-by-Side Action Buttons Grid (5 Buton) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {/* 1. Düzenle */}
                      <button
                        onClick={() => handleOpenEdit(r)}
                        title="Rotayı Düzenle"
                        style={{
                          aspectRatio: '1',
                          width: '100%',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(71,85,105,0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Edit3 size={18} color="#475569" strokeWidth={2.2} />
                      </button>

                      {/* 2. Vitrinde Aktif / Pasif Toggle */}
                      <button
                        onClick={() => handleToggleActive(r.id)}
                        title={isFeatured ? "Vitrinde Aktif (Pasife Almak için tıklayın)" : "Vitrinde Pasif (Vitrine Eklemek için tıklayın)"}
                        style={{
                          aspectRatio: '1',
                          width: '100%',
                          background: isFeatured ? '#FDF2F8' : '#f8fafc',
                          border: `1px solid ${isFeatured ? '#F9BED8' : '#e2e8f0'}`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = isFeatured ? '#fce7f3' : '#f1f5f9';
                          e.currentTarget.style.borderColor = isFeatured ? '#f472b6' : '#cbd5e1';
                          e.currentTarget.style.boxShadow = isFeatured ? '0 3px 10px rgba(215,20,122,0.2)' : '0 3px 10px rgba(71,85,105,0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = isFeatured ? '#FDF2F8' : '#f8fafc';
                          e.currentTarget.style.borderColor = isFeatured ? '#F9BED8' : '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {isFeatured ? (
                          <Eye size={18} color="#D7147A" strokeWidth={2.2} />
                        ) : (
                          <EyeOff size={18} color="#94a3b8" strokeWidth={2.2} />
                        )}
                        {isFeatured && (
                          <span style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#D7147A',
                            boxShadow: '0 0 5px rgba(215,20,122,0.8)'
                          }} />
                        )}
                      </button>

                      {/* 3. Sıralamada Yukarı Taşı */}
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title={index === 0 ? "En başta" : "Sıralamada Yukarı Taşı"}
                        style={{
                          aspectRatio: '1',
                          width: '100%',
                          background: index === 0 ? '#f8fafc' : '#eff6ff',
                          border: `1px solid ${index === 0 ? '#e2e8f0' : '#dbeafe'}`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.35 : 1,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onMouseEnter={e => {
                          if (index !== 0) {
                            e.currentTarget.style.background = '#dbeafe';
                            e.currentTarget.style.borderColor = '#93c5fd';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(37,99,235,0.18)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (index !== 0) {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#dbeafe';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <ArrowUp size={18} color={index === 0 ? '#94a3b8' : '#2563eb'} strokeWidth={2.2} />
                      </button>

                      {/* 4. Sıralamada Aşağı Taşı */}
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === routes.length - 1}
                        title={index === routes.length - 1 ? "En sonda" : "Sıralamada Aşağı Taşı"}
                        style={{
                          aspectRatio: '1',
                          width: '100%',
                          background: index === routes.length - 1 ? '#f8fafc' : '#f0fdf4',
                          border: `1px solid ${index === routes.length - 1 ? '#e2e8f0' : '#dcfce7'}`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: index === routes.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === routes.length - 1 ? 0.35 : 1,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onMouseEnter={e => {
                          if (index !== routes.length - 1) {
                            e.currentTarget.style.background = '#dcfce7';
                            e.currentTarget.style.borderColor = '#86efac';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(22,163,74,0.18)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (index !== routes.length - 1) {
                            e.currentTarget.style.background = '#f0fdf4';
                            e.currentTarget.style.borderColor = '#dcfce7';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <ArrowDown size={18} color={index === routes.length - 1 ? '#94a3b8' : '#16a34a'} strokeWidth={2.2} />
                      </button>

                      {/* 5. Sil */}
                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Rotayı Sil"
                        style={{
                          aspectRatio: '1',
                          width: '100%',
                          background: '#fef2f2',
                          border: '1px solid #fee2e2',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.borderColor = '#fca5a5';
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(239,68,68,0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.borderColor = '#fee2e2';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Trash2 size={18} color="#ef4444" strokeWidth={2.2} />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Alt Menü ve Tintin Butonu İçin Ekstra Boşluk */}
        <div style={{ height: '90px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

      </div>

      {/* Kaydedildi Toast Bildirimi */}
      {saveToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 10000
        }}>
          <CheckCircle2 size={16} color="#4ade80" />
          <span>Popüler rotalar güncellendi ve kaydedildi!</span>
        </div>
      )}

      {/* Delete Route Modal */}
      <ConfirmModal
        isOpen={Boolean(routeToDelete)}
        title="Rotayı Sil"
        message={`"${routeToDelete?.city || 'Bu'}" rotasını vitrinden silmek istediğinize emin misiniz?`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        type="danger"
        onConfirm={confirmDeleteRoute}
        onClose={() => setRouteToDelete(null)}
      />

      {/* Reset Defaults Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Varsayılana Sıfırla"
        message="Tüm popüler rotalar sistem varsayılanı olan 8 şehre sıfırlansın mı? Özelleştirilmiş rotalarınız silinecektir."
        confirmText="Evet, Sıfırla"
        cancelText="Vazgeç"
        type="warning"
        icon={RotateCcw}
        onConfirm={confirmResetDefaults}
        onClose={() => setShowResetConfirm(false)}
      />

      {/* Info / Warning Alert Modal */}
      <ConfirmModal
        isOpen={Boolean(infoModalMsg)}
        title="Bilgilendirme"
        message={infoModalMsg}
        confirmText="Tamam"
        cancelText="Kapat"
        type="info"
        onConfirm={() => setInfoModalMsg(null)}
        onClose={() => setInfoModalMsg(null)}
      />

    </div>
  );
}
