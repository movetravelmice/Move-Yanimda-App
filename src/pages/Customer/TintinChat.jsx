import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, Send, Sparkles, AlertCircle, Copy, Check, RefreshCw, Trash2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTourStore } from '../../store/tourStore';
import { useSettingsStore } from '../../store/settingsStore';
import { generateTintinReply } from '../../services/aiService';

export default function TintinChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore(state => state.user);
  const tours = useTourStore(state => state.tours);
  const geminiConfig = useSettingsStore(state => state.geminiConfig);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);

  // Track whether an initial/pending prompt has already been processed
  const processedPromptsRef = useRef(new Set());
  const isExecutingRef = useRef(false);

  // Storage key specific to this user
  const storageKey = useMemo(() => {
    return `tintin_chat_history_${user?.id || user?.email || 'guest'}`;
  }, [user]);

  // Find all user's tours
  const userTours = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'ticketing') return tours;
    if (user.role === 'expert') {
      return tours.filter(t => t.guideName === user.name || t.expert?.name === user.name || t.expert?.email === user.email);
    }
    // Customer
    return tours.filter(t => 
      t.participants?.some(p => 
        p.id === user.id || 
        (p.email && user.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase())
      )
    );
  }, [tours, user]);

  // Default welcome message generator
  const getWelcomeMessage = useMemo(() => {
    const userName = user?.name ? user.name.split(' ')[0] : 'Değerli Misafirimiz';
    return {
      id: 'welcome-msg',
      sender: 'tintin',
      text: `Merhaba ${userName}! Ben **Tintin**, Move Travel & MICE akıllı seyahat asistanınızım.\n\nSeyahatinizle ilgili aklınıza takılan her şeyi bana sorabilirsiniz. Size nasıl yardımcı olabilirim?`,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
  }, [user]);

  // Safe data extraction helpers to avoid runtime crashes with varied tour data shapes
  const extractFlights = (flightsData, fallbackPnr) => {
    if (Array.isArray(flightsData)) {
      return flightsData.map(f => ({
        airline: f?.airline || '',
        flightNumber: f?.flightNumber || f?.flightNo || '',
        route: f?.route || `${f?.from || ''} - ${f?.to || ''}`,
        departureTime: f?.departureTime || f?.time || '',
        arrivalTime: f?.arrivalTime || '',
        date: f?.date || '',
        pnr: f?.pnr || fallbackPnr || '',
        terminal: f?.terminal || '',
        gate: f?.gate || ''
      }));
    }
    if (typeof flightsData === 'object' && flightsData !== null) {
      return [{
        airline: flightsData.airline || '',
        flightNumber: flightsData.flightNumber || flightsData.flightNo || '',
        route: flightsData.route || '',
        departureTime: flightsData.departureTime || '',
        arrivalTime: flightsData.arrivalTime || '',
        date: flightsData.date || '',
        pnr: flightsData.pnr || fallbackPnr || '',
        terminal: flightsData.terminal || '',
        gate: flightsData.gate || ''
      }];
    }
    return [];
  };

  const extractProgram = (progData, daysData) => {
    const list = Array.isArray(progData) ? progData : (Array.isArray(daysData) ? daysData : null);
    if (list) {
      return list.map((d, idx) => ({
        dayNumber: d?.day || d?.dayNumber || idx + 1,
        title: d?.title || `Gün ${idx + 1}`,
        description: d?.description || d?.content || (typeof d === 'string' ? d : ''),
        activities: Array.isArray(d?.activities) ? d.activities : []
      }));
    }
    if (typeof progData === 'string' && progData.trim()) {
      return [{ dayNumber: 1, title: 'Tur Programı', description: progData.trim() }];
    }
    if (typeof progData === 'object' && progData !== null) {
      return Object.entries(progData).map(([key, val], idx) => ({
        dayNumber: idx + 1,
        title: val?.title || key,
        description: val?.description || val?.content || (typeof val === 'string' ? val : '')
      }));
    }
    return [];
  };

  const extractTransfers = (transfersData) => {
    if (Array.isArray(transfersData)) return transfersData;
    if (typeof transfersData === 'object' && transfersData !== null) return [transfersData];
    return [];
  };

  // Build complete multi-tour travel context
  const buildTravelContext = () => {
    const formattedTours = (userTours || []).map(t => {
      const participantsList = Array.isArray(t?.participants) ? t.participants : [];
      const myParticipant = participantsList.find(p => 
        p?.id === user?.id || 
        (p?.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase())
      );

      return {
        tourId: t?.id || '',
        tourName: t?.name || '',
        status: t?.status || 'active',
        destination: t?.destinations || t?.location || '',
        dates: t?.dates || '',
        hotel: t?.hotel ? (typeof t.hotel === 'string' ? { name: t.hotel } : {
          name: t.hotel.name,
          address: t.hotel.address,
          rating: t.hotel.rating,
          phone: t.hotel.phone,
          checkIn: t.hotel.checkIn,
          checkOut: t.hotel.checkOut
        }) : (t?.accommodation ? { name: t.accommodation } : null),
        flights: extractFlights(t?.flights, myParticipant?.pnr),
        transfers: extractTransfers(t?.transfers),
        dailyProgram: extractProgram(t?.program, t?.days),
        guide: t?.guide || t?.expert ? {
          name: t.guideName || t.guide?.name || t.expert?.name,
          phone: t.guidePhone || t.guide?.phone || t.expert?.phone,
          email: t.guideEmail || t.guide?.email || t.expert?.email
        } : null,
        myTicket: myParticipant?.ticket || null,
        myPnr: myParticipant?.pnr || null
      };
    });

    return {
      userName: user?.name || 'Misafir',
      userEmail: user?.email || '',
      userCompany: user?.company || 'Move Travel & MICE',
      allUserTours: formattedTours
    };
  };

  // Execute AI reply generation with multi-model fallback and travel context
  const executeAiReply = async (text, currentMessages) => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsLoading(true);
    setErrorBanner(null);

    try {
      // Build conversation history for multi-turn context (last 10 turns)
      const conversationHistory = currentMessages
        .filter(m => m.id !== 'welcome-msg' && !m.isError)
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const travelContext = buildTravelContext();

      // Call AI Service with multi-model fallback and rich travel context
      const replyText = await generateTintinReply({
        message: text,
        conversationHistory: conversationHistory.slice(0, -1), // Previous history without current message
        travelContext: travelContext,
        geminiConfig: geminiConfig
      });

      const tintinMessageObj = {
        id: 'tintin-' + Date.now(),
        sender: 'tintin',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => {
        const next = [...prev, tintinMessageObj];
        messagesRef.current = next;
        return next;
      });
    } catch (err) {
      console.error('Tintin chat error:', err);
      setErrorBanner(err.message || 'Bağlantı hatası oluştu.');
      
      const errorMsgObj = {
        id: 'error-' + Date.now(),
        sender: 'tintin',
        isError: true,
        text: `⚠️ Üzgünüm, yanıt oluştururken bir sorun yaşandı: ${err.message}\n\nLütfen tekrar deneyin.`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const next = [...prev, errorMsgObj];
        messagesRef.current = next;
        return next;
      });
    } finally {
      isExecutingRef.current = false;
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Send message from chat input box
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading || isExecutingRef.current) return;

    setErrorBanner(null);
    setInputMessage('');

    const userMessageObj = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    const currentBase = (messagesRef.current && messagesRef.current.length > 0)
      ? messagesRef.current
      : (messages.length > 0 ? messages : [getWelcomeMessage]);
    const updatedMessages = [...currentBase, userMessageObj];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);

    await executeAiReply(text, updatedMessages);
  };

  // Load chat history from localStorage on mount and auto-send initial query if provided
  useEffect(() => {
    let initialList = [getWelcomeMessage];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed.map(m => m.id === 'welcome-msg' ? getWelcomeMessage : m);
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }

    // Check if there is an incoming prompt from landing page / URL / state
    let promptToSend = null;
    try {
      const fromSession = sessionStorage.getItem('pending_tintin_prompt');
      if (fromSession && fromSession.trim()) {
        promptToSend = fromSession.trim();
        sessionStorage.removeItem('pending_tintin_prompt');
      }
    } catch (e) {}

    if (!promptToSend) {
      const fromState = location.state?.initialPrompt || location.state?.q;
      if (fromState && typeof fromState === 'string' && fromState.trim()) {
        promptToSend = fromState.trim();
      }
    }

    if (!promptToSend) {
      const fromParams = searchParams.get('q');
      if (fromParams && fromParams.trim()) {
        promptToSend = fromParams.trim();
      }
    }

    // Clean search params quietly if present in URL
    if (searchParams.get('q')) {
      setSearchParams({}, { replace: true });
    }

    // Process prompt exactly once
    if (promptToSend && !processedPromptsRef.current.has(promptToSend)) {
      processedPromptsRef.current.add(promptToSend);

      // Check if last message was already this prompt (avoid double add if state re-hydrated)
      const lastMsg = initialList[initialList.length - 1];
      const isAlreadyLast = lastMsg && lastMsg.sender === 'user' && lastMsg.text === promptToSend;

      if (!isAlreadyLast) {
        const userMessageObj = {
          id: 'msg-' + Date.now(),
          sender: 'user',
          text: promptToSend,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };

        const updatedWithUser = [...initialList, userMessageObj];
        setMessages(updatedWithUser);
        messagesRef.current = updatedWithUser;

        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedWithUser));
        } catch (e) {}

        // Immediately execute AI reply
        executeAiReply(promptToSend, updatedWithUser);
      } else {
        setMessages(initialList);
        messagesRef.current = initialList;
      }
    } else {
      setMessages(initialList);
      messagesRef.current = initialList;
    }
  }, [storageKey]);

  // Save chat history to localStorage on update
  useEffect(() => {
    messagesRef.current = messages;
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.warn('Failed to save chat history:', e);
      }
    }
  }, [messages, storageKey]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setShowClearModal(true);
  };

  const confirmClearChat = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    setMessages([getWelcomeMessage]);
    setShowClearModal(false);
  };

  // Sanitize text from broken flag codes and malformed icon artifacts
  const cleanAssistantText = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/^(\s*[\*•\-]?\s*)(us|me|tr|gb|eu|de|fr|it|es|ru|ae|jp|cn|ca|au)\s+/gim, '$1')
      .replace(/(\b(us|me|tr|gb|eu|de|fr|it|es|ru|ae|jp)\b\s+)(?=[A-Z0-9])/gi, '')
      .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
      .trim();
  };

  // Markdown renderer for assistant messages
  const renderFormattedText = (text) => {
    if (!text) return null;

    const sanitized = cleanAssistantText(text);
    const lines = sanitized.split('\n');
    return lines.map((line, lineIdx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={lineIdx} style={{ height: '8px' }} />;
      }

      // Format bold (**text**), italic (*text*), inline code (`code`)
      const formatInline = (str) => {
        const parts = [];
        let remaining = str;
        let keyCounter = 0;

        const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
        const matches = [...str.matchAll(regex)];

        if (matches.length === 0) return str;

        let lastIndex = 0;
        matches.forEach(match => {
          const matchIndex = match.index;
          const matchText = match[0];

          if (matchIndex > lastIndex) {
            parts.push(remaining.substring(lastIndex, matchIndex));
          }

          if (matchText.startsWith('**') && matchText.endsWith('**')) {
            parts.push(
              <strong key={keyCounter++} style={{ color: 'var(--text-main, #1e293b)', fontWeight: 700 }}>
                {matchText.slice(2, -2)}
              </strong>
            );
          } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
            parts.push(
              <em key={keyCounter++} style={{ fontStyle: 'italic' }}>
                {matchText.slice(1, -1)}
              </em>
            );
          } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
            parts.push(
              <code key={keyCounter++} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', color: '#D7147A', fontFamily: 'monospace' }}>
                {matchText.slice(1, -1)}
              </code>
            );
          }

          lastIndex = matchIndex + matchText.length;
        });

        if (lastIndex < remaining.length) {
          parts.push(remaining.substring(lastIndex));
        }

        return parts;
      };

      // Bullet points (* or -)
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const itemContent = line.trim().replace(/^(\*|-|•)\s+/, '');
        return (
          <div key={lineIdx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '2px', marginBottom: '2px' }}>
            <span style={{ color: '#D7147A', fontWeight: 'bold', fontSize: '13px', lineHeight: '1.4' }}>•</span>
            <span style={{ flex: 1, lineHeight: '1.5', fontSize: '12.5px' }}>{formatInline(itemContent)}</span>
          </div>
        );
      }

      // Numbered lists (1. 2. etc.)
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={lineIdx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '3px', marginBottom: '3px' }}>
            <span style={{ color: '#D7147A', fontWeight: 'bold', minWidth: '16px', fontSize: '12px', lineHeight: '1.4' }}>{numMatch[1]}.</span>
            <span style={{ flex: 1, lineHeight: '1.5', fontSize: '12.5px' }}>{formatInline(numMatch[2])}</span>
          </div>
        );
      }

      // Headings (### or ##)
      if (line.trim().startsWith('### ')) {
        return (
          <div key={lineIdx} style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main, #0f172a)', marginTop: '6px', marginBottom: '3px' }}>
            {formatInline(line.trim().replace(/^###\s+/, ''))}
          </div>
        );
      }
      if (line.trim().startsWith('## ')) {
        return (
          <div key={lineIdx} style={{ fontWeight: 700, fontSize: '13.5px', color: '#D7147A', marginTop: '8px', marginBottom: '3px' }}>
            {formatInline(line.trim().replace(/^##\s+/, ''))}
          </div>
        );
      }

      // Normal paragraph line
      return (
        <div key={lineIdx} style={{ lineHeight: '1.5', marginTop: '2px', marginBottom: '2px', fontSize: '12.5px' }}>
          {formatInline(line)}
        </div>
      );
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      marginBottom: 'calc(-95px - env(safe-area-inset-bottom, 0px))',
      backgroundColor: '#f8fafc',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        paddingTop: 'calc(18px + env(safe-area-inset-top, 0px))',
        paddingBottom: '18px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* Back button & Assistant Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(user?.userType === 'individual' ? '/individual/dashboard' : '/');
              }
            }}
            aria-label="Geri"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main, #334155)',
              transition: 'background 0.2s',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Avatar & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #D7147A',
                boxShadow: '0 2px 8px rgba(255, 107, 0, 0.25)',
                background: 'white'
              }}>
                <img 
                  src="/tintin-avatar.png" 
                  alt="Tintin" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.style.background = 'linear-gradient(135deg, #D7147A, #ff8c38)';
                  }}
                />
              </div>
              {/* Online Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '2px solid #ffffff'
              }} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  Tintin
                </h1>
                <span style={{
                  background: 'linear-gradient(135deg, #D7147A, #D7147A)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Sparkles size={9} /> AI
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Move Travel Akıllı Seyahat Asistanı
              </div>
            </div>
          </div>

          {/* Clear Chat History Button */}
          <button
            onClick={handleClearChat}
            aria-label="Sohbeti Temizle"
            title="Sohbet Geçmişini Temizle"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fecaca';
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {errorBanner && (
        <div style={{
          backgroundColor: '#fee2e2',
          borderBottom: '1px solid #fecaca',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#b91c1c',
          flexShrink: 0
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{errorBanner}</div>
        </div>
      )}

      {/* Chat Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isErr = msg.isError;

          return (
            <div
              key={msg.id || index}
              style={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '10px',
                maxWidth: '100%'
              }}
            >
              {/* Avatar for Tintin */}
              {!isUser && (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1.5px solid #D7147A',
                  flexShrink: 0,
                  marginTop: '2px',
                  background: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}>
                  <img
                    src="/tintin-avatar.png"
                    alt="Tintin"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.style.background = 'linear-gradient(135deg, #D7147A, #ff8c38)';
                    }}
                  />
                </div>
              )}

              {/* Message Bubble Container */}
              <div style={{
                maxWidth: isUser ? '82%' : '88%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}>
                {/* Sender Name / Badge */}
                {!isUser && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#D7147A',
                    marginBottom: '3px',
                    marginLeft: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>Tintin</span>
                    <span style={{ color: '#94a3b8', fontWeight: 400 }}>• {msg.timestamp}</span>
                  </div>
                )}

                {/* Actual Bubble */}
                <div style={{
                  backgroundColor: isUser 
                    ? 'var(--primary, #D7147A)' 
                    : (isErr ? '#fff1f2' : '#ffffff'),
                  color: isUser 
                    ? '#ffffff' 
                    : (isErr ? '#9f1239' : '#1e293b'),
                  padding: '10px 14px',
                  borderRadius: isUser 
                    ? '16px 16px 4px 16px' 
                    : '4px 16px 16px 16px',
                  boxShadow: isUser 
                    ? '0 3px 10px rgba(255, 107, 0, 0.25)' 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  border: isUser 
                    ? 'none' 
                    : (isErr ? '1px solid #fecdd3' : '1px solid #e2e8f0'),
                  fontSize: '12.5px',
                  position: 'relative',
                  wordBreak: 'break-word',
                  lineHeight: '1.5'
                }}>
                  {isUser ? (
                    <div>{msg.text}</div>
                  ) : (
                    <div>
                      {renderFormattedText(msg.text)}
                    </div>
                  )}

                  {/* Copy button for Tintin messages */}
                  {!isUser && !isErr && msg.id !== 'welcome-msg' && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <button
                        onClick={() => copyToClipboard(msg.text, index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'color 0.2s'
                        }}
                        title="Metni Kopyala"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={12} color="#10b981" />
                            <span style={{ color: '#10b981' }}>Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Message Timestamp */}
                {isUser && (
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '3px', marginRight: '4px' }}>
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading / Generating Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1.5px solid #D7147A',
              flexShrink: 0,
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              <img src="/tintin-avatar.png" alt="Tintin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '12px 18px',
              borderRadius: '4px 18px 18px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '42px',
              boxSizing: 'border-box'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#D7147A', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out' }} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#D7147A', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out 0.2s' }} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#D7147A', display: 'inline-block', animation: 'typingBounce 1.4s infinite ease-in-out 0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar - White area extends all the way down under bottom nav */}
      <div style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-color, #e2e8f0)',
        paddingTop: '12px',
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        position: 'relative',
        zIndex: 50,
        flexShrink: 0,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '456px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '24px',
          padding: '3px 4px 3px 16px',
          boxSizing: 'border-box',
          transition: 'all 0.2s ease'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir mesaj yazın..."
            disabled={isLoading}
            style={{
              flex: 1,
              height: '38px',
              padding: '0',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: 'transparent',
              fontFamily: 'inherit',
              color: 'var(--text-main, #1e293b)'
            }}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            aria-label="Gönder"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: !inputMessage.trim() || isLoading ? '#e2e8f0' : 'var(--primary, #D7147A)',
              color: !inputMessage.trim() || isLoading ? '#94a3b8' : '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !inputMessage.trim() || isLoading ? 'default' : 'pointer',
              flexShrink: 0,
              boxShadow: !inputMessage.trim() || isLoading ? 'none' : '0 2px 8px rgba(255, 107, 0, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? (
              <RefreshCw size={15} className="spin" />
            ) : (
              <Send size={15} style={{ marginLeft: '1px' }} />
            )}
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal for Clear Chat */}
      {showClearModal && (
        <div 
          onClick={() => setShowClearModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px 20px',
              maxWidth: '320px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
              animation: 'scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              border: '4px solid #fecaca'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-main, #0f172a)',
              margin: '0 0 8px 0'
            }}>
              Sohbeti Temizle
            </h3>

            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted, #64748b)',
              margin: '0 0 22px 0',
              lineHeight: '1.5'
            }}>
              Tintin ile olan tüm mesajlaşma geçmişiniz silinecektir. Emin misiniz?
            </p>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Vazgeç
              </button>
              <button
                onClick={confirmClearChat}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                  transition: 'opacity 0.2s'
                }}
              >
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
