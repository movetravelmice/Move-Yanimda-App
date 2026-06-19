import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Send, Paperclip, MoreVertical, Check, CheckCheck, Speaker, Mic, MapPin, Image as ImageIcon, Play, Archive, Trash2, BellOff, Bell, Info, Map, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useChatStore } from '../../store/chatStore';
import { useTourStore } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Chat() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const user = useAuthStore(state => state.user);
  const { systemAnnouncementAvatar, tourGroupAvatar, expertStatus, expertName } = useSettingsStore();
  const { tours, editTour } = useTourStore();
  
  // Real expert resolution
  const resolvedExpertUser = useUserStore.getState().users.find(u => u.name === expertName);
  const realExpertAvatar = resolvedExpertUser?.avatar || null;
  const safeExpertName = expertName || "Uzman";
  
  const { messages: allMessages = [], addMessage, updateMessageStatus, markRoomAsRead, clearMessages, mutedChats, toggleMute } = useChatStore();

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [confirmClearPopup, setConfirmClearPopup] = useState(false);
  const [showPlaceSearchModal, setShowPlaceSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  
  const isExpertGrouped = chatId.startsWith('direct_grouped_') && !chatId.includes('cust_1');
  const isCustomerGrouped = chatId === 'direct_grouped_cust_1';
  const isGroupedDirect = isExpertGrouped || isCustomerGrouped;
  
  const pIdMatched = isExpertGrouped ? chatId.replace('direct_grouped_', '') : 'cust_1';
  // Filter only active tours for private grouped chats, past personal chats are discarded
  const sharedTours = isGroupedDirect ? tours.filter(t => t.status === 'active' && t.participants.some(p => p.id === pIdMatched)) : [];
  
  const [selectedTourId, setSelectedTourId] = useState('');
  useEffect(() => {
     if (isGroupedDirect && sharedTours.length > 0 && !selectedTourId) {
         setSelectedTourId(sharedTours[0].id);
     }
  }, [isGroupedDirect, sharedTours, selectedTourId]);

  const effectiveChatId = isGroupedDirect ? `direct_${selectedTourId || (sharedTours[0]?.id)}_${pIdMatched}` : chatId;

  const roomMessages = allMessages.filter(m => m.chatId === effectiveChatId);

  const endOfMessagesRef = useRef(null);
  
  const users = useUserStore(state => state.users);
  
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
  let subtitle = "Cevrimdisi (Son gorulme: Yakin zamanda)";
  let sColor = 'rgba(255,255,255,0.4)';
  if (expertStatus === 'online') { subtitle = "Çevrimiçi Uzmanınız"; sColor = '#4ade80'; }
  else if (expertStatus === 'busy') { subtitle = "Meşgul (Birazdan Dönecek)"; sColor = '#facc15'; }
  
  let headerAvatar = realExpertAvatar || "https://ui-avatars.com/api/?name=" + safeExpertName.charAt(0) + "&background=D7147A&color=fff";
  let isReadOnlyArchive = false;
  let resolvedTour = null;

  let resolvedDirectUser = null;
  if (chatId.startsWith('direct_') || chatId.startsWith('direct_grouped_')) {
      const sortedUsers = [...users].sort((a, b) => b.id.length - a.id.length);
      resolvedDirectUser = sortedUsers.find(u => u.id !== user?.id && chatId.includes(u.id));
  }

  if (chatId.startsWith('tour_')) {
      resolvedTour = tours.find(t => t.id === chatId);
      if (resolvedTour) {
          headerName = `${resolvedTour.name} Grubu`;
          subtitle = `Siz, ${(expertName || resolvedTour.expert?.name || resolvedTour.guideName || 'Uzman').split(' ')[0]}, Rehber ve ${resolvedTour.participants?.length || 0} kişi`;
          headerAvatar = resolvedTour.avatar || tourGroupAvatar;
          isReadOnlyArchive = resolvedTour.status === 'past';
      }
  } else if (chatId === 'expert_direct') {
      resolvedTour = tours.find(t => t.id === 'tour_avrupa_ruyasi');
      if (user?.role === 'expert' || user?.role === 'admin') {
          const p = resolvedTour?.participants?.find(x => x.id === 'cust_1');
          headerName = p?.name || "Demo Müşterisi";
          subtitle = resolvedTour?.name || "Aktif Sohbet";
          headerAvatar = p?.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150";
          sColor = '#4ade80';
      } else {
          const dynName = resolvedTour?.expert?.name || resolvedTour?.guideName || safeExpertName;
          headerName = dynName;
          const dynExpertUser = useUserStore.getState().users.find(u => u.name === dynName);  
          headerAvatar = dynExpertUser?.avatar || resolvedTour?.expert?.avatar || "https://ui-avatars.com/api/?name=" + dynName.charAt(0) + "&background=D7147A&color=fff";
      }
  } else if (resolvedDirectUser) {
      headerName = resolvedDirectUser.name;
      headerAvatar = resolvedDirectUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(resolvedDirectUser.name.charAt(0)) + "&background=3b82f6&color=fff";
      sColor = '#4ade80';
      
      const pId = resolvedDirectUser.id;
      const sharedTours = tours.filter(t => t.status === 'active' && t.participants?.some(p => p.id === pId || p.email === resolvedDirectUser.email));
      resolvedTour = sharedTours[0] || tours.find(t => t.participants?.some(p => p.id === pId || p.email === resolvedDirectUser.email));
      
      if (resolvedDirectUser.role === 'customer') {
          subtitle = resolvedTour ? resolvedTour.name : "Müşteri";
      } else if (resolvedDirectUser.role === 'expert') {
          subtitle = "Seyahat Uzmanı";
      } else if (resolvedDirectUser.role === 'ticketing') {
          subtitle = "Biletleme Uzmanı";
      } else if (resolvedDirectUser.role === 'admin') {
          subtitle = "Yönetim Ekibi";
      } else {
          subtitle = "Müşteri";
      }
  } else if (isGroupedDirect || chatId.startsWith('direct_')) {
      let pId = pIdMatched;
      if (isGroupedDirect) {
          resolvedTour = tours.find(t => t.id === selectedTourId) || sharedTours[0];
      } else {
          const match = chatId.match(/^direct_(tour_[a-zA-Z0-9_]+)_(cust_[0-9]+)$/);
          if (match) {
             const tId = match[1];
             pId = match[2];
             resolvedTour = tours.find(t => t.id === tId);
          }
      }

      if (resolvedTour) {
          isReadOnlyArchive = resolvedTour.status === 'past';
      }

      if (user?.role === 'expert' || user?.role === 'admin') {
          const p = resolvedTour?.participants?.find(x => x.id === pId);
          const globalUser = users.find(u => String(u.id) === String(pId));
          if (p) {
              headerName = `${p.name}`;
              subtitle = resolvedTour?.name;
              headerAvatar = p.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150";
              sColor = '#4ade80'; 
          } else if (globalUser) {
              headerName = `${globalUser.name}`;
              subtitle = "Müşteri";
              headerAvatar = globalUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(globalUser.name.charAt(0)) + "&background=3b82f6&color=fff";
              sColor = '#4ade80';
          } else {
              headerName = "Müşteri";
              subtitle = "Aktif Sohbet";
              headerAvatar = "https://ui-avatars.com/api/?name=M&background=3b82f6&color=fff";
          }
      } else {
          if (resolvedTour) {
              const dynName = resolvedTour.expert?.name || resolvedTour.guideName || safeExpertName;
              headerName = dynName;
              const dynExpertUser = useUserStore.getState().users.find(u => u.name === dynName);  
              headerAvatar = dynExpertUser?.avatar || resolvedTour.expert?.avatar || "https://ui-avatars.com/api/?name=" + dynName.charAt(0) + "&background=D7147A&color=fff";
          }
      }
  }

  const isGroupChat = chatId.startsWith('tour_');
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
      subtitle = (resolvedTour?.status === 'past') ? "Tarihi Geçmiş Seyahat - Salt Okunur Arşiv" : "Salt Okunur Görüntüleme Modu";
      sColor = 'transparent';
  }

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

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
            // Create a local blob acting as memory cache temporarily, then upload to Firebase async
            const localUrl = URL.createObjectURL(audioBlob);
            // Wait to upload
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
          // Send immediately with local preview and background blob attached
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
    e.preventDefault();
    if (!inputText.trim()) return;
    if (isChatLockedForUser) return;

    sendCustomMessage({ type: 'text', text: inputText });
    setInputText("");
  };

  const sendCustomMessage = (data) => {
    if (isChatLockedForUser) return;
    const isExpert = user?.role === 'expert';
    let senderKey = isExpert ? 'expert' : 'customer';
    if (user?.role === 'admin') senderKey = 'admin';
    
    let sName = user?.name || 'Siz';
    if (isExpert && !user?.name) {
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
        // Upload resim veya ses dosyasını Firebase'e gönder
        const ext = newMsg.type === 'image' ? (blobFile.name?.split('.').pop() || 'jpg') : 'webm';
        const storageRef = ref(storage, `chat_uploads/${effectiveChatId}/${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`);
        
        uploadBytes(storageRef, blobFile).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(async (downloadURL) => {
                const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                const q = query(collection(db, 'messages'), where('id', '==', newMsg.id));
                const snap = await getDocs(q);
                snap.forEach(d => {
                     updateDoc(doc(db, 'messages', d.id), { url: downloadURL, status: 'delivered' });
                });
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

  return (
      <div style={{ height: 'calc(100vh - 80px - env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', position: 'relative', boxSizing: 'border-box' }}>
        
        {/* Custom Confirm Popup */}
        {confirmClearPopup && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
                <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '340px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <AlertTriangle size={32} color="#ef4444" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>Emin misiniz?</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, marginBottom: '24px', lineHeight: 1.5 }}>Bu sohbetteki tüm mesajlar tamamen silinecektir. Bu işlem geri alınamaz.</p>
                    
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button onClick={() => setConfirmClearPopup(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>
                            Vazgeç
                        </button>
                        <button onClick={confirmClearChat} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                            Evet, Temizle
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Chat Header */}
        <div style={{ padding: '16px 20px', background: isReadOnlyArchive ? 'var(--text-main)' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10, transition: 'background 0.3s' }}>
            <div onClick={() => navigate('/dashboard/chat')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
                <ChevronLeft size={24} />
            </div>
            
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {headerAvatar ? (
                    <img loading="lazy" src={headerAvatar} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', filter: isReadOnlyArchive ? 'grayscale(100%)' : 'none' }} />
                ) : (
                    <Speaker size={20} color="white" />
                )}
            </div>
            
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{headerName}</h3>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                   {sColor !== 'transparent' && (
                       <div style={{ 
                           width: '8px', height: '8px', 
                           backgroundColor: sColor, 
                           borderRadius: '50%', 
                           boxShadow: sColor !== 'transparent' ? `0 0 0 2px ${sColor}40` : 'none' 
                       }}></div>
                   )} 
                   <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                   {isGroupedDirect && sharedTours.length > 1 ? (
                       <select 
                           value={selectedTourId} 
                           onChange={e => setSelectedTourId(e.target.value)} 
                           style={{ background: 'rgba(0,0,0,0.1)', color: 'white', border: 'none', outline: 'none', borderRadius: '4px', padding: '2px 4px', fontSize: '11px', cursor: 'pointer' }}
                       >
                           {sharedTours.map(t => <option key={t.id} value={t.id} style={{ color: 'black' }}>{t.name}</option>)}
                       </select>
                   ) : (
                       subtitle
                   )}
                   </span>
                </span>
            </div>

            <div style={{ position: 'relative' }}>
                <div onClick={() => setShowOptionsMenu(!showOptionsMenu)} style={{ cursor: 'pointer', padding: '4px', position: 'relative', zIndex: 60 }}>
                    <MoreVertical size={20} />
                </div>
                
                {showOptionsMenu && (
                    <div style={{ position: 'absolute', top: '100%', right: '0', background: 'white', borderRadius: '12px', padding: '8px 0', minWidth: '240px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 100, color: 'var(--text-main)', marginTop: '8px', animation: 'fadeIn 0.15s' }}>
                        <div onClick={() => { 
                            setShowOptionsMenu(false); 
                            if(user?.role === 'customer') {
                                navigate('/dashboard/program/' + (resolvedTour?.id || ''));
                            } else {
                                navigate(`/dashboard/program-edit/${resolvedTour?.id}`); 
                            }
                        }} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                            <Map size={16} className="text-muted" /> Tur Programına Git
                        </div>
                        {user?.role === 'expert' && (
                            <div onClick={() => { setShowOptionsMenu(false); navigate(`/dashboard/participants/${resolvedTour?.id}`); }} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                                <Info size={16} className="text-muted" /> Katılımcı Profili
                            </div>
                        )}
                        {isGroupChat && (user?.role === 'expert' || user?.role === 'admin') && (
                            <div onClick={toggleOnlyAdminsCanWrite} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                                {resolvedTour?.onlyAdminsCanWrite ? (
                                    <><Unlock size={16} className="text-muted" /> Sohbeti Herkese Aç</>
                                ) : (
                                    <><Lock size={16} className="text-muted" /> Sadece Yöneticiler Yazabilsin</>
                                )}
                            </div>
                        )}
                        <div onClick={() => { setShowOptionsMenu(false); toggleMute(effectiveChatId); }} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                            {mutedChats?.includes(effectiveChatId) ? <><Bell size={16} className="text-muted" /> Sesi Aç</> : <><BellOff size={16} className="text-muted" /> Bildirimleri Sessize Al</>}
                        </div>
                        <div 
                            onClick={() => { 
                                setShowOptionsMenu(false);
                                setConfirmClearPopup(true);
                            }} 
                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#ef4444', whiteSpace: 'nowrap' }}
                        >
                            <Trash2 size={16} /> Sohbeti Temizle
                        </div>
                    </div>
                )}
                
                {showOptionsMenu && <div onClick={() => setShowOptionsMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}></div>}
            </div>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
               <span style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>SOHBET BASLANGICI</span>
            </div>

            {roomMessages.map((msg) => {
                const isMe = msg.sender === (user?.role === 'expert' ? 'expert' : 'customer');
                const isSystem = msg.sender === 'system';
                
                if (isSystem) {
                    return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                           <div style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', textAlign: 'center', maxWidth: '85%' }}>
                               {msg.text}
                               <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>{msg.timestamp}</div>
                           </div>
                        </div>
                    );
                }

                const renderContent = () => {
                    if (msg.type === 'image') {
                        return (
                            <div style={{ padding: '4px' }}>
                                <img loading="lazy" src={msg.url} alt="Görsel" style={{ width: '100%', maxWidth: '240px', borderRadius: '12px', marginBottom: msg.text ? '8px' : '0' }} />
                                {msg.text && <div>{msg.text}</div>}
                            </div>
                        );
                    } else if (msg.type === 'location') {
                        return (
                            <div style={{ padding: '6px', width: '220px' }}>
                                {msg.text && (
                                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {msg.text}
                                    </div>
                                )}
                                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: '#ccc' }}>
                                    <iframe 
                                      width="100%" 
                                      height="140" 
                                      frameBorder="0" 
                                      style={{ border: 0, display: 'block' }} 
                                      src={`https://maps.google.com/maps?q=${msg.lat},${msg.lng}&z=15&output=embed`} 
                                      title="Google Maps"
                                      allowFullScreen>
                                    </iframe>
                                </div>
                                <a href={msg.mapUrl} target="_blank" rel="noreferrer" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: isMe ? 'white' : 'var(--primary)', textDecoration: 'none', padding: '0 4px' }}>
                                    <MapPin size={16} /> Google Haritalarda Aç
                                </a>
                            </div>
                        );
                    } else if (msg.type === 'real_audio') {
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', padding: '4px' }}>
                                <audio controls style={{ width: '100%', height: '36px', outline: 'none' }}>
                                   <source src={msg.url} type="audio/webm" />
                                   Tarayıcınız bu sesi oynatamıyor.
                                </audio>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                                    <Mic size={10} /> Ses Kaydı
                                </div>
                            </div>
                        );
                    } else { // 'text'
                        return <div>{msg.text}</div>;
                    }
                };

                return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ 
                            maxWidth: '85%', 
                            padding: msg.type === 'text' ? '10px 14px' : '4px', 
                            borderRadius: '16px', 
                            borderBottomRightRadius: isMe ? '4px' : '16px',
                            borderTopLeftRadius: isMe ? '16px' : '4px',
                            background: isMe ? (isReadOnlyArchive ? 'var(--text-muted)' : 'var(--primary)') : 'white', 
                            color: isMe ? 'white' : 'var(--text-main)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            fontSize: '14px',
                            lineHeight: '1.45'
                        }}>
                            {!isMe && msg.senderName && (
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: isReadOnlyArchive ? 'var(--text-muted)' : 'var(--primary)', padding: msg.type !== 'text' ? '8px 8px 0' : '0 0 4px 0' }}>{msg.senderName}</div>
                            )}
                            {renderContent()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', marginRight: isMe ? '6px' : '0' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                            {/* LIVE DB WhatsApp Tick Logic Progression */}
                            {isMe && (
                                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    {msg.status === 'sent' ? <Check size={14} color="var(--text-muted)" /> :
                                     msg.status === 'delivered' ? <CheckCheck size={14} color="var(--text-muted)" /> :
                                     msg.status === 'read' ? <CheckCheck size={14} color="#3b82f6" /> : null}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area or Archive Notice */}
        {isReadOnlyArchive ? (
            <div style={{ padding: '20px', background: 'var(--surface)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', boxShadow: '0 -4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Archive size={24} />
                <b>Bu Seyahat Arşivlenmiştir</b>
                Mesaj geçmişi okunabilir ancak yeni mesaj gönderilemez veya eylem gerçekleştirilemez.
            </div>
        ) : isChatLockedForUser ? (
            <div style={{ padding: '20px', background: 'var(--surface)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', boxShadow: '0 -4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Lock size={24} color="var(--primary)" />
                <b>Sadece Yöneticiler Mesaj Gönderebilir</b>
                Bu grup geçici olarak yeni mesaj gönderimine kapatılmıştır.
            </div>
        ) : (
            <div style={{ position: 'relative', padding: '12px 16px', background: '#f0f2f5', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                
                {showAttachMenu && (
                    <div style={{ position: 'absolute', bottom: '65px', left: '16px', background: 'white', borderRadius: '16px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', zIndex: 50, animation: 'fadeIn 0.2s' }}>
                        <div onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #A855F7, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <ImageIcon size={20} />
                            </div>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>Cihazdan Aktar (Görsel)</span>
                        </div>
                        <div onClick={shareLocation} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <MapPin size={20} />
                            </div>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>Konumunu Paylaş</span>
                        </div>
                        <div onClick={() => { setShowAttachMenu(false); setShowPlaceSearchModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <MapPin size={20} />
                            </div>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>Mekan Ara ve Paylaş</span>
                        </div>
                    </div>
                )}
                
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

                <div 
                   onClick={() => setShowAttachMenu(!showAttachMenu)} 
                   style={{ cursor: 'pointer', width: '44px', height: '44px', color: 'var(--text-muted)', background: 'transparent', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                >
                    <Paperclip size={24} className={showAttachMenu ? "text-primary" : ""} />
                </div>
                
                <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', background: 'white', borderRadius: '24px', overflow: 'hidden', padding: '4px 8px', alignItems: 'center', minHeight: '44px' }}>
                    {isRecording ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px', color: 'var(--primary)', animation: 'pulse 1.5s infinite' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                0:{recordingTime.toString().padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto', fontStyle: 'italic' }}>Sesiniz Kaydediliyor...</span>
                        </div>
                    ) : (
                        <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Mesaj yazın..." 
                        style={{ flex: 1, padding: '10px 8px', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px' }} 
                        />
                    )}
                </form>

                <button 
                  type="button"
                  onClick={inputText.trim() ? handleSendMessage : toggleRecording}
                  style={{ width: '46px', height: '46px', flexShrink: 0, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                    {inputText.trim() ? (
                        <Send size={18} style={{ transform: 'translateX(-1px)' }} />
                    ) : (
                        isRecording ? <Send size={20} style={{ transform: 'translateX(-1px)' }} /> : <Mic size={22} />
                    )}
                </button>
            </div>
        )}
        {/* Place Search Modal */}
        {showPlaceSearchModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
                <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '80vh', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)' }}>Mekan Ara ve Paylaş</h3>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input 
                            type="text" 
                            placeholder="Mekan veya restoran adı..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchPlaces(searchQuery)}
                            style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '14px', background: 'transparent', color: 'var(--text-main)' }}
                        />
                        <button 
                            onClick={() => searchPlaces(searchQuery)}
                            style={{ padding: '10px 16px', border: 'none', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                        >
                            {isSearchingPlaces ? 'Aranıyor...' : 'Ara'}
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', minHeight: '150px' }}>
                        {isSearchingPlaces ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Mekanlar aranıyor...
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                                Arama yapmak için bir yer adı yazın.
                            </div>
                        ) : (
                            searchResults.map((place) => (
                                <div 
                                    key={place.place_id} 
                                    onClick={() => sharePlace(place)}
                                    style={{ display: 'flex', gap: '12px', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: '#f8fafc' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                                        <MapPin size={18} />
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {place.display_name.split(',')[0]}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {place.display_name.split(',').slice(1).join(',').trim()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button 
                        onClick={() => { setShowPlaceSearchModal(false); setSearchQuery(''); setSearchResults([]); }}
                        style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                        Kapat
                    </button>
                </div>
            </div>
        )}
      </div>
  );
}
