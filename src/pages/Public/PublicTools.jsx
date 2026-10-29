import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Coins, 
  Clock, 
  MapPin, 
  Fuel, 
  ChevronLeft, 
  ArrowUpDown, 
  RefreshCw, 
  Check, 
  Loader2, 
  AlertCircle,
  Navigation,
  Sun,
  Moon,
  Compass,
  Languages,
  Zap,
  Receipt,
  ShieldAlert,
  Siren,
  Send,
  X,
  ArrowRight,
  Sparkles,
  Search
} from 'lucide-react';
import { calculateDistance, calculateFuelCost } from '../../services/travelToolsService';
import PublicTranslator from './PublicTranslator';
import SocketGuide from './Tools/SocketGuide';
import TaxFreeCalculator from './Tools/TaxFreeCalculator';
import EmergencyGuide from './Tools/EmergencyGuide';
import OutfitGuide from './Tools/OutfitGuide';
import EmergencySiren from './Tools/EmergencySiren';
import TimezoneCalculator from './Tools/TimezoneCalculator';
import DistanceCalculator from './Tools/DistanceCalculator';
import FuelCalculator from './Tools/FuelCalculator';
import CorporateCurrency from '../Customer/Currency';
import Header from '../../components/Header';

export default function PublicTools({ isEmbedded = false }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || null);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    setActiveTab(currentTab || null);
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleTabChange = (tabKey) => {
    if (!tabKey) {
      setActiveTab(null);
      setSearchParams({});
    } else {
      setActiveTab(tabKey);
      setSearchParams({ tab: tabKey });
    }
  };





  // ==========================================
  // TAB 3: DISTANCE & ROUTING STATE
  // ==========================================
  const [distOrigin, setDistOrigin] = useState('İstanbul');
  const [distDestination, setDistDestination] = useState('Roma');
  const [distLoading, setDistLoading] = useState(false);
  const [distResult, setDistResult] = useState(null);
  const [distError, setDistError] = useState('');

  const handleCalculateDistance = async (orig = distOrigin, dest = distDestination) => {
    if (!orig || !dest) return;
    setDistLoading(true);
    setDistError('');
    try {
      const res = await calculateDistance(orig, dest);
      setDistResult(res);
      // Auto populate fuel distance if not set
      if (!fuelDistance) {
        setFuelDistance(res.drivingDistanceKm || res.flightDistanceKm);
      }
    } catch (e) {
      setDistError(e.message);
    } finally {
      setDistLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'distance' && !distResult) {
      handleCalculateDistance('İstanbul', 'Roma');
    }
  }, [activeTab]);

  // ==========================================
  // TAB 4: FUEL COST STATE
  // ==========================================
  const [fuelDistance, setFuelDistance] = useState(850);
  const [fuelConsumption, setFuelConsumption] = useState(7.5);
  const [fuelPrice, setFuelPrice] = useState(55);

  const fuelCalculation = calculateFuelCost({
    distanceKm: fuelDistance,
    consumptionPer100Km: fuelConsumption,
    fuelPricePerLiter: fuelPrice
  });

  const toolTabs = [
    { 
      key: 'currency', 
      label: 'Döviz', 
      title: 'Döviz Kurları & Çevirici', 
      tag: 'Canlı Kurlar',
      desc: 'TCMB & Akbank güncel kurları, anlık çeviri ve karşılaştırma',
      category: 'finance',
      categoryLabel: 'Finans',
      keywords: 'döviz kur para tcmb akbank euro dolar tl çevirici hesapla',
      icon: Coins, 
      color: '#D7147A', 
      bg: '#FDF2F8',
      badgeBg: '#FCE7F3',
      badgeColor: '#B01064'
    },
    { 
      key: 'translator', 
      label: 'Çevirmen', 
      title: 'Seyahat Çevirmeni', 
      tag: 'Sesli & Yazılı',
      desc: 'Canlı konuşma ve metin çevirisi, telaffuz ve sesli asistan',
      category: 'guide',
      categoryLabel: 'Rehber',
      keywords: 'çevirmen dil tercüme sözlük ingilizce almanca sesli konuşma telaffuz',
      icon: Languages, 
      color: '#2563eb', 
      bg: '#eff6ff',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8'
    },
    { 
      key: 'socket', 
      label: 'Priz & Voltaj', 
      title: 'Priz & Voltaj Rehberi', 
      tag: 'Adaptör Rehberi',
      desc: '25+ ülke için priz tipleri, voltaj ve adaptör uyum kılavuzu',
      category: 'guide',
      categoryLabel: 'Rehber',
      keywords: 'priz voltaj adaptör elektrik fiş dönüştürücü prizler priz tipi',
      icon: Zap, 
      color: '#d97706', 
      bg: '#fffbeb',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309'
    },
    { 
      key: 'taxfree', 
      label: 'Tax-Free', 
      title: 'Tax-Free Hesaplayıcı', 
      tag: 'KDV İadesi',
      desc: 'Yurt dışı alışveriş gümrük KDV iadesi hesaplama ve onay adımları',
      category: 'finance',
      categoryLabel: 'Finans',
      keywords: 'tax free vergi kdv iade alışveriş gümrük fatura faturalar',
      icon: Receipt, 
      color: '#0891b2', 
      bg: '#ecfeff',
      badgeBg: '#cffafe',
      badgeColor: '#0e7490'
    },
    { 
      key: 'emergency', 
      label: 'Acil Durum', 
      title: 'Acil Durum & Elçilik', 
      tag: '7/24 Acil & GPS',
      desc: 'Polis, ambulans, T.C. büyükelçilikleri ve tek tık Güvendeyim SMS',
      category: 'safety',
      categoryLabel: 'Güvenlik',
      keywords: 'acil durum polis ambulans konsolosluk elçilik gps güvendeyim yardım itfaiye',
      icon: ShieldAlert, 
      color: '#dc2626', 
      bg: '#fef2f2',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c'
    },
    { 
      key: 'distance', 
      label: 'Mesafe', 
      title: 'Mesafe & Rota Planlayıcı', 
      tag: 'Canlı Rota',
      desc: 'Şehirler arası sürüş rotası ve kuş uçuşu mesafe hesaplama',
      category: 'travel',
      categoryLabel: 'Ulaşım',
      keywords: 'mesafe rota harita sürüş kilometre seyahat şehir navigasyon km',
      icon: MapPin, 
      color: '#0284c7', 
      bg: '#f0f9ff',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1'
    },
    { 
      key: 'timezone', 
      label: 'Saat Farkı', 
      title: 'Saat Farkı Hesaplayıcı', 
      tag: '',
      desc: 'Dünya şehirleri arasındaki canlı saat farkı ve yerel saatler',
      category: 'travel',
      categoryLabel: 'Ulaşım',
      keywords: 'saat farkı dünya saati zaman dilimi gmt utc zaman yerel',
      icon: Clock, 
      color: '#D7147A', 
      bg: '#FDF2F8',
      badgeBg: '#FCE7F3',
      badgeColor: '#B01064'
    },
    { 
      key: 'fuel', 
      label: 'Yakıt & Şarj', 
      title: 'Yakıt & Şarj', 
      tag: 'Ulaşım Maliyeti',
      desc: 'Benzinli, dizel ve elektrikli araçlar için seyahat maliyeti ve en yakın istasyonlar',
      category: 'travel',
      categoryLabel: 'Ulaşım',
      keywords: 'yakıt şarj elektrikli ev benzin motorin dizel lpg tüketim litre kwh istasyon trugo zes eşarj batarya',
      icon: Fuel, 
      color: '#16a34a', 
      bg: '#f0fdf4',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d'
    },
    { 
      key: 'outfit', 
      label: 'Ne Giyilir?', 
      title: 'Ne Giyilir?', 
      tag: 'Kombin Rehberi',
      desc: 'Hava durumuna göre kıyafet, kombin ve akıllı bavul önerileri',
      category: 'guide',
      categoryLabel: 'Rehber',
      keywords: 'ne giyilir bavul valiz hava durumu kıyafet kombin hazırlık seyahat',
      icon: Sparkles, 
      color: '#e11d48', 
      bg: '#fff1f2',
      badgeBg: '#ffe4e6',
      badgeColor: '#be123c'
    },
    { 
      key: 'siren', 
      label: 'Acil Durum', 
      title: 'Acil Durum', 
      tag: 'SOS Alarmı',
      desc: 'Tehlike anında dikkat çekmek için yüksek sesli alarm ve ekran flaşörü',
      category: 'safety',
      categoryLabel: 'Güvenlik',
      keywords: 'siren sos acil durum alarm çakar flaş yardım ses polis panik düdük tehlike',
      icon: Siren, 
      color: '#dc2626', 
      bg: '#fef2f2',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c'
    }
  ];

  const filteredTools = toolTabs.filter(tool => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.title.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q) ||
      tool.tag.toLowerCase().includes(q) ||
      (tool.keywords && tool.keywords.toLowerCase().includes(q))
    );
  });

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'translator':
        return {
          title: 'Seyahat Çevirmeni',
          subtitle: 'Canlı Yazılı & Sesli Konuşma Çevirisi'
        };
      case 'socket':
        return {
          title: 'Priz & Voltaj Rehberi',
          subtitle: 'Ülkelere Göre Fiş Tipi ve Adaptör Uyumu'
        };
      case 'taxfree':
        return {
          title: 'Tax-Free Hesaplayıcı',
          subtitle: 'Yurt Dışı KDV İadesi ve Gümrük Kılavuzu'
        };
      case 'emergency':
        return {
          title: 'Acil Durum & Konsolosluk',
          subtitle: 'Polis, Ambulans ve 7/24 T.C. Temsilcilikleri'
        };
      case 'outfit':
        return {
          title: 'Ne Giyilir?',
          subtitle: 'Hava Durumuna Göre Kıyafet Kombinleri'
        };
      case 'siren':
        return {
          title: 'Acil Durum',
          subtitle: 'SOS Alarmı ve Ekran Flaşörü'
        };
      case 'distance':
        return {
          title: 'Mesafe & Rota Planlayıcı',
          subtitle: 'Şehirler Arası Sürüş ve Kuş Uçuşu Mesafe'
        };
      case 'timezone':
        return {
          title: 'Saat Farkı Hesaplayıcı',
          subtitle: 'Dünya Şehirleri Arasındaki Saat Farkı'
        };
      case 'fuel':
        return {
          title: 'Yakıt & Şarj',
          subtitle: 'Mesafe ve Tüketime Göre Yakıt & Şarj Maliyeti'
        };
      case 'currency':
        return {
          title: 'Döviz Kurları & Çevirici',
          subtitle: 'TCMB & Akbank Canlı Kurlar ve Hesaplayıcı'
        };
      default:
        return {
          title: 'Seyahat Araçları',
          subtitle: 'Yolculuğunuzu kolaylaştıran pratik çözümler'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      paddingBottom: '110px'
    }}>
      {/* Top Header - Corporate Signature Style with Profile Avatar on All Tabs */}
      {!isEmbedded && (
        <Header 
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          showBack
          onBack={() => {
            if (activeTab) {
              handleTabChange(null);
            } else {
              navigate(-1);
            }
          }}
          marginBottom="18px"
        />
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 14px 24px 14px' }}>

        {/* CSS for Hub Cards & Animations */}
        <style>{`
          .tool-hub-card {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          .tool-hub-card:hover {
            transform: translateY(-2px);
            border-color: #D7147A !important;
            box-shadow: 0 8px 20px -4px rgba(215, 20, 122, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
          }
          .tool-hub-card:active {
            transform: scale(0.97);
          }
          .tool-top-pill {
            transition: all 0.15s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          .tool-top-pill:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
          }
          .tool-top-pill:active {
            transform: scale(0.96);
          }
          @keyframes fadeInModal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUpSheet {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>

        {/* ==========================================
            1. HUB SAYFASI (ARAÇLAR ANA MENÜSÜ)
        ========================================== */}
        {!activeTab && (
          <div>
            {/* Arama Barı (Görsel 1 Tasarımı) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.currentTarget.querySelector('input')?.blur();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                borderRadius: '16px',
                border: isSearchFocused ? '1.5px solid #D7147A' : '1.5px solid #F9BED8',
                padding: '5px 6px 5px 12px',
                boxShadow: isSearchFocused ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : '0 4px 12px rgba(215, 20, 122, 0.08)',
                transition: 'all 0.2s ease',
                marginBottom: '12px'
              }}
            >
              <Search size={15} color="#D7147A" style={{ flexShrink: 0, marginRight: '8px' }} />

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Araç ara... (döviz, priz, çevirmen, acil...)"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  flex: 1,
                  minWidth: 0,
                  paddingRight: '10px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: '#1e293b',
                  textOverflow: 'ellipsis'
                }}
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '4px',
                    marginRight: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              ) : null}

              <button
                type="submit"
                title="Ara"
                style={{
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(215, 20, 122, 0.3)'
                }}
              >
                <Send size={13} style={{ marginLeft: '-1px' }} />
              </button>
            </form>

            {/* Empty State */}
            {filteredTools.length === 0 && (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px 20px',
                textAlign: 'center',
                margin: '12px 0'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  marginBottom: '10px'
                }}>
                  <Search size={22} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                  Eşleşen Araç Bulunamadı
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
                  "{searchQuery}" aramasıyla eşleşen bir seyahat aracı bulunamadı.
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    border: 'none',
                    background: '#D7147A',
                    color: '#ffffff',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Aramayı Temizle
                </button>
              </div>
            )}

            {/* Seyahat Araçları Liste Görünümü */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTools.map(t => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.key}
                    onClick={() => handleTabChange(t.key)}
                    className="tool-hub-card"
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: t.bg,
                      color: t.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>

                    {/* İkon ile Yazı Arasındaki Dikey Çizgi */}
                    <div style={{
                      width: '1.2px',
                      height: '24px',
                      background: '#F9BED8',
                      borderRadius: '1px',
                      flexShrink: 0
                    }} />

                    <div style={{ flex: 1, minWidth: 0, padding: '2px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>
                          {t.title}
                        </span>
                        {t.tag ? (
                          <span style={{
                            fontSize: '8.5px',
                            fontWeight: '700',
                            color: t.badgeColor,
                            background: t.badgeBg,
                            padding: '1px 5px',
                            borderRadius: '5px'
                          }}>
                            {t.tag}
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.desc}
                      </div>
                    </div>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(215, 20, 122, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#D7147A',
                      flexShrink: 0
                    }}>
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}





        {/* ==========================================
            TAB 1: DÖVİZ KURLARI & ÇEVİRİCİ (KURUMSAL TASARIM)
        ========================================== */}
        {activeTab === 'currency' && (
          <CorporateCurrency isEmbedded={true} />
        )}

        {/* ==========================================
            TAB: SEYAHAT ÇEVİRMENİ
        ========================================== */}
        {activeTab === 'translator' && (
          <PublicTranslator isEmbedded={true} />
        )}

        {/* ==========================================
            TAB: PRİZ & VOLTAJ REHBERİ
        ========================================== */}
        {activeTab === 'socket' && (
          <SocketGuide isEmbedded={true} />
        )}

        {/* ==========================================
            TAB: TAX-FREE HESAPLAYICI
        ========================================== */}
        {activeTab === 'taxfree' && (
          <TaxFreeCalculator isEmbedded={true} />
        )}

        {/* ==========================================
            TAB: ACİL DURUM & KONSOLOSLUK
        ========================================== */}
        {activeTab === 'emergency' && (
          <EmergencyGuide isEmbedded={true} onNavigateTab={handleTabChange} />
        )}

        {/* ==========================================
            TAB: ACİL DURUM & SOS SİRENİ
        ========================================== */}
        {activeTab === 'siren' && (
          <EmergencySiren isEmbedded={true} onBack={() => handleTabChange(null)} />
        )}

        {/* ==========================================
            TAB: NE GİYİLİR & BAVUL REHBERİ
        ========================================== */}
        {activeTab === 'outfit' && (
          <OutfitGuide isEmbedded={true} initialCity={searchParams.get('city')} />
        )}

        {/* ==========================================
            TAB 2: SAAT FARKI HESAPLAMA (MODERN TEMATİK TASARIM)
        ========================================== */}
        {activeTab === 'timezone' && (
          <TimezoneCalculator isEmbedded={true} />
        )}

        {/* ==========================================
            TAB 3: MESAFE HESAPLAMA
        ========================================== */}
        {activeTab === 'distance' && (
          <DistanceCalculator isEmbedded={true} />
        )}

        {/* ==========================================
            TAB 4: YAKIT & ŞARJ MALİYET HESAPLAMA
        ========================================== */}
        {activeTab === 'fuel' && (
          <FuelCalculator isEmbedded={true} />
        )}

        {/* Bottom clearance spacer to guarantee all cards and buttons scroll completely clear of bottom-nav & Tintin */}
        <div style={{ height: '140px', minHeight: '140px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

      </div>
    </div>
  );
}
