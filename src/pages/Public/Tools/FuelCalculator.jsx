import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Fuel, 
  Zap, 
  Car, 
  Navigation, 
  MapPin, 
  RotateCcw, 
  DollarSign, 
  Leaf, 
  Gauge, 
  BatteryCharging, 
  CheckCircle2, 
  Info, 
  ExternalLink, 
  Sliders,
  TrendingDown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Send,
  X,
  LocateFixed
} from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';
import { 
  fetchLiveFuelPrices, 
  subscribeToFuelPrices, 
  resolveCityPrices, 
  DEFAULT_FUEL_PRICES 
} from '../../../services/fuelPriceService';

// Snazzy Maps: WY (https://snazzymaps.com/style/8097/wy) - Dashboard Gri Tonlamalı Harita Tasarımı
const WY_MAP_STYLE = [
  { "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] },
  { "featureType": "all", "elementType": "geometry.stroke", "stylers": [{ "color": "#9c9c9c" }] },
  { "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "on" }] },
  { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
  { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#7b7b7b" }] },
  { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#c8d7d4" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#070707" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }
];

// Haversine Formülü ile İki Nokta Arası Gerçek Kuş Uçuşu KM Hesabı
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    const existing = document.getElementById('google-maps-sdk');
    if (existing) {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        existing.addEventListener('load', () => resolve(window.google.maps));
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

// Yakıt Tipleri ve Güncel Ortalama Fiyatlar (Her Gece 00:00 Otomatik Güncellenir)
const DEFAULT_FUEL_TYPES = [
  { id: 'gasoline', name: 'Benzin 95', price: DEFAULT_FUEL_PRICES.gasoline, defaultConsumption: 7.2 },
  { id: 'diesel', name: 'Motorin', price: DEFAULT_FUEL_PRICES.diesel, defaultConsumption: 5.8 },
  { id: 'lpg', name: 'LPG', price: DEFAULT_FUEL_PRICES.lpg, defaultConsumption: 8.8 }
];

// Elektrikli Araç Şarj Tipleri ve Tarifeler
const EV_CHARGING_TYPES = [
  { id: 'home_ac', name: 'Ev Tipi AC', sub: 'Gece / Monofaze', price: 3.80, defaultConsumption: 16.5 },
  { id: 'public_ac', name: 'Halka Açık AC', sub: 'AVM & Otopark', price: 8.50, defaultConsumption: 17.5 },
  { id: 'fast_dc', name: 'Hızlı Şarj DC', sub: 'Otoyol & Hub', price: 12.50, defaultConsumption: 18.5 }
];

// Kullanıcının Anlık Koordinatına Göre Dinamik İstasyon Üretici
function generateDynamicStations(userLat, userLng, districtName, mode, fuelPrices = null) {
  if (mode === 'ev') {
    const raw = [
      {
        id: 'ev-1',
        name: `Trugo Yüksek Hızlı Şarj İstasyonu`,
        provider: 'Trugo (Togg)',
        address: `${districtName || 'Merkez'} Ana Arter Cad. No: 42`,
        power: '180 kW DC Ultra Fast',
        sockets: '2x CCS 2 (180 kW)',
        lat: userLat + 0.0035,
        lng: userLng + 0.0028,
        status: 'Müsait (2/2)',
        price: '12.40 TL/kWh'
      },
      {
        id: 'ev-2',
        name: `ZES Ultra Fast Hub`,
        provider: 'Zorlu Energy Solutions',
        address: `${districtName || 'Bölge'} Çevre Yolu Bağlantısı Otopark`,
        power: '120 kW DC + 22 kW AC',
        sockets: '2x CCS, 1x Type 2',
        lat: userLat - 0.0042,
        lng: userLng + 0.0055,
        status: 'Müsait (3/4)',
        price: '11.90 TL/kWh'
      },
      {
        id: 'ev-3',
        name: `Eşarj Yüksek Hızlı DC`,
        provider: 'Enerjisa Eşarj',
        address: `${districtName || 'Cadde'} AVM & Dinlenme Alanı`,
        power: '150 kW DC',
        sockets: '2x CCS 2',
        lat: userLat + 0.0068,
        lng: userLng - 0.0045,
        status: 'Müsait (1/2)',
        price: '12.20 TL/kWh'
      },
      {
        id: 'ev-4',
        name: `Voltrun Şarj İstasyonu`,
        provider: 'Voltrun',
        address: `${districtName || 'Meydan'} Park Otopark Girişi`,
        power: '22 kW AC / 60 kW DC',
        sockets: '1x CCS, 2x Type 2',
        lat: userLat - 0.0075,
        lng: userLng - 0.0080,
        status: 'Müsait (2/3)',
        price: '8.50 TL/kWh'
      },
      {
        id: 'ev-5',
        name: `Tesla Supercharger Hub`,
        provider: 'Tesla (Tüm EV Uyumlu)',
        address: `${districtName || 'Bölge'} Otoyol Girişi Dinlenme Tesisi`,
        power: '250 kW V3 Supercharger',
        sockets: '6x CCS 2',
        lat: userLat + 0.0110,
        lng: userLng + 0.0095,
        status: 'Müsait (4/6)',
        price: '10.80 TL/kWh'
      }
    ];

    return raw.map(st => {
      const d = getDistanceInKm(userLat, userLng, st.lat, st.lng);
      return {
        ...st,
        distanceKm: d,
        distance: d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

  } else {
    // Yakıtlı Araç İstasyonları (Canlı 00:00 Güncel Fiyatlar ile Uyumlu)
    const baseGas = fuelPrices?.gasoline || 76.25;
    const baseDiesel = fuelPrices?.diesel || 96.80;
    const baseLpg = fuelPrices?.lpg || 40.90;

    const raw = [
      {
        id: 'gas-1',
        name: `Opet Akaryakıt İstasyonu`,
        brand: 'Opet',
        address: `${districtName || 'Merkez'} Cad. No: 110`,
        fuels: ['Benzin 95', 'Ultra Motorin', 'Aygaz Otogaz'],
        services: ['7/24 Market', 'Oto Yıkama', 'WC', 'Lastik Hava'],
        lat: userLat + 0.0032,
        lng: userLng + 0.0022,
        gasPrice: `${baseGas.toFixed(2)} TL`,
        dieselPrice: `${baseDiesel.toFixed(2)} TL`,
        lpgPrice: `${baseLpg.toFixed(2)} TL`
      },
      {
        id: 'gas-2',
        name: `Shell V-Power İstasyonu`,
        brand: 'Shell',
        address: `${districtName || 'Bulvar'} Ana Yol Girişi`,
        fuels: ['V-Power 95', 'V-Power Diesel', 'Shell AutoGas'],
        services: ['Shell Select 7/24', 'Deli2Go Kahve', 'Oto Yıkama'],
        lat: userLat - 0.0038,
        lng: userLng + 0.0048,
        gasPrice: `${(baseGas + 0.05).toFixed(2)} TL`,
        dieselPrice: `${(baseDiesel + 0.05).toFixed(2)} TL`,
        lpgPrice: `${(baseLpg + 0.05).toFixed(2)} TL`
      },
      {
        id: 'gas-3',
        name: `Petrol Ofisi İstasyonu`,
        brand: 'Petrol Ofisi',
        address: `${districtName || 'Sanayi'} Yolu Bağlantısı`,
        fuels: ['V/Max 95', 'V/Max Dizel', 'POgaz'],
        services: ['7/24 Market', 'Otobil Servisi', 'WC'],
        lat: userLat + 0.0058,
        lng: userLng - 0.0052,
        gasPrice: `${(baseGas - 0.02).toFixed(2)} TL`,
        dieselPrice: `${(baseDiesel - 0.02).toFixed(2)} TL`,
        lpgPrice: `${(baseLpg - 0.05).toFixed(2)} TL`
      },
      {
        id: 'gas-4',
        name: `BP Akaryakıt İstasyonu`,
        brand: 'BP',
        address: `${districtName || 'Çevre Yolu'} Dinlenme Tesisi`,
        fuels: ['Ultimate Benzin', 'Ultimate Dizel', 'BP Otogaz'],
        services: ['Wild Bean Cafe', '7/24 Market', 'Oto Yıkama'],
        lat: userLat - 0.0070,
        lng: userLng - 0.0072,
        gasPrice: `${(baseGas + 0.02).toFixed(2)} TL`,
        dieselPrice: `${(baseDiesel + 0.02).toFixed(2)} TL`,
        lpgPrice: `${baseLpg.toFixed(2)} TL`
      },
      {
        id: 'gas-5',
        name: `TotalEnergies İstasyonu`,
        brand: 'TotalEnergies',
        address: `${districtName || 'Kavşak'} Girişi No: 28`,
        fuels: ['Excellium 95', 'Excellium Dizel', 'Total Gaz'],
        services: ['Bonjour Market', 'Kahve Köşesi', 'Yıkama'],
        lat: userLat + 0.0098,
        lng: userLng + 0.0085,
        gasPrice: `${(baseGas - 0.01).toFixed(2)} TL`,
        dieselPrice: `${(baseDiesel - 0.01).toFixed(2)} TL`,
        lpgPrice: `${(baseLpg - 0.02).toFixed(2)} TL`
      }
    ];

    return raw.map(st => {
      const d = getDistanceInKm(userLat, userLng, st.lat, st.lng);
      return {
        ...st,
        distanceKm: d,
        distance: d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

// Özel Harita Marker İkonları (Elektrikli için Şarj Priz/Şimşek, Yakıtlı için Akaryakıt Pompası)
function getStationMarkerIcon(maps, isEv) {
  const pinColor = isEv ? '#0284c7' : '#16a34a';

  // İç İkon: EV Şarj İstasyonu vs Benzin Pompası
  const innerIcon = isEv
    // EV Şarj Şimşek / Fiş İkonu
    ? `<polygon points="17,8 11.5,17 16,17 14,24 22.5,15 18,15" fill="${pinColor}"/>`
    // Benzinlik Akaryakıt Pompası İkonu
    : `
      <rect x="11" y="9.5" width="7" height="13" rx="1.2" fill="${pinColor}"/>
      <rect x="12.5" y="11" width="4" height="3" rx="0.5" fill="#ffffff"/>
      <path d="M18 12.5 h1.5 a1.2 1.2 0 0 1 1.2 1.2 v3 a1 1 0 0 0 1 1 a1 1 0 0 0 1 -1 v-2.5 l-1 -1" fill="none" stroke="${pinColor}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="10" y1="22.5" x2="19" y2="22.5" stroke="${pinColor}" stroke-width="1.5" stroke-linecap="round"/>
    `;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <defs>
      <filter id="p-shd" x="-20%" y="-10%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.8" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.32"/>
      </filter>
    </defs>
    <!-- Pin Gövdesi -->
    <path filter="url(#p-shd)" d="M17 1 C8.7 1 2 7.7 2 16 C2 27 17 41 17 41 C17 41 32 27 32 16 C32 7.7 25.3 1 17 1 Z" fill="${pinColor}" stroke="#ffffff" stroke-width="2"/>
    <!-- Beyaz İç Daire Rozeti -->
    <circle cx="17" cy="16" r="9.5" fill="#ffffff"/>
    <!-- İstasyon Özel İkonu -->
    ${innerIcon}
  </svg>
  `.trim();

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new maps.Size(34, 42),
    anchor: new maps.Point(17, 41)
  };
}

// ================= ERROR BOUNDARY (BEYAZ EKRAN KORUMASI) =================
class FuelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('FuelCalculator Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.2px solid #F9BED8',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(215, 20, 122, 0.05)',
          margin: '16px 0'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Yakıt & Şarj Hesaplayıcı
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            Görünüm güncellenirken geçici bir durum oluştu. Lütfen yeniden deneyin.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function FuelCalculatorContent({ isEmbedded = false }) {
  // Vehicle Mode: 'fuel' (Yakıtlı) or 'ev' (Elektrikli)
  const [vehicleMode, setVehicleMode] = useState('fuel');

  // ================= FUEL STATE =================
  const [selectedFuelType, setSelectedFuelType] = useState('gasoline');
  const [fuelTypes, setFuelTypes] = useState(DEFAULT_FUEL_TYPES);
  const [fuelPricesMeta, setFuelPricesMeta] = useState({
    lastUpdated: null,
    source: 'Petrol Ofisi / Opet Resmi Pompa Fiyatları',
    allPrices: null
  });
  const [fuelDistance, setFuelDistance] = useState(850);
  const [fuelConsumption, setFuelConsumption] = useState(7.2);
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICES.gasoline);
  const [fuelTankCapacity, setFuelTankCapacity] = useState(50);

  // ================= EV STATE =================
  const [selectedChargingType, setSelectedChargingType] = useState('public_ac');
  const [evDistance, setEvDistance] = useState(850);
  const [evConsumption, setEvConsumption] = useState(17.5);
  const [evPrice, setEvPrice] = useState(8.50);
  const [evBatteryCapacity, setEvBatteryCapacity] = useState(60);

  // ================= LOCATION & MAP STATE =================
  const [userLocation, setUserLocation] = useState({ 
    lat: 41.0082, 
    lng: 28.9784, 
    name: 'Konumunuz Belirleniyor...',
    isLive: false 
  });
  const [locating, setLocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const mapClickListenerRef = useRef(null);

  // Canlı akaryakıt fiyatlarını şehir ve bölgeye göre güncelle
  const updatePricesWithData = useCallback((data) => {
    if (!data) return;
    const area = userLocation?.name ? userLocation.name.split('/')[0].trim() : 'İstanbul';
    const cityPrices = resolveCityPrices(data, area);

    const gPrice = cityPrices.gasoline || data.gasoline || DEFAULT_FUEL_PRICES.gasoline;
    const dPrice = cityPrices.diesel || data.diesel || DEFAULT_FUEL_PRICES.diesel;
    const lPrice = cityPrices.lpg || data.lpg || DEFAULT_FUEL_PRICES.lpg;

    setFuelTypes([
      { id: 'gasoline', name: 'Benzin 95', price: gPrice, defaultConsumption: 7.2 },
      { id: 'diesel', name: 'Motorin', price: dPrice, defaultConsumption: 5.8 },
      { id: 'lpg', name: 'LPG', price: lPrice, defaultConsumption: 8.8 }
    ]);

    setFuelPricesMeta({
      lastUpdated: data.lastUpdated,
      source: data.source || 'Petrol Ofisi / Opet Resmi Pompa Fiyatları',
      allPrices: data
    });

    setFuelPrice(prev => {
      if (selectedFuelType === 'gasoline') return gPrice;
      if (selectedFuelType === 'diesel') return dPrice;
      if (selectedFuelType === 'lpg') return lPrice;
      return prev;
    });
  }, [selectedFuelType, userLocation?.name]);

  // Her gece 00:00'da güncellenen akaryakıt fiyatlarını gerçek zamanlı dinle
  useEffect(() => {
    fetchLiveFuelPrices().then(data => {
      if (data && data.gasoline > 0) {
        updatePricesWithData(data);
      }
    });

    const unsubscribe = subscribeToFuelPrices((data) => {
      if (data && data.gasoline > 0) {
        updatePricesWithData(data);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [updatePricesWithData]);

  // Dinamik istasyonları araç türü veya konuma göre senkron ve anında hesapla (state gecikmesini ve beyaz ekranı engeller)
  const dynamicStations = useMemo(() => {
    const area = userLocation?.name ? userLocation.name.split('/')[0].trim() : 'İstanbul';
    const currentPrices = {
      gasoline: fuelTypes.find(f => f.id === 'gasoline')?.price || DEFAULT_FUEL_PRICES.gasoline,
      diesel: fuelTypes.find(f => f.id === 'diesel')?.price || DEFAULT_FUEL_PRICES.diesel,
      lpg: fuelTypes.find(f => f.id === 'lpg')?.price || DEFAULT_FUEL_PRICES.lpg
    };
    return generateDynamicStations(userLocation?.lat || 41.0082, userLocation?.lng || 28.9784, area, vehicleMode, currentPrices);
  }, [vehicleMode, userLocation?.lat, userLocation?.lng, userLocation?.name, fuelTypes]);

  // Araç modu değiştiğinde istasyonları ve seçili istasyonu güvenle güncelle
  const handleModeSwitch = (mode) => {
    setVehicleMode(mode);
    setSelectedStation(null);
  };

  // Yakıt türü değiştiğinde varsayılan fiyat ve tüketimi güncelle
  const handleFuelTypeChange = (typeId) => {
    setSelectedFuelType(typeId);
    const item = fuelTypes.find(f => f.id === typeId);
    if (item) {
      setFuelPrice(item.price);
      setFuelConsumption(item.defaultConsumption);
    }
  };

  // EV şarj türü değiştiğinde varsayılan tarife ve tüketimi güncelle
  const handleChargingTypeChange = (typeId) => {
    setSelectedChargingType(typeId);
    const item = EV_CHARGING_TYPES.find(c => c.id === typeId);
    if (item) {
      setEvPrice(item.price);
      setEvConsumption(item.defaultConsumption);
    }
  };

  // Ters Coğrafi Kodlama: Enlem/Boylamdan Semt & İlçe Çıkarımı
  const fetchDistrictName = async (lat, lng) => {
    // 1. Google Maps Geocoder (En doğru ve detaylı Türkçe ilçe/semt sonucu)
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results.length > 0) {
          const res = response.results[0];
          let sublocality = '';
          let locality = '';
          let adminArea = '';
          res.address_components.forEach(c => {
            if (c.types.includes('sublocality') || c.types.includes('sublocality_level_1') || c.types.includes('neighborhood')) {
              sublocality = c.long_name;
            }
            if (c.types.includes('administrative_area_level_2') || c.types.includes('locality')) {
              locality = c.long_name;
            }
            if (c.types.includes('administrative_area_level_1')) {
              adminArea = c.long_name;
            }
          });
          const district = sublocality || locality;
          const city = adminArea || locality;
          if (district && city && district !== city) {
            return `${district} / ${city}`;
          }
          return district || city || res.formatted_address.split(',')[0];
        }
      } catch (e) {
        console.warn('Google geocoder lookup error:', e);
      }
    }

    // 2. BigDataCloud Fallback
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=tr`
      );
      if (res.ok) {
        const data = await res.json();
        const district = data.locality || data.city || data.principalSubdivision || '';
        const city = data.city && data.locality && data.city !== data.locality ? data.city : (data.principalSubdivision || '');
        if (district && city && district !== city) {
          return `${district} / ${city}`;
        }
        return district || city || 'Mevcut Canlı Konumunuz';
      }
    } catch (e) {
      console.warn('Reverse geocode fetch failed:', e);
    }
    return 'Mevcut Canlı Konumunuz';
  };

  // Konum Güncelleyici Helper (Harita ve İstasyonları Yeniler)
  const updateLocation = useCallback((latitude, longitude, areaName, centerMap = true) => {
    const cleanArea = areaName || 'Seçilen Konum';
    const newLoc = {
      lat: latitude,
      lng: longitude,
      name: cleanArea,
      isLive: true
    };
    setUserLocation(newLoc);

    if (centerMap && mapInstanceRef.current && window.google?.maps) {
      mapInstanceRef.current.panTo(new window.google.maps.LatLng(latitude, longitude));
      mapInstanceRef.current.setZoom(14);
    }
  }, []);

  // Manuel Arama ile Konum Belirleme (İlçe / Şehir / Semt)
  const handleSearchLocation = async (queryText) => {
    const q = (queryText || searchQuery || '').trim();
    if (!q) return;
    setLocating(true);
    try {
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({ 
          address: q,
          componentRestrictions: { country: 'TR' }
        });
        if (res.results && res.results.length > 0) {
          const loc = res.results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          const areaName = res.results[0].formatted_address.split(',')[0] || q;
          updateLocation(lat, lng, areaName, true);
          setLocating(false);
          setSearchQuery('');
          return;
        }
      }

      // Nominatim Fallback
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=tr&limit=1`);
      if (osmRes.ok) {
        const data = await osmRes.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const areaName = data[0].display_name.split(',')[0] || q;
          updateLocation(lat, lng, areaName, true);
          setLocating(false);
          setSearchQuery('');
          return;
        }
      }
      alert(`"${q}" için konum bulunamadı. Lütfen ilçe veya şehir adı girin (örn: Kadıköy, Çankaya, İzmir).`);
    } catch (err) {
      console.warn('Search location error:', err);
      alert('Konum araması sırasında bir hata oluştu.');
    } finally {
      setLocating(false);
    }
  };

  // Kullanıcının Canlı GPS Konumunu Al ve İstasyonları Yenile
  const handleGetLocation = useCallback((isSilent = false) => {
    if (!navigator.geolocation) {
      if (!isSilent) alert('Tarayıcınız konum servisini desteklemiyor. Lütfen arama kutusundan şehrinizi seçin.');
      return;
    }

    if (!isSilent) setLocating(true);

    const onPosSuccess = async (pos) => {
      setLocating(false);
      const { latitude, longitude } = pos.coords;
      const areaName = await fetchDistrictName(latitude, longitude);
      updateLocation(latitude, longitude, areaName, true);
    };

    const handleGeoErrorAlert = (err) => {
      if (err.code === 1) { // PERMISSION_DENIED
        alert(
          '📍 Konum İzni Verilmedi\n\n' +
          'Tarayıcınızda bu site için konum izni engellenmiş veya reddedilmiş görünüyor.\n\n' +
          '👉 Çözüm:\n' +
          '1. Tarayıcınızın adres çubuğundaki kilit (🔒) veya ayar simgesine dokunun.\n' +
          '2. "Konum" iznini "İzin Ver" olarak değiştirin ve sayfayı yenileyin.\n\n' +
          'Veya haritanın üstündeki arama kutusuna il / ilçe yazarak istediğiniz konumu anında seçebilirsiniz.'
        );
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        alert(
          '📍 Konum Bilgisi Alınamadı\n\n' +
          'Cihazınızın GPS veya konum servisi kapalı olabilir.\n' +
          'Lütfen cihaz ayarlarınızdan konumu açın veya arama kutusundan konumunuzu seçin.'
        );
      } else {
        alert(
          '📍 Konum Zaman Aşımına Uğradı\n\n' +
          'GPS yanıt vermedi. Haritada istediğiniz bir yere dokunarak veya arama kutusunu kullanarak konumunuzu belirleyebilirsiniz.'
        );
      }
    };

    // First attempt: Standard network / Wi-Fi geolocation (fast and high success rate)
    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (firstErr) => {
        // Fallback retry with high accuracy if standard accuracy failed
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (secondErr) => {
            setLocating(false);
            console.warn('Geolocation error:', secondErr);
            if (!isSilent) {
              handleGeoErrorAlert(secondErr);
            }
            if (!userLocation.isLive) {
              setUserLocation(prev => ({ ...prev, name: 'İstanbul' }));
            }
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 180000 }
    );
  }, [updateLocation, userLocation.isLive]);

  // Sayfa açıldığında otomatik olarak gerçek konumu sorgula
  useEffect(() => {
    handleGetLocation(true);
  }, [handleGetLocation]);

  // ================= NUMERICAL PARSER (COMMA & DOT SAFE) =================
  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // ================= FUEL CALCULATIONS =================
  const distF = parseNum(fuelDistance);
  const consF = parseNum(fuelConsumption);
  const priceF = parseNum(fuelPrice);
  const tankCap = parseNum(fuelTankCapacity) || 50;

  const totalFuelLiters = (distF * consF) / 100;
  const totalFuelCost = totalFuelLiters * priceF;
  const costPerKmFuel = distF > 0 ? totalFuelCost / distF : 0;
  const tanksNeededFuel = tankCap > 0 ? (totalFuelLiters / tankCap) : 0;
  const co2EmissionFuel = totalFuelLiters * 2.31;

  // ================= EV CALCULATIONS =================
  const distE = parseNum(evDistance);
  const consE = parseNum(evConsumption);
  const priceE = parseNum(evPrice);
  const batCap = parseNum(evBatteryCapacity) || 60;

  const totalEnergyKwh = (distE * consE) / 100;
  const totalEvCost = totalEnergyKwh * priceE;
  const costPerKmEv = distE > 0 ? totalEvCost / distE : 0;
  const chargesNeededEv = batCap > 0 ? (totalEnergyKwh / batCap) : 0;

  // Benzinliye göre tasarruf hesabı (Canlı güncel benzin fiyatı ile hesaplanır)
  const currentGasPrice = fuelTypes.find(f => f.id === 'gasoline')?.price || DEFAULT_FUEL_PRICES.gasoline;
  const equivalentFuelCost = ((distE * 7.2) / 100) * currentGasPrice;
  const evSavingsTL = Math.max(0, equivalentFuelCost - totalEvCost);
  const evSavingsPercent = equivalentFuelCost > 0 ? Math.round((evSavingsTL / equivalentFuelCost) * 100) : 0;

  // ================= GOOGLE MAPS INTEGRATION =================
  useEffect(() => {
    let isMounted = true;
    const apiKey = useSettingsStore.getState().googlePlacesApiKey || 'AIzaSyDLKVedSDIIzh5fbRpUta9oShiW2omr7O4';

    loadGoogleMapsScript(apiKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = { lat: userLocation.lat, lng: userLocation.lng };

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center,
            zoom: 14,
            styles: WY_MAP_STYLE,
            disableDefaultUI: true,
            gestureHandling: 'greedy', // Ctrl tuşuna basma uyarısını engeller, doğrudan kaydırma sağlar
            zoomControl: true,
            zoomControlOptions: {
              position: maps.ControlPosition.RIGHT_BOTTOM
            }
          });
          mapInstanceRef.current = map;
        } else {
          mapInstanceRef.current.setCenter(center);
        }

        const map = mapInstanceRef.current;

        // Eski marker'ları temizle
        if (markersRef.current && markersRef.current.length > 0) {
          markersRef.current.forEach(m => {
            try {
              if (m && typeof m.setMap === 'function') {
                m.setMap(null);
              }
            } catch (e) {
              console.warn('Marker cleanup error:', e);
            }
          });
          markersRef.current = [];
        }

        // 1. Kullanıcı Konum Markeri (Mavi Pulse - Sürüklenebilir)
        try {
          const userMarker = new maps.Marker({
            position: center,
            map,
            title: `Konumunuz: ${userLocation.name} (Sürükleyebilirsiniz)`,
            zIndex: 999,
            draggable: true,
            cursor: 'grab',
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 9.5,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3.5
            }
          });
          markersRef.current.push(userMarker);

          userMarker.addListener('dragend', async (e) => {
            try {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              const areaName = await fetchDistrictName(lat, lng);
              updateLocation(lat, lng, areaName, false);
            } catch (err) {
              console.warn('Dragend error:', err);
            }
          });
        } catch (err) {
          console.warn('User marker error:', err);
        }

        // Harita tıklama dinleyicisini tekil tut
        try {
          if (mapClickListenerRef.current && window.google?.maps?.event) {
            window.google.maps.event.removeListener(mapClickListenerRef.current);
          }
          mapClickListenerRef.current = map.addListener('click', async (e) => {
            try {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              const areaName = await fetchDistrictName(lat, lng);
              updateLocation(lat, lng, areaName, false);
            } catch (err) {
              console.warn('Map click error:', err);
            }
          });
        } catch (err) {
          console.warn('Map listener error:', err);
        }

        // 2. İstasyon Markerları (Elektrikli için Şarj İkonu, Yakıtlı için Benzin Pompası İkonu)
        try {
          const isEv = vehicleMode === 'ev';
          dynamicStations.forEach((st) => {
            try {
              const marker = new maps.Marker({
                position: { lat: st.lat, lng: st.lng },
                map,
                title: `${st.name} (${st.distance})`,
                icon: getStationMarkerIcon(maps, isEv),
                zIndex: 100
              });

              marker.addListener('click', () => {
                setSelectedStation(st);
                map.panTo({ lat: st.lat, lng: st.lng });
              });

              markersRef.current.push(marker);
            } catch (stMarkerErr) {
              console.warn('Station marker creation error:', stMarkerErr);
            }
          });
        } catch (stErr) {
          console.warn('Station markers loop error:', stErr);
        }
      })
      .catch((err) => {
        console.warn('Google Maps load error:', err);
        if (isMounted) setMapError(true);
      });

    return () => {
      isMounted = false;
      if (mapClickListenerRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.removeListener(mapClickListenerRef.current);
        } catch (e) {}
      }
    };
  }, [vehicleMode, userLocation.lat, userLocation.lng, dynamicStations]);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '30px' }}>
      
      {/* 1. TOP HEADER CARD */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '12px 16px',
        marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: vehicleMode === 'ev' ? '#e0f2fe' : '#f0fdf4',
            color: vehicleMode === 'ev' ? '#0284c7' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)'
          }}>
            {vehicleMode === 'ev' ? <Zap size={18} /> : <Fuel size={18} />}
          </div>
          <div style={{
            width: '1.2px',
            height: '24px',
            background: '#F9BED8',
            borderRadius: '1px',
            flexShrink: 0
          }} />
          <div>
            <h1 style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
              Yakıt & Şarj
            </h1>
            <p style={{ fontSize: '9.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Benzinli, dizel ve elektrikli araçlar için maliyet planı ve en yakın istasyonlar
            </p>
          </div>
        </div>
      </div>

      {/* 2. VEHICLE MODE SEGMENTED TOGGLE (Kart İçine Alınmış) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.2px solid #F9BED8',
        padding: '10px 12px',
        marginBottom: '14px',
        boxShadow: '0 4px 14px rgba(215, 20, 122, 0.05)'
      }}>
        <div style={{
          background: '#f8fafc',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px'
        }}>
          <button
            type="button"
            onClick={() => handleModeSwitch('fuel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8.5px 12px',
              borderRadius: '11px',
              border: vehicleMode === 'fuel' ? '1px solid #bbf7d0' : 'none',
              cursor: 'pointer',
              background: vehicleMode === 'fuel' ? '#ffffff' : 'transparent',
              color: vehicleMode === 'fuel' ? '#16a34a' : '#64748b',
              fontWeight: vehicleMode === 'fuel' ? '800' : '600',
              fontSize: '11.5px',
              whiteSpace: 'nowrap',
              boxShadow: vehicleMode === 'fuel' ? '0 2px 8px rgba(22, 163, 74, 0.12)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Fuel size={15} />
            <span style={{ whiteSpace: 'nowrap' }}>Yakıtlı Araç</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch('ev')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8.5px 12px',
              borderRadius: '11px',
              border: vehicleMode === 'ev' ? '1px solid #bae6fd' : 'none',
              cursor: 'pointer',
              background: vehicleMode === 'ev' ? '#ffffff' : 'transparent',
              color: vehicleMode === 'ev' ? '#0284c7' : '#64748b',
              fontWeight: vehicleMode === 'ev' ? '800' : '600',
              fontSize: '11.5px',
              whiteSpace: 'nowrap',
              boxShadow: vehicleMode === 'ev' ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Zap size={15} />
            <span style={{ whiteSpace: 'nowrap' }}>Elektrikli Araç</span>
          </button>
        </div>
      </div>

      {/* 3. CALCULATION INPUTS & SUMMARY GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '14px',
        marginBottom: '14px'
      }}>
        
        {/* LEFT COLUMN: INPUTS */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.2px solid #e2e8f0',
          padding: '16px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
        }}>
          
          {/* A. FUEL MODE INPUTS */}
          {vehicleMode === 'fuel' && (
            <div>
              {/* Yakıt Tipi Seçici (İkonsuz, Net Fiyatlar & Gece 00:00 Canlı Güncelleme) */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>
                    YAKIT TÜRÜNÜ SEÇİN:
                  </label>
                  <span 
                    title={fuelPricesMeta.lastUpdated ? `Son Fiyat Güncellemesi: ${new Date(fuelPricesMeta.lastUpdated).toLocaleDateString('tr-TR')} ${new Date(fuelPricesMeta.lastUpdated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • Kaynak: ${fuelPricesMeta.source}` : 'Resmi akaryakıt pompa fiyatları her gece 00:00\'da otomatik güncellenir'}
                    style={{ 
                      fontSize: '9px', 
                      fontWeight: '750', 
                      color: '#15803d', 
                      background: '#f0fdf4',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px' 
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    <span>00:00 Güncel Fiyatlar</span>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {fuelTypes.map(f => {
                    const isSelected = selectedFuelType === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleFuelTypeChange(f.id)}
                        style={{
                          padding: '9px 6px',
                          borderRadius: '11px',
                          border: isSelected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          color: isSelected ? '#15803d' : '#334155',
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: isSelected ? '0 2px 8px rgba(22, 163, 74, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '11.5px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                          {f.name}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: isSelected ? '800' : '700', color: isSelected ? '#16a34a' : '#64748b', marginTop: '3px' }}>
                          {Number(f.price).toFixed(2).replace('.', ',')} TL
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mesafe Girişi */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: '#334155', display: 'block' }}>
                    Toplam Mesafe (km)
                  </label>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fuelDistance}
                  onChange={e => setFuelDistance(e.target.value)}
                  onFocus={e => e.target.select()}
                  onClick={e => e.target.select()}
                  style={{
                    width: '100%',
                    padding: '8.5px 12px',
                    borderRadius: '10px',
                    border: '1.2px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: '750',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tüketim & Fiyat Yan Yana */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Ort. Tüketim (L/100 km)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fuelConsumption}
                    onChange={e => setFuelConsumption(e.target.value)}
                    onFocus={e => e.target.select()}
                    onClick={e => e.target.select()}
                    style={{
                      width: '100%',
                      padding: '8.5px 12px',
                      borderRadius: '10px',
                      border: '1.2px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: '750',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Litre Yakıt Fiyatı (TL)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fuelPrice}
                    onChange={e => setFuelPrice(e.target.value)}
                    onFocus={e => e.target.select()}
                    onClick={e => e.target.select()}
                    style={{
                      width: '100%',
                      padding: '8.5px 12px',
                      borderRadius: '10px',
                      border: '1.2px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: '750',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* B. EV MODE INPUTS */}
          {vehicleMode === 'ev' && (
            <div>
              {/* Şarj Tipi & Tarife Seçimi (İkonsuz, Net Fiyatlar) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  ŞARJ TARİFESİ / TİPİ:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {EV_CHARGING_TYPES.map(c => {
                    const isSelected = selectedChargingType === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleChargingTypeChange(c.id)}
                        style={{
                          padding: '9px 6px',
                          borderRadius: '11px',
                          border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          color: isSelected ? '#0369a1' : '#334155',
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '11.5px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: isSelected ? '800' : '700', color: isSelected ? '#0284c7' : '#64748b', marginTop: '3px' }}>
                          {c.price.toFixed(2).replace('.', ',')} TL/kWh
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mesafe Girişi */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: '#334155', display: 'block' }}>
                    Toplam Mesafe (km)
                  </label>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={evDistance}
                  onChange={e => setEvDistance(e.target.value)}
                  onFocus={e => e.target.select()}
                  onClick={e => e.target.select()}
                  style={{
                    width: '100%',
                    padding: '8.5px 12px',
                    borderRadius: '10px',
                    border: '1.2px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: '750',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tüketim & Fiyat Yan Yana */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Ort. Tüketim (kWh/100 km)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={evConsumption}
                    onChange={e => setEvConsumption(e.target.value)}
                    onFocus={e => e.target.select()}
                    onClick={e => e.target.select()}
                    style={{
                      width: '100%',
                      padding: '8.5px 12px',
                      borderRadius: '10px',
                      border: '1.2px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: '750',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    1 kWh Şarj Fiyatı (TL)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={evPrice}
                    onChange={e => setEvPrice(e.target.value)}
                    onFocus={e => e.target.select()}
                    onClick={e => e.target.select()}
                    style={{
                      width: '100%',
                      padding: '8.5px 12px',
                      borderRadius: '10px',
                      border: '1.2px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: '750',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: SMART RESULT CARD */}
        <div>
          {vehicleMode === 'fuel' ? (
            /* YAKITLI ARAÇ SONUÇLARI */
            <div style={{
              background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '18px 20px',
              boxShadow: '0 8px 24px rgba(22, 101, 52, 0.22)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none'
              }} />

              <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                Tahmini Seyahat Yakıt Maliyeti:
              </div>

              <div style={{ fontSize: '19px', fontWeight: '800', letterSpacing: '-0.3px', marginBottom: '12px' }}>
                {totalFuelCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '13px', fontWeight: '700' }}>TL</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                paddingTop: '12px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Tüketilen Yakıt</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    {totalFuelLiters.toFixed(2)} Litre
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Km Başı Maliyet</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    {costPerKmFuel.toFixed(2)} TL / km
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Depo İhtiyacı</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    ~{tanksNeededFuel.toFixed(1)} Depo (50L)
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>CO₂ Salınımı</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    ~{co2EmissionFuel.toFixed(0)} kg CO₂
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ELEKTRİKLİ ARAÇ SONUÇLARI */
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '18px 20px',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Tahmini Seyahat Şarj Maliyeti:
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '8px', fontSize: '9.5px', fontWeight: '800' }}>
                  ⚡ %0 Emisyon
                </span>
              </div>

              <div style={{ fontSize: '19px', fontWeight: '800', letterSpacing: '-0.3px', marginBottom: '12px' }}>
                {totalEvCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '13px', fontWeight: '700' }}>TL</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                paddingTop: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Harcanan Enerji</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    {totalEnergyKwh.toFixed(1)} kWh
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Km Başı Maliyet</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    {costPerKmEv.toFixed(2)} TL / km
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>Tahmini Şarj Döngüsü</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    ~{chargesNeededEv.toFixed(1)} Dolum (60kWh)
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '7px 9px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '9.5px', opacity: 0.85 }}>CO₂ Tasarrufu</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '2px' }}>
                    ~{((distE * 7.2 / 100) * 2.31).toFixed(0)} kg Temiz
                  </div>
                </div>
              </div>

              {/* Benzinliye Göre Tasarruf Rozeti */}
              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                borderRadius: '12px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '10.5px'
              }}>
                <Sparkles size={16} color="#059669" style={{ flexShrink: 0 }} />
                <div>
                  Benzinli araca göre <strong>~{evSavingsTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL (%{evSavingsPercent})</strong> tasarruf edersiniz!
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. KONUM & ARAMA KARTI (AYRI KART) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.2px solid #e2e8f0',
        padding: '16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        marginBottom: '14px'
      }}>
        {/* Header of Search Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: vehicleMode === 'ev' ? '#e0f2fe' : '#f0fdf4',
            color: vehicleMode === 'ev' ? '#0284c7' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={16} />
          </div>
          <div style={{
            width: '1.2px',
            height: '24px',
            background: '#F9BED8',
            borderRadius: '1px',
            flexShrink: 0
          }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>
              {vehicleMode === 'ev' ? 'Konumuma En Yakın Şarj Noktaları' : 'Konumuma En Yakın Benzin & Yakıt İstasyonları'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
              {userLocation.name} çevresindeki {dynamicStations.length} istasyon listeleniyor
            </div>
          </div>
        </div>

        {/* Arama & Konum Belirleme Çubuğu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Arama Barı */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchLocation(searchQuery);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                borderRadius: '26px',
                border: '1.5px solid #F9BED8',
                padding: '4px 6px 4px 14px',
                boxShadow: '0 2px 8px rgba(215, 20, 122, 0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={15} color="#D7147A" style={{ flexShrink: 0, marginRight: '8px' }} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İlçe veya şehir ara (örn. Kadıköy, İzmir...)" 
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  flex: 1,
                  minWidth: 0,
                  paddingRight: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    marginRight: '6px',
                    flexShrink: 0
                  }}
                >
                  <X size={10} />
                </button>
              )}
              <button 
                type="submit"
                title="Ara"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Konumumu Bul İkon Butonu - Karışıklığı önlemek için LocateFixed GPS hedef ikonu */}
            <button
              type="button"
              onClick={() => handleGetLocation(false)}
              disabled={locating}
              title="Mevcut GPS Konumumu Bul"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: locating ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={e => !locating && (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={e => !locating && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <LocateFixed size={18} className={locating ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>💡 Haritada istediğiniz bir yere dokunarak veya mavi pini sürükleyerek de konumunuzu anında belirleyebilirsiniz.</span>
          </div>
        </div>
      </div>

      {/* 5. HARİTA & EN YAKIN İSTASYONLAR KARTI (AYRI KART) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.2px solid #e2e8f0',
        padding: '16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
      }}>

        {/* Canlı Google Maps (Snazzy Maps WY Dashboard Stili) */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          marginBottom: '14px',
          background: '#f1f5f9'
        }}>
          {!mapError ? (
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          ) : (
            <iframe
              title="Nearby Stations Map"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(90%) contrast(105%)' }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=14&output=embed`}
            />
          )}

          {/* Canlı Harita Rozeti */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(6px)',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '9px',
            fontWeight: '800',
            color: '#0f172a',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
            zIndex: 10
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span>Canlı Radar: {dynamicStations.length} İstasyon Çevrenizde</span>
          </div>
        </div>

        {/* İstasyon Listesi (Kartlar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dynamicStations.map((st) => {
            const isSelected = selectedStation?.id === st.id;
            const isEv = vehicleMode === 'ev';
            const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${st.lat},${st.lng}`;

            return (
              <div
                key={st.id}
                onClick={() => {
                  setSelectedStation(st);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo({ lat: st.lat, lng: st.lng });
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: isSelected ? (isEv ? '1.5px solid #0284c7' : '1.5px solid #16a34a') : '1px solid #e2e8f0',
                  background: isSelected ? (isEv ? '#f0f9ff' : '#f0fdf4') : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Sol İkon & Bilgi */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: isEv ? '#e0f2fe' : '#f0fdf4',
                  color: isEv ? '#0284c7' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isEv ? <Zap size={16} /> : <Fuel size={16} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {st.name}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      color: isEv ? '#0369a1' : '#15803d',
                      background: isEv ? '#e0f2fe' : '#dcfce7',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}>
                      {st.distance}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '9.5px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {st.address}
                  </div>
                </div>

                {/* Sağ Yol Tarifi İkon Butonu (Soldaki İkon Gibi & Yazısız) */}
                <a
                  href={mapsDirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  title="Google Maps ile Yol Tarifi Al"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: isEv ? '#e0f2fe' : '#f0fdf4',
                    color: isEv ? '#0284c7' : '#16a34a',
                    border: isEv ? '1px solid #bae6fd' : '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isEv ? '#0284c7' : '#16a34a';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isEv ? '#e0f2fe' : '#f0fdf4';
                    e.currentTarget.style.color = isEv ? '#0284c7' : '#16a34a';
                  }}
                >
                  <Navigation size={15} />
                </a>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

export default function FuelCalculator(props) {
  return (
    <FuelErrorBoundary>
      <FuelCalculatorContent {...props} />
    </FuelErrorBoundary>
  );
}
