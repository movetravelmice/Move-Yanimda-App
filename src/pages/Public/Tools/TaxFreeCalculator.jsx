import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Receipt, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Plane, 
  Stamp, 
  CreditCard, 
  ShoppingBag,
  Info,
  Coins,
  Sparkles,
  Calculator,
  Percent,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
  X,
  Check,
  ShieldCheck,
  Clock
} from 'lucide-react';
import CountryFlag from '../../../components/CountryFlag';

export const TAX_FREE_COUNTRIES = [
  {
    country: 'İtalya',
    shortName: 'İtalya',
    flagCode: 'it',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 22,
    minSpend: 70.01,
    refundRatePct: 12.5,
    presets: [75, 150, 250, 500, 1000],
    notes: 'İtalya\'da alt limit 154 €\'dan 70.01 €\'ya düşürülmüştür. Giysi ve lüks eşyada Avrupa\'nın en avantajlı ülkelerindendir. Roma Fiumicino ve Milano Malpensa\'da OTELLO dijital gümrük kioskları bulunur.'
  },
  {
    country: 'Fransa',
    shortName: 'Fransa',
    flagCode: 'fr',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 20,
    minSpend: 100.0,
    refundRatePct: 12.0,
    presets: [100, 250, 500, 1000, 2000],
    notes: 'Aynı gün aynı mağazada minimum 100 € harcama gereklidir. Paris CDG ve Orly havalimanlarında PABLO barkod okuyucu kiosklarıyla saniyeler içinde onay alabilirsiniz.'
  },
  {
    country: 'Almanya',
    shortName: 'Almanya',
    flagCode: 'de',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 19,
    minSpend: 50.01,
    refundRatePct: 11.5,
    presets: [55, 100, 250, 500, 1000],
    notes: 'Minimum harcama sınırı sadece 50.01 €\'dur. Global Blue ve Planet gişeleri tüm büyük Alman havalimanlarında (Frankfurt, Münih, Berlin) bulunmaktadır.'
  },
  {
    country: 'İspanya',
    shortName: 'İspanya',
    flagCode: 'es',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 21,
    minSpend: 0,
    refundRatePct: 13.0,
    presets: [50, 100, 250, 500, 1000],
    notes: 'İspanya\'da ALT HARCAMA LİMİTİ YOKTUR (0 €)! 10 €\'luk alışverişte bile Tax-Free formu talep edebilir, Madrid ve Barselona havalimanlarında DIVA kiosklarından barkodla onaylatabilirsiniz.'
  },
  {
    country: 'Japonya',
    shortName: 'Japonya',
    flagCode: 'jp',
    currency: 'JPY',
    symbol: '¥',
    standardVatRate: 10,
    minSpend: 5000,
    refundRatePct: 9.1,
    presets: [5000, 15000, 30000, 60000, 100000],
    notes: 'Japonya\'da vergi iadesi havalimanı yerine DOĞRUDAN MAĞAZA KASASINDA yapılır. Pasaportunuzu gösterdiğinizde %10 KDV anında faturadan düşülür ve net tutarı ödersiniz.'
  },
  {
    country: 'Birleşik Arap Emirlikleri (Dubai / Abu Dabi)',
    shortName: 'BAE (Dubai)',
    flagCode: 'ae',
    currency: 'AED',
    symbol: 'AED',
    standardVatRate: 5,
    minSpend: 250,
    refundRatePct: 4.25,
    presets: [250, 500, 1000, 2500, 5000],
    notes: 'KDV %5 olup bunun %85\'i (işlem ücreti hariç) Planet Tax Free kiosklarından Dubai ve Abu Dabi havalimanlarında nakit veya karta iade alınır.'
  },
  {
    country: 'Yunanistan',
    shortName: 'Yunanistan',
    flagCode: 'gr',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 24,
    minSpend: 50.0,
    refundRatePct: 14.0,
    presets: [50, 100, 250, 500, 1000],
    notes: 'Avrupa\'nın en yüksek KDV oranlarından birine sahiptir (%24). Adalardan Türkiye\'ye feribotla dönüşte gümrük limanında (Rodos, Kos, Sakız vb.) onaylatabilirsiniz.'
  },
  {
    country: 'Hollanda',
    shortName: 'Hollanda',
    flagCode: 'nl',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 21,
    minSpend: 50.0,
    refundRatePct: 12.0,
    presets: [50, 100, 250, 500, 1000],
    notes: 'Amsterdam Schiphol havalimanında Lounge 3 ve Departure 3 alanlarında gümrük masaları ve Global Blue bankoları bulunur.'
  },
  {
    country: 'Avusturya',
    shortName: 'Avusturya',
    flagCode: 'at',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 20,
    minSpend: 75.01,
    refundRatePct: 11.5,
    presets: [75, 150, 250, 500, 1000],
    notes: 'Viyana Havalimanı Terminal 1 ve 3\'te gümrük ve iade bankoları bulunmaktadır.'
  },
  {
    country: 'Portekiz',
    shortName: 'Portekiz',
    flagCode: 'pt',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 23,
    minSpend: 61.5,
    refundRatePct: 13.5,
    presets: [65, 120, 250, 500, 1000],
    notes: 'Lizbon ve Porto havalimanlarında e-TaxFree elektronik onay terminalleri mevcuttur.'
  },
  {
    country: 'İsviçre',
    shortName: 'İsviçre',
    flagCode: 'ch',
    currency: 'CHF',
    symbol: 'CHF',
    standardVatRate: 8.1,
    minSpend: 300,
    refundRatePct: 5.5,
    presets: [300, 500, 1000, 2500, 5000],
    notes: 'İsviçre AB üyesi değildir. Alt sınır 300 CHF\'dir. Cenevre ve Zürih havalimanlarında İsviçre gümrük damgası alınır.'
  },
  {
    country: 'Birleşik Krallık (İngiltere)',
    shortName: 'İngiltere',
    flagCode: 'gb',
    currency: 'GBP',
    symbol: '£',
    standardVatRate: 20,
    minSpend: 0,
    refundRatePct: 0,
    presets: [100, 250, 500, 1000, 2000],
    notes: 'DİKKAT: Brexit sonrası İngiltere, Galler ve İskoçya\'da turistler için havalimanı Tax-Free sistemi kaldırılmıştır. Mağaza doğrudan Türkiye\'ye uluslararası kargo yaparsa KDV muafiyeti uygulanabilir.'
  },
  {
    country: 'Gürcistan (Batum / Tiflis)',
    shortName: 'Gürcistan',
    flagCode: 'ge',
    currency: 'GEL',
    symbol: '₾',
    standardVatRate: 18,
    minSpend: 200,
    refundRatePct: 13.0,
    presets: [200, 500, 1000, 2500, 5000],
    notes: 'Türk vatandaşlarının kimlikle seyahat ettiği Gürcistan\'da elektronik ve alışverişte %18 KDV iadesi (Revenue Service) Sarp Sınır Kapısı veya Tiflis/Batum havalimanlarında nakit veya karta alınabilir.'
  },
  {
    country: 'Türkiye (Yurt Dışı Yerleşikler)',
    shortName: 'Türkiye',
    flagCode: 'tr',
    currency: 'TRY',
    symbol: '₺',
    standardVatRate: 20,
    minSpend: 2000,
    refundRatePct: 12.0,
    presets: [2000, 5000, 10000, 25000, 50000],
    notes: 'Yurt dışında ikamet eden Türk vatandaşları (çifte vatandaş/mavi kartlılar) ve yabancı turistler, Türkiye\'den çıkışta İstanbul, Sabiha Gökçen ve Antalya havalimanlarında Tax-Free iadesi alabilir.'
  },
  {
    country: 'Güney Kore (Seul)',
    shortName: 'Güney Kore',
    flagCode: 'kr',
    currency: 'KRW',
    symbol: '₩',
    standardVatRate: 10,
    minSpend: 15000,
    refundRatePct: 7.0,
    presets: [15000, 50000, 100000, 300000, 500000],
    notes: 'Kozmetik (K-Beauty) ve moda alışverişlerinde mağazada pasaportla anında vergi düşülür (Immediate Tax Refund) veya Incheon Havalimanı kiosklarından anında nakit/karta iade alınır.'
  },
  {
    country: 'Tayland (Bangkok / Phuket)',
    shortName: 'Tayland',
    flagCode: 'th',
    currency: 'THB',
    symbol: '฿',
    standardVatRate: 7,
    minSpend: 2000,
    refundRatePct: 4.5,
    presets: [2000, 5000, 10000, 20000, 50000],
    notes: 'AVM\'lerde (Siam Paragon, CentralWorld vb.) sarı PP10 formu doldurulur. Suvarnabhumi ve Phuket havalimanlarında gümrük damgası sonrası nakit Baht olarak teslim alınır.'
  },
  {
    country: 'Singapur',
    shortName: 'Singapur',
    flagCode: 'sg',
    currency: 'SGD',
    symbol: 'S$',
    standardVatRate: 9,
    minSpend: 100,
    refundRatePct: 5.5,
    presets: [100, 250, 500, 1000, 2500],
    notes: 'Changi Havalimanı\'nda elektronik eTRS sistemi sayesinde pasaportunuzu kioska okutarak kağıt form doldurmadan anında kartınıza veya nakit olarak iade alabilirsiniz.'
  },
  {
    country: 'Macaristan (Budapeşte)',
    shortName: 'Macaristan',
    flagCode: 'hu',
    currency: 'HUF',
    symbol: 'Ft',
    standardVatRate: 27,
    minSpend: 74001,
    refundRatePct: 16.5,
    presets: [75000, 150000, 300000, 600000, 1000000],
    notes: 'Avrupa Birliği\'nin EN YÜKSEK KDV oranına (%27) sahiptir; bu sayede en yüksek net nakit iadelerden biri alınır. Budapeşte Ferenc Liszt Havalimanı 2A ve 2B terminallerinde onaylatılır.'
  },
  {
    country: 'Çekya (Prag)',
    shortName: 'Çekya',
    flagCode: 'cz',
    currency: 'CZK',
    symbol: 'Kč',
    standardVatRate: 21,
    minSpend: 2001,
    refundRatePct: 12.5,
    presets: [2500, 5000, 10000, 20000, 50000],
    notes: 'Bohemya kristalleri, porselen ve saat alışverişlerinde tercih edilir. Prag Vaclav Havel Havalimanı Terminal 1 gümrük gişesinde onaylatılır.'
  },
  {
    country: 'Polonya (Varşova / Krakow)',
    shortName: 'Polonya',
    flagCode: 'pl',
    currency: 'PLN',
    symbol: 'zł',
    standardVatRate: 23,
    minSpend: 200,
    refundRatePct: 13.5,
    presets: [200, 500, 1000, 2500, 5000],
    notes: 'Alt harcama sınırı oldukça düşüktür (sadece 200 PLN). Varşova Chopin ve Krakow havalimanlarında gümrük damgası alınır.'
  },
  {
    country: 'Belçika (Brüksel)',
    shortName: 'Belçika',
    flagCode: 'be',
    currency: 'EUR',
    symbol: '€',
    standardVatRate: 21,
    minSpend: 125.01,
    refundRatePct: 12.5,
    presets: [125, 250, 500, 1000, 2000],
    notes: 'Çikolata, dantel ve elmas alışverişlerinde popülerdir. Brüksel Zaventem Havalimanı gümrük ofisinde onaylatılır.'
  },
  {
    country: 'Norveç',
    shortName: 'Norveç',
    flagCode: 'no',
    currency: 'NOK',
    symbol: 'kr',
    standardVatRate: 25,
    minSpend: 315,
    refundRatePct: 13.5,
    presets: [350, 750, 1500, 3000, 6000],
    notes: 'Norveç AB üyesi değildir. Standart eşyalarda alt sınır 315 NOK, gıda ürünlerinde 290 NOK\'tur. Oslo Gardermoen Havalimanı\'nda Global Blue bankosundan doğrudan iade alınır.'
  },
  {
    country: 'İsveç',
    shortName: 'İsveç',
    flagCode: 'se',
    currency: 'SEK',
    symbol: 'kr',
    standardVatRate: 25,
    minSpend: 200,
    refundRatePct: 13.5,
    presets: [200, 500, 1000, 2500, 5000],
    notes: 'İskandinav tasarımı, mobilya ve giyim alışverişinde tercih edilir. Stockholm Arlanda Havalimanı Terminal 5 gümrük noktasında onaylatılır.'
  },
  {
    country: 'Danimarka',
    shortName: 'Danimarka',
    flagCode: 'dk',
    currency: 'DKK',
    symbol: 'kr',
    standardVatRate: 25,
    minSpend: 300,
    refundRatePct: 13.5,
    presets: [300, 600, 1200, 2500, 5000],
    notes: 'Kopenhag Kastrup Havalimanı Terminal 2 ve 3\'te gümrük masaları ve vergi iade ofisleri bulunmaktadır.'
  },
  {
    country: 'Amerika Birleşik Devletleri (ABD)',
    shortName: 'ABD',
    flagCode: 'us',
    currency: 'USD',
    symbol: '$',
    standardVatRate: 0,
    minSpend: 0,
    refundRatePct: 0,
    presets: [100, 250, 500, 1000, 2000],
    notes: 'BİLGİLENDİRME: ABD\'de ulusal KDV (VAT) sistemi yoktur; eyalet bazlı satış vergisi (Sales Tax) uygulanır (%0-%10 arası). Turistler için havalimanında federal Tax-Free iadesi yapılmaz (Delaware, Oregon, New Hampshire gibi eyaletlerde ise satış vergisi sıfırdır: %0).'
  }
];

