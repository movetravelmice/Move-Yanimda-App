import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  MapPin, 
  Clock, 
  ThermometerSun, 
  Landmark, 
  Utensils, 
  Sparkles, 
  Loader2, 
  Star, 
  Navigation, 
  Compass, 
  Info, 
  Shirt, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Bus,
  Lightbulb
} from 'lucide-react';
import { generateCityGuideAI } from '../services/aiService';
import { useSettingsStore } from '../store/settingsStore';
import CountryFlag from './CountryFlag';

// Curated high-quality fallback guides for instant display
const CURATED_CITY_GUIDES = {
  'roma': {
    summary: "İtalya'nın başkenti Roma, binlerce yıllık antik tarihi, görkemli meydanları ve eşsiz mutfağıyla dünyanın en büyüleyici açık hava müzesidir. İlkbahar ve sonbahar ayları şehri keşfetmek için en ideal zamandır.",
    places: [
      { name: "Kolezyum & Roma Forumu", desc: "Antik Roma İmparatorluğu'nun sembolü olan devasa amfitiyatro ve antik tapınaklar alanı.", tag: "Antik Tarih" },
      { name: "Trevi Çeşmesi (Aşk Çeşmesi)", desc: "Nicola Salvi tasarımı barok başyapıt. Geleneğe göre arkasını dönüp havuza bozuk para atan Roma'ya tekrar gelir.", tag: "Barok Anıt" },
      { name: "Vatikan & Aziz Petrus Bazilikası", desc: "Michelangelo ve Bernini'nin başyapıtlarını barındıran Hristiyan dünyasının kalbi ve Sistina Şapeli.", tag: "Sanat & Dini Merkez" },
      { name: "Panteon (Pantheon)", desc: "Antik Roma'dan günümüze kubbesiyle hasarsız ulaşabilmiş en görkemli tapınak.", tag: "Mimari Şaheser" }
    ],
    restaurants: [
      { name: "Trattoria Da Enzo al 29 (Trastevere)", cuisine: "Otantik Roma Mutfağı", rating: "4.8", tip: "Cacio e Pepe ve Carbonara makarnası şehrin en iyisidir." },
      { name: "Giolitti Gelato", cuisine: "Tarihi Dondurmacı", rating: "4.7", tip: "1900 yılından beri hizmet veren efsanevi fıstıklı ve zabaglione dondurması." },
      { name: "Roscioli Salumeria con Cucina", cuisine: "Şarküteri & Şarap Evi", rating: "4.9", tip: "Taze burrata, trüflü peynirler ve ev yapımı focaccia ekmekleri." },
      { name: "Pizzarium Bonci", cuisine: "Tava Pizzası (Al Taglio)", rating: "4.8", tip: "Çıtır mayalı hamuru ve gurme malzeme kombinasyonlarıyla ünlü." }
    ],
    transport: "Fiumicino Havalimanı'ndan Leonardo Express treniyle 32 dakikada Termini merkez istasyonuna ulaşabilirsiniz. Şehir içinde A ve B metro hatları ile yürüyüş en pratik seçenektir.",
    tips: [
      "Kolezyum ve Vatikan Müzeleri biletlerini haftalar öncesinden online rezerve edin, kapıdaki 2 saatlik kuyruğu atlayın.",
      "Vatikan ve tarihi bazilikalara girerken omuz ve dizlerin örtülü olması kuralına mutlaka uyun.",
      "Sokaklardaki 'Nasone' adı verilen tarihi döküm çeşmelerden temiz ve buz gibi içme suyu doldurabilirsiniz."
    ]
  },
  'londra': {
    summary: "Birleşik Krallık'ın kalbi Londra; Thames Nehri kıyısındaki tarihi kuleleri, kraliyet sarayları, dünyaca ünlü ücretsiz müzeleri ve kozmopolit yaşamıyla büyüler. Mayıs-Eylül arası en keyifli dönemdir.",
    places: [
      { name: "British Museum", desc: "Mısır mumyalarından Rosetta Taşı'na kadar insanlık tarihinin 8 milyonluk koleksiyonu (Giriş ücretsizdir).", tag: "Dünya Mirası Müze" },
      { name: "Tower Bridge & Tower of London", desc: "Thames Nehri'nin simge asma köprüsü ve Kraliyet Mücevherleri'nin korunduğu tarihi kale.", tag: "Tarihi Kale" },
      { name: "Big Ben & Westminster Sarayı", desc: "İngiliz parlamentosunun tarihi gotik merkezi ve saat kulesi.", tag: "İkonik Simge" },
      { name: "Borough Market", desc: "1000 yıllık geçmişiyle gurme lezzetlerin, taze peynirlerin ve sokak lezzetlerinin buluşma noktası.", tag: "Gurme Pazar" }
    ],
    restaurants: [
      { name: "Dishoom (Covent Garden)", cuisine: "Bombay Kafe Mutfağı", rating: "4.8", tip: "Black Daal, Chicken Ruby ve taze Naan ekmekleri unutulmazdır." },
      { name: "Poppies Fish & Chips (Soho)", cuisine: "Klasik İngiliz", rating: "4.7", tip: "Geleneksel gazete kağıdında servis edilen çıtır mezgit ve patates." },
      { name: "The Wolseley (Mayfair)", cuisine: "İngiliz / Avrupa", rating: "4.8", tip: "Klasik İngiliz 'Afternoon Tea' (Beş Çayı) ritüeli için en şık mekan." },
      { name: "Duck & Waffle", cuisine: "Modern İngiliz & Şehir Manzarası", rating: "4.7", tip: "40. katta 24 saat açık; çıtır ördek bacağı ve waffle ikilisi." }
    ],
    transport: "Heathrow'dan Elizabeth Line veya Piccadilly metrosu ile 35-45 dakikada merkeze inebilirsiniz. Şehir içinde temassız kredi kartınızı metro turnikelerine okutarak Oyster karta gerek kalmadan seyahat edebilirsiniz.",
    tips: [
      "British Museum, Natural History Museum ve Tate Modern gibi ana devlet müzelerine giriş tamamen ücretsizdir.",
      "Priz tipi Tip G (3 kalın dikdörtgen pimli) olduğu için yanınıza İngiltere adaptörü almayı unutmayın.",
      "Trafik soldan aktığı için karşıdan karşıya geçerken yerdeki 'Look Right' ve 'Look Left' yazılarına dikkat edin."
    ]
  },
  'paris': {
    summary: "Işıklar Şehri Paris; Seine Nehri boyundaki köprüleri, haute couture modası, Louvre Sarayı ve romantik kafeleriyle unutulmaz bir başkenttir. Bahar ve sonbahar ayları şehri yürüyerek keşfetmek için harikadır.",
    places: [
      { name: "Eyfel Kulesi & Champ de Mars", desc: "Gustave Eiffel'in 1889 Dünya Fuarı için yaptığı, günün her saati farklı bir büyü sunan Paris simgesi.", tag: "Dünya Simgesi" },
      { name: "Louvre Müzesi", desc: "Mona Lisa ve Milo Venüsü'ne ev sahipliği yapan dünyanın en büyük sanat müzesi sarayı.", tag: "Dev Sanat Koleksiyonu" },
      { name: "Montmartre & Sacré-Cœur Bazilikası", desc: "Ressamlar Tepesi'nin dar sokakları ve Paris'e tepeden bakan beyaz kubbeli görkemli bazilika.", tag: "Bohem Tepe" },
      { name: "Seine Nehri Tekne Turu", desc: "Pont Alexandre III, Notre Dame ve tarihi köprülerin altından geçen büyüleyici nehir gezisi.", tag: "Nehir Deneyimi" }
    ],
    restaurants: [
      { name: "Le Bouillon Chartier (Grands Boulevards)", cuisine: "Geleneksel Fransız Bistro", rating: "4.6", tip: "1896'dan kalma Belle Époque atmosferinde uygun fiyatlı ördek confit ve salyangoz." },
      { name: "Café de Flore (Saint-Germain)", cuisine: "Tarihi Paris Kafe", rating: "4.7", tip: "Sartre ve Hemingway'in müdavimi olduğu mekanda sıcak çikolata ve kruvasan." },
      { name: "L'As du Fallafel (Le Marais)", cuisine: "Orta Doğu & Sokak Lezzeti", rating: "4.8", tip: "Marais bölgesinin en ünlü çıtır falafel dürümleri." },
      { name: "Angelina Paris (Rue de Rivoli)", cuisine: "Fransız Pastane", rating: "4.8", tip: "Yoğun sıcak çikolata 'L'Africain' ve Mont-Blanc tatlısı." }
    ],
    transport: "CDG Havalimanı'ndan RER B banliyö treniyle 35 dakikada Châtelet merkez istasyonuna ulaşılır. Şehirde 'Navigo Easy' kartı ile metro ve otobüsler saniyeler içinde kullanılır.",
    tips: [
      "Louvre ve Eyfel Kulesi biletlerini en az 2 hafta öncesinden internetten saatli randevu ile satın alın.",
      "Kafelerde hesaba servis ücreti dahildir; garsona ayrıca bahşiş vermek zorunlu değildir, bozukluk bırakmak nezakettir.",
      "Fransız esnafına girerken 'Bonjour', çıkarken 'Au revoir' demek çok kibar karşılanır."
    ]
  },
  'dubai': {
    summary: "Gökdelenlerin, çöl safarisinin ve lüksün fütüristik metropolü Dubai; dünyanın en yüksek binaları, dev alışveriş merkezleri ve yapay adalarıyla büyüler. Kasım-Mart arası en serin ve keyifli dönemdir.",
    places: [
      { name: "Burj Khalifa", desc: "828 metre yüksekliğiyle dünyanın en yüksek binası ve 124/148. katlardaki seyir terasları.", tag: "Dünya Rekoru" },
      { name: "The Dubai Mall & Dubai Çeşmesi", desc: "1200+ mağaza, dev akvaryum ve müzikli su dansı gösterisi.", tag: "Mega Alışveriş & Şov" },
      { name: "Palm Jumeirah & Atlantis", desc: "Uzaydan görülebilen palmiye şeklindeki yapay ada ve lüks resortlar.", tag: "Mühendislik Harikası" },
      { name: "Dubai Çöl Safarisi", desc: "Kızıl kum tepelerinde 4x4 araçlarla safari, kum sörfü ve Bedevi kampı akşam yemeği.", tag: "Çöl Macerası" }
    ],
    restaurants: [
      { name: "Arabian Tea House (Al Fahidi)", cuisine: "Geleneksel Emirlik Mutfağı", rating: "4.8", tip: "Tarihi rüzgar kuleleri altında kuzu machboos ve safranlı çay." },
      { name: "Al Ustad Special Kabab", cuisine: "Tarihi Kebapçı (1978)", rating: "4.8", tip: "Yoğurtlu marine kuzu ve tavuk şişler; Dubai'nin en meşhur salaş lezzeti." },
      { name: "Zuma Dubai (DIFC)", cuisine: "Modern Japon Gurme", rating: "4.9", tip: "DIFC finans merkezinde mükemmel kara morina balığı ve suşiler." },
      { name: "Pierchic", cuisine: "Deniz Ürünleri & Romantik", rating: "4.8", tip: "Denizin üzerindeki iskelede Burj Al Arab manzaralı akşam yemeği." }
    ],
    transport: "Dubai Uluslararası Havalimanı (DXB) doğrudan Kırmızı Metro hattına bağlıdır. Şehirde sürücüsüz modern metro ve klimalı taksiler (Careem / Dubai Taxi) çok yaygın ve konforludur.",
    tips: [
      "Yaz aylarında sıcaklık 45°C'yi aşar, açık hava gezileri yerine kapalı eğlence merkezleri ve akşam saatleri tercih edilmelidir.",
      "Priz tipi İngiliz Tip G'dir (3 pimli).",
      "Metro vagonlarında 'Gold Class' ve 'Women & Children' özel bölmelerine dikkat edin; yanlış vagona binenlere para cezası uygulanabilir."
    ]
  },
  'tokyo': {
    summary: "Geleneksel tapınakların fütüristik neon ışıklarıyla harmanlandığı Tokyo; dünyanın en temiz, en güvenli ve gastronomi açısından en zengin mega kentidir. Kiraz çiçekleri (Sakura) dönemi Mart-Nisan başıdır.",
    places: [
      { name: "Senso-ji Tapınağı (Asakusa)", desc: "Tokyo'nun en eski ve en görkemli Budist tapınağı; Kaminarimon kapısı ve Nakamise caddesi.", tag: "Tarihi Tapınak" },
      { name: "Shibuya Yaya Geçidi & Hachiko", desc: "Dünyanın en kalabalık yaya kavşağı ve sadık köpek Hachiko'nun bronz heykeli.", tag: "Mega Şehir İkonu" },
      { name: "Shinjuku & Tokyo Metropol Valiliği Binası", desc: "45. kattaki ücretsiz seyir terasından Fuji Dağı ve Tokyo silüeti manzarası.", tag: "Panoramik Manzara" },
      { name: "Meiji Jingu Tapınağı & Harajuku", desc: "Yoyogi Parkı'nın asırlık ağaçları arasındaki kutsal Şinto tapınağı ve renkli gençlik caddeleri.", tag: "Doğa & Şinto" }
    ],
    restaurants: [
      { name: "Ichiran Ramen (Shibuya)", cuisine: "Tonkotsu Ramen", rating: "4.8", tip: "Tek kişilik özel kabinlerde kişiye özel acılık ve kıvamda ramen." },
      { name: "Tsukiji Outer Market", cuisine: "Taze Suşi & Sokak Deniz Ürünleri", rating: "4.9", tip: "Sabah saatlerinde taze ton balığı (Toro) suşi ve ızgara deniz tarağı." },
      { name: "Gyukatsu Motomura (Akihabara)", cuisine: "Kızarmış Dana Bonfile", rating: "4.9", tip: "Masadaki minik taş ocakta kendi zevkinize göre pişirdiğiniz panko kaplı et." },
      { name: "Afuri Ramen (Harajuku)", cuisine: "Yuzu Aromalı Hafif Ramen", rating: "4.7", tip: "Ferahlatıcı Japon narenciyesi (Yuzu) suyu eklenmiş tavuk suyu ramen." }
    ],
    transport: "Yamanote tren hattı Tokyo'nun tüm ana merkezlerini (Shinjuku, Shibuya, Tokyo, Akihabara, Ueno) çember şeklinde birbirine bağlar. iPhone cüzdanınıza dijital Suica veya Pasmo kart yükleyebilirsiniz.",
    tips: [
      "Japonya'da restoranda veya takside bahşiş vermek kaba bir davranış sayılır; hesabı kuruşu kuruşuna ödemeniz beklenir.",
      "Yürürken yemek yemek veya sigara içmek sokaklarda yasaktır; yemeğinizi aldığınız dükkanın önünde tüketmelisiniz.",
      "Priz tipi Tip A/B (100V, iki düz yassı uç) olduğundan Amerikan/Japonya dönüştürücüsü gereklidir."
    ]
  },
  'barselona': {
    summary: "Akdeniz güneşi, Antoni Gaudí'nin masalsı mimarisi, tapas barları ve altın kumsallarıyla Barselona; Avrupa'nın en canlı ve enerjik sahil metropolüdür. İlkbahar ve yaz başı seyahat için kusursuzdur.",
    places: [
      { name: "La Sagrada Família", desc: "Gaudí'nin 140 yılı aşkın süredir yapımı süren, doğadan ilham alan dünyanın en sıra dışı bazilikası.", tag: "Gaudí Başyapıtı" },
      { name: "Park Güell", desc: "Renkli seramik mozaikleri, taş viyadükleri ve Barselona panoramasıyla rüya gibi bir masal bahçesi.", tag: "Mozaik & Sanat" },
      { name: "Gotik Mahalle (Barri Gòtic)", desc: "Orta Çağ'dan kalma daracık labirent sokaklar, gizli meydanlar ve Barselona Katedrali.", tag: "Tarihi Doku" },
      { name: "La Boqueria & La Rambla", desc: "Katalan jambonları (Jamón), taze meyve suları ve deniz ürünleriyle dolu meşhur tarihi pazar.", tag: "Pazar & Cadde" }
    ],
    restaurants: [
      { name: "Cervecería Catalana (Eixample)", cuisine: "Katalan Tapas Barı", rating: "4.8", tip: "Montaditos, patatas bravas ve ızgara kalamar için her zaman kuyruk olan en popüler tapasçı." },
      { name: "El Xampanyet (El Born)", cuisine: "Tarihi Şampanya & Tapas", rating: "4.7", tip: "1929'dan kalma seramikli barda ev yapımı köpüklü şarap ve ançüez." },
      { name: "Can Solé (Barceloneta)", cuisine: "Geleneksel Deniz Mahsullü Paella", rating: "4.7", tip: "110 yıllık tarihiyle sahil kenarında gerçek odun ateşinde pişmiş deniz mahsullü pilav." },
      { name: "Chök - The Chocolate Kitchen", cuisine: "Katalan Tatlıları & Çikolata", rating: "4.8", tip: "Gurme kronutlar, çikolatalı trüfler ve taze churros." }
    ],
    transport: "El Prat Havalimanı'ndan Aerobús ile 25 dakikada Plaça de Catalunya meydanına inebilirsiniz. Şehir içinde T-Casual 10 binişlik metro kartı çok hesaplıdır.",
    tips: [
      "Sagrada Família ve Park Güell biletleri kapıda satılmaz; mutlaka seyahatten en az 1-2 hafta önce internetten saatli alın.",
      "La Rambla ve kalabalık metro istasyonlarında yankesicilik çok yaygındır; sırt çantanızı önde taşıyın ve telefonunuzu masada bırakmayın.",
      "İspanya'da Tax-Free için harcama alt limiti 0 €'dur; en küçük alışverişinizde bile iade formu isteyebilirsiniz."
    ]
  }
};

