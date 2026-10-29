// Route & Destination Intelligence Service
// Automatically determines currency, plug type, time difference, country code, flag, and live user flight duration

// Comprehensive Destination & Country Knowledge Base
export const DESTINATIONS_DB = [
  // 1. İtalya
  {
    countryNames: ['italya', 'italy', 'italia', 'it'],
    cities: ['roma', 'milano', 'milan', 'venedik', 'venice', 'floransa', 'florence', 'napoli', 'naples', 'torino', 'palermo'],
    country: 'İtalya',
    countryCode: 'it',
    flag: '🇮🇹',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Rome',
    coords: { lat: 41.9028, lon: 12.4964 },
    defaultFlight: '2.5 Saat'
  },
  // 2. Birleşik Krallık / İngiltere
  {
    countryNames: ['ingiltere', 'birleşik krallık', 'uk', 'england', 'great britain', 'gb'],
    cities: ['londra', 'london', 'manchester', 'edinburgh', 'birmingham', 'glasgow', 'liverpool'],
    country: 'İngiltere',
    countryCode: 'gb',
    flag: '🇬🇧',
    currency: 'GBP',
    plug: 'Tip G',
    timezone: 'Europe/London',
    coords: { lat: 51.5074, lon: -0.1278 },
    defaultFlight: '4 Saat'
  },
  // 3. Fransa
  {
    countryNames: ['fransa', 'france', 'fr'],
    cities: ['paris', 'nice', 'lyon', 'marsilya', 'marseille', 'bordeaux', 'strasbourg', 'toulouse', 'cannes'],
    country: 'Fransa',
    countryCode: 'fr',
    flag: '🇫🇷',
    currency: 'EUR',
    plug: 'Tip C/E',
    timezone: 'Europe/Paris',
    coords: { lat: 48.8566, lon: 2.3522 },
    defaultFlight: '3.5 Saat'
  },
  // 4. Birleşik Arap Emirlikleri (Dubai / Abu Dabi)
  {
    countryNames: ['bae', 'birleşik arap emirlikleri', 'uae', 'united arab emirates', 'dubai', 'ae'],
    cities: ['dubai', 'abu dabi', 'abu dhabi', 'şarika', 'sharjah'],
    country: 'BAE',
    countryCode: 'ae',
    flag: '🇦🇪',
    currency: 'AED',
    plug: 'Tip G',
    timezone: 'Asia/Dubai',
    coords: { lat: 25.2048, lon: 55.2708 },
    defaultFlight: '4.5 Saat'
  },
  // 5. Japonya
  {
    countryNames: ['japonya', 'japan', 'jp'],
    cities: ['tokyo', 'kyoto', 'osaka', 'yokohama', 'sapporo', 'nagoya', 'fukuoka', 'nara'],
    country: 'Japonya',
    countryCode: 'jp',
    flag: '🇯🇵',
    currency: 'JPY',
    plug: 'Tip A/B (100V)',
    timezone: 'Asia/Tokyo',
    coords: { lat: 35.6762, lon: 139.6503 },
    defaultFlight: '11.5 Saat'
  },
  // 6. İspanya
  {
    countryNames: ['ispanya', 'spain', 'espana', 'es'],
    cities: ['barselona', 'barcelona', 'madrid', 'sevilla', 'valensiya', 'valencia', 'malaga', 'ibiza', 'mallorca'],
    country: 'İspanya',
    countryCode: 'es',
    flag: '🇪🇸',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Madrid',
    coords: { lat: 40.4168, lon: -3.7038 },
    defaultFlight: '4 Saat'
  },
  // 7. Hollanda
  {
    countryNames: ['hollanda', 'netherlands', 'holland', 'nl'],
    cities: ['amsterdam', 'rotterdam', 'lahey', 'the hague', 'utrecht', 'eindhoven'],
    country: 'Hollanda',
    countryCode: 'nl',
    flag: '🇳🇱',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Amsterdam',
    coords: { lat: 52.3676, lon: 4.9041 },
    defaultFlight: '3.5 Saat'
  },
  // 8. Amerika Birleşik Devletleri (ABD)
  {
    countryNames: ['abd', 'amerika', 'amerika birleşik devletleri', 'usa', 'united states', 'us'],
    cities: ['new york', 'los angeles', 'miami', 'chicago', 'san francisco', 'las vegas', 'washington', 'boston', 'orlando'],
    country: 'ABD',
    countryCode: 'us',
    flag: '🇺🇸',
    currency: 'USD',
    plug: 'Tip A/B (120V)',
    timezone: 'America/New_York',
    coords: { lat: 40.7128, lon: -74.0060 },
    defaultFlight: '11 Saat'
  },
  // 9. Almanya
  {
    countryNames: ['almanya', 'germany', 'deutschland', 'de'],
    cities: ['berlin', 'münih', 'munich', 'frankfurt', 'hamburg', 'köln', 'cologne', 'düsseldorf', 'stuttgart'],
    country: 'Almanya',
    countryCode: 'de',
    flag: '🇩🇪',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Berlin',
    coords: { lat: 52.5200, lon: 13.4050 },
    defaultFlight: '3 Saat'
  },
  // 10. Avusturya
  {
    countryNames: ['avusturya', 'austria', 'at'],
    cities: ['viyana', 'vienna', 'salzburg', 'innsbruck', 'graz'],
    country: 'Avusturya',
    countryCode: 'at',
    flag: '🇦🇹',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Vienna',
    coords: { lat: 48.2082, lon: 16.3738 },
    defaultFlight: '2.5 Saat'
  },
  // 11. İsviçre
  {
    countryNames: ['isviçre', 'switzerland', 'ch'],
    cities: ['zürih', 'zurich', 'cenevre', 'geneva', 'bern', 'basel', 'luzern'],
    country: 'İsviçre',
    countryCode: 'ch',
    flag: '🇨🇭',
    currency: 'CHF',
    plug: 'Tip J',
    timezone: 'Europe/Zurich',
    coords: { lat: 47.3769, lon: 8.5417 },
    defaultFlight: '3 Saat'
  },
  // 12. Çekya
  {
    countryNames: ['çekya', 'czechia', 'çek cumhuriyeti', 'cz'],
    cities: ['prag', 'prague', 'brno', 'karlovy vary'],
    country: 'Çekya',
    countryCode: 'cz',
    flag: '🇨🇿',
    currency: 'CZK',
    plug: 'Tip C/E',
    timezone: 'Europe/Prague',
    coords: { lat: 50.0755, lon: 14.4378 },
    defaultFlight: '2.5 Saat'
  },
  // 13. Macaristan
  {
    countryNames: ['macaristan', 'hungary', 'hu'],
    cities: ['budapeşte', 'budapest', 'debrecen', 'szeged'],
    country: 'Macaristan',
    countryCode: 'hu',
    flag: '🇭🇺',
    currency: 'HUF',
    plug: 'Tip C/F',
    timezone: 'Europe/Budapest',
    coords: { lat: 47.4979, lon: 19.0402 },
    defaultFlight: '2 Saat'
  },
  // 14. Yunanistan
  {
    countryNames: ['yunanistan', 'greece', 'gr'],
    cities: ['atina', 'athens', 'selanik', 'thessaloniki', 'santorini', 'mykonos', 'mikonos', 'rodos', 'rhodes', 'kos', 'girit'],
    country: 'Yunanistan',
    countryCode: 'gr',
    flag: '🇬🇷',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Athens',
    coords: { lat: 37.9838, lon: 23.7275 },
    defaultFlight: '1.5 Saat'
  },
  // 15. Portekiz
  {
    countryNames: ['portekiz', 'portugal', 'pt'],
    cities: ['lizbon', 'lisbon', 'porto', 'faro', 'madeira'],
    country: 'Portekiz',
    countryCode: 'pt',
    flag: '🇵🇹',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Lisbon',
    coords: { lat: 38.7223, lon: -9.1393 },
    defaultFlight: '4.5 Saat'
  },
  // 16. Belçika
  {
    countryNames: ['belçika', 'belgium', 'be'],
    cities: ['brüksel', 'brussels', 'brugge', 'bruges', 'gent', 'anvers', 'antwerp'],
    country: 'Belçika',
    countryCode: 'be',
    flag: '🇧🇪',
    currency: 'EUR',
    plug: 'Tip C/E',
    timezone: 'Europe/Brussels',
    coords: { lat: 50.8503, lon: 4.3517 },
    defaultFlight: '3.5 Saat'
  },
  // 17. Gürcistan
  {
    countryNames: ['gürcistan', 'georgia', 'ge'],
    cities: ['tiflis', 'tbilisi', 'batum', 'batumi', 'kutaisi'],
    country: 'Gürcistan',
    countryCode: 'ge',
    flag: '🇬🇪',
    currency: 'GEL',
    plug: 'Tip C/F',
    timezone: 'Asia/Tbilisi',
    coords: { lat: 41.7151, lon: 44.8271 },
    defaultFlight: '2 Saat'
  },
  // 18. Mısır
  {
    countryNames: ['mısır', 'egypt', 'eg'],
    cities: ['kahire', 'cairo', 'şarm el şeyh', 'sharm el sheikh', 'hurgada', 'hurghada', 'iskenderiye', 'luxor'],
    country: 'Mısır',
    countryCode: 'eg',
    flag: '🇪🇬',
    currency: 'EGP',
    plug: 'Tip C/F',
    timezone: 'Africa/Cairo',
    coords: { lat: 30.0444, lon: 31.2357 },
    defaultFlight: '2.5 Saat'
  },
  // 19. Katar
  {
    countryNames: ['katar', 'qatar', 'qa'],
    cities: ['doha', 'al wakrah'],
    country: 'Katar',
    countryCode: 'qa',
    flag: '🇶🇦',
    currency: 'QAR',
    plug: 'Tip G',
    timezone: 'Asia/Qatar',
    coords: { lat: 25.2854, lon: 51.5310 },
    defaultFlight: '4 Saat'
  },
  // 20. Suudi Arabistan
  {
    countryNames: ['suudi arabistan', 'saudi arabia', 'saudi', 'sa'],
    cities: ['riyad', 'riyadh', 'cidde', 'jeddah', 'mekke', 'mecca', 'medine', 'medina', 'dammam'],
    country: 'Suudi Arabistan',
    countryCode: 'sa',
    flag: '🇸🇦',
    currency: 'SAR',
    plug: 'Tip G',
    timezone: 'Asia/Riyadh',
    coords: { lat: 24.7136, lon: 46.6753 },
    defaultFlight: '3.5 Saat'
  },
  // 21. Singapur
  {
    countryNames: ['singapur', 'singapore', 'sg'],
    cities: ['singapur', 'singapore'],
    country: 'Singapur',
    countryCode: 'sg',
    flag: '🇸🇬',
    currency: 'SGD',
    plug: 'Tip G',
    timezone: 'Asia/Singapore',
    coords: { lat: 1.3521, lon: 103.8198 },
    defaultFlight: '10.5 Saat'
  },
  // 22. Tayland
  {
    countryNames: ['tayland', 'thailand', 'th'],
    cities: ['bangkok', 'phuket', 'pattaya', 'chiang mai', 'koh samui'],
    country: 'Tayland',
    countryCode: 'th',
    flag: '🇹🇭',
    currency: 'THB',
    plug: 'Tip A/B/C',
    timezone: 'Asia/Bangkok',
    coords: { lat: 13.7563, lon: 100.5018 },
    defaultFlight: '9 Saat'
  },
  // 23. Güney Kore
  {
    countryNames: ['güney kore', 'kore', 'south korea', 'korea', 'kr'],
    cities: ['seul', 'seoul', 'busan', 'incheon', 'jeju'],
    country: 'Güney Kore',
    countryCode: 'kr',
    flag: '🇰🇷',
    currency: 'KRW',
    plug: 'Tip C/F',
    timezone: 'Asia/Seoul',
    coords: { lat: 37.5665, lon: 126.9780 },
    defaultFlight: '10 Saat'
  },
  // 24. Polonya
  {
    countryNames: ['polonya', 'poland', 'pl'],
    cities: ['varşova', 'warsaw', 'krakow', 'gdansk', 'wroclaw'],
    country: 'Polonya',
    countryCode: 'pl',
    flag: '🇵🇱',
    currency: 'PLN',
    plug: 'Tip C/E',
    timezone: 'Europe/Warsaw',
    coords: { lat: 52.2297, lon: 21.0122 },
    defaultFlight: '2.5 Saat'
  },
  // 25. Azerbaycan
  {
    countryNames: ['azerbaycan', 'azerbaijan', 'az'],
    cities: ['bakü', 'baku', 'gence', 'ganja'],
    country: 'Azerbaycan',
    countryCode: 'az',
    flag: '🇦🇿',
    currency: 'AZN',
    plug: 'Tip C/F',
    timezone: 'Asia/Baku',
    coords: { lat: 40.4093, lon: 49.8671 },
    defaultFlight: '2.5 Saat'
  },
  // 26. Türkiye
  {
    countryNames: ['türkiye', 'turkey', 'turkiye', 'tr'],
    cities: ['istanbul', 'ankara', 'izmir', 'antalya', 'bodrum', 'kapadokya', 'bursa', 'trabzon', 'gaziantep'],
    country: 'Türkiye',
    countryCode: 'tr',
    flag: '🇹🇷',
    currency: 'TRY',
    plug: 'Tip C/F',
    timezone: 'Europe/Istanbul',
    coords: { lat: 41.0082, lon: 28.9784 },
    defaultFlight: '1 Saat'
  },
  // 27. Rusya
  {
    countryNames: ['rusya', 'russia', 'ru'],
    cities: ['moskova', 'moscow', 'st. petersburg', 'soçi', 'sochi', 'kazan'],
    country: 'Rusya',
    countryCode: 'ru',
    flag: '🇷🇺',
    currency: 'RUB',
    plug: 'Tip C/F',
    timezone: 'Europe/Moscow',
    coords: { lat: 55.7558, lon: 37.6173 },
    defaultFlight: '3.5 Saat'
  },
  // 28. İrlanda
  {
    countryNames: ['irlanda', 'ireland', 'ie'],
    cities: ['dublin', 'cork', 'galway'],
    country: 'İrlanda',
    countryCode: 'ie',
    flag: '🇮🇪',
    currency: 'EUR',
    plug: 'Tip G',
    timezone: 'Europe/Dublin',
    coords: { lat: 53.3498, lon: -6.2603 },
    defaultFlight: '4.5 Saat'
  },
  // 29. Danimarka
  {
    countryNames: ['danimarka', 'denmark', 'dk'],
    cities: ['kopenhag', 'copenhagen', 'aarhus', 'odense'],
    country: 'Danimarka',
    countryCode: 'dk',
    flag: '🇩🇰',
    currency: 'DKK',
    plug: 'Tip C/F',
    timezone: 'Europe/Copenhagen',
    coords: { lat: 55.6761, lon: 12.5683 },
    defaultFlight: '3.5 Saat'
  },
  // 30. İsveç
  {
    countryNames: ['isveç', 'sweden', 'se'],
    cities: ['stockholm', 'göteborg', 'malmö'],
    country: 'İsveç',
    countryCode: 'se',
    flag: '🇸🇪',
    currency: 'SEK',
    plug: 'Tip C/F',
    timezone: 'Europe/Stockholm',
    coords: { lat: 59.3293, lon: 18.0686 },
    defaultFlight: '3.5 Saat'
  },
  // 31. Norveç
  {
    countryNames: ['norveç', 'norway', 'no'],
    cities: ['oslo', 'bergen', 'tromso', 'trondheim'],
    country: 'Norveç',
    countryCode: 'no',
    flag: '🇳🇴',
    currency: 'NOK',
    plug: 'Tip C/F',
    timezone: 'Europe/Oslo',
    coords: { lat: 59.9139, lon: 10.7522 },
    defaultFlight: '4 Saat'
  },
  // 32. Fas
  {
    countryNames: ['fas', 'morocco', 'ma'],
    cities: ['kazablanka', 'casablanca', 'marakeş', 'marrakech', 'rabat', 'tanca'],
    country: 'Fas',
    countryCode: 'ma',
    flag: '🇲🇦',
    currency: 'MAD',
    plug: 'Tip C/E',
    timezone: 'Africa/Casablanca',
    coords: { lat: 33.5731, lon: -7.5898 },
    defaultFlight: '4.5 Saat'
  },
  // 33. Endonezya
  {
    countryNames: ['endonezya', 'indonesia', 'id'],
    cities: ['bali', 'denpasar', 'cakarta', 'jakarta'],
    country: 'Endonezya',
    countryCode: 'id',
    flag: '🇮🇩',
    currency: 'IDR',
    plug: 'Tip C/F',
    timezone: 'Asia/Makassar',
    coords: { lat: -8.3405, lon: 115.0920 },
    defaultFlight: '12.5 Saat'
  },
  // 34. Karadağ
  {
    countryNames: ['karadağ', 'montenegro', 'me'],
    cities: ['podgorica', 'budva', 'kotor', 'tivat'],
    country: 'Karadağ',
    countryCode: 'me',
    flag: '🇲🇪',
    currency: 'EUR',
    plug: 'Tip C/F',
    timezone: 'Europe/Podgorica',
    coords: { lat: 42.4304, lon: 19.2594 },
    defaultFlight: '1.5 Saat'
  },
  // 35. Bosna Hersek
  {
    countryNames: ['bosna hersek', 'bosna', 'bosnia', 'ba'],
    cities: ['saraybosna', 'sarajevo', 'mostar'],
    country: 'Bosna Hersek',
    countryCode: 'ba',
    flag: '🇧🇦',
    currency: 'BAM',
    plug: 'Tip C/F',
    timezone: 'Europe/Sarajevo',
    coords: { lat: 43.8563, lon: 18.4131 },
    defaultFlight: '1.5 Saat'
  },
  // 36. Sırbistan
  {
    countryNames: ['sırbistan', 'serbia', 'rs'],
    cities: ['belgrad', 'belgrade', 'novi sad', 'nis'],
    country: 'Sırbistan',
    countryCode: 'rs',
    flag: '🇷🇸',
    currency: 'RSD',
    plug: 'Tip C/F',
    timezone: 'Europe/Belgrade',
    coords: { lat: 44.7866, lon: 20.4489 },
    defaultFlight: '1.5 Saat'
  },
  // 37. Kıbrıs
  {
    countryNames: ['kıbrıs', 'cyprus', 'cy'],
    cities: ['lefkoşa', 'nicosia', 'girne', 'kyrenia', 'limasol', 'larnaka', 'baf'],
    country: 'Kıbrıs',
    countryCode: 'cy',
    flag: '🇨🇾',
    currency: 'EUR',
    plug: 'Tip G',
    timezone: 'Asia/Nicosia',
    coords: { lat: 35.1856, lon: 33.3823 },
    defaultFlight: '1 Saat'
  },
  // 38. Çin
  {
    countryNames: ['çin', 'china', 'cn'],
    cities: ['pekin', 'beijing', 'şanghay', 'shanghai', 'guangzhou', 'hong kong', 'schenzen'],
    country: 'Çin',
    countryCode: 'cn',
    flag: '🇨🇳',
    currency: 'CNY',
    plug: 'Tip A/C/I',
    timezone: 'Asia/Shanghai',
    coords: { lat: 39.9042, lon: 116.4074 },
    defaultFlight: '9.5 Saat'
  },
  // 39. Kanada
  {
    countryNames: ['kanada', 'canada', 'ca'],
    cities: ['toronto', 'montreal', 'vancouver', 'ottawa', 'calgary'],
    country: 'Kanada',
    countryCode: 'ca',
    flag: '🇨🇦',
    currency: 'CAD',
    plug: 'Tip A/B (120V)',
    timezone: 'America/Toronto',
    coords: { lat: 43.6532, lon: -79.3832 },
    defaultFlight: '10.5 Saat'
  },
  // 40. Avustralya
  {
    countryNames: ['avustralya', 'australia', 'au'],
    cities: ['sidney', 'sydney', 'melbourne', 'brisbane', 'perth'],
    country: 'Avustralya',
    countryCode: 'au',
    flag: '🇦🇺',
    currency: 'AUD',
    plug: 'Tip I',
    timezone: 'Australia/Sydney',
    coords: { lat: -33.8688, lon: 151.2093 },
    defaultFlight: '17 Saat'
  }
];

