import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Plus, 
  Luggage, 
  Compass, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import GuestNoticeBanner from '../../components/GuestNoticeBanner';
import ThemeSelect from '../../components/ThemeSelect';

export const AI_PRESET_PACKING_LISTS = [
  {
    id: 'ai_winter_ski',
    icon: '⛷️',
    title: 'Kış & Kayak Tatili',
    category: 'Kış / Doğa',
    description: 'Soğuk hava, kayak merkezi ve kış seyahatleri için temel ekipmanlar',
    items: [
      'Termal içlik (Üst & Alt 2 takım)',
      'Su geçirmez kayak montu & pantolonu',
      'Kayak gözlüğü (UV korumalı & buğu yapmayan)',
      'Su geçirmez kayak eldiveni & polar bere',
      'Yün veya termal kayak çorapları (3 çift)',
      'Dudak koruyucu balm (SPF korumalı)',
      'Soğuk hava yüz koruyucu krem',
      'Boyunluk / Balaklava',
      'Hızlı kuruyan polar hırka',
      'Kar botu / Su geçirmez kışlık ayakkabı'
    ]
  },
  {
    id: 'ai_euro_city',
    icon: '🏛️',
    title: 'Avrupa Şehir & Kültür Keşfi',
    category: 'Kültür & Şehir',
    description: 'Yoğun yürüyüşlü ve müzeli şehir turları için hafif & pratik liste',
    items: [
      'Ergonomik ortopedik yürüyüş ayakkabısı',
      'Hırsızlık önleyici çapraz omuz çantası',
      'Yüksek kapasiteli hızlı powerbank (20.000 mAh)',
      'Priz dönüştürücü adaptör (İngiltere/Avrupa tipi)',
      'Müze kartı veya dijital bilet karekodları',
      'Katlanabilir hafif yağmurluk',
      'Gürültü engelleyici kulaklık (Uçak ve tren için)',
      'Yeniden doldurulabilir hafif su matarası',
      'Küçük sırt çantası (Günlük geziler için)',
      'Acil durum nakit döviz'
    ]
  },
  {
    id: 'ai_summer_beach',
    icon: '🏖️',
    title: 'Yaz & Plaj Tatili',
    category: 'Yaz & Deniz',
    description: 'Güneş, deniz ve sahil tatili için ferah ve koruyucu valiz paketi',
    items: [
      'Yüksek faktörlü güneş kremi (SPF 50+)',
      'Güneş sonrası serinletici jel / Aloe vera',
      'Mayo / Bikini / Şort (En az 2 adet)',
      'UV filtreli kaliteli güneş gözlüğü',
      'Geniş siperlikli plaj şapkası',
      'Hızlı kuruyan mikrofiber plaj havlusu',
      'Plaj terliği ve deniz ayakkabısı',
      'Su geçirmez telefon kılıfı',
      'Keten / pamuklu hafif nefes alan kıyafetler',
      'Plaj çantası & şeffaf ıslak mayo torbası'
    ]
  },
  {
    id: 'ai_camping_nature',
    icon: '🏕️',
    title: 'Kamp & Doğa Yürüyüşü',
    category: 'Macera & Kamp',
    description: 'Doğada çadır veya karavan ile konaklamada hayat kurtaran maddeler',
    items: [
      'Kafa feneri ve yedek piller',
      'Çok amaçlı çakı / İsviçre çakısı',
      'Böcek ve sivrisinek kovucu sprey',
      'İlk yardım & yara bandı çantası',
      'Termos & paslanmaz metal kupa',
      'Hızlı kuruyan mikrofiber havlu',
      'Su geçirmez trekking botu',
      'Rüzgar geçirmez nefes alabilir yağmurluk',
      'Çakmak / Magnezyum çubuğu',
      'Biyolojik olarak parçalanabilir ıslak mendil'
    ]
  },
  {
    id: 'ai_cruise_ship',
    icon: '🚢',
    title: 'Gemi & Cruise Seyahati',
    category: 'Cruise & Gemi',
    description: 'Açık deniz yolculuğu, akşam yemekleri ve liman durakları hazırlığı',
    items: [
      'Kaptan yemeği için şık akşam kıyafeti',
      'Deniz tutmasına karşı bileklik veya ilaç',
      'Liman inişleri için hafif yürüyüş ayakkabısı',
      'Güneş gözlüğü ve şapka',
      'Kart tutucu askılı kılıf (Oda kartı için)',
      'Güneş kremi ve güneş sonrası losyon',
      'Mayo / Pareo ve havuz terliği',
      'Küçük el buharlı ütü veya kırışık giderici sprey',
      'Çoklu USB şarj aleti (Kamara prizleri için)'
    ]
  },
  {
    id: 'ai_business_trip',
    icon: '💼',
    title: 'İş & Kongre Seyahati',
    category: 'İş Seyahati',
    description: 'Toplantılar, konferanslar ve profesyonel görüşmeler için kırışıksız valiz',
    items: [
      'Kırışmaz gömlekler ve takım elbise',
      'Dizüstü bilgisayar, şarj cihazı ve HDMI adaptör',
      'Sunum kumandası (Presenter clicker)',
      'Kartvizitlik ve şık not defteri',
      'Kravat / fular ve uygun deri ayakkabı',
      'Küçük kıyafet tüy toplayıcı rulo',
      'Hızlı powerbank ve kulaklık',
      'Nefes tazeleyici sprey / nane şekeri',
      'Taşınabilir seyahat buharlı ütüsü'
    ]
  },
  {
    id: 'ai_family_baby',
    icon: '👶',
    title: 'Bebekli / Çocuklu Aile Seyahati',
    category: 'Aile',
    description: 'Çocuklu ailelerin yolda ve tatilde ihtiyaç duyacağı tüm kritik eşyalar',
    items: [
      'Bebek bezi, alt açma matı ve ıslak mendil (Bol miktarda)',
      'Yedek kıyafet setleri (Günlük 3 takım)',
      'Termos, mama kabı ve emzik zinciri',
      'Ateş düşürücü şurup, termometre ve burun aspiratörü',
      'Yolculuk için sevdiği oyuncaklar / boyama kitabı',
      'Puset / Kanguru ve yağmurluğu',
      'Güneş şapkası ve çocuk güneş kremi',
      'Müslin örtüler ve önlükler',
      'Çocuk pasaportu ve aşı kartı fotokopisi'
    ]
  }
];

