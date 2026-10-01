import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  ArrowUpDown, 
  Car, 
  Plane, 
  Fuel, 
  Clock, 
  Compass, 
  Sparkles, 
  Loader2, 
  X, 
  ArrowRight, 
  ChevronRight, 
  Info, 
  Gauge, 
  Zap, 
  RotateCcw,
  Sliders,
  DollarSign
} from 'lucide-react';
import CountryFlag from '../../../components/CountryFlag';
import { calculateDistance, calculateFuelCost } from '../../../services/travelToolsService';

// Curated database with Turkish names & keywords for instant search
const POPULAR_GLOBAL_CITIES = [
  // Türkiye Şehirleri
  { city: 'İstanbul', country: 'Türkiye', flagCode: 'tr', keywords: 'istanbul türkiye turkey tr' },
  { city: 'Ankara', country: 'Türkiye', flagCode: 'tr', keywords: 'ankara türkiye turkey tr' },
  { city: 'İzmir', country: 'Türkiye', flagCode: 'tr', keywords: 'izmir türkiye turkey tr' },
  { city: 'Antalya', country: 'Türkiye', flagCode: 'tr', keywords: 'antalya türkiye turkey tr' },
  { city: 'Bursa', country: 'Türkiye', flagCode: 'tr', keywords: 'bursa türkiye turkey tr' },
  { city: 'Adana', country: 'Türkiye', flagCode: 'tr', keywords: 'adana türkiye turkey tr' },
  { city: 'Gaziantep', country: 'Türkiye', flagCode: 'tr', keywords: 'gaziantep antep türkiye turkey tr' },
  { city: 'Trabzon', country: 'Türkiye', flagCode: 'tr', keywords: 'trabzon türkiye turkey tr' },
  { city: 'Bodrum', country: 'Türkiye', flagCode: 'tr', keywords: 'bodrum muğla türkiye turkey tr' },
  { city: 'Muğla', country: 'Türkiye', flagCode: 'tr', keywords: 'muğla bodrum fethiye türkiye tr' },
  { city: 'Nevşehir', country: 'Türkiye', flagCode: 'tr', keywords: 'nevşehir kapadokya cappadocia türkiye tr' },
  { city: 'Konya', country: 'Türkiye', flagCode: 'tr', keywords: 'konya türkiye turkey tr' },
  { city: 'Eskişehir', country: 'Türkiye', flagCode: 'tr', keywords: 'eskişehir türkiye turkey tr' },
  { city: 'Samsun', country: 'Türkiye', flagCode: 'tr', keywords: 'samsun türkiye turkey tr' },
  { city: 'Kayseri', country: 'Türkiye', flagCode: 'tr', keywords: 'kayseri türkiye turkey tr' },
  { city: 'Diyarbakır', country: 'Türkiye', flagCode: 'tr', keywords: 'diyarbakır türkiye turkey tr' },

  // Popüler Dünya Ülkeleri & Şehirleri
  { city: 'Roma', country: 'İtalya', flagCode: 'it', keywords: 'roma italy italya it' },
  { city: 'Milano', country: 'İtalya', flagCode: 'it', keywords: 'milano milan italy italya it' },
  { city: 'Venedik', country: 'İtalya', flagCode: 'it', keywords: 'venedik venice italy italya it' },
  { city: 'Paris', country: 'Fransa', flagCode: 'fr', keywords: 'paris fransa france fr' },
  { city: 'Nice', country: 'Fransa', flagCode: 'fr', keywords: 'nice fransa france fr' },
  { city: 'Londra', country: 'Birleşik Krallık', flagCode: 'gb', keywords: 'londra london ingiltere england uk birleşik krallık gb' },
  { city: 'Manchester', country: 'Birleşik Krallık', flagCode: 'gb', keywords: 'manchester ingiltere england uk gb' },
  { city: 'Berlin', country: 'Almanya', flagCode: 'de', keywords: 'berlin almanya germany de' },
  { city: 'Münih', country: 'Almanya', flagCode: 'de', keywords: 'münih munich almanya germany de' },
  { city: 'Frankfurt', country: 'Almanya', flagCode: 'de', keywords: 'frankfurt almanya germany de' },
  { city: 'Amsterdam', country: 'Hollanda', flagCode: 'nl', keywords: 'amsterdam hollanda netherlands nl' },
  { city: 'Madrid', country: 'İspanya', flagCode: 'es', keywords: 'madrid ispanya spain es' },
  { city: 'Barselona', country: 'İspanya', flagCode: 'es', keywords: 'barselona barcelona ispanya spain es' },
  { city: 'Viyana', country: 'Avusturya', flagCode: 'at', keywords: 'viyana vienna avusturya austria at' },
  { city: 'Zürih', country: 'İsviçre', flagCode: 'ch', keywords: 'zürih zurich isviçre switzerland ch' },
  { city: 'Cenevre', country: 'İsviçre', flagCode: 'ch', keywords: 'cenevre geneva isviçre switzerland ch' },
  { city: 'Prag', country: 'Çekya', flagCode: 'cz', keywords: 'prag prague çekya çek cumhuriyeti czechia cz' },
  { city: 'Budapeşte', country: 'Macaristan', flagCode: 'hu', keywords: 'budapeşte budapest macaristan hungary hu' },
  { city: 'Atina', country: 'Yunanistan', flagCode: 'gr', keywords: 'atina athens yunanistan greece gr' },
  { city: 'Selanik', country: 'Yunanistan', flagCode: 'gr', keywords: 'selanik thessaloniki yunanistan greece gr' },
  { city: 'Lizbon', country: 'Portekiz', flagCode: 'pt', keywords: 'lizbon lisbon portekiz portugal pt' },
  { city: 'Varşova', country: 'Polonya', flagCode: 'pl', keywords: 'varşova warsaw polonya poland pl' },
  { city: 'Bakü', country: 'Azerbaycan', flagCode: 'az', keywords: 'bakü baku azerbaycan azerbaijan az' },
  { city: 'Tiflis', country: 'Gürcistan', flagCode: 'ge', keywords: 'tiflis tbilisi gürcistan georgia ge' },
  { city: 'Batum', country: 'Gürcistan', flagCode: 'ge', keywords: 'batum batumi gürcistan georgia ge' },
  { city: 'Dubai', country: 'Birleşik Arap Emirlikleri', flagCode: 'ae', keywords: 'dubai bae uae birleşik arap emirlikleri ae' },
  { city: 'Abu Dabi', country: 'Birleşik Arap Emirlikleri', flagCode: 'ae', keywords: 'abu dabi abu dhabi bae uae ae' },
  { city: 'Tokyo', country: 'Japonya', flagCode: 'jp', keywords: 'tokyo japonya japan jp' },
  { city: 'New York', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'new york abd usa amerika us' },
  { city: 'Los Angeles', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'los angeles abd usa amerika la us' },
  { city: 'Bangkok', country: 'Tayland', flagCode: 'th', keywords: 'bangkok tayland thailand th' },
  { city: 'Singapur', country: 'Singapur', flagCode: 'sg', keywords: 'singapur singapore sg' },
  { city: 'Kahire', country: 'Mısır', flagCode: 'eg', keywords: 'kahire cairo mısır egypt eg' },
  { city: 'Doha', country: 'Katar', flagCode: 'qa', keywords: 'doha katar qatar qa' },
  { city: 'Riyad', country: 'Suudi Arabistan', flagCode: 'sa', keywords: 'riyad riyadh suudi arabistan saudi arabia sa' }
];

