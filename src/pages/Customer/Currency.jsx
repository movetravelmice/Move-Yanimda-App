import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Coins, ArrowUpDown, Clock, ChevronDown, Check } from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore } from '../../store/settingsStore';

const currencyMetadata = {
  USD: { name: 'Amerikan Doları', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'İngiliz Sterlini', symbol: '£' },
  JPY: { name: 'Japon Yeni', symbol: '¥' },
  CHF: { name: 'İsviçre Frangı', symbol: '₣' },
  CAD: { name: 'Kanada Doları', symbol: 'C$' },
  AUD: { name: 'Avustralya Doları', symbol: 'A$' },
  CNY: { name: 'Çin Yuanı', symbol: '¥' },
  RUB: { name: 'Rus Rublesi', symbol: '₽' },
  AED: { name: 'BAE Dirhemi', symbol: 'د.إ' },
  TRY: { name: 'Türk Lirası', symbol: '₺' },
  DKK: { name: 'Danimarka Kronu', symbol: 'kr' },
  SEK: { name: 'İsveç Kronu', symbol: 'kr' },
  NOK: { name: 'Norveç Kronu', symbol: 'kr' },
  SAR: { name: 'Suudi Arabistan Riyali', symbol: '﷼' },
  KWD: { name: 'Kuveyt Dinarı', symbol: 'KD' },
  RON: { name: 'Rumen Leyi', symbol: 'lei' },
  BGN: { name: 'Bulgar Levası', symbol: 'лв' },
  QAR: { name: 'Katar Riyali', symbol: 'QR' }
};

