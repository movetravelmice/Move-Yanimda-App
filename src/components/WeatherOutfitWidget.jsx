import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon,
  Cloud, 
  CloudSun, 
  CloudMoon,
  CloudRain, 
  CloudHail,
  CloudSnow, 
  CloudLightning, 
  CloudFog,
  Droplets,
  Wind, 
  Sparkles,
  ChevronRight,
  Search,
  X,
  MapPin,
  Loader2,
  LocateFixed
} from 'lucide-react';

const POPULAR_DESTINATIONS = [
  { id: 'istanbul', name: 'İstanbul', country: 'Türkiye', countryCode: 'TR', flag: '🇹🇷', lat: 41.0082, lon: 28.9784 },
  { id: 'antalya', name: 'Antalya', country: 'Türkiye', countryCode: 'TR', flag: '🇹🇷', lat: 36.8969, lon: 30.7133 },
  { id: 'izmir', name: 'İzmir', country: 'Türkiye', countryCode: 'TR', flag: '🇹🇷', lat: 38.4192, lon: 27.1287 },
  { id: 'ankara', name: 'Ankara', country: 'Türkiye', countryCode: 'TR', flag: '🇹🇷', lat: 39.9334, lon: 32.8597 },
  { id: 'bodrum', name: 'Bodrum', country: 'Türkiye', countryCode: 'TR', flag: '🇹🇷', lat: 37.0344, lon: 27.4305 },
  { id: 'roma', name: 'Roma', country: 'İtalya', countryCode: 'IT', flag: '🇮🇹', lat: 41.9028, lon: 12.4964 },
  { id: 'milano', name: 'Milano', country: 'İtalya', countryCode: 'IT', flag: '🇮🇹', lat: 45.4642, lon: 9.1900 },
  { id: 'paris', name: 'Paris', country: 'Fransa', countryCode: 'FR', flag: '🇫🇷', lat: 48.8566, lon: 2.3522 },
  { id: 'londra', name: 'Londra', country: 'İngiltere', countryCode: 'GB', flag: '🇬🇧', lat: 51.5074, lon: -0.1278 },
  { id: 'dubai', name: 'Dubai', country: 'BAE', countryCode: 'AE', flag: '🇦🇪', lat: 25.2048, lon: 55.2708 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japonya', countryCode: 'JP', flag: '🇯🇵', lat: 35.6762, lon: 139.6503 },
  { id: 'berlin', name: 'Berlin', country: 'Almanya', countryCode: 'DE', flag: '🇩🇪', lat: 52.5200, lon: 13.4050 },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Hollanda', countryCode: 'NL', flag: '🇳🇱', lat: 52.3676, lon: 4.9041 },
  { id: 'barselona', name: 'Barselona', country: 'İspanya', countryCode: 'ES', flag: '🇪🇸', lat: 41.3879, lon: 2.1699 },
  { id: 'madrid', name: 'Madrid', country: 'İspanya', countryCode: 'ES', flag: '🇪🇸', lat: 40.4168, lon: -3.7038 },
  { id: 'viyana', name: 'Viyana', country: 'Avusturya', countryCode: 'AT', flag: '🇦🇹', lat: 48.2082, lon: 16.3738 },
  { id: 'prag', name: 'Prag', country: 'Çekya', countryCode: 'CZ', flag: '🇨🇿', lat: 50.0755, lon: 14.4378 },
  { id: 'budapeste', name: 'Budapeşte', country: 'Macaristan', countryCode: 'HU', flag: '🇭🇺', lat: 47.4979, lon: 19.0402 },
  { id: 'atina', name: 'Atina', country: 'Yunanistan', countryCode: 'GR', flag: '🇬🇷', lat: 37.9838, lon: 23.7275 },
  { id: 'newyork', name: 'New York', country: 'ABD', countryCode: 'US', flag: '🇺🇸', lat: 40.7128, lon: -74.0060 },
  { id: 'bangkok', name: 'Bangkok', country: 'Tayland', countryCode: 'TH', flag: '🇹🇭', lat: 13.7563, lon: 100.5018 },
  { id: 'singapur', name: 'Singapur', country: 'Singapur', countryCode: 'SG', flag: '🇸🇬', lat: 1.3521, lon: 103.8198 },
  { id: 'seul', name: 'Seul', country: 'Güney Kore', countryCode: 'KR', flag: '🇰🇷', lat: 37.5665, lon: 126.9780 },
  { id: 'zurih', name: 'Zürih', country: 'İsviçre', countryCode: 'CH', flag: '🇨🇭', lat: 47.3769, lon: 8.5417 },
  { id: 'lizbon', name: 'Lizbon', country: 'Portekiz', countryCode: 'PT', flag: '🇵🇹', lat: 38.7223, lon: -9.1393 },
  { id: 'kahire', name: 'Kahire', country: 'Mısır', countryCode: 'EG', flag: '🇪🇬', lat: 30.0444, lon: 31.2357 }
];

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  return countryCode
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

function normalizeStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function getWeatherMeta(code, isDay = true) {
  // 1. Dolu & Donan Yağmur (Hail)
  if ([66, 67, 87, 88].includes(code) || code === 96 || code === 99) {
    return {
      text: code === 96 || code === 99 ? 'Dolu & Şiddetli Fırtına' : 'Dolu Yağışlı',
      icon: CloudHail,
      iconColor: '#0891b2',
      badge: '🧊 Dolu Uyarısı',
      badgeBg: '#ecfeff',
      badgeBorder: '#a5f3fc',
      badgeColor: '#0e7490',
      accentColor: '#0891b2',
      theme: 'hail',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 55%, #ecfeff 100%)',
      borderColor: '#a5f3fc',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)',
      iconStageBorder: '#a5f3fc',
      halo: 'rgba(6, 182, 212, 0.15)',
      cardShadow: '0 3px 12px rgba(8, 145, 178, 0.06)'
    };
  }

  // 2. Kar Yağışı (Snow)
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      text: [75, 86].includes(code) ? 'Yoğun Kar Yağışı' : 'Kar Yağışlı',
      icon: CloudSnow,
      iconColor: '#0284c7',
      badge: '❄️ Kar Yağışlı',
      badgeBg: '#f0f9ff',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      accentColor: '#0284c7',
      theme: 'snow',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)',
      borderColor: '#bae6fd',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
      iconStageBorder: '#bae6fd',
      halo: 'rgba(14, 165, 233, 0.15)',
      cardShadow: '0 3px 12px rgba(2, 132, 199, 0.06)'
    };
  }

  // 3. Gök Gürültülü Fırtına (Thunderstorm)
  if (code === 95) {
    return {
      text: 'Gök Gürültülü Fırtına',
      icon: CloudLightning,
      iconColor: '#9333ea',
      badge: '⚡ Fırtına Uyarısı',
      badgeBg: '#faf5ff',
      badgeBorder: '#e9d5ff',
      badgeColor: '#7e22ce',
      accentColor: '#9333ea',
      theme: 'storm',
      bg: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 55%, #f3e8ff 100%)',
      borderColor: '#e9d5ff',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
      iconStageBorder: '#e9d5ff',
      halo: 'rgba(147, 51, 234, 0.15)',
      cardShadow: '0 3px 12px rgba(147, 51, 234, 0.06)'
    };
  }

  // 4. Yağmur & Sağanak (Rain & Showers)
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return {
      text: [65, 82].includes(code) ? 'Kuvvetli Sağanak' : 'Yağmurlu',
      icon: CloudRain,
      iconColor: '#0284c7',
      badge: '🌧️ Yağmurlu',
      badgeBg: '#f0f9ff',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      accentColor: '#0284c7',
      theme: 'rain',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)',
      borderColor: '#bae6fd',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
      iconStageBorder: '#bae6fd',
      halo: 'rgba(2, 132, 199, 0.15)',
      cardShadow: '0 3px 12px rgba(2, 132, 199, 0.06)'
    };
  }

  // 5. Hafif Çisenti (Drizzle)
  if ([51, 53, 55].includes(code)) {
    return {
      text: 'Hafif Çisenti',
      icon: Droplets,
      iconColor: '#0284c7',
      badge: '🌦️ Çisenti',
      badgeBg: '#f0f9ff',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      accentColor: '#0284c7',
      theme: 'drizzle',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)',
      borderColor: '#bae6fd',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
      iconStageBorder: '#bae6fd',
      halo: 'rgba(2, 132, 199, 0.15)',
      cardShadow: '0 3px 12px rgba(2, 132, 199, 0.06)'
    };
  }

  // 6. Sisli & Puslu (Fog & Mist)
  if (code === 45 || code === 48) {
    return {
      text: 'Sisli & Puslu',
      icon: CloudFog,
      iconColor: '#64748b',
      badge: '🌫️ Sisli & Puslu',
      badgeBg: '#f8fafc',
      badgeBorder: '#e2e8f0',
      badgeColor: '#475569',
      accentColor: '#64748b',
      theme: 'fog',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
      borderColor: '#e2e8f0',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      iconStageBorder: '#e2e8f0',
      halo: 'rgba(100, 116, 139, 0.12)',
      cardShadow: '0 3px 12px rgba(100, 116, 139, 0.05)'
    };
  }

  // 7. Çok Bulutlu / Kapalı (Overcast)
  if (code === 3) {
    return {
      text: 'Çok Bulutlu',
      icon: Cloud,
      iconColor: '#64748b',
      badge: '☁️ Çok Bulutlu',
      badgeBg: '#f8fafc',
      badgeBorder: '#e2e8f0',
      badgeColor: '#475569',
      accentColor: '#64748b',
      theme: 'overcast',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
      borderColor: '#e2e8f0',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      iconStageBorder: '#e2e8f0',
      halo: 'rgba(100, 116, 139, 0.12)',
      cardShadow: '0 3px 12px rgba(100, 116, 139, 0.05)'
    };
  }

  // 8. Parçalı Bulutlu (Partly Cloudy)
  if (code === 1 || code === 2) {
    if (!isDay) {
      return {
        text: 'Parçalı Bulutlu',
        icon: CloudMoon,
        iconColor: '#6366f1',
        badge: '🌙 Gece Bulutlu',
        badgeBg: '#f5f3ff',
        badgeBorder: '#ddd6fe',
        badgeColor: '#4f46e5',
        accentColor: '#4f46e5',
        theme: 'night_cloudy',
        bg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 55%, #ede9fe 100%)',
        borderColor: '#ddd6fe',
        iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
        iconStageBorder: '#ddd6fe',
        halo: 'rgba(99, 102, 241, 0.14)',
        cardShadow: '0 3px 12px rgba(99, 102, 241, 0.06)'
      };
    }
    return {
      text: 'Parçalı Bulutlu',
      icon: CloudSun,
      iconColor: '#D7147A',
      badge: '🌤️ Parçalı Bulutlu',
      badgeBg: '#FDF2F8',
      badgeBorder: '#F9BED8',
      badgeColor: '#B01064',
      accentColor: '#D7147A',
      theme: 'day_cloudy',
      bg: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 55%, #FDF2F8 100%)',
      borderColor: '#F9BED8',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
      iconStageBorder: '#F9BED8',
      halo: 'rgba(215, 20, 122, 0.15)',
      cardShadow: '0 3px 12px rgba(215, 20, 122, 0.06)'
    };
  }

  // 9. Açık Gece (Clear Sky - Night)
  if (!isDay) {
    return {
      text: 'Açık & Gece',
      icon: Moon,
      iconColor: '#6366f1',
      badge: '🌙 Açık Gece',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      badgeColor: '#4f46e5',
      accentColor: '#4f46e5',
      theme: 'night_clear',
      bg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 55%, #ede9fe 100%)',
      borderColor: '#ddd6fe',
      iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
      iconStageBorder: '#ddd6fe',
      halo: 'rgba(99, 102, 241, 0.16)',
      cardShadow: '0 3px 12px rgba(99, 102, 241, 0.06)'
    };
  }

  // 10. Açık Güneşli (Clear Sky - Day)
  return {
    text: 'Açık & Güneşli',
    icon: Sun,
    iconColor: '#D7147A',
    badge: '☀️ Güneşli Gündüz',
    badgeBg: '#FDF2F8',
    badgeBorder: '#F9BED8',
    badgeColor: '#B01064',
    accentColor: '#D7147A',
    theme: 'day_clear',
    bg: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 55%, #FDF2F8 100%)',
    borderColor: '#F9BED8',
    iconStageBg: 'linear-gradient(135deg, #ffffff 0%, #FDF2F8 100%)',
    iconStageBorder: '#F9BED8',
    halo: 'rgba(215, 20, 122, 0.16)',
    cardShadow: '0 3px 12px rgba(215, 20, 122, 0.06)'
  };
}