// Helper to normalize strings for case/accent-insensitive search
const normalizeStr = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
};

const cleanCountryName = (c) => {
  if (!c) return '';
  const lower = c.trim().toLowerCase();
  const map = {
    'türkiye cumhuriyeti': 'Türkiye',
    'turkiye cumhuriyeti': 'Türkiye',
    'turkey': 'Türkiye',
    'italya cumhuriyeti': 'İtalya',
    'fransız cumhuriyeti': 'Fransa',
    'almanya federal cumhuriyeti': 'Almanya',
    'helen cumhuriyeti': 'Yunanistan',
    'avusturya cumhuriyeti': 'Avusturya',
    'isviçre konfederasyonu': 'İsviçre',
    'portekiz cumhuriyeti': 'Portekiz',
    'polonya cumhuriyeti': 'Polonya',
    'çek cumhuriyeti': 'Çekya',
    'rusya federasyonu': 'Rusya',
    'çin halk cumhuriyeti': 'Çin',
    'kore cumhuriyeti': 'Güney Kore',
    'mısır arap cumhuriyeti': 'Mısır',
    'katar devleti': 'Katar',
    'suudi arabistan krallığı': 'Suudi Arabistan',
    'amerika birleşik devletleri': 'Amerika Birleşik Devletleri',
    'birleşik arap emirlikleri': 'Birleşik Arap Emirlikleri',
    'birleşik krallık': 'Birleşik Krallık'
  };
  return map[lower] || c;
};

