import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  ArrowUpDown, 
  Sun, 
  Moon, 
  Sparkles, 
  MapPin, 
  Loader2, 
  ArrowRight, 
  Globe, 
  Info,
  Calendar,
  Zap,
  PhoneCall,
  Search,
  X
} from 'lucide-react';
import CountryFlag from '../../../components/CountryFlag';
import { calculateTimezoneDiff } from '../../../services/travelToolsService';

// Comprehensive global cities database with Turkish country names & keywords for instant AJAX search
// Curated global cities and countries database with Turkish names & keywords for instant AJAX search
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

  // Popüler Dünya Ülkeleri
  { city: 'İtalya', country: 'İtalya', flagCode: 'it', keywords: 'italya italy it roma' },
  { city: 'Almanya', country: 'Almanya', flagCode: 'de', keywords: 'almanya germany de berlin' },
  { city: 'Fransa', country: 'Fransa', flagCode: 'fr', keywords: 'fransa france fr paris' },
  { city: 'İngiltere', country: 'Birleşik Krallık', flagCode: 'gb', keywords: 'ingiltere england uk birleşik krallık gb london londra' },
  { city: 'İspanya', country: 'İspanya', flagCode: 'es', keywords: 'ispanya spain es madrid' },
  { city: 'Amerika Birleşik Devletleri', country: 'Amerika', flagCode: 'us', keywords: 'amerika abd usa us new york washington' },
  { city: 'Yunanistan', country: 'Yunanistan', flagCode: 'gr', keywords: 'yunanistan greece gr atina' },
  { city: 'Hollanda', country: 'Hollanda', flagCode: 'nl', keywords: 'hollanda netherlands nl amsterdam' },
  { city: 'İsviçre', country: 'İsviçre', flagCode: 'ch', keywords: 'isviçre switzerland ch zürih' },
  { city: 'Avusturya', country: 'Avusturya', flagCode: 'at', keywords: 'avusturya austria at viyana' },
  { city: 'Japonya', country: 'Japonya', flagCode: 'jp', keywords: 'japonya japan jp tokyo' },
  { city: 'Birleşik Arap Emirlikleri', country: 'BAE', flagCode: 'ae', keywords: 'birleşik arap emirlikleri bae uae dubai' },
  { city: 'Gürcistan', country: 'Gürcistan', flagCode: 'ge', keywords: 'gürcistan georgia ge tiflis' },
  { city: 'Azerbaycan', country: 'Azerbaycan', flagCode: 'az', keywords: 'azerbaycan azerbaijan az bakü' },
  { city: 'Suudi Arabistan', country: 'Suudi Arabistan', flagCode: 'sa', keywords: 'suudi arabistan saudi arabia sa riyad' },
  { city: 'Katar', country: 'Katar', flagCode: 'qa', keywords: 'katar qatar qa doha' },
  { city: 'Mısır', country: 'Mısır', flagCode: 'eg', keywords: 'mısır egypt eg kahire' },
  { city: 'Tayland', country: 'Tayland', flagCode: 'th', keywords: 'tayland thailand th bangkok' },
  { city: 'Güney Kore', country: 'Güney Kore', flagCode: 'kr', keywords: 'güney kore south korea korea kr seul' },
  { city: 'Portekiz', country: 'Portekiz', flagCode: 'pt', keywords: 'portekiz portugal pt lizbon' },
  { city: 'Polonya', country: 'Polonya', flagCode: 'pl', keywords: 'polonya poland pl varşova' },
  { city: 'Çekya', country: 'Çekya', flagCode: 'cz', keywords: 'çekya czechia cz prag' },
  { city: 'Macaristan', country: 'Macaristan', flagCode: 'hu', keywords: 'macaristan hungary hu budapeşte' },
  { city: 'Rusya', country: 'Rusya', flagCode: 'ru', keywords: 'rusya russia ru moskova' },
  { city: 'Kanada', country: 'Kanada', flagCode: 'ca', keywords: 'kanada canada ca toronto' },
  { city: 'Avustralya', country: 'Avustralya', flagCode: 'au', keywords: 'avustralya australia au sidney' },
  { city: 'Brezilya', country: 'Brezilya', flagCode: 'br', keywords: 'brezilya brazil br rio sao paulo' },

  // Popüler Dünya Şehirleri
  { city: 'Roma', country: 'İtalya', flagCode: 'it', keywords: 'roma italy italya it' },
  { city: 'Milano', country: 'İtalya', flagCode: 'it', keywords: 'milano milan italy italya it' },
  { city: 'Venedik', country: 'İtalya', flagCode: 'it', keywords: 'venedik venice italy italya it' },
  { city: 'Floransa', country: 'İtalya', flagCode: 'it', keywords: 'floransa florence italy italya it' },
  { city: 'Napoli', country: 'İtalya', flagCode: 'it', keywords: 'napoli naples italy italya it' },
  { city: 'Londra', country: 'Birleşik Krallık', flagCode: 'gb', keywords: 'londra london ingiltere england uk birleşik krallık gb' },
  { city: 'Manchester', country: 'Birleşik Krallık', flagCode: 'gb', keywords: 'manchester ingiltere england uk gb' },
  { city: 'Edinburg', country: 'Birleşik Krallık', flagCode: 'gb', keywords: 'edinburg edinburgh iskoçya scotland uk gb' },
  { city: 'Paris', country: 'Fransa', flagCode: 'fr', keywords: 'paris fransa france fr' },
  { city: 'Nice', country: 'Fransa', flagCode: 'fr', keywords: 'nice fransa france fr' },
  { city: 'Lyon', country: 'Fransa', flagCode: 'fr', keywords: 'lyon fransa france fr' },
  { city: 'Berlin', country: 'Almanya', flagCode: 'de', keywords: 'berlin almanya germany de' },
  { city: 'Münih', country: 'Almanya', flagCode: 'de', keywords: 'münih munich almanya germany de' },
  { city: 'Frankfurt', country: 'Almanya', flagCode: 'de', keywords: 'frankfurt almanya germany de' },
  { city: 'Hamburg', country: 'Almanya', flagCode: 'de', keywords: 'hamburg almanya germany de' },
  { city: 'Köln', country: 'Almanya', flagCode: 'de', keywords: 'köln cologne almanya germany de' },
  { city: 'Düsseldorf', country: 'Almanya', flagCode: 'de', keywords: 'düsseldorf almanya germany de' },
  { city: 'Tokyo', country: 'Japonya', flagCode: 'jp', keywords: 'tokyo japonya japan jp' },
  { city: 'Osaka', country: 'Japonya', flagCode: 'jp', keywords: 'osaka japonya japan jp' },
  { city: 'Kyoto', country: 'Japonya', flagCode: 'jp', keywords: 'kyoto japonya japan jp' },
  { city: 'New York', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'new york abd usa amerika us' },
  { city: 'Los Angeles', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'los angeles abd usa amerika la us' },
  { city: 'Miami', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'miami abd usa amerika us' },
  { city: 'San Francisco', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'san francisco sf abd usa amerika us' },
  { city: 'Chicago', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'chicago abd usa amerika us' },
  { city: 'Washington', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'washington dc abd usa amerika us' },
  { city: 'Las Vegas', country: 'Amerika Birleşik Devletleri', flagCode: 'us', keywords: 'las vegas abd usa amerika us' },
  { city: 'Dubai', country: 'Birleşik Arap Emirlikleri', flagCode: 'ae', keywords: 'dubai bae uae birleşik arap emirlikleri ae' },
  { city: 'Abu Dabi', country: 'Birleşik Arap Emirlikleri', flagCode: 'ae', keywords: 'abu dabi abu dhabi bae uae ae' },
  { city: 'Amsterdam', country: 'Hollanda', flagCode: 'nl', keywords: 'amsterdam hollanda netherlands nl' },
  { city: 'Rotterdam', country: 'Hollanda', flagCode: 'nl', keywords: 'rotterdam hollanda netherlands nl' },
  { city: 'Madrid', country: 'İspanya', flagCode: 'es', keywords: 'madrid ispanya spain es' },
  { city: 'Barselona', country: 'İspanya', flagCode: 'es', keywords: 'barselona barcelona ispanya spain es' },
  { city: 'Sevilla', country: 'İspanya', flagCode: 'es', keywords: 'sevilla seville ispanya spain es' },
  { city: 'Viyana', country: 'Avusturya', flagCode: 'at', keywords: 'viyana vienna avusturya austria at' },
  { city: 'Zürih', country: 'İsviçre', flagCode: 'ch', keywords: 'zürih zurich isviçre switzerland ch' },
  { city: 'Cenevre', country: 'İsviçre', flagCode: 'ch', keywords: 'cenevre geneva isviçre switzerland ch' },
  { city: 'Prag', country: 'Çekya', flagCode: 'cz', keywords: 'prag prague çekya çek cumhuriyeti czechia cz' },
  { city: 'Budapeşte', country: 'Macaristan', flagCode: 'hu', keywords: 'budapeşte budapest macaristan hungary hu' },
  { city: 'Atina', country: 'Yunanistan', flagCode: 'gr', keywords: 'atina athens yunanistan greece gr' },
  { city: 'Selanik', country: 'Yunanistan', flagCode: 'gr', keywords: 'selanik thessaloniki yunanistan greece gr' },
  { city: 'Lizbon', country: 'Portekiz', flagCode: 'pt', keywords: 'lizbon lisbon portekiz portugal pt' },
  { city: 'Porto', country: 'Portekiz', flagCode: 'pt', keywords: 'porto portekiz portugal pt' },
  { city: 'Varşova', country: 'Polonya', flagCode: 'pl', keywords: 'varşova warsaw polonya poland pl' },
  { city: 'Krakow', country: 'Polonya', flagCode: 'pl', keywords: 'krakow polonya poland pl' },
  { city: 'Bakü', country: 'Azerbaycan', flagCode: 'az', keywords: 'bakü baku azerbaycan azerbaijan az' },
  { city: 'Tiflis', country: 'Gürcistan', flagCode: 'ge', keywords: 'tiflis tbilisi gürcistan georgia ge' },
  { city: 'Batum', country: 'Gürcistan', flagCode: 'ge', keywords: 'batum batumi gürcistan georgia ge' },
  { city: 'Bangkok', country: 'Tayland', flagCode: 'th', keywords: 'bangkok tayland thailand th' },
  { city: 'Phuket', country: 'Tayland', flagCode: 'th', keywords: 'phuket tayland thailand th' },
  { city: 'Singapur', country: 'Singapur', flagCode: 'sg', keywords: 'singapur singapore sg' },
  { city: 'Seul', country: 'Güney Kore', flagCode: 'kr', keywords: 'seul seoul güney kore korea kr' },
  { city: 'Kahire', country: 'Mısır', flagCode: 'eg', keywords: 'kahire cairo mısır egypt eg' },
  { city: 'Doha', country: 'Katar', flagCode: 'qa', keywords: 'doha katar qatar qa' },
  { city: 'Riyad', country: 'Suudi Arabistan', flagCode: 'sa', keywords: 'riyad riyadh suudi arabistan saudi arabia sa' },
  { city: 'Cidde', country: 'Suudi Arabistan', flagCode: 'sa', keywords: 'cidde jeddah suudi arabistan saudi arabia sa' },
  { city: 'Moskova', country: 'Rusya', flagCode: 'ru', keywords: 'moskova moscow rusya russia ru' },
  { city: 'St. Petersburg', country: 'Rusya', flagCode: 'ru', keywords: 'st petersburg rusya russia ru' },
  { city: 'Toronto', country: 'Kanada', flagCode: 'ca', keywords: 'toronto kanada canada ca' },
  { city: 'Sidney', country: 'Avustralya', flagCode: 'au', keywords: 'sidney sydney avustralya australia au' }
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

