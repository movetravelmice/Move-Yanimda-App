// Robust Google Gemini AI Service for Tintin Travel Assistant

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemma-4-26b-a4b-it',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

/**
 * Sanitize assistant text to remove broken flag codes or malformed unicode artifacts
 */
export const sanitizeAssistantText = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/^(\s*[\*•\-]?\s*)(us|me|tr|gb|eu|de|fr|it|es|ru|ae|jp|cn|ca|au)\s+/gim, '$1')
    .replace(/(\b(us|me|tr|gb|eu|de|fr|it|es|ru|ae|jp)\b\s+)(?=[A-Z0-9])/gi, '')
    .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
    .trim();
};

/**
 * Sanitize model name to avoid deprecated or invalid models
 */
export const sanitizeModelName = (rawModel) => {
  if (!rawModel || typeof rawModel !== 'string') return 'gemini-3-flash-preview';
  const m = rawModel.trim();
  if (m.startsWith('gemini-1.') || m.startsWith('gemini-2.5')) {
    return 'gemini-3-flash-preview';
  }
  return m;
};

/**
 * Fetch live exchange rates (free, CORS-enabled)
 */
export const fetchLiveExchangeRates = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data && data.rates && data.rates.TRY) {
      const usdTry = Number(data.rates.TRY);
      const eurTry = usdTry / Number(data.rates.EUR);
      const gbpTry = usdTry / Number(data.rates.GBP);
      const chfTry = usdTry / Number(data.rates.CHF);
      const aedTry = usdTry / Number(data.rates.AED);
      const jpyTry = (usdTry / Number(data.rates.JPY)) * 100;

      return {
        USD: usdTry.toFixed(2),
        EUR: eurTry.toFixed(2),
        GBP: gbpTry.toFixed(2),
        CHF: chfTry.toFixed(2),
        AED: aedTry.toFixed(2),
        JPY_100: jpyTry.toFixed(2),
        date: new Date().toLocaleDateString('tr-TR')
      };
    }
  } catch (e) {
    console.warn('Live currency lookup failed:', e.message);
  }
  return null;
};

/**
 * Fetch live weather for a specific city (Open-Meteo free API)
 */
