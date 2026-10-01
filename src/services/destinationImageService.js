// Service for destination images and travel date helpers
// Accurately fetches authentic city landmark photos via curated landmark presets and Wikipedia REST API

export const VERIFIED_LANDMARK_PRESETS = {
  // Türkiye
  'antalya': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Falezlerden_Antalya_Konyaalt%C4%B1_Plaj%C4%B1na_do%C4%9Fru_bir_g%C3%B6r%C3%BCn%C3%BCm.jpg/1280px-Falezlerden_Antalya_Konyaalt%C4%B1_Plaj%C4%B1na_do%C4%9Fru_bir_g%C3%B6r%C3%BCn%C3%BCm.jpg',
  'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=800',
  'ankara': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Ankara_asv2021-10_img11_view_from_Atakule_mall.jpg/1280px-Ankara_asv2021-10_img11_view_from_Atakule_mall.jpg',
  'izmir': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/%C4%B0zmir_Clock_Tower%2C_December_2018.jpg/1280px-%C4%B0zmir_Clock_Tower%2C_December_2018.jpg',
  'bodrum': 'https://upload.wikimedia.org/wikipedia/commons/5/53/BodrumCastlesoutheast.jpg',
  'kapadokya': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/G%C3%B6reme_town_and_valley_2015.JPG/1280px-G%C3%B6reme_town_and_valley_2015.JPG',
  'goreme': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/G%C3%B6reme_town_and_valley_2015.JPG/1280px-G%C3%B6reme_town_and_valley_2015.JPG',
  'trabzon': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Sumela_monastery_2011.JPG/1280px-Sumela_monastery_2011.JPG',
  'fethiye': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Oludeniz_beach.jpg/1280px-Oludeniz_beach.jpg',
  'marmaris': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Marmaris_view.jpg/1280px-Marmaris_view.jpg',
  'gaziantep': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Gaziantep_Castle_2011.jpg/1280px-Gaziantep_Castle_2011.jpg',

  // Dünya Popüler Destinasyonlar (Admin Popular Routes)
  'roma': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
  'londra': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
  'tokyo': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
  'barselona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800',
  'amsterdam': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&q=80&w=800',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800',
  'viyana': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=800',
  'vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=800',
  'prag': 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&q=80&w=800',
  'prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&q=80&w=800',
  'atina': 'https://images.unsplash.com/photo-1555993539-1732916b8235?auto=format&fit=crop&q=80&w=800',
  'athens': 'https://images.unsplash.com/photo-1555993539-1732916b8235?auto=format&fit=crop&q=80&w=800',
  'venedik': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&q=80&w=800',
  'venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&q=80&w=800',
  'floransa': 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&q=80&w=800',
  'florence': 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&q=80&w=800',
  'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=800',
  'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80&w=800',
  'munih': 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&q=80&w=800',
  'budapeste': 'https://images.unsplash.com/photo-1549877452-9c387954fbc2?auto=format&fit=crop&q=80&w=800',
  'budapest': 'https://images.unsplash.com/photo-1549877452-9c387954fbc2?auto=format&fit=crop&q=80&w=800',
  'milano': 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&q=80&w=800',
  'milan': 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&q=80&w=800',
  'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=800',
  'saraybosna': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Sebilj_Sarajevo.jpg/1280px-Sebilj_Sarajevo.jpg',
  'kotor': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Kotor_Montenegro_Bay.jpg/1280px-Kotor_Montenegro_Bay.jpg',
  'baku': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=800',
  'tiflis': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&q=80&w=800',
  'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&q=80&w=800',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
  'singapur': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=800',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=800'
};

export const DEFAULT_TRAVEL_COVER = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800';

const normalizeCity = (str) => (str || '')
  .toLowerCase()
  .replace(/ı/g, 'i')
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ş/g, 's')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c')
  .replace(/\(.*\)/g, '')
  .trim();

/**
 * Automatically fetch destination image by city name
 */
