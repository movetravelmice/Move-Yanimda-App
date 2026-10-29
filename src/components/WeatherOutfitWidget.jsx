import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PinterestWeatherCard from './PinterestWeatherCard';
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
  LocateFixed,
  Send
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
      text: 'Dolu Yağışlı',
      icon: CloudHail,
      theme: 'hail',
      art: 'hail',
      bg: 'linear-gradient(135deg, #243247 0%, #192334 100%)',
      footerBg: 'rgba(0, 0, 0, 0.28)',
      shadow: '0 10px 25px rgba(25, 35, 52, 0.35)'
    };
  }

  // 2. Kar Yağışı (Snow / Heavy Snow)
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    const isHeavy = [75, 86].includes(code);
    return {
      text: isHeavy ? 'Yoğun Kar' : 'Kar Yağışlı',
      icon: CloudSnow,
      theme: isHeavy ? 'heavy_snow' : 'snow',
      art: isHeavy ? 'heavy_snow' : 'snow',
      bg: isHeavy 
        ? 'linear-gradient(135deg, #1978d3 0%, #125596 100%)' 
        : 'linear-gradient(135deg, #0ba3e8 0%, #0681b9 100%)',
      footerBg: isHeavy ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.20)',
      shadow: isHeavy ? '0 10px 25px rgba(25, 120, 211, 0.35)' : '0 10px 25px rgba(11, 163, 232, 0.35)'
    };
  }

  // 3. Gök Gürültülü Fırtına (Thunderstorm)
  if (code === 95) {
    return {
      text: 'Fırtına',
      icon: CloudLightning,
      theme: 'storm',
      art: 'storm',
      bg: 'linear-gradient(135deg, #2b3048 0%, #1c2033 100%)',
      footerBg: 'rgba(0, 0, 0, 0.30)',
      shadow: '0 10px 25px rgba(28, 32, 51, 0.40)'
    };
  }

  // 4. Yağmur & Kuvvetli Sağanak (Rain / Heavy Rain)
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    const isHeavy = [65, 81, 82].includes(code);
    return {
      text: isHeavy ? 'Kuvvetli Yağış' : 'Yağmurlu',
      icon: CloudRain,
      theme: isHeavy ? 'heavy_rain' : 'rain',
      art: isHeavy ? 'heavy_rain' : 'rain',
      bg: isHeavy 
        ? 'linear-gradient(135deg, #323850 0%, #22263a 100%)' 
        : 'linear-gradient(135deg, #4b4376 0%, #3a3261 100%)',
      footerBg: isHeavy ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.22)',
      shadow: isHeavy ? '0 10px 25px rgba(34, 38, 58, 0.35)' : '0 10px 25px rgba(75, 67, 118, 0.35)'
    };
  }

  // 5. Hafif Çisenti (Drizzle)
  if ([51, 53, 55].includes(code)) {
    return {
      text: 'Çisenti',
      icon: Droplets,
      theme: 'drizzle',
      art: 'rain',
      bg: 'linear-gradient(135deg, #4b4376 0%, #3a3261 100%)',
      footerBg: 'rgba(0, 0, 0, 0.22)',
      shadow: '0 10px 25px rgba(75, 67, 118, 0.35)'
    };
  }

  // 6. Sisli & Puslu (Fog & Mist / Hazy)
  if (code === 45 || code === 48) {
    return {
      text: 'Sisli & Puslu',
      icon: CloudFog,
      theme: 'hazy',
      art: 'hazy',
      bg: 'linear-gradient(135deg, #e48b52 0%, #ee9e68 100%)',
      footerBg: 'rgba(0, 0, 0, 0.20)',
      shadow: '0 10px 25px rgba(228, 139, 82, 0.35)'
    };
  }

  // 7. Çok Bulutlu / Kapalı (Overcast / Cloudy)
  if (code === 3) {
    return {
      text: 'Çok Bulutlu',
      icon: Cloud,
      theme: 'cloudy',
      art: 'cloudy',
      bg: 'linear-gradient(135deg, #3695f2 0%, #2a7dd0 100%)',
      footerBg: 'rgba(0, 0, 0, 0.20)',
      shadow: '0 10px 25px rgba(42, 125, 208, 0.35)'
    };
  }

  // 8. Parçalı Bulutlu (Partly Cloudy / Mostly Cloudy)
  if (code === 1 || code === 2) {
    if (!isDay) {
      return {
        text: 'Parçalı Bulutlu',
        icon: CloudMoon,
        theme: 'night_cloudy',
        art: 'night',
        bg: 'linear-gradient(135deg, #1b335a 0%, #22467d 100%)',
        footerBg: 'rgba(0, 0, 0, 0.26)',
        shadow: '0 10px 25px rgba(27, 51, 90, 0.35)'
      };
    }
    return {
      text: 'Parçalı Bulutlu',
      icon: CloudSun,
      theme: 'mostly_cloudy',
      art: 'mostly_cloudy',
      bg: 'linear-gradient(135deg, #2b77be 0%, #1f5d96 100%)',
      footerBg: 'rgba(0, 0, 0, 0.22)',
      shadow: '0 10px 25px rgba(31, 93, 150, 0.35)'
    };
  }

  // 9. Açık Gece (Clear Sky - Night)
  if (!isDay) {
    return {
      text: 'Açık Gece',
      icon: Moon,
      theme: 'night_clear',
      art: 'night',
      bg: 'linear-gradient(135deg, #1b3866 0%, #234d8d 100%)',
      footerBg: 'rgba(0, 0, 0, 0.28)',
      shadow: '0 10px 25px rgba(27, 56, 102, 0.35)'
    };
  }

  // 10. Açık Güneşli (Clear Sky - Day / Sunny)
  return {
    text: 'Güneşli',
    icon: Sun,
    theme: 'sunny',
    art: 'sunny',
    bg: 'linear-gradient(135deg, #f86e51 0%, #f6883d 48%, #ffb13b 100%)',
    footerBg: 'rgba(0, 0, 0, 0.18)',
    shadow: '0 10px 25px rgba(248, 110, 81, 0.35)'
  };
}

