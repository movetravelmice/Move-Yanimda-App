import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  X,
  Plug,
  Sparkles,
  Zap,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  Check,
  Smartphone,
  Laptop
} from 'lucide-react';
import CountryFlag from '../../../components/CountryFlag';

// Clean & Minimalist Socket Faceplate Visuals (Vector SVGs)
const SOCKET_SVGS = {
  'Type A': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="20" y="19" width="3.5" height="18" rx="1.75" fill="#1e293b" />
      <rect x="32.5" y="19" width="3.5" height="18" rx="1.75" fill="#1e293b" />
    </svg>
  ),
  'Type B': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="19" y="17" width="3.5" height="15" rx="1.75" fill="#1e293b" />
      <rect x="33.5" y="17" width="3.5" height="15" rx="1.75" fill="#1e293b" />
      <circle cx="28" cy="37" r="3.2" fill="#1e293b" />
    </svg>
  ),
  'Type C': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#f0fdf4" stroke="#86efac" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1" />
      <circle cx="20" cy="28" r="3.8" fill="#166534" />
      <circle cx="36" cy="28" r="3.8" fill="#166534" />
    </svg>
  ),
  'Type D': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="28" cy="17" r="4.2" fill="#1e293b" />
      <circle cx="18" cy="34" r="3.6" fill="#1e293b" />
      <circle cx="38" cy="34" r="3.6" fill="#1e293b" />
    </svg>
  ),
  'Type E': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="25" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="28" cy="28" r="19" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <circle cx="20" cy="31" r="3.8" fill="#1e293b" />
      <circle cx="36" cy="31" r="3.8" fill="#1e293b" />
      <circle cx="28" cy="16" r="3.2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
    </svg>
  ),
  'Type F': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="25" fill="#f0fdf4" stroke="#86efac" strokeWidth="2" />
      <circle cx="28" cy="28" r="19" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1" />
      <rect x="25.5" y="4" width="5" height="5.5" rx="1" fill="#15803d" />
      <rect x="25.5" y="46.5" width="5" height="5.5" rx="1" fill="#15803d" />
      <circle cx="20" cy="28" r="3.8" fill="#166534" />
      <circle cx="36" cy="28" r="3.8" fill="#166534" />
    </svg>
  ),
  'Type G': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
      <rect x="25.5" y="11" width="5" height="14" rx="2" fill="#991b1b" />
      <rect x="12" y="31" width="12" height="5" rx="2" fill="#991b1b" />
      <rect x="32" y="31" width="12" height="5" rx="2" fill="#991b1b" />
    </svg>
  ),
  'Type I': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="18" y1="18" x2="23.5" y2="28" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="18" x2="32.5" y2="28" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <rect x="26" y="32" width="4" height="11" rx="2" fill="#1e293b" />
    </svg>
  ),
  'Type J': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <polygon points="28,4 48,15 48,41 28,52 8,41 8,15" fill="#fffbeb" stroke="#fde047" strokeWidth="2" />
      <circle cx="18" cy="25" r="3.8" fill="#b45309" />
      <circle cx="38" cy="25" r="3.8" fill="#b45309" />
      <circle cx="28" cy="33" r="3.8" fill="#b45309" />
    </svg>
  ),
  'Type L': (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <rect x="3" y="3" width="50" height="50" rx="14" fill="#fffbeb" stroke="#fde047" strokeWidth="2" />
      <circle cx="16" cy="28" r="3.8" fill="#b45309" />
      <circle cx="28" cy="28" r="3.8" fill="#b45309" />
      <circle cx="40" cy="28" r="3.8" fill="#b45309" />
    </svg>
  )
};