// Custom Theme Styled Currency Dropdown
function CustomCurrencySelect({ value, onChange, options, symbols, metadata }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMeta = metadata[value] || { name: value, symbol: symbols[value] || value };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: '38px',
          padding: '0 10px',
          background: isOpen ? '#ffffff' : '#f8fafc',
          border: isOpen ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            background: '#FDF2F8', 
            color: 'var(--primary)', 
            width: '20px', 
            height: '20px', 
            borderRadius: '6px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {selectedMeta.symbol}
          </span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
            {value}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>
            ({selectedMeta.symbol})
          </span>
        </div>
        <ChevronDown 
          size={14} 
          color={isOpen ? 'var(--primary)' : '#94a3b8'} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }} 
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #F9BED8',
          boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.14), 0 4px 12px rgba(215, 20, 122, 0.08)',
          maxHeight: '230px',
          overflowY: 'auto',
          zIndex: 100,
          padding: '5px',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {options.map(curr => {
            const isSelected = curr === value;
            const meta = metadata[curr] || { name: curr, symbol: symbols[curr] || curr };
            return (
              <div
                key={curr}
                onClick={() => {
                  onChange(curr);
                  setIsOpen(false);
                }}
                style={{
                  padding: '7px 8px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isSelected ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : '#334155',
                  transition: 'background 0.15s ease',
                  marginBottom: '2px'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: isSelected ? '#ffffff' : '#FDF2F8',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #F9BED8',
                    flexShrink: 0
                  }}>
                    {meta.symbol}
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: isSelected ? '600' : '500', lineHeight: 1.2 }}>
                      {curr}
                    </div>
                    <div style={{ fontSize: '9.5px', color: isSelected ? 'var(--primary)' : '#94a3b8', lineHeight: 1.1 }}>
                      {meta.name}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Check size={13} color="var(--primary)" strokeWidth={2} style={{ flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Currency({ isEmbedded = false }) {
  const { akbankApiKey } = useSettingsStore();

  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('TRY');
  
  const [rates, setRates] = useState({
    TRY: 1,
    USD: 33.50,
    EUR: 36.20,
    GBP: 42.10,
    JPY: 0.22,
    CHF: 37.15,
    CAD: 24.50,
    AUD: 22.10,
    CNY: 4.60,
    RUB: 0.36,
    AED: 9.12
  });
  
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(60);
  const [provider, setProvider] = useState('tcmb'); // 'tcmb' or 'akbank'
  const [isLoading, setIsLoading] = useState(false);

  const symbols = {
    TRY: "₺", USD: "$", EUR: "€", GBP: "£", JPY: "¥", 
    CHF: "₣", CAD: "C$", AUD: "A$", CNY: "¥", RUB: "₽", AED: "د.إ",
    DKK: "kr", SEK: "kr", NOK: "kr", SAR: "﷼", KWD: "KD", RON: "lei", BGN: "лв", QAR: "QR"
  };

  const executeRefreshLogic = async (currentProvider = provider) => {
    setIsLoading(true);
    try {
      const url = currentProvider === 'tcmb' ? '/api/tcmb-rates' : `/api/akbank-rates?apikey=${akbankApiKey || ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.success && data.rates) {
        setRates(prevRates => {
          const updated = { ...prevRates };
          Object.keys(updated).forEach(k => {
            if (data.rates[k] !== undefined) {
              updated[k] = Number(data.rates[k]);
            }
          });
          return updated;
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error(`${currentProvider.toUpperCase()} kur hatası:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    executeRefreshLogic(provider);
    setCountdown(60);
  };

  const handleSwapCurrencies = () => {
    setFrom(to);
    setTo(from);
  };

  useEffect(() => {
    // Sağlayıcı değiştiğinde veya sayfa yüklendiğinde kurları çek
    executeRefreshLogic(provider);
    setCountdown(60);
  }, [provider]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          executeRefreshLogic(provider);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [provider]);

  const calculateConversion = () => {
    if (!amount || isNaN(amount)) return '0.0000';
    const amountInTry = parseFloat(amount) * (rates[from] || 1);
    return (amountInTry / (rates[to] || 1)).toFixed(4);
  };

  const formatCurrency = (value, curr) => {
    const rightSideSymbols = ['TRY', 'RUB', 'AED', 'SAR', 'QAR', 'BGN', 'RON', 'DKK', 'SEK', 'NOK'];
    const sym = symbols[curr] || curr;
    if (rightSideSymbols.includes(curr)) {
      return `${value} ${sym}`;
    }
    return `${sym} ${value}`;
  };

  const formatTime = (date) => {
    return date.toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const mainContent = (
    <div style={{ padding: isEmbedded ? '0' : '0 16px' }}>

        {/* Provider Selection Segmented Control */}
        <div style={{ 
          display: 'flex', 
          background: '#f1f5f9', 
          borderRadius: '14px', 
          padding: '3px', 
          marginBottom: '14px',
          border: '1px solid #e2e8f0'
        }}>
            <button 
                onClick={() => setProvider('tcmb')}
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  borderRadius: '11px', 
                  border: 'none', 
                  fontSize: '12px', 
                  fontWeight: provider === 'tcmb' ? '600' : '500', 
                  cursor: 'pointer', 
                  background: provider === 'tcmb' ? '#ffffff' : 'transparent', 
                  color: provider === 'tcmb' ? 'var(--primary)' : '#64748b', 
                  boxShadow: provider === 'tcmb' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s ease'
                }}>
                TCMB Kurları
            </button>
            <button 
                onClick={() => setProvider('akbank')}
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  borderRadius: '11px', 
                  border: 'none', 
                  fontSize: '12px', 
                  fontWeight: provider === 'akbank' ? '600' : '500', 
                  cursor: 'pointer', 
                  background: provider === 'akbank' ? '#ffffff' : 'transparent', 
                  color: provider === 'akbank' ? 'var(--primary)' : '#64748b', 
                  boxShadow: provider === 'akbank' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s ease'
                }}>
                Akbank Kurları
            </button>
        </div>

        {/* Currency Converter Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #edf2f7',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          padding: '16px',
          marginBottom: '14px'
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={15} color="var(--primary)" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Canlı Kur Çevirici</span>
              <span style={{ fontSize: '10px', fontWeight: '500', background: '#f8fafc', color: '#64748b', padding: '2px 7px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                {provider === 'tcmb' ? 'TCMB' : 'Akbank'}
              </span>
            </div>
            <button 
              onClick={handleManualRefresh} 
              title="Yenile"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} color="var(--primary)" />
            </button>
          </div>

          {/* Inputs Row: Miktar & Nereden */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '5px' }}>Miktar</label>
              <input 
                type="number" 
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '38px',
                  padding: '0 12px', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#334155', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '5px' }}>Nereden</label>
              <CustomCurrencySelect 
                value={from} 
                onChange={setFrom} 
                options={Object.keys(rates)} 
                symbols={symbols} 
                metadata={currencyMetadata} 
              />
            </div>
          </div>

          {/* Swap Button Divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0 8px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: '#f1f5f9', zIndex: 0 }} />
            <button 
              onClick={handleSwapCurrencies} 
              title="Para Birimlerini Değiştir"
              style={{ 
                position: 'relative', 
                zIndex: 1, 
                width: '26px', 
                height: '26px', 
                borderRadius: '50%', 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease, background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
            >
              <ArrowUpDown size={12} color="var(--primary)" />
            </button>
          </div>

          {/* Inputs Row: Nereye & Sonuç */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '5px' }}>Nereye</label>
              <CustomCurrencySelect 
                value={to} 
                onChange={setTo} 
                options={Object.keys(rates)} 
                symbols={symbols} 
                metadata={currencyMetadata} 
              />
            </div>
            
            <div>
              <label style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', display: 'block', marginBottom: '5px' }}>
                Sonuç {isLoading && <span style={{ fontSize: '9.5px', textTransform: 'none', fontWeight: '400', color: '#94a3b8' }}>(...)</span>}
              </label>
              <div style={{ 
                width: '100%',
                height: '38px',
                padding: '0 10px', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#D7147A', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center', 
                background: '#fff5f9', 
                border: '1px solid #F9BED8',
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                boxSizing: 'border-box'
              }}>
                {formatCurrency(calculateConversion(), to)}
              </div>
            </div>
          </div>
          
        </div>
        
        {/* All Rates Card */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #edf2f7', 
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', 
          padding: '16px', 
          marginBottom: '14px' 
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Tüm Güncel Kurlar</span>
              <span style={{ fontSize: '10.5px', fontWeight: '400', color: '#94a3b8' }}>(TRY Karşılığı)</span>
            </div>
            <button 
              onClick={handleManualRefresh} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={13} className={isLoading ? 'spin' : ''} color="var(--primary)" />
            </button>
          </div>

          {/* Rates List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '2px' }}>
            {Object.keys(rates).filter(c => c !== 'TRY').map((curr, index, arr) => {
              const meta = currencyMetadata[curr] || { name: curr, symbol: symbols[curr] || curr };
              return (
                <div 
                  key={curr} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '8px 6px', 
                    borderRadius: '8px',
                    borderBottom: index === arr.length - 1 ? 'none' : '1px solid #f8fafc',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    {/* Left side: Symbol badge & names */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '8px', 
                        background: '#FDF2F8', 
                        border: '1px solid #FCE7F3',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '11.5px', 
                        fontWeight: '600', 
                        color: 'var(--primary)',
                        flexShrink: 0
                      }}>
                        {meta.symbol}
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', lineHeight: 1.2 }}>{curr}</div>
                        <div style={{ fontSize: '10.5px', fontWeight: '400', color: '#94a3b8', lineHeight: 1.2 }}>{meta.name}</div>
                      </div>
                    </div>

                    {/* Right side: Rate */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', lineHeight: 1.2 }}>
                        {formatCurrency(rates[curr].toFixed(4), 'TRY')}
                      </div>
                      <div style={{ fontSize: '9.5px', fontWeight: '400', color: '#94a3b8', lineHeight: 1.2 }}>
                        1 {curr}
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compact Status & Countdown Footer Card */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          border: '1px solid #edf2f7', 
          padding: '10px 14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#94a3b8" />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Son Güncelleme: <span style={{ color: '#334155', fontWeight: '500' }}>{formatTime(lastUpdate)}</span>
                </span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--primary)', fontWeight: '600', background: '#FDF2F8', padding: '2px 8px', borderRadius: '10px', border: '1px solid #FCE7F3' }}>
                {countdown}s
            </div>
        </div>

    </div>
  );

  if (isEmbedded) {
    return mainContent;
  }

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Header title="Para Birimi Çevirici" />
      {mainContent}
    </div>
  );
}
