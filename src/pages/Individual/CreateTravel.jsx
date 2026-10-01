import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Luggage,
  Calendar,
  FileText,
  Loader2,
  PlaneTakeoff,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import LocationSearchInput from '../../components/LocationSearchInput';
import CustomDatePicker from '../../components/CustomDatePicker';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import {
  fetchDestinationPhoto,
  formatTravelDuration,
  generateAutoTravelTitle,
  DEFAULT_TRAVEL_COVER
} from '../../services/destinationImageService';

export default function CreateTravel() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const user = useAuthStore(state => state.user);

  const travels = useIndividualStore(state => state.travels);
  const addTravel = useIndividualStore(state => state.addTravel);
  const updateTravel = useIndividualStore(state => state.updateTravel);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isTitleManual = useRef(Boolean(editId));

  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    origin: 'İstanbul, Türkiye',
    originCity: 'İstanbul',
    originCountry: 'Türkiye',
    destination: '',
    city: '',
    country: '',
    countryCode: '',
    coverImage: DEFAULT_TRAVEL_COVER,
    notes: ''
  });

  // If edit mode, load travel
  useEffect(() => {
    if (editId) {
      setIsEditing(true);
      isTitleManual.current = true;
      const existing = travels.find(t => t.id === editId);
      if (existing) {
        setFormData({
          title: existing.title || '',
          startDate: existing.startDate || '',
          endDate: existing.endDate || '',
          origin: existing.origin || 'İstanbul, Türkiye',
          originCity: existing.originCity || (existing.origin ? existing.origin.split(',')[0].trim() : 'İstanbul'),
          originCountry: existing.originCountry || '',
          destination: existing.destination || '',
          city: existing.city || '',
          country: existing.country || '',
          countryCode: existing.countryCode || '',
          coverImage: existing.coverImage || existing.avatar || existing.image || DEFAULT_TRAVEL_COVER,
          notes: existing.notes || ''
        });
      }
    }
  }, [editId, travels]);

  // When destination is selected via AJAX search
  const handleSelectDestination = async (loc) => {
    const cityName = loc.city;
    const countryName = loc.country;
    const formatted = loc.fullName || `${cityName}, ${countryName}`;

    setFormData(prev => {
      const updatedTitle = !isTitleManual.current
        ? generateAutoTravelTitle(cityName, prev.startDate, prev.endDate)
        : prev.title;

      return {
        ...prev,
        destination: formatted,
        city: cityName,
        country: countryName,
        countryCode: loc.countryCode || '',
        title: updatedTitle || prev.title
      };
    });

    if (cityName) {
      setIsImageLoading(true);
      try {
        const photoUrl = await fetchDestinationPhoto(cityName, countryName);
        setFormData(prev => ({ ...prev, coverImage: photoUrl }));
      } catch (err) {
        console.warn("Cover image update failed:", err);
      } finally {
        setIsImageLoading(false);
      }
    }
  };

  const handleStartDateChange = (newDate) => {
    setFormData(prev => {
      const updatedTitle = !isTitleManual.current
        ? generateAutoTravelTitle(prev.city, newDate, prev.endDate)
        : prev.title;
      return {
        ...prev,
        startDate: newDate,
        title: updatedTitle || prev.title
      };
    });
  };

  const handleEndDateChange = (newDate) => {
    setFormData(prev => {
      const updatedTitle = !isTitleManual.current
        ? generateAutoTravelTitle(prev.city, prev.startDate, newDate)
        : prev.title;
      return {
        ...prev,
        endDate: newDate,
        title: updatedTitle || prev.title
      };
    });
  };

  // When departure point is selected via AJAX search
  const handleSelectOrigin = (loc) => {
    setFormData(prev => ({
      ...prev,
      origin: loc.fullName || `${loc.city}, ${loc.country}`,
      originCity: loc.city,
      originCountry: loc.country
    }));
  };

  const durationText = formatTravelDuration(formData.startDate, formData.endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMsg('Lütfen seyahat adını girin.');
      return;
    }

    if (!formData.destination.trim()) {
      setErrorMsg('Lütfen varış noktasını seçin.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const travelPayload = {
        title: formData.title.trim(),
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        origin: formData.origin || 'İstanbul, Türkiye',
        originCity: formData.originCity || '',
        originCountry: formData.originCountry || '',
        destination: formData.destination.trim(),
        city: formData.city || '',
        country: formData.country || '',
        countryCode: formData.countryCode || '',
        coverImage: formData.coverImage || DEFAULT_TRAVEL_COVER,
        avatar: formData.coverImage || DEFAULT_TRAVEL_COVER,
        notes: formData.notes.trim()
      };

      if (isEditing && editId) {
        await updateTravel(editId, travelPayload);
        navigate('/individual/travels');
      } else {
        const createdTravel = await addTravel({
          ...travelPayload,
          userId: user?.id || 'guest_user',
          userName: user?.name || 'Ben',
          userEmail: user?.email || ''
        });
        // Seyahat eklendiğinde seyahat bütçesi otomatik açılsın
        navigate(`/individual/budget?travelId=${createdTravel.id}`);
      }
    } catch (err) {
      console.error("Seyahat kaydedilemedi:", err);
      setErrorMsg('Kaydedilirken bir hata oluştu: ' + (err.message || 'Lütfen tekrar deneyin.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px 14px', maxWidth: '640px', margin: '0 auto' }}>
      
      {/* 1. Üst Başlık Kartı (Geri Oku - Dikey Çizgi - Başlık) */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
        borderRadius: '18px',
        border: '1.2px solid #F9BED8',
        padding: '13px 16px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          type="button"
          onClick={() => navigate('/individual/travels')}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            borderRadius: '8px',
            transition: 'transform 0.12s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          title="Geri Dön"
        >
          <ArrowLeft size={17} strokeWidth={2.4} />
        </button>

        {/* Dikey Çizgi */}
        <div style={{
          width: '1.5px',
          height: '18px',
          background: '#F9BED8',
          flexShrink: 0
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Luggage size={15} color="#D7147A" />
          <h1 style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.2px'
          }}>
            {isEditing ? 'Seyahati Düzenle' : 'Yeni Seyahat Planı'}
          </h1>
        </div>
      </div>

      {!user && (
        <GuestNoticeBanner
          customTitle="Seyahatiniz Tarayıcıda Saklanacaktır"
          customMessage="Giriş yapmadığınız için bu seyahat geçici hafızada tutulur. Kalıcı olarak tüm cihazlarınızda kaydetmek için profilinizden giriş yapabilirsiniz."
        />
      )}

      {/* Ana Form Kartı */}
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1.2px solid #F9BED8',
        boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.06)',
        overflow: 'visible',
        position: 'relative'
      }}>

        {/* 2. Yazısız, Temiz Canlı Kapak Görseli */}
        <div style={{
          position: 'relative',
          height: '160px',
          width: '100%',
          background: '#f1f5f9',
          borderTopLeftRadius: '17px',
          borderTopRightRadius: '17px',
          overflow: 'hidden'
        }}>
          <img
            src={formData.coverImage || DEFAULT_TRAVEL_COVER}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isImageLoading ? 'brightness(0.6)' : 'none',
              transition: 'all 0.3s ease',
              display: 'block'
            }}
          />

          {/* Gün Sayısı Rozeti (Sağ Üst) */}
          {durationText && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 247, 237, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1.2px solid #F9BED8',
              color: '#D7147A',
              fontSize: '11px',
              fontWeight: '800',
              padding: '4px 12px',
              borderRadius: '9999px',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
              letterSpacing: '0.2px',
              display: 'inline-flex',
              alignItems: 'center',
              zIndex: 3
            }}>
              {durationText}
            </div>
          )}

          {isImageLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.35)'
            }}>
              <Loader2 size={24} className="animate-spin" color="#ffffff" />
            </div>
          )}
        </div>

        {/* 3. Dengeli ve Orantılı Form Alanları */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '11.5px',
              fontWeight: '600'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Seyahat Adı */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '5px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                <Luggage size={13} color="#D7147A" />
                <span>Seyahat Adı</span>
                <span style={{ color: '#ef4444' }}>*</span>
              </label>

              {(formData.city || formData.startDate || formData.endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    isTitleManual.current = false;
                    const autoTitle = generateAutoTravelTitle(formData.city, formData.startDate, formData.endDate);
                    if (autoTitle) {
                      setFormData(prev => ({ ...prev, title: autoTitle }));
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: '#D7147A',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="Tarih ve şehirden seyahat adını otomatik oluştur"
                >
                  <Sparkles size={10} />
                  <span>Otomatik Güncelle</span>
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Örn: 30.09 - 01.10.2026 Antalya Seyahatim"
              value={formData.title}
              onChange={e => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, title: val }));
                isTitleManual.current = Boolean(val.trim());
              }}
              required
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                borderRadius: '11px',
                border: '1.2px solid #cbd5e1',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#D7147A'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Çıkış Noktası */}
          <div>
            <LocationSearchInput
              label="Çıkış Noktası"
              placeholder="Şehir veya havalimanı ara (Örn: İstanbul...)"
              value={formData.origin}
              country={formData.originCountry}
              onSelect={handleSelectOrigin}
              type="origin"
              required
            />
          </div>

          {/* Varış Noktası */}
          <div>
            <LocationSearchInput
              label="Varış Noktası"
              placeholder="Varış şehri veya ülkesi ara (Örn: Roma, Paris...)"
              value={formData.destination}
              country={formData.country}
              countryCode={formData.countryCode}
              onSelect={handleSelectDestination}
              type="destination"
              required
            />
          </div>

          {/* Seyahat Tarihleri (2 Sütun Eşit ve Orantılı Özel Takvim) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <CustomDatePicker
              label="Başlangıç Tarihi"
              value={formData.startDate}
              onChange={handleStartDateChange}
              companionDate={formData.endDate}
              align="left"
              placeholder="Tarih seçin"
            />

            <CustomDatePicker
              label="Bitiş Tarihi"
              value={formData.endDate}
              minDate={formData.startDate || undefined}
              onChange={handleEndDateChange}
              companionDate={formData.startDate}
              isEndDate={true}
              align="right"
              placeholder="Tarih seçin"
            />
          </div>

          {/* Seyahat Notları */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '5px'
            }}>
              <FileText size={13} color="#D7147A" />
              <span>Seyahat Notları</span>
            </label>
            <textarea
              rows={3}
              placeholder="Otel, bilet veya gezilecek yerler notları..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '11px',
                border: '1.2px solid #cbd5e1',
                fontSize: '11.5px',
                color: '#0f172a',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#D7147A'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            disabled={isSaving}
            style={{
              marginTop: '4px',
              height: '40px',
              borderRadius: '11px',
              border: 'none',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '-0.2px',
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow: '0 3px 12px rgba(215, 20, 122, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (!isSaving) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              if (!isSaving) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Luggage size={16} />
                <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Seyahati Oluştur'}</span>
              </>
            )}
          </button>

          {/* Vazgeç Butonu */}
          <button
            type="button"
            onClick={() => navigate('/individual/travels')}
            disabled={isSaving}
            style={{
              height: '38px',
              borderRadius: '11px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            Vazgeç ve Listeye Dön
          </button>
        </div>
      </form>
    </div>
  );
}
