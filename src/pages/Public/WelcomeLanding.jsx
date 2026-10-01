import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Languages, 
  ChevronRight, 
  ChevronLeft,
  Zap, 
  Receipt, 
  ShieldAlert, 
  Fuel, 
  MapPin, 
  Clock, 
  Coins, 
  Search, 
  Send,
  Sparkles,
  Plane
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore, DEFAULT_POPULAR_ROUTES } from '../../store/settingsStore';
import Header from '../../components/Header';
import WeatherOutfitWidget from '../../components/WeatherOutfitWidget';
import EmergencyCardWidget from '../../components/EmergencyCardWidget';
import CountryFlag, { getCurrencySymbol } from '../../components/CountryFlag';

const formatDuration = (val) => val ? String(val).replace(/\bsa\b/gi, 'Saat').trim() : '';

export default function WelcomeLanding() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // Kurumsal personeli kurumsal panele, giriş yapmış bireysel kullanıcıyı kişiselleştirilmiş dashboard'a yönlendir
  useEffect(() => {
    if (user && user.userType !== 'individual' && ['admin', 'expert', 'ticketing'].includes(user?.role)) {
      navigate('/dashboard');
    } else if (user && (user.userType === 'individual' || user.role === 'customer')) {
      navigate('/individual/dashboard');
    }
  }, [user, navigate]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [hoveredTool, setHoveredTool] = useState(null);

  const TYPEWRITER_QUESTIONS = [
    "Roma'da 3 günde ne yapılır?",
    "İtalya'da hangi priz tipi var?",
    "Uçakta el bagajı sıvı kuralı",
    "Paris'te gezilecek en iyi yerler",
    "Tax-Free iadesi nasıl alınır?",
    "Londra ile saat farkı kaç?",
    "Tokyo için bavulda ne olmalı?"
  ];

  const [displayText, setDisplayText] = useState('');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = TYPEWRITER_QUESTIONS[questionIdx];
    let timer;

    if (!isDeleting) {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, 50);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length - 1));
        }, 25);
      } else {
        setIsDeleting(false);
        setQuestionIdx((prev) => (prev + 1) % TYPEWRITER_QUESTIONS.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, questionIdx]);

  const handleAskTintin = (query) => {
    const q = (typeof query === 'string' ? query : aiPrompt || displayText).trim();
    const targetPath = (user && ['admin', 'expert', 'ticketing'].includes(user?.role))
      ? '/dashboard/tintin' 
      : '/tintin';

    if (q) {
      try {
        sessionStorage.setItem('pending_tintin_prompt', q);
      } catch (e) {
        console.warn('Session storage error:', e);
      }
      setAiPrompt('');
      navigate(targetPath, { state: { initialPrompt: q } });
    } else {
      navigate(targetPath);
    }
  };

  const tools = [
    { key: 'currency', label: 'Döviz', desc: 'Canlı Döviz Kurları & Çevirici', icon: Coins, color: '#D7147A', bgLight: '#FDF2F8', borderColor: '#F9BED8', path: '/travel-tools?tab=currency' },
    { key: 'translator', label: 'Çevirmen', desc: 'Sesli & Metin Seyahat Çevirmeni', icon: Languages, color: '#D7147A', bgLight: '#fdf2f8', borderColor: '#fbcfe8', path: '/travel-tools?tab=translator' },
    { key: 'socket', label: 'Priz Rehberi', desc: 'Ülkelere Göre Priz Tipi & Voltaj', icon: Zap, color: '#d97706', bgLight: '#fefce8', borderColor: '#fef08a', path: '/travel-tools?tab=socket' },
    { key: 'taxfree', label: 'Tax-Free', desc: 'KDV İade Oranları & Hesaplama', icon: Receipt, color: '#0891b2', bgLight: '#ecfeff', borderColor: '#cffafe', path: '/travel-tools?tab=taxfree' },
    { key: 'emergency', label: 'Acil Durum', desc: 'Elçilik, Polis Hatları & Güvendeyim', icon: ShieldAlert, color: '#e11d48', bgLight: '#fff1f2', borderColor: '#fecdd3', path: '/travel-tools?tab=emergency' },
    { key: 'distance', label: 'Mesafe', desc: 'Şehirler Arası Rota & Süre', icon: MapPin, color: '#0284c7', bgLight: '#f0f9ff', borderColor: '#bae6fd', path: '/travel-tools?tab=distance' },
    { key: 'timezone', label: 'Saat Farkı', desc: 'Dünya Saatleri & Zaman Farkı', icon: Clock, color: '#7c3aed', bgLight: '#faf5ff', borderColor: '#e9d5ff', path: '/travel-tools?tab=timezone' },
    { key: 'fuel', label: 'Yakıt', desc: 'Seyahat Yakıt Maliyet Hesabı', icon: Fuel, color: '#16a34a', bgLight: '#f0fdf4', borderColor: '#bbf7d0', path: '/travel-tools?tab=fuel' }
  ];

  const { popularRoutes } = useSettingsStore();
  const activeRoutes = (popularRoutes && Array.isArray(popularRoutes) && popularRoutes.length > 0)
    ? popularRoutes.filter(r => r.isActive).slice(0, 6)
    : DEFAULT_POPULAR_ROUTES.filter(r => r.isActive).slice(0, 6);

  const routesCarouselRef = useRef(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  const handleScrollCarousel = () => {
    if (!routesCarouselRef.current) return;
    const container = routesCarouselRef.current;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex >= 0 && newIndex < activeRoutes.length && newIndex !== activeRouteIndex) {
        setActiveRouteIndex(newIndex);
      }
    }
  };

  const scrollToRoute = (index) => {
    if (!routesCarouselRef.current) return;
    const container = routesCarouselRef.current;
    const width = container.clientWidth;
    container.scrollTo({
      left: index * width,
      behavior: 'smooth'
    });
    setActiveRouteIndex(index);
  };

  const handlePrevRoute = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeRouteIndex > 0) {
      scrollToRoute(activeRouteIndex - 1);
    }
  };

  const handleNextRoute = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeRouteIndex < activeRoutes.length - 1) {
      scrollToRoute(activeRouteIndex + 1);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#1e293b',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '10px'
    }}>
      {/* Top Header - Unified Corporate & Guest Header */}
      <Header />

      {/* Embedded CSS for Modern Micro-Interactions */}
      <style>{`
        .landing-card {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .landing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08);
        }
        .luxury-tool-card {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .luxury-tool-card:hover {
          transform: translateY(-2px);
          border-color: #F9BED8 !important;
          box-shadow: 0 6px 16px rgba(215, 20, 122, 0.12) !important;
        }
        .luxury-tool-card:hover > div {
          transform: scale(1.08);
        }
        .luxury-tool-card:active {
          transform: scale(0.95);
        }
        .prompt-chip {
          transition: all 0.15s ease;
          user-select: none;
        }
        .prompt-chip:hover {
          background: #FDF2F8 !important;
          border-color: #F9BED8 !important;
          color: #D7147A !important;
        }
      `}</style>

      {/* Main Container */}
      <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', padding: '14px 14px 10px 14px', boxSizing: 'border-box' }}>
        
        {/* ==========================================
            1. HERO SECTION & TINTIN AI SMART PROMPT BOX
        ========================================== */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
          borderRadius: '24px',
          border: '1px solid #FCE7F3',
          padding: '20px 16px',
          boxShadow: '0 6px 20px -2px rgba(215, 20, 122, 0.06)',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Decorative Circle */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(215, 20, 122, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
            pointerEvents: 'none'
          }} />



          <h1 style={{
            fontSize: '16px',
            fontWeight: '800',
            lineHeight: '1.35',
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px'
          }}>
            Dünyayı Keşfetmek Artık <br />
            <span style={{
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Çok Daha Kolay & Yanınızda
            </span>
          </h1>

          <p style={{
            fontSize: '11px',
            color: '#64748b',
            lineHeight: '1.45',
            margin: '0 0 12px 0'
          }}>
            Döviz kurlarından priz uyumuna, canlı çevirmenden bavul checklistine kadar seyahatiniz için gereken tüm pratik araçlar tek dokunuşla hazır.
          </p>

          {/* Interactive Tin-Tin Ask Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAskTintin(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #F9BED8',
              padding: '5px 6px 5px 12px',
              boxShadow: '0 4px 12px rgba(215, 20, 122, 0.08)',
              marginBottom: 0
            }}
          >
            <Search size={15} color="#D7147A" style={{ flexShrink: 0, marginRight: '8px' }} />
            <input 
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={displayText || "Tin-Tin'e bir seyahat sorusu sorun..."}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                minWidth: 0,
                paddingRight: '12px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#1e293b',
                textOverflow: 'ellipsis'
              }}
            />
            <button
              type="submit"
              title="Tin-Tin'e Sor"
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
        </div>

        {/* ==========================================
            2. HIZLI SEYAHAT ARAÇLARI (Tek Kart Çatısında Başlık & 4x2 Araçlar)
        ========================================== */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
          borderRadius: '22px',
          border: '1px solid #FCE7F3',
          padding: '15px 16px',
          marginBottom: '18px',
          boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
          boxSizing: 'border-box'
        }}>
          
          {/* Başlık Alanı */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
            <div>
              <h2 style={{
                fontSize: '14.5px',
                fontWeight: '800',
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.2px'
              }}>
                Hızlı Seyahat Araçları
              </h2>
              <div style={{
                fontSize: '11px',
                color: hoveredTool ? '#0f172a' : '#64748b',
                marginTop: '2px',
                minHeight: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}>
                {hoveredTool ? (
                  <>
                    <span style={{
                      fontWeight: '800',
                      color: hoveredTool.color,
                      background: hoveredTool.bgLight,
                      padding: '1px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${hoveredTool.borderColor}`,
                      fontSize: '10.5px'
                    }}>
                      {hoveredTool.label}
                    </span>
                    <span style={{ color: '#475569', fontSize: '11px' }}>
                      {hoveredTool.desc}
                    </span>
                  </>
                ) : (
                  <span>Kayıt olmadan tek dokunuşla anında kullanın</span>
                )}
              </div>
            </div>

            {/* Şık '>' Butonu */}
            <button
              onClick={() => navigate('/travel-tools')}
              title="Tüm Seyahat Araçlarını Gör (8)"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1.2px solid #F9BED8',
                color: '#D7147A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(215, 20, 122, 0.08)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(2px)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#D7147A';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#D7147A';
                e.currentTarget.style.borderColor = '#F9BED8';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(215, 20, 122, 0.08)';
              }}
            >
              <ChevronRight size={15} strokeWidth={2.4} />
            </button>
          </div>

          {/* Araç Butonları (4x2 Zarif Lüks Izgara) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px 8px',
            justifyItems: 'center',
            alignItems: 'center'
          }}>
              {tools.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => navigate(t.path)}
                    onMouseEnter={() => setHoveredTool(t)}
                    onMouseLeave={() => setHoveredTool(null)}
                    title={`${t.label} - ${t.desc}`}
                    className="luxury-tool-card"
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '15px',
                      background: '#ffffff',
                      border: '1.2px solid #FCE7F3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      background: t.bgLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: t.color,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      <Icon size={20} strokeWidth={2.1} />
                    </div>
                  </button>
                );
              })}
            </div>

        </div>

        {/* ==========================================
            3. LIVE WEATHER & CLOTHING RECOMMENDATION WIDGET
        ========================================== */}
        <WeatherOutfitWidget />

        {/* ==========================================
            4. POPULAR DESTINATIONS CHEAT SHEET & CAROUSEL
        ========================================== */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
          borderRadius: '22px',
          border: '1px solid #FCE7F3',
          padding: '15px 16px',
          marginBottom: '18px',
          boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {/* Başlık Alanı */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: '13px',
                fontWeight: '750',
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.2px'
              }}>
                Popüler Rotalar
              </h2>
              <div style={{
                fontSize: '10.5px',
                color: '#64748b',
                marginTop: '2px'
              }}>
                Saat Farkı, Uçuş Süresi & Para Birimi
              </div>
            </div>
            
            {/* Navigasyon Okları */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handlePrevRoute}
                disabled={activeRouteIndex === 0}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '10px',
                  border: '1.2px solid #F9BED8',
                  background: activeRouteIndex === 0 ? '#f8fafc' : '#ffffff',
                  color: activeRouteIndex === 0 ? '#cbd5e1' : '#D7147A',
                  cursor: activeRouteIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(215, 20, 122, 0.08)',
                  transition: 'all 0.15s ease'
                }}
                aria-label="Önceki Şehir"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextRoute}
                disabled={activeRouteIndex === activeRoutes.length - 1}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '10px',
                  border: '1.2px solid #F9BED8',
                  background: activeRouteIndex === activeRoutes.length - 1 ? '#f8fafc' : '#ffffff',
                  color: activeRouteIndex === activeRoutes.length - 1 ? '#cbd5e1' : '#D7147A',
                  cursor: activeRouteIndex === activeRoutes.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(215, 20, 122, 0.08)',
                  transition: 'all 0.15s ease'
                }}
                aria-label="Sonraki Şehir"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Tek Kart Kaydırmalı Konteyner */}
          <div style={{ position: 'relative' }}>
            {/* Scroll Track */}
            <div 
              ref={routesCarouselRef}
              onScroll={handleScrollCarousel}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                borderRadius: '18px',
                width: '100%'
              }}
            >
              {activeRoutes.map((c, i) => (
                <div
                  key={c.id || i}
                  onClick={() => navigate(`/city-guide?city=${encodeURIComponent(c.city)}`, { state: { city: c } })}
                  className="landing-card"
                  style={{
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1.2px solid #e2e8f0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Şehir Görseli (Ekrana Göre Geniş & Şık) */}
                  <div style={{
                    position: 'relative',
                    height: '165px',
                    width: '100%',
                    backgroundColor: '#f1f5f9',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={c.image || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800'}
                      alt={c.city}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                    {/* Gradient Karartma */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)'
                    }} />

                    {/* Sol Üst: Bayrak ve Ülke Rozeti */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.78)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '3px 8.5px',
                      borderRadius: '9px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
                      zIndex: 10
                    }}>
                      <CountryFlag flag={c.flag} country={c.country} size="sm" />
                      <span>{c.country}</span>
                    </div>

                    {/* Sol Alt Görsel İçi: Şehir Adı */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '12px',
                      right: '12px'
                    }}>
                      <div style={{
                        fontSize: '13.5px',
                        fontWeight: '750',
                        color: '#ffffff',
                        letterSpacing: '-0.2px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.75)'
                      }}>
                        {c.city}
                      </div>
                    </div>
                  </div>

                  {/* Görsel Altındaki Bilgiler & Buton */}
                  <div style={{ padding: '12px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Seyahat Bilgi Çubuğu (Birleşik Mimari Bar) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      background: '#f8fafc',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '10px 4px'
                    }}>
                      {/* Saat Farkı */}
                      <div style={{ 
                        textAlign: 'center', 
                        borderRight: '1px solid #e2e8f0',
                        padding: '0 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '3.5px', 
                          color: '#64748b', 
                          fontSize: '9px', 
                          fontWeight: '700',
                          letterSpacing: '0.2px',
                          textTransform: 'uppercase'
                        }}>
                          <Clock size={11} color="#D7147A" />
                          <span>Saat Farkı</span>
                        </div>
                        <div style={{ 
                          fontSize: '11.5px', 
                          fontWeight: '700', 
                          color: '#0f172a', 
                          marginTop: '6px' 
                        }}>
                          {formatDuration(c.time)}
                        </div>
                      </div>

                      {/* Uçuş Süresi */}
                      <div style={{ 
                        textAlign: 'center', 
                        borderRight: '1px solid #e2e8f0',
                        padding: '0 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '3.5px', 
                          color: '#64748b', 
                          fontSize: '9px', 
                          fontWeight: '700',
                          letterSpacing: '0.2px',
                          textTransform: 'uppercase'
                        }}>
                          <Plane size={11} color="#0284c7" />
                          <span>Uçuş Süresi</span>
                        </div>
                        <div style={{ 
                          fontSize: '11.5px', 
                          fontWeight: '700', 
                          color: '#0f172a', 
                          marginTop: '6px' 
                        }}>
                          {formatDuration(c.flight)}
                        </div>
                      </div>

                      {/* Para Birimi */}
                      <div style={{ 
                        textAlign: 'center',
                        padding: '0 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '3.5px', 
                          color: '#64748b', 
                          fontSize: '9px', 
                          fontWeight: '700',
                          letterSpacing: '0.2px',
                          textTransform: 'uppercase'
                        }}>
                          <Coins size={11} color="#f59e0b" />
                          <span>Para Birimi</span>
                        </div>
                        <div style={{ 
                          fontSize: '11.5px', 
                          fontWeight: '700', 
                          color: '#0f172a', 
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          {getCurrencySymbol(c.currency) && (
                            <span style={{ color: '#D7147A', fontWeight: '800', fontSize: '11.5px' }}>
                              {getCurrencySymbol(c.currency)}
                            </span>
                          )}
                          <span>{c.currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Canlı & Premium Şehir Rehberi Butonu */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/city-guide?city=${encodeURIComponent(c.city)}`, { state: { city: c } });
                      }}
                      role="button"
                      tabIndex={0}
                      style={{
                        background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                        color: '#ffffff',
                        borderRadius: '13px',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 3px 12px rgba(215, 20, 122, 0.22)',
                        transition: 'all 0.18s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{c.country} | {c.city} Şehir Rehberini İnceleyin</span>
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nokta Göstergeleri (Dots Indicator) */}
          {activeRoutes.length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '10px'
            }}>
              {activeRoutes.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToRoute(idx);
                  }}
                  style={{
                    height: '6px',
                    width: activeRouteIndex === idx ? '22px' : '6px',
                    borderRadius: '999px',
                    backgroundColor: activeRouteIndex === idx ? '#D7147A' : '#cbd5e1',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  aria-label={`Rota ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ==========================================
            5. 7/24 EMERGENCY & EMBASSY MAP CARD WIDGET
        ========================================== */}
        <EmergencyCardWidget />

      </div>
    </div>
  );
}