// Filter out non-cities (islands, straits, airports, etc.)
const FORBIDDEN_WORDS = [
  'havalimanı', 'airport', 'aeroport', 'flughafen', 'aeroporto', 'aeropuerto',
  'ada', 'adası', 'island', 'isle', 'boğazı', 'boğaz', 'strait', 'channel',
  'limanı', 'port', 'marina', 'istasyonu', 'station', 'terminal',
  'park', 'parkı', 'old town', 'mahalle', 'köyü', 'gölü', 'dağı'
];

const ALLOWED_FEATURE_CODES = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPL', 'PCLI'];

const isValidPlace = (r) => {
  if (!r || !r.name) return false;
  if (r.feature_code && !ALLOWED_FEATURE_CODES.includes(r.feature_code)) return false;
  const lower = r.name.toLowerCase();
  if (FORBIDDEN_WORDS.some(w => lower.includes(w))) return false;
  if (r.feature_code === 'PPL' && r.population !== undefined && r.population < 15000) return false;
  return true;
};

const getPlaceScore = (r) => {
  let s = 0;
  if (r.feature_code === 'PPLC' || r.feature_code === 'PCLI') s += 100000000;
  else if (r.feature_code === 'PPLA') s += 50000000;
  else if (r.feature_code === 'PPLA2') s += 10000000;
  s += (r.population || 0);
  return s;
};