function renderWeatherArtwork(artType) {
  switch (artType) {
    case 'sunny':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 220 145" 
          fill="none"
        >
          <circle cx="190" cy="10" r="110" fill="rgba(255, 255, 255, 0.07)" />
          <circle cx="190" cy="10" r="75" fill="rgba(255, 255, 255, 0.11)" />
          <circle cx="190" cy="10" r="45" fill="rgba(255, 240, 160, 0.35)" />
          <path d="M 0 145 C 70 115 140 135 220 100 L 220 145 Z" fill="rgba(255, 255, 255, 0.08)" />
        </svg>
      );
    case 'night':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 220 145" 
          fill="none"
        >
          <circle cx="185" cy="18" r="95" fill="rgba(255, 255, 255, 0.05)" />
          <circle cx="185" cy="18" r="60" fill="rgba(255, 255, 255, 0.09)" />
          <circle cx="185" cy="18" r="26" fill="rgba(254, 240, 138, 0.90)" />
          <circle cx="177" cy="13" r="23" fill="#20457c" />
          <path d="M 0 145 C 60 125 130 140 220 115 L 220 145 Z" fill="rgba(255, 255, 255, 0.05)" />
        </svg>
      );
    case 'rain':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 350 145" 
          preserveAspectRatio="none" 
          fill="none"
        >
          <line x1="140" y1="12" x2="115" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="180" y1="22" x2="155" y2="72" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="225" y1="8" x2="200" y2="58" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="265" y1="28" x2="240" y2="78" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="305" y1="14" x2="280" y2="64" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="195" y1="68" x2="170" y2="118" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="245" y1="72" x2="220" y2="122" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'heavy_rain':
    case 'storm':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 350 145" 
          preserveAspectRatio="none" 
          fill="none"
        >
          <line x1="110" y1="5" x2="82" y2="70" stroke="rgba(255,255,255,0.28)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="160" y1="18" x2="132" y2="83" stroke="rgba(255,255,255,0.22)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="210" y1="8" x2="182" y2="73" stroke="rgba(255,255,255,0.30)" strokeWidth="2" strokeLinecap="round" />
          <line x1="260" y1="22" x2="232" y2="87" stroke="rgba(255,255,255,0.22)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="300" y1="10" x2="272" y2="75" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round" />
          <line x1="175" y1="72" x2="147" y2="132" stroke="rgba(255,255,255,0.24)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="225" y1="78" x2="197" y2="138" stroke="rgba(255,255,255,0.26)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'cloudy':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 220 145" 
          fill="none"
        >
          <path d="M 40 0 C 80 40 150 18 220 45 L 220 0 Z" fill="rgba(255, 255, 255, 0.14)" />
          <path d="M 0 38 C 70 75 140 48 220 72 L 220 0 L 0 0 Z" fill="rgba(255, 255, 255, 0.08)" />
          <path d="M 60 145 C 100 110 160 130 220 105 L 220 145 Z" fill="rgba(255, 255, 255, 0.06)" />
        </svg>
      );
    case 'mostly_cloudy':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 220 145" 
          fill="none"
        >
          <path d="M 25 0 C 85 45 150 22 220 48 L 220 0 Z" fill="rgba(255, 255, 255, 0.16)" />
          <path d="M 0 32 C 75 68 145 52 220 78 L 220 0 L 0 0 Z" fill="rgba(255, 255, 255, 0.09)" />
        </svg>
      );
    case 'snow':
    case 'heavy_snow':
      return (
        <svg 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 350 145" 
          preserveAspectRatio="none" 
          fill="none"
        >
          <circle cx="110" cy="28" r="4" fill="rgba(255,255,255,0.85)" />
          <circle cx="160" cy="62" r="2.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="195" cy="24" r="5" fill="rgba(255,255,255,0.88)" />
          <circle cx="238" cy="72" r="3.5" fill="rgba(255,255,255,0.7)" />
          <circle cx="275" cy="32" r="5.5" fill="rgba(255,255,255,0.85)" />
          <circle cx="310" cy="80" r="3" fill="rgba(255,255,255,0.55)" />
          <circle cx="145" cy="105" r="4.5" fill="rgba(255,255,255,0.75)" />
          <circle cx="200" cy="120" r="2.8" fill="rgba(255,255,255,0.6)" />
        </svg>
      );
    case 'hazy':
      return (
        <svg 
          style={{ position: 'absolute', bottom: 0, right: 0, width: '240px', height: '115px', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 240 115" 
          fill="none"
        >
          <path d="M 0 85 C 80 45 160 95 240 60 L 240 115 L 0 115 Z" fill="rgba(255, 255, 255, 0.12)" />
          <path d="M 0 105 C 60 75 140 110 240 90 L 240 115 L 0 115 Z" fill="rgba(255, 255, 255, 0.16)" />
        </svg>
      );
    case 'hail':
    default:
      return (
        <svg 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} 
          viewBox="0 0 350 145" 
          preserveAspectRatio="none" 
          fill="none"
        >
          <circle cx="120" cy="22" r="3" fill="rgba(255,255,255,0.85)" />
          <circle cx="160" cy="48" r="4" fill="rgba(255,255,255,0.9)" />
          <circle cx="195" cy="20" r="2.5" fill="rgba(255,255,255,0.7)" />
          <circle cx="235" cy="54" r="5" fill="rgba(255,255,255,0.9)" />
          <circle cx="265" cy="28" r="3.5" fill="rgba(255,255,255,0.85)" />
          <circle cx="295" cy="68" r="4.5" fill="rgba(255,255,255,0.9)" />
          <circle cx="140" cy="88" r="3" fill="rgba(255,255,255,0.8)" />
          <circle cx="180" cy="105" r="4" fill="rgba(255,255,255,0.85)" />
        </svg>
      );
  }
}

