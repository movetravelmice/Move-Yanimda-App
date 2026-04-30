import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ThermometerSun, Landmark, Utensils, Star, Compass, Loader2, Clock } from 'lucide-react';
import Header from '../../components/Header';
import { useTourStore } from '../../store/tourStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function DestinationGuide() {
    const { tourId } = useParams();
    const { tours } = useTourStore();
    const { googlePlacesApiKey } = useSettingsStore();
    
    const tour = tours.find(t => t.id === tourId);
    
    const [weather, setWeather] = useState(null);
    const [places, setPlaces] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [loadingPlaces, setLoadingPlaces] = useState(true);
    const [localTimezone, setLocalTimezone] = useState("Europe/Istanbul");
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!tour) return;
        
        // Extract main city from destinations (e.g. "Paris - Roma" -> "Paris")
        const cityName = tour.destinations ? tour.destinations.split('-')[0].trim() : 'Istanbul';
        
        // Fetch Weather via Open-Meteo
        const fetchWeather = async () => {
            setLoadingWeather(true);
            try {
                // 1. Geocoding
                let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=tr&format=json`);
                let geoData = await geoRes.json();
                
                // Fallback for generic country names like "Fransa" which Open-Meteo might fail to geocode
                if (!geoData.results || geoData.results.length === 0) {
                    const fallbackName = tour.name.split('-')[1] ? tour.name.split('-')[1].split('&')[0].trim() : "Paris";
                    geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fallbackName)}&count=1&language=tr&format=json`);
                    geoData = await geoRes.json();
                }

                if (geoData.results && geoData.results.length > 0) {
                    const { latitude, longitude, timezone } = geoData.results[0];
                    if (timezone) setLocalTimezone(timezone);
                    // 2. Forecast
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
                    const weatherData = await weatherRes.json();
                    
                    if (weatherData.daily) {
                        const todayTemp = Math.round(weatherData.daily.temperature_2m_max[0]);
                        // Mapped simplified weather conditions from WMO code
                        const code = weatherData.daily.weather_code[0];
                        let condition = "Açık";
                        if (code >= 1 && code <= 3) condition = "Parçalı Bulutlu";
                        if (code >= 45 && code <= 48) condition = "Sisli";
                        if (code >= 51 && code <= 67) condition = "Yağmurlu";
                        if (code >= 71 && code <= 82) condition = "Karlı";
                        if (code >= 95) condition = "Fırtınalı";

                        setWeather({
                            temp: `${todayTemp}°C`,
                            condition,
                            forecast: weatherData.daily.temperature_2m_max.map((t, i) => ({
                                date: new Date(weatherData.daily.time[i]).toLocaleDateString('tr-TR', {weekday: 'short'}),
                                max: Math.round(t),
                                min: Math.round(weatherData.daily.temperature_2m_min[i])
                            })).slice(0, 5) // Show next 5 days
                        });
                    }
                } else {
                    // Fallback when city returns zero coordinates (like generic country "Fransa" failing lookup sometimes)
                    setWeather({ temp: "-", condition: "Bulunamadı", forecast: [] });
                }
            } catch (err) {
                console.error("Hava durumu API Hatası:", err);
                setWeather({ temp: "-", condition: "Veri Alınamadı", forecast: [] });
            } finally {
                setLoadingWeather(false);
            }
        };

        fetchWeather();
    }, [tour]);

    useEffect(() => {
        if (!tour) return;
        const cityName = tour.destinations ? tour.destinations.split('-')[0].trim() : 'Istanbul';

        const loadGooglePlaces = () => {
            if (!googlePlacesApiKey) {
                // Fallback demo verisi eğer API key girilmemişse
                setPlaces([{ name: "Lütfen Admin Panelinden", desc: "Google Places API Key Giriniz." }]);
                setRestaurants([{ name: "API Key Eksik", cuisine: "Ayar Gerekli", rating: "-" }]);
                setLoadingPlaces(false);
                return;
            }

            // Script zaten eklenmiş mi kontrol et
            if (!window.google || !window.google.maps) {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${googlePlacesApiKey}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => fetchPlacesData(cityName);
                script.onerror = () => {
                   setPlaces([{ name: "API Yüklenemedi", desc: "Geçersiz API Anahtarı veya Bağlantı Hatası" }]);
                   setRestaurants([]);
                   setLoadingPlaces(false);
                };
                document.head.appendChild(script);
            } else {
                fetchPlacesData(cityName);
            }
        };

        const fetchPlacesData = (city) => {
            const dummyDiv = document.createElement('div');
            const service = new window.google.maps.places.PlacesService(dummyDiv);

            // 1. Places (Attractions)
            service.textSearch({ query: `top tourist attractions in ${city}` }, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setPlaces(results.slice(0, 3).map(p => {
                        let address = p.formatted_address || "Popüler Turistik Mekan";
                        // Strip Google Plus Codes (e.g., 8944+R39,)
                        address = address.replace(/\b[A-Z0-9]{4}\+[A-Z0-9]{2,4}\b,?\s*/g, '');
                        return { name: p.name, desc: address };
                    }));
                } else {
                    setPlaces([{ name: "Sonuç Bulunamadı", desc: "API Limit veya İzin Hatası" }]);
                }

                // 2. Restaurants
                service.textSearch({ query: `best rated restaurants in ${city}` }, (restResults, restStatus) => {
                    if (restStatus === window.google.maps.places.PlacesServiceStatus.OK && restResults) {
                        setRestaurants(restResults.slice(0, 4).map(r => {
                            let cuisine = "Restoran";
                            if (r.types) {
                                // Filter out generic types to get a specific one (e.g. italian_restaurant)
                                const validTypes = r.types.filter(t => !['establishment', 'point_of_interest', 'food', 'restaurant', 'store'].includes(t));
                                if (validTypes.length > 0) {
                                    cuisine = validTypes[0].replace(/_/g, ' ');
                                }
                            }
                            return {
                                name: r.name,
                                cuisine: cuisine,
                                rating: r.rating || "Yeni"
                            };
                        }));
                    } else {
                        setRestaurants([{ name: "Restoran Bulunamadı", cuisine: "Hata", rating: "-" }]);
                    }
                    setLoadingPlaces(false);
                });
            });
        };

        loadGooglePlaces();
    }, [tour, googlePlacesApiKey]);

    if (!tour) {
        return <div style={{padding: '24px', textAlign: 'center'}}>Tur bulunamadı.</div>;
    }

    return (
        <div style={{ paddingBottom: '90px', background: '#fff', minHeight: '100vh' }}>
            <Header title="Şehir Rehberi" showBack />
            
            <div style={{ height: '240px', width: '100%', position: 'relative', backgroundColor: '#e2e8f0' }}>
                <img src={tour.avatar} alt="City Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{tour.destinations}</h2>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.9 }}>
                        <MapPin size={14} /> Canlı Veri Rehberi
                    </p>
                </div>
            </div>

            <div style={{ padding: '24px 20px' }}>
                {/* CLOCK SECTION */}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
                    <Clock size={20} className="text-primary" /> Zaman Dilimi
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Türkiye</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            {currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '16px', border: '1px solid #c7d2fe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Yerel Saat</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {currentTime.toLocaleTimeString('tr-TR', { timeZone: localTimezone, hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* WEATHER SECTION */}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
                    <ThermometerSun size={20} className="text-primary" /> Hava Durumu Göstergesi
                </h3>
                
                {loadingWeather ? (
                   <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', display: 'flex', justifyContent: 'center' }}>
                       <Loader2 className="spin" size={24} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
                   </div>
                ) : weather && (
                   <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#f59e0b' }}>
                              <ThermometerSun size={28} />
                          </div>
                          <div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Şu An</div>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>{weather.temp} - {weather.condition}</div>
                          </div>
                      </div>
                      
                      {weather.forecast && weather.forecast.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                              {weather.forecast.map((day, idx) => (
                                 <div key={idx} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{day.date}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>{day.max}°</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{day.min}°</div>
                                 </div>
                              ))}
                          </div>
                      )}
                   </div>
                )}

                {/* PLACES SECTION */}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
                    <Landmark size={20} className="text-primary" /> Görülecek Yerler (Google Places)
                </h3>
                
                {loadingPlaces ? (
                   <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                       <Loader2 size={24} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                   </div>
                ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                      {places.map((place, idx) => (
                          <div key={idx} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{place.name}</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{place.desc}</div>
                          </div>
                      ))}
                   </div>
                )}

                {/* RESTAURANTS SECTION */}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
                    <Utensils size={20} className="text-primary" /> Popüler Restoranlar
                </h3>
                
                {loadingPlaces ? (
                   <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                       <Loader2 size={24} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                   </div>
                ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      {restaurants.map((rest, idx) => (
                          <div key={idx} style={{ padding: '16px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div>
                                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{rest.name}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: '#f0f2f5', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', textTransform: 'capitalize' }}>{rest.cuisine}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                                  <Star size={14} fill="currentColor" /> {rest.rating}
                              </div>
                          </div>
                      ))}
                   </div>
                )}
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