export const fetchLiveWeatherForCity = async (cityName) => {
  if (!cityName) return null;
  try {
    const cleanName = cityName
      .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '')
      .replace(/[^\p{L}\p{N}\s,-]/gu, '')
      .trim();
    if (cleanName.length < 2) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=tr&format=json`,
      { signal: controller.signal }
    );
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const weatherData = await weatherRes.json();
      if (weatherData && weatherData.current_weather) {
        const cur = weatherData.current_weather;
        let condition = 'Açık ve Güneşli';
        const code = cur.weathercode;
        if (code >= 1 && code <= 3) condition = 'Parçalı Bulutlu';
        else if (code >= 45 && code <= 48) condition = 'Sisli';
        else if (code >= 51 && code <= 67) condition = 'Yağmurlu';
        else if (code >= 71 && code <= 82) condition = 'Karlı';
        else if (code >= 95) condition = 'Gök Gürültülü Fırtınalı';

        const daily = weatherData.daily || {};
        const todayMax = daily.temperature_2m_max?.[0] !== undefined ? `${Math.round(daily.temperature_2m_max[0])}°C` : null;
        const todayMin = daily.temperature_2m_min?.[0] !== undefined ? `${Math.round(daily.temperature_2m_min[0])}°C` : null;

        return {
          city: name,
          country: country,
          temperature: `${Math.round(cur.temperature)}°C`,
          condition: condition,
          windspeed: `${cur.windspeed} km/s`,
          todayMax,
          todayMin
        };
      }
    }
  } catch (e) {
    console.warn('Live weather lookup failed:', e.message);
  }
  return null;
};

/**
 * Extract city candidates from user text & travel context
 */
export const extractCityCandidates = (msg, travelContext) => {
  const list = [];
  if (!msg) return list;

  const cleanWords = msg
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"”’]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3);

  const stopWords = new Set([
    'hava', 'durumu', 'nasil', 'nasıl', 'bugun', 'bugün', 'yarin', 'yarın',
    'derece', 'sicaklik', 'sıcaklık', 'yagmur', 'yağmur', 'gunluk', 'günlük',
    'var', 'yok', 'mi', 'mı', 'mu', 'mü', 'acaba', 'bakar', 'misin', 'mısın',
    'merhaba', 'selam', 'tintin', 'bilgi', 'verir', 'misiniz', 'nedir', 'öğrenmek',
    'göster', 'goster', 'tavsiye', 'eder', 'misiniz'
  ]);

  for (const rawWord of cleanWords) {
    const lower = rawWord.toLowerCase();
    if (stopWords.has(lower)) continue;

    const stripped = rawWord
      .replace(/(['’](da|de|ta|te|ya|ye|a|e|nın|nin|nun|nün|ın|in|un|ün|daki|deki))$/i, '')
      .replace(/(daki|deki)$/i, '')
      .replace(/(da|de|ta|te|nın|nin|nun|nün|ya|ye)$/i, '');

    if (stripped.length >= 3 && !stopWords.has(stripped.toLowerCase())) {
      list.push(stripped);
    }
  }

  if (Array.isArray(travelContext?.allUserTours)) {
    for (const t of travelContext.allUserTours) {
      const dest = t.destination || t.destinations || t.tourName || '';
      const splitCities = dest.split(/\s*[-&,]\s*|\s+ve\s+/i);
      for (const c of splitCities) {
        const cleanC = c.trim();
        if (cleanC.length > 2 && !list.includes(cleanC)) {
          list.push(cleanC);
        }
      }
    }
  }

  return list;
};

/**
 * Generate AI reply using Google Gemini with multi-model fallback and rich travel context
 */
export const generateTintinReply = async ({
  message,
  conversationHistory = [],
  travelContext = {},
  geminiConfig = {}
}) => {
  const apiKey = (geminiConfig?.apiKey || DEFAULT_API_KEY).trim();
  const configuredModel = sanitizeModelName(geminiConfig?.model);
  
  // Ordered model candidates: configured model first, then reliable fallbacks
  const modelCandidates = Array.from(new Set([configuredModel, ...FALLBACK_MODELS]));

  const userMsgLower = (message || '').toLowerCase();

  // 1. Live Weather Lookup if queried
  let liveWeatherContext = '';
  const isWeatherQuery = /hava|yağmur|sıcaklık|derece|güneş|rüzgar|fırtına|kar|weather/i.test(userMsgLower);
  if (isWeatherQuery) {
    const candidateCities = extractCityCandidates(message, travelContext);
    for (const city of candidateCities) {
      const weather = await fetchLiveWeatherForCity(city);
      if (weather) {
        liveWeatherContext = `\n[CANLI GÜNCEL HAVA DURUMU (${weather.city}, ${weather.country})]: Anlık: ${weather.temperature}, Durum: ${weather.condition}, En Yüksek: ${weather.todayMax || '-'}, En Düşük: ${weather.todayMin || '-'}`;
        break;
      }
    }
  }

  // 2. Live Exchange Rate Lookup if queried
  let liveCurrencyContext = '';
  const isCurrencyQuery = /kur|döviz|dolar|euro|avro|sterlin|para birimi|kaç tl|exchange/i.test(userMsgLower);
  if (isCurrencyQuery) {
    const rates = await fetchLiveExchangeRates();
    if (rates) {
      liveCurrencyContext = `\n[CANLI GÜNCEL DÖVİZ KURLARI (${rates.date})]: 1 USD = ~${rates.USD} TL, 1 EUR = ~${rates.EUR} TL, 1 GBP = ~${rates.GBP} TL, 100 JPY = ~${rates.JPY_100} TL`;
    }
  }

  // 3. Build Rich System Prompt
  const defaultSysPrompt = `Sen Move Travel & MICE şirketinin akıllı, kibar ve uzman seyahat asistanı Tintin'sin.
Görevin misafirlerimize seyahatleri boyunca uçuşları, otelleri, transferleri, günlük tur programları, hava durumu, yerel lezzetler ve gezilecek yerler hakkında profesyonel, doğru ve net rehberlik yapmaktır.
KURALLAR:
- ASLA bayrak emojisi veya ülke kodu (us, me, tr vb.) kullanma.
- Emoji kullanımını minimumda tut veya hiç kullanma. Sade, temiz, kurumsal ve ferah bir Türkçe dil kullan.
- Misafirin seyahat bilgilerine (uçuş, otel, tur programı, rehber vb.) sahipsin. Sorulan sorulara elindeki bu gerçek seyahat bilgilerini kullanarak yanıt ver.`;

  const basePrompt = (geminiConfig?.systemPrompt || defaultSysPrompt).trim();

  let contextBlock = `\n\n[MİSAFİR VE SEYAHAT BİLGİLERİ]:\n`;
  contextBlock += `- Misafir Adı: ${travelContext.userName || 'Değerli Misafirimiz'}\n`;
  if (travelContext.userCompany) contextBlock += `- Kurum: ${travelContext.userCompany}\n`;

  if (liveWeatherContext) contextBlock += `${liveWeatherContext}\n`;
  if (liveCurrencyContext) contextBlock += `${liveCurrencyContext}\n`;

  if (Array.isArray(travelContext.allUserTours) && travelContext.allUserTours.length > 0) {
    contextBlock += `\n[MİSAFİRİN KAYITLI SEYAHATLERİ]:\n`;
    travelContext.allUserTours.forEach((t, idx) => {
      contextBlock += `\n--- SEYAHAT #${idx + 1}: ${t.tourName || 'Tur'} ---\n`;
      contextBlock += `- Durum: ${t.status || 'Aktif'}\n`;
      contextBlock += `- Tarihler: ${t.dates || '-'}\n`;
      contextBlock += `- Rota/Destinasyon: ${t.destination || '-'}\n`;

      if (t.hotel) {
        contextBlock += `- Konaklama / Otel: ${t.hotel.name || '-'}\n`;
        if (t.hotel.address) contextBlock += `  Adres: ${t.hotel.address}\n`;
        if (t.hotel.phone) contextBlock += `  Telefon: ${t.hotel.phone}\n`;
      }

      if (t.guide) {
        contextBlock += `- Tur Rehberi / Yetkili: ${t.guide.name || '-'}\n`;
        if (t.guide.phone) contextBlock += `  Rehber Tel: ${t.guide.phone}\n`;
      }

      if (Array.isArray(t.flights) && t.flights.length > 0) {
        contextBlock += `- Uçuş Bilgileri:\n`;
        t.flights.forEach(f => {
          contextBlock += `  * ${f.airline || ''} ${f.flightNumber || ''} (${f.route || ''}) - Tarih/Saat: ${f.date || ''} ${f.departureTime || ''} | PNR: ${f.pnr || '-'}\n`;
        });
      }

      if (Array.isArray(t.dailyProgram) && t.dailyProgram.length > 0) {
        contextBlock += `- Günlük Program:\n`;
        t.dailyProgram.slice(0, 5).forEach(dp => {
          contextBlock += `  * Gün ${dp.dayNumber}: ${dp.title || ''} - ${dp.description || ''}\n`;
        });
      }
    });
  }

  // 4. Build contents array with multi-turn history
  const contents = [
    ...conversationHistory.map(m => ({
      role: m.role || (m.sender === 'user' ? 'user' : 'model'),
      parts: m.parts || [{ text: m.text || '' }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  const geminiPayload = {
    systemInstruction: { parts: [{ text: basePrompt + '\n' + contextBlock }] },
    contents: contents,
    generationConfig: {
      temperature: geminiConfig?.temperature ?? 0.7,
      maxOutputTokens: geminiConfig?.maxTokens ?? 2048
    }
  };

  // 5. Model Execution Loop with timeout and fallback
  let lastError = null;

  for (const model of modelCandidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 sec timeout per model

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return sanitizeAssistantText(data.candidates[0].content.parts[0].text);
      }

      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      console.warn(`Gemini model ${model} failed: ${errMsg}`);
      lastError = new Error(errMsg);
    } catch (modelErr) {
      console.warn(`Gemini model ${model} network error:`, modelErr.message);
      lastError = modelErr;
    }
  }

  throw lastError || new Error('Tintin şu anda yanıt üretemedi. Lütfen tekrar deneyin.');
};

/**
 * Test Gemini API connection with multi-model validation
 */
export const testGeminiConnection = async (apiKey, model) => {
  const cleanKey = (apiKey || DEFAULT_API_KEY).trim();
  const primaryModel = sanitizeModelName(model) || 'gemini-3-flash-preview';

  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemma-4-26b-a4b-it'
  ]));

  let lastError = null;

  for (const m of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const testPayload = {
        contents: [{ role: 'user', parts: [{ text: "Tek kelimeyle 'Bağlantı başarılı' diye cevap ver." }] }],
        generationConfig: { maxOutputTokens: 50, temperature: 0.1 }
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        if (m === primaryModel) {
          return {
            success: true,
            message: `Google Gemini (${m}) bağlantısı başarılı!`,
            model: m
          };
        } else {
          return {
            success: true,
            message: `Google Gemini bağlantısı aktif! (${primaryModel} yoğun olduğu için ${m} ile doğrulandı)`,
            model: m
          };
        }
      }

      if (data?.error?.code === 400 && data?.error?.message?.toLowerCase().includes('api key')) {
        return {
          success: false,
          message: `Geçersiz API Anahtarı: ${data.error.message}`
        };
      }

      lastError = data?.error?.message || `HTTP ${res.status}`;
    } catch (err) {
      lastError = err.message;
    }
  }

  return {
    success: false,
    message: `Gemini bağlantı testi başarısız oldu: ${lastError}`
  };
};

