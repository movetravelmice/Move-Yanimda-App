import React from 'react';

const COUNTRY_NAME_TO_CODE = {
  'italya': 'it', 'italy': 'it', 'italya cumhuriyeti': 'it',
  'ingiltere': 'gb', 'birleşik krallık': 'gb', 'uk': 'gb', 'england': 'gb', 'great britain': 'gb',
  'fransa': 'fr', 'france': 'fr', 'fransız cumhuriyeti': 'fr',
  'bae': 'ae', 'birleşik arap emirlikleri': 'ae', 'dubai': 'ae', 'uae': 'ae', 'united arab emirates': 'ae',
  'japonya': 'jp', 'japan': 'jp',
  'ispanya': 'es', 'spain': 'es', 'ispanya krallığı': 'es',
  'hollanda': 'nl', 'netherlands': 'nl', 'hollanda krallığı': 'nl',
  'amerika': 'us', 'abd': 'us', 'usa': 'us', 'amerika birleşik devletleri': 'us', 'united states': 'us',
  'almanya': 'de', 'germany': 'de', 'almanya federal cumhuriyeti': 'de',
  'türkiye': 'tr', 'turkey': 'tr', 'türkiye cumhuriyeti': 'tr', 'turkiye cumhuriyeti': 'tr', 'turkiye': 'tr',
  'yunanistan': 'gr', 'greece': 'gr', 'helen cumhuriyeti': 'gr',
  'çekya': 'cz', 'czechia': 'cz', 'çek cumhuriyeti': 'cz',
  'avusturya': 'at', 'austria': 'at', 'avusturya cumhuriyeti': 'at',
  'isviçre': 'ch', 'switzerland': 'ch', 'isviçre konfederasyonu': 'ch',
  'macaristan': 'hu', 'hungary': 'hu',
  'portekiz': 'pt', 'portugal': 'pt', 'portekiz cumhuriyeti': 'pt',
  'güney kore': 'kr', 'kore': 'kr', 'south korea': 'kr', 'kore cumhuriyeti': 'kr',
  'mısır': 'eg', 'egypt': 'eg', 'mısır arap cumhuriyeti': 'eg',
  'tayland': 'th', 'thailand': 'th', 'tayland krallığı': 'th',
  'singapur': 'sg', 'singapore': 'sg', 'singapur cumhuriyeti': 'sg',
  'gürcistan': 'ge', 'georgia': 'ge',
  'polonya': 'pl', 'poland': 'pl', 'polonya cumhuriyeti': 'pl',
  'norveç': 'no', 'norway': 'no', 'norveç krallığı': 'no',
  'isveç': 'se', 'sweden': 'se', 'isveç krallığı': 'se',
  'danimarka': 'dk', 'denmark': 'dk', 'danimarka krallığı': 'dk',
  'azerbaycan': 'az', 'azerbaijan': 'az', 'azerbaycan cumhuriyeti': 'az',
  'katar': 'qa', 'qatar': 'qa', 'katar devleti': 'qa',
  'rusya': 'ru', 'russia': 'ru', 'rusya federasyonu': 'ru',
  'çin': 'cn', 'china': 'cn', 'çin halk cumhuriyeti': 'cn',
  'kanada': 'ca', 'canada': 'ca',
  'avustralya': 'au', 'australia': 'au',
  'suudi arabistan': 'sa', 'saudi arabia': 'sa', 'suudi arabistan krallığı': 'sa',
  'endonezya': 'id', 'indonesia': 'id',
  'bosna hersek': 'ba', 'bosna': 'ba', 'bosnia': 'ba', 'bosnia and herzegovina': 'ba',
  'karadağ': 'me', 'montenegro': 'me',
  'kuzey makedonya': 'mk', 'makedonya': 'mk', 'north macedonia': 'mk',
  'hırvatistan': 'hr', 'croatia': 'hr',
  'belçika': 'be', 'belgium': 'be',
  'irlanda': 'ie', 'ireland': 'ie',
  'fas': 'ma', 'morocco': 'ma',
  'izlanda': 'is', 'iceland': 'is',
  'meksika': 'mx', 'mexico': 'mx',
  'arnavutluk': 'al', 'albania': 'al',
  'finlandiya': 'fi', 'finland': 'fi',
  'sırbistan': 'rs', 'serbia': 'rs',
  'romanya': 'ro', 'romania': 'ro',
  'bulgaristan': 'bg', 'bulgaria': 'bg'
};

export function getCountryCode(flagOrCountry) {
  if (!flagOrCountry || typeof flagOrCountry !== 'string') return null;
  const raw = flagOrCountry.trim();

  // If directly a 2-letter ISO code
  if (raw.length === 2 && /^[a-zA-Z]{2}$/.test(raw)) {
    return raw.toLowerCase();
  }

  // Check Turkish lowercase
  const trStr = raw.toLocaleLowerCase('tr-TR');
  if (COUNTRY_NAME_TO_CODE[trStr]) {
    return COUNTRY_NAME_TO_CODE[trStr];
  }

  // Check normalized / standard lowercase
  const enStr = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (COUNTRY_NAME_TO_CODE[enStr]) {
    return COUNTRY_NAME_TO_CODE[enStr];
  }

  // Check emoji regional indicators (Windows doesn't render color emoji flags)
  const chars = [...raw];
  if (chars.length === 2) {
    const cp0 = chars[0].codePointAt(0);
    const cp1 = chars[1].codePointAt(0);
    if (cp0 >= 0x1F1E6 && cp0 <= 0x1F1FF && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF) {
      const c0 = String.fromCharCode(cp0 - 0x1F1E6 + 65).toLowerCase();
      const c1 = String.fromCharCode(cp1 - 0x1F1E6 + 65).toLowerCase();
      return `${c0}${c1}`;
    }
  }

  return null;
}

export default function CountryFlag({ flag, country, size = 'md', style = {}, className = '' }) {
  const code = getCountryCode(flag) || getCountryCode(country);

  const dimensions = {
    sm: { width: '16px', height: '11px', borderRadius: '2px' },
    md: { width: '20px', height: '14px', borderRadius: '3px' },
    lg: { width: '26px', height: '18px', borderRadius: '4px' }
  }[size] || { width: '20px', height: '14px', borderRadius: '3px' };

  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        alt={country || code}
        className={className}
        style={{
          ...dimensions,
          objectFit: 'cover',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style
        }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Fallback to emoji
  return <span style={{ fontSize: size === 'lg' ? '18px' : '14px', ...style }}>{flag || '🌍'}</span>;
}

export function getCurrencySymbol(currency) {
  if (!currency || typeof currency !== 'string') return '';
  const clean = currency.trim().toUpperCase();
  const map = {
    'EUR': '€',
    'GBP': '£',
    'USD': '$',
    'JPY': '¥',
    'AED': 'د.إ',
    'TRY': '₺',
    'TL': '₺',
    'CHF': '₣',
    'CAD': 'C$',
    'AUD': 'A$',
    'CNY': '¥',
    'RUB': '₽',
    'INR': '₹',
    'SAR': '﷼',
    'QAR': '﷼',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'GEL': '₾',
    'KRW': '₩',
    'THB': '฿',
    'SGD': 'S$'
  };
  return map[clean] || '';
}

