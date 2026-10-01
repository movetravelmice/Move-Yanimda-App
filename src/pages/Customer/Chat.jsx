import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  Speaker, 
  Mic, 
  MapPin, 
  Image as ImageIcon, 
  Play, 
  Pause, 
  Archive, 
  Trash2, 
  BellOff, 
  Bell, 
  Info, 
  Map, 
  AlertTriangle, 
  Lock, 
  Unlock,
  ExternalLink,
  Plus,
  Compass,
  ShieldCheck,
  Plane,
  User,
  Users,
  Search,
  Home,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useChatStore } from '../../store/chatStore';
import { useTourStore, getTourExperts, isTourActive, isTourPast } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Interactive Voice Note Player Component
function VoiceNoteBubble({ url, duration, isMe }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSec = (secs) => {
    if (!secs || isNaN(secs)) return duration || '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', padding: '6px 4px' }}>
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        onLoadedMetadata={() => audioRef.current && setAudioDuration(audioRef.current.duration)}
        preload="metadata"
      />
      
      {/* Play/Pause Circle Button */}
      <button 
        type="button"
        onClick={togglePlay}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: 'none',
          background: isMe ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'transform 0.15s, background 0.2s',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
      </button>

      {/* Waveform Visualization & Time */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '22px' }}>
          {[35, 65, 40, 85, 55, 95, 45, 75, 60, 90, 50, 80, 45, 70, 55, 85, 40, 60].map((h, idx) => {
            const barProgress = (idx / 18) * 100;
            const isPassed = progress >= barProgress;
            return (
              <div 
                key={idx} 
                style={{ 
                  flex: 1, 
                  height: `${h}%`, 
                  borderRadius: '2px', 
                  backgroundColor: isMe 
                    ? (isPassed ? '#ffffff' : 'rgba(255,255,255,0.45)') 
                    : (isPassed ? 'var(--primary)' : '#cbd5e1'),
                  transition: 'height 0.2s, background-color 0.1s',
                  animation: isPlaying ? `pulseWave 0.8s infinite alternate ${idx * 0.05}s` : 'none'
                }} 
              />
            );
          })}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', opacity: 0.85 }}>
          <span>{isPlaying ? formatSec(currentTime) : (duration || formatSec(audioDuration))}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
            <Mic size={10} /> Ses Kaydı
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const user = useAuthStore(state => state.user);
  const { systemAnnouncementAvatar, tourGroupAvatar, expertStatus, expertName } = useSettingsStore();
  const { tours, editTour } = useTourStore();
  const users = useUserStore(state => state.users);
  
  // Real expert resolution
  const resolvedExpertUser = users.find(u => u.name === expertName);
  const realExpertAvatar = resolvedExpertUser?.avatar || null;
  const safeExpertName = expertName || "Seyahat Uzmanı";
  
  const { messages: allMessages = [], addMessage, updateMessageStatus, markRoomAsRead, clearMessages, mutedChats, toggleMute } = useChatStore();

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [confirmClearPopup, setConfirmClearPopup] = useState(false);
  const [showPlaceSearchModal, setShowPlaceSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  
  const isGroupedDirect = chatId?.startsWith('direct_grouped_');
  const pIdMatched = isGroupedDirect 
      ? (user?.role === 'customer' ? user.id : chatId.replace('direct_grouped_', ''))
      : null;
  // Filter only active tours for private grouped chats
  const sharedTours = isGroupedDirect ? tours.filter(t => isTourActive(t) && t.participants?.some(p => p.id === pIdMatched || (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()))) : [];
  
  const [selectedTourId, setSelectedTourId] = useState('');
  useEffect(() => {
     if (isGroupedDirect && sharedTours.length > 0 && !selectedTourId) {
         setSelectedTourId(sharedTours[0].id);
     }
  }, [isGroupedDirect, sharedTours, selectedTourId]);

  const getDirectChatId = (tourId, pId) => {
      if (tourId === 'tour_avrupa_ruyasi' && pId === 'cust_1') return 'expert_direct';
      return `direct_${tourId}_${pId}`;
  };

  const effectiveChatId = isGroupedDirect ? getDirectChatId(selectedTourId || (sharedTours[0]?.id), pIdMatched) : chatId;

  const roomMessages = allMessages.filter(m => m.chatId === effectiveChatId);

  const endOfMessagesRef = useRef(null);
  
  const [inputText, setInputText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  let headerName = safeExpertName;
  let subtitle = "Çevrimdışı (Son görülme: Yakın zamanda)";
  let sColor = 'rgba(255,255,255,0.4)';
  if (expertStatus === 'online') { subtitle = "Çevrimiçi"; sColor = '#4ade80'; }
  else if (expertStatus === 'busy') { subtitle = "Meşgul (Birazdan Dönecek)"; sColor = '#facc15'; }
  
  let headerAvatar = realExpertAvatar || "https://ui-avatars.com/api/?name=" + safeExpertName.charAt(0) + "&background=D7147A&color=fff";
  let isReadOnlyArchive = false;
  let resolvedTour = null;
  let headerRoleIcon = null;

  let resolvedDirectUser = null;
  // Check for staff-to-staff direct chats
  if (chatId?.startsWith('direct_admin_') || chatId?.startsWith('direct_ticketing_')) {
      resolvedDirectUser = users.find(u => u.id !== user?.id && chatId.includes(u.id));
  }

  if (chatId?.startsWith('tour_')) {
      resolvedTour = tours.find(t => t.id === chatId);
      if (resolvedTour) {
          headerName = `${resolvedTour.name} Grubu`;
          subtitle = `${resolvedTour.participants?.length || 0} Katılımcı`;
          headerAvatar = resolvedTour.avatar || tourGroupAvatar;
          isReadOnlyArchive = isTourPast(resolvedTour);
          headerRoleIcon = <Users size={12} />;
      }
  } else if (chatId === 'expert_direct') {
      resolvedTour = tours.find(t => t.id === 'tour_avrupa_ruyasi') || tours[0];
      if (user?.role === 'expert' || user?.role === 'admin') {
          const p = resolvedTour?.participants?.find(x => x.id === 'cust_1');
          headerName = p?.name || "Demo Müşterisi";
          subtitle = resolvedTour?.name || "Aktif Sohbet";
          headerAvatar = p?.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150";
          sColor = '#4ade80';
          headerRoleIcon = <User size={12} />;
      } else {
          const { expert1 } = getTourExperts(resolvedTour, users, user);
          headerName = expert1?.name || resolvedTour?.expert?.name || resolvedTour?.guideName || safeExpertName;
          headerAvatar = expert1?.avatar || resolvedTour?.expert?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent((headerName || 'S').charAt(0)) + "&background=D7147A&color=fff";
          subtitle = resolvedTour?.name || "Seyahat Uzmanı";
          headerRoleIcon = <Compass size={12} />;
      }
  } else if (resolvedDirectUser) {
      headerName = resolvedDirectUser.name;
      headerAvatar = resolvedDirectUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(resolvedDirectUser.name.charAt(0)) + "&background=3b82f6&color=fff";
      sColor = '#4ade80';
      
      const pId = resolvedDirectUser.id;
      const shTours = tours.filter(t => t.status === 'active' && t.participants?.some(p => p.id === pId || p.email === resolvedDirectUser.email));
      resolvedTour = shTours[0] || tours.find(t => t.participants?.some(p => p.id === pId || p.email === resolvedDirectUser.email));
      
      if (resolvedDirectUser.role === 'customer') {
          subtitle = resolvedTour ? resolvedTour.name : "Müşteri";
          headerRoleIcon = <User size={12} />;
      } else if (resolvedDirectUser.role === 'expert') {
          subtitle = "Seyahat Uzmanı";
          headerRoleIcon = <Compass size={12} />;
      } else if (resolvedDirectUser.role === 'ticketing') {
          subtitle = "Biletleme Uzmanı";
          headerRoleIcon = <Plane size={12} />;
      } else if (resolvedDirectUser.role === 'admin') {
          subtitle = "Yönetim Ekibi";
          headerRoleIcon = <ShieldCheck size={12} />;
      } else {
          subtitle = "Müşteri";
          headerRoleIcon = <User size={12} />;
      }
  } else if (isGroupedDirect || chatId?.startsWith('direct_')) {
      let pId = pIdMatched;
      const isExp2 = chatId?.includes('_exp2');
      
      if (isGroupedDirect) {
          resolvedTour = tours.find(t => t.id === selectedTourId) || sharedTours[0];
      } else {
          resolvedTour = tours.find(t => chatId.includes(t.id));
          if (resolvedTour) {
              const prefix = `direct_${resolvedTour.id}_`;
              pId = chatId.replace(prefix, '').replace('_exp2', '');
          }
      }

      if (resolvedTour) {
          isReadOnlyArchive = isTourPast(resolvedTour);
      }

      if (user?.role === 'expert' || user?.role === 'admin') {
          const p = resolvedTour?.participants?.find(x => x.id === pId || (x.email && x.email.toLowerCase() === pId?.toLowerCase())) || users.find(u => u.id === pId);
          if (p) {
              headerName = `${p.name}`;
              subtitle = resolvedTour?.name || "Müşteri";
              headerAvatar = p.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150";
              sColor = '#4ade80'; 
              headerRoleIcon = <User size={12} />;
          } else {
              headerName = "Müşteri";
              subtitle = resolvedTour?.name || "Aktif Sohbet";
              headerAvatar = "https://ui-avatars.com/api/?name=M&background=3b82f6&color=fff";
              headerRoleIcon = <User size={12} />;
          }
      } else {
          if (resolvedTour) {
              const { expert1, expert2 } = getTourExperts(resolvedTour, users, user);
              const targetExp = (isExp2 && expert2) ? expert2 : (expert1 || { name: resolvedTour.expert?.name || resolvedTour.guideName || safeExpertName, avatar: null });
              headerName = targetExp.name;
              headerAvatar = targetExp.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent((targetExp.name || 'S').charAt(0)) + "&background=D7147A&color=fff";
              subtitle = resolvedTour.name;
              headerRoleIcon = <Compass size={12} />;
              sColor = '#4ade80';
          }
      }
  }

  const isGroupChat = chatId?.startsWith('tour_');
  const isStaffDirectChat = !!(resolvedDirectUser && resolvedDirectUser.role !== 'customer');
  if (user?.role === 'admin' && isGroupChat) {
      isReadOnlyArchive = true;
  }

  const isChatLockedForUser = isGroupChat && resolvedTour?.onlyAdminsCanWrite && (user?.role !== 'expert' && user?.role !== 'admin');

  const toggleOnlyAdminsCanWrite = async () => {
    if (!resolvedTour) return;
    const newValue = !resolvedTour.onlyAdminsCanWrite;
    await editTour(resolvedTour.id, { onlyAdminsCanWrite: newValue });
    setShowOptionsMenu(false);
  };

  if (isReadOnlyArchive) {
      subtitle = isTourPast(resolvedTour) ? "Tarihi Geçmiş Seyahat - Salt Okunur Arşiv" : "Salt Okunur Görüntüleme Modu";
      sColor = 'transparent';
  }

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages.length]);

  useEffect(() => {
      markRoomAsRead(effectiveChatId, user?.role);
  }, [effectiveChatId, user?.role, allMessages.length, markRoomAsRead]);

  const startRealRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const dur = recordingTimeRef.current;
        const minutes = Math.floor(dur / 60);
        const seconds = dur % 60;
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (dur > 0) { 
            const localUrl = URL.createObjectURL(audioBlob);
            sendCustomMessage({ type: 'real_audio', url: localUrl, duration: formattedDuration, _blob: audioBlob });
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      
      timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
              recordingTimeRef.current = prev + 1;
              return prev + 1;
          });
      }, 1000);

    } catch (err) {
      console.error("Mikrofon izni alınamadı", err);
      alert("Mikrofon izni alınamadı.");
    }
  };

  const stopRealRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
          clearInterval(timerRef.current);
      }
      setIsRecording(false);
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          audioChunksRef.current = [];
          recordingTimeRef.current = 0;
          mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
          clearInterval(timerRef.current);
      }
      setIsRecording(false);
      setRecordingTime(0);
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRealRecording();
      } else {
          startRealRecording();
      }
  };

  useEffect(() => {
      return () => { 
          if (timerRef.current) clearInterval(timerRef.current); 
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
          }
      };
  }, []);

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
          const localUrl = URL.createObjectURL(file);
          sendCustomMessage({ type: 'image', url: localUrl, _blob: file });
      }
      setShowAttachMenu(false);
  };

  const shareLocation = () => {
      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
              
              sendCustomMessage({ 
                  type: 'location', 
                  lat,
                  lng,
                  mapUrl: gmapsUrl
              });
          }, (error) => {
              alert("Konum alınamadı, izinleri kontrol edin.");
          });
      } else {
          alert("Tarayıcınız konum özelliğini desteklemiyor.");
      }
      setShowAttachMenu(false);
  };

  const searchPlaces = async (query) => {
      if (!query.trim()) return;
      setIsSearchingPlaces(true);
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
          const data = await res.json();
          setSearchResults(data || []);
      } catch (err) {
          console.error("Mekan arama hatası:", err);
          alert("Arama yapılırken bir hata oluştu.");
      } finally {
          setIsSearchingPlaces(false);
      }
  };

  const sharePlace = (place) => {
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);
      const name = place.display_name.split(',')[0];
      const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      
      sendCustomMessage({
          type: 'location',
          lat,
          lng,
          mapUrl: gmapsUrl,
          text: name
      });
      setShowPlaceSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
  };

  const handleSendMessage = (e) => {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    if (!inputText.trim()) return;
    if (isChatLockedForUser) return;

    sendCustomMessage({ type: 'text', text: inputText });
    setInputText("");
  };

  const sendCustomMessage = (data) => {
    if (isChatLockedForUser) return;
    let senderKey = 'customer';
    if (user?.role === 'expert') senderKey = 'expert';
    if (user?.role === 'admin') senderKey = 'admin';
    if (user?.role === 'ticketing') senderKey = 'ticketing';
    
    let sName = user?.name || 'Siz';
    if (user?.role === 'expert' && !user?.name) {
        sName = safeExpertName;
    } else if (user?.role === 'admin' && !user?.name) {
        sName = 'Sistem Yöneticisi';
    }

    const newMsg = {
      id: Date.now(),
      chatId: effectiveChatId,
      sender: senderKey,
      senderName: sName,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent', 
      ...data
    };

    const blobFile = newMsg._blob;
    delete newMsg._blob;

    addMessage(newMsg);

    if (blobFile) {
        const ext = newMsg.type === 'image' ? (blobFile.name?.split('.').pop() || 'jpg') : 'webm';
        const storageRef = ref(storage, `chat_uploads/${effectiveChatId}/${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`);
        
        uploadBytes(storageRef, blobFile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(async (downloadURL) => {
                const { doc, setDoc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                await setDoc(doc(db, 'messages', String(newMsg.id)), { url: downloadURL, status: 'delivered' }, { merge: true });
            });
        }).catch(e => console.error("Storage upload failed", e));
    } else {
        setTimeout(() => {
           updateMessageStatus(newMsg.id, 'delivered');
        }, 600);
    }
  };

  const confirmClearChat = () => {
      clearMessages(effectiveChatId);
      setConfirmClearPopup(false);
  };

  const getSenderRoleBadge = (senderRole, senderName) => {
    if (senderRole === 'admin') {
      return (
        <span style={{ fontSize: '10px', background: '#ede9fe', color: '#6366f1', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', marginLeft: '6px' }}>
          Yönetici
        </span>
      );
    }
    if (senderRole === 'expert') {
      return (
        <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', marginLeft: '6px' }}>
          Uzman & Rehber
        </span>
      );
    }
    if (senderRole === 'ticketing') {
      return (
        <span style={{ fontSize: '10px', background: '#d1fae5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', marginLeft: '6px' }}>
          Biletleme
        </span>
      );
    }
    return null;
  };

  return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', position: 'relative', boxSizing: 'border-box', marginBottom: 'calc(-95px - env(safe-area-inset-bottom, 0px))' }}>
        
        {/* Clear Chat Confirmation Modal */}
        {confirmClearPopup && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(6px)' }}>
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '340px', padding: '28px 24px', background: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <AlertTriangle size={28} color="#ef4444" />
                    </div>
                    <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>Sohbeti Temizle</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '20px', lineHeight: 1.5 }}>
                      Bu sohbetteki tüm mesajlar kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
                    </p>
                    
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <button 
                          onClick={() => setConfirmClearPopup(false)} 
                          style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer' }}
                        >
                            Vazgeç
                        </button>
                        <button 
                          onClick={confirmClearChat} 
                          style={{ flex: 1, padding: '11px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                        >
                            Evet, Sil
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Modern Chat Top Navigation Header */}
        <div style={{ 
          padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 14px 16px', 
          background: isReadOnlyArchive ? '#1e293b' : 'linear-gradient(135deg, #D7147A 0%, #D7147A 100%)', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          boxShadow: '0 4px 20px rgba(215, 20, 122, 0.15)', 
          zIndex: 20, 
          transition: 'background 0.3s' 
        }}>
            {/* Back Arrow */}
            <button 
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate(user?.userType === 'individual' ? '/individual/dashboard' : '/dashboard');
                }
              }} 
              title="Geri Dön (Ana Panel / Sohbetler)"
              aria-label="Geri Dön"
              style={{ 
                background: 'rgba(255,255,255,0.18)', 
                border: 'none', 
                borderRadius: '50%', 
                width: '36px', 
                height: '36px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
                <ChevronLeft size={22} />
            </button>
            
            {/* Avatar with Role Badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '14px', 
                  backgroundColor: 'rgba(255,255,255,0.25)', 
                  padding: '2px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {headerAvatar ? (
                        <img 
                          loading="lazy" 
                          src={headerAvatar} 
                          alt="Profil" 
                          style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', filter: isReadOnlyArchive ? 'grayscale(100%)' : 'none' }} 
                        />
                    ) : (
                        <Speaker size={20} color="white" />
                    )}
                </div>
                {sColor !== 'transparent' && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '-2px', 
                    right: '-2px', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: sColor, 
                    border: '2px solid white',
                    boxShadow: `0 0 0 2px ${sColor}40`
                  }} />
                )}
            </div>
            
            {/* Title & Live Status */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                    {headerName}
                  </h3>
                </div>
                
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                   <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {isGroupedDirect && sharedTours.length > 1 ? (
                       <select 
                           value={selectedTourId} 
                           onChange={e => setSelectedTourId(e.target.value)} 
                           style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', outline: 'none', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                       >
                           {sharedTours.map(t => <option key={t.id} value={t.id} style={{ color: 'black' }}>{t.name}</option>)}
                       </select>
                   ) : (
                       subtitle
                   )}
                   </span>
                </div>
            </div>

            {/* Options Dropdown Menu */}
            <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)} 
                  style={{ 
                    background: 'rgba(255,255,255,0.18)', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '36px', 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 60
                  }}
                >
                    <MoreVertical size={18} />
                </button>
                
                {showOptionsMenu && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '110%', 
                      right: '0', 
                      background: 'white', 
                      borderRadius: '16px', 
                      padding: '8px', 
                      minWidth: '230px', 
                      boxShadow: '0 12px 36px rgba(0,0,0,0.16)', 
                      zIndex: 100, 
                      color: 'var(--text-main)', 
                      marginTop: '4px', 
                      animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      border: '1px solid #f1f5f9'
                    }}>
                        <div 
                          onClick={() => { 
                            setShowOptionsMenu(false); 
                            navigate(user?.userType === 'individual' ? '/individual/dashboard' : '/dashboard'); 
                          }} 
                          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.15s', color: 'var(--primary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Home size={16} /> Ana Sayfa / Panele Git
                        </div>

                        {!isStaffDirectChat && resolvedTour && (
                            <div 
                              onClick={() => { 
                                setShowOptionsMenu(false); 
                                if(user?.role === 'customer') {
                                    navigate('/dashboard/program/' + (resolvedTour?.id || ''));
                                } else {
                                    navigate(`/dashboard/program-edit/${resolvedTour?.id}`); 
                                }
                              }} 
                              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Map size={16} className="text-muted" /> Tur Programına Git
                            </div>
                        )}
                        
                        {!isStaffDirectChat && user?.role === 'expert' && resolvedTour && (
                            <div 
                              onClick={() => { setShowOptionsMenu(false); navigate(`/dashboard/participants/${resolvedTour?.id}`); }} 
                              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Info size={16} className="text-muted" /> Katılımcı Listesi
                            </div>
                        )}

                        {isGroupChat && (user?.role === 'expert' || user?.role === 'admin') && (
                            <div 
                              onClick={toggleOnlyAdminsCanWrite} 
                              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {resolvedTour?.onlyAdminsCanWrite ? (
                                    <><Unlock size={16} className="text-muted" /> Sohbeti Herkese Aç</>
                                ) : (
                                    <><Lock size={16} className="text-muted" /> Sadece Yöneticiler Yazsın</>
                                )}
                            </div>
                        )}

                        <div 
                          onClick={() => { setShowOptionsMenu(false); toggleMute(effectiveChatId); }} 
                          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {mutedChats?.includes(effectiveChatId) ? <><Bell size={16} className="text-muted" /> Sesi Aç</> : <><BellOff size={16} className="text-muted" /> Bildirimleri Sessize Al</>}
                        </div>

                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                        <div 
                            onClick={() => { 
                                setShowOptionsMenu(false);
                                setConfirmClearPopup(true);
                            }} 
                            style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#ef4444', borderRadius: '10px', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Trash2 size={16} /> Sohbeti Temizle
                        </div>
                    </div>
                )}
                
                {showOptionsMenu && <div onClick={() => setShowOptionsMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }} />}
            </div>
        </div>

        {/* Chat Messages Feed */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
            
            {/* Encryption & Security Pill */}
            <div style={{ textAlign: 'center', margin: '6px 0 12px' }}>
               <span style={{ 
                 background: '#f1f5f9', 
                 color: '#64748b', 
                 padding: '6px 14px', 
                 borderRadius: '20px', 
                 fontSize: '11px', 
                 fontWeight: '600',
                 display: 'inline-flex',
                 alignItems: 'center',
                 gap: '6px',
                 boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                 border: '1px solid #e2e8f0'
               }}>
                 <Lock size={12} style={{ color: 'var(--primary)' }} /> Uçtan Uca Güvenli Move İletişimi
               </span>
            </div>

            {roomMessages.map((msg) => {
                const isMe = msg.sender === (user?.role === 'expert' ? 'expert' : (user?.role === 'admin' ? 'admin' : (user?.role === 'ticketing' ? 'ticketing' : 'customer')));
                const isSystem = msg.sender === 'system';
                
                if (isSystem) {
                    return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                           <div style={{ background: '#f1f5f9', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '14px', fontSize: '12.5px', textAlign: 'center', maxWidth: '85%', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                               {msg.text}
                               <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{msg.timestamp}</div>
                           </div>
                        </div>
                    );
                }

                const renderContent = () => {
                    if (msg.type === 'image') {
                        return (
                            <div style={{ padding: '2px' }}>
                                <img 
                                  loading="lazy" 
                                  src={msg.url} 
                                  alt="Görsel" 
                                  style={{ width: '100%', maxWidth: '280px', borderRadius: '12px', display: 'block', marginBottom: msg.text ? '8px' : '0' }} 
                                />
                                {msg.text && <div style={{ fontSize: '13.5px', padding: '4px 6px', lineHeight: '1.4' }}>{msg.text}</div>}
                            </div>
                        );
                    } else if (msg.type === 'location') {
                        return (
                            <div style={{ width: '230px', padding: '4px' }}>
                                {msg.text && (
                                    <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        📍 {msg.text}
                                    </div>
                                )}
                                <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', background: '#e2e8f0', border: '1px solid rgba(0,0,0,0.08)' }}>
                                    <iframe 
                                      width="100%" 
                                      height="130" 
                                      frameBorder="0" 
                                      style={{ border: 0, display: 'block' }} 
                                      src={`https://maps.google.com/maps?q=${msg.lat},${msg.lng}&z=15&output=embed`} 
                                      title="Google Maps"
                                      allowFullScreen>
                                    </iframe>
                                </div>
                                <a 
                                  href={msg.mapUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ 
                                    fontWeight: '700', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '6px', 
                                    fontSize: '12.5px', 
                                    color: isMe ? 'white' : 'var(--primary)', 
                                    textDecoration: 'none', 
                                    padding: '6px 10px',
                                    background: isMe ? 'rgba(255,255,255,0.2)' : '#FDF2F8',
                                    borderRadius: '8px'
                                  }}
                                >
                                    <MapPin size={14} /> Haritada Aç <ExternalLink size={12} />
                                </a>
                            </div>
                        );
                    } else if (msg.type === 'real_audio') {
                        return <VoiceNoteBubble url={msg.url} duration={msg.duration} isMe={isMe} />;
                    } else {
                        return <div style={{ fontSize: '14px', lineHeight: '1.45', wordBreak: 'break-word' }}>{msg.text}</div>;
                    }
                };

                return (
                    <div 
                      key={msg.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '100%'
                      }}
                    >
                        <div style={{ 
                            maxWidth: '85%', 
                            padding: msg.type === 'text' ? '10px 14px' : '4px', 
                            borderRadius: '18px', 
                            borderBottomRightRadius: isMe ? '4px' : '18px',
                            borderBottomLeftRadius: isMe ? '18px' : '4px',
                            background: isMe 
                              ? (isReadOnlyArchive ? '#64748b' : 'linear-gradient(135deg, #D7147A 0%, #D7147A 100%)') 
                              : '#ffffff', 
                            color: isMe ? 'white' : 'var(--text-main)',
                            boxShadow: isMe 
                              ? '0 2px 8px rgba(215, 20, 122, 0.16)' 
                              : '0 1px 4px rgba(0,0,0,0.04)',
                            border: isMe ? 'none' : '1px solid #f1f5f9',
                            position: 'relative'
                        }}>
                            {!isMe && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: '700', 
                                  color: msg.sender === 'admin' ? '#6366f1' : (msg.sender === 'expert' ? '#0284c7' : 'var(--primary)'), 
                                  padding: msg.type !== 'text' ? '6px 8px 4px' : '0 0 4px 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}>
                                    <span>{msg.senderName}</span>
                                    {getSenderRoleBadge(msg.sender, msg.senderName)}
                                </div>
                            )}
                            
                            {renderContent()}
                        </div>

                        {/* Timestamp & Delivery Checks */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', marginRight: isMe ? '4px' : '0', marginLeft: isMe ? '0' : '4px' }}>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>{msg.timestamp}</span>
                            {isMe && (
                                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    {msg.status === 'sent' ? <Check size={13} color="#94a3b8" /> :
                                     msg.status === 'delivered' ? <CheckCheck size={13} color="#94a3b8" /> :
                                     msg.status === 'read' ? <CheckCheck size={13} color="#0284c7" /> : null}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={endOfMessagesRef} />
        </div>

        {/* Input Bar or Status Bar */}
        {isReadOnlyArchive ? (
            <div style={{ padding: '16px 16px calc(95px + env(safe-area-inset-bottom, 0px)) 16px', background: 'white', textAlign: 'center', color: '#64748b', fontSize: '13px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Archive size={22} color="#94a3b8" />
                <b style={{ color: 'var(--text-main)' }}>Geçmiş Seyahat Arşivi</b>
                <span>Mesaj geçmişi okunabilir, yeni mesaj gönderimine kapalıdır.</span>
            </div>
        ) : isChatLockedForUser ? (
            <div style={{ padding: '16px 16px calc(95px + env(safe-area-inset-bottom, 0px)) 16px', background: 'white', textAlign: 'center', color: '#64748b', fontSize: '13px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Lock size={22} color="var(--primary)" />
                <b style={{ color: 'var(--text-main)' }}>Sadece Yöneticiler Mesaj Gönderebilir</b>
                <span>Bu sohbet geçici olarak katılımcı mesajlarına kapatılmıştır.</span>
            </div>
        ) : (
            <div style={{ 
              position: 'relative', 
              padding: '12px 14px calc(95px + env(safe-area-inset-bottom, 0px)) 14px', 
              background: 'white', 
              borderTop: '1px solid #e2e8f0',
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.03)',
              zIndex: 10
            }}>
                
                {/* Attachment Popup Action Sheet */}
                {showAttachMenu && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 'calc(100% + 8px)', 
                      left: '14px', 
                      background: 'white', 
                      borderRadius: '18px', 
                      padding: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px', 
                      boxShadow: '0 12px 36px rgba(0,0,0,0.14)', 
                      zIndex: 50, 
                      animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      border: '1px solid #f1f5f9',
                      minWidth: '220px'
                    }}>
                        <div 
                          onClick={() => fileInputRef.current.click()} 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderRadius: '12px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <ImageIcon size={18} />
                            </div>
                            <span style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-main)' }}>Görsel / Fotoğraf</span>
                        </div>
                        
                        <div 
                          onClick={shareLocation} 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderRadius: '12px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <MapPin size={18} />
                            </div>
                            <span style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-main)' }}>Konumumu Paylaş</span>
                        </div>

                        <div 
                          onClick={() => { setShowAttachMenu(false); setShowPlaceSearchModal(true); }} 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderRadius: '12px', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #D7147A, #B01064)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Search size={18} />
                            </div>
                            <span style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-main)' }}>Mekan Ara & Paylaş</span>
                        </div>
                    </div>
                )}
                
                {showAttachMenu && <div onClick={() => setShowAttachMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} />}

                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

                {/* Attach Toggle Button */}
                <button 
                   type="button"
                   onClick={() => setShowAttachMenu(!showAttachMenu)} 
                   style={{ 
                     cursor: 'pointer', 
                     width: '40px', 
                     height: '40px', 
                     color: showAttachMenu ? 'var(--primary)' : '#64748b', 
                     background: showAttachMenu ? '#FDF2F8' : '#f1f5f9', 
                     border: 'none',
                     borderRadius: '50%', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center', 
                     transition: 'all 0.2s',
                     flexShrink: 0
                   }}
                >
                    <Plus size={20} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                
                {/* Text Input / Recording Banner */}
                <form 
                  onSubmit={handleSendMessage} 
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    background: '#f1f5f9', 
                    borderRadius: '22px', 
                    padding: '2px 14px', 
                    alignItems: 'center', 
                    minHeight: '42px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                    {isRecording ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                            <span style={{ fontSize: '13.5px', fontWeight: '700', fontFamily: 'monospace' }}>
                                0:{recordingTime.toString().padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
                              Kaydediliyor...
                            </span>
                            <button 
                              type="button" 
                              onClick={cancelRecording} 
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Mesaj yazın..." 
                          style={{ flex: 1, padding: '8px 0', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text-main)' }} 
                        />
                    )}
                </form>

                {/* Send / Mic Action Button */}
                <button 
                  type="button"
                  onClick={(e) => {
                      if (inputText.trim()) {
                          handleSendMessage(e);
                      } else {
                          toggleRecording();
                      }
                  }}
                  style={{ 
                    width: '42px', 
                    height: '42px', 
                    flexShrink: 0, 
                    borderRadius: '50%', 
                    background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #D7147A 0%, #D7147A 100%)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: 'none', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    boxShadow: isRecording ? '0 4px 12px rgba(239, 68, 68, 0.4)' : '0 4px 12px rgba(215, 20, 122, 0.3)'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {inputText.trim() ? (
                        <Send size={18} style={{ transform: 'translateX(-1px)' }} />
                    ) : (
                        isRecording ? <Send size={18} style={{ transform: 'translateX(-1px)' }} /> : <Mic size={20} />
                    )}
                </button>
            </div>
        )}

        {/* Place Search Modal */}
        {showPlaceSearchModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
                <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '80vh', background: 'white', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={20} color="var(--primary)" /> Mekan Ara ve Paylaş
                      </h3>
                      <button 
                        onClick={() => { setShowPlaceSearchModal(false); setSearchQuery(''); setSearchResults([]); }}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        <input 
                            type="text" 
                            placeholder="Restoran, müze, otel veya meydan..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchPlaces(searchQuery)}
                            style={{ flex: 1, padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '13.5px', color: 'var(--text-main)' }}
                        />
                        <button 
                            onClick={() => searchPlaces(searchQuery)}
                            style={{ padding: '11px 18px', border: 'none', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' }}
                        >
                            {isSearchingPlaces ? '...' : 'Ara'}
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', minHeight: '160px' }}>
                        {isSearchingPlaces ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                                Aranıyor...
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '160px', color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                                <MapPin size={28} style={{ opacity: 0.4, marginBottom: '6px' }} />
                                Paylaşmak istediğiniz mekan adını yazıp "Ara" butonuna basın.
                            </div>
                        ) : (
                            searchResults.map((place) => (
                                <div 
                                    key={place.place_id} 
                                    onClick={() => sharePlace(place)}
                                    style={{ display: 'flex', gap: '12px', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', background: '#f8fafc' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#FDF2F8'; e.currentTarget.style.borderColor = '#E54B98'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                                        <MapPin size={18} />
                                    </div>
                                    <div style={{ overflow: 'hidden', flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {place.display_name.split(',')[0]}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                            {place.display_name.split(',').slice(1).join(',').trim()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button 
                        onClick={() => { setShowPlaceSearchModal(false); setSearchQuery(''); setSearchResults([]); }}
                        style={{ padding: '11px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                    >
                        Kapat
                    </button>
                </div>
            </div>
        )}
      </div>
  );
}