export const fetchDestinationPhoto = async (cityName, countryName = '') => {
  if (!cityName || !cityName.trim()) {
    return DEFAULT_TRAVEL_COVER;
  }

  const clean = cityName.replace(/\(.*\)/g, '').trim();
  const normalized = normalizeCity(clean);

  // 1. Direct landmark match (Exact key or exact word match only)
  if (VERIFIED_LANDMARK_PRESETS[normalized]) {
    return VERIFIED_LANDMARK_PRESETS[normalized];
  }

  // Check if normalized matches any key as full word
  for (const [key, url] of Object.entries(VERIFIED_LANDMARK_PRESETS)) {
    if (normalized === key) {
      return url;
    }
  }

  // 2. Fetch from Wikipedia REST API (tr first, then en)
  try {
    const candidates = [
      clean,
      clean.charAt(0).toUpperCase() + clean.slice(1)
    ];

    if (countryName) {
      candidates.push(`${clean},_${countryName}`.replace(/\s+/g, '_'));
    }

    for (const cand of candidates) {
      const keyword = encodeURIComponent(cand);
      
      // Try Turkish Wikipedia
      let res = await fetch(`https://tr.wikipedia.org/api/rest_v1/page/summary/${keyword}`);
      if (!res.ok) {
        // Try English Wikipedia
        res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${keyword}`);
      }

      if (res.ok) {
        const data = await res.json();
        
        let candidateImg = data.originalimage?.source || data.thumbnail?.source;
        if (candidateImg) {
          const lower = candidateImg.toLowerCase();
          // Filter out SVG maps, flags, coats of arms
          const isSvgOrMap = lower.endsWith('.svg') || lower.includes('map') || lower.includes('flag') || lower.includes('coat_of_arms') || lower.includes('emblem');
          
          if (!isSvgOrMap) {
            // Scale thumbnail to 1280px if it's a thumbnail tier
            if (candidateImg.includes('/330px-') || candidateImg.includes('/300px-') || candidateImg.includes('/220px-')) {
              candidateImg = candidateImg.replace(/\/\d+px-/, '/1280px-');
            }
            return candidateImg;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Wikipedia destination photo fetch failed:", err);
  }

  return DEFAULT_TRAVEL_COVER;
};

/**
 * Format date range into readable Turkish string (e.g. 12 Eki - 17 Eki 2026)
 */
export const formatTravelDates = (startDate, endDate) => {
  if (!startDate && !endDate) return 'Tarih Belirtilmedi';
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  const parseAndFormat = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parts[0];
      return `${d} ${months[m] || ''} ${y}`;
    }
    return dStr;
  };

  if (startDate && endDate) {
    return `${parseAndFormat(startDate)} - ${parseAndFormat(endDate)}`;
  }
  return parseAndFormat(startDate || endDate);
};

/**
 * Calculate duration as "X Gün / Y Gece"
 */
export const formatTravelDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  try {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 0) {
      const nights = Math.max(0, diffDays - 1);
      return `${diffDays} Gün ${nights} Gece`;
    }
  } catch (e) {
    return null;
  }
  return null;
};

/**
 * Determine travel status pill: Upcoming / Ongoing / Completed
 */
export const getTravelStatus = (startDate, endDate) => {
  if (!startDate) return { label: 'Planlandı', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : new Date(startDate);
  end.setHours(23, 59, 59, 999);

  if (today < start) {
    const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      label: diffDays === 1 ? 'Yarın Başlıyor' : `${diffDays} gün kaldı`,
      color: '#D7147A',
      bg: '#FDF2F8',
      border: '#F9BED8',
      isUpcoming: true
    };
  }

  if (today >= start && today <= end) {
    return {
      label: 'Şu An Seyahatte',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      isActive: true
    };
  }

  return {
    label: 'Tamamlandı',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    isPast: true
  };
};

/**
 * Automatically generate a descriptive travel title from destination and dates
 * Example: "30.09 - 01.10.2026 Antalya Seyahatim"
 */
export const generateAutoTravelTitle = (city, startDate, endDate) => {
  const destName = (city || '').trim();
  const cityName = destName ? destName.split(',')[0].trim() : '';
  const suffix = cityName ? `${cityName} Seyahatim` : 'Seyahatim';

  const formatPart = (dStr) => {
    if (!dStr) return null;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return {
        day: parts[2].padStart(2, '0'),
        month: parts[1].padStart(2, '0'),
        year: parts[0]
      };
    }
    return null;
  };

  const pStart = formatPart(startDate);
  const pEnd = formatPart(endDate);

  if (pStart && pEnd) {
    if (pStart.year === pEnd.year) {
      return `${pStart.day}.${pStart.month} - ${pEnd.day}.${pEnd.month}.${pEnd.year} ${suffix}`;
    } else {
      return `${pStart.day}.${pStart.month}.${pStart.year} - ${pEnd.day}.${pEnd.month}.${pEnd.year} ${suffix}`;
    }
  }

  if (pStart && !pEnd) {
    return `${pStart.day}.${pStart.month}.${pStart.year} ${suffix}`;
  }

  if (!pStart && pEnd) {
    return `${pEnd.day}.${pEnd.month}.${pEnd.year} ${suffix}`;
  }

  return cityName ? `${cityName} Seyahatim` : '';
};