export default function DistanceCalculator({ isEmbedded = false }) {
  const [origin, setOrigin] = useState('İstanbul');
  const [destination, setDestination] = useState('Roma');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Dropdown Autocomplete States
  const [activeDropdown, setActiveDropdown] = useState(null); // 'origin' | 'destination' | null
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const [isSearching1, setIsSearching1] = useState(false);
  const [isSearching2, setIsSearching2] = useState(false);

  // Integrated Fuel Calculator State
  const [fuelConsumption, setFuelConsumption] = useState(7.5); // L / 100km
  const [fuelPrice, setFuelPrice] = useState(55); // TL / Liter
  const [showFuelDetails, setShowFuelDetails] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Shared search pipeline
  const runLiveSearch = async (query, setSuggestions, setIsSearching) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const normQ = normalizeStr(trimmed);
    const localMatches = POPULAR_GLOBAL_CITIES.filter(item => 
      normalizeStr(item.city).includes(normQ) || 
      normalizeStr(item.country).includes(normQ) || 
      (item.keywords && normalizeStr(item.keywords).includes(normQ))
    ).slice(0, 8);

    setSuggestions(localMatches);

    setIsSearching(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=12&language=tr&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results) {
        const validResults = data.results.filter(isValidPlace);
        validResults.sort((a, b) => getPlaceScore(b) - getPlaceScore(a));

        const apiMatches = validResults.map(r => ({
          city: r.name,
          country: cleanCountryName(r.country || ''),
          flagCode: r.country_code ? r.country_code.toLowerCase() : ''
        }));

        const combined = [...localMatches];
        apiMatches.forEach(am => {
          const normCity = normalizeStr(am.city);
          const normCountry = normalizeStr(am.country);
          const exists = combined.some(c => {
            const cNormCity = normalizeStr(c.city);
            const cNormCountry = normalizeStr(cleanCountryName(c.country));
            if (cNormCity === normCity && cNormCountry === normCountry) return true;
            if (cNormCity === normCity && (cNormCountry.includes(normCountry) || normCountry.includes(cNormCountry))) return true;
            return false;
          });

          if (!exists) {
            combined.push(am);
          }
        });

        setSuggestions(combined.slice(0, 8));
      }
    } catch (err) {
      // Keep local
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runLiveSearch(origin, setSuggestions1, setIsSearching1);
    }, 200);
    return () => clearTimeout(timer);
  }, [origin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runLiveSearch(destination, setSuggestions2, setIsSearching2);
    }, 200);
    return () => clearTimeout(timer);
  }, [destination]);

  // Main Calculation Function
  const handleCalculate = async (orig = origin, dest = destination) => {
    const trimmed1 = orig.trim();
    const trimmed2 = dest.trim();
    if (!trimmed1 || !trimmed2) return;

    setLoading(true);
    setError('');
    try {
      const res = await calculateDistance(trimmed1, trimmed2);
      setResult(res);
    } catch (e) {
      setError(e.message || 'Mesafe hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Initial Calculation on mount
  useEffect(() => {
    handleCalculate('İstanbul', 'Roma');
  }, []);

  // Swap locations
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setActiveDropdown(null);
    handleCalculate(destination, temp);
  };

  // Select suggestion
  const handleSelectSuggestion = (field, item) => {
    if (field === 'origin') {
      setOrigin(item.city);
      setActiveDropdown(null);
      handleCalculate(item.city, destination);
    } else {
      setDestination(item.city);
      setActiveDropdown(null);
      handleCalculate(origin, item.city);
    }
  };

  // Flight duration estimation (Average 800 km/h cruising + 30 min takeoff/landing buffer)
  const getEstimatedFlightDuration = (flightKm) => {
    if (!flightKm) return null;
    const totalMinutes = Math.round((flightKm / 780) * 60) + 30;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours} sa ${mins} dk` : `${mins} dk`;
  };

  // Fuel calculation based on driving distance
  const currentFuelKm = result ? result.drivingDistanceKm : 0;
  const fuelStats = calculateFuelCost({
    distanceKm: currentFuelKm,
    consumptionPer100Km: fuelConsumption,
    fuelPricePerLiter: fuelPrice
  });

  return (
    <div ref={containerRef} style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'left', boxSizing: 'border-box' }}>
      
      {/* ========================================================
          1. HEADER CARD (WARM TRAVEL GRADIENT)
      ======================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
        borderRadius: '16px',
        border: '1.5px solid #F9BED8',
        padding: '12px 14px',
        marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(215, 20, 122, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #B01064 0%, #D7147A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(215, 20, 122, 0.2)'
        }}>
          <Navigation size={17} color="#ffffff" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.2px' }}>
            Mesafe & Rota Planlayıcı
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '1px', lineHeight: 1.3 }}>
            Şehirler arası gerçek sürüş ve kuş uçuşu mesafe & süre analizi
          </div>
        </div>
      </div>

      {/* ========================================================
          2. SEARCH & LOCATION INPUTS (AUTO-CALCULATE)
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #F9BED8',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(215, 20, 122, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a' }}>
            Rota Noktaları
          </span>
          <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Seçildiğinde anında hesaplanır
          </span>
        </div>

        {/* Inputs with Center Swap Button */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Origin Input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              <MapPin size={14} color="#D7147A" />
              <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#94a3b8' }}>Kalkış</span>
            </div>
            <input
              type="text"
              value={origin}
              onFocus={() => setActiveDropdown('origin')}
              onChange={e => {
                setOrigin(e.target.value);
                setActiveDropdown('origin');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setActiveDropdown(null);
                  handleCalculate();
                } else if (e.key === 'Escape') {
                  setActiveDropdown(null);
                }
              }}
              placeholder="Örn: İstanbul, Türkiye"
              style={{
                width: '100%',
                padding: '10px 32px 10px 72px',
                borderRadius: '13px',
                border: activeDropdown === 'origin' ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            />

            {/* Clear Button / Search Loader for Origin */}
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isSearching1 ? (
                <Loader2 size={13} color="#D7147A" style={{ animation: 'spin 1s infinite linear' }} />
              ) : origin ? (
                <button
                  type="button"
                  onClick={() => {
                    setOrigin('');
                    setSuggestions1([]);
                    setActiveDropdown('origin');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            {/* Origin AJAX Suggestions Dropdown */}
            {activeDropdown === 'origin' && suggestions1.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#ffffff',
                borderRadius: '14px',
                border: '1.5px solid #F9BED8',
                boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.14), 0 4px 10px rgba(215, 20, 122, 0.08)',
                zIndex: 60,
                padding: '6px',
                maxHeight: '230px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', padding: '4px 8px 6px', borderBottom: '1px solid #f1f5f9' }}>
                  ÖNERİLEN ŞEHİR VE ÜLKELER
                </div>
                {suggestions1.map((item, idx) => (
                  <button
                    key={`${item.city}-${item.country}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion('origin', item)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '9px',
                      border: 'none',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FDF2F8'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <CountryFlag country={item.flagCode || item.country} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                          {item.city}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                          {item.country}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="#D7147A" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Floating Swap Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '-6px 0',
            zIndex: 2
          }}>
            <button
              type="button"
              onClick={handleSwap}
              title="Kalkış ve Varış Noktasını Değiştir"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1.5px solid #F9BED8',
                boxShadow: '0 2px 6px rgba(215, 20, 122, 0.15)',
                color: '#D7147A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.08) rotate(180deg)';
                e.currentTarget.style.background = '#FDF2F8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <ArrowUpDown size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Destination Input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              <MapPin size={14} color="#0284c7" />
              <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#94a3b8' }}>Varış</span>
            </div>
            <input
              type="text"
              value={destination}
              onFocus={() => setActiveDropdown('destination')}
              onChange={e => {
                setDestination(e.target.value);
                setActiveDropdown('destination');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setActiveDropdown(null);
                  handleCalculate();
                } else if (e.key === 'Escape') {
                  setActiveDropdown(null);
                }
              }}
              placeholder="Örn: Roma, İtalya"
              style={{
                width: '100%',
                padding: '10px 32px 10px 72px',
                borderRadius: '13px',
                border: activeDropdown === 'destination' ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            />

            {/* Clear Button / Search Loader for Destination */}
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isSearching2 ? (
                <Loader2 size={13} color="#0284c7" style={{ animation: 'spin 1s infinite linear' }} />
              ) : destination ? (
                <button
                  type="button"
                  onClick={() => {
                    setDestination('');
                    setSuggestions2([]);
                    setActiveDropdown('destination');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            {/* Destination AJAX Suggestions Dropdown */}
            {activeDropdown === 'destination' && suggestions2.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#ffffff',
                borderRadius: '14px',
                border: '1.5px solid #bae6fd',
                boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.14), 0 4px 10px rgba(2, 132, 199, 0.08)',
                zIndex: 60,
                padding: '6px',
                maxHeight: '230px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', padding: '4px 8px 6px', borderBottom: '1px solid #f1f5f9' }}>
                  ÖNERİLEN ŞEHİR VE ÜLKELER
                </div>
                {suggestions2.map((item, idx) => (
                  <button
                    key={`${item.city}-${item.country}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion('destination', item)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '9px',
                      border: 'none',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <CountryFlag country={item.flagCode || item.country} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                          {item.city}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                          {item.country}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="#0284c7" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subtle loading indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#D7147A',
            marginTop: '10px'
          }}>
            <Loader2 size={13} style={{ animation: 'spin 1s infinite linear' }} />
            <span>Mesafe ve rota güncelleniyor...</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '10px 14px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={15} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          3. RESULT DASHBOARD (VISUAL ROUTE + DUAL CARDS)
      ======================================================== */}
      {result && result.origin && result.destination && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          marginBottom: '16px'
        }}>
          
          {/* Visual Route Header */}
          <div style={{
            background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
            border: '1.5px solid #F9BED8',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Origin City */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <CountryFlag country={result.origin.countryCode || result.origin.country} size="md" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.origin.name}
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                  {result.origin.country}
                </div>
              </div>
            </div>

            {/* Travel Line Connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ height: '1.5px', width: '20px', background: '#D7147A', opacity: 0.6 }} />
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(215, 20, 122, 0.2)'
                }}>
                  <Plane size={11} color="#D7147A" />
                </div>
                <span style={{ height: '1.5px', width: '20px', background: '#D7147A', opacity: 0.6 }} />
              </div>
              <span style={{ fontSize: '8.5px', fontWeight: '700', color: '#B01064', marginTop: '2px' }}>
                ROTA
              </span>
            </div>

            {/* Destination City */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, textAlign: 'right' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.destination.name}
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                  {result.destination.country}
                </div>
              </div>
              <CountryFlag country={result.destination.countryCode || result.destination.country} size="md" />
            </div>
          </div>

          {/* Dual Metrics: Driving vs Flight */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '14px'
          }}>
            {/* Driving Route Card */}
            <div style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fffbf7 100%)',
              border: '1.5px solid #F9BED8',
              borderRadius: '16px',
              padding: '14px 10px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.07)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#FCE7F3',
                color: '#B01064',
                fontSize: '9.5px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '12px',
                marginBottom: '8px'
              }}>
                <Car size={11} color="#D7147A" /> Karayolu
              </div>

              <div style={{
                fontSize: '21px',
                fontWeight: '900',
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.5px'
              }}>
                {result.drivingDistanceKm.toLocaleString('tr-TR')} km
              </div>

              {/* Driving Time Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#FDF2F8',
                border: '1px solid #F9BED8',
                color: '#B01064',
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '8px',
                marginTop: '6px'
              }}>
                <Clock size={11} color="#D7147A" />
                <span>
                  ~{Math.floor(result.drivingDurationMinutes / 60)} sa {result.drivingDurationMinutes % 60} dk
                </span>
              </div>

              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px' }}>
                OSRM Gerçek Rota
              </div>
            </div>

            {/* Flight / Air Distance Card */}
            <div style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
              border: '1.5px solid #bae6fd',
              borderRadius: '16px',
              padding: '14px 10px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '9.5px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '12px',
                marginBottom: '8px'
              }}>
                <Plane size={11} color="#0284c7" /> Kuş Uçuşu
              </div>

              <div style={{
                fontSize: '21px',
                fontWeight: '900',
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.5px'
              }}>
                {result.flightDistanceKm.toLocaleString('tr-TR')} km
              </div>

              {/* Flight Time Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontSize: '10px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '8px',
                marginTop: '6px'
              }}>
                <Clock size={11} color="#0284c7" />
                <span>
                  ~{getEstimatedFlightDuration(result.flightDistanceKm)}
                </span>
              </div>

              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px' }}>
                Direkt Hava Koridoru
              </div>
            </div>
          </div>

          {/* Comparison Bar */}
          {result.drivingDistanceKm > result.flightDistanceKm && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '14px',
              fontSize: '10px',
              color: '#475569',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              💡 Karayolu rotası virajlar ve otoyol ağı nedeniyle doğrudan hava hattından <strong>{(result.drivingDistanceKm - result.flightDistanceKm).toLocaleString('tr-TR')} km</strong> (%{Math.round(((result.drivingDistanceKm - result.flightDistanceKm) / result.flightDistanceKm) * 100)}) daha uzundur.
            </div>
          )}

          {/* ========================================================
              INTEGRATED FUEL & COST ESTIMATION CARD
          ======================================================== */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '16px',
            padding: '13px 14px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fuel size={15} color="#16a34a" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>
                  Bu Rota İçin Tahmini Yakıt Maliyeti
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFuelDetails(!showFuelDetails)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: '9.5px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {showFuelDetails ? 'Kapat' : 'Ayarlar'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: showFuelDetails ? '10px' : '0' }}>
              <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '9.5px', color: '#64748b' }}>Gerekli Yakıt</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#166534' }}>
                  ~{fuelStats.totalFuelLiters.toLocaleString('tr-TR')} Litre
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '9.5px', color: '#64748b' }}>Tahmini Tutar</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#166534' }}>
                  ~{Math.round(fuelStats.totalCost).toLocaleString('tr-TR')} ₺
                </div>
              </div>
            </div>

            {/* Expandable Fuel Setting Sliders */}
            {showFuelDetails && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '10px 12px',
                marginTop: '10px'
              }}>
                {/* Consumption */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    <span>Ortalama Tüketim:</span>
                    <span style={{ color: '#16a34a' }}>{fuelConsumption} L / 100 km</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="0.5"
                    value={fuelConsumption}
                    onChange={e => setFuelConsumption(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                </div>

                {/* Price */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    <span>Litre Yakıt Fiyatı:</span>
                    <span style={{ color: '#16a34a' }}>{fuelPrice} ₺</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="80"
                    step="1"
                    value={fuelPrice}
                    onChange={e => setFuelPrice(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
