import React, { useState, useEffect, useRef } from 'react';
import { 
  Siren, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Zap, 
  Maximize2, 
  Minimize2, 
  Phone, 
  MapPin, 
  Share2, 
  ShieldAlert, 
  Radio, 
  BellRing,
  Info,
  Check,
  ChevronLeft,
  Volume1,
  Flashlight
} from 'lucide-react';

export default function EmergencySiren({ isEmbedded = false, onBack }) {
  const [isActive, setIsActive] = useState(false);
  const [soundMode, setSoundMode] = useState('wail'); // 'wail' | 'morse' | 'hilo' | 'pierce'
  const [volume, setVolume] = useState(1.0); // 0.0 - 1.0 (Son ses 100%)
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [flashState, setFlashState] = useState(0); // 0 or 1
  
  // Geolocation quick share state
  const [isLocating, setIsLocating] = useState(false);
  const [locationResult, setLocationResult] = useState(null);
  const [locationCopied, setLocationCopied] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Audio & Hardware refs
  const audioCtxRef = useRef(null);
  const soundNodesRef = useRef([]);
  const morseTimeoutRef = useRef(null);
  const isPlayingRef = useRef(false);
  const wakeLockRef = useRef(null);
  const masterGainRef = useRef(null);

  // Initialize or get Web Audio Context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  };

  // Clean all sound nodes
  const stopAllSounds = () => {
    isPlayingRef.current = false;
    if (morseTimeoutRef.current) {
      clearTimeout(morseTimeoutRef.current);
      morseTimeoutRef.current = null;
    }
    soundNodesRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // Ignore already stopped nodes
      }
    });
    soundNodesRef.current = [];
  };

  // Start sound synthesis depending on soundMode
  const startSound = async (mode = soundMode) => {
    stopAllSounds();
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    isPlayingRef.current = true;

    // Master Gain & Compressor for maximum loudness without harsh clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGainRef.current = masterGain;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-10, ctx.currentTime);
    compressor.knee.setValueAtTime(8, ctx.currentTime);
    compressor.ratio.setValueAtTime(14, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.2, ctx.currentTime);

    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    if (mode === 'wail') {
      // 1. Acil Kurtarma Sireni (Wailing / Ambulance / Rescue continuous frequency oscillation)
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, ctx.currentTime);

      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(0.85, ctx.currentTime); // ~0.85 Hz wail cycle

      lfoGain.gain.setValueAtTime(450, ctx.currentTime); // Swings between 450Hz and 1350Hz

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(masterGain);

      osc.start();
      lfo.start();

      soundNodesRef.current.push(osc, lfo, lfoGain, masterGain, compressor);

    } else if (mode === 'morse') {
      // 2. Uluslararası SOS Mors Kodu (••• ——— ••• high-pitch piercing beep)
      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, ctx.currentTime); // 1100 Hz high tone
      toneGain.gain.setValueAtTime(0, ctx.currentTime);

      osc.connect(toneGain);
      toneGain.connect(masterGain);
      osc.start();

      soundNodesRef.current.push(osc, toneGain, masterGain, compressor);

      // Sequence in ms: [onTime, offTime]
      const pattern = [
        [150, 100], [150, 100], [150, 300], // S (...)
        [450, 100], [450, 100], [450, 300], // O (---)
        [150, 100], [150, 100], [150, 900]  // S (...) + loop pause
      ];

      let step = 0;
      const runMorse = () => {
        if (!isPlayingRef.current) return;
        const [onTime, offTime] = pattern[step];

        toneGain.gain.setValueAtTime(1, ctx.currentTime);

        morseTimeoutRef.current = setTimeout(() => {
          if (!isPlayingRef.current) return;
          toneGain.gain.setValueAtTime(0, ctx.currentTime);

          morseTimeoutRef.current = setTimeout(() => {
            if (!isPlayingRef.current) return;
            step = (step + 1) % pattern.length;
            runMorse();
          }, offTime);
        }, onTime);
      };

      runMorse();

    } else if (mode === 'hilo') {
      // 3. İki Tonlu Avrupa Polis / Ambulans Sireni (Hi-Lo 750Hz / 1200Hz)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);

      osc.connect(masterGain);
      osc.start();

      let high = false;
      const interval = setInterval(() => {
        if (!isPlayingRef.current) {
          clearInterval(interval);
          return;
        }
        high = !high;
        osc.frequency.setValueAtTime(high ? 1180 : 750, ctx.currentTime);
      }, 340);

      soundNodesRef.current.push(osc, masterGain, compressor, { stop: () => clearInterval(interval) });

    } else if (mode === 'pierce') {
      // 4. Keskin Panik Alarmı (Dual-tone dissonance binaural shriek 2700Hz + 3200Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(2700, ctx.currentTime);
      osc2.frequency.setValueAtTime(3200, ctx.currentTime);

      osc1.connect(masterGain);
      osc2.connect(masterGain);

      osc1.start();
      osc2.start();

      soundNodesRef.current.push(osc1, osc2, masterGain, compressor);
    }
  };

  // Master switch to toggle siren & strobe
  const toggleSiren = async () => {
    if (isActive) {
      stopAllSounds();
      setIsActive(false);
    } else {
      setIsActive(true);
      await startSound(soundMode);
    }
  };

  // Switch sound mode live if already playing
  const handleSoundModeChange = (newMode) => {
    setSoundMode(newMode);
    if (isActive) {
      startSound(newMode);
    }
  };

  // Update master volume live
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  // Flashing Strobe Effect Loop
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setFlashState(prev => (prev === 0 ? 1 : 0));
      }, 140); // 140ms fast beacon strobe
    } else {
      setFlashState(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // Haptic Feedback (Vibration)
  useEffect(() => {
    let vibInterval = null;
    if (isActive && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([220, 100, 220, 100, 400, 150]);
        vibInterval = setInterval(() => {
          if (navigator.vibrate) {
            navigator.vibrate([220, 100, 220, 100, 400, 150]);
          }
        }, 1200);
      } catch (e) {
        // Vibration not permitted or supported
      }
    }
    return () => {
      if (vibInterval) clearInterval(vibInterval);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(0); } catch (e) {}
      }
    };
  }, [isActive]);

  // Screen WakeLock (prevent screen from dimming/sleeping during emergency)
  useEffect(() => {
    if (isActive && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isActive]);

  // Clean up sounds on component unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Compute Strobe Colors (Sabit Kırmızı & Beyaz SOS Çakarı)
  const getStrobeColors = () => {
    if (!isActive) {
      return { bg: '#ffffff', text: '#0f172a', border: '#e2e8f0' };
    }
    return flashState === 0 
      ? { bg: '#dc2626', text: '#ffffff', border: '#ef4444' }
      : { bg: '#ffffff', text: '#dc2626', border: '#fecaca' };
  };

  const strobeColors = getStrobeColors();

  // Quick GPS Location Share via SMS
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const messageText = `ACİL DURUM! Yardıma ihtiyacım var! Canlı GPS Konumum: ${mapsUrl}`;
        setLocationResult({ latitude, longitude, mapsUrl, messageText });
        setIsLocating(false);

        // Open SMS or share
        const smsUrl = `sms:?body=${encodeURIComponent(messageText)}`;
        window.open(smsUrl, '_blank');
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Konum alınamadı: Lütfen cihazınızda konum iznini verin.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const soundModes = [
    { key: 'wail', label: 'Acil Kurtarma Sireni', desc: 'Sürekli yükselip alçalan cankurtaran ve ambulans alarmı' },
    { key: 'morse', label: 'Uluslararası SOS Mors Kodu', desc: '••• ——— ••• Yüksek tonlu kesintisiz SOS acil yardım sinyali' },
    { key: 'hilo', label: 'İki Tonlu Polis Sireni', desc: 'Klasik Avrupa polis ve acil durum iki tonlu alarmı' },
    { key: 'pierce', label: 'Yüksek Desibel Panik Alarmı', desc: 'Saldırganı caydırıcı ve uzaktan duyulan keskin alarm' }
  ];

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }}>
      <style>{`
        @keyframes pulseGlowRing {
          0% { transform: scale(0.95); opacity: 0.9; box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { transform: scale(1.06); opacity: 0.3; box-shadow: 0 0 0 28px rgba(220, 38, 38, 0); }
          100% { transform: scale(0.95); opacity: 0.9; box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes strobeBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
        .emergency-btn-pulse {
          animation: pulseGlowRing 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        .strobe-badge-blink {
          animation: strobeBlink 0.3s infinite ease-in-out;
        }
      `}</style>

      {/* ========================================================
          FULL SCREEN STROBE / BEACON OVERLAY (TAM EKRAN ÇAKAR)
      ======================================================== */}
      {isFullScreen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: strobeColors.bg,
            color: strobeColors.text,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'calc(24px + env(safe-area-inset-top, 0px)) 24px calc(32px + env(safe-area-inset-bottom, 0px)) 24px',
            transition: 'background-color 0.05s ease, color 0.05s ease',
            userSelect: 'none',
            textAlign: 'center'
          }}
        >
          {/* Top Bar inside Fullscreen */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '800',
              backdropFilter: 'blur(6px)'
            }}>
              <Siren size={18} className="strobe-badge-blink" />
              <span>TAM EKRAN SOS ÇAKAR</span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              style={{
                border: 'none',
                background: 'rgba(0, 0, 0, 0.25)',
                color: 'inherit',
                padding: '8px 16px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)'
              }}
            >
              <Minimize2 size={16} />
              <span>Küçült</span>
            </button>
          </div>

          {/* Center Giant Action */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              fontSize: 'clamp(42px, 12vw, 84px)',
              fontWeight: '900',
              letterSpacing: '-2px',
              lineHeight: 1
            }}>
              {isActive ? 'SOS SİREN' : 'SİREN HAZIR'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', opacity: 0.9 }}>
              {isActive ? 'Son Ses Acil Durum Uyarısı Aktif' : 'Başlatmak için dokunun'}
            </div>

            {/* Giant Center Button */}
            <button
              type="button"
              onClick={toggleSiren}
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                border: '6px solid rgba(255, 255, 255, 0.8)',
                background: isActive ? '#000000' : '#dc2626',
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: '900',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                transform: 'scale(1)',
                transition: 'transform 0.1s'
              }}
            >
              <Siren size={44} />
              <span>{isActive ? 'DURDUR' : 'BAŞLAT'}</span>
            </button>
          </div>

          {/* Bottom Fast Controls inside Fullscreen */}
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', gap: '10px' }}>
            <a
              href="tel:112"
              style={{
                flex: 1,
                background: '#ffffff',
                color: '#dc2626',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '15px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Phone size={18} />
              <span>112 Acil</span>
            </a>
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              style={{
                flex: 1,
                border: '2px solid currentColor',
                background: 'transparent',
                color: 'inherit',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Sayfaya Dön
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PAGE CONTAINER (KART GÖRÜNÜMÜ & DETAYLI KONTROLLER)
      ======================================================== */}
      <div>
        {/* Dynamic Siren Strobe Banner / Main Interactive Card */}
        <div style={{
          background: isActive ? strobeColors.bg : 'linear-gradient(180deg, #ffffff 0%, #fffcfc 100%)',
          color: isActive ? strobeColors.text : '#0f172a',
          border: isActive ? `3px solid ${strobeColors.border}` : '1px solid #fee2e2',
          borderRadius: '24px',
          padding: '24px 20px',
          marginBottom: '16px',
          boxShadow: isActive 
            ? '0 12px 36px rgba(220, 38, 38, 0.35)' 
            : '0 4px 20px rgba(220, 38, 38, 0.06)',
          transition: 'background-color 0.08s ease, color 0.08s ease, border-color 0.08s ease',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Clean Title & Description */}
          <h2 style={{
            fontSize: '18px',
            fontWeight: '900',
            letterSpacing: '-0.3px',
            margin: '0 0 5px 0',
            color: 'inherit'
          }}>
            {isActive ? 'Yüksek Desibel SOS Alarmı Çalıyor' : 'Acil Durum & SOS Panik Sireni'}
          </h2>
          <p style={{
            fontSize: '11.5px',
            fontWeight: '500',
            margin: '0 0 20px 0',
            color: isActive ? strobeColors.text : '#64748b',
            maxWidth: '420px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.45
          }}>
            {isActive 
              ? 'Telefonunuz en yüksek sesle SOS çalıyor ve çakar flaşörü yanıp sönüyor.' 
              : 'Tehlike, saldırı, kaza veya kaybolma anında çevredekilerin dikkatini çekmek için sireni başlatın.'}
          </p>

          {/* MAIN TACTILE SOS BUTTON */}
          <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0 8px 0' }}>
            {/* Outer tactile glow bezel */}
            <div style={{
              position: 'absolute',
              width: '182px',
              height: '182px',
              borderRadius: '50%',
              background: isActive 
                ? 'rgba(220, 38, 38, 0.25)' 
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(220, 38, 38, 0.04) 100%)',
              border: isActive ? 'none' : '1px solid rgba(239, 68, 68, 0.2)',
              pointerEvents: 'none'
            }} className={isActive ? 'emergency-btn-pulse' : ''} />

            <button
              type="button"
              onClick={toggleSiren}
              style={{
                width: '154px',
                height: '154px',
                borderRadius: '50%',
                border: isActive ? '4px solid #ffffff' : '4px solid rgba(255, 255, 255, 0.4)',
                background: isActive 
                  ? '#09090b' 
                  : 'linear-gradient(145deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                boxShadow: isActive 
                  ? '0 0 36px rgba(220, 38, 38, 0.7), 0 8px 24px rgba(0,0,0,0.5)' 
                  : '0 12px 30px rgba(220, 38, 38, 0.38), inset 0 2px 4px rgba(255,255,255,0.3)',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 2,
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isActive ? (
                <>
                  <div style={{ width: '22px', height: '22px', background: '#ef4444', borderRadius: '5px', marginBottom: '2px' }} />
                  <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.8px' }}>
                    DURDUR
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>
                    Kapatmak İçin Bas
                  </span>
                </>
              ) : (
                <>
                  <Siren size={32} strokeWidth={2.4} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                  <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px', lineHeight: 1.1 }}>
                    SOS
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.4px', opacity: 0.9 }}>
                    SİRENİ BAŞLAT
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================
            SETTINGS: SES MODU & ÇAKAR RENGİ
        ======================================================== */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Volume1 size={17} color="#dc2626" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
              Siren Ses Modu
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {soundModes.map(m => {
              const isSelected = soundMode === m.key;
              return (
                <div
                  key={m.key}
                  onClick={() => handleSoundModeChange(m.key)}
                  style={{
                    border: isSelected ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' 
                      : '#f8fafc',
                    borderRadius: '13px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: isSelected 
                      ? '0 3px 12px rgba(220, 38, 38, 0.08)' 
                      : '0 1px 2px rgba(15, 23, 42, 0.02)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: isSelected ? '#b91c1c' : '#0f172a',
                      marginBottom: '2px',
                      letterSpacing: '-0.2px'
                    }}>
                      {m.label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: isSelected ? '#7f1d1d' : '#64748b',
                      lineHeight: 1.35
                    }}>
                      {m.desc}
                    </div>
                  </div>

                  {/* Clean Radio Indicator */}
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid #dc2626' : '2px solid #cbd5e1',
                    background: '#ffffff',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            QUICK ACTIONS: 112, KONSOLOSLUK, GPS SHARE
        ======================================================== */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldAlert size={17} color="#dc2626" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
              Hızlı İmdat Hatları & Konum Bildirimi
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* ROW 1: 112 ACİL ÇAĞRI */}
            <a
              href="tel:112"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '13px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={15} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#991b1b', letterSpacing: '-0.2px' }}>
                      112 Acil Çağrı
                    </span>
                    <span style={{ fontSize: '8.5px', fontWeight: '700', background: '#fee2e2', color: '#b91c1c', padding: '1px 5px', borderRadius: '5px' }}>
                      Ücretsiz
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#b91c1c', marginTop: '1px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Polis • Ambulans • İtfaiye (Tüm Acil Durumlar)
                  </div>
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                marginLeft: '8px'
              }}>
                <Phone size={14} />
              </div>
            </a>

            {/* ROW 2: 7/24 KONSOLOSLUK ÇAĞRI MERKEZİ */}
            <a
              href="tel:+903122922929"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '13px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: '#334155',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Radio size={15} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                      7/24 Konsolosluk Hattı
                    </span>
                    <span style={{ fontSize: '8.5px', fontWeight: '700', background: '#e2e8f0', color: '#475569', padding: '1px 5px', borderRadius: '5px' }}>
                      Dışişleri
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    +90 312 292 29 29 (Yurt Dışı T.C. Vatandaşları)
                  </div>
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                marginLeft: '8px'
              }}>
                <Phone size={14} />
              </div>
            </a>

            {/* ROW 3: CANLI GPS KONUM PAYLAŞIMI */}
            <div
              onClick={handleShareLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '13px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                cursor: isLocating ? 'default' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { if (!isLocating) e.currentTarget.style.background = '#dcfce7'; }}
              onMouseLeave={e => { if (!isLocating) e.currentTarget.style.background = '#f0fdf4'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: '#16a34a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPin size={15} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#14532d', letterSpacing: '-0.2px' }}>
                      SMS ile Konum Bildir
                    </span>
                    <span style={{ fontSize: '8.5px', fontWeight: '700', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '5px' }}>
                      GPS
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#15803d', marginTop: '1px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isLocating ? 'Canlı GPS koordinatları alınıyor...' : 'Harita linkinizi tek tıkla SMS olarak gönderin'}
                  </div>
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                marginLeft: '8px'
              }}>
                <Share2 size={14} />
              </div>
            </div>
          </div>

          {locationError && (
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '8px', textAlign: 'center', background: '#fef2f2', padding: '6px 10px', borderRadius: '8px' }}>
              {locationError}
            </div>
          )}
        </div>

        {/* Safety & Epilepsy Notice */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#64748b',
          lineHeight: 1.4
        }}>
          <Info size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
          <span>
            <strong>Uyarı:</strong> Bu araç acil durumlarda dikkat çekmek için tasarlanmıştır. Yüksek desibel ses ve hızlı yanıp sönen flaşör (çakar) ışıklar içerir.
          </span>
        </div>
      </div>
    </div>
  );
}