function getOutfitAdvice(temp, code) {
  const isHail = [66, 67, 87, 88].includes(code) || code === 96 || code === 99;
  const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
  const isStorm = code === 95;
  const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);

  if (isHail) {
    return {
      title: 'Dolu Uyarısı',
      shortHint: 'Sert yağış geçişleri için kapüşonlu kalın mont, korunaklı alan ve şemsiye önerilir.',
      description: 'Dolu ve sert yağış geçişleri bekleniyor. Mümkünse kapalı alanlarda kalın, sert rüzgarlık, kapüşonlu kalın mont ve su almayan dayanıklı bot tercih edin.',
      items: [
        { label: 'Sağlam Şemsiye', icon: '☂️' },
        { label: 'Kapüşonlu Mont', icon: '🧥' },
        { label: 'Su Geçirmez Bot', icon: '🥾' },
        { label: 'Bere & Boyunluk', icon: '🧣' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '🧊 Dolu Uyarısı'
    };
  }

  if (isSnow) {
    return {
      title: 'Kar Yağışı',
      shortHint: 'Dondurucu soğuk ve kar için termal katman, kar montu ve kaymaz bot önerilir.',
      description: 'Kar yağışlı ve dondurucu bir hava var. Termal iç katman, yün kazak, su/kar geçirmez şişme mont, kaymaz tabanlı kar botu ve eldiven bavulun olmazsa olmazı.',
      items: [
        { label: 'Termal İçlik', icon: '🎽' },
        { label: 'Şişme Kar Montu', icon: '🧥' },
        { label: 'Kaymaz Kar Botu', icon: '🥾' },
        { label: 'Bere & Eldiven', icon: '🧤' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '❄️ Kar Yağışlı'
    };
  }

  if (isStorm) {
    return {
      title: 'Fırtına Uyarısı',
      shortHint: 'Kuvvetli rüzgar ve fırtına için dayanıklı ceket ve kapalı mekan rotaları önerilir.',
      description: 'Gök gürültülü sağanak ve ani fırtına bekleniyor. Rüzgara dayanıklı su geçirmez ceket giyin, açık alanlarda bulunmamaya ve kapalı mekan rotalarına öncelik verin.',
      items: [
        { label: 'Rüzgarlık Ceket', icon: '🧥' },
        { label: 'Kuvvetli Şemsiye', icon: '☂️' },
        { label: 'Deri / Kapalı Ayakkabı', icon: '👟' },
        { label: 'Yedek Çorap', icon: '🧦' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '⚡ Fırtına Uyarısı'
    };
  }

  if (isRaining) {
    return {
      title: 'Yağışlı Hava',
      shortHint: 'Yağış geçişleri için su geçirmez hafif mont, kompakt şemsiye ve kapalı ayakkabı önerilir.',
      description: 'Gün içinde yağış bekleniyor. Islanmamak için su geçirmez kapüşonlu bir trençkot veya rüzgarlık, kompakt çanta şemsiyesi ve su almayan kapalı ayakkabı önerilir.',
      items: [
        { label: 'Kompakt Şemsiye', icon: '☂️' },
        { label: 'Su Geçirmez Mont', icon: '🧥' },
        { label: 'Deri / Kapalı Ayakkabı', icon: '👟' },
        { label: 'Yedek Çorap', icon: '🧦' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '🌧️ Yağış Var'
    };
  }

  if (temp >= 28) {
    return {
      title: 'Sıcak Hava',
      shortHint: 'Sıcak ve güneşli hava için nefes alan ketenler, güneş şapkası ve gözlük önerilir.',
      description: 'Hava oldukça sıcak ve bunaltıcı olabilir. Nefes alan pamuklu/keten tişört veya gömlek, şort, güneş şapkası ve güneş gözlüğünüzü bavula eklemeyi unutmayın.',
      items: [
        { label: 'Güneş Gözlüğü', icon: '🕶️' },
        { label: 'Güneş Kremi', icon: '🧴' },
        { label: 'Keten Tişört / Gömlek', icon: '👕' },
        { label: 'Güneş Şapkası', icon: '🧢' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '☀️ Sıcak Hava'
    };
  }

  if (temp >= 21) {
    return {
      title: 'İdeal Seyahat Havası',
      shortHint: 'Gündüz için tişört ve spor ayakkabı, akşam serinliği için ince bir hırka yeterli.',
      description: 'Gündüz şehir turu için tişört ve rahat spor ayakkabı ideal. Akşam serinliği ve klimalı kapalı alanlar için yanınıza ince bir hırka veya triko almanız yeterli.',
      items: [
        { label: 'Pamuklu Tişört', icon: '👕' },
        { label: 'Spor Ayakkabı', icon: '👟' },
        { label: 'İnce Hırka / Triko', icon: '🧥' },
        { label: 'Güneş Gözlüğü', icon: '🕶️' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '✨ İdeal Hava'
    };
  }

  if (temp >= 14) {
    return {
      title: 'Mevsimlik Serin',
      shortHint: 'Hafif serin hava için ceket altına tişört ile kat kat (layering) kombin kurtarıcı olur.',
      description: 'Hafif serin bir hava var. Trençkot, deri ceket veya kot ceket altına tişört giyerek kat kat (layering) kombin yapmanız gün içi sıcaklık değişimlerinde kurtarıcı olur.',
      items: [
        { label: 'Ceket / Trençkot', icon: '🧥' },
        { label: 'İnce Kazak', icon: '🧶' },
        { label: 'Spor Ayakkabı', icon: '👟' },
        { label: 'Hafif Şal', icon: '🧣' }
      ],
      color: '#D7147A',
      bg: '#fff5f9',
      badge: '🍂 Mevsimlik Serin'
    };
  }

  // < 14°C
  return {
    title: 'Soğuk Hava',
    shortHint: 'Soğuk hava için rüzgar kesici kaban, yün kazak, atkı ve konforlu bir bot önerilir.',
    description: 'Hava soğuk. Rüzgar kesici kaban veya şişme mont, sıcak tutan yün kazak, atkı ve konforlu bir bot ile gezinizi üşümeden tamamlayın.',
    items: [
      { label: 'Kaban / Şişme Mont', icon: '🧥' },
      { label: 'Yün Kazak', icon: '🧶' },
      { label: 'Atkı & Bere', icon: '🧣' },
      { label: 'Sıcak Tutan Bot', icon: '🥾' }
    ],
    color: '#D7147A',
    bg: '#fff5f9',
    badge: '❄️ Soğuk Hava'
  };
}

export default function WeatherOutfitWidget() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(POPULAR_DESTINATIONS[0]); // Default: İstanbul
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGpsHovered, setIsGpsHovered] = useState(false);

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoResults, setGeoResults] = useState([]);
  const dropdownRef = useRef(null);

  // Fetch Live Weather for selected city
  const fetchWeather = async (city) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.current) {
        const isDayVal = data.current.is_day !== undefined
          ? data.current.is_day === 1
          : (new Date().getHours() >= 6 && new Date().getHours() < 20);

        setWeatherData({
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          code: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          isDay: isDayVal,
          tempMax: Math.round(data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m + 2),
          tempMin: Math.round(data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m - 4)
        });
      }
    } catch (e) {
      console.warn("Weather fetch error, using fallback:", e);
      const currentHour = new Date().getHours();
      setWeatherData({
        temp: 22,
        feelsLike: 23,
        code: 1,
        humidity: 60,
        wind: 12,
        isDay: currentHour >= 6 && currentHour < 20,
        tempMax: 24,
        tempMin: 16
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerçek Konumu Algılama (GPS & Reverse Geocoding)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
          );
          const geoData = await geoRes.json();
          const cityName = geoData.city || geoData.locality || geoData.principalSubdivision || 'Konumum';
          const detected = {
            id: 'geo-live',
            name: cityName,
            country: geoData.countryName || 'Türkiye',
            countryCode: geoData.countryCode || 'TR',
            lat: latitude,
            lon: longitude
          };
          setSelectedCity(detected);
        } catch (err) {
          console.warn('Reverse geocode error:', err);
          setSelectedCity({
            id: 'geo-live',
            name: 'Konumum',
            country: '',
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('GPS location error:', err);
        setIsLocating(false);
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // İlk yüklemede kullanıcının gerçek konumunu sessizce algıla (IP Geolocation)
  useEffect(() => {
    const detectIpCity = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city && data.latitude && data.longitude) {
          setSelectedCity({
            id: 'ip-city',
            name: data.city,
            country: data.country_name || 'Türkiye',
            countryCode: data.country_code || 'TR',
            lat: data.latitude,
            lon: data.longitude
          });
        }
      } catch (e) {
        // Fallback silently
      }
    };
    detectIpCity();
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Local Destinations + Live Geocoding on Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setGeoResults([]);
      setIsSearching(false);
      return;
    }

    const normQ = normalizeStr(trimmed);
    const localMatches = POPULAR_DESTINATIONS.filter(d => 
      normalizeStr(d.name).includes(normQ) || normalizeStr(d.country).includes(normQ)
    );

    if (localMatches.length >= 3) {
      setGeoResults(localMatches);
      setIsSearching(false);
      return;
    }

    // Call Open-Meteo Geocoding for anywhere in the world
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=tr&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.results) {
          const apiResults = data.results.map(r => ({
            id: `${r.id}`,
            name: r.name,
            country: r.country || '',
            countryCode: r.country_code || '',
            flag: getFlagEmoji(r.country_code),
            lat: r.latitude,
            lon: r.longitude
          }));

          // Merge local and API matches uniquely
          const combined = [...localMatches];
          apiResults.forEach(ar => {
            if (!combined.some(c => normalizeStr(c.name) === normalizeStr(ar.name) && c.country === ar.country)) {
              combined.push(ar);
            }
          });
          setGeoResults(combined);
        } else {
          setGeoResults(localMatches);
        }
      } catch (err) {
        setGeoResults(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const currentTemp = weatherData?.temp ?? 22;
  const currentCode = weatherData?.code ?? 1;
  const isDay = weatherData?.isDay ?? (new Date().getHours() >= 6 && new Date().getHours() < 20);
  const weatherMeta = getWeatherMeta(currentCode, isDay);
  const WeatherIcon = weatherMeta.icon;

  return (
    <div 
      ref={dropdownRef}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
        borderRadius: '22px',
        border: '1px solid #FCE7F3',
        padding: '15px 16px',
        marginBottom: '18px',
        boxShadow: '0 4px 16px -2px rgba(215, 20, 122, 0.05)',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Başlık Alanı */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{
              fontSize: '13px',
              fontWeight: '750',
              color: '#0f172a',
              margin: 0,
              letterSpacing: '-0.2px'
            }}>
              Hava Durumu & Ne Giyilir?
            </h2>
            <div style={{
              fontSize: '10.5px',
              color: '#64748b',
              marginTop: '2px'
            }}>
              Gideceğiniz şehrin hava durumuna göre hazırlanalım
            </div>
          </div>

          <button
            onClick={handleDetectLocation}
            onMouseEnter={() => setIsGpsHovered(true)}
            onMouseLeave={() => setIsGpsHovered(false)}
            title="Mevcut Konumumu Bul ve Havayı Getir"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '10px',
              border: isGpsHovered ? '1.2px solid #D7147A' : '1.2px solid #F9BED8',
              background: isGpsHovered 
                ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)' 
                : (isLocating ? '#FDF2F8' : '#ffffff'),
              color: isGpsHovered ? '#ffffff' : '#D7147A',
              cursor: isLocating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: 0,
              transform: isGpsHovered ? 'scale(1.06)' : 'scale(1)',
              boxShadow: isGpsHovered ? '0 3px 10px rgba(215, 20, 122, 0.25)' : '0 1px 3px rgba(215, 20, 122, 0.08)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {isLocating ? (
              <Loader2 
                size={14} 
                color={isGpsHovered ? '#ffffff' : '#D7147A'} 
                style={{ animation: 'spin 1s linear infinite' }} 
              />
            ) : (
              <LocateFixed 
                size={15} 
                color={isGpsHovered ? '#ffffff' : '#D7147A'} 
                strokeWidth={2.3} 
              />
            )}
          </button>
        </div>

        {/* Ülke veya Şehir Arama Motoru Inputu */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: showDropdown ? '1.5px solid #D7147A' : '1.5px solid #F9BED8',
            padding: '5px 6px 5px 12px',
            boxShadow: showDropdown ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : '0 4px 12px rgba(215, 20, 122, 0.08)',
            transition: 'all 0.2s ease'
          }}>
            {isSearching ? (
              <Loader2 size={15} color="#D7147A" style={{ animation: 'spin 1s linear infinite', flexShrink: 0, marginRight: '8px' }} />
            ) : (
              <Search size={15} color="#D7147A" style={{ flexShrink: 0, marginRight: '8px' }} />
            )}

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setShowDropdown(val.trim().length >= 2);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
              placeholder="Şehir veya ülke arayın..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                minWidth: 0,
                paddingRight: '8px',
                fontSize: '11px',
                fontWeight: '500',
                color: '#1e293b',
                textOverflow: 'ellipsis'
              }}
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGeoResults([]);
                  setShowDropdown(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#FDF2F8',
                border: '1px solid #F9BED8',
                padding: '2.5px 7px',
                borderRadius: '7px',
                fontSize: '10px',
                fontWeight: '700',
                color: '#D7147A',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                <MapPin size={10} color="#D7147A" /> {selectedCity.name}
              </div>
            )}
          </div>

          {/* Autocomplete / Arama Sonuçları Dropdown - En az 2 harf yazıldığında görünür */}
          {showDropdown && searchQuery.trim().length >= 2 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12)',
              zIndex: 100,
              maxHeight: '230px',
              overflowY: 'auto'
            }}>
              {isSearching ? (
                <div style={{ padding: '14px', textAlign: 'center', color: '#D7147A', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Şehir aranıyor...</span>
                </div>
              ) : geoResults.length > 0 ? (
                geoResults.map((c, i) => (
                  <div
                    key={c.id || i}
                    onClick={() => handleSelectCity(c)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: i === geoResults.length - 1 ? 'none' : '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FDF2F8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={13} color="#D7147A" />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        {c.name}
                      </span>
                      {c.country && (
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          ({c.country})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#D7147A', fontWeight: '700' }}>
                      Hava Durumu Gör →
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                  "{searchQuery}" ile eşleşen şehir bulunamadı
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seçili Şehir Anlık Hava Durumu Kartı (Move Travel Temasıyla %100 Uyumlu, Dinamik Görsel Kart) */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: weatherMeta.bg,
          borderRadius: '18px',
          padding: '14px 16px',
          border: `1.5px solid ${weatherMeta.borderColor}`,
          marginBottom: '14px',
          boxShadow: weatherMeta.cardShadow,
          transition: 'all 0.3s ease'
        }}>
          {/* Arka Plan Yumuşak Pastel Atmosfer Halesi */}
          <div style={{
            position: 'absolute',
            top: '-25px',
            right: '-25px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: weatherMeta.halo,
            filter: 'blur(28px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Kart İçerik Katmanı */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Üst Satır: Şehir Lokasyonu */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} color="#D7147A" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                  {selectedCity.name}
                </span>
              </div>
            </div>

            {/* Orta Satır: Sıcaklık & Durum ile İkon Sahnesi */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#0f172a',
                    letterSpacing: '-0.4px',
                    lineHeight: 1
                  }}>
                    {currentTemp}°C
                  </span>
                </div>

                <div style={{
                  fontSize: '10.5px',
                  fontWeight: '600',
                  color: '#475569',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontWeight: '700', color: weatherMeta.accentColor }}>{weatherMeta.text}</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '500' }}>
                    Y: {weatherData?.tempMax ?? currentTemp + 2}° / D: {weatherData?.tempMin ?? currentTemp - 3}°
                  </span>
                </div>
              </div>

              {/* Temaya Uygun Kare Şık İkon Sahnesi */}
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '13px',
                background: weatherMeta.iconStageBg,
                border: `1.2px solid ${weatherMeta.iconStageBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 3px 10px ${weatherMeta.halo}`,
                flexShrink: 0
              }}>
                <WeatherIcon size={22} color={weatherMeta.iconColor} strokeWidth={2} />
              </div>
            </div>

            {/* Alt İstatistik Çipleri (Hissedilen, Nem, Rüzgar) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              paddingTop: '8px',
              borderTop: `1px solid ${weatherMeta.badgeBorder}50`
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '5px 3px',
                textAlign: 'center',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', letterSpacing: '0.2px' }}>HİSSEDİLEN</div>
                <div style={{ fontSize: '10.5px', color: '#0f172a', fontWeight: '800', marginTop: '2px' }}>{weatherData?.feelsLike ?? currentTemp}°C</div>
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '5px 3px',
                textAlign: 'center',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', letterSpacing: '0.2px' }}>NEM</div>
                <div style={{ fontSize: '10.5px', color: '#0f172a', fontWeight: '800', marginTop: '2px' }}>%{weatherData?.humidity ?? 60}</div>
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '5px 3px',
                textAlign: 'center',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', letterSpacing: '0.2px' }}>RÜZGAR</div>
                <div style={{ fontSize: '10.5px', color: '#0f172a', fontWeight: '800', marginTop: '2px' }}>{weatherData?.wind ?? 12} km/s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları: Ne Giyilir? & Checkliste Ekle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Ne Giyilir Butonu (Tıklanınca Ne Giyilir Sayfasına Gider) */}
          <div 
            onClick={() => navigate(`/travel-tools?tab=outfit&city=${encodeURIComponent(selectedCity?.name || '')}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '9px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '-0.1px',
              boxShadow: '0 2px 8px rgba(215, 20, 122, 0.20)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(215, 20, 122, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(215, 20, 122, 0.20)';
            }}
          >
            <span>Ne Giyilir ?</span>
            <ChevronRight size={13} strokeWidth={2.6} />
          </div>

          {/* Checkliste Ekle Butonu */}
          <div 
            onClick={() => navigate('/individual/checklists')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: '#ffffff',
              color: '#B01064',
              border: '1.2px solid #F9BED8',
              borderRadius: '12px',
              padding: '9px 8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '-0.1px',
              boxShadow: '0 1px 4px rgba(215, 20, 122, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = '#D7147A';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122, 0.10)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#F9BED8';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(215, 20, 122, 0.04)';
            }}
          >
            <span>Checkliste Ekle</span>
            <ChevronRight size={13} strokeWidth={2.6} />
          </div>
        </div>
      </div>
  );
}