// Helper to format number into Turkish currency string (e.g. 454.55 -> 454,55)
const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Helper to format string into Turkish thousand separated number (e.g. 2504 -> 2.504)
const formatInputValue = (val) => {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Check if user just typed a dot or comma at the end for decimals
  const hasComma = str.includes(',');
  const endsWithDot = str.endsWith('.') && !hasComma;
  if (endsWithDot) {
    str = str.slice(0, -1) + ',';
  }

  // Split integer and decimal parts
  const parts = str.split(',');
  const rawInt = parts[0].replace(/\D/g, ''); // keep only digits
  
  if (!rawInt && parts.length === 1) return '';

  // Format integer part with dots
  let formattedInt = '';
  if (rawInt) {
    const intNum = parseInt(rawInt, 10);
    formattedInt = intNum.toLocaleString('tr-TR');
  } else {
    formattedInt = '0';
  }

  // If there is a decimal part
  if (parts.length > 1) {
    const rawDec = parts[1].replace(/\D/g, '').slice(0, 2);
    return `${formattedInt},${rawDec}`;
  }

  return formattedInt;
};

// Helper to convert formatted string back to float for calculations
const parseFormattedValue = (formattedStr) => {
  if (!formattedStr) return 0;
  // "2.504" -> 2504, "2.504,50" -> 2504.50
  const clean = String(formattedStr).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export default function TaxFreeCalculator({ isEmbedded = false }) {
  const [selectedCountry, setSelectedCountry] = useState(TAX_FREE_COUNTRIES[0]);
  const [purchaseAmount, setPurchaseAmount] = useState('250');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
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

  // Filter countries inside dropdown
  const filteredCountries = useMemo(() => {
    const q = dropdownSearch.toLowerCase().trim();
    if (!q) return TAX_FREE_COUNTRIES;
    return TAX_FREE_COUNTRIES.filter(c => 
      c.country.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.flagCode.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q)
    );
  }, [dropdownSearch]);

  const handleAmountChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const prevPos = input.selectionStart;

    const nextVal = formatInputValue(rawValue);
    const wasAtEnd = prevPos >= rawValue.length;

    setPurchaseAmount(nextVal);

    if (wasAtEnd) {
      setTimeout(() => {
        if (inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 0);
    } else {
      const digitsBeforePrev = rawValue.slice(0, prevPos).replace(/\D/g, '').length;
      setTimeout(() => {
        if (inputRef.current) {
          const currentVal = inputRef.current.value;
          let digitsCount = 0;
          let targetIndex = currentVal.length;
          for (let i = 0; i < currentVal.length; i++) {
            if (/\d/.test(currentVal[i])) {
              digitsCount++;
            }
            if (digitsCount === digitsBeforePrev) {
              targetIndex = i + 1;
              break;
            }
          }
          inputRef.current.setSelectionRange(targetIndex, targetIndex);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      const input = e.target;
      const { selectionStart, selectionEnd, value } = input;
      if (selectionStart === selectionEnd && selectionStart > 1) {
        if (value[selectionStart - 1] === '.') {
          e.preventDefault();
          const before = value.slice(0, selectionStart - 2);
          const after = value.slice(selectionStart);
          const nextVal = formatInputValue(before + after);
          setPurchaseAmount(nextVal);
          setTimeout(() => {
            if (inputRef.current) {
              const newPos = Math.max(0, selectionStart - 2);
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      }
    }
  };

  const amount = parseFormattedValue(purchaseAmount);
  const isEligible = amount >= selectedCountry.minSpend && selectedCountry.refundRatePct > 0;
  const isJapan = selectedCountry.flagCode === 'jp';
  
  // Tax calculations
  const rawVatAmount = amount > 0 
    ? (amount * (selectedCountry.standardVatRate / (100 + selectedCountry.standardVatRate)))
    : 0;

  // In Japan, stores deduct 100% of VAT at checkout (0 agency commission)
  const estimatedRefund = isEligible 
    ? (isJapan ? rawVatAmount : Math.min(rawVatAmount, amount * (selectedCountry.refundRatePct / 100)))
    : 0;

  const agencyCommission = isEligible 
    ? (isJapan ? 0 : Math.max(0, rawVatAmount - estimatedRefund))
    : 0;

  const presets = selectedCountry.presets || [100, 250, 500, 1000, 2500];

  const faqs = [
    {
      id: 'cosmetics',
      title: 'Kozmetik ve Sıvı Ürünler Kuralı (Bavul Kontrolü)',
      icon: '🧴',
      desc: 'Parfüm, krem ve 100 ml üzeri sıvılar el bagajında güvenlikten geçemez. Bu tür ürünleri ana bavulunuza koymalısınız. Havalimanına vardığınızda check-in kontuarında görevliye "Bavulumda Tax-Free eşyalar var, gümrüğe göstereceğim" diyerek etiket bastırın, ardından bavulla birlikte gümrük memuruna gidip onaylatın.'
    },
    {
      id: 'cash_vs_card',
      title: 'Nakit İade mi, Kredi Kartına İade mi?',
      icon: '💵',
      desc: 'Nakit iadeler gişede hemen teslim edilir; fakat aracı kurumlar nakit işlem başına genellikle 3 ila 5 € sabit servis ücreti keser. Kredi kartına iade kesintisizdir ve faturadaki net iadenin tamamı yatar; ancak paranın hesaba geçmesi 5 ila 14 iş günü sürebilir.'
    },
    {
      id: 'eligible_goods',
      title: 'Hangi Harcamalar Tax-Free Kapsamındadır?',
      icon: '🛍️',
      desc: 'Sadece Türkiye\'ye yanınızda götüreceğiniz ve kullanılmamış fiziksel eşyalar (giyim, ayakkabı, çanta, elektronik, takı, hediyelik eşya) Tax-Free kapsamındadır. Otel konaklamaları, restoran yemekleri, araç kiralama, müze ve konser biletleri gibi yerinde tüketilen hizmetlerde vergi iadesi alınamaz.'
    },
    {
      id: 'timing',
      title: 'Havalimanına Ne Kadar Erken Gitmeliyim?',
      icon: '⏰',
      desc: 'Yoğun sezonlarda (yaz ayları, bayramlar) gümrük onay masalarında ve Global Blue gişelerinde uzun kuyruklar oluşabilir. Uçuş saatinizden en az 3 saat önce havalimanında olmanız ve bavulunuzu vermeden önce gümrük sırasına girmeniz tavsiye edilir.'
    }
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      {/* 1. TOP INTRO CARD (Signature Corporate Theme) */}
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
          <Receipt size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
            Tax-Free Hesaplayıcı
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px', lineHeight: 1.35 }}>
            Yurt dışı alışverişlerinizde cebinize dönecek net iadeyi hesaplayın ve havalimanı adımlarını takip edin.
          </div>
        </div>
      </div>

      {/* 2. COUNTRY SELECTION CARD (AŞAĞI AÇILIR MENÜ / CUSTOM DROPDOWN) */}
      <div 
        ref={dropdownRef}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '14px 14px 16px',
          marginBottom: '18px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
          position: 'relative'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>
            Alışveriş Yapılan Ülke
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
            padding: '8px 12px',
            minHeight: '44px',
            borderRadius: '13px',
            border: isDropdownOpen ? '1.5px solid #D7147A' : '1px solid #F9BED8',
            background: isDropdownOpen ? '#ffffff' : '#FDF2F8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            boxShadow: isDropdownOpen 
              ? '0 0 0 3px rgba(215, 20, 122, 0.1), 0 2px 8px rgba(215, 20, 122, 0.06)' 
              : '0 1px 3px rgba(215, 20, 122, 0.04)',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box'
          }}
        >
          {/* Left: Flag & Country Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <CountryFlag country={selectedCountry.flagCode} size="md" />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ 
                fontSize: '12.5px', 
                fontWeight: '700', 
                color: '#0f172a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedCountry.country}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#7c2d12', 
                fontWeight: '600', 
                marginTop: '1px',
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
                <span>KDV: %{selectedCountry.standardVatRate}</span>
                <span>•</span>
                <span>Min: {selectedCountry.minSpend === 0 ? 'Limitsiz' : `${selectedCountry.minSpend} ${selectedCountry.symbol}`}</span>
              </div>
            </div>
          </div>

          {/* Right: Pill & Animated Chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              background: '#FCE7F3',
              color: '#B01064',
              border: '1px solid #F9BED8',
              fontSize: '9.5px',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '6px'
            }}>
              %{selectedCountry.standardVatRate} KDV
            </span>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: isDropdownOpen ? '#FCE7F3' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDropdownOpen ? '#D7147A' : '#94a3b8',
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'all 0.2s ease'
            }}>
              <ChevronDown size={14} />
            </div>
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
                placeholder="Ülke veya para birimi ara..."
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
                    top: '7px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Countries Scroll List */}
            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}>
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '16px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                  Aramanızla eşleşen ülke bulunamadı.
                </div>
              ) : (
                filteredCountries.map(c => {
                  const isSelected = selectedCountry.country === c.country;
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
                        padding: '7px 10px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                        background: isSelected ? '#FDF2F8' : '#ffffff',
                        color: isSelected ? '#B01064' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <CountryFlag country={c.flagCode} size="md" />
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? '#B01064' : '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {c.country}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                            Min: {c.minSpend === 0 ? 'Limitsiz' : `${c.minSpend} ${c.symbol}`} • Para Birimi: {c.currency}
                          </div>
                        </div>
                      </div>

                      {/* Right: VAT pill & Checkmark */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: '800',
                          padding: '1.5px 5px',
                          borderRadius: '5px',
                          background: isSelected ? '#FCE7F3' : '#f1f5f9',
                          color: isSelected ? '#D7147A' : '#64748b'
                        }}>
                          %{c.standardVatRate} KDV
                        </span>
                        {isSelected && <Check size={14} color="#D7147A" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. CALCULATOR CARD */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '18px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        marginBottom: '16px'
      }}>
        
        {/* Country Specific Note / Tip */}
        <div style={{
          background: '#faf5ff',
          border: '1px solid #f3e8ff',
          borderRadius: '10px',
          padding: '7px 10px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
          fontSize: '10px',
          color: '#6b21a8',
          lineHeight: 1.45
        }}>
          <Info size={13} color="#9333ea" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{selectedCountry.notes}</span>
        </div>

        {/* Purchase Amount Input */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>
              Fatura / Harcama Tutarı
            </label>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              {selectedCountry.currency} cinsinden
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={purchaseAmount}
              onChange={handleAmountChange}
              onKeyDown={handleKeyDown}
              placeholder="0"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 48px 0 12px',
                borderRadius: '11px',
                border: '1.5px solid #cbd5e1',
                fontSize: '16px',
                fontWeight: '700',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                backgroundColor: '#ffffff'
              }}
              onFocus={e => e.target.style.borderColor = '#D7147A'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />

            {/* Currency Symbol Tag inside input */}
            <div style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              padding: '3px 8px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#475569'
            }}>
              {selectedCountry.symbol}
            </div>
          </div>
        </div>

        {/* ELIGIBILITY & RESULT DISPLAY */}
        {selectedCountry.refundRatePct === 0 ? (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '13px',
            padding: '10px 12px',
            color: '#991b1b',
            fontSize: '10.5px',
            lineHeight: 1.45,
            marginBottom: '12px'
          }}>
            <div style={{ fontWeight: '800', fontSize: '11.5px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} color="#dc2626" />
              {selectedCountry.country} İçin Tax-Free Yok
            </div>
            <div>{selectedCountry.notes}</div>
          </div>
        ) : !isEligible ? (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '13px',
            padding: '10px 12px',
            color: '#92400e',
            fontSize: '10.5px',
            lineHeight: 1.45,
            marginBottom: '12px'
          }}>
            <div style={{ fontWeight: '800', fontSize: '11.5px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} color="#d97706" /> 
              Minimum Harcama Sınırı Sağlanamadı
            </div>
            <div>
              {selectedCountry.country} için tek fişte en az <strong>{selectedCountry.minSpend} {selectedCountry.symbol}</strong> harcama yapılması gerekmektedir.
            </div>
            <div style={{ marginTop: '4px', fontWeight: '700', color: '#b45309' }}>
              Eksik Tutar: {formatMoney(selectedCountry.minSpend - amount)} {selectedCountry.symbol}
            </div>
          </div>
        ) : (
          <div>
            {/* THEME-MATCHED LIGHT HERO REFUND HIGHLIGHT BOX */}
            <div style={{
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              border: '1.5px solid #F9BED8',
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 2px 10px rgba(215, 20, 122, 0.05)',
              marginBottom: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Header inside card */}
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#7c2d12', fontWeight: '700' }}>
                  Cebinize Geri Dönecek Tahmini Net İade:
                </span>
              </div>

              {/* Big Refund Amount */}
              <div style={{
                fontSize: '24px',
                fontWeight: '900',
                letterSpacing: '-0.5px',
                color: '#D7147A',
                display: 'flex',
                alignItems: 'baseline',
                gap: '5px'
              }}>
                <span>~ {formatMoney(estimatedRefund)}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#B01064' }}>{selectedCountry.symbol}</span>
              </div>

              <div style={{ fontSize: '10px', color: '#8E0C51', marginTop: '2px' }}>
                {isJapan ? (
                  <span>Mağaza kasasında pasaportla <strong style={{ color: '#D7147A' }}>%10 KDV'nin tamamı</strong> faturadan anında düşülür (aracı kurum komisyonsuz).</span>
                ) : (
                  <span>Faturanızın yaklaşık <strong style={{ color: '#D7147A' }}>%{selectedCountry.refundRatePct}</strong> kadarı net olarak cebinize döner.</span>
                )}
              </div>

              {/* Detailed Financial Breakdown Row */}
              <div style={{
                marginTop: '12px',
                borderTop: '1px solid #F9BED8',
                paddingTop: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                <div style={{
                  background: '#ffffff',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid #F9BED8',
                  minWidth: 0
                }}>
                  <div style={{ fontSize: '9px', color: '#78716c', marginBottom: '1px', whiteSpace: 'nowrap' }}>Fatura Tutarı</div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatMoney(amount)} {selectedCountry.symbol}
                  </div>
                </div>

                <div style={{
                  background: '#ffffff',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid #F9BED8',
                  minWidth: 0
                }}>
                  <div style={{ fontSize: '9px', color: '#78716c', marginBottom: '1px', whiteSpace: 'nowrap' }}>Faturadaki KDV</div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatMoney(rawVatAmount)} {selectedCountry.symbol}
                  </div>
                </div>

                <div style={{
                  background: '#ffffff',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid #F9BED8',
                  minWidth: 0
                }}>
                  <div style={{ fontSize: '9px', color: '#78716c', marginBottom: '1px', whiteSpace: 'nowrap' }}>Aracı Kurum Payı</div>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    color: agencyCommission > 0.01 ? '#dc2626' : '#16a34a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {agencyCommission > 0.01 ? `~${formatMoney(agencyCommission)}` : `0,00`} {selectedCountry.symbol}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontStyle: 'italic', padding: '0 4px' }}>
              * İade oranı Global Blue, Planet veya yerel aracı firmaların hizmet komisyonu düşüldükten sonraki tahmini net tutardır.
            </div>
          </div>
        )}
      </div>

      {/* 4. HAVALİMANINDA 4 ADIMDA VERGİ İADESİ NASIL ALINIR? */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '16px 16px 18px 16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#FDF2F8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Plane size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              Havalimanında 4 Adımda Vergi İadesi
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
              Havalimanı gümrüğünde paranızı geri alma rehberi
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          
          {/* Step 1 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#FDF2F8',
              color: '#D7147A',
              border: '1px solid #F9BED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '11px',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              1
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>
                  Mağazada: Tax-Free Formunu İsteyin
                </span>
                <ShoppingBag size={13} color="#D7147A" style={{ flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                Kasada pasaportunuzu gösterin ve Tax-Free formu talep edin. Fiş ve faturayı formla birlikte saklayın.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '11px',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              2
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>
                  Check-in / Bagaj Öncesi Gümrüğe Gidin
                </span>
                <Plane size={13} color="#2563eb" style={{ flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                Ürünler büyük bavuldaysa, bavulu teslim etmeden önce gümrük masasına (Customs / Dogana) uğrayın.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#fff1f2',
            border: '1px solid #ffe4e6'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#fecdd3',
              color: '#e11d48',
              border: '1px solid #fda4af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '11px',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              3
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#9f1239' }}>
                  Gümrük Damgası / Kiosk Barkod Onayı
                </span>
                <Stamp size={13} color="#e11d48" style={{ flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '10.5px', color: '#881337', marginTop: '2px', lineHeight: 1.4 }}>
                Forma mühür veya dijital onay (PABLO/DIVA) alınmalıdır. <strong>Damgasız formlara iade yapılmaz.</strong>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '11px',
              flexShrink: 0,
              marginTop: '1px'
            }}>
              4
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a' }}>
                  Paranızı Alın (Gişe veya Kredi Kartı)
                </span>
                <CreditCard size={13} color="#059669" style={{ flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                Damgalı formu Global Blue/Planet gişesine verip nakit alın ya da kredi kartı bilgisiyle posta kutusuna atın.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. TRAVELER FAQ & GOLDEN TIPS */}
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
              Sıkça Sorulan Sorular & Altın Kurallar
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map(item => {
            const isOpen = expandedFaq === item.id;
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
                  onClick={() => setExpandedFaq(isOpen ? null : item.id)}
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
                      {item.title}
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
                    {item.desc}
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
