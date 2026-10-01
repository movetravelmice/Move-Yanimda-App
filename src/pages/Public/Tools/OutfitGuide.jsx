import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
  Search,
  MapPin,
  LocateFixed,
  Loader2,
  X,
  Check,
  CheckSquare,
  Copy,
  Luggage,
  Layers,
  Compass,
  ArrowRight,
  ChevronRight,
  Info,
  Calendar,
  AlertCircle,
  Briefcase,
  Trees,
  Users,
  User,
  ShieldCheck,
  Umbrella,
  Eye,
  RefreshCw,
  Clock
} from 'lucide-react';
import CountryFlag from '../../../components/CountryFlag';

// Popüler Seyahat Destinasyonları
const POPULAR_DESTINATIONS = [
  { name: 'İstanbul', country: 'Türkiye', flag: '🇹🇷', lat: 41.0082, lon: 28.9784 },
  { name: 'Paris', country: 'Fransa', flag: '🇫🇷', lat: 48.8566, lon: 2.3522 },
  { name: 'Roma', country: 'İtalya', flag: '🇮🇹', lat: 41.9028, lon: 12.4964 },
  { name: 'Londra', country: 'Birleşik Krallık', flag: '🇬🇧', lat: 51.5074, lon: -0.1278 },
  { name: 'Barselona', country: 'İspanya', flag: '🇪🇸', lat: 41.3851, lon: 2.1734 },
  { name: 'Amsterdam', country: 'Hollanda', flag: '🇳🇱', lat: 52.3676, lon: 4.9041 },
  { name: 'Dubai', country: 'BAE', flag: '🇦🇪', lat: 25.2048, lon: 55.2708 },
  { name: 'Tokyo', country: 'Japonya', flag: '🇯🇵', lat: 35.6762, lon: 139.6503 },
  { name: 'New York', country: 'ABD', flag: '🇺🇸', lat: 40.7128, lon: -74.0060 },
  { name: 'Antalya', country: 'Türkiye', flag: '🇹🇷', lat: 36.8969, lon: 30.7133 },
  { name: 'Berlin', country: 'Almanya', flag: '🇩🇪', lat: 52.5200, lon: 13.4050 },
  { name: 'Kapadokya', country: 'Türkiye', flag: '🇹🇷', lat: 38.6431, lon: 34.8289 }
];