// Travel Destinations Database (32 Most Popular International Destinations)
export const COUNTRIES_DATA = [
  {
    country: 'Birleşik Krallık',
    cities: 'İngiltere, Londra, İskoçya',
    shortName: 'İngiltere',
    flag: '🇬🇧',
    flagCode: 'gb',
    types: ['Type G'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'yes',
    advice: 'İngiliz tipi 3 kalın dikdörtgen uçlu priz kullanılır. Türk fişleri doğrudan girmez, Type-G dönüştürücü adaptör almanız gerekir.'
  },
  {
    country: 'Amerika Birleşik Devletleri',
    cities: 'New York, Los Angeles, Miami',
    shortName: 'ABD',
    flag: '🇺🇸',
    flagCode: 'us',
    types: ['Type A', 'Type B'],
    voltage: '120 V',
    frequency: '60 Hz',
    adapterNeeded: 'yes',
    advice: '2 yassı uçlu Type-A priz kullanılır. Adaptör zorunludur. Voltaj 120V olduğundan saç kurutma gibi tek voltajlı (220V) cihazlar ısınmaz.'
  },
  {
    country: 'İtalya',
    cities: 'Roma, Milano, Floransa, Venedik',
    shortName: 'İtalya',
    flag: '🇮🇹',
    flagCode: 'it',
    types: ['Type C', 'Type F', 'Type L'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'partial',
    advice: 'İnce 2 yuvarlak uçlu telefon şarjlarınız sorunsuz uyar. Kalın topraklı Schuko (laptop/fön) fişler bazı eski prizlere girmeyebilir.'
  },
  {
    country: 'Almanya',
    cities: 'Berlin, Münih, Frankfurt',
    shortName: 'Almanya',
    flag: '🇩🇪',
    flagCode: 'de',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile tamamen aynıdır. Hiçbir adaptöre gerek yoktur; telefon, laptop ve saç kurutma makineleriniz doğrudan çalışır.'
  },
  {
    country: 'Fransa',
    cities: 'Paris, Nice, Lyon',
    shortName: 'Fransa',
    flag: '🇫🇷',
    flagCode: 'fr',
    types: ['Type C', 'Type E'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye standardı fişlerle tam uyumludur. Dönüştürücü adaptöre kesinlikle gerek yoktur.'
  },
  {
    country: 'İspanya',
    cities: 'Madrid, Barselona, Sevilla',
    shortName: 'İspanya',
    flag: '🇪🇸',
    flagCode: 'es',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile aynı Tip C ve F prizler kullanılır. Adaptör gerekmez.'
  },
  {
    country: 'Birleşik Arap Emirlikleri',
    cities: 'Dubai, Abu Dabi',
    shortName: 'Dubai',
    flag: '🇦🇪',
    flagCode: 'ae',
    types: ['Type G'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'yes',
    advice: 'İngiliz tipi (Type G) 3 uçlu priz kullanılır. Türk fişleri doğrudan girmez, yanınızda Type-G adaptör bulundurmalısınız.'
  },
  {
    country: 'Japonya',
    cities: 'Tokyo, Kyoto, Osaka',
    shortName: 'Japonya',
    flag: '🇯🇵',
    flagCode: 'jp',
    types: ['Type A', 'Type B'],
    voltage: '100 V',
    frequency: '50 / 60 Hz',
    adapterNeeded: 'yes',
    advice: '2 yassı uçlu Type-A priz kullanılır. Adaptör zorunludur. Voltaj 100V olduğundan saç maşası gibi tek voltajlı cihazlar ısınmayabilir.'
  },
  {
    country: 'Gürcistan',
    cities: 'Batum, Tiflis',
    shortName: 'Gürcistan',
    flag: '🇬🇪',
    flagCode: 'ge',
    types: ['Type C', 'Type F'],
    voltage: '220 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile tamamen aynı priz ve voltaj kullanılır. Hiçbir adaptöre gerek yoktur.'
  },
  {
    country: 'İsviçre',
    cities: 'Zürih, Cenevre, Bern',
    shortName: 'İsviçre',
    flag: '🇨🇭',
    flagCode: 'ch',
    types: ['Type J', 'Type C'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'partial',
    advice: 'İnce 2 yuvarlak uçlu telefon şarj fişleri uyar. Kalın topraklı fişler altıgen Type-J yuvasına sığmaz; kalın fişler için adaptör gerekir.'
  },
  {
    country: 'Yunanistan',
    cities: 'Atina, Selanik, Rodos, Kos',
    shortName: 'Yunanistan',
    flag: '🇬🇷',
    flagCode: 'gr',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile tamamen aynı priz tipleri kullanılır. Adaptör gerekmez.'
  },
  {
    country: 'Hollanda',
    cities: 'Amsterdam, Rotterdam',
    shortName: 'Hollanda',
    flag: '🇳🇱',
    flagCode: 'nl',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile aynı Schuko / Europlug prizler kullanılır. Adaptör gerekmez.'
  },
  {
    country: 'Avusturya',
    cities: 'Viyana, Salzburg',
    shortName: 'Avusturya',
    flag: '🇦🇹',
    flagCode: 'at',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile aynı prizler kullanılır. Adaptör gerekmez.'
  },
  {
    country: 'Güney Kore',
    cities: 'Seul, Busan',
    shortName: 'G. Kore',
    flag: '🇰🇷',
    flagCode: 'kr',
    types: ['Type C', 'Type F'],
    voltage: '220 V',
    frequency: '60 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile aynı Schuko (Tip C / F) prizler kullanılır. Tüm cihazlarınız doğrudan çalışır.'
  },
  {
    country: 'Tayland',
    cities: 'Bangkok, Phuket, Pattaya',
    shortName: 'Tayland',
    flag: '🇹🇭',
    flagCode: 'th',
    types: ['Type A', 'Type B', 'Type C'],
    voltage: '220 V',
    frequency: '50 Hz',
    adapterNeeded: 'partial',
    advice: 'Çoğu modern otelde evrensel priz vardır ve Türk Type-C fişleri uyar. Eski tesislerde Type-A adaptör gerekebilir.'
  },
  {
    country: 'Singapur',
    cities: 'Singapur',
    shortName: 'Singapur',
    flag: '🇸🇬',
    flagCode: 'sg',
    types: ['Type G'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'yes',
    advice: 'İngiliz tipi 3 uçlu Type-G kullanılır. Adaptör zorunludur.'
  },
  {
    country: 'Kıbrıs',
    cities: 'Lefkoşa, Girne, Gazimağusa',
    shortName: 'Kıbrıs',
    flag: '🇨🇾',
    flagCode: 'cy',
    types: ['Type G'],
    voltage: '240 V',
    frequency: '50 Hz',
    adapterNeeded: 'yes',
    advice: 'KKTC ve Güney Kıbrıs\'ta İngiliz standardı Type-G 3 tırnaklı prizler kullanılır. Dönüştürücü adaptör zorunludur.'
  },
  {
    country: 'Çekya',
    cities: 'Prag, Brno',
    shortName: 'Çekya',
    flag: '🇨🇿',
    flagCode: 'cz',
    types: ['Type C', 'Type E'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türk fişleri sorunsuz uyar. Adaptör gerekmez.'
  },
  {
    country: 'Macaristan',
    cities: 'Budapeşte',
    shortName: 'Macaristan',
    flag: '🇭🇺',
    flagCode: 'hu',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile aynı prizler kullanılır. Adaptör gerekmez.'
  },
  {
    country: 'Portekiz',
    cities: 'Lizbon, Porto',
    shortName: 'Portekiz',
    flag: '🇵🇹',
    flagCode: 'pt',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile tamamen aynıdır. Adaptör gerekmez.'
  },
  {
    country: 'Belçika',
    cities: 'Brüksel, Brugge, Anvers',
    shortName: 'Belçika',
    flag: '🇧🇪',
    flagCode: 'be',
    types: ['Type C', 'Type E'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye fişleriyle tam uyumludur. Adaptör gerekmez.'
  },
  {
    country: 'Polonya',
    cities: 'Varşova, Krakow',
    shortName: 'Polonya',
    flag: '🇵🇱',
    flagCode: 'pl',
    types: ['Type C', 'Type E'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türk standart fişleri doğrudan takılabilir. Adaptör gerekmez.'
  },
  {
    country: 'Suudi Arabistan',
    cities: 'Mekke, Medine, Riyad, Cidde',
    shortName: 'S. Arabistan',
    flag: '🇸🇦',
    flagCode: 'sa',
    types: ['Type G'],
    voltage: '230 V',
    frequency: '60 Hz',
    adapterNeeded: 'yes',
    advice: 'Hac ve Umre seyahatlerinizde otellerde İngiliz standardı Type-G prizler kullanılır. Yanınızda adaptör bulundurmalısınız.'
  },
  {
    country: 'Mısır',
    cities: 'Kahire, Şarm El Şeyh, Hurgada',
    shortName: 'Mısır',
    flag: '🇪🇬',
    flagCode: 'eg',
    types: ['Type C', 'Type F'],
    voltage: '220 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye standardı 2 yuvarlak pinli fişler doğrudan uyar.'
  },
  {
    country: 'Katar',
    cities: 'Doha',
    shortName: 'Katar',
    flag: '🇶🇦',
    flagCode: 'qa',
    types: ['Type G'],
    voltage: '240 V',
    frequency: '50 Hz',
    adapterNeeded: 'yes',
    advice: 'Type G (İngiliz standardı) kullanılır. Dönüştürücü adaptör zorunludur.'
  },
  {
    country: 'Norveç',
    cities: 'Oslo, Bergen, Tromsø',
    shortName: 'Norveç',
    flag: '🇳🇴',
    flagCode: 'no',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile aynı prizler kullanılır. Adaptör gerekmez.'
  },
  {
    country: 'İsveç',
    cities: 'Stockholm, Göteborg',
    shortName: 'İsveç',
    flag: '🇸🇪',
    flagCode: 'se',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye standardı fişler doğrudan takılabilir. Adaptör gerekmez.'
  },
  {
    country: 'Danimarka',
    cities: 'Kopenhag, Billund',
    shortName: 'Danimarka',
    flag: '🇩🇰',
    flagCode: 'dk',
    types: ['Type C', 'Type E', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye ile uyumludur. İnce ve kalın standart Türk fişleri doğrudan uyar.'
  },
  {
    country: 'Kanada',
    cities: 'Toronto, Vancouver, Montreal',
    shortName: 'Kanada',
    flag: '🇨🇦',
    flagCode: 'ca',
    types: ['Type A', 'Type B'],
    voltage: '120 V',
    frequency: '60 Hz',
    adapterNeeded: 'yes',
    advice: 'ABD ile aynı Type A/B priz kullanılır. Adaptör zorunludur.'
  },
  {
    country: 'Avustralya',
    cities: 'Sidney, Melbourne, Brisbane',
    shortName: 'Avustralya',
    flag: '🇦🇺',
    flagCode: 'au',
    types: ['Type I'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'yes',
    advice: '2 eğik açılı yassı uçlu Type-I priz kullanılır. Türk fişleri girmez, dönüştürücü adaptör zorunludur.'
  },
  {
    country: 'Çin',
    cities: 'Pekin, Şanghay, Guangzhou',
    shortName: 'Çin',
    flag: '🇨🇳',
    flagCode: 'cn',
    types: ['Type A', 'Type C', 'Type I'],
    voltage: '220 V',
    frequency: '50 Hz',
    adapterNeeded: 'partial',
    advice: 'Oteller genellikle ikili ve üçlü prizleri destekler. Çoğu 2 uçlu Türk şarjı doğrudan uyar.'
  },
  {
    country: 'Türkiye',
    cities: 'İstanbul, Ankara, İzmir, Antalya',
    shortName: 'Türkiye',
    flag: '🇹🇷',
    flagCode: 'tr',
    types: ['Type C', 'Type F'],
    voltage: '230 V',
    frequency: '50 Hz',
    adapterNeeded: 'no',
    advice: 'Türkiye yerel priz standardıdır. Tip C (Europlug) ve Tip F (Schuko) 230V 50Hz kullanılır.'
  }
];

export default function SocketGuide({ isEmbedded = false }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES_DATA[0]); // Default: Birleşik Krallık
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filter countries for dropdown search
  const filteredCountries = useMemo(() => {
    const q = dropdownSearch.toLowerCase().trim();
    if (!q) return COUNTRIES_DATA;
    return COUNTRIES_DATA.filter(c => 
      c.country.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.cities.toLowerCase().includes(q) ||
      c.types.some(t => t.toLowerCase().includes(q))
    );
  }, [dropdownSearch]);

  // Visual status config
  const getStatus = (statusKey) => {
    switch (statusKey) {
      case 'no':
        return {
          title: 'Dönüştürücü Gerekmez',
          tag: '✓ Tam Uyumlu',
          desc: 'Türkiye’deki tüm fişlerinizi bu ülkede doğrudan prize takabilirsiniz.',
          badgeBg: '#f0fdf4',
          badgeColor: '#15803d',
          badgeBorder: '#bbf7d0',
          gradientBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderColor: '#86efac',
          iconColor: '#16a34a',
          Icon: CheckCircle2
        };
      case 'yes':
        return {
          title: 'Dönüştürücü Adaptör Zorunlu',
          tag: '✕ Adaptör Gerekli',
          desc: 'Türk fişleri bu ülkenin priz yuvasına girmez; yanınıza çevirici adaptör almalısınız.',
          badgeBg: '#fff1f2',
          badgeColor: '#e11d48',
          badgeBorder: '#fecdd3',
          gradientBg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
          borderColor: '#fda4af',
          iconColor: '#e11d48',
          Icon: XCircle
        };
      case 'partial':
      default:
        return {
          title: 'Kısmi Uyumluluk (Cihaza Göre)',
          tag: '⚠ Kısmi Uyumlu',
          desc: 'İnce 2 yuvarlak uçlu telefon şarjları uyar; kalın topraklı fişler için adaptör gerekebilir.',
          badgeBg: '#fffbeb',
          badgeColor: '#b45309',
          badgeBorder: '#fde68a',
          gradientBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          borderColor: '#fde047',
          iconColor: '#d97706',
          Icon: AlertTriangle
        };
    }
  };

  const status = getStatus(selectedCountry.adapterNeeded);
  const StatusIcon = status.Icon;

  const faqs = [
    {
      id: 1,
      q: 'Telefon ve dizüstü bilgisayar şarjım bu ülkede çalışır mı?',
      icon: '📱',
      a: 'Evet, kesinlikle çalışır. Modern tüm akıllı telefon, tablet ve laptop şarj adaptörleri 100V - 240V çift voltaj destekler. Şebeke voltajı ne olursa olsun voltaj dönüştürücüye gerek kalmadan, yalnızca fiziki priz ucu çevirici adaptörle güvenle şarj edebilirsiniz.'
    },
    {
      id: 2,
      q: 'Saç kurutma makinesi veya saç maşası çalışır mı?',
      icon: '💇',
      a: 'Türkiye\'den satın alınan fön makineleri, saç düzleştiricileri ve su ısıtıcıları genellikle sadece 220V-240V destekler. ABD, Kanada ve Japonya gibi 100V-120V şebekeli ülkelerde adaptör taksanız dahi motoru dönmez veya ısıtmaz. Cihazınızın etiketinde "100-240V" yazmıyorsa otelinizin sağladığı saç kurutma makinesini kullanmanız tavsiye edilir.'
    },
    {
      id: 3,
      q: 'Universal (Çoklu) Seyahat Adaptörü nedir ve işe yarar mı?',
      icon: '🔌',
      a: 'Universal adaptörler, sürgülü mekanizmaları sayesinde Type A (ABD/Japonya), Type G (İngiltere/Dubai), Type I (Avustralya) ve Type C (Avrupa) priz uçlarını tek gövdede birleştirir. Üzerinde dahili USB-A ve Type-C hızlı şarj portları olan kaliteli bir model edinirseniz dünyanın 150+ ülkesinde priz sorununuzu tek bir cihazla çözebilirsiniz.'
    },
    {
      id: 4,
      q: 'Türkiye\'de hangi priz ve voltaj standardı kullanılır?',
      icon: '🇹🇷',
      a: 'Türkiye\'de Tip C (ince 2 yuvarlak uç) ve Tip F (Schuko topraklı) prizler kullanılır. Elektrik şebekesi 230 Volt gerilim ve 50 Hz frekanstadır. Kıta Avrupası\'nın büyük kısmında (Almanya, Fransa, İspanya, İtalya vb.) aynı standart geçerlidir.'
    }
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>

      {/* ========================================================
          1. TOP INTRO CARD (Signature Corporate Theme)
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '10px 14px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
          border: '1px solid #F9BED8',
          color: '#D7147A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Plug size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
            Fiş Tipi & Priz Uyumluluk Rehberi
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px', lineHeight: 1.35 }}>
            Seyahat edeceğiniz ülkenin priz tipini, voltajını ve adaptör ihtiyacını anında öğrenin.
          </div>
        </div>
      </div>

      {/* ========================================================
          2. COUNTRY SELECTION CARD (CUSTOM DROPDOWN MENU)
      ======================================================== */}
      <div 
        ref={dropdownRef}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '14px 14px 16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
          position: 'relative'
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>
            Gideceğiniz Ülke
          </label>
        </div>

        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            setDropdownSearch('');
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            minHeight: '48px',
            borderRadius: '14px',
            border: isDropdownOpen ? '1.5px solid #D7147A' : '1px solid #F9BED8',
            background: isDropdownOpen ? '#ffffff' : '#FDF2F8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: isDropdownOpen 
              ? '0 0 0 3px rgba(215, 20, 122, 0.1), 0 2px 8px rgba(215, 20, 122, 0.06)' 
              : '0 1px 3px rgba(215, 20, 122, 0.04)',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box'
          }}
        >
          {/* Left: Flag & Country Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <CountryFlag country={selectedCountry.flagCode} size="md" />
            <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#0f172a',
                lineHeight: 1.3
              }}>
                {selectedCountry.country}
              </div>
              {selectedCountry.cities && (
                <div style={{ 
                  fontSize: '10.5px', 
                  color: '#8E0C51', 
                  fontWeight: '500', 
                  marginTop: '1px'
                }}>
                  {selectedCountry.cities}
                </div>
              )}
            </div>
          </div>

          {/* Right: Chevron Arrow */}
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: isDropdownOpen ? '#FCE7F3' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDropdownOpen ? '#D7147A' : '#94a3b8',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}>
            <ChevronDown size={15} />
          </div>
        </button>

        {/* Popover Dropdown Menu */}
        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% - 4px)',
            left: '14px',
            right: '14px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #F9BED8',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.14), 0 4px 14px rgba(215, 20, 122, 0.08)',
            zIndex: 60,
            padding: '8px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Search Input inside Popover */}
            <div style={{ position: 'relative', marginBottom: '6px' }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '9px' }} />
              <input
                type="text"
                autoFocus
                value={dropdownSearch}
                onChange={e => setDropdownSearch(e.target.value)}
                placeholder="Ülke, şehir veya priz tipi ara (Örn: Londra, Type G, Japonya)..."
                style={{
                  width: '100%',
                  padding: '6px 26px 6px 28px',
                  borderRadius: '9px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '11px',
                  color: '#1e293b',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {dropdownSearch && (
                <button
                  type="button"
                  onClick={() => setDropdownSearch('')}
                  style={{
                    position: 'absolute',
                    right: '7px',
                    top: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px'
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Countries Scrollable List */}
            <div style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              paddingRight: '2px'
            }}>
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                  Aramanızla eşleşen ülke bulunamadı.
                </div>
              ) : (
                filteredCountries.map(c => {
                  const isSelected = c.country === selectedCountry.country;
                  return (
                    <button
                      key={c.country}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                        background: isSelected ? '#FDF2F8' : '#ffffff',
                        color: isSelected ? '#B01064' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#ffffff';
                        }
                      }}
                    >
                      {/* Left: Flag and Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <CountryFlag country={c.flagCode} size="md" />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: '12.5px',
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? '#B01064' : '#0f172a',
                            lineHeight: 1.3
                          }}>
                            {c.country}
                          </div>
                          {c.cities && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: isSelected ? '#8E0C51' : '#64748b', 
                              marginTop: '1px',
                              lineHeight: 1.2
                            }}>
                              {c.cities}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Selected Checkmark */}
                      {isSelected && (
                        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: '6px' }}>
                          <Check size={16} color="#D7147A" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          3. MAIN ADAPTER COMPATIBILITY CARD
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '16px 18px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        marginBottom: '16px'
      }}>
        
        {/* Top Status Banner */}
        <div style={{
          background: status.gradientBg,
          border: `1.5px solid ${status.borderColor}`,
          borderRadius: '14px',
          padding: '10px 13px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}>
            <StatusIcon size={17} color={status.iconColor} strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: status.iconColor, letterSpacing: '-0.2px' }}>
              {status.title}
            </div>
            <div style={{ fontSize: '10px', color: '#334155', fontWeight: '500', marginTop: '1px', lineHeight: 1.35 }}>
              {status.desc}
            </div>
          </div>
        </div>

        {/* Destination Country Sockets */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <CountryFlag country={selectedCountry.flagCode} size="sm" />
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a' }}>
                {selectedCountry.country} Priz Tipleri
              </span>
            </div>
            <span style={{
              fontSize: '9.5px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '6px',
              background: status.badgeBg,
              color: status.badgeColor,
              border: `1px solid ${status.badgeBorder}`
            }}>
              {status.tag}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {selectedCountry.types.map(t => {
              const isCompatibleWithTR = (t === 'Type C' || t === 'Type F');
              return (
                <div
                  key={t}
                  style={{
                    flex: '1 1 110px',
                    maxWidth: selectedCountry.types.length === 1 ? '200px' : '160px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {SOCKET_SVGS[t] || <Plug size={40} color="#64748b" />}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                    {t}
                  </div>
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: '600',
                    marginTop: '2px',
                    color: isCompatibleWithTR ? '#166534' : '#B01064'
                  }}>
                    {isCompatibleWithTR ? 'Türkiye Fişi Uyumlu' : 'Adaptör Gerekir'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Practical Device Compatibility Checklist */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '10px 12px',
          marginBottom: '14px'
        }}>
          <div style={{ 
            fontSize: '10px', 
            fontWeight: '800', 
            color: '#64748b', 
            textTransform: 'uppercase', 
            letterSpacing: '0.4px', 
            marginBottom: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px' 
          }}>
            <Zap size={12} color="#D7147A" />
            <span>Cihazlarınız Bu Ülkede Nasıl Çalışır?</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Phone */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              padding: '9px 11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                  📱 Telefon & Tablet Şarjları
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '1px', lineHeight: 1.3 }}>
                  Tüm modern şarj adaptörleri 100–240V destekler; voltajdan etkilenmez.
                </div>
              </div>
              <div style={{
                flexShrink: 0,
                width: '92px',
                height: '24px',
                fontSize: '8.5px',
                fontWeight: '700',
                color: '#16a34a',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}>
                ✓ %100 Uyumlu
              </div>
            </div>

            {/* Laptop */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              padding: '9px 11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                  💻 Dizüstü Bilgisayar Şarjı
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '1px', lineHeight: 1.3 }}>
                  {selectedCountry.adapterNeeded === 'yes' ? 'Priz ucu dönüştürücüyle güvenle şarj edilir.' : 'Doğrudan prize takılabilir.'}
                </div>
              </div>
              <div style={{
                flexShrink: 0,
                width: '92px',
                height: '24px',
                fontSize: '8.5px',
                fontWeight: '700',
                color: '#16a34a',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}>
                ✓ Çift Voltaj
              </div>
            </div>

            {/* Hairdryer / Styler */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '12px',
              padding: '9px 11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                  💇 Fön & Saç Düzleştirici
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '1px', lineHeight: 1.3 }}>
                  {selectedCountry.voltage.includes('100') || selectedCountry.voltage.includes('120')
                    ? 'Tek voltajlı (220V) cihazlar 110V şebekede yeterince ısınmaz.'
                    : 'Türkiye voltajıyla aynıdır, sorunsuz çalışır.'}
                </div>
              </div>
              {selectedCountry.voltage.includes('100') || selectedCountry.voltage.includes('120') ? (
                <div style={{
                  flexShrink: 0,
                  width: '92px',
                  height: '24px',
                  fontSize: '8.5px',
                  fontWeight: '700',
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}>
                  ⚠️ Isınmayabilir
                </div>
              ) : (
                <div style={{
                  flexShrink: 0,
                  width: '92px',
                  height: '24px',
                  fontSize: '8.5px',
                  fontWeight: '700',
                  color: '#16a34a',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}>
                  ✓ 230V Uyumlu
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Specs Comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#f8fafc',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '13px 12px',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', lineHeight: 1.2 }}>Hedef Ülke Voltajı</div>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '5px' }}>
              {selectedCountry.voltage}
            </div>
          </div>

          <div style={{ textAlign: 'left', borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', lineHeight: 1.2 }}>Şebeke Frekansı</div>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '5px' }}>
              {selectedCountry.frequency}
            </div>
          </div>

          <div style={{ textAlign: 'left', borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600', lineHeight: 1.2 }}>Türkiye Voltajı</div>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#16a34a', marginTop: '5px' }}>
              230 V / 50 Hz
            </div>
          </div>
        </div>

        {/* Traveler Advice Note */}
        <div style={{
          background: '#fff5f9',
          border: '1px solid #F9BED8',
          borderRadius: '12px',
          padding: '9px 11px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          textAlign: 'left'
        }}>
          <Sparkles size={14} color="#D7147A" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '10.5px', color: '#8E0C51', lineHeight: 1.45 }}>
            <strong style={{ color: '#7c2d12' }}>Gezgin Tavsiyesi: </strong>
            {selectedCountry.advice}
          </div>
        </div>

      </div>

      {/* ========================================================
          4. UNIVERSAL TRAVEL ADAPTER PRO-TIP CARD
      ======================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        padding: '11px 13px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '9px',
          background: '#ffffff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)'
        }}>
          <Plug size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e40af' }}>
            Çoklu Evrensel Adaptör Tavsiyesi
          </div>
          <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '1px', lineHeight: 1.35 }}>
            Sık seyahat ediyorsanız, üzerinde dahili Tip A, C, G ve I uçları bulunan tek bir üniversal adaptör edinerek 150'den fazla ülkede priz sorununu kökten çözebilirsiniz.
          </div>
        </div>
      </div>

      {/* ========================================================
          5. FAQ & TRAVEL TIPS (ACCORDION)
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '16px 16px 18px 16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HelpCircle size={14} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
              Sıkça Sorulan Sorular & Priz Rehberi
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map(item => {
            const isOpen = openFaq === item.id;
            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: isOpen ? '#f8fafc' : '#ffffff',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : item.id)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#1e293b', lineHeight: 1.35 }}>
                      {item.q}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={14} color="#64748b" style={{ flexShrink: 0 }} /> : <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
                </button>

                {isOpen && (
                  <div style={{
                    padding: '10px 14px 14px 36px',
                    fontSize: '10.5px',
                    color: '#64748b',
                    lineHeight: 1.5,
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
