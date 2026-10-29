import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudHail,
  Droplets,
  Loader2
} from 'lucide-react';

export function getWeatherMeta(code, isDay = true) {
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

export function renderWeatherArtwork(artType) {
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

export function renderMiniDayIcon(code) {
  if (code === 0) return <Sun size={13} color="#ffffff" strokeWidth={2.2} />;
  if (code === 1 || code === 2) return <CloudSun size={13} color="#ffffff" strokeWidth={2.2} />;
  if (code === 3) return <Cloud size={13} color="#ffffff" strokeWidth={2.2} />;
  if (code === 45 || code === 48) return <CloudFog size={13} color="#ffffff" strokeWidth={2.2} />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain size={13} color="#ffffff" strokeWidth={2.2} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow size={13} color="#ffffff" strokeWidth={2.2} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning size={13} color="#ffffff" strokeWidth={2.2} />;
  return <CloudSun size={13} color="#ffffff" strokeWidth={2.2} />;
}

export function getFormattedDate() {
  const d = new Date();
  const days = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'];
  const dayName = days[d.getDay()];
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${dayName} ${month}-${day}`;
}

export function getNextFourDays() {
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

export default function PinterestWeatherCard({
  weatherData,
  cityName = 'İstanbul',
  loading = false,
  style = {}
}) {
  if (loading) {
    return (
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #2b77be 0%, #1f5d96 100%)',
          borderRadius: '20px',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(31, 93, 150, 0.25)',
          minHeight: '140px',
          ...style
        }}
      >
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.9 }}>
          Hava durumu yükleniyor...
        </span>
      </div>
    );
  }

  // Parse or normalize weatherData
  const currentTemp = typeof weatherData?.temp === 'number' 
    ? weatherData.temp 
    : (parseInt(weatherData?.temp) || 20);

  const weatherCode = weatherData?.code ?? 1;
  const isDayVal = weatherData?.isDay !== undefined ? weatherData.isDay : true;
  const weatherMeta = getWeatherMeta(weatherCode, isDayVal);
  const WeatherIcon = weatherMeta.icon;

  const forecastList = weatherData?.dailyForecast && weatherData.dailyForecast.length === 4
    ? weatherData.dailyForecast
    : getNextFourDays();

  const tempMax = weatherData?.tempMax ?? (currentTemp + 2);
  const tempMin = weatherData?.tempMin ?? (currentTemp - 3);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: weatherMeta.bg,
        borderRadius: '20px',
        boxShadow: weatherMeta.shadow || '0 10px 25px rgba(0, 0, 0, 0.18)',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        transition: 'all 0.35s ease',
        ...style
      }}
    >
      {/* Arka Plan Sanatsal SVG Dalga/Işık/Yağmur/Kar Çizimleri */}
      {renderWeatherArtwork(weatherMeta.art)}

      {/* Üst Ana Alan (Zone A: Hava Durumu, Sıcaklık, Saat, Tarih, Şehir) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '16px 18px 12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          minHeight: '94px'
        }}
      >
        {/* Sol Taraf: Durum İkonu+Metin, Büyük Derece, Max/Min */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Durum İkonu ve Metin */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#ffffff',
              opacity: 0.95
            }}
          >
            <WeatherIcon size={14} color="#ffffff" strokeWidth={2.3} />
            <span>{weatherMeta.text}</span>
          </div>

          {/* Dev Sıcaklık Rakamı (Pinterest Kartı ile Birebir) */}
          <div
            style={{
              fontSize: '40px',
              fontWeight: '400',
              lineHeight: 1,
              letterSpacing: '-0.5px',
              margin: '6px 0 4px 0',
              color: '#ffffff'
            }}
          >
            {currentTemp}°
          </div>

          {/* Yüksek / Düşük Sıcaklık */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.85)',
              letterSpacing: '0.2px'
            }}
          >
            {tempMax}° / {tempMin}°
          </div>
        </div>

        {/* Sağ Taraf: Saat, Gün-Tarih ve Şehir Adı */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            textAlign: 'right'
          }}
        >
          {/* Saat & Tarih */}
          <div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: '700',
                lineHeight: 1.1,
                letterSpacing: '0.3px',
                color: '#ffffff'
              }}
            >
              {weatherData?.localTime || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginTop: '2px'
              }}
            >
              {getFormattedDate()}
            </div>
          </div>

          {/* Şehir Adı - Tam sağ altta */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#ffffff',
              opacity: 0.95,
              marginTop: '14px',
              letterSpacing: '0.1px'
            }}
          >
            {cityName}
          </div>
        </div>
      </div>

      {/* Alt Bar: 4 Günlük Tahmin Şeridi (Zone B) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: weatherMeta.footerBg || 'rgba(0, 0, 0, 0.22)',
          padding: '9px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {forecastList.map((item, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.4px',
              opacity: 0.95
            }}
          >
            <span>{item.day}</span>
            {renderMiniDayIcon(item.code)}
          </div>
        ))}
      </div>
    </div>
  );
}
