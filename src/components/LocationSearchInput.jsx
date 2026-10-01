import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, PlaneTakeoff, X, Loader2, Check } from 'lucide-react';
import CountryFlag from './CountryFlag';

export const POPULAR_LOCATIONS = [
  // Turkey Major Hubs
  { city: 'İstanbul', country: 'Türkiye', code: 'IST', countryCode: 'TR', flag: '🇹🇷', isHub: true },
  { city: 'Ankara', country: 'Türkiye', code: 'ESB', countryCode: 'TR', flag: '🇹🇷', isHub: true },
  { city: 'İzmir', country: 'Türkiye', code: 'ADB', countryCode: 'TR', flag: '🇹🇷', isHub: true },
  { city: 'Antalya', country: 'Türkiye', code: 'AYT', countryCode: 'TR', flag: '🇹🇷', isHub: true },
  { city: 'Bodrum', country: 'Türkiye', code: 'BJV', countryCode: 'TR', flag: '🇹🇷' },
  { city: 'Dalaman', country: 'Türkiye', code: 'DLM', countryCode: 'TR', flag: '🇹🇷' },
  { city: 'Kapadokya', country: 'Türkiye', code: 'NAV', countryCode: 'TR', flag: '🇹🇷' },
  { city: 'Trabzon', country: 'Türkiye', code: 'TZX', countryCode: 'TR', flag: '🇹🇷' },
  { city: 'Gaziantep', country: 'Türkiye', code: 'GZT', countryCode: 'TR', flag: '🇹🇷' },

  // World Popular Destinations
  { city: 'Roma', country: 'İtalya', code: 'FCO', countryCode: 'IT', flag: '🇮🇹', isPopularDest: true },
  { city: 'Paris', country: 'Fransa', code: 'CDG', countryCode: 'FR', flag: '🇫🇷', isPopularDest: true },
  { city: 'Londra', country: 'İngiltere', code: 'LHR', countryCode: 'GB', flag: '🇬🇧', isPopularDest: true },
  { city: 'Barselona', country: 'İspanya', code: 'BCN', countryCode: 'ES', flag: '🇪🇸', isPopularDest: true },
  { city: 'Amsterdam', country: 'Hollanda', code: 'AMS', countryCode: 'NL', flag: '🇳🇱', isPopularDest: true },
  { city: 'Dubai', country: 'BAE', code: 'DXB', countryCode: 'AE', flag: '🇦🇪', isPopularDest: true },
  { city: 'Tokyo', country: 'Japonya', code: 'HND', countryCode: 'JP', flag: '🇯🇵', isPopularDest: true },
  { city: 'Milano', country: 'İtalya', code: 'MXP', countryCode: 'IT', flag: '🇮🇹' },
  { city: 'Floransa', country: 'İtalya', code: 'FLR', countryCode: 'IT', flag: '🇮🇹' },
  { city: 'Venedik', country: 'İtalya', code: 'VCE', countryCode: 'IT', flag: '🇮🇹' },
  { city: 'Madrid', country: 'İspanya', code: 'MAD', countryCode: 'ES', flag: '🇪🇸' },
  { city: 'Berlin', country: 'Almanya', code: 'BER', countryCode: 'DE', flag: '🇩🇪' },
  { city: 'Münih', country: 'Almanya', code: 'MUC', countryCode: 'DE', flag: '🇩🇪' },
  { city: 'Viyana', country: 'Avusturya', code: 'VIE', countryCode: 'AT', flag: '🇦🇹' },
  { city: 'Prag', country: 'Çekya', code: 'PRG', countryCode: 'CZ', flag: '🇨🇿' },
  { city: 'Budapeşte', country: 'Macaristan', code: 'BUD', countryCode: 'HU', flag: '🇭🇺' },
  { city: 'Atina', country: 'Yunanistan', code: 'ATH', countryCode: 'GR', flag: '🇬🇷' },
  { city: 'Santorini', country: 'Yunanistan', code: 'JTR', countryCode: 'GR', flag: '🇬🇷' },
  { city: 'Mikonos', country: 'Yunanistan', code: 'JMK', countryCode: 'GR', flag: '🇬🇷' },
  { city: 'New York', country: 'ABD', code: 'JFK', countryCode: 'US', flag: '🇺🇸' },
  { city: 'Los Angeles', country: 'ABD', code: 'LAX', countryCode: 'US', flag: '🇺🇸' },
  { city: 'Miami', country: 'ABD', code: 'MIA', countryCode: 'US', flag: '🇺🇸' },
  { city: 'Bangkok', country: 'Tayland', code: 'BKK', countryCode: 'TH', flag: '🇹🇭' },
  { city: 'Phuket', country: 'Tayland', code: 'HKT', countryCode: 'TH', flag: '🇹🇭' },
  { city: 'Bali', country: 'Endonezya', code: 'DPS', countryCode: 'ID', flag: '🇮🇩' },
  { city: 'Singapur', country: 'Singapur', code: 'SIN', countryCode: 'SG', flag: '🇸🇬' },
  { city: 'Kahire', country: 'Mısır', code: 'CAI', countryCode: 'EG', flag: '🇪🇬' },
  { city: 'Saraybosna', country: 'Bosna Hersek', code: 'SJJ', countryCode: 'BA', flag: '🇧🇦' },
  { city: 'Kotor', country: 'Karadağ', code: 'TIV', countryCode: 'ME', flag: '🇲🇪' },
  { city: 'Üsküp', country: 'Kuzey Makedonya', code: 'SKP', countryCode: 'MK', flag: '🇲🇰' },
  { city: 'Bakü', country: 'Azerbaycan', code: 'GYD', countryCode: 'AZ', flag: '🇦🇿' },
  { city: 'Tiflis', country: 'Gürcistan', code: 'TBS', countryCode: 'GE', flag: '🇬🇪' },
  { city: 'Batum', country: 'Gürcistan', code: 'BUS', countryCode: 'GE', flag: '🇬🇪' },
  { city: 'Zürih', country: 'İsviçre', code: 'ZRH', countryCode: 'CH', flag: '🇨🇭' }
];

