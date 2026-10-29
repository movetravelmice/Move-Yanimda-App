import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Languages, 
  ArrowLeftRight, 
  Mic, 
  MicOff, 
  Volume2, 
  Copy, 
  Check, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
  MessageCircle,
  VolumeX,
  Play,
  X,
  Smartphone,
  Monitor,
  ShieldAlert,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  translateText, 
  speakText, 
  stopSpeech,
  createSpeechRecognizer,
  requestMicrophonePermission
} from '../../services/travelToolsService';
import Header from '../../components/Header';
import CountryFlag from '../../components/CountryFlag';

export default function PublicTranslator({ isEmbedded = false }) {
  const navigate = useNavigate();

  // Mode: 'dialogue' (Karşılıklı Sesli Konuşma) | 'text' (Yazılı & Tekli Çeviri)
  const [activeMode, setActiveMode] = useState('dialogue');

  // Languages
  const [sourceLang, setSourceLang] = useState('tr');
  const [targetLang, setTargetLang] = useState('en');

  // Text Mode States
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dialogue Mode States (Two-way Live Voice)
  const [conversation, setConversation] = useState([]);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isListeningSource, setIsListeningSource] = useState(false);
  const [isListeningTarget, setIsListeningTarget] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Common States
  const [errorMsg, setErrorMsg] = useState('');
  const speechRecognizerRef = useRef(null);
  const conversationEndRef = useRef(null);

  // Microphone Permission States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isCheckingMic, setIsCheckingMic] = useState(false);
  const [permissionGuideDevice, setPermissionGuideDevice] = useState('mobile'); // 'mobile' | 'ios' | 'desktop'
  const [pendingMicAction, setPendingMicAction] = useState(null);
  const [permissionSuccessMsg, setPermissionSuccessMsg] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // 'source' | 'target' | null

  // Click outside to close language dropdowns
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-lang-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openDropdown]);

  // Auto-detect device for permission guide
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/i.test(ua)) {
        setPermissionGuideDevice('ios');
      } else if (/Android/i.test(ua)) {
        setPermissionGuideDevice('mobile');
      } else {
        setPermissionGuideDevice('desktop');
      }
    }
  }, []);

  const getSourceLangObj = () => SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[1];
  const getTargetLangObj = () => SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[2];

  // Auto-scroll conversation to bottom
  useEffect(() => {
    if (activeMode === 'dialogue' && conversation.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, activeMode]);

  // Debounced translation for Text Mode
  useEffect(() => {
    if (activeMode !== 'text') return;
    if (!inputText.trim()) {
      setTranslatedText('');
      setDetectedLang('');
      return;
    }

    const timer = setTimeout(() => {
      handleTranslateText();
    }, 600);

    return () => clearTimeout(timer);
  }, [inputText, targetLang, sourceLang, activeMode]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      stopSpeech();
    };
  }, []);

  // Swap Languages
  const handleSwap = () => {
    if (sourceLang === 'auto') {
      setSourceLang(targetLang);
      setTargetLang('tr');
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
    if (activeMode === 'text') {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  // ==========================================
  // TEXT MODE LOGIC
  // ==========================================
  const handleTranslateText = async (overrideText) => {
    const textToTranslate = (overrideText !== undefined ? overrideText : inputText).trim();
    if (!textToTranslate) return;

    setIsTranslating(true);
    setErrorMsg('');

    try {
      const res = await translateText(textToTranslate, sourceLang, targetLang);
      setTranslatedText(res.translatedText);
      if (res.detectedSource && sourceLang === 'auto') {
        const found = SUPPORTED_LANGUAGES.find(l => l.code === res.detectedSource);
        setDetectedLang(found ? found.name : res.detectedSource.toUpperCase());
      }
    } catch (err) {
      console.error("Translate error:", err);
      setErrorMsg(err.message || 'Çeviri yapılırken bir hata oluştu.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakText = async (text, lang) => {
    if (!text) return;
    try {
      await speakText(text, lang);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  // ==========================================
  // MICROPHONE PERMISSION & EXECUTION WRAPPER
  // ==========================================
  const executeWithMicrophonePermission = async (actionCallback) => {
    setErrorMsg('');
    setPermissionSuccessMsg('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Tarayıcınız ses tanıma özelliğini desteklemiyor. Google Chrome, Safari veya Microsoft Edge kullanmanızı öneririz.');
      return;
    }

    setIsCheckingMic(true);

    try {
      // Explicitly calls getUserMedia to force the browser to show native permission prompt!
      const permResult = await requestMicrophonePermission();

      if (!permResult.granted) {
        setIsCheckingMic(false);
        setPendingMicAction(() => actionCallback);
        setShowPermissionModal(true);
        return;
      }

      setIsCheckingMic(false);
      actionCallback();
    } catch (e) {
      setIsCheckingMic(false);
      console.warn("Microphone activation failed:", e);
      setPendingMicAction(() => actionCallback);
      setShowPermissionModal(true);
    }
  };

  const handleRequestPermissionNow = async () => {
    setIsCheckingMic(true);
    setErrorMsg('');
    try {
      const permResult = await requestMicrophonePermission();
      if (permResult.granted) {
        setPermissionSuccessMsg('Mikrofon erişim izni onaylandı! Ses dinleme başlatılıyor...');
        setTimeout(() => {
          setShowPermissionModal(false);
          setPermissionSuccessMsg('');
          if (pendingMicAction) {
            pendingMicAction();
            setPendingMicAction(null);
          }
        }, 750);
      } else {
        setErrorMsg('Tarayıcınız otomatik izin onay penceresini göstermedi veya izin reddedildi. Lütfen aşağıdaki adımları uygulayınız.');
      }
    } catch (err) {
      setErrorMsg('Mikrofon izni alınamadı. Lütfen cihaz ayarlarınızı kontrol edin.');
    } finally {
      setIsCheckingMic(false);
    }
  };

  const handleTriggerDialogue = (speakerSide) => {
    if (isListeningSource || isListeningTarget) {
      speechRecognizerRef.current?.stop();
      setIsListeningSource(false);
      setIsListeningTarget(false);
      return;
    }
    executeWithMicrophonePermission(() => {
      startDialogueListening(speakerSide);
    });
  };

  const handleTriggerTextMic = (forLang = 'source') => {
    if (isListeningSource || isListeningTarget) {
      speechRecognizerRef.current?.stop();
      setIsListeningSource(false);
      setIsListeningTarget(false);
      return;
    }
    executeWithMicrophonePermission(() => {
      handleTextMic(forLang);
    });
  };

  // Text Mode Microphone
  const handleTextMic = (forLang = 'source') => {
    if (isListeningSource || isListeningTarget) {
      speechRecognizerRef.current?.stop();
      setIsListeningSource(false);
      setIsListeningTarget(false);
      return;
    }

    setErrorMsg('');
    const langObj = forLang === 'source' ? getSourceLangObj() : getTargetLangObj();
    const langCode = langObj.bcp || (forLang === 'source' ? 'tr-TR' : 'en-US');

    const recognizer = createSpeechRecognizer({
      lang: langCode,
      onResult: (spokenText) => {
        setInputText(spokenText);
        setIsListeningSource(false);
        setIsListeningTarget(false);
        handleTranslateText(spokenText);
      },
      onError: (err) => {
        setIsListeningSource(false);
        setIsListeningTarget(false);
        if (err.isPermissionError) {
          setPendingMicAction(() => () => handleTextMic(forLang));
          setShowPermissionModal(true);
        } else {
          setErrorMsg(err.message);
        }
      },
      onEnd: () => {
        setIsListeningSource(false);
        setIsListeningTarget(false);
      }
    });

    if (!recognizer.isSupported) {
      setErrorMsg('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
      return;
    }

    speechRecognizerRef.current = recognizer;
    if (forLang === 'source') setIsListeningSource(true);
    else setIsListeningTarget(true);
    recognizer.start();
  };

  // ==========================================
  // TWO-WAY LIVE VOICE DIALOGUE LOGIC
  // ==========================================
  const startDialogueListening = (speakerSide) => {
    // If already listening, stop
    if (isListeningSource || isListeningTarget) {
      speechRecognizerRef.current?.stop();
      setIsListeningSource(false);
      setIsListeningTarget(false);
      return;
    }

    stopSpeech();
    setCurrentlySpeakingId(null);
    setErrorMsg('');

    const isSource = speakerSide === 'source';
    const langObj = isSource ? getSourceLangObj() : getTargetLangObj();
    const fromCode = isSource ? sourceLang : targetLang;
    const toCode = isSource ? targetLang : sourceLang;
    const recognizerLang = langObj.bcp || (isSource ? 'tr-TR' : 'en-US');

    if (isSource) setIsListeningSource(true);
    else setIsListeningTarget(true);

    const recognizer = createSpeechRecognizer({
      lang: recognizerLang,
      onResult: async (spokenText) => {
        setIsListeningSource(false);
        setIsListeningTarget(false);

        if (!spokenText.trim()) return;

        // Add pending item or translate immediately
        try {
          const res = await translateText(spokenText, fromCode, toCode);
          const newItem = {
            id: Date.now() + Math.random(),
            speaker: speakerSide,
            originalText: spokenText,
            translatedText: res.translatedText,
            fromLang: fromCode,
            toLang: toCode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setConversation(prev => [...prev, newItem]);

          // Auto-speak if enabled with short delay to allow audio hardware transition on Android
          if (autoSpeak && res.translatedText) {
            setCurrentlySpeakingId(newItem.id);
            setTimeout(() => {
              speakText(res.translatedText, toCode).finally(() => {
                setCurrentlySpeakingId(null);
              });
            }, 180);
          }
        } catch (err) {
          setErrorMsg(err.message || 'Konuşma çevrilirken bir hata oluştu.');
        }
      },
      onError: (err) => {
        setIsListeningSource(false);
        setIsListeningTarget(false);
        if (err.isPermissionError) {
          setPendingMicAction(() => () => startDialogueListening(speakerSide));
          setShowPermissionModal(true);
        } else {
          setErrorMsg(err.message);
        }
      },
      onEnd: () => {
        setIsListeningSource(false);
        setIsListeningTarget(false);
      }
    });

    if (!recognizer.isSupported) {
      setIsListeningSource(false);
      setIsListeningTarget(false);
      setErrorMsg('Tarayıcınız ses tanıma (Speech-to-Text) özelliğini desteklemiyor.');
      return;
    }

    speechRecognizerRef.current = recognizer;
    recognizer.start();
  };

  const handlePlayMessageAudio = async (item) => {
    if (currentlySpeakingId === item.id) {
      stopSpeech();
      setCurrentlySpeakingId(null);
      return;
    }
    stopSpeech();
    setCurrentlySpeakingId(item.id);
    try {
      await speakText(item.translatedText, item.toLang);
    } finally {
      setCurrentlySpeakingId(null);
    }
  };

  const handleCopyMessage = (item) => {
    navigator.clipboard.writeText(item.translatedText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const sourceLangObj = getSourceLangObj();
  const targetLangObj = getTargetLangObj();

  // ==========================================
  // RENDER CONTENT
  // ==========================================
  const content = (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes soundWave {
          0% { height: 4px; }
          50% { height: 13px; }
          100% { height: 6px; }
        }
      `}</style>

      {/* 1. Mode Switcher Tabs inside a Card Container */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '6px',
        marginBottom: '12px',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
      }}>
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '13px'
        }}>
          <button
            type="button"
            onClick={() => setActiveMode('dialogue')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeMode === 'dialogue' ? '#ffffff' : 'transparent',
              color: activeMode === 'dialogue' ? '#D7147A' : '#64748b',
              fontSize: '12.5px',
              fontWeight: activeMode === 'dialogue' ? '800' : '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeMode === 'dialogue' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageCircle size={15} />
            <span>Karşılıklı Konuşma</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('text')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeMode === 'text' ? '#ffffff' : 'transparent',
              color: activeMode === 'text' ? '#D7147A' : '#64748b',
              fontSize: '12.5px',
              fontWeight: activeMode === 'text' ? '800' : '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeMode === 'text' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Languages size={15} />
            <span>Metin & Hızlı Çeviri</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#b91c1c',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setErrorMsg('')} 
            style={{ border: 'none', background: 'none', color: '#b91c1c', fontWeight: '800', cursor: 'pointer', fontSize: '11px' }}
          >
            Kapat
          </button>
        </div>
      )}

      {/* 2. Language Selector Bar (Şık ve Temaya Uygun Custom Açılır Menü) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '30px',
        border: '1.2px solid #F9BED8',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
        marginBottom: '12px',
        boxShadow: '0 4px 14px rgba(215, 20, 122, 0.05)',
        position: 'relative',
        zIndex: 60
      }}>
        {/* Source Language Custom Dropdown */}
        <div className="custom-lang-dropdown" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'source' ? null : 'source')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              background: openDropdown === 'source' ? '#FFF5F9' : '#f8fafc',
              border: openDropdown === 'source' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '6px 10px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: openDropdown === 'source' ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
              outline: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              {sourceLangObj?.flagCode ? (
                <CountryFlag country={sourceLangObj.flagCode} size="sm" />
              ) : (
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{sourceLangObj?.flag || '🌐'}</span>
              )}
              <span style={{
                fontSize: '11.5px',
                fontWeight: '750',
                color: openDropdown === 'source' ? '#D7147A' : '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sourceLangObj?.name || 'Türkçe'}
              </span>
            </div>
            <ChevronDown
              size={13}
              style={{
                color: openDropdown === 'source' ? '#D7147A' : '#64748b',
                transform: openDropdown === 'source' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}
            />
          </button>

          {/* Source Menu Popup */}
          {openDropdown === 'source' && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '185px',
              maxHeight: '260px',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.2px solid #F9BED8',
              boxShadow: '0 12px 28px -4px rgba(215, 20, 122, 0.18), 0 6px 16px rgba(15, 23, 42, 0.08)',
              zIndex: 1000,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {SUPPORTED_LANGUAGES.filter(l => activeMode === 'dialogue' ? l.code !== 'auto' : true).map(lang => {
                const isSelected = lang.code === sourceLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSourceLang(lang.code);
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isSelected ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' : 'transparent',
                      color: isSelected ? '#D7147A' : '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#FDF2F8';
                        e.currentTarget.style.color = '#D7147A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#334155';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      {lang.flagCode ? (
                        <CountryFlag country={lang.flagCode} size="sm" />
                      ) : (
                        <span style={{ fontSize: '13px', lineHeight: 1 }}>{lang.flag || '🌐'}</span>
                      )}
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: isSelected ? '800' : '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {lang.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={13} color="#D7147A" strokeWidth={2.8} style={{ flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={() => {
            handleSwap();
            setOpenDropdown(null);
          }}
          title="Dilleri Değiştir"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#FDF2F8',
            border: '1.5px solid #F9BED8',
            color: '#D7147A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
        >
          <ArrowLeftRight size={14} />
        </button>

        {/* Target Language Custom Dropdown */}
        <div className="custom-lang-dropdown" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'target' ? null : 'target')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              background: openDropdown === 'target' ? '#FFF5F9' : '#f8fafc',
              border: openDropdown === 'target' ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '6px 10px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: openDropdown === 'target' ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
              outline: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              {targetLangObj?.flagCode ? (
                <CountryFlag country={targetLangObj.flagCode} size="sm" />
              ) : (
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{targetLangObj?.flag || '🌐'}</span>
              )}
              <span style={{
                fontSize: '11.5px',
                fontWeight: '750',
                color: openDropdown === 'target' ? '#D7147A' : '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {targetLangObj?.name || 'İngilizce'}
              </span>
            </div>
            <ChevronDown
              size={13}
              style={{
                color: openDropdown === 'target' ? '#D7147A' : '#64748b',
                transform: openDropdown === 'target' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}
            />
          </button>

          {/* Target Menu Popup */}
          {openDropdown === 'target' && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: '185px',
              maxHeight: '260px',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.2px solid #F9BED8',
              boxShadow: '0 12px 28px -4px rgba(215, 20, 122, 0.18), 0 6px 16px rgba(15, 23, 42, 0.08)',
              zIndex: 1000,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => {
                const isSelected = lang.code === targetLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setTargetLang(lang.code);
                      setOpenDropdown(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isSelected ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' : 'transparent',
                      color: isSelected ? '#D7147A' : '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#FDF2F8';
                        e.currentTarget.style.color = '#D7147A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#334155';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      {lang.flagCode ? (
                        <CountryFlag country={lang.flagCode} size="sm" />
                      ) : (
                        <span style={{ fontSize: '13px', lineHeight: 1 }}>{lang.flag || '🌐'}</span>
                      )}
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: isSelected ? '800' : '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {lang.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={13} color="#D7147A" strokeWidth={2.8} style={{ flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODE 1: KARŞILIKLI SESLİ KONUŞMA (DİYALOG MODU)
      ======================================================== */}
      {activeMode === 'dialogue' && (
        <div>
          {/* 3. Options Strip Card: Auto-speak Toggle & Icon-Only Clear Button */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '8px 12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
          }}>
            {/* Elegant Auto-speak pill button */}
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: autoSpeak ? '#FDF2F8' : '#ffffff',
                border: autoSpeak ? '1.5px solid #F9BED8' : '1px solid #e2e8f0',
                padding: '5px 11px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                color: autoSpeak ? '#B01064' : '#64748b',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: autoSpeak ? '#D7147A' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transition: 'all 0.15s ease'
              }}>
                {autoSpeak ? <Volume2 size={11} /> : <VolumeX size={11} />}
              </div>
              <span>Otomatik Sesli Oku</span>
              <span style={{
                fontSize: '9px',
                fontWeight: '800',
                background: autoSpeak ? '#D7147A' : '#e2e8f0',
                color: autoSpeak ? '#ffffff' : '#64748b',
                padding: '1px 5px',
                borderRadius: '8px'
              }}>
                {autoSpeak ? 'AÇIK' : 'KAPALI'}
              </span>
            </button>

            {conversation.length > 0 && (
              <button
                type="button"
                onClick={() => setConversation([])}
                title={`Konuşmayı Temizle (${conversation.length} mesaj)`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Conversation Chat Stream */}
          <div style={{
            background: '#ffffff',
            borderRadius: '22px',
            border: '1px solid #e2e8f0',
            minHeight: '280px',
            maxHeight: '430px',
            overflowY: 'auto',
            padding: '16px 12px',
            marginBottom: '14px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {conversation.length === 0 ? (
              <div style={{
                margin: 'auto',
                textAlign: 'center',
                padding: '36px 16px',
                color: '#94a3b8'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                  color: '#D7147A',
                  border: '1px solid #F9BED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.1)'
                }}>
                  <Mic size={24} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Karşılıklı Sesli Seyahat Çevirmeni
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.5, maxWidth: '280px', margin: '0 auto' }}>
                  Aşağıdaki butonlara basarak kendi dilinizde veya karşı tarafın dilinde konuşun. Cümleler anında çevrilir ve sesli olarak okunur.
                </div>
              </div>
            ) : (
              conversation.map(item => {
                const isSource = item.speaker === 'source';
                const speakerName = isSource ? sourceLangObj.name : targetLangObj.name;
                const translatedLangName = isSource ? targetLangObj.name : sourceLangObj.name;
                const isSpeaking = currentlySpeakingId === item.id;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      borderRadius: '16px',
                      background: '#ffffff',
                      border: isSource ? '1.5px solid #F9BED8' : '1.5px solid #bfdbfe',
                      borderLeft: isSource ? '5px solid #D7147A' : '5px solid #2563eb',
                      padding: '13px 15px',
                      boxShadow: isSource 
                        ? '0 3px 12px rgba(215, 20, 122, 0.05), 0 1px 3px rgba(0,0,0,0.02)' 
                        : '0 3px 12px rgba(37, 99, 235, 0.05), 0 1px 3px rgba(0,0,0,0.02)',
                      position: 'relative'
                    }}>
                      {/* Card Top: Speaker Tag & Timestamp */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSource ? '#FDF2F8' : '#eff6ff',
                          color: isSource ? '#B01064' : '#1d4ed8',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          border: isSource ? '1px solid #FCE7F3' : '1px solid #dbeafe'
                        }}>
                          <CountryFlag country={isSource ? (sourceLangObj.flagCode || 'tr') : (targetLangObj.flagCode || 'gb')} size="sm" />
                          <span>{speakerName} {isSource ? '(Sen)' : '(Karşı Taraf)'}</span>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '600' }}>
                          {item.timestamp}
                        </span>
                      </div>

                      {/* Spoken original text (clean italic style) */}
                      <div style={{
                        fontSize: '12.5px',
                        color: '#64748b',
                        marginBottom: '10px',
                        fontStyle: 'italic',
                        lineHeight: 1.4
                      }}>
                        "{item.originalText}"
                      </div>

                      {/* Translated Hero Box */}
                      <div style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: isSource 
                          ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' 
                          : 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
                        borderRadius: '12px',
                        padding: '11px 14px',
                        border: isSource ? '1px solid #e2e8f0' : '1px solid #bfdbfe'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          fontWeight: '800',
                          color: isSource ? '#D7147A' : '#2563eb',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          marginBottom: '4px'
                        }}>
                          <span>➔</span>
                          <CountryFlag country={isSource ? (targetLangObj.flagCode || 'gb') : (sourceLangObj.flagCode || 'tr')} size="sm" />
                          <span>{translatedLangName}</span>
                        </div>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '800',
                          color: '#0f172a',
                          lineHeight: 1.45,
                          wordBreak: 'break-word'
                        }}>
                          {item.translatedText}
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        marginTop: '10px'
                      }}>
                        {/* Speaker Action */}
                        <button
                          type="button"
                          onClick={() => handlePlayMessageAudio(item)}
                          title="Sesli Dinle"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: isSpeaking ? (isSource ? '#D7147A' : '#2563eb') : '#ffffff',
                            color: isSpeaking ? '#ffffff' : (isSource ? '#D7147A' : '#2563eb'),
                            border: isSource ? '1px solid #F9BED8' : '1px solid #bfdbfe',
                            borderRadius: '16px',
                            padding: '5px 12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Volume2 size={13} />
                          <span>{isSpeaking ? 'Okunuyor...' : 'Dinle'}</span>
                          {isSpeaking && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '2px' }}>
                              <span style={{ width: '2px', height: '8px', background: '#ffffff', borderRadius: '1px', animation: 'soundWave 0.8s infinite alternate' }} />
                              <span style={{ width: '2px', height: '12px', background: '#ffffff', borderRadius: '1px', animation: 'soundWave 0.8s infinite alternate 0.2s' }} />
                              <span style={{ width: '2px', height: '6px', background: '#ffffff', borderRadius: '1px', animation: 'soundWave 0.8s infinite alternate 0.4s' }} />
                            </span>
                          )}
                        </button>

                        {/* Copy Action */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(item)}
                          title="Metni Kopyala"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: isCopied ? '#dcfce7' : '#ffffff',
                            color: isCopied ? '#15803d' : '#64748b',
                            border: isCopied ? '1px solid #86efac' : '1px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '5px 12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isCopied ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                          <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={conversationEndRef} />
          </div>

          {/* 4. Voice Microphone Buttons inside a Card Container */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '10px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              {/* Left Button: Source Language (e.g. Türkçe) */}
              <button
                type="button"
                onClick={() => handleTriggerDialogue('source')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: isListeningSource ? '2px solid #D7147A' : '1px solid #F9BED8',
                  background: isListeningSource 
                    ? 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)' 
                    : 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                  color: isListeningSource ? '#ffffff' : '#8E0C51',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isListeningSource 
                    ? '0 6px 20px rgba(215, 20, 122, 0.4)' 
                    : '0 2px 6px rgba(215, 20, 122, 0.1)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isListeningSource ? 'rgba(255,255,255,0.2)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isListeningSource ? (
                    <MicOff size={18} color="#ffffff" style={{ animation: 'pulse 1s infinite' }} />
                  ) : (
                    <Mic size={18} color="#D7147A" />
                  )}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800' }}>
                  {isListeningSource ? 'Dinleniyor...' : `${sourceLangObj.name} Konuş`}
                </div>
                <div style={{ fontSize: '10.5px', opacity: 0.85, fontWeight: '600' }}>
                  {isListeningSource ? 'Durdurmak için bas' : `Dokun & Konuş`}
                </div>
              </button>

              {/* Right Button: Target Language (e.g. İngilizce) */}
              <button
                type="button"
                onClick={() => handleTriggerDialogue('target')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: isListeningTarget ? '2px solid #2563eb' : '1px solid #bfdbfe',
                  background: isListeningTarget 
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                    : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  color: isListeningTarget ? '#ffffff' : '#1e40af',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isListeningTarget 
                    ? '0 6px 20px rgba(37, 99, 235, 0.4)' 
                    : '0 2px 6px rgba(37, 99, 235, 0.1)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isListeningTarget ? 'rgba(255,255,255,0.2)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isListeningTarget ? (
                    <MicOff size={18} color="#ffffff" style={{ animation: 'pulse 1s infinite' }} />
                  ) : (
                    <Mic size={18} color="#2563eb" />
                  )}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800' }}>
                  {isListeningTarget ? 'Dinleniyor...' : `${targetLangObj.name} Konuş`}
                </div>
                <div style={{ fontSize: '10.5px', opacity: 0.85, fontWeight: '600' }}>
                  {isListeningTarget ? 'Durdurmak için bas' : `Dokun & Konuş`}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 2: METİN & HIZLI ÇEVİRİ MODU
      ======================================================== */}
      {activeMode === 'text' && (
        <div>
          {/* Input Box Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#D7147A', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {sourceLangObj.flagCode && <CountryFlag country={sourceLangObj.flagCode} size="sm" />}
                <span>{sourceLang === 'auto' ? (detectedLang ? `Algılandı: ${detectedLang}` : 'Kaynak Metin') : `${sourceLangObj.name} Metin`}</span>
              </span>
              {inputText && (
                <button
                  type="button"
                  onClick={() => { setInputText(''); setTranslatedText(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}
                >
                  <Trash2 size={13} /> Temizle
                </button>
              )}
            </div>

            <textarea
              rows={3}
              placeholder="Çevirmek istediğiniz metni yazın veya mikrofona basarak konuşun..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13.5px',
                color: '#0f172a',
                lineHeight: '1.5',
                resize: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            {/* Microphones & Translate Button Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Source Mic */}
                <button
                  type="button"
                  onClick={() => handleTriggerTextMic('source')}
                  title={`${sourceLangObj.name} ile konuş`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: isListeningSource ? '1.5px solid #D7147A' : '1px solid #e2e8f0',
                    background: isListeningSource ? '#FDF2F8' : '#f8fafc',
                    color: isListeningSource ? '#D7147A' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {isListeningSource ? <MicOff size={14} color="#D7147A" /> : <Mic size={14} color="#D7147A" />}
                  <span>{isListeningSource ? 'Dinleniyor...' : 'Sesle Konuş'}</span>
                </button>
              </div>

              {/* Translate Action */}
              <button
                type="button"
                onClick={() => handleTranslateText()}
                disabled={isTranslating || !inputText.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: (isTranslating || !inputText.trim()) ? 'default' : 'pointer',
                  opacity: (isTranslating || !inputText.trim()) ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)'
                }}
              >
                {isTranslating ? (
                  <>
                    <Loader2 size={13} style={{ animation: 'spin 1s infinite linear' }} />
                    Çevriliyor...
                  </>
                ) : (
                  <>
                    Çevir <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Translation Result Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1.5px solid #F9BED8',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(215, 20, 122, 0.05)',
            background: 'linear-gradient(180deg, #ffffff 0%, #FDF2F8 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#B01064', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {targetLangObj.flagCode && <CountryFlag country={targetLangObj.flagCode} size="sm" />}
                <span>Çeviri Sonucu ({targetLangObj.name})</span>
              </span>

              {translatedText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Text to Speech */}
                  <button
                    type="button"
                    onClick={() => handleSpeakText(translatedText, targetLang)}
                    title="Sesli Dinle"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #F9BED8',
                      borderRadius: '8px',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#D7147A'
                    }}
                  >
                    <Volume2 size={15} />
                  </button>

                  {/* Copy */}
                  <button
                    type="button"
                    onClick={handleCopyText}
                    title="Metni Kopyala"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #F9BED8',
                      borderRadius: '8px',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: copied ? '#16a34a' : '#64748b'
                    }}
                  >
                    {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>

            <div style={{
              minHeight: '70px',
              fontSize: '14.5px',
              fontWeight: '700',
              color: translatedText ? '#0f172a' : '#94a3b8',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              display: 'flex',
              alignItems: translatedText ? 'flex-start' : 'center'
            }}>
              {isTranslating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D7147A', fontSize: '13px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s infinite linear' }} />
                  Anında çevriliyor...
                </div>
              ) : translatedText ? (
                translatedText
              ) : (
                <span style={{ fontSize: '13px', fontWeight: '400' }}>
                  Çeviri burada görüntülenecektir...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MİKROFON İZNİ & ONAY REHBERİ POPUP / MODAL                          */}
      {/* ================================================================= */}
      {showPermissionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            maxHeight: '92vh',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '24px 20px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => { setShowPermissionModal(false); setPendingMicAction(null); }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FDF2F8',
              border: '1.5px solid #F9BED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#D7147A',
              boxShadow: '0 4px 14px rgba(215, 20, 122, 0.15)'
            }}>
              <Mic size={26} />
            </div>

            {/* Modal Title & Subtitle */}
            <h3 style={{
              textAlign: 'center',
              fontSize: '17px',
              fontWeight: '800',
              color: '#0f172a',
              margin: '0 0 6px'
            }}>
              Mikrofon İzni Gerekli
            </h3>
            <p style={{
              textAlign: 'center',
              fontSize: '12.5px',
              color: '#64748b',
              lineHeight: 1.5,
              margin: '0 0 16px',
              padding: '0 8px'
            }}>
              Seyahat Çevirmeninin sesinizi duyabilmesi ve anında çeviri yapabilmesi için mikrofon erişimine onay vermeniz gerekmektedir.
            </p>

            {/* Success Notification */}
            {permissionSuccessMsg && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px'
              }}>
                <Check size={16} />
                <span>{permissionSuccessMsg}</span>
              </div>
            )}

            {/* Direct Native Prompt Trigger Button */}
            <button
              type="button"
              onClick={handleRequestPermissionNow}
              disabled={isCheckingMic}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: isCheckingMic ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(215, 20, 122, 0.35)',
                marginBottom: '16px',
                opacity: isCheckingMic ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {isCheckingMic ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s infinite linear' }} />
                  <span>Onay Bekleniyor...</span>
                </>
              ) : (
                <>
                  <Mic size={16} />
                  <span>İzin Onay Penceresini Aç</span>
                </>
              )}
            </button>

            {/* Device Instructions Box */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '14px',
              marginBottom: '14px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#334155',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Onay Penceresi Çıkmıyorsa:</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>Cihazınızı Seçin</span>
              </div>

              {/* Device selector tabs */}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setPermissionGuideDevice('mobile')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: permissionGuideDevice === 'mobile' ? '1px solid #F9BED8' : '1px solid #e2e8f0',
                    background: permissionGuideDevice === 'mobile' ? '#FDF2F8' : '#ffffff',
                    color: permissionGuideDevice === 'mobile' ? '#D7147A' : '#64748b',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📱 Android
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionGuideDevice('ios')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: permissionGuideDevice === 'ios' ? '1px solid #F9BED8' : '1px solid #e2e8f0',
                    background: permissionGuideDevice === 'ios' ? '#FDF2F8' : '#ffffff',
                    color: permissionGuideDevice === 'ios' ? '#D7147A' : '#64748b',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  🍏 iPhone / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionGuideDevice('desktop')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: permissionGuideDevice === 'desktop' ? '1px solid #F9BED8' : '1px solid #e2e8f0',
                    background: permissionGuideDevice === 'desktop' ? '#FDF2F8' : '#ffffff',
                    color: permissionGuideDevice === 'desktop' ? '#D7147A' : '#64748b',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  💻 Bilgisayar
                </button>
              </div>

              {/* Step Guide */}
              {permissionGuideDevice === 'mobile' && (
                <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>1</span>
                    <span>Tarayıcının adres çubuğunda yer alan <b>kilit (🔒)</b> veya ayar simgesine dokunun.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>2</span>
                    <span><b>İzinler</b> veya <b>Site Ayarları</b> menüsüne girin.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>3</span>
                    <span><b>Mikrofon</b> ayarını <b>"İzin Ver"</b> veya <b>"Açık"</b> yapın.</span>
                  </div>
                </div>
              )}

              {permissionGuideDevice === 'ios' && (
                <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>1</span>
                    <span>Safari adres çubuğunun solundaki <b>"aA"</b> veya <b>kilit (🔒)</b> simgesine dokunun.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>2</span>
                    <span><b>Web Sitesi Ayarları</b>'na dokunun ve <b>Mikrofon</b>'u <b>"İzin Ver"</b> yapın.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>3</span>
                    <span>Telefonun <i>Ayarlar &gt; Safari / Chrome &gt; Mikrofon</i> izninin açık olduğunu kontrol edin.</span>
                  </div>
                </div>
              )}

              {permissionGuideDevice === 'desktop' && (
                <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>1</span>
                    <span>Adres çubuğundaki URL'nin hemen solundaki <b>kilit (🔒)</b> simgesine tıklayın.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>2</span>
                    <span><b>Mikrofon</b> anahtarını <b>Açık / İzin Ver</b> yapın.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e2e8f0', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>3</span>
                    <span>Sayfayı yenileyin veya aşağıdaki "İzni Tekrar Dene" butonuna basın.</span>
                  </div>
                </div>
              )}
            </div>

            {/* PWA / App note */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '12px',
              padding: '9px 12px',
              marginBottom: '16px',
              fontSize: '11px',
              color: '#b45309',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: 1.45
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><b>Uygulama (PWA) Olarak Kullanıyorsanız:</b> Cihazınızın <i>Ayarlar &gt; Uygulamalar &gt; Move Yanımda &gt; İzinler</i> ekranından Mikrofon iznini etkinleştiriniz.</span>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRequestPermissionNow}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                İzni Tekrar Dene
              </button>
              <button
                type="button"
                onClick={() => { setShowPermissionModal(false); setPendingMicAction(null); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      paddingBottom: '110px'
    }}>
      <Header 
        title="Seyahat Çevirmeni"
        subtitle="Canlı İki Yönlü Sesli Konuşma & Metin Çevirisi"
        showBack
        onBack={() => navigate(-1)}
        marginBottom="0px"
      />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 14px' }}>
        {content}
      </div>
    </div>
  );
}
