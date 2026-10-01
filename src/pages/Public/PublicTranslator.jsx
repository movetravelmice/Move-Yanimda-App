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
  Play
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  translateText, 
  speakText, 
  createSpeechRecognizer 
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
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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
        setErrorMsg(err.message);
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

          // Auto-speak if enabled
          if (autoSpeak && res.translatedText) {
            setCurrentlySpeakingId(newItem.id);
            speakText(res.translatedText, toCode).finally(() => {
              setCurrentlySpeakingId(null);
            });
          }
        } catch (err) {
          setErrorMsg(err.message || 'Konuşma çevrilirken bir hata oluştu.');
        }
      },
      onError: (err) => {
        setIsListeningSource(false);
        setIsListeningTarget(false);
        setErrorMsg(err.message);
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
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }
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

      {/* 2. Language Selector Bar (Daha Oval & Küçültülmüş Yazılar & Gerçek Bayraklar) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '30px',
        border: '1px solid #e2e8f0',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '12px',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
      }}>
        {/* Source Language Select */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '2px 8px 2px 10px'
        }}>
          {sourceLangObj?.flagCode && (
            <CountryFlag country={sourceLangObj.flagCode} size="sm" />
          )}
          <select
            value={sourceLang}
            onChange={e => setSourceLang(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 2px',
              borderRadius: '24px',
              border: 'none',
              background: 'transparent',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {SUPPORTED_LANGUAGES.filter(l => activeMode === 'dialogue' ? l.code !== 'auto' : true).map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwap}
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

        {/* Target Language Select */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '2px 8px 2px 10px'
        }}>
          {targetLangObj?.flagCode && (
            <CountryFlag country={targetLangObj.flagCode} size="sm" />
          )}
          <select
            value={targetLang}
            onChange={e => setTargetLang(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 2px',
              borderRadius: '24px',
              border: 'none',
              background: 'transparent',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
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
                onClick={() => startDialogueListening('source')}
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
                onClick={() => startDialogueListening('target')}
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
                  onClick={() => handleTextMic('source')}
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