// Map official long diplomatic country names to everyday clean Turkish country names
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

// Words that indicate non-city or non-country features (airports, islands, straits, canals, etc.)
const FORBIDDEN_PLACE_WORDS = [
  'havalimanı', 'airport', 'aeroport', 'flughafen', 'aeroporto', 'aeropuerto', 'heliport',
  'ada', 'adası', 'island', 'isle', 'boğazı', 'boğaz', 'strait', 'channel', 'canal',
  'limanı', 'port', 'marina', 'harbor',
  'istasyonu', 'station', 'terminal', 'garı',
  'park', 'parkı', 'garden',
  'old town', 'eski şehir', 'mahalle', 'mahallesi', 'district', 'quarter', 'sektörü',
  'köyü', 'köy', 'village',
  'gölü', 'lake', 'dağı', 'mountain', 'tepesi', 'hill'
];

// Only allow feature codes for countries, capitals, major administrative cities, or populated cities
const ALLOWED_FEATURE_CODES = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPL', 'PCLI'];

const isValidPlace = (r) => {
  if (!r || !r.name) return false;
  if (r.feature_code && !ALLOWED_FEATURE_CODES.includes(r.feature_code)) return false;

  const lowerName = r.name.toLowerCase();
  if (FORBIDDEN_PLACE_WORDS.some(w => lowerName.includes(w))) return false;

  // Filter out tiny hamlets if generic PPL with low/empty population
  if (r.feature_code === 'PPL' && r.population !== undefined && r.population < 15000) {
    return false;
  }

  return true;
};

