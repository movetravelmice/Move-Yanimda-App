import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Header from '../../components/Header';

export default function Currency() {
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

  const symbols = {
    TRY: "₺", USD: "$", EUR: "€", GBP: "£", JPY: "¥", 
    CHF: "₣", CAD: "C$", AUD: "A$", CNY: "¥", RUB: "₽", AED: "د.إ"
  };

  const executeRefreshLogic = async () => {
    try {
      const res = await fetch('/api/tcmb-rates');
      const text = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      
      const currencies = xmlDoc.getElementsByTagName("Currency");
      const fetchedRates = { TRY: 1 };
      
      for (let i = 0; i < currencies.length; i++) {
        const curr = currencies[i].getAttribute("CurrencyCode");
        const forexSelling = currencies[i].getElementsByTagName("ForexSelling")[0]?.textContent;
        if (curr && forexSelling) {
            fetchedRates[curr] = parseFloat(forexSelling);
        }
      }
      
      setRates(prevRates => {
        const updated = { ...prevRates };
        Object.keys(updated).forEach(k => {
          if (fetchedRates[k]) {
            updated[k] = fetchedRates[k];
          }
        });
        return updated;
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("TCMB kur hatası:", error);
    }
  };

  const handleManualRefresh = () => {
    executeRefreshLogic();
    setCountdown(60);
  };

  useEffect(() => {
    // İlk açılışta hemen kurları çek
    executeRefreshLogic();
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          executeRefreshLogic();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateConversion = () => {
    if(!amount) return 0.00;
    const amountInTry = parseFloat(amount) * rates[from];
    return (amountInTry / rates[to]).toFixed(2);
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
        <div className="card">
          <div className="flex-row text-muted" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>Canlı Kur Verisi (TCMB)</span>
            <RefreshCw size={16} className="text-primary" style={{ cursor: 'pointer' }} onClick={handleManualRefresh} />
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
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sonuç</label>
              <div className="input-field" style={{ padding: '6px', fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'center', background: '#f5f5f5' }}>
                {formatCurrency(calculateConversion(), to)}
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="flex-row text-muted" style={{ justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>Tüm Güncel Kurlar</span>
            <RefreshCw size={16} className="text-primary" style={{ cursor: 'pointer' }} onClick={handleManualRefresh} />
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {Object.keys(rates).filter(c => c !== 'TRY').map((curr, index, arr) => (
              <div key={curr} className="flex-row" style={{ justifyContent: 'space-between', padding: '12px 0', paddingRight: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <span><span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{formatCurrency(1, curr)}</span> <span style={{fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)'}}>({curr})</span></span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(rates[curr].toFixed(2), 'TRY')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>TCMB Son güncelleme Saati</span>
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