export const normalizeTr = (str) => (str || '')
  .toLowerCase()
  .replace(/ı/g, 'i')
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ş/g, 's')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c')
  .trim();

export default function LocationSearchInput({
  label,
  placeholder,
  value,
  country,
  countryCode,
  onSelect,
  type = 'destination', // 'origin' | 'destination'
  quickOptions = [],
  required = false
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);

  // Determine active country for flag display
  const activeCountry = (() => {
    if (countryCode) return countryCode;
    if (country) return country;
    if (!inputValue) return null;

    if (inputValue.includes(',')) {
      const parts = inputValue.split(',');
      const candidate = parts[parts.length - 1].trim();
      if (candidate) return candidate;
    }

    const norm = normalizeTr(inputValue);
    const matched = POPULAR_LOCATIONS.find(loc => 
      normalizeTr(loc.city) === norm || normalizeTr(loc.country) === norm
    );
    if (matched) return matched.country || matched.countryCode;

    return null;
  })();

  // Sync external value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced AJAX search
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!isOpen) return;

    if (!trimmed) {
      // Show default popular list if empty
      const defaultList = type === 'origin'
        ? POPULAR_LOCATIONS.filter(item => item.isHub).slice(0, 6)
        : POPULAR_LOCATIONS.filter(item => item.isPopularDest || item.isHub).slice(0, 7);
      setResults(defaultList);
      setIsLoading(false);
      return;
    }

    const normQuery = normalizeTr(trimmed);

    // 1. Instant local filter
    const localMatches = POPULAR_LOCATIONS.filter(item => {
      const matchCity = normalizeTr(item.city).includes(normQuery);
      const matchCountry = normalizeTr(item.country).includes(normQuery);
      const matchCode = (item.code || '').toLowerCase().includes(normQuery);
      return matchCity || matchCountry || matchCode;
    });

    setResults(localMatches);

    // 2. Open-Meteo Geocoding API if query is 2+ chars
    if (trimmed.length < 2) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const cleanQuery = trimmed.replace(/[^\p{L}\p{N}\s,-]/gu, '').trim();
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=7&language=tr&format=json`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            const apiItems = data.results.map(r => ({
              city: r.name,
              country: r.country || '',
              countryCode: r.country_code || '',
              region: r.admin1 || '',
              latitude: r.latitude,
              longitude: r.longitude,
              isApi: true
            }));

            // Merge local and api results, avoiding exact duplicates
            const seen = new Set();
            const merged = [];

            [...localMatches, ...apiItems].forEach(item => {
              const key = `${normalizeTr(item.city)}_${normalizeTr(item.country)}`;
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
              }
            });

            setResults(merged.slice(0, 8));
          }
        }
      } catch (err) {
        console.warn("Geocoding fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen, type]);

  const handleSelectItem = (item) => {
    const formatted = `${item.city}, ${item.country}`;
    setInputValue(formatted);
    setIsOpen(false);
    if (onSelect) {
      onSelect({
        city: item.city,
        country: item.country,
        countryCode: item.countryCode,
        fullName: formatted,
        latitude: item.latitude,
        longitude: item.longitude
      });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    if (onSelect) {
      onSelect({ city: '', country: '', countryCode: '', fullName: '' });
    }
  };

  const IconComponent = type === 'origin' ? PlaneTakeoff : MapPin;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 70 : 1 }}>
      {label && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '5px'
        }}>
          <IconComponent size={13} color="#D7147A" />
          <span>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</span>
        </label>
      )}

      {/* Input Box */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        border: isOpen ? '1.5px solid #D7147A' : '1.2px solid #cbd5e1',
        borderRadius: '11px',
        padding: '0 10px',
        height: '38px',
        boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.15s ease'
      }}>
        {/* Sol Bayrak / Arama İkonu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '8px',
          minWidth: '18px',
          flexShrink: 0
        }}>
          {activeCountry ? (
            <CountryFlag
              country={activeCountry}
              size="sm"
              style={{
                width: '18px',
                height: '13px',
                borderRadius: '2.5px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
                display: 'block'
              }}
            />
          ) : (
            <div style={{ color: '#D7147A', display: 'flex', alignItems: 'center' }}>
              <Search size={13.5} />
            </div>
          )}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (isOpen && results.length > 0) {
                e.preventDefault();
                handleSelectItem(results[0]);
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Şehir veya ülke ara..."}
          required={required}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '11.5px',
            fontWeight: '600',
            color: '#0f172a',
            background: 'transparent',
            padding: 0
          }}
        />

        {isLoading ? (
          <Loader2 size={15} className="animate-spin" color="#D7147A" style={{ marginLeft: '6px' }} />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              marginLeft: '6px',
              padding: 0
            }}
            title="Temizle"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #F9BED8',
          boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18)',
          zIndex: 1000,
          maxHeight: '260px',
          overflowY: 'auto',
          padding: '6px'
        }}>
          <div style={{
            fontSize: '9.5px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: '#94a3b8',
            padding: '6px 8px 4px 8px'
          }}>
            {inputValue ? 'Arama Sonuçları' : 'Popüler Öneriler'}
          </div>

          {results.length === 0 ? (
            <div style={{
              padding: '16px 12px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#94a3b8'
            }}>
              {isLoading ? 'Konumlar aranıyor...' : 'Eşleşen şehir veya ülke bulunamadı.'}
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = inputValue && (
                inputValue.toLowerCase().includes(item.city.toLowerCase())
              );
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectItem(item)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isSelected ? '#FDF2F8' : 'transparent',
                    border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                    marginBottom: '2px',
                    transition: 'background 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CountryFlag country={item.country} size="md" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: isSelected ? '#D7147A' : '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{item.city}</span>
                        {item.code && (
                          <span style={{
                            fontSize: '8.5px',
                            fontWeight: '800',
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {item.code}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                        {item.country} {item.region ? `• ${item.region}` : ''}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} color="#D7147A" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