export default function CityGuideModal({ city, onClose }) {
  const navigate = useNavigate();
  const { geminiConfig } = useSettingsStore();

  const cityName = city?.city || city?.name || 'Roma';
  const countryName = city?.country || 'İtalya';
  const flag = city?.flag || '🌍';
  const cityImage = city?.image || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800';

  // Live weather & timezone state
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [localTimezone, setLocalTimezone] = useState('Europe/Istanbul');
  const [currentTime, setCurrentTime] = useState(new Date());

  // AI guide state
  const [guideData, setGuideData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('places'); // 'places' | 'restaurants' | 'tips'

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live weather + timezone from Open-Meteo
  useEffect(() => {
    let isMounted = true;
    async function fetchWeather() {
      setLoadingWeather(true);
      try {
        const cleanName = cityName.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '').trim();
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=tr&format=json`);
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude, timezone } = geoData.results[0];
          if (timezone && isMounted) setLocalTimezone(timezone);

          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
          const weatherData = await weatherRes.json();

          if (isMounted && weatherData?.current) {
            const code = weatherData.current.weather_code;
            let condition = 'Açık & Güneşli';
            if ([1, 2, 3].includes(code)) condition = 'Parçalı Bulutlu';
            else if ([45, 48].includes(code)) condition = 'Sisli & Puslu';
            else if ([51, 53, 55, 61, 63, 65, 80, 81].includes(code)) condition = 'Yağmurlu';
            else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = 'Karlı';
            else if (code === 95 || code === 96) condition = 'Gök Gürültülü Fırtına';

            setWeather({
              temp: Math.round(weatherData.current.temperature_2m),
              condition,
              humidity: weatherData.current.relative_humidity_2m,
              wind: Math.round(weatherData.current.wind_speed_10m),
              forecast: weatherData.daily?.time?.slice(0, 4).map((t, idx) => ({
                day: idx === 0 ? 'Bugün' : new Date(t).toLocaleDateString('tr-TR', { weekday: 'short' }),
                max: Math.round(weatherData.daily.temperature_2m_max[idx]),
                min: Math.round(weatherData.daily.temperature_2m_min[idx])
              })) || []
            });
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
  }, [cityName]);

  // Load curated guide or generate with Gemini AI
  useEffect(() => {
    const key = cityName.toLowerCase().trim();
    const curated = CURATED_CITY_GUIDES[key];
    if (curated) {
      setGuideData(curated);
    } else {
      // Generate with Gemini AI
      setLoadingAi(true);
      generateCityGuideAI(cityName, countryName, geminiConfig)
        .then(aiResult => {
          if (aiResult) {
            setGuideData(aiResult);
          } else {
            // Generic fallback
            setGuideData({
              summary: `${cityName}, zengin tarihi, eşsiz kültürel dokusu ve kendine has atmosferiyle ziyaretçilerine unutulmaz bir seyahat deneyimi sunar.`,
              places: [
                { name: `${cityName} Tarihi Şehir Merkezi`, desc: "Tarihi meydanlar, mimari yapılar ve eski sokaklar.", tag: "Tarihi Merkez" },
                { name: `${cityName} Sanat & Kültür Müzesi`, desc: "Şehrin en önemli sanat koleksiyonu ve sergileri.", tag: "Kültür & Sanat" },
                { name: `${cityName} Seyir Noktası & Parkı`, desc: "Şehri kuş bakışı izleyebileceğiniz en popüler manzara noktası.", tag: "Panoramik Manzara" }
              ],
              restaurants: [
                { name: "Geleneksel Şehir Restoranı", cuisine: "Yöresel Mutfak", rating: "4.8", tip: "Şehrin en popüler yerel lezzetlerini sunan tarihi mekan." },
                { name: "Merkez Meydan Kafesi", cuisine: "Kafe & Tatlı", rating: "4.7", tip: "Kahve ve yerel tatlılarıyla dinlenmek için ideal nokta." }
              ],
              transport: "Havalimanından merkeze tren, metro veya servis otobüsleri ile kolayca ulaşabilirsiniz. Şehir içinde toplu taşıma kartı almak avantaj sağlar.",
              tips: [
                "Popüler müze biletlerini önceden online satın alarak kuyruklardan kurtulun.",
                "Yerel para birimi ve priz tipi uyumluluğunu kontrol edin.",
                "Günün erken saatlerinde yürüyüş turları daha keyifli ve sakindir."
              ]
            });
          }
        })
        .finally(() => setLoadingAi(false));
    }
  }, [cityName, countryName, geminiConfig]);

  // Calculate time difference
  const timeDiffBadge = React.useMemo(() => {
    try {
      if (!localTimezone) return null;
      const now = new Date();
      const trStr = now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
      const localStr = now.toLocaleString("en-US", { timeZone: localTimezone });
      const trDate = new Date(trStr);
      const localDate = new Date(localStr);
      const diffHours = Math.round((localDate.getTime() - trDate.getTime()) / (1000 * 60 * 60));
      if (diffHours === 0) return "Aynı Saat";
      if (diffHours > 0) return `+${diffHours} Saat`;
      return `${diffHours} Saat`;
    } catch {
      return null;
    }
  }, [localTimezone, currentTime]);

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeInModal 0.2s ease',
        overflow: 'hidden'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          background: '#f8fafc',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
          animation: 'slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Drag Indicator & Close Header */}
        <div style={{
          background: '#ffffff',
          padding: '12px 18px 10px 18px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#FDF2F8',
              color: '#D7147A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={17} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                {cityName} Şehir Rehberi
              </h3>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Move Kurumsal & AI Destinasyon Kılavuzu
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 30px 16px' }}>
          
          {/* 1. HERO BANNER */}
          <div style={{
            position: 'relative',
            height: '180px',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '14px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}>
            <img 
              src={cityImage} 
              alt={cityName} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.90) 0%, rgba(15, 23, 42, 0.35) 60%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#F9BED8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CountryFlag flag={flag} country={countryName} size="sm" />
                    <span>{countryName}</span>
                  </div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: '2px 0 0 0', letterSpacing: '-0.4px' }}>
                    {cityName}
                  </h1>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={12} color="#E54B98" />
                  <span>AI Rehber</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ZAMAN DİLİMİ (TIME ZONE) KARTI */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
                <Clock size={15} color="#D7147A" />
                <span>Canlı Saat & Zaman Dilimi</span>
              </div>
              {timeDiffBadge && (
                <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                  {timeDiffBadge}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                  🇹🇷 Türkiye
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                  {currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', padding: '10px 12px', borderRadius: '12px', border: '1px solid #F9BED8', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#B01064', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
                  📍 {cityName} Yerel
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#D7147A' }}>
                  {currentTime.toLocaleTimeString('tr-TR', { timeZone: localTimezone, hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. CANLI HAVA DURUMU KARTI */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            marginBottom: '14px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
                <ThermometerSun size={15} color="#D7147A" />
                <span>Hava Durumu Göstergesi</span>
              </div>
              {weather && (
                <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  {weather.condition}
                </span>
              )}
            </div>

            {loadingWeather ? (
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={18} color="#D7147A" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : weather ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff5f9', border: '1px solid #FCE7F3', padding: '10px 14px', borderRadius: '12px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#B01064', fontWeight: '700' }}>ŞU ANKİ SICAKLIK</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                      {weather.temp}°C
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                    <div>Nem: <strong>%{weather.humidity}</strong></div>
                    <div>Rüzgar: <strong>{weather.wind} km/s</strong></div>
                  </div>
                </div>

                {weather.forecast && weather.forecast.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weather.forecast.length}, 1fr)`, gap: '6px' }}>
                    {weather.forecast.map((f, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: '6px', borderRadius: '10px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{f.day}</div>
                        <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{f.max}°</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{f.min}°</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '11.5px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                Hava durumu bilgisi yükleniyor...
              </div>
            )}
          </div>

          {/* 4. AI DESTİNASYON ÖZETİ */}
          {guideData?.summary && (
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1.2px solid #F9BED8',
              padding: '14px',
              marginBottom: '14px',
              boxShadow: '0 2px 8px rgba(215, 20, 122, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={15} color="#D7147A" />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                  Yapay Zeka Destinasyon Özeti
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                {guideData.summary}
              </p>
            </div>
          )}

          {/* 5. SEKMELİ AI REHBERİ: GÖRÜLECEK YERLER & RESTORANLAR & TÜYOLAR */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '3px', gap: '4px', marginBottom: '10px' }}>
              <button
                onClick={() => setActiveTab('places')}
                style={{
                  flex: 1, padding: '7px', border: 'none', borderRadius: '9px',
                  background: activeTab === 'places' ? '#ffffff' : 'transparent',
                  color: activeTab === 'places' ? '#D7147A' : '#64748b',
                  fontSize: '11.5px', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <Landmark size={13} />
                <span>Görülecek Yerler</span>
              </button>

              <button
                onClick={() => setActiveTab('restaurants')}
                style={{
                  flex: 1, padding: '7px', border: 'none', borderRadius: '9px',
                  background: activeTab === 'restaurants' ? '#ffffff' : 'transparent',
                  color: activeTab === 'restaurants' ? '#D7147A' : '#64748b',
                  fontSize: '11.5px', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <Utensils size={13} />
                <span>Yeme & İçme</span>
              </button>

              <button
                onClick={() => setActiveTab('tips')}
                style={{
                  flex: 1, padding: '7px', border: 'none', borderRadius: '9px',
                  background: activeTab === 'tips' ? '#ffffff' : 'transparent',
                  color: activeTab === 'tips' ? '#D7147A' : '#64748b',
                  fontSize: '11.5px', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                }}
              >
                <Lightbulb size={13} />
                <span>İpuçları</span>
              </button>
            </div>

            {loadingAi ? (
              <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <Loader2 size={22} color="#D7147A" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                  {cityName} için Yapay Zeka Rehberi Hazırlanıyor...
                </div>
              </div>
            ) : (
              <div>
                {/* TAB: PLACES */}
                {activeTab === 'places' && guideData?.places && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {guideData.places.map((place, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '8px',
                          background: '#FDF2F8',
                          color: '#D7147A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800',
                          border: '1px solid #F9BED8',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                              {place.name}
                            </div>
                            {place.tag && (
                              <span style={{ fontSize: '10px', fontWeight: '700', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px' }}>
                                {place.tag}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                            {place.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB: RESTAURANTS */}
                {activeTab === 'restaurants' && guideData?.restaurants && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {guideData.restaurants.map((rest, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          borderRadius: '14px',
                          border: '1px solid #e2e8f0',
                          padding: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                            {rest.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '2px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', border: '1px solid #fde68a' }}>
                            <Star size={11} fill="currentColor" /> {rest.rating}
                          </div>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#0284c7', background: '#f0f9ff', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', fontWeight: '700' }}>
                          {rest.cuisine}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.35 }}>
                          {rest.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB: TIPS */}
                {activeTab === 'tips' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {guideData?.transport && (
                      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Bus size={14} color="#D7147A" /> Şehir İçi Ulaşım & Havalimanı
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                          {guideData.transport}
                        </div>
                      </div>
                    )}

                    {guideData?.tips?.map((t, idx) => (
                      <div key={idx} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
                        <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.35 }}>
                          {t}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. ALT AKSİYON BUTONLARI: NE GİYİLİR & TINTIN AI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => {
                onClose();
                navigate(`/travel-tools?tab=outfit&city=${encodeURIComponent(cityName)}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '11px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(215, 20, 122, 0.22)'
              }}
            >
              <Shirt size={14} />
              <span>Ne Giyilir?</span>
            </button>

            <button
              onClick={() => {
                onClose();
                navigate(`/tintin?q=${encodeURIComponent(`${cityName} gezisi hakkında detaylı bilgi verir misin?`)}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '11px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={14} color="#D7147A" />
              <span>Tintin ile Konuş</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
