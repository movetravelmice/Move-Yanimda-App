import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Edit2,
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
  Coins
} from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore, DEFAULT_POPULAR_ROUTES } from '../../store/settingsStore';
import CountryFlag, { getCurrencySymbol } from '../../components/CountryFlag';
import ConfirmModal from '../../components/ConfirmModal';

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

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
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

            {/* Aktif Sayaç Rozeti */}
            <div style={{
              background: activeCount === 6 ? '#ecfdf5' : '#FDF2F8',
              border: `1.5px solid ${activeCount === 6 ? '#a7f3d0' : '#F9BED8'}`,
              color: activeCount === 6 ? '#059669' : '#D7147A',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '800',
              textAlign: 'center'
            }}>
              Vitrinde: <strong>{activeCount} / 6</strong>
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

            <button
              onClick={handleResetDefaults}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
              title="Varsayılan 8 şehri geri yükle"
            >
              <RotateCcw size={14} />
              <span>Varsayılanlar</span>
            </button>
          </div>
        </div>

        {/* 2. ROTA KARTLARI LİSTESİ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {routes.map((r, index) => {
            const isFeatured = Boolean(r.isActive);
            return (
              <div
                key={r.id || index}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: isFeatured ? '1.5px solid #F9BED8' : '1px solid #e2e8f0',
                  padding: '12px',
                  boxShadow: isFeatured ? '0 4px 14px rgba(215, 20, 122, 0.06)' : '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                {/* Sol Görsel Önizleme */}
                <div style={{
                  width: '90px',
                  height: '75px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#f1f5f9',
                  flexShrink: 0
                }}>
                  <img
                    src={r.image}
                    alt={r.city}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    background: 'rgba(15, 23, 42, 0.75)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    {getCurrencySymbol(r.currency) && (
                      <span style={{ color: '#fbbf24', fontWeight: '800' }}>{getCurrencySymbol(r.currency)}</span>
                    )}
                    <span>{r.currency}</span>
                  </div>
                </div>

                {/* Orta Bilgiler */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <CountryFlag flag={r.flag} country={r.country} size="sm" />
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      {r.city}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      ({r.country})
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    fontSize: '10.5px',
                    color: '#475569',
                    marginTop: '4px'
                  }}>
                    <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      🕒 {formatDuration(r.time)}
                    </span>
                    <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      ✈️ {formatDuration(r.flight)}
                    </span>
                    <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      🔌 {r.plug}
                    </span>
                  </div>
                </div>

                {/* Sağ Aksiyonlar: Aktif/Pasif Toggle + Sıralama + Düzenle/Sil */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {/* Vitrin Toggle Butonu */}
                  <button
                    onClick={() => handleToggleActive(r.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: isFeatured ? '#FDF2F8' : '#f8fafc',
                      color: isFeatured ? '#D7147A' : '#94a3b8',
                      border: `1px solid ${isFeatured ? '#F9BED8' : '#e2e8f0'}`,
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isFeatured ? '#D7147A' : '#cbd5e1'
                    }} />
                    <span>{isFeatured ? 'Vitrinde Aktif' : 'Pasif'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* Sıralama */}
                    <button
                      onClick={() => handleMoveOrder(index, 'up')}
                      disabled={index === 0}
                      style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                        width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1
                      }}
                      title="Yukarı Taşı"
                    >
                      <ArrowUp size={12} />
                    </button>

                    <button
                      onClick={() => handleMoveOrder(index, 'down')}
                      disabled={index === routes.length - 1}
                      style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                        width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: index === routes.length - 1 ? 'not-allowed' : 'pointer', opacity: index === routes.length - 1 ? 0.3 : 1
                      }}
                      title="Aşağı Taşı"
                    >
                      <ArrowDown size={12} />
                    </button>

                    {/* Düzenle */}
                    <button
                      onClick={() => handleOpenEdit(r)}
                      style={{
                        background: '#FDF2F8', border: '1px solid #F9BED8', color: '#D7147A', borderRadius: '6px',
                        width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Düzenle"
                    >
                      <Edit2 size={12} />
                    </button>

                    {/* Sil */}
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        background: '#fef2f2', border: '1px solid #fecdd3', color: '#dc2626', borderRadius: '6px',
                        width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. EKLE / DÜZENLE MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '22px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {editingRoute ? `${editingRoute.city} Rotasını Düzenle` : 'Yeni Popüler Rota Ekle'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {alertMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', color: '#dc2626', padding: '10px 12px', borderRadius: '10px', fontSize: '11.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{alertMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Şehir Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Örn: Roma"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Ülke Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Örn: İtalya"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Bayrak / Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={e => setFormData({ ...formData, flag: e.target.value })}
                    placeholder="Örn: 🇮🇹"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Para Birimi
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="EUR, USD, GBP, JPY..."
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Saat Farkı
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    placeholder="-1 Saat, +6 Saat"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Uçuş Süresi
                  </label>
                  <input
                    type="text"
                    value={formData.flight}
                    onChange={e => setFormData({ ...formData, flight: e.target.value })}
                    placeholder="2.5 Saat, 4 Saat"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Priz Tipi
                  </label>
                  <input
                    type="text"
                    value={formData.plug}
                    onChange={e => setFormData({ ...formData, plug: e.target.value })}
                    placeholder="Tip C/F, Tip G"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Görsel URL & Hazır Şablonlar */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Şehir Görsel URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }}
                />

                {/* Hızlı Fotoğraf Şablonları */}
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                  Veya Hazır Fotoğraflardan Seçin:
                </div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {PHOTO_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        city: formData.city || p.city,
                        country: formData.country || p.country,
                        flag: formData.flag === '🌍' ? p.flag : formData.flag,
                        image: p.url
                      })}
                      style={{
                        padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc',
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <CountryFlag flag={p.flag} country={p.country} size="sm" />
                        <span>{p.city}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vitrinde Göster Checkbox */}
              <div style={{
                background: '#FDF2F8', border: '1px solid #F9BED8', borderRadius: '12px', padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                    Vitrinde Göster (Aktif 6 Rota)
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Ana sayfadaki kaydırmalı kartlar arasında yer alır
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#D7147A', cursor: 'pointer' }}
                />
              </div>

              {/* Kaydet Butonu */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5, padding: '11px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', color: '#ffffff',
                    fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)'
                  }}
                >
                  {editingRoute ? 'Güncellemeyi Kaydet' : 'Rotayı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