// Hava Durumu Görsel & Stil Tanımları
function getWeatherMeta(code, isDay) {
  // Dolu & Fırtına
  if ([66, 67, 87, 88].includes(code) || code === 96 || code === 99) {
    return {
      text: 'Dolu & Sert Fırtına',
      icon: CloudLightning,
      iconColor: '#D7147A',
      badge: '🧊 Dolu Uyarısı',
      badgeBg: 'rgba(255, 237, 213, 0.9)',
      badgeBorder: '#F9BED8',
      badgeColor: '#B01064',
      accentColor: '#D7147A',
      bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  if (code === 95) {
    return {
      text: 'Gök Gürültülü Fırtına',
      icon: CloudLightning,
      iconColor: '#fbbf24',
      badge: '⚡ Fırtına',
      badgeBg: 'rgba(254, 243, 199, 0.9)',
      badgeBorder: '#fde68a',
      badgeColor: '#92400e',
      accentColor: '#d97706',
      bgGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 60%, #3f3f46 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Kar
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      text: 'Kar Yağışlı',
      icon: CloudSnow,
      iconColor: '#38bdf8',
      badge: '❄️ Kar Yağışlı',
      badgeBg: 'rgba(224, 242, 254, 0.9)',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      accentColor: '#0284c7',
      bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #0284c7 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Sağanak & Yağmur
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return {
      text: 'Sağanak Yağmurlu',
      icon: CloudRain,
      iconColor: '#38bdf8',
      badge: '🌧️ Yağmurlu',
      badgeBg: 'rgba(224, 242, 254, 0.9)',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      accentColor: '#0284c7',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Çisenti
  if ([51, 53, 55].includes(code)) {
    return {
      text: 'Çisenti Yağışlı',
      icon: Droplets,
      iconColor: '#38bdf8',
      badge: '🌦️ Çisenti',
      badgeBg: 'rgba(224, 242, 254, 0.9)',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      accentColor: '#0284c7',
      bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Sisli
  if (code === 45 || code === 48) {
    return {
      text: 'Sisli & Puslu',
      icon: CloudFog,
      iconColor: '#94a3b8',
      badge: '🌫️ Sisli',
      badgeBg: 'rgba(241, 245, 249, 0.9)',
      badgeBorder: '#cbd5e1',
      badgeColor: '#475569',
      accentColor: '#64748b',
      bgGradient: 'linear-gradient(135deg, #334155 0%, #475569 60%, #64748b 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Kapalı / Çok Bulutlu
  if (code === 3) {
    return {
      text: 'Çok Bulutlu',
      icon: Cloud,
      iconColor: '#94a3b8',
      badge: '☁️ Bulutlu',
      badgeBg: 'rgba(241, 245, 249, 0.9)',
      badgeBorder: '#cbd5e1',
      badgeColor: '#475569',
      accentColor: '#64748b',
      bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Parçalı Bulutlu
  if (code === 1 || code === 2) {
    if (!isDay) {
      return {
        text: 'Parçalı Bulutlu',
        icon: CloudMoon,
        iconColor: '#a5b4fc',
        badge: '🌙 Bulutlu Gece',
        badgeBg: 'rgba(238, 242, 255, 0.2)',
        badgeBorder: 'rgba(255, 255, 255, 0.3)',
        badgeColor: '#ffffff',
        accentColor: '#818cf8',
        bgGradient: 'linear-gradient(135deg, #090d16 0%, #172554 60%, #1e3a8a 100%)',
        textColor: '#ffffff',
        isDark: true
      };
    }
    return {
      text: 'Parçalı Bulutlu',
      icon: CloudSun,
      iconColor: '#f59e0b',
      badge: '🌤️ Parçalı Bulutlu',
      badgeBg: 'rgba(255, 251, 235, 0.95)',
      badgeBorder: '#fde68a',
      badgeColor: '#92400e',
      accentColor: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 40%, #38bdf8 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Açık Gece
  if (!isDay) {
    return {
      text: 'Açık Gece',
      icon: Moon,
      iconColor: '#fde047',
      badge: '🌙 Açık Gece',
      badgeBg: 'rgba(255, 255, 255, 0.15)',
      badgeBorder: 'rgba(255, 255, 255, 0.3)',
      badgeColor: '#ffffff',
      accentColor: '#93c5fd',
      bgGradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
      textColor: '#ffffff',
      isDark: true
    };
  }
  // Açık & Güneşli Gündüz
  return {
    text: 'Açık & Güneşli',
    icon: Sun,
    iconColor: '#f59e0b',
    badge: '☀️ Güneşli',
    badgeBg: 'rgba(255, 251, 235, 0.95)',
    badgeBorder: '#fde68a',
    badgeColor: '#b45309',
    accentColor: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #60a5fa 100%)',
    textColor: '#ffffff',
    isDark: true
  };
}

// Akıllı & Kapsamlı Kıyafet Tavsiyesi Oluşturucu
function getDetailedOutfitAdvice(temp, code, profile = 'all', style = 'city') {
  const isHail = [66, 67, 87, 88].includes(code) || code === 96 || code === 99;
  const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
  const isStorm = code === 95;
  const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);

  let title = '';
  let badge = '';
  let summary = '';
  let highlight = '';
  let morningAdvice = '';
  let afternoonAdvice = '';
  let eveningAdvice = '';

  let topItems = [];
  let bottomItems = [];
  let shoeItems = [];
  let accessoryItems = [];

  // 1. Dondurucu Soğuk veya Kar
  if (temp <= 4 || isSnow) {
    title = 'Dondurucu Kış & Kar Havası';
    badge = '❄️ Kalın Katmanlar Şart';
    summary = 'Sıfıra yakın veya altındaki derecelerde 3 katman kuralı hayati önem taşır: Termal iç katman, yalıtımlı kazak ve rüzgar kesici kaban.';
    highlight = 'Katman Kuralı: 1. Nem atan içlik + 2. Yalıtım sağlayan yün/polar + 3. Rüzgar/su geçirmez kalın dış kaban.';
    morningAdvice = 'Sabah ayazı serttir; atkı, bere ve eldivenlerinizi takmadan dışarı çıkmayın.';
    afternoonAdvice = 'Öğlen güneş açsa bile rüzgar dondurucudur; montunuzun fermuarını kapalı tutun.';
    eveningAdvice = 'Gün batımıyla hissedilen sıcaklık 4-5° daha düşer; uzun süre dışarıda kalacaksanız termal katman şart.';

    topItems = [
      { name: 'Kaz Tüyü / Dolgulu Kalın Şişme Kaban', note: 'Rüzgarı ve soğuğu maksimum seviyede keser', tag: 'Şart' },
      { name: 'Yün / Kaşmir veya Polar Kalın Kazak', note: 'Vücut sıcaklığını içeride hapseder', tag: 'Önemli' },
      { name: 'Uzun Kollu Termal İçlik', note: 'Tene doğrudan temas eden nem transfer katmanı', tag: 'Şart' }
    ];

    bottomItems = [
      { name: 'Termal İçlik Tayt (Pantolon Altına)', note: 'Bacakları dondurucu rüzgardan korur', tag: 'Şart' },
      { name: 'Kalın Dokulu Kışlık Pantolon / Kadife', note: 'Soğuk havayı geçirmeyen sık dokuma', tag: 'Önemli' }
    ];

    shoeItems = [
      { name: 'Kaymaz Tabanlı Su Geçirmez Kış Botu', note: 'Buzlu ve karlı zeminlerde tutuş sağlar', tag: 'Şart' },
      { name: '2 Çift Yün / Termal Çorap', note: 'Ayakları daima kuru ve sıcak tutar', tag: 'Önemli' }
    ];

    accessoryItems = [
      { name: 'Polar / Yün Bere & Kalın Atkı', note: 'Vücut ısısının %40ı baş ve boyundan kaybedilir', tag: 'Şart' },
      { name: 'Dokunmatik Ekran Uyumlu Sıcak Eldiven', note: 'Telefon kullanırken ellerinizi üşütmez', tag: 'Önemli' },
      { name: 'Nemlendirici Dudak & El Kremi', note: 'Soğuk rüzgarda çatlamaları önler', tag: 'Tavsiye' }
    ];
  }
  // 2. Yağışlı & Islak Hava (Herhangi bir sıcaklıkta yağmur varsa)
  else if (isRaining || isHail || isStorm) {
    title = 'Yağışlı & Islak Hava';
    badge = '🌧️ Su Geçirmez Parçalar';
    summary = 'Aralıklı veya sürekli yağış bekleniyor. Su geçirmez nefes alabilir dış katman, sağlam kompakt şemsiye ve su almayan ayakkabı gününüzü kurtarır.';
    highlight = 'Kapalı mekan ve müze ziyaretlerinizi yağmurun yoğun olduğu saatlere denk getirin.';
    morningAdvice = 'Sabah zeminler ıslak ve kaygan olabilir; su tutmayan ayakkabıyla yola çıkın.';
    afternoonAdvice = 'Aralarda yağmur durursa şemsiyenizi kurutun veya su geçirmez kılıfına koyun.';
    eveningAdvice = 'Akşam nem oranı yükseleceğinden hava olduğundan 2-3° daha soğuk hissedilir.';

    topItems = [
      { name: 'Su Geçirmez Trençkot veya Yağmurluk', note: 'Hafif, nefes alabilir ve rüzgara dayanıklı', tag: 'Şart' },
      { name: 'İnce Triko Kazak veya Sweatshirt', note: 'Gerektiğinde çıkarabileceğiniz ara katman', tag: 'Önemli' },
      { name: 'Pamuklu Nefes Alan Tişört', note: 'Kapalı mekanlarda terlemeyi önler', tag: 'Tavsiye' }
    ];

    bottomItems = [
      { name: 'Su İtici Chino / Rahat Kot Pantolon', note: 'Paçaların ıslanıp ağırlaşmasını engeller', tag: 'Önemli' },
      { name: 'Yedek Pantolon (Bavul İçin)', note: 'Islanma riskine karşı acil yedek', tag: 'Tavsiye' }
    ];

    shoeItems = [
      { name: 'Su Geçirmez Rahat Yürüyüş Ayakkabısı', note: 'Gore-Tex veya su itici kaplamalı modeller', tag: 'Şart' },
      { name: '2 Çift Yedek Pamuklu Çorap', note: 'Ayaklar ıslanırsa gününüz bozulmasın', tag: 'Önemli' }
    ];

    accessoryItems = [
      { name: 'Kompakt Fırtınaya Dayanıklı Şemsiye', note: 'Rüzgarda ters dönmeyen telli tasarım', tag: 'Şart' },
      { name: 'Sırt Çantası Yağmur Kılıfı', note: 'Pasaport ve elektronik eşyalarınızı korur', tag: 'Önemli' },
      { name: 'Hafif Şal veya Fular', note: 'Rüzgarlı yağmurda boyun bölgesini korur', tag: 'Tavsiye' }
    ];
  }
  // 3. Soğuk & Serin (5°C - 13°C)
  else if (temp <= 13) {
    title = 'Serin & Rüzgarlı Sonbahar Havası';
    badge = '🧥 Ceket & Katman';
    summary = 'Hafif yün kaban, şişme yelek veya mevsimlik mont idealdir. Gün boyu yürüyüş yaparken vücut sıcaklığınızı dengeleyecek fermuarlı ara katmanlar seçin.';
    highlight = 'Hırka veya fermuarlı ceket seçin; metro ve müze gibi sıcak iç mekanlarda kolayca çıkarabilirsiniz.';
    morningAdvice = 'Güne serin bir havada başlayacaksınız; montunuzu mutlaka yanınıza alın.';
    afternoonAdvice = 'Yürüyüş temposu arttıkça ısınabilirsiniz; fermuarı açıp havalanabilirsiniz.';
    eveningAdvice = 'Rüzgar çıktığında üşümemek için boynunuza hafif bir atkı sarın.';

    topItems = [
      { name: 'Mevsimlik Yün Kaban veya Bomber Mont', note: 'Hafif ama rüzgara karşı koruyucu dış katman', tag: 'Şart' },
      { name: 'Orta Kalınlıkta Triko / Sweatshirt', note: 'İçinizi sıcak tutacak şık katman', tag: 'Önemli' },
      { name: 'Pamuklu Uzun Kollu Tişört / Gömlek', note: 'Nefes alan birinci katman', tag: 'Tavsiye' }
    ];

    bottomItems = [
      { name: 'Klasik Jean veya Kadife Pantolon', note: 'Gün boyu rahat adım atmanızı sağlar', tag: 'Önemli' },
      { name: 'Esnek Kumaş Kargo / Chino', note: 'Cepli tasarımı pasaport ve bilet için pratik', tag: 'Tavsiye' }
    ];

    shoeItems = [
      { name: 'Deri / Nubuk Sneaker veya Hafif Bot', note: 'Zeminden gelen serinliği keser', tag: 'Şart' },
      { name: 'Kaliteli Pamuklu Spor Çorap', note: 'Ayak terlemesini önler', tag: 'Önemli' }
    ];

    accessoryItems = [
      { name: 'İnce Kaşmir Şal / Fular', note: 'Hafiftir, çantada yer kaplamaz', tag: 'Önemli' },
      { name: 'Güneş Gözlüğü', note: 'Alçak açılı sonbahar güneşine karşı', tag: 'Tavsiye' }
    ];
  }
  // 4. Ilık & Mevsimlik (14°C - 21°C)
  else if (temp <= 21) {
    title = 'İdeal Gezi & Bahar Havası';
    badge = '🌤️ Mükemmel Gezi Havası';
    summary = 'Yürüyüş ve şehir keşfi için en konforlu sıcaklık aralığı. Kot ceket, hafif hırka veya deri mont gibi hafif katmanlarla kombin yapın.';
    highlight = 'Sabah-öğle sıcaklık farkı 6-8°C olabilir. Çantanızda hafif bir katman bulundurun.';
    morningAdvice = 'Sabah saatleri hafif serin; üzerinize kot ceket veya hırka alın.';
    afternoonAdvice = 'Öğlen güneşle birlikte hava ılıklaşacak; tişörtle gezebilirsiniz.';
    eveningAdvice = 'Güneş batınca hafif serinlik başlar; ceketinizi giymeyi unutmayın.';

    topItems = [
      { name: 'Kot Ceket, Blazer veya Hafif Bomber', note: 'Hem fotoğraflarda şık hem de pratik koruma', tag: 'Şart' },
      { name: 'Nefes Alan Pamuklu Tişört & Gömlek', note: 'Günün büyük bölümünde ana katmanınız', tag: 'Önemli' },
      { name: 'Hafif Triko Hırka / Fermuarlı Sweat', note: 'Omuzlara atılabilir şık ara katman', tag: 'Tavsiye' }
    ];

    bottomItems = [
      { name: 'Rahat Kesim Jean veya Chino Pantolon', note: '15-20 bin adım yürüyüşte sürtünmeyi önler', tag: 'Şart' },
      { name: 'Keten / Likralı Esnek Pantolon', note: 'Hafif ve havadar alternatif', tag: 'Tavsiye' }
    ];

    shoeItems = [
      { name: 'Ortopedik Rahat Şehir Sneakerı', note: 'Taş sokaklarda ayak tabanını destekler', tag: 'Şart' },
      { name: 'Nefes Alan Kısa Spor Çorap', note: 'Gün boyu tazelik sağlar', tag: 'Önemli' }
    ];

    accessoryItems = [
      { name: 'UV Korumalı Güneş Gözlüğü', note: 'Açık havada gözleri dinlendirir', tag: 'Önemli' },
      { name: 'Hafif Şehir Sırt Çantası / Çapraz Çanta', note: 'Ceketinizi koyabileceğiniz hacimde', tag: 'Önemli' },
      { name: 'Taşınabilir Güç Kaynağı (Powerbank)', note: 'Harita ve fotoğraflar için şart', tag: 'Tavsiye' }
    ];
  }
  // 5. Sıcak & Yaz (22°C - 28°C)
  else if (temp <= 28) {
    title = 'Ilık & Güneşli Yaz Havası';
    badge = '☀️ Hafif & Ferah';
    summary = 'Keten gömlekler, ince pamuklu tişörtler ve şortlar için harika bir hava. Güneş koruması ve bol su tüketimi gezinizin konforunu artırır.';
    highlight = 'Güneş kreminizi dışarı çıkmadan 20 dakika önce uygulayın ve 3 saatte bir tazeleyin.';
    morningAdvice = 'Erken saatlerde hava tazedir; yürüyüş turlarını sabah saatlerine planlayın.';
    afternoonAdvice = 'Öğlen güneşi etkilidir; gölge sokakları ve klimalı müzeleri tercih edin.';
    eveningAdvice = 'Akşam esintisi çok keyiflidir; tek kat tişört veya açık gömlekle gezebilirsiniz.';

    topItems = [
      { name: 'Keten veya %100 Pamuklu Gömlek', note: 'Terletmeyen, hava alan ve şık kumaş', tag: 'Şart' },
      { name: 'Hafif Kısa Kollu Tişörtler', note: 'Bavula her gün için 1 adet ekleyin', tag: 'Önemli' },
      { name: 'Akşam İçin Çok İnce Hırka / Gömlek', note: 'Deniz kenarı veya klimalı mekanlar için', tag: 'Tavsiye' }
    ];

    bottomItems = [
      { name: 'Bermuda Şort veya İnce Keten Pantolon', note: 'Maksimum hareket serbestliği', tag: 'Şart' },
      { name: 'Hafif Dökümlü Etek veya Şort', note: 'Sıcakta ferah ve konforlu', tag: 'Tavsiye' }
    ];

    shoeItems = [
      { name: 'Hafif Fileli Nefes Alan Sneaker', note: 'Ayakların hava almasını sağlar', tag: 'Şart' },
      { name: 'Rahat Deri Sandalet / Terlik', note: 'Akşam yürüyüşleri ve sahil için', tag: 'Tavsiye' }
    ];

    accessoryItems = [
      { name: 'Geniş Siperlikli Şapka / Kasket', note: 'Yüzü ve ense bölgesini güneşten korur', tag: 'Şart' },
      { name: 'SPF 50+ Güneş Koruyucu Krem', note: 'Güneş yanıklarını önler', tag: 'Şart' },
      { name: 'Tekrar Doldurulabilir Su Matarası', note: 'Dehidrasyonu önler', tag: 'Önemli' }
    ];
  }
  // 6. Yüksek Sıcaklık (> 28°C)
  else {
    title = 'Yüksek Sıcaklık & Aşırı Güneş';
    badge = '🔥 Sıcak Hava Uyarısı';
    summary = 'Güneş ışınlarının en dik geldiği saatlerde açık renkli, ultra hafif keten giysiler giyin. Bol su için ve güneş gözlüğünüzü unutmayın.';
    highlight = '12:00 - 15:00 saatleri arasında doğrudan güneş altında uzun süre kalmamaya özen gösterin.';
    morningAdvice = 'Açık hava aktivitelerini ve fotoğraf çekimlerini 11:00den önce tamamlayın.';
    afternoonAdvice = 'Klimalı AVM, müze veya dinlenme kafelerine sığının; bol sıvı tüketin.';
    eveningAdvice = 'Hava ancak 20:00den sonra rahatlar; gece yürüyüşleri için en güzel zamandır.';

    topItems = [
      { name: 'Açık Renkli Keten Gömlek / Askılı Üst', note: 'Güneş ışığını yansıtan açık tonlar', tag: 'Şart' },
      { name: 'Ultra İnce Nem Transferli Tişört', note: 'Hızlı kuruyan kumaş yapısı', tag: 'Önemli' }
    ];

    bottomItems = [
      { name: 'Hafif Şort veya İnce Keten Pantolon', note: 'Bacakları terletmeyen dökümlü yapı', tag: 'Şart' }
    ];

    shoeItems = [
      { name: 'Maksimum Hava Kanallı Yazlık Sneaker', note: 'Yürüyüş tabanlı konfor', tag: 'Şart' },
      { name: 'Ortopedik Yürüyüş Sandaleti', note: 'Sıcak havalarda en ferah seçenek', tag: 'Tavsiye' }
    ];

    accessoryItems = [
      { name: 'UV400 Polarize Güneş Gözlüğü', note: 'Parlama ve göz yorulmasını engeller', tag: 'Şart' },
      { name: 'SPF 50+ Güneş Koruyucu & Dudak Balmı', note: 'Güneş altında cilt sağlığı', tag: 'Şart' },
      { name: 'Yelpaze veya Taşınabilir Mini Fan', note: 'Toplu taşımada ve kuyruklarda kurtarıcı', tag: 'Tavsiye' }
    ];
  }

  // Profil (Cinsiyet / Kullanıcı Tipi) İnce Ayarı
  if (profile === 'women') {
    topItems.push({ name: 'Midi/Maxi Elbise veya Kimono', note: 'Tek parçada şıklık ve ferahlık', tag: 'Tavsiye' });
    accessoryItems.push({ name: 'Hafif İpek / Pamuklu Omuz Şalı', note: 'Tarihi ve dini mekan ziyaretlerinde kurtarıcı', tag: 'Önemli' });
  } else if (profile === 'men') {
    topItems.push({ name: 'Polo Yaka Tişört veya Spor Gömlek', note: 'Gündüzden akşama geçişte şık durur', tag: 'Tavsiye' });
  }

  // Seyahat Tarzı İnce Ayarı
  if (style === 'business') {
    topItems.unshift({ name: 'Kırışmayan Spor Blazer Ceket', note: 'Toplantılar ve şık akşam yemekleri için', tag: 'Şart' });
    bottomItems.unshift({ name: 'Ütü Tutmayan Kumaş / Chino Pantolon', note: 'Resmi ve şık görünüm', tag: 'Şart' });
    shoeItems.unshift({ name: 'Şık Deri Loafer / Oxford Ayakkabı', note: 'İş ortamına uygun konforlu ayakkabı', tag: 'Şart' });
  } else if (style === 'nature') {
    topItems.unshift({ name: 'Nefes Alan Termal / Rüzgarlık Ceket', note: 'Ani dağ ve doğa hava değişimlerine karşı', tag: 'Şart' });
    bottomItems.unshift({ name: 'Yırtılmaz Kumaş (Ripstop) Kargo Pantolon', note: 'Diken ve kayalara dayanıklı', tag: 'Şart' });
    shoeItems.unshift({ name: 'Bileği Destekleyen Trekking Ayakkabısı', note: 'Engebeli patikalarda burkulmayı önler', tag: 'Şart' });
  }

  return {
    title,
    badge,
    summary,
    highlight,
    morningAdvice,
    afternoonAdvice,
    eveningAdvice,
    categories: [
      { category: 'Dış & Üst Giyim', icon: '🧥', items: topItems },
      { category: 'Alt Giyim', icon: '👖', items: bottomItems },
      { category: 'Ayakkabı & Çorap', icon: '👟', items: shoeItems },
      { category: 'Aksesuar & Koruma', icon: '🎒', items: accessoryItems }
    ]
  };
}

export default function OutfitGuide({ isEmbedded = false, initialCity = '' }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Şehir seçimi: Parametre veya Varsayılan
  const cityParam = initialCity || searchParams.get('city');
  const defaultCity = POPULAR_DESTINATIONS.find(c => c.name.toLowerCase() === cityParam?.toLowerCase()) || 
    (cityParam ? { name: cityParam, country: '', flag: '📍', lat: 41.0082, lon: 28.9784 } : POPULAR_DESTINATIONS[0]);

  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Filtreler: Profil & Seyahat Tarzı
  const [profile, setProfile] = useState('all'); // all, women, men
  const [travelStyle, setTravelStyle] = useState('city'); // city, business, nature

  // Canlı Hava Durumu Durumu
  const [weatherData, setWeatherData] = useState(null);
  const [forecastDays, setForecastDays] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const dropdownRef = useRef(null);

  // URL parametresi değişince şehir güncelle
  useEffect(() => {
    if (cityParam && cityParam !== selectedCity.name) {
      const match = POPULAR_DESTINATIONS.find(c => c.name.toLowerCase() === cityParam.toLowerCase());
      if (match) {
        setSelectedCity(match);
      } else {
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityParam)}&count=1&language=tr&format=json`)
          .then(res => res.json())
          .then(data => {
            if (data?.results?.[0]) {
              const r = data.results[0];
              setSelectedCity({
                name: r.name,
                country: r.country || '',
                flag: '📍',
                lat: r.latitude,
                lon: r.longitude
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [cityParam]);

  // Canlı hava verisi ve 3 günlük tahmin çek
  useEffect(() => {
    let isMounted = true;
    async function fetchWeather() {
      if (!selectedCity?.lat || !selectedCity?.lon) return;
      setLoadingWeather(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data?.current) {
          setWeatherData({
            temp: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: data.current.relative_humidity_2m,
            wind: Math.round(data.current.wind_speed_10m),
            code: data.current.weather_code,
            isDay: Boolean(data.current.is_day),
            tempMax: data.daily?.temperature_2m_max?.[0] ? Math.round(data.daily.temperature_2m_max[0]) : null,
            tempMin: data.daily?.temperature_2m_min?.[0] ? Math.round(data.daily.temperature_2m_min[0]) : null
          });

          // 3 Günlük Tahmin
          if (data.daily?.time) {
            const days = [];
            for (let i = 0; i < Math.min(3, data.daily.time.length); i++) {
              const dateStr = data.daily.time[i];
              const dateObj = new Date(dateStr);
              const dayName = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });
              days.push({
                dayName,
                dateStr,
                code: data.daily.weather_code[i],
                tempMax: Math.round(data.daily.temperature_2m_max[i]),
                tempMin: Math.round(data.daily.temperature_2m_min[i])
              });
            }
            setForecastDays(days);
          }
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      } finally {
        if (isMounted) setLoadingWeather(false);
      }
    }

    fetchWeather();
    return () => { isMounted = false; };
  }, [selectedCity]);

  // Arama debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setGeoResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const q = searchQuery.toLowerCase().trim();
      const localMatches = POPULAR_DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(q) || (d.country && d.country.toLowerCase().includes(q))
      );

      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=tr&format=json`);
        const data = await res.json();
        if (data?.results && data.results.length > 0) {
          const apiResults = data.results.map(item => ({
            name: item.name,
            country: item.country || item.admin1 || '',
            flag: '📍',
            lat: item.latitude,
            lon: item.longitude,
            id: item.id
          }));
          const existingNames = new Set(localMatches.map(m => m.name.toLowerCase()));
          const uniqueApi = apiResults.filter(a => !existingNames.has(a.name.toLowerCase()));
          setGeoResults([...localMatches, ...uniqueApi]);
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

  // Dışa tıklayınca dropdown kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setSearchQuery('');
    setShowDropdown(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'outfit');
    newParams.set('city', city.name);
    setSearchParams(newParams);
  };

  // GPS ile Konum Tespiti
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`);
          const data = await res.json();
          const cityName = data.locality || data.city || data.principalSubdivision || 'Bulunduğum Konum';
          const countryName = data.countryName || 'Türkiye';
          handleSelectCity({
            name: cityName,
            country: countryName,
            flag: '📍',
            lat: latitude,
            lon: longitude
          });
        } catch {
          handleSelectCity({
            name: 'Bulunduğum Konum',
            country: '',
            flag: '📍',
            lat: latitude,
            lon: longitude
          });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert('Konum bilgisi alınamadı. Lütfen listeden veya arama çubuğundan şehrinizi seçin.');
      },
      { timeout: 8000 }
    );
  };

  // Checklist elemanı işaretle/kaldır
  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentTemp = weatherData?.temp ?? 20;
  const currentCode = weatherData?.code ?? 1;
  const isDay = weatherData?.isDay ?? (new Date().getHours() >= 6 && new Date().getHours() < 20);
  const weatherMeta = getWeatherMeta(currentCode, isDay);
  const WeatherIcon = weatherMeta.icon;
  const outfitAdvice = useMemo(
    () => getDetailedOutfitAdvice(currentTemp, currentCode, profile, travelStyle),
    [currentTemp, currentCode, profile, travelStyle]
  );

  // Bavul Tamamlanma Yüzdesi
  const allItems = outfitAdvice.categories.flatMap((cat, catIdx) =>
    cat.items.map((it, itIdx) => ({ id: `${catIdx}-${itIdx}`, ...it }))
  );
  const totalItemCount = allItems.length;
  const checkedCount = allItems.filter(it => checkedItems[it.id]).length;
  const completionPercentage = totalItemCount > 0 ? Math.round((checkedCount / totalItemCount) * 100) : 0;

  // Tümünü Seç / Temizle
  const handleToggleAll = () => {
    if (checkedCount === totalItemCount) {
      setCheckedItems({});
    } else {
      const next = {};
      allItems.forEach(it => { next[it.id] = true; });
      setCheckedItems(next);
    }
  };

  // Listeyi Kopyala
  const handleCopyList = () => {
    const lines = [
      `🎒 ${selectedCity.name} Bavul & Kıyafet Rehberi (${currentTemp}°C - ${weatherMeta.text})`,
      `Özet Tavsiye: ${outfitAdvice.summary}`,
      `💡 Seyahat İpucu: ${outfitAdvice.highlight}`,
      '',
      `🌅 Sabah: ${outfitAdvice.morningAdvice}`,
      `☀️ Öğle: ${outfitAdvice.afternoonAdvice}`,
      `🌙 Akşam: ${outfitAdvice.eveningAdvice}`,
      '',
      '--- KONTROL LİSTESİ ---'
    ];
    outfitAdvice.categories.forEach(cat => {
      lines.push(`\n${cat.icon} ${cat.category}:`);
      cat.items.forEach(it => {
        lines.push(`  [ ] ${it.name} - ${it.note}`);
      });
    });
    lines.push('\nMove Travel Seyahat Asistanı');

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2200);
    });
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ========================================================
          1. ŞEHİR SEÇİCİ & ARAMA BÖLÜMÜ (KOMPAKT & ERGONOMİK)
      ======================================================== */}
      <div 
        ref={dropdownRef}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.2px solid #e2e8f0',
          padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
          position: 'relative'
        }}
      >
        {/* Üst Başlık & Konum Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#FDF2F8',
              color: '#D7147A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(215, 20, 122, 0.08)'
            }}>
              <Compass size={14} />
            </div>
            <div>
              <h2 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Gideceğiniz Şehri Seçin
              </h2>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                Canlı hava durumu & akıllı bavul rehberi
              </div>
            </div>
          </div>

          {/* Konumumu Bul Butonu */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '9.5px',
              fontWeight: '700',
              color: '#1e293b',
              cursor: isLocating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isLocating ? (
              <Loader2 size={11} color="#D7147A" className="animate-spin" />
            ) : (
              <LocateFixed size={11} color="#D7147A" strokeWidth={2.4} />
            )}
            <span>{isLocating ? 'Konum Alınıyor...' : 'Konumumu Bul'}</span>
          </button>
        </div>

        {/* Arama Giriş Alanı */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            borderRadius: '10px',
            border: showDropdown ? '1.5px solid #D7147A' : '1px solid #cbd5e1',
            padding: '6px 10px',
            transition: 'all 0.15s ease'
          }}>
            {isSearching ? (
              <Loader2 size={14} color="#D7147A" className="animate-spin" style={{ marginRight: '6px', flexShrink: 0 }} />
            ) : (
              <Search size={14} color="#94a3b8" style={{ marginRight: '6px', flexShrink: 0 }} />
            )}

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Şehir veya ülke arayın (Örn: Paris, Roma, Tokyo)..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                minWidth: 0,
                fontSize: '11px',
                fontWeight: '600',
                color: '#0f172a'
              }}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setGeoResults([]);
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
                <X size={13} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Listesi */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 24px -4px rgba(15, 23, 42, 0.15)',
              zIndex: 100,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {(geoResults.length > 0 ? geoResults : POPULAR_DESTINATIONS.slice(0, 8)).map((c, i) => (
                <div
                  key={c.id || i}
                  onClick={() => handleSelectCity(c)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FDF2F8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CountryFlag country={c.country || c.name} size="sm" />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                      {c.name}
                    </span>
                    {c.country && (
                      <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                        ({c.country})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#D7147A', fontWeight: '700' }}>
                    Seç →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. CANLI HAVA DURUMU & ATMOSFER KARTI (HERO CARD)
      ======================================================== */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: weatherMeta.bgGradient,
        color: '#ffffff',
        padding: '14px 16px',
        boxShadow: '0 4px 18px -2px rgba(15, 23, 42, 0.12)',
        transition: 'all 0.3s ease'
      }}>
        {/* Arka Plan Efekti */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          filter: 'blur(28px)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Üst Çubuk: Şehir */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CountryFlag country={selectedCity.country || selectedCity.name} size="sm" />
              <span style={{ fontSize: '13.5px', fontWeight: '800', letterSpacing: '-0.2px' }}>
                {selectedCity.name}
              </span>
              {selectedCity.country && (
                <span style={{ fontSize: '10px', opacity: 0.85, fontWeight: '600' }}>
                  ({selectedCity.country})
                </span>
              )}
            </div>
          </div>

          {/* Orta Kısım: Derece & İkon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  letterSpacing: '-1px',
                  lineHeight: 1
                }}>
                  {currentTemp}°C
                </span>
                {weatherData?.feelsLike !== undefined && (
                  <span style={{ fontSize: '10.5px', opacity: 0.9, fontWeight: '700' }}>
                    Hissedilen {weatherData.feelsLike}°
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: 0.95
              }}>
                <span>{weatherMeta.text}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ fontSize: '10px', opacity: 0.9 }}>
                  Y: {weatherData?.tempMax ?? currentTemp + 2}° / D: {weatherData?.tempMin ?? currentTemp - 3}°
                </span>
              </div>
            </div>

            {/* İkon Rozeti */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              flexShrink: 0
            }}>
              <WeatherIcon size={26} color="#ffffff" strokeWidth={2.2} />
            </div>
          </div>

          {/* Alt Mikro İstatistikler */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '5px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '8px', opacity: 0.8, fontWeight: '700' }}>NEM</div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', marginTop: '1px' }}>
                %{weatherData?.humidity ?? 65}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '5px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '8px', opacity: 0.8, fontWeight: '700' }}>RÜZGAR</div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', marginTop: '1px' }}>
                {weatherData?.wind ?? 14} km/s
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '5px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '8px', opacity: 0.8, fontWeight: '700' }}>HİSSEDİLEN</div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', marginTop: '1px' }}>
                {weatherData?.feelsLike ?? currentTemp}°C
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '5px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '8px', opacity: 0.8, fontWeight: '700' }}>DURUM</div>
              <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '1px' }}>
                {currentTemp >= 23 ? 'Ilık / Yaz' : currentTemp >= 14 ? 'Mevsimlik' : 'Serin / Soğuk'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. KİŞİSELLEŞTİRME: PROFİL & SEYAHAT TARZI
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.2px solid #e2e8f0',
        padding: '12px 14px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}>
        {/* Kıyafet Profili Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>👤</span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
              Kıyafet Profili
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>
            Kombin ve bavul önerilerini kişiselleştirin
          </span>
        </div>

        {/* 3 Sütunlu Profil Kartları (Tümü, Kadın, Erkek) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px',
          background: '#f1f5f9',
          padding: '3px',
          borderRadius: '11px',
          marginBottom: '12px'
        }}>
          {[
            { id: 'all', label: 'Tümü / Unisex', desc: 'Genel Seyahat', icon: Users, activeBg: '#ffffff', activeColor: '#0f172a', activeBorder: '#cbd5e1' },
            { id: 'women', label: 'Kadın', desc: 'Kadın Kombinleri', icon: User, activeBg: '#fff1f2', activeColor: '#e11d48', activeBorder: '#fecdd3' },
            { id: 'men', label: 'Erkek', desc: 'Erkek Kombinleri', icon: User, activeBg: '#f0f9ff', activeColor: '#0284c7', activeBorder: '#bae6fd' }
          ].map(tab => {
            const active = profile === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProfile(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '7px 2px',
                  borderRadius: '9px',
                  border: active ? `1.2px solid ${tab.activeBorder}` : '1px solid transparent',
                  background: active ? tab.activeBg : 'transparent',
                  color: active ? tab.activeColor : '#64748b',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: active ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                  <IconComp size={11.5} color={active ? tab.activeColor : '#64748b'} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', fontWeight: active ? '800' : '700', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                    {tab.label}
                  </span>
                </div>
                <span style={{ fontSize: '8px', color: active ? tab.activeColor : '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seyahat Tarzı Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>🧭</span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
              Seyahat Tarzı
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>
            Öneriler konseptinize göre uyarlanır
          </span>
        </div>

        {/* 3 Sütunlu Seyahat Tarzı Kartları */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px',
          background: '#f1f5f9',
          padding: '3px',
          borderRadius: '11px'
        }}>
          {[
            { id: 'city', label: 'Şehir & Gezi', desc: 'Rahat & Günlük', icon: Compass },
            { id: 'business', label: 'İş & Toplantı', desc: 'Şık & Resmi', icon: Briefcase },
            { id: 'nature', label: 'Doğa & Macera', desc: 'Dayanıklı & Spor', icon: Trees }
          ].map(tab => {
            const active = travelStyle === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTravelStyle(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '7px 2px',
                  borderRadius: '9px',
                  border: active ? '1.2px solid #F9BED8' : '1px solid transparent',
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? '#D7147A' : '#64748b',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: active ? '0 2px 6px rgba(215, 20, 122, 0.12)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                  <IconComp size={11.5} color={active ? '#D7147A' : '#64748b'} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', fontWeight: active ? '800' : '700', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                    {tab.label}
                  </span>
                </div>
                <span style={{ fontSize: '8px', color: active ? '#B01064' : '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          4. GÜNÜN SAATLERİNE GÖRE KATMAN TAVSİYELERİ
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.2px solid #e2e8f0',
        padding: '12px 14px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '7px',
            background: '#FDF2F8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={13} />
          </div>
          <div>
            <h3 style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Günün Saatlerine Göre Katman Rehberi
            </h3>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
              Sabah, öğle ve akşam için katmanlı giyim tavsiyeleri
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {/* Sabah */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '11px',
            padding: '8px 12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>Sabah</span>
              <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: '600' }}>• Gün başlangıcı & serin hava</span>
            </div>
            <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.35 }}>
              {outfitAdvice.morningAdvice}
            </div>
          </div>

          {/* Öğle */}
          <div style={{
            background: '#fff5f9',
            borderRadius: '11px',
            padding: '8px 12px',
            border: '1px solid #F9BED8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#8E0C51' }}>Öğle</span>
              <span style={{ fontSize: '8.5px', color: '#D7147A', fontWeight: '600' }}>• Günün en ılık & güneşli zamanı</span>
            </div>
            <div style={{ fontSize: '9.5px', color: '#7c2d12', lineHeight: 1.35 }}>
              {outfitAdvice.afternoonAdvice}
            </div>
          </div>

          {/* Akşam */}
          <div style={{
            background: '#f0f9ff',
            borderRadius: '11px',
            padding: '8px 12px',
            border: '1px solid #bae6fd'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0369a1' }}>Akşam</span>
              <span style={{ fontSize: '8.5px', color: '#0284c7', fontWeight: '600' }}>• Gün batımı & esinti / serinlik</span>
            </div>
            <div style={{ fontSize: '9.5px', color: '#0c4a6e', lineHeight: 1.35 }}>
              {outfitAdvice.eveningAdvice}
            </div>
          </div>
        </div>

        {/* Seyahat İpucu Kutusu */}
        <div style={{
          marginTop: '10px',
          background: '#fff5f9',
          border: '1px solid #F9BED8',
          borderRadius: '10px',
          padding: '7px 10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px'
        }}>
          <Sparkles size={13} color="#D7147A" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '9.5px', color: '#8E0C51', lineHeight: 1.3 }}>
            <strong style={{ fontWeight: '800' }}>Uzman Seyahat İpucu: </strong>
            {outfitAdvice.highlight}
          </div>
        </div>
      </div>

      {/* ========================================================
          5. BAVUL & KIYAFET KONTROL LİSTESİ (İNTERAKTİF CHECKLIST)
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.2px solid #e2e8f0',
        padding: '12px 14px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}>
        {/* Başlık ve Eylemler */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Luggage size={13} />
            </div>
            <div>
              <h3 style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Ne Giymeli & Bavula Ne Koymalı?
              </h3>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                Hava şartlarına göre filtrelenmiş paket listesi
              </div>
            </div>
          </div>

          {/* Sağ Eylemler: Kopyala & Tümünü Seç */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={handleToggleAll}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 7px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              {checkedCount === totalItemCount ? 'Sıfırla' : 'Tümünü Seç'}
            </button>

            <button
              type="button"
              onClick={handleCopyList}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: copySuccess ? '#f0fdf4' : '#f8fafc',
                border: copySuccess ? '1px solid #86efac' : '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 7px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: copySuccess ? '#16a34a' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copySuccess ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
              <span>{copySuccess ? 'Kopyalandı!' : 'Listeyi Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* İlerleme Çubuğu (Bavul Hazırlığı) */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '10px',
          padding: '8px 10px',
          border: '1px solid #e2e8f0',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', fontSize: '9.5px' }}>
            <span style={{ fontWeight: '800', color: '#0f172a' }}>
              Bavul Hazırlık Durumu
            </span>
            <span style={{ fontWeight: '800', color: completionPercentage === 100 ? '#16a34a' : '#D7147A' }}>
              {checkedCount} / {totalItemCount} Parça Hazır (%{completionPercentage})
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '5px',
            background: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              background: completionPercentage === 100 
                ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                : 'linear-gradient(90deg, #D7147A, #B01064)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Kategoriler ve Maddeler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {outfitAdvice.categories.map((cat, catIdx) => (
            <div
              key={catIdx}
              style={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                overflow: 'hidden'
              }}
            >
              {/* Kategori Başlığı */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px' }}>{cat.icon}</span>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>
                    {cat.category}
                  </span>
                </div>
                <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: '700' }}>
                  {cat.items.length} Öneri
                </span>
              </div>

              {/* Madde Listesi */}
              <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {cat.items.map((item, itemIdx) => {
                  const itemId = `${catIdx}-${itemIdx}`;
                  const isChecked = checkedItems[itemId];
                  return (
                    <div
                      key={itemIdx}
                      onClick={() => toggleCheck(itemId)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: isChecked ? '#f0fdf4' : '#ffffff',
                        border: isChecked ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '5px',
                        background: isChecked ? '#16a34a' : '#ffffff',
                        border: isChecked ? '1px solid #16a34a' : '1.5px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1px',
                        flexShrink: 0
                      }}>
                        {isChecked && <Check size={10} color="#ffffff" strokeWidth={3} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '800',
                            color: isChecked ? '#15803d' : '#0f172a',
                            textDecoration: isChecked ? 'line-through' : 'none'
                          }}>
                            {item.name}
                          </span>
                          {item.tag && (
                            <span style={{
                              fontSize: '8px',
                              fontWeight: '800',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              background: item.tag === 'Şart' ? '#fee2e2' : item.tag === 'Önemli' ? '#FCE7F3' : '#f1f5f9',
                              color: item.tag === 'Şart' ? '#b91c1c' : item.tag === 'Önemli' ? '#B01064' : '#475569'
                            }}>
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '9px',
                          color: isChecked ? '#16a34a' : '#64748b',
                          marginTop: '1px',
                          lineHeight: 1.25
                        }}>
                          {item.note}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          6. 3 GÜNLÜK HAVA & BAVUL ÖNGÖRÜSÜ (FORECAST)
      ======================================================== */}
      {forecastDays.length > 0 && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.2px solid #e2e8f0',
          padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={13} />
            </div>
            <div>
              <h3 style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Önümüzdeki Günlerin Giyim Durumu
              </h3>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                Hava değişimlerine karşı hazırlıklı olun
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {forecastDays.map((f, i) => {
              const meta = getWeatherMeta(f.code, true);
              const DayIcon = meta.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '8px 6px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#1e293b', marginBottom: '3px' }}>
                    {f.dayName}
                  </div>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 4px auto',
                    border: '1px solid #e2e8f0'
                  }}>
                    <DayIcon size={14} color={meta.iconColor} />
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>
                    {f.tempMax}° / <span style={{ fontSize: '8.5px', color: '#64748b' }}>{f.tempMin}°</span>
                  </div>
                  <div style={{
                    fontSize: '8px',
                    fontWeight: '700',
                    color: meta.accentColor,
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {meta.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          7. UZMAN BAVUL TÜYOLARI (PACKING HACKS)
      ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.2px solid #e2e8f0',
        padding: '12px 14px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '7px',
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={13} />
          </div>
          <div>
            <h3 style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Uzman Bavul & Seyahat İpuçları
            </h3>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
              Daha hafif, düzenli ve kırışmayan bir bavul için tüyolar
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '9px', padding: '8px 10px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>🌀</span>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>Rulo Katlama Tekniği</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
                Kıyafetlerinizi düz katlamak yerine rulo yaparak dizin. Kırışıklıkları önler ve bavul hacminde %30a varan yer kazandırır.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '9px', padding: '8px 10px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>🎒</span>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>3:1 Kapsül Gardırop Kuralı</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
                Bavula koyduğunuz her 1 pantolon için birbiriyle uyumlu renkte 3 farklı üst seçerek onlarca kombin yaratın.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '9px', padding: '8px 10px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>✈️</span>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a' }}>Kabin Bagajı Sıvı Kuralı (100 ml)</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
                Kabin bagajınızdaki sıvıların 100 ml altında olması ve şeffaf kilitli poşette taşınması zorunludur.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          8. ALT HIZLI GEÇİŞ AKSİYONLARI
      ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <button
          type="button"
          onClick={() => navigate('/individual/checklists')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '9px 12px',
            fontSize: '10.5px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(215, 20, 122, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckSquare size={14} strokeWidth={2.4} />
          <span>Checkliste Kaydet</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/travel-tools?tab=currency')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            background: '#ffffff',
            color: '#0f172a',
            border: '1.2px solid #cbd5e1',
            borderRadius: '12px',
            padding: '9px 12px',
            fontSize: '10.5px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Döviz Çevirici</span>
          <ChevronRight size={13} strokeWidth={2.4} />
        </button>
      </div>

    </div>
  );
}
