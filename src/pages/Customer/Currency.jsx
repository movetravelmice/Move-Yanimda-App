import React, { useState, useEffect } from 'react';
import { RefreshCw, Coins } from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore } from '../../store/settingsStore';

export default function Currency() {
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
    CHF: "₣", CAD: "C$", AUD: "A$", CNY: "¥", RUB: "₽", AED: "د.إ"
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
    if(!amount) return 0.00;
    const amountInTry = parseFloat(amount) * rates[from];
    return (amountInTry / rates[to]).toFixed(4);
  };

  const formatCurrency = (value, curr) => {
    const rightSideSymbols = ['TRY', 'RUB', 'AED'];
    if (rightSideSymbols.includes(curr)) {
      return `${value} ${symbols[curr]}`;
    }
    return `${symbols[curr]} ${value}`;
  };

  const formatTime = (date) => {
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <Header title="Para Birimi Çevirici" />
      
      <div style={{ padding: '0 16px' }}>

        {/* Provider Selection Tabs */}
        <div style={{ display: 'flex', background: 'white', borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0', marginBottom: '20px', gap: '4px' }}>
            <button 
                onClick={() => setProvider('tcmb')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', background: provider === 'tcmb' ? 'var(--primary)' : 'transparent', color: provider === 'tcmb' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                TCMB Kurları
            </button>
            <button 
                onClick={() => setProvider('akbank')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', background: provider === 'akbank' ? 'var(--primary)' : 'transparent', color: provider === 'akbank' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                Akbank Kurları
            </button>
        </div>

        <div className="card">
          <div className="flex-row text-muted" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
              <Coins size={16} color="var(--primary)" />
              Canlı Kur Verisi ({provider === 'tcmb' ? 'TCMB' : 'Akbank'})
            </span>
            <RefreshCw size={16} className={`text-primary ${isLoading ? 'spin' : ''}`} style={{ cursor: 'pointer' }} onClick={handleManualRefresh} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Miktar</label>
              <input 
                type="number" 
                className="input-field" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nereden</label>
              <select className="input-field" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {Object.keys(rates).map(curr => <option key={curr} value={curr}>{curr} ({symbols[curr]})</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nereye</label>
              <select className="input-field" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {Object.keys(rates).map(curr => <option key={curr} value={curr}>{curr} ({symbols[curr]})</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sonuç {isLoading && <span style={{ fontSize: '10px', textTransform: 'none', fontWeight: 'normal', color: 'var(--text-muted)', fontStyle: 'italic' }}>(Yükleniyor...)</span>}
              </label>
              <div className="input-field" style={{ padding: '6px', fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'center', background: '#f5f5f5' }}>
                {formatCurrency(calculateConversion(), to)}
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="flex-row text-muted" style={{ justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>Tüm Güncel Kurlar</span>
            <RefreshCw size={16} className={`text-primary ${isLoading ? 'spin' : ''}`} style={{ cursor: 'pointer' }} onClick={handleManualRefresh} />
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {Object.keys(rates).filter(c => c !== 'TRY').map((curr, index, arr) => (
              <div key={curr} className="flex-row" style={{ justifyContent: 'space-between', padding: '12px 0', paddingRight: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{formatCurrency(1, curr)}</span> 
                    <span style={{fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)'}}>({curr})</span>
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isLoading && <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', fontStyle: 'italic' }}>Yükleniyor...</span>}
                      {formatCurrency(rates[curr].toFixed(4), 'TRY')}
                  </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{provider === 'tcmb' ? 'TCMB' : 'Akbank'} Son Güncelleme Saati</span>
                <span className="font-bold" style={{ fontSize: '14px', color: 'var(--primary)' }}>{formatTime(lastUpdate)}</span>
                <span className="text-muted" style={{ fontSize: '12px', marginTop: '8px' }}>
                    Sıradaki kur güncellemesine <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{countdown} saniye</span> kaldı
                </span>
            </div>
        </div>
      </div>
    </div>
  );
}