// Normalize search text (Turkish / English accent-insensitive)
export function normalizeSearch(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Calculates real-time timezone difference relative to user or Turkey (UTC+3)
 */
export function calculateTimeDiffFromTimezone(timezone) {
  if (!timezone) return '-1 Saat';
  try {
    const now = new Date();

    const destParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    }).formatToParts(now);
    const destOffsetStr = destParts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';

    const parseGmtOffset = (str) => {
      const match = str.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (!match) return 0;
      const sign = match[1] === '-' ? -1 : 1;
      const h = parseInt(match[2], 10);
      const m = match[3] ? parseInt(match[3], 10) / 60 : 0;
      return sign * (h + m);
    };

    const destOffset = parseGmtOffset(destOffsetStr);
    const trOffset = 3; // Turkey is fixed UTC+3

    const diff = destOffset - trOffset;
    if (diff === 0) return 'Aynı Saat';
    return `${diff > 0 ? '+' : ''}${diff % 1 === 0 ? diff : diff.toFixed(1)} Saat`;
  } catch (err) {
    return '-1 Saat';
  }
}

/**
 * Calculates Haversine Flight Duration (Cruising speed ~780 km/h + 30 min climb & descent)
 */
export function calculateFlightDurationBetween(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const flightKm = Math.round(R * c);

  if (flightKm < 150) return '45 Dk';
  const totalMinutes = Math.round((flightKm / 780) * 60) + 30;

  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes / 10) * 10} Dk`;
  }

  const hours = totalMinutes / 60;
  const roundedHours = Math.round(hours * 2) / 2; // Round to nearest 0.5 hour
  return `${roundedHours % 1 === 0 ? roundedHours.toFixed(0) : roundedHours.toFixed(1)} Saat`;
}

/**
 * Automatically detects all route attributes (Country Code, Flag, Currency, Plug, Time Diff, Flight)
 * based on input city and/or country.
 */
export function detectRouteIntelligence(countryInput = '', cityInput = '') {
  const normCountry = normalizeSearch(countryInput);
  const normCity = normalizeSearch(cityInput);

  // 1. Search in Knowledge Base
  let match = null;

  // Search by city first (most specific)
  if (normCity) {
    match = DESTINATIONS_DB.find(item => 
      item.cities.some(c => {
        const nc = normalizeSearch(c);
        return normCity === nc || normCity.includes(nc) || nc.includes(normCity);
      })
    );
  }

  // Search by country if no city match
  if (!match && normCountry) {
    match = DESTINATIONS_DB.find(item => 
      item.countryNames.some(cn => {
        const ncn = normalizeSearch(cn);
        return normCountry === ncn || normCountry.includes(ncn) || ncn.includes(normCountry);
      })
    );
  }

  if (match) {
    const liveTimeDiff = calculateTimeDiffFromTimezone(match.timezone);
    return {
      country: match.country,
      countryCode: match.countryCode.toUpperCase(),
      flag: match.flag,
      flagCode: match.countryCode.toLowerCase(),
      currency: match.currency,
      plug: match.plug,
      time: liveTimeDiff,
      flight: match.defaultFlight,
      coords: match.coords,
      isAutoDetected: true
    };
  }

  // 2. Generic fallback if unknown destination
  return {
    country: countryInput.trim() || 'Yurt Dışı',
    countryCode: (countryInput.trim().slice(0, 2) || 'TR').toUpperCase(),
    flag: '🌍',
    flagCode: '',
    currency: 'EUR',
    plug: 'Tip C/F',
    time: '-1 Saat',
    flight: '3.5 Saat',
    coords: { lat: 41.9028, lon: 12.4964 },
    isAutoDetected: false
  };
}

// In-memory cache for user's detected location
let cachedUserLocation = null;
let isLocatingUser = false;
const locationListeners = new Set();

/**
 * Subscribes to user location updates for reactive UI updates
 */
export function subscribeUserLocation(callback) {
  locationListeners.add(callback);
  if (cachedUserLocation) callback(cachedUserLocation);
  return () => locationListeners.delete(callback);
}

function notifyLocationUpdate(loc) {
  cachedUserLocation = loc;
  try {
    sessionStorage.setItem('user_travel_origin_loc', JSON.stringify(loc));
  } catch (e) {}
  locationListeners.forEach(fn => fn(loc));
}

/**
 * Initializes and detects user origin location silently in the background
 */
export function initUserLocationDetector(currentUser = null) {
  if (cachedUserLocation) return cachedUserLocation;

  // 1. Check session storage
  try {
    const saved = sessionStorage.getItem('user_travel_origin_loc');
    if (saved) {
      cachedUserLocation = JSON.parse(saved);
      return cachedUserLocation;
    }
  } catch (e) {}

  // 2. Check user profile city
  if (currentUser) {
    const userCityName = currentUser.city || currentUser.homeCity || currentUser.location;
    if (userCityName) {
      const detected = detectRouteIntelligence('', userCityName);
      if (detected && detected.coords) {
        const loc = {
          name: userCityName,
          lat: detected.coords.lat,
          lon: detected.coords.lon,
          source: 'profile'
        };
        notifyLocationUpdate(loc);
        return loc;
      }
    }
  }

  // 3. Silent browser geolocation
  if (typeof window !== 'undefined' && 'geolocation' in navigator && !isLocatingUser) {
    isLocatingUser = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isLocatingUser = false;
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'gps'
        };
        notifyLocationUpdate(loc);
      },
      () => {
        isLocatingUser = false;
        // Default to Istanbul / Turkey
        const defaultLoc = { name: 'İstanbul', lat: 41.0082, lon: 28.9784, source: 'default' };
        notifyLocationUpdate(defaultLoc);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  }

  return cachedUserLocation || { name: 'İstanbul', lat: 41.0082, lon: 28.9784, source: 'default' };
}

/**
 * Calculates the dynamic flight duration for a route based on current logged in user's location
 */
export function getRouteFlightDurationForUser(route, userLocation = null) {
  if (!route) return '3 Saat';

  // Find destination coordinates
  let destCoords = route.coords;
  if (!destCoords && (route.city || route.country)) {
    const info = detectRouteIntelligence(route.country || '', route.city || '');
    destCoords = info.coords;
  }

  const origin = userLocation || cachedUserLocation || { lat: 41.0082, lon: 28.9784 }; // Istanbul default

  if (destCoords && origin && origin.lat && origin.lon) {
    const calculated = calculateFlightDurationBetween(origin.lat, origin.lon, destCoords.lat, destCoords.lon);
    if (calculated) return calculated;
  }

  return route.flight || '3 Saat';
}
