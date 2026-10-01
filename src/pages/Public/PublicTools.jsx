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
  LayoutGrid,
  X,
  ArrowRight,
  Sparkles,
  Search,
  List,
  Filter
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

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
      tag: 'Dünya Saati',
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

  const categories = [
    { key: 'all', label: 'Tümü' },
    { key: 'finance', label: 'Finans & Alışveriş' },
    { key: 'guide', label: 'Rehber & Dil' },
    { key: 'travel', label: 'Ulaşım & Yol' },
    { key: 'safety', label: 'Güvenlik & Acil' }
  ];

  const filteredTools = toolTabs.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;
    const matchesSearch = 
      tool.title.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q) ||
      tool.tag.toLowerCase().includes(q) ||
      (tool.keywords && tool.keywords.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
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
          marginBottom="16px"
        />
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px 24px 16px' }}>

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
            {/* Welcome Hero Assistant Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)',
              borderRadius: '18px',
              border: '1px solid #F9BED8',
              padding: '16px 16px',
              marginBottom: '14px',
              boxShadow: '0 4px 20px -2px rgba(215, 20, 122, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(215, 20, 122, 0.12) 0%, rgba(215, 20, 122, 0) 70%)',
                pointerEvents: 'none'
              }} />

              <h2 style={{
                fontSize: '15px',
                fontWeight: '800',
                color: '#0f172a',
                margin: '0 0 5px 0',
                letterSpacing: '-0.2px'
              }}>
                Akıllı Seyahat Asistanı
              </h2>

              <p style={{
                fontSize: '11.5px',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.45
              }}>
                Dövizden anlık çeviriye, priz uyumundan valiz rehberi ve acil durumlara kadar tüm seyahat yardımcılarınız tek dokunuşla elinizin altında.
              </p>
            </div>

            {/* KART 1: Arama ve Görünüm Kontrolleri Kartı */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '9px 10px',
              marginBottom: '10px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0 10px',
                height: '36px'
              }}>
                <Search size={15} color="#94a3b8" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Araç ara... (döviz, priz, çevirmen, acil...)"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '11.5px',
                    color: '#0f172a',
                    width: '100%',
                    fontWeight: '500'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      border: 'none',
                      background: '#e2e8f0',
                      color: '#64748b',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle: Grid vs List */}
              <div style={{
                display: 'flex',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '2px',
                height: '36px',
                boxSizing: 'border-box'
              }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Izgara Görünümü"
                  style={{
                    border: 'none',
                    borderRadius: '7px',
                    background: viewMode === 'grid' ? '#D7147A' : 'transparent',
                    color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                    width: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Liste Görünümü"
                  style={{
                    border: 'none',
                    borderRadius: '7px',
                    background: viewMode === 'list' ? '#D7147A' : 'transparent',
                    color: viewMode === 'list' ? '#ffffff' : '#64748b',
                    width: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* KART 2: Kategori Filtreleme Kartı */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '9px 10px',
              marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {categories.map(cat => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      style={{
                        border: isSelected ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                        background: isSelected ? '#D7147A' : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#475569',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : '500',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(215, 20, 122, 0.25)' : 'none'
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

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
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
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
                  Filtreleri Temizle
                </button>
              </div>
            )}

            {/* Grid View Mode */}
            {viewMode === 'grid' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                {filteredTools.map(t => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.key}
                      onClick={() => handleTabChange(t.key)}
                      className="tool-hub-card"
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '13px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                        minHeight: '132px',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Top row: Squircle icon + Tag */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '11px',
                            background: t.bg,
                            color: t.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}>
                            <Icon size={19} strokeWidth={2.2} />
                          </div>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: '700',
                            color: t.badgeColor,
                            background: t.badgeBg,
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}>
                            {t.tag}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h3 style={{
                          fontSize: '12.5px',
                          fontWeight: '700',
                          color: '#0f172a',
                          margin: '0 0 3px 0',
                          letterSpacing: '-0.2px',
                          lineHeight: 1.25
                        }}>
                          {t.title}
                        </h3>
                        <p style={{
                          fontSize: '10.5px',
                          color: '#64748b',
                          margin: 0,
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {t.desc}
                        </p>
                      </div>

                      {/* Bottom mini action */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        marginTop: '8px',
                        borderTop: '1px solid #f1f5f9'
                      }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8' }}>
                          {t.categoryLabel}
                        </span>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'rgba(215, 20, 122, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#D7147A'
                        }}>
                          <ArrowRight size={11} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View Mode */}
            {viewMode === 'list' && (
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
                        padding: '11px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '11px',
                        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '11px',
                        background: t.bg,
                        color: t.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={20} strokeWidth={2.2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                            {t.title}
                          </span>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: '700',
                            color: t.badgeColor,
                            background: t.badgeBg,
                            padding: '1px 5px',
                            borderRadius: '5px'
                          }}>
                            {t.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            )}
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

      </div>
    </div>
  );
}