// Priority score: Countries and Capitals > Major administrative hubs > Population
const getPlaceScore = (r) => {
  let score = 0;
  if (r.feature_code === 'PPLC' || r.feature_code === 'PCLI') score += 100000000;
  else if (r.feature_code === 'PPLA') score += 50000000;
  else if (r.feature_code === 'PPLA2') score += 10000000;
  score += (r.population || 0);
  return score;
};

export default function TimezoneCalculator({ isEmbedded = false }) {
  const [city1, setCity1] = useState('İstanbul');
  const [city2, setCity2] = useState('Roma');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // AJAX Live Search States
  const [activeDropdown, setActiveDropdown] = useState(null); // 'city1' | 'city2' | null
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const [isSearching1, setIsSearching1] = useState(false);
  const [isSearching2, setIsSearching2] = useState(false);

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
  
  // Realtime live clock ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Shared search pipeline for city1 & city2
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

    // Call Open-Meteo Geocoding for live online expansion
    setIsSearching(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=12&language=tr&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results) {
        // Filter out non-city and non-country features
        const validResults = data.results.filter(isValidPlace);
        // Sort by political importance & population
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
          // Deduplicate: Don't add if already in the list
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
      // Keep local matches on error
    } finally {
      setIsSearching(false);
    }
  };

  // AJAX search query handler for city1
  useEffect(() => {
    const timer = setTimeout(() => {
      runLiveSearch(city1, setSuggestions1, setIsSearching1);
    }, 200);
    return () => clearTimeout(timer);
  }, [city1]);

  // AJAX search query handler for city2
  useEffect(() => {
    const timer = setTimeout(() => {
      runLiveSearch(city2, setSuggestions2, setIsSearching2);
    }, 200);
    return () => clearTimeout(timer);
  }, [city2]);

  // Calculate timezone difference
  const handleCalculate = async (c1 = city1, c2 = city2) => {
    const trimmed1 = c1.trim();
    const trimmed2 = c2.trim();
    if (!trimmed1 || !trimmed2) return;

    setLoading(true);
    setError('');
    try {
      const res = await calculateTimezoneDiff(trimmed1, trimmed2);
      setResult(res);
    } catch (e) {
      setError(e.message || 'Saat farkı hesaplanamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation on mount
  useEffect(() => {
    handleCalculate('İstanbul', 'Roma');
  }, []);

  // Swap cities
  const handleSwap = () => {
    const temp = city1;
    setCity1(city2);
    setCity2(temp);
    setActiveDropdown(null);
    handleCalculate(city2, temp);
  };

  // Select suggestion from dropdown
  const handleSelectSuggestion = (field, item) => {
    if (field === 'city1') {
      setCity1(item.city);
      setActiveDropdown(null);
      handleCalculate(item.city, city2);
    } else {
      setCity2(item.city);
      setActiveDropdown(null);
      handleCalculate(city1, item.city);
    }
  };

  // Helper to get formatted live time for a specific IANA timezone
  const getLiveTimeForTz = (tzString) => {
    if (!tzString) return null;
    try {
      const formatterTime = new Intl.DateTimeFormat('tr-TR', {
        timeZone: tzString,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const formatterDate = new Intl.DateTimeFormat('tr-TR', {
        timeZone: tzString,
        day: 'numeric',
        month: 'long',
        weekday: 'long'
      });
      const hourOnly = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: tzString, hour: 'numeric', hour12: false }).format(currentTime),
        10
      );
      const isDay = hourOnly >= 6 && hourOnly < 20;

      // Extract accurate shortOffset (e.g. GMT+3, GMT+2, GMT-4)
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tzString,
        timeZoneName: 'shortOffset'
      }).formatToParts(currentTime);
      const gmtOffset = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';

      return {
        time: formatterTime.format(currentTime),
        date: formatterDate.format(currentTime),
        gmtOffset,
        isDay,
        hourOnly
      };
    } catch (err) {
      return null;
    }
  };

  // Format GMT offset display (+03:00, -05:00)
  const formatOffset = (offsetHours) => {
    if (offsetHours === undefined || offsetHours === null) return 'UTC';
    const sign = offsetHours >= 0 ? '+' : '-';
    const abs = Math.abs(offsetHours);
    return `GMT${sign}${abs}`;
  };

  // Smart Jet Lag advice based on difference
  const getJetLagAdvice = (diff) => {
    const abs = Math.abs(diff || 0);
    if (abs === 0) {
      return {
        title: 'Aynı Saat Dilimi',
        tag: 'Jet Lag Yok',
        badgeBg: '#f0fdf4',
        badgeColor: '#166534',
        badgeBorder: '#bbf7d0',
        text: 'Bu iki şehir aynı saat diliminde yer alır. Biyolojik ritminizde veya uyku düzeninizde hiçbir değişiklik yaşanmaz.'
      };
    }
    if (abs <= 2) {
      return {
        title: 'Hafif Saat Farkı',
        tag: 'Kolay Uyum',
        badgeBg: '#f0fdf4',
        badgeColor: '#166534',
        badgeBorder: '#bbf7d0',
        text: 'Vücudunuz 24 saat içinde kolayca uyum sağlar. Seyahatin ilk akşamı yatış saatinizi hafifçe esnetmek yeterlidir.'
      };
    }
    if (abs <= 5) {
      return {
        title: 'Orta Düzey Saat Farkı',
        tag: '1-2 Gün Uyum',
        badgeBg: '#fffbeb',
        badgeColor: '#b45309',
        badgeBorder: '#fde68a',
        text: 'Varış günü bol gün ışığı alın ve yerel saate göre akşam yemeği yiyin. Uçuş süresince bol su tüketmeniz adaptasyonu hızlandırır.'
      };
    }
    return {
      title: 'Yüksek Saat Farkı (Jet Lag)',
      tag: 'Özenli Planlama',
      badgeBg: '#FDF2F8',
      badgeColor: '#B01064',
      badgeBorder: '#F9BED8',
      text: 'Biyolojik saatiniz zorlanabilir. Varış gününde yerel uyku vaktine kadar uyumamaya çalışın, ilk 2 gün ağır programlardan kaçının.'
    };
  };

  // Best Calling Window (Overlapping business/friendly hours)
  const getCallingWindow = (diff) => {
    if (diff === undefined || diff === null) return null;
    const abs = Math.abs(diff);
    if (abs > 8) {
      return 'Büyük saat farkı nedeniyle ortak uyanık saatler kısıtlıdır. En uygun görüşme Türkiye saatiyle sabah 09:00 - 11:00 veya akşam 21:00 - 23:00 aralığıdır.';
    }
    return `Telefon veya iş görüşmeleri için en verimli aralık Türkiye saatiyle 11:00 – 18:00 arasıdır (Hedef şehirde ${diff >= 0 ? `11:00+${diff}` : `11:00-${abs}`}'e denk gelir).`;
  };

  const advice = result ? getJetLagAdvice(result.diffHours) : null;
  const liveCity1 = result?.city1?.timezone ? getLiveTimeForTz(result.city1.timezone) : null;
  const liveCity2 = result?.city2?.timezone ? getLiveTimeForTz(result.city2.timezone) : null;

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'left', boxSizing: 'border-box' }}>
      
      {/* ========================================================
          1. HEADER CARD (WARM CORPORATE THEME)
      ======================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
        borderRadius: '20px',
        border: '1.5px solid #F9BED8',
        padding: '16px 18px',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(215, 20, 122, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '13px',
          background: 'linear-gradient(135deg, #B01064 0%, #D7147A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
        }}>
          <Clock size={22} strokeWidth={2.4} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
              Dünya Saat Farkı Hesaplayıcı
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              padding: '1px 6px',
              borderRadius: '5px',
              background: '#FCE7F3',
              color: '#D7147A'
            }}>
              Canlı
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>
            Seyahat edeceğiniz şehir ile canlı saat farkını ve yerel saatleri anında öğrenin.
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CITY INPUT WITH AJAX AUTOCOMPLETE CARD
      ======================================================== */}
      <div 
        ref={containerRef}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Globe size={13} color="#D7147A" />
            <span>Şehirleri Belirleyin</span>
          </div>
          <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Şehir veya ülke adıyla canlı arayın
          </span>
        </div>

        {/* Inputs with Center Swap Button */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* City 1 Input */}
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
              <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#94a3b8' }}>1. Şehir</span>
            </div>
            <input
              type="text"
              value={city1}
              onFocus={() => setActiveDropdown('city1')}
              onChange={e => {
                setCity1(e.target.value);
                setActiveDropdown('city1');
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
                border: activeDropdown === 'city1' ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            />

            {/* Clear Button / Search Loader for City 1 */}
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isSearching1 ? (
                <Loader2 size={13} color="#D7147A" style={{ animation: 'spin 1s infinite linear' }} />
              ) : city1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCity1('');
                    setSuggestions1([]);
                    setActiveDropdown('city1');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            {/* City 1 AJAX Suggestions Dropdown */}
            {activeDropdown === 'city1' && suggestions1.length > 0 && (
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
                    onClick={() => handleSelectSuggestion('city1', item)}
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
              title="Şehirlerin Yerini Değiştir"
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

          {/* City 2 Input */}
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
              <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#94a3b8' }}>2. Şehir</span>
            </div>
            <input
              type="text"
              value={city2}
              onFocus={() => setActiveDropdown('city2')}
              onChange={e => {
                setCity2(e.target.value);
                setActiveDropdown('city2');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setActiveDropdown(null);
                  handleCalculate();
                } else if (e.key === 'Escape') {
                  setActiveDropdown(null);
                }
              }}
              placeholder="Örn: Roma, Tokyo, Almanya, Japonya..."
              style={{
                width: '100%',
                padding: '10px 32px 10px 72px',
                borderRadius: '13px',
                border: activeDropdown === 'city2' ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            />

            {/* Clear Button / Search Loader for City 2 */}
            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isSearching2 ? (
                <Loader2 size={13} color="#0284c7" style={{ animation: 'spin 1s infinite linear' }} />
              ) : city2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCity2('');
                    setSuggestions2([]);
                    setActiveDropdown('city2');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            {/* City 2 AJAX Suggestions Dropdown */}
            {activeDropdown === 'city2' && suggestions2.length > 0 && (
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
                    onClick={() => handleSelectSuggestion('city2', item)}
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
            <span>Saat farkı güncelleniyor...</span>
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
          3. RESULT CARD (THEMATIC CLOCKS & VERDICT)
      ======================================================== */}
      {result && result.city1 && result.city2 && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          marginBottom: '16px'
        }}>
          
          {/* Top Verdict Banner */}
          <div style={{
            background: result.diffHours === 0 
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
              : 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
            border: result.diffHours === 0 ? '1.5px solid #86efac' : '1.5px solid #F9BED8',
            borderRadius: '14px',
            padding: '11px 13px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <Clock size={17} color={result.diffHours === 0 ? '#16a34a' : '#D7147A'} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '800',
                color: result.diffHours === 0 ? '#166534' : '#B01064',
                letterSpacing: '-0.2px'
              }}>
                {result.diffHours === 0 ? (
                  'Aynı Yerel Saat Dilimi'
                ) : (
                  `${Math.abs(result.diffHours)} Saat ${result.diffHours > 0 ? 'İleride' : 'Geride'}`
                )}
              </div>
              <div style={{ fontSize: '10px', color: '#334155', fontWeight: '500', marginTop: '4px', lineHeight: 1.35 }}>
                {result.description}
              </div>
            </div>
          </div>

          {/* Dual City Clocks: Side by Side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* City 1 Clock Card (Reference / Origin) */}
            <div style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fffbf7 100%)',
              border: '1.5px solid #F9BED8',
              borderRadius: '16px',
              padding: '13px 10px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.07), 0 2px 6px rgba(15, 23, 42, 0.03)',
              position: 'relative'
            }}>
              {/* City & Country */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', maxWidth: '100%' }}>
                <CountryFlag country={result.city1.countryCode || result.city1.flagCode || result.city1.country} size="md" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {result.city1.name}
                </span>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                fontWeight: '500',
                marginBottom: '10px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {result.city1.country}
              </div>

              {/* Live Digital Clock Dial */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #F9BED8',
                borderRadius: '12px',
                padding: '8px 6px 7px',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '9px',
                boxShadow: '0 2px 6px rgba(215, 20, 122, 0.04)'
              }}>
                <div style={{
                  fontSize: '19px',
                  fontWeight: '900',
                  color: '#0f172a',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  letterSpacing: '-0.3px'
                }}>
                  {liveCity1 ? liveCity1.time : result.city1.formattedTime?.split(' ')[4] || `${result.city1.hourNum}:00`}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: liveCity1?.isDay ? '#fef3c7' : '#ede9fe',
                  color: liveCity1?.isDay ? '#92400e' : '#5b21b6',
                  border: liveCity1?.isDay ? '1px solid #fde68a' : '1px solid #ddd6fe',
                  borderRadius: '12px',
                  padding: '1.5px 7px',
                  fontSize: '9px',
                  fontWeight: '700',
                  marginTop: '5px'
                }}>
                  {liveCity1?.isDay ? <Sun size={11} color="#d97706" /> : <Moon size={11} color="#7c3aed" />}
                  <span>{liveCity1?.isDay ? 'Gündüz Vakti' : 'Gece Vakti'}</span>
                </div>
              </div>

              {/* Timezone & Date */}
              <div style={{
                display: 'inline-block',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: '9.5px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '6px',
                marginBottom: '4px',
                letterSpacing: '0.2px'
              }}>
                {liveCity1?.gmtOffset || result.city1.gmtOffset || formatOffset(result.city1.offsetHours)}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
                {liveCity1?.date || result.city1.formattedTime?.split(' ').slice(0, 3).join(' ')}
              </div>
            </div>

            {/* City 2 Clock Card (Target / Destination) */}
            <div style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
              border: '1.5px solid #bae6fd',
              borderRadius: '16px',
              padding: '13px 10px 12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.08), 0 2px 6px rgba(15, 23, 42, 0.03)',
              position: 'relative'
            }}>
              {/* City & Country */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', maxWidth: '100%' }}>
                <CountryFlag country={result.city2.countryCode || result.city2.flagCode || result.city2.country} size="md" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {result.city2.name}
                </span>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                fontWeight: '500',
                marginBottom: '10px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {result.city2.country}
              </div>

              {/* Live Digital Clock Dial */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #bae6fd',
                borderRadius: '12px',
                padding: '8px 6px 7px',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '9px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.04)'
              }}>
                <div style={{
                  fontSize: '19px',
                  fontWeight: '900',
                  color: '#0f172a',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  letterSpacing: '-0.3px'
                }}>
                  {liveCity2 ? liveCity2.time : result.city2.formattedTime?.split(' ')[4] || `${result.city2.hourNum}:00`}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: liveCity2?.isDay ? '#fef3c7' : '#ede9fe',
                  color: liveCity2?.isDay ? '#92400e' : '#5b21b6',
                  border: liveCity2?.isDay ? '1px solid #fde68a' : '1px solid #ddd6fe',
                  borderRadius: '12px',
                  padding: '1.5px 7px',
                  fontSize: '9px',
                  fontWeight: '700',
                  marginTop: '5px'
                }}>
                  {liveCity2?.isDay ? <Sun size={11} color="#d97706" /> : <Moon size={11} color="#7c3aed" />}
                  <span>{liveCity2?.isDay ? 'Gündüz Vakti' : 'Gece Vakti'}</span>
                </div>
              </div>

              {/* Timezone & Date */}
              <div style={{
                display: 'inline-block',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: '9.5px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '6px',
                marginBottom: '4px',
                letterSpacing: '0.2px'
              }}>
                {liveCity2?.gmtOffset || result.city2.gmtOffset || formatOffset(result.city2.offsetHours)}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>
                {liveCity2?.date || result.city2.formattedTime?.split(' ').slice(0, 3).join(' ')}
              </div>
            </div>
          </div>

          {/* Jet Lag & Biological Clock Advice Card */}
          {advice && (
            <div style={{
              background: advice.badgeBg,
              border: `1px solid ${advice.badgeBorder}`,
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '10px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} color={advice.badgeColor} />
                  <span style={{ fontSize: '11px', fontWeight: '800', color: advice.badgeColor }}>
                    {advice.title}
                  </span>
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '1.5px 6px',
                  borderRadius: '5px',
                  background: '#ffffff',
                  color: advice.badgeColor,
                  border: `1px solid ${advice.badgeBorder}`
                }}>
                  {advice.tag}
                </span>
              </div>
              <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.45, marginTop: '2px' }}>
                {advice.text}
              </div>
            </div>
          )}

          {/* Best Calling Window Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            textAlign: 'left'
          }}>
            <PhoneCall size={15} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                Görüşme & Mesai Saatleri Uyumu
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
                {getCallingWindow(result.diffHours)}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          4. POPULAR WORLD HUBS LIVE OVERVIEW TABLE
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '14px 16px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="#D7147A" />
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a' }}>
              Türkiye'ye Göre Önemli Şehirler
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
            İstanbul GMT+3 Referans
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { name: 'Londra', country: 'gb', tz: 'Europe/London', diff: '-2 sa' },
            { name: 'Paris / Berlin / Roma', country: 'fr', tz: 'Europe/Paris', diff: '-1 sa' },
            { name: 'Dubai', country: 'ae', tz: 'Asia/Dubai', diff: '+1 sa' },
            { name: 'Bangkok', country: 'th', tz: 'Asia/Bangkok', diff: '+4 sa' },
            { name: 'Tokyo', country: 'jp', tz: 'Asia/Tokyo', diff: '+6 sa' },
            { name: 'New York', country: 'us', tz: 'America/New_York', diff: '-7 sa' },
            { name: 'Los Angeles', country: 'us', tz: 'America/Los_Angeles', diff: '-10 sa' }
          ].map(hub => {
            const live = getLiveTimeForTz(hub.tz);
            return (
              <div
                key={hub.name}
                onClick={() => {
                  const targetCity = hub.name.includes('/') ? hub.name.split('/')[0].trim() : hub.name;
                  setCity2(targetCity);
                  setActiveDropdown(null);
                  handleCalculate(city1, targetCity);
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FDF2F8';
                  e.currentTarget.style.borderColor = '#F9BED8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <CountryFlag country={hub.country} size="sm" />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1e293b' }}>
                    {hub.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#D7147A', background: '#FCE7F3', padding: '2px 7px', borderRadius: '6px' }}>
                    {hub.diff}
                  </span>
                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    {live ? live.time.slice(0, 5) : '--:--'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