function renderMiniDayIcon(code) {
  if (code === 0) return <Sun size={13} color="#ffffff" strokeWidth={2.2} />;
  if (code === 1 || code === 2) return <CloudSun size={13} color="#ffffff" strokeWidth={2.2} />;
  if (code === 3) return <Cloud size={13} color="#ffffff" strokeWidth={2.2} />;
  if (code === 45 || code === 48) return <CloudFog size={13} color="#ffffff" strokeWidth={2.2} />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain size={13} color="#ffffff" strokeWidth={2.2} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow size={13} color="#ffffff" strokeWidth={2.2} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning size={13} color="#ffffff" strokeWidth={2.2} />;
  return <CloudSun size={13} color="#ffffff" strokeWidth={2.2} />;
}

function getFormattedDate() {
  const d = new Date();
  const days = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'];
  const dayName = days[d.getDay()];
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${dayName} ${month}-${day}`;
}

function getNextFourDays() {
  const daysMap = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'];
  const todayIdx = new Date().getDay();
  const res = [];
  const sampleCodes = [1, 61, 3, 0];
  for (let i = 1; i <= 4; i++) {
    res.push({
      day: daysMap[(todayIdx + i) % 7],
      code: sampleCodes[(i - 1) % sampleCodes.length]
    });
  }
  return res;
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
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.current) {
        const isDayVal = data.current.is_day !== undefined
          ? data.current.is_day === 1
          : (new Date().getHours() >= 6 && new Date().getHours() < 20);

        let localTime = '';
        if (data.current.time && data.current.time.includes('T')) {
          localTime = data.current.time.split('T')[1].slice(0, 5);
        }

        const daysMap = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'];
        const dailyForecast = [];
        if (data.daily && Array.isArray(data.daily.time)) {
          for (let i = 1; i <= 4; i++) {
            if (data.daily.time[i]) {
              const d = new Date(data.daily.time[i] + 'T12:00:00');
              dailyForecast.push({
                day: daysMap[d.getDay()],
                code: data.daily.weather_code?.[i] ?? 1,
                max: Math.round(data.daily.temperature_2m_max?.[i] ?? 20),
                min: Math.round(data.daily.temperature_2m_min?.[i] ?? 12)
              });
            }
          }
        }

        setWeatherData({
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          code: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          isDay: isDayVal,
          tempMax: Math.round(data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m + 2),
          tempMin: Math.round(data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m - 4),
          localTime: localTime,
          dailyForecast: dailyForecast.length === 4 ? dailyForecast : null
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
        tempMin: 16,
        localTime: `${String(currentHour).padStart(2, '0')}:00`,
        dailyForecast: getNextFourDays()
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

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (geoResults && geoResults.length > 0) {
      handleSelectCity(geoResults[0]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=tr&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const r = data.results[0];
        handleSelectCity({
          id: `${r.id}`,
          name: r.name,
          country: r.country || '',
          countryCode: r.country_code || '',
          flag: getFlagEmoji(r.country_code),
          lat: r.latitude,
          lon: r.longitude
        });
      }
    } catch (err) {
      console.warn('Geocoding submit error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const currentTemp = weatherData?.temp ?? 22;
  const currentCode = weatherData?.code ?? 1;
  const isDay = weatherData?.isDay ?? (new Date().getHours() >= 6 && new Date().getHours() < 20);
  const weatherMeta = getWeatherMeta(currentCode, isDay);
  const WeatherIcon = weatherMeta.icon;
  const forecastList = (weatherData?.dailyForecast && weatherData.dailyForecast.length === 4)
    ? weatherData.dailyForecast
    : getNextFourDays();

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
      <div style={{ marginBottom: '14px' }}>
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

        {/* Ülke veya Şehir Arama Motoru Inputu */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: '16px',
              border: showDropdown ? '1.5px solid #D7147A' : '1.5px solid #F9BED8',
              padding: '5px 6px 5px 12px',
              boxShadow: showDropdown ? '0 0 0 3px rgba(215, 20, 122, 0.08)' : '0 4px 12px rgba(215, 20, 122, 0.08)',
              transition: 'all 0.2s ease',
              marginBottom: 0
            }}
          >
            <Search size={15} color="#D7147A" style={{ flexShrink: 0, marginRight: '8px' }} />

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
              title="Şehir Ara"
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
              {isSearching ? (
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={13} style={{ marginLeft: '-1px' }} />
              )}
            </button>
          </form>

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

        {/* Pinterest Stili Hava Durumu Kartı (Image 1 Referansı) */}
        <PinterestWeatherCard
          weatherData={weatherData}
          cityName={selectedCity.name}
          loading={loading}
        />
      </div>
  );
}