/**
 * Generate AI City Guide with Gemini for any destination
 */
export const generateCityGuideAI = async (cityName, countryName = '', geminiConfig = {}) => {
  const apiKey = (geminiConfig?.apiKey || DEFAULT_API_KEY).trim();
  const primaryModel = sanitizeModelName(geminiConfig?.model) || 'gemini-3-flash-preview';

  const prompt = `Sen Move Travel & MICE kurumsal seyahat rehberi uzmanısın.
${cityName}${countryName ? ' (' + countryName + ')' : ''} şehri için Türkçe, son derece kaliteli ve profesyonel bir seyahat ve şehir rehberi hazırla.
Aşağıdaki JSON formatında yanıt ver:
{
  "summary": "${cityName} hakkında 2-3 cümlelik çekici genel seyahat tanıtımı ve en iyi ziyaret dönemi.",
  "places": [
    { "name": "Mekan Adı", "desc": "1-2 cümlelik ziyaret nedeni ve tarihi/kültürel önemi.", "tag": "Tarih/Sanat/Manzara" }
  ],
  "restaurants": [
    { "name": "Yemek / Restoran Adı", "cuisine": "Mutfak / Tür", "rating": "4.8", "tip": "Denemeniz gereken meşhur lezzet." }
  ],
  "transport": "Havalimanından merkeze ulaşım ve şehir içi metro/otobüs/taksi hakkında kısa ipucu.",
  "tips": [
    "Pratik seyahat ipucu 1",
    "Pratik seyahat ipucu 2",
    "Pratik seyahat ipucu 3"
  ]
}
SADECE geçerli JSON döndür, kod bloğu veya backtick dışında hiçbir metin yazma. ASLA bayrak emojisi veya ülke kodu (us, me, tr vb.) kullanma.`;

  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
    'gemini-3.6-flash'
  ]));

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text.trim();
        text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(text);
        if (parsed && parsed.places && parsed.places.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Gemini city guide model ${model} error:`, e.message);
    }
  }

  return null;
};