export default function AiPackingAssistant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const travelIdParam = searchParams.get('travelId');

  const user = useAuthStore(state => state.user);
  const travels = useIndividualStore(state => state.travels);
  const createFromTemplate = useIndividualStore(state => state.createFromTemplate);

  const [selectedTravelId, setSelectedTravelId] = useState(travelIdParam || '');
  const [isSavingId, setIsSavingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [expandedPresetId, setExpandedPresetId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApplyPreset = async (preset) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSavingId(preset.id);
    try {
      await createFromTemplate(preset, user.id, selectedTravelId || null);
      showToast(`"${preset.title}" akıllı valiz listeniz başarıyla oluşturuldu! 🎉`);
      setTimeout(() => {
        navigate('/individual/checklists' + (selectedTravelId ? `?travelId=${selectedTravelId}` : ''));
      }, 700);
    } catch (e) {
      alert("Hata oluştu: " + (e.message || e));
    } finally {
      setIsSavingId(null);
    }
  };

  const selectedTravel = travels.find(t => t.id === selectedTravelId);

  const travelOptions = [
    { value: '', label: 'Genel Seyahat (Bağlantısız)', icon: '🌐' },
    ...travels.map(t => ({
      value: t.id,
      label: t.title,
      subtitle: t.destination ? t.destination : (t.startDate ? `${t.startDate} - ${t.endDate}` : undefined),
      icon: '✈️'
    }))
  ];

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '14px',
          fontSize: '12.5px',
          fontWeight: '700',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Back Row Card */}
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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 1px 3px rgba(215, 20, 122, 0.04)'
        }}>
          <img src="/tintin-avatar.png" alt="Tintin" style={{ width: '15px', height: '15px', borderRadius: '50%', objectFit: 'cover' }} />
          <span>Tintin Asistan</span>
        </span>
      </div>

      {/* Guest Notice */}
      {!user && (
        <GuestNoticeBanner 
          customTitle="Checklistlerin Kaydedilmesi İçin Giriş Gerekli"
          customDescription="Akıllı valiz listelerinizi kendi seyahatlerinize kaydetmek ve tüm cihazlarınızdan takip etmek için giriş yapabilirsiniz."
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
        boxShadow: '0 4px 20px rgba(215, 20, 122, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FDF2F8 0%, #F9BED8 100%)',
            border: '1.5px solid #F9BED8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(215, 20, 122, 0.16)',
            flexShrink: 0
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}>
              <img
                src="/tintin-avatar.png"
                alt="Tintin"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            {/* Corner AI Sparkle badge */}
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '17px',
              height: '17px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(215, 20, 122, 0.35)'
            }}>
              <Sparkles size={9} color="#ffffff" />
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Tintin Akıllı Valiz Asistanı
            </h1>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
              Seyahat türünüze özel, unutulmaması gereken eşyalarla otomatik checklist oluşturun.
            </div>
          </div>
        </div>
      </div>

      {/* Travel Selector Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #F9BED8',
        padding: '14px 16px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(215, 20, 122, 0.04)'
      }}>
        <label style={{
          fontSize: '12.5px',
          fontWeight: '700',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          marginBottom: '14px'
        }}>
          <Luggage size={16} color="#D7147A" />
          <span>Hangi Seyahatiniz İçin Hazırlanıyorsunuz?</span>
        </label>
        
        <ThemeSelect
          value={selectedTravelId}
          onChange={setSelectedTravelId}
          options={travelOptions}
          placeholder="Seyahat seçiniz..."
        />

        {selectedTravel && (
          <div style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: '#FDF2F8',
            borderRadius: '10px',
            fontSize: '11px',
            color: '#B01064',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <MapPin size={13} color="#D7147A" />
            <span>Seçilen seyahat: <strong>{selectedTravel.title}</strong></span>
          </div>
        )}
      </div>

      {/* Presets Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 2px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
          Hazır Konsept Paketlerinden Seçin
        </span>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#D7147A' }}>
          {AI_PRESET_PACKING_LISTS.length} Paket
        </span>
      </div>

      {/* Presets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {AI_PRESET_PACKING_LISTS.map((preset) => {
          const isExpanded = expandedPresetId === preset.id;
          const isThisSaving = isSavingId === preset.id;

          return (
            <div
              key={preset.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1.2px solid #F9BED8',
                boxShadow: '0 2px 10px rgba(215, 20, 122, 0.05)',
                padding: '14px 16px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Header row inside card */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#FDF2F8',
                    border: '1px solid #F9BED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    {preset.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                        {preset.title}
                      </strong>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: '800',
                        background: '#FCE7F3',
                        color: '#B01064',
                        padding: '1px 6px',
                        borderRadius: '8px'
                      }}>
                        {preset.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
                      {preset.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Preview Chips */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '10px 12px',
                marginBottom: '12px',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                    ✨ {preset.items.length} Akıllı Madde
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedPresetId(isExpanded ? null : preset.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#D7147A',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {isExpanded ? 'Daha Az Göster ▲' : 'Tümünü Gör ▼'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {(isExpanded ? preset.items : preset.items.slice(0, 4)).map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#334155',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {item}
                    </span>
                  ))}
                  {!isExpanded && preset.items.length > 4 && (
                    <span
                      onClick={() => setExpandedPresetId(preset.id)}
                      style={{
                        background: '#FDF2F8',
                        border: '1px solid #F9BED8',
                        color: '#B01064',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      +{preset.items.length - 4} madde daha...
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleApplyPreset(preset)}
                disabled={isThisSaving}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '11px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isThisSaving ? 'wait' : 'pointer',
                  boxShadow: '0 3px 10px rgba(215, 20, 122, 0.22)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isThisSaving) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 5px 14px rgba(215, 20, 122, 0.32)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122, 0.22)';
                }}
              >
                {isThisSaving ? (
                  <span>Oluşturuluyor...</span>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2.6} />
                    <span>Bu Paketi Seç & Listelerime Ekle</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Login Prompt Modal for Guests */}
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
              Seçtiğiniz akıllı valiz listesini kaydetmek ve seyahatlerinize bağlamak için lütfen giriş yapın veya ücretsiz hesap oluşturun.
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
