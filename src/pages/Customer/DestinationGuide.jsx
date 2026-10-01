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

    const destinationsList = React.useMemo(() => {
        if (!tour || !tour.destinations) return [];
        return tour.destinations.split(/\s*[-&,]\s*|\s+ve\s+/i).map(d => d.trim()).filter(Boolean);
    }, [tour]);

    const [activeDestIndex, setActiveDestIndex] = useState(0);
    const activeCityName = destinationsList[activeDestIndex] || 'Istanbul';

    const cleanCityName = (name) => {
        if (!name) return "";
        return name
            .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '') // Strips emojis / flags
            .replace(/[^\p{L}\p{N}\s,-]/gu, '') // Keep letters, numbers, spaces, commas, hyphens
            .trim();
    };

    const searchCityQuery = cleanCityName(activeCityName);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!tour || !searchCityQuery) return;
        
        // Fetch Weather via Open-Meteo
        const fetchWeather = async () => {
            setLoadingWeather(true);
            try {
                // 1. Geocoding
                let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCityQuery)}&count=1&language=tr&format=json`);
                let geoData = await geoRes.json();
                
                // Fallback for generic country names
                if (!geoData.results || geoData.results.length === 0) {
                    const fallbackName = tour.name.split('-')[1] ? tour.name.split('-')[1].split('&')[0].trim() : "Paris";
                    const cleanFallback = cleanCityName(fallbackName);
                    geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanFallback)}&count=1&language=tr&format=json`);
                    geoData = await geoRes.json();
                }

                if (geoData.results && geoData.results.length > 0) {
                    const { latitude, longitude, timezone } = geoData.results[0];
                    if (timezone) setLocalTimezone(timezone);
                    else setLocalTimezone("Europe/Istanbul");
                    
                    // 2. Forecast
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
                    const weatherData = await weatherRes.json();
                    
                    if (weatherData.daily) {
                        const todayTemp = Math.round(weatherData.daily.temperature_2m_max[0]);
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
                            })).slice(0, 5)
                        });
                    }
                } else {
                    setLocalTimezone("Europe/Istanbul");
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
    }, [searchCityQuery, tour]);

    useEffect(() => {
        if (!tour || !searchCityQuery) return;
        setLoadingPlaces(true);

        const loadGooglePlaces = () => {
            if (!googlePlacesApiKey) {
                setPlaces([{ name: "Lütfen Admin Panelinden", desc: "Google Places API Key Giriniz." }]);
                setRestaurants([{ name: "API Key Eksik", cuisine: "Ayar Gerekli", rating: "-" }]);
                setLoadingPlaces(false);
                return;
            }

            if (!window.google || !window.google.maps) {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${googlePlacesApiKey}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => fetchPlacesData(searchCityQuery);
                script.onerror = () => {
                   setPlaces([{ name: "API Yüklenemedi", desc: "Geçersiz API Anahtarı veya Bağlantı Hatası" }]);
                   setRestaurants([]);
                   setLoadingPlaces(false);
                };
                document.head.appendChild(script);
            } else {
                fetchPlacesData(searchCityQuery);
            }
        };

        const fetchPlacesData = (city) => {
            const dummyDiv = document.createElement('div');
            const service = new window.google.maps.places.PlacesService(dummyDiv);

            service.textSearch({ query: `top tourist attractions in ${city}` }, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setPlaces(results.slice(0, 3).map(p => {
                        let address = p.formatted_address || "Popüler Turistik Mekan";
                        address = address.replace(/\b[A-Z0-9]{4}\+[A-Z0-9]{2,4}\b,?\s*/g, '');
                        return { name: p.name, desc: address };
                    }));
                } else {
                    setPlaces([{ name: "Sonuç Bulunamadı", desc: "API Limit veya İzin Hatası" }]);
                }

                service.textSearch({ query: `best rated restaurants in ${city}` }, (restResults, restStatus) => {
                    if (restStatus === window.google.maps.places.PlacesServiceStatus.OK && restResults) {
                        setRestaurants(restResults.slice(0, 4).map(r => {
                            let cuisine = "Restoran";
                            if (r.types) {
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
    }, [searchCityQuery, googlePlacesApiKey]);

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
        } catch (e) {
            return null;
        }
    }, [localTimezone, currentTime]);

    if (!tour) {
        return <div style={{padding: '24px', textAlign: 'center'}}>Tur bulunamadı.</div>;
    }

    return (
        <div style={{ paddingBottom: '90px', background: 'var(--bg-color)', minHeight: '100vh' }}>
            <Header title="Şehir Rehberi" showBack />
            
            {destinationsList.length > 1 && (
                <div style={{ padding: '0 16px 10px', boxSizing: 'border-box' }}>
                    <div style={{
                        display: 'flex',
                        background: '#e2e8f0',
                        borderRadius: '12px',
                        padding: '3px',
                        gap: '4px',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        {destinationsList.map((dest, idx) => {
                            const isActive = activeDestIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => { setActiveDestIndex(idx); setWeather(null); setPlaces([]); setRestaurants([]); }}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        padding: '7px 10px',
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: isActive ? 'var(--primary)' : 'transparent',
                                        color: isActive ? '#ffffff' : '#64748b',
                                        boxShadow: isActive ? '0 2px 6px rgba(255, 107, 0, 0.25)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <MapPin size={12} style={{ opacity: isActive ? 1 : 0.6 }} />
                                    {dest}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Banner Hero Card */}
            <div style={{ padding: '0 16px' }}>
                <div style={{ 
                    height: '180px', 
                    width: '100%', 
                    position: 'relative', 
                    borderRadius: '18px', 
                    overflow: 'hidden', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    backgroundColor: '#e2e8f0',
                    border: '1px solid #e2e8f0'
                }}>
                    <img 
                        src={tour.avatar} 
                        alt={activeCityName} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: '30px 16px 14px', 
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)', 
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                                {activeCityName}
                            </h2>
                            <span style={{ fontSize: '10px', fontWeight: '700', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)' }}>
                                Şehir Rehberi
                            </span>
                        </div>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', margin: 0, opacity: 0.9 }}>
                            <MapPin size={12} color="var(--primary)" /> {tour.destinations || activeCityName}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. ZAMAN DILIMI CARD */}
                <div 
                  className="card"
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1.5px solid #e2e8f0', 
                    padding: '16px', 
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                    {/* Header inside card */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                            <Clock size={16} className="text-primary" /> Zaman Dilimi
                        </div>
                        {timeDiffBadge && (
                            <span style={{ fontSize: '10.5px', fontWeight: '700', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                                {timeDiffBadge}
                            </span>
                        )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                🇹🇷 Türkiye
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                                {currentTime.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', padding: '12px', borderRadius: '12px', border: '1px solid #F9BED8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--primary)', fontWeight: '700', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                📍 Yerel Saat
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                                {currentTime.toLocaleTimeString('tr-TR', { timeZone: localTimezone, hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. HAVA DURUMU KARTI */}
                <div 
                  className="card"
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1.5px solid #e2e8f0', 
                    padding: '16px', 
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                    {/* Header inside card */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                            <ThermometerSun size={16} className="text-primary" /> Hava Durumu Göstergesi
                        </div>
                        {weather && (
                            <span style={{ fontSize: '10.5px', fontWeight: '700', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                {activeCityName}
                            </span>
                        )}
                    </div>
                    
                    {loadingWeather ? (
                       <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                           <Loader2 size={20} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                       </div>
                    ) : weather ? (
                       <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px', borderRadius: '10px', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <ThermometerSun size={20} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Şu Anki Durum</div>
                                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)', marginTop: '1px' }}>
                                      {weather.temp} <span style={{ fontWeight: '600', color: '#64748b', fontSize: '12px' }}>• {weather.condition}</span>
                                  </div>
                              </div>
                          </div>
                          
                          {weather.forecast && weather.forecast.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                  {weather.forecast.map((day, idx) => (
                                     <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>{day.date}</div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', marginTop: '3px' }}>{day.max}°</div>
                                        <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '1px' }}>{day.min}°</div>
                                     </div>
                                  ))}
                              </div>
                          )}
                       </div>
                    ) : null}
                </div>

                {/* 3. GORULECEK YERLER KARTI */}
                <div 
                  className="card"
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1.5px solid #e2e8f0', 
                    padding: '16px', 
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                    {/* Header inside card */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                            <Landmark size={16} className="text-primary" /> Görülecek Yerler
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: '700', background: '#FDF2F8', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', border: '1px solid #F9BED8' }}>
                            {places.length} Lokasyon
                        </span>
                    </div>
                    
                    {loadingPlaces ? (
                       <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                           <Loader2 size={20} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                       </div>
                    ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {places.map((place, idx) => (
                              <div key={idx} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#FDF2F8', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: '800', flexShrink: 0, marginTop: '2px', border: '1px solid #F9BED8' }}>
                                      {idx + 1}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>{place.name}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.35' }}>{place.desc}</div>
                                  </div>
                              </div>
                          ))}
                       </div>
                    )}
                </div>

                {/* 4. POPULER RESTORANLAR KARTI */}
                <div 
                  className="card"
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1.5px solid #e2e8f0', 
                    padding: '16px', 
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                    {/* Header inside card */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                            <Utensils size={16} className="text-primary" /> Popüler Restoranlar
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: '700', background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                            {restaurants.length} Restoran
                        </span>
                    </div>
                    
                    {loadingPlaces ? (
                       <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                           <Loader2 size={20} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                       </div>
                    ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {restaurants.map((rest, idx) => (
                              <div key={idx} style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rest.name}</div>
                                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', textTransform: 'capitalize' }}>{rest.cuisine}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '3px 7px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', border: '1px solid #fde68a', flexShrink: 0 }}>
                                      <Star size={11} fill="currentColor" /> {rest.rating}
                                  </div>
                              </div>
                          ))}
                       </div>
                    )}
                </div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
