import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  ThermometerSun, 
  Landmark, 
  Utensils, 
  Sparkles, 
  Loader2, 
  Star, 
  Compass, 
  Shirt, 
  ChevronRight,
  Bus, 
  Lightbulb,
  Share2,
  Check,
  Plane,
  Coins
} from 'lucide-react';
import { generateCityGuideAI } from '../../services/aiService';
import { useSettingsStore, DEFAULT_POPULAR_ROUTES } from '../../store/settingsStore';
import CountryFlag, { getCurrencySymbol } from '../../components/CountryFlag';

// Kapsamlı ve Zengin Şehir Rehberleri Veritabanı
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

export default function CityGuidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { cityId } = useParams();
  const { geminiConfig, popularRoutes } = useSettingsStore();

  // Find requested city from state, params or popular routes
  const cityParam = searchParams.get('city') || cityId || 'Roma';
  const allRoutes = (popularRoutes && Array.isArray(popularRoutes) && popularRoutes.length > 0)
    ? popularRoutes
    : DEFAULT_POPULAR_ROUTES;

  const matchedRoute = allRoutes.find(r => 
    r.city?.toLowerCase() === cityParam.toLowerCase() || 
    r.id?.toLowerCase() === cityParam.toLowerCase()
  ) || DEFAULT_POPULAR_ROUTES[0];

  const city = location.state?.city || matchedRoute;
  const cityName = city?.city || city?.name || cityParam || 'Roma';
  const countryName = city?.country || 'İtalya';
  const flag = city?.flag || '🌍';
  const cityImage = city?.image || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=1200';

  // Live weather & timezone state
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [localTimezone, setLocalTimezone] = useState('Europe/Istanbul');
  const [currentTime, setCurrentTime] = useState(new Date());

  // AI guide state
  const [guideData, setGuideData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('places'); // 'places' | 'restaurants' | 'tips'
  const [isCopied, setIsCopied] = useState(false);

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
      setLoadingAi(true);
      generateCityGuideAI(cityName, countryName, geminiConfig)
        .then(aiResult => {
          if (aiResult) {
            setGuideData(aiResult);
          } else {
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

  // Share guide link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
    if (navigator.share) {
      navigator.share({
        title: `${cityName} Şehir Rehberi - Move Yanımda`,
        text: `${cityName} için canlı hava, saat, gezilecek yerler ve yeme içme rehberi:`,
        url: window.location.href
      }).catch(() => {});
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. ÜST SABİT SAYFA BAŞLIĞI (PAGE APP BAR) */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #f1f5f9',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate(-1)}
            title="Geri Dön"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '11px',
              border: '1.2px solid #F9BED8',
              background: '#ffffff',
              color: '#D7147A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: '0 1px 3px rgba(215, 20, 122, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.2px'
              }}>
                {cityName} Şehir Rehberi
              </h1>
              <span style={{
                fontSize: '9.5px',
                fontWeight: '800',
                background: '#FDF2F8',
                color: '#D7147A',
                padding: '1.5px 6px',
                borderRadius: '6px',
                border: '1px solid #F9BED8'
              }}>
                AI & Canlı
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
              Move Kurumsal & AI Destinasyon Kılavuzu
            </div>
          </div>
        </div>

        {/* Sağ Buton: Paylaş */}
        <button
          onClick={handleShare}
          title={isCopied ? "Link Kopyalandı!" : "Rehberi Paylaş"}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '11px',
            border: '1.2px solid #e2e8f0',
            background: isCopied ? '#ecfdf5' : '#ffffff',
            color: isCopied ? '#059669' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'all 0.15s ease'
          }}
        >
          {isCopied ? <Check size={16} strokeWidth={2.6} /> : <Share2 size={16} />}
        </button>
      </header>

      {/* 2. SAYFA ANA GÖVDESİ */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        padding: '16px 16px 120px 16px',
        boxSizing: 'border-box'
      }}>
        {/* HERO GÖRSEL BANNER */}
        <div style={{
          position: 'relative',
          height: '210px',
          borderRadius: '22px',
          overflow: 'hidden',
          marginBottom: '16px',
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.10)'
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
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: '11px',
                  color: '#F9BED8',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '2px'
                }}>
                  <CountryFlag flag={flag} country={countryName} size="sm" />
                  <span>{countryName}</span>
                </div>
                <h2 style={{
                  fontSize: '21px',
                  fontWeight: '800',
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.4px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  {cityName}
                </h2>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '12px',
                fontSize: '11.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <Sparkles size={13} color="#E54B98" />
                <span>AI Destinasyon</span>
              </div>
            </div>
          </div>
        </div>

        {/* HIZLI BİLGİ ŞERİDİ (SAAT FARKI, UÇUŞ SÜRESİ, PARA BİRİMİ) */}
        {city && (city.time || city.flight || city.currency) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.2px solid #e2e8f0',
            padding: '12px 6px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>
                <Clock size={11} color="#D7147A" /> Saat Farkı
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                {city.time || timeDiffBadge || 'Aynı Saat'}
              </div>
            </div>

            <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>
                <Plane size={11} color="#0284c7" /> Uçuş Süresi
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                {city.flight || '3.5 Saat'}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase' }}>
                <Coins size={11} color="#f59e0b" /> Para Birimi
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                {city.currency || 'EUR'}
              </div>
            </div>
          </div>
        )}

        {/* CANLI SAAT & ZAMAN DİLİMİ KARTI */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.2px solid #e2e8f0',
          padding: '15px 16px',
          marginBottom: '14px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              <Clock size={16} color="#D7147A" />
              <span>Canlı Saat & Zaman Dilimi</span>
            </div>
            {timeDiffBadge && (
              <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#eff6ff', color: '#2563eb', padding: '2.5px 8px', borderRadius: '7px', border: '1px solid #dbeafe' }}>
                {timeDiffBadge}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                🇹🇷 TÜRKİYE
              </div>
              <div style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a' }}>
                {currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', padding: '12px', borderRadius: '14px', border: '1px solid #F9BED8', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#B01064', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                📍 {cityName.toUpperCase()} YEREL
              </div>
              <div style={{ fontSize: '19px', fontWeight: '900', color: '#D7147A' }}>
                {currentTime.toLocaleTimeString('tr-TR', { timeZone: localTimezone, hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* CANLI HAVA DURUMU GÖSTERGESİ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.2px solid #e2e8f0',
          padding: '15px 16px',
          marginBottom: '14px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              <ThermometerSun size={16} color="#D7147A" />
              <span>Hava Durumu Göstergesi</span>
            </div>
            {weather && (
              <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2.5px 8px', borderRadius: '7px', border: '1px solid #a7f3d0' }}>
                {weather.condition}
              </span>
            )}
          </div>

          {loadingWeather ? (
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={20} color="#D7147A" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : weather ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff5f9', border: '1px solid #FCE7F3', padding: '12px 16px', borderRadius: '14px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#B01064', fontWeight: '700', textTransform: 'uppercase' }}>ŞU ANKİ SICAKLIK</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                    {weather.temp}°C
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>Nem: <strong style={{ color: '#0f172a' }}>%{weather.humidity}</strong></div>
                  <div>Rüzgar: <strong style={{ color: '#0f172a' }}>{weather.wind} km/s</strong></div>
                </div>
              </div>

              {weather.forecast && weather.forecast.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weather.forecast.length}, 1fr)`, gap: '8px' }}>
                  {weather.forecast.map((f, i) => (
                    <div key={i} style={{ background: '#f8fafc', padding: '8px 4px', borderRadius: '11px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{f.day}</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{f.max}°</div>
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

        {/* YAPAY ZEKA DESTEKLİ DESTİNASYON ÖZETİ */}
        {guideData?.summary && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
            borderRadius: '18px',
            border: '1.2px solid #F9BED8',
            padding: '15px 16px',
            marginBottom: '16px',
            boxShadow: '0 2px 10px rgba(215, 20, 122, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#D7147A" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                Yapay Zeka Destinasyon Özeti
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.55, margin: 0 }}>
              {guideData.summary}
            </p>
          </div>
        )}

        {/* SEKMELİ ŞEHİR REHBERİ BÖLÜMÜ */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            background: '#e2e8f0',
            borderRadius: '14px',
            padding: '3px',
            gap: '4px',
            marginBottom: '12px'
          }}>
            <button
              onClick={() => setActiveTab('places')}
              style={{
                flex: 1,
                padding: '8px 6px',
                border: 'none',
                borderRadius: '11px',
                background: activeTab === 'places' ? '#ffffff' : 'transparent',
                color: activeTab === 'places' ? '#D7147A' : '#64748b',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === 'places' ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <Landmark size={14} />
              <span>Görülecek Yerler</span>
            </button>

            <button
              onClick={() => setActiveTab('restaurants')}
              style={{
                flex: 1,
                padding: '8px 6px',
                border: 'none',
                borderRadius: '11px',
                background: activeTab === 'restaurants' ? '#ffffff' : 'transparent',
                color: activeTab === 'restaurants' ? '#D7147A' : '#64748b',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === 'restaurants' ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <Utensils size={14} />
              <span>Yeme & İçme</span>
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              style={{
                flex: 1,
                padding: '8px 6px',
                border: 'none',
                borderRadius: '11px',
                background: activeTab === 'tips' ? '#ffffff' : 'transparent',
                color: activeTab === 'tips' ? '#D7147A' : '#64748b',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === 'tips' ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <Lightbulb size={14} />
              <span>İpuçları</span>
            </button>
          </div>

          {loadingAi ? (
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '28px', textAlign: 'center', border: '1.2px solid #e2e8f0' }}>
              <Loader2 size={24} color="#D7147A" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                {cityName} için Yapay Zeka Rehberi Derleniyor...
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                Önemli noktalar, restoranlar ve seyahat tüyoları hazırlanıyor.
              </div>
            </div>
          ) : (
            <div>
              {/* SEKME: GÖRÜLECEK YERLER */}
              {activeTab === 'places' && guideData?.places && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {guideData.places.map((place, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1.2px solid #e2e8f0',
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
                      }}
                    >
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '9px',
                        background: '#FDF2F8',
                        color: '#D7147A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        border: '1px solid #F9BED8',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                            {place.name}
                          </div>
                          {place.tag && (
                            <span style={{ fontSize: '10px', fontWeight: '700', background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '6px' }}>
                              {place.tag}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
                          {place.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SEKME: YEME & İÇME */}
              {activeTab === 'restaurants' && guideData?.restaurants && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {guideData.restaurants.map((rest, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1.2px solid #e2e8f0',
                        padding: '14px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                          {rest.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '2.5px 7px', borderRadius: '7px', fontSize: '11px', fontWeight: '800', border: '1px solid #fde68a' }}>
                          <Star size={11.5} fill="currentColor" /> {rest.rating}
                        </div>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#0284c7', background: '#f0f9ff', display: 'inline-block', padding: '2px 7px', borderRadius: '5px', marginBottom: '6px', fontWeight: '700' }}>
                        {rest.cuisine}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>
                        {rest.tip}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SEKME: İPUÇLARI & ULAŞIM */}
              {activeTab === 'tips' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {guideData?.transport && (
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.2px solid #e2e8f0', padding: '14px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Bus size={15} color="#D7147A" /> Şehir İçi Ulaşım & Havalimanı
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>
                        {guideData.transport}
                      </div>
                    </div>
                  )}

                  {guideData?.tips?.map((t, idx) => (
                    <div key={idx} style={{ background: '#ffffff', borderRadius: '16px', border: '1.2px solid #e2e8f0', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
                      <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                        {t}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. ENTEGRE SEYAHAT ARAÇLARI AKSİYONLARI */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '18px'
        }}>
          <button
            onClick={() => navigate(`/travel-tools?tab=outfit&city=${encodeURIComponent(cityName)}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(215, 20, 122, 0.22)',
              transition: 'all 0.15s ease'
            }}
          >
            <Shirt size={15} />
            <span>Ne Giyilir?</span>
          </button>

          <button
            onClick={() => navigate(`/tintin?q=${encodeURIComponent(`${cityName} seyahati için bilmem gereken en önemli noktalar nelerdir?`)}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} color="#D7147A" />
            <span>Tintin ile Konuş</span>
          </button>
        </div>

      </main>
    </div>
  );
}
