import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckSquare, 
  Plus, 
  Luggage, 
  Compass, 
  MapPin, 
  Check, 
  X, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import ThemeSelect from '../../components/ThemeSelect';

const CATEGORY_OPTIONS = [
  { value: 'Genel', label: 'Yurt Dışı & Genel', icon: '✈️' },
  { value: 'Tatil', label: 'Plaj & Tatil', icon: '🏖️' },
  { value: 'İş', label: 'İş Seyahati & Kongre', icon: '💼' },
  { value: 'Hafta Sonu', label: 'Hafta Sonu & Kamp', icon: '🏕️' },
  { value: 'Kış', label: 'Kış & Kayak Tatili', icon: '⛷️' },
  { value: 'Aile', label: 'Bebekli & Aile Seyahati', icon: '👶' },
  { value: 'Özel', label: 'Özel Liste', icon: '📋' }
];

const QUICK_INITIAL_ITEMS = [
  'Pasaport / Kimlik',
  'Telefon & Şarj Aleti',
  'Powerbank',
  'Diş Fırçası & Macunu',
  'Kulaklık',
  'Güneş Gözlüğü',
  'Yedek Çorap & Çamaşır',
  'Ağrı Kesici / Temel İlaçlar'
];

export default function CreateChecklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const travelIdParam = searchParams.get('travelId');

  const user = useAuthStore(state => state.user);
  const travels = useIndividualStore(state => state.travels);
  const createChecklist = useIndividualStore(state => state.createChecklist);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Genel');
  const [selectedTravelId, setSelectedTravelId] = useState(travelIdParam || '');
  const [initialItems, setInitialItems] = useState([]);
  const [newItemInput, setNewItemInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAddInitialItem = (text) => {
    const clean = (text || newItemInput).trim();
    if (!clean) return;
    if (!initialItems.includes(clean)) {
      setInitialItems([...initialItems, clean]);
    }
    setNewItemInput('');
  };

  const handleRemoveInitialItem = (idxToRemove) => {
    setInitialItems(initialItems.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Lütfen liste başlığı girin.");
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const itemsPayload = initialItems.map((text, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        text,
        completed: false,
        category: 'Genel'
      }));

      await createChecklist({
        title: title.trim(),
        userId: user.id,
        travelId: selectedTravelId || null,
        category: category || 'Genel',
        items: itemsPayload
      });

      navigate('/individual/checklists' + (selectedTravelId ? `?travelId=${selectedTravelId}` : ''));
    } catch (err) {
      alert("Hata oluştu: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTravel = travels.find(t => t.id === selectedTravelId);

  const travelOptions = [
    { value: '', label: 'Genel / Seyahatsiz Liste', icon: '🌐' },
    ...travels.map(t => ({
      value: t.id,
      label: t.title,
      subtitle: t.destination ? t.destination : (t.startDate ? `${t.startDate} - ${t.endDate}` : undefined),
      icon: '✈️'
    }))
  ];

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* Top Back Row Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.2px solid #F9BED8',
        padding: '10px 14px',
        marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(215, 20, 122, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          type="button"
          onClick={() => navigate('/individual/checklists')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FDF2F8',
            border: '1px solid #F9BED8',
            borderRadius: '10px',
            padding: '6px 12px',
            color: '#B01064',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(215, 20, 122, 0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FCE7F3';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FDF2F8';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.4} />
          <span>Checklistlerime Dön</span>
        </button>

        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
          color: '#B01064',
          padding: '5px 11px',
          borderRadius: '10px',
          border: '1px solid #F9BED8',
          boxShadow: '0 1px 3px rgba(215, 20, 122, 0.04)'
        }}>
          📋 Yeni Özel Liste
        </span>
      </div>

      {/* Guest Notice */}
      {!user && (
        <GuestNoticeBanner 
          customTitle="Checklistlerin Kaydedilmesi İçin Giriş Gerekli"
          customDescription="Yeni checklist oluşturmak, kaydetmek ve seyahatlerinize bağlamak için giriş yapabilirsiniz."
          actionText="Giriş Yap / Kaydol"
          onActionClick={() => setShowLoginModal(true)}
        />
      )}

      {/* Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
        borderRadius: '20px',
        border: '1.5px solid #F9BED8',
        padding: '18px 16px',
        marginBottom: '16px',
        boxShadow: '0 4px 18px rgba(215, 20, 122, 0.07)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(215, 20, 122, 0.28)',
            flexShrink: 0
          }}>
            <Plus size={24} strokeWidth={2.6} />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Yeni Özel Checklist
            </h1>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
              Listenize isim verin, seyahatinizle ilişkilendirin ve valiz hazırlığınızı yönetmeye başlayın.
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1.2px solid #F9BED8',
        padding: '18px 16px',
        boxShadow: '0 3px 12px rgba(215, 20, 122, 0.05)'
      }}>
        <form onSubmit={handleSubmit}>
          
          {/* Title Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#334155',
              display: 'block',
              marginBottom: '6px'
            }}>
              Liste Başlığı <span style={{ color: '#D7147A' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Roma Hazırlıklarım, Fotoğraf Ekipmanları"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1.2px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#D7147A'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Category Select */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#334155',
              display: 'block',
              marginBottom: '10px'
            }}>
              Kategori
            </label>
            <ThemeSelect
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
            />
          </div>

          {/* Travel Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <Luggage size={14} color="#D7147A" />
              <span>Seyahat Seçimi (İsteğe Bağlı)</span>
            </label>
            <ThemeSelect
              value={selectedTravelId}
              onChange={setSelectedTravelId}
              options={travelOptions}
            />

            {selectedTravel && (
              <div style={{
                marginTop: '8px',
                padding: '7px 10px',
                background: '#FDF2F8',
                borderRadius: '10px',
                fontSize: '11px',
                color: '#B01064',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <MapPin size={12} color="#D7147A" />
                <span>Bu checklist <strong>{selectedTravel.title}</strong> seyahatinize bağlanacak.</span>
              </div>
            )}
          </div>

          {/* Initial Items (Optional Starter Items) */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '14px',
            padding: '12px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <label style={{
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Hızlı Madde Ekle (İsteğe Bağlı)</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{initialItems.length} madde hazır</span>
            </label>

            {/* Quick suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
              {QUICK_INITIAL_ITEMS.map((qItem, idx) => {
                const isAdded = initialItems.includes(qItem);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => isAdded ? handleRemoveInitialItem(initialItems.indexOf(qItem)) : handleAddInitialItem(qItem)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '8px',
                      border: isAdded ? '1px solid #D7147A' : '1px solid #e2e8f0',
                      background: isAdded ? '#FDF2F8' : '#ffffff',
                      color: isAdded ? '#D7147A' : '#475569',
                      fontSize: '11px',
                      fontWeight: isAdded ? '700' : '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isAdded ? <Check size={11} strokeWidth={3} /> : <Plus size={11} />}
                    <span>{qItem}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom text add item */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Yeni bir madde yazın..."
                value={newItemInput}
                onChange={e => setNewItemInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInitialItem();
                  }
                }}
                style={{
                  flex: 1,
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '11.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddInitialItem()}
                title="Madde Ekle"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(215, 20, 122, 0.22)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Plus size={16} strokeWidth={2.6} />
              </button>
            </div>

            {/* Current Items List */}
            {initialItems.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {initialItems.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #F9BED8',
                      color: '#B01064',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{item}</span>
                    <X
                      size={12}
                      style={{ cursor: 'pointer', color: '#94a3b8' }}
                      onClick={() => handleRemoveInitialItem(idx)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Buttons: Vazgeç & Oluştur */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/individual/checklists')}
              style={{
                height: '44px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              style={{
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isSaving || !title.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)',
                opacity: !title.trim() ? 0.7 : 1
              }}
            >
              {isSaving ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>

        </form>
      </div>

      {/* Guest Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            padding: '24px 20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#FDF2F8',
              color: '#D7147A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              border: '2px solid #F9BED8'
            }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              Giriş Yapmanız Gerekiyor
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45, margin: '0 0 18px 0' }}>
              Özel checklist listenizi kaydetmek ve tüm cihazlarınızdan yönetmek için lütfen giriş yapın veya ücretsiz hesap oluşturun.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                }}
              >
                Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
