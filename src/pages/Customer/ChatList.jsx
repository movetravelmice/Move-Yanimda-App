import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Users, 
  Speaker, 
  Archive, 
  Search, 
  X, 
  ShieldCheck, 
  Compass, 
  Plane, 
  User, 
  Check, 
  CheckCheck,
  Sparkles,
  MapPin,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import Header from '../../components/Header';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useChatStore } from '../../store/chatStore';
import { useTourStore, getTourExperts, isTourPast } from '../../store/tourStore';

export default function ChatList() {
  const navigate = useNavigate();
  const { systemAnnouncementAvatar: systemAvatar, tourGroupAvatar } = useSettingsStore();
  const { messages = [] } = useChatStore();
  const { tours } = useTourStore();
  const users = useUserStore(state => state.users);
  const user = useAuthStore(state => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'groups' | 'staff' | 'customers' | 'unread'

  const mySenderKey = user?.role === 'expert' ? 'expert' : (user?.role === 'admin' ? 'admin' : (user?.role === 'ticketing' ? 'ticketing' : 'customer'));

  const getChatPreview = (chatId) => {
    const thread = messages.filter(m => m.chatId === chatId);
    if (thread.length === 0) return { lastMessage: 'Henüz mesaj yok', time: '', lastMsgType: 'text', lastMsgIsMe: false, lastMsgStatus: null };
    const last = thread[thread.length - 1];
    
    let previewText = last.text || '';
    if (last.type === 'image') previewText = 'Görsel';
    if (last.type === 'location') previewText = last.text ? `Konum: ${last.text}` : 'Konum paylaşıldı';
    if (last.type === 'real_audio') previewText = `Ses Kaydı (${last.duration || ''})`;
    
    if (chatId.startsWith('tour_') && last.sender !== 'system' && last.senderName) {
        previewText = `${last.senderName.split(' ')[0]}: ${previewText}`;
    }

    const isMe = last.sender === mySenderKey;

    return { 
      lastMessage: previewText, 
      time: last.timestamp || '',
      lastMsgType: last.type || 'text',
      lastMsgIsMe: isMe,
      lastMsgStatus: last.status
    };
  };

  const getDirectChatId = (tourId, pId) => {
      // Keep legacy mocked ID for the prototype scenario to match pre-written messages
      if (tourId === 'tour_avrupa_ruyasi' && pId === 'cust_1') return 'expert_direct';
      return `direct_${tourId}_${pId}`;
  };

  const isExpiredArchivedTour = (datesString) => {
      try {
          if (!datesString) return false;
          const matches = datesString.toLowerCase().match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})/g);
          
          if (matches && matches.length > 0) {
              const lastDateStr = matches[matches.length - 1];
              const parts = lastDateStr.match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})/);
              if (parts) {
                  const trMonths = {
                      'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
                      'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
                  };
                  const endDate = new Date(parseInt(parts[3]), trMonths[parts[2]], parseInt(parts[1]));
                  endDate.setMonth(endDate.getMonth() + 3);
                  return new Date() > endDate;
              }
          }
          return false;
      } catch (e) {
          return false;
      }
  };

  // Compile Active and Past chats
  const { activeChats, pastChats } = useMemo(() => {
    const active = [];
    const past = [];
    const expertGroupedChats = {};
    const customerGroupedChats = {};

    tours.forEach(tour => {
      const isExpertForTour = user?.role === 'expert' && (
          (tour.guideName === user?.name) || 
          (tour.expert?.name === user?.name) || 
          (tour.expert?.email === user?.email) || 
          (tour.expert2?.name === user?.name) || 
          (tour.expert2?.email === user?.email)
      ); 
      const isCustomerForTour = user?.role === 'customer' && tour.participants?.some(p => p.id === user?.id || (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
      
      if (user?.role === 'admin' || isExpertForTour || isCustomerForTour) {
          const isArchive = isTourPast(tour);
          const arrayToPush = isArchive ? past : active;

          // Group Chat 
          if (!(isArchive && isExpiredArchivedTour(tour.dates))) {
              arrayToPush.push({
                 id: tour.id,
                 type: 'group',
                 name: `${tour.name} Grubu`,
                 tourName: tour.name,
                 badgeType: 'group',
                 destination: tour.destination || '',
                 participantCount: tour.participants?.length || 0,
                 ...getChatPreview(tour.id),
                 unread: messages.filter(m => m.chatId === tour.id && m.status !== 'read' && m.sender !== mySenderKey).length,
                 avatar: tour.avatar || tourGroupAvatar,
                 isArchive
              });
          }

          // 1:1 Direct Chats generated from participant map
          if (!isArchive) {
              if (user?.role === 'expert' || user?.role === 'admin') {
                  tour.participants?.forEach(p => {
                     if (!expertGroupedChats[p.id]) {
                         expertGroupedChats[p.id] = {
                             id: `direct_grouped_${p.id}`,
                             type: 'direct',
                             badgeType: 'customer',
                             name: p.name,
                             tourNames: [tour.name],
                             unread: messages.filter(m => m.chatId === getDirectChatId(tour.id, p.id) && m.status !== 'read' && m.sender !== mySenderKey).length,
                             avatar: p.avatar,
                             isArchive: false,
                             lastTId: getDirectChatId(tour.id, p.id)
                         };
                     } else {
                         expertGroupedChats[p.id].tourNames.push(tour.name);
                         expertGroupedChats[p.id].unread += messages.filter(m => m.chatId === getDirectChatId(tour.id, p.id) && m.status !== 'read' && m.sender !== mySenderKey).length;
                     }
                  });
              } else if (user?.role === 'customer') {
                  const customerId = user.id;
                  const { expert1, expert2 } = getTourExperts(tour, users, user);

                  if (expert1 && expert1.name) {
                      const exp1Key = `expert1_${expert1.email || expert1.name}_${tour.id}`;
                      const directChatId = getDirectChatId(tour.id, customerId);
                      if (!customerGroupedChats[exp1Key]) {
                          customerGroupedChats[exp1Key] = {
                              id: directChatId,
                              type: 'direct',
                              badgeType: 'expert',
                              category: 'expert',
                              name: expert1.name,
                              tourNames: [tour.name],
                              unread: messages.filter(m => m.chatId === directChatId && m.status !== 'read' && m.sender !== mySenderKey).length,
                              avatar: expert1.avatar,
                              isArchive: false,
                              lastTId: directChatId
                          };
                      } else {
                          if (!customerGroupedChats[exp1Key].tourNames.includes(tour.name)) {
                              customerGroupedChats[exp1Key].tourNames.push(tour.name);
                          }
                          customerGroupedChats[exp1Key].unread += messages.filter(m => m.chatId === directChatId && m.status !== 'read' && m.sender !== mySenderKey).length;
                      }
                  }

                  if (expert2 && expert2.name) {
                      const exp2Key = `expert2_${expert2.email || expert2.name}_${tour.id}`;
                      const exp2ChatId = `direct_${tour.id}_${customerId}_exp2`;
                      if (!customerGroupedChats[exp2Key]) {
                          customerGroupedChats[exp2Key] = {
                              id: exp2ChatId,
                              type: 'direct',
                              badgeType: 'expert',
                              category: 'expert',
                              name: expert2.name,
                              tourNames: [tour.name],
                              unread: messages.filter(m => m.chatId === exp2ChatId && m.status !== 'read' && m.sender !== mySenderKey).length,
                              avatar: expert2.avatar,
                              isArchive: false,
                              lastTId: exp2ChatId
                          };
                      } else {
                          if (!customerGroupedChats[exp2Key].tourNames.includes(tour.name)) {
                              customerGroupedChats[exp2Key].tourNames.push(tour.name);
                          }
                          customerGroupedChats[exp2Key].unread += messages.filter(m => m.chatId === exp2ChatId && m.status !== 'read' && m.sender !== mySenderKey).length;
                      }
                  }
              }
          }
      }
    });

    Object.values(expertGroupedChats).forEach(c => {
        active.push({
            ...c,
            tourName: c.tourNames.length > 1 ? `${c.tourNames.length} Farklı Turda` : c.tourNames[0],
            ...getChatPreview(c.lastTId)
        });
    });

    Object.values(customerGroupedChats).forEach(c => {
        active.push({
            ...c,
            tourName: c.tourNames.length > 1 ? `${c.tourNames.length} Farklı Turda` : c.tourNames[0],
            ...getChatPreview(c.lastTId)
        });
    });

    // Inject universal organizational chats
    if (user?.role === 'admin') {
        const allExperts = users.filter(u => u.role === 'expert');
        allExperts.forEach(exp => {
            const cId = `direct_admin_${user.id}_expert_${exp.id}`;
            active.push({
                id: cId,
                type: 'direct',
                category: 'expert',
                badgeType: 'expert',
                name: exp.name,
                tourName: 'Yetkili Seyahat Uzmanı',
                unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: exp.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(exp.name.charAt(0)) + "&background=3b82f6&color=fff",
                isArchive: false,
                ...getChatPreview(cId)
            });
        });
        const allTicketing = users.filter(u => u.role === 'ticketing');
        allTicketing.forEach(tick => {
            const cId = `direct_admin_${user.id}_ticketing_${tick.id}`;
            active.push({
                id: cId,
                type: 'direct',
                category: 'ticketing',
                badgeType: 'ticketing',
                name: tick.name,
                tourName: 'Biletleme Uzmanı',
                unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: tick.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(tick.name.charAt(0)) + "&background=10b981&color=fff",
                isArchive: false,
                ...getChatPreview(cId)
            });
        });
    } else if (user?.role === 'expert') {
        const allAdmins = users.filter(u => u.role === 'admin');
        allAdmins.forEach(adm => {
            const cId = `direct_admin_${adm.id}_expert_${user.id}`;
            active.push({
                id: cId,
                type: 'direct',
                category: 'admin',
                badgeType: 'admin',
                name: adm.name || 'Sistem Yöneticisi',
                tourName: 'Yönetim Ekibi',
                unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: adm.avatar || "https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff",
                isArchive: false,
                ...getChatPreview(cId)
            });
        });
        const allTicketing = users.filter(u => u.role === 'ticketing');
        allTicketing.forEach(tick => {
            const cId = `direct_ticketing_${tick.id}_expert_${user.id}`;
            active.push({
                id: cId,
                type: 'direct',
                category: 'ticketing',
                badgeType: 'ticketing',
                name: tick.name,
                tourName: 'Biletleme Uzmanı',
                unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: tick.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(tick.name.charAt(0)) + "&background=10b981&color=fff",
                isArchive: false,
                ...getChatPreview(cId)
            });
        });
    } else if (user?.role === 'ticketing') {
        const allAdmins = users.filter(u => u.role === 'admin');
        allAdmins.forEach(adm => {
            const cId = `direct_admin_${adm.id}_ticketing_${user.id}`;
            active.push({
                id: cId,
                type: 'direct',
                category: 'admin',
                badgeType: 'admin',
                name: adm.name || 'Sistem Yöneticisi',
                tourName: 'Yönetim Ekibi',
                unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: adm.avatar || "https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff",
                isArchive: false,
                ...getChatPreview(cId)
            });
        });
        const allExperts = users.filter(u => u.role === 'expert');
        allExperts.forEach(exp => {
            const cId = `direct_ticketing_${user.id}_expert_${exp.id}`;
            active.push({
                id: cId,
                type: 'direct',
                category: 'expert',
                badgeType: 'expert',
                name: exp.name || 'Seyahat Uzmanı',
                tourName: 'Uzman Ekibi',
                unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: exp.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(exp.name.charAt(0)) + "&background=3b82f6&color=fff",
                isArchive: false,
                ...getChatPreview(cId)
            });
        });
    }

    return { activeChats: active, pastChats: past };
  }, [tours, messages, users, user, tourGroupAvatar, mySenderKey]);

  // Categorization helpers
  const isStaffChat = (chat) => {
    return chat.category === 'admin' || 
           chat.category === 'expert' || 
           chat.category === 'ticketing' || 
           chat.badgeType === 'admin' || 
           chat.badgeType === 'expert' || 
           chat.badgeType === 'ticketing';
  };

  const isCustomerChat = (chat) => {
    return chat.type === 'direct' && !isStaffChat(chat);
  };

  // Split active chats into 3 clean groups
  const groupChats = useMemo(() => activeChats.filter(c => c.type === 'group'), [activeChats]);
  const staffChats = useMemo(() => activeChats.filter(isStaffChat), [activeChats]);
  const customerChats = useMemo(() => activeChats.filter(isCustomerChat), [activeChats]);

  // Tab counts
  const unreadCount = useMemo(() => activeChats.filter(c => c.unread > 0).length, [activeChats]);

  // Filtering function for search query
  const matchSearch = (chat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = chat.name?.toLowerCase().includes(q);
    const matchTour = chat.tourName?.toLowerCase().includes(q);
    const matchMsg = chat.lastMessage?.toLowerCase().includes(q);
    return matchName || matchTour || matchMsg;
  };

  // Filtered by search & unread
  const filteredGroups = useMemo(() => {
    return groupChats.filter(c => {
      if (activeTab === 'unread' && c.unread === 0) return false;
      return matchSearch(c);
    });
  }, [groupChats, searchQuery, activeTab]);

  const filteredStaff = useMemo(() => {
    return staffChats.filter(c => {
      if (activeTab === 'unread' && c.unread === 0) return false;
      return matchSearch(c);
    });
  }, [staffChats, searchQuery, activeTab]);

  const filteredCustomers = useMemo(() => {
    return customerChats.filter(c => {
      if (activeTab === 'unread' && c.unread === 0) return false;
      return matchSearch(c);
    });
  }, [customerChats, searchQuery, activeTab]);

  const totalFilteredCount = filteredGroups.length + filteredStaff.length + filteredCustomers.length;

  const renderBadgeIcon = (badgeType) => {
    switch (badgeType) {
      case 'group':
        return (
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '17px', height: '17px', borderRadius: '50%', background: 'linear-gradient(135deg, #D7147A, #D7147A)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            <Users size={9.5} />
          </div>
        );
      case 'admin':
        return (
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '17px', height: '17px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4338ca)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            <ShieldCheck size={9.5} />
          </div>
        );
      case 'expert':
        return (
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '17px', height: '17px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            <Compass size={9.5} />
          </div>
        );
      case 'ticketing':
        return (
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '17px', height: '17px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            <Plane size={9.5} />
          </div>
        );
      default:
        return (
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '17px', height: '17px', borderRadius: '50%', background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            <User size={9.5} />
          </div>
        );
    }
  };

  const renderLastMessageSnippet = (chat) => {
    let icon = null;
    if (chat.lastMsgType === 'image') {
      icon = <ImageIcon size={11.5} style={{ flexShrink: 0, color: 'var(--primary)' }} />;
    } else if (chat.lastMsgType === 'location') {
      icon = <MapPin size={11.5} style={{ flexShrink: 0, color: '#ef4444' }} />;
    } else if (chat.lastMsgType === 'real_audio') {
      icon = <Mic size={11.5} style={{ flexShrink: 0, color: '#0284c7' }} />;
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', minWidth: 0, flex: 1 }}>
        {chat.lastMsgIsMe && (
          <span style={{ display: 'inline-flex', alignItems: 'center', color: chat.lastMsgStatus === 'read' ? '#0284c7' : '#94a3b8', flexShrink: 0 }}>
            {chat.lastMsgStatus === 'read' ? <CheckCheck size={12} /> : (chat.lastMsgStatus === 'delivered' ? <CheckCheck size={12} /> : <Check size={12} />)}
          </span>
        )}
        {icon}
        <span style={{ 
          fontSize: '11.5px', 
          color: chat.unread > 0 ? 'var(--text-main)' : 'var(--text-muted)', 
          fontWeight: chat.unread > 0 ? '600' : '400',
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          lineHeight: '1.2'
        }}>
          {chat.lastMessage}
        </span>
      </div>
    );
  };

  const renderChatItem = (chat) => {
    const isUnread = chat.unread > 0;

    return (
      <div 
         key={chat.id} 
         onClick={() => navigate(`/dashboard/chat/${chat.id}`)}
         style={{ 
           display: 'flex', 
           alignItems: 'center', 
           gap: '11px', 
           padding: '9px 11px', 
           background: isUnread ? '#fff5f9' : '#f8fafc', 
           borderRadius: '12px', 
           cursor: 'pointer', 
           transition: 'all 0.15s ease', 
           boxShadow: isUnread ? '0 2px 6px rgba(215, 20, 122, 0.08)' : 'none', 
           opacity: chat.isArchive ? 0.75 : 1, 
           border: isUnread ? '1.2px solid rgba(215, 20, 122, 0.35)' : '1px solid #f1f5f9',
           position: 'relative'
         }}
         onMouseEnter={e => {
           e.currentTarget.style.transform = 'translateY(-1px)';
           e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.05)';
           e.currentTarget.style.background = isUnread ? '#FDF2F8' : '#ffffff';
         }}
         onMouseLeave={e => {
           e.currentTarget.style.transform = 'translateY(0)';
           e.currentTarget.style.boxShadow = isUnread ? '0 2px 6px rgba(215, 20, 122, 0.08)' : 'none';
           e.currentTarget.style.background = isUnread ? '#fff5f9' : '#f8fafc';
         }}
      >
         {/* Avatar with role/group badge */}
         <div style={{ position: 'relative', flexShrink: 0 }}>
             <div style={{ 
               width: '40px', 
               height: '40px', 
               borderRadius: '11px', 
               backgroundColor: 'var(--primary-light)', 
               overflow: 'hidden', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
               border: isUnread ? '1.5px solid var(--primary)' : '1px solid #e2e8f0'
             }}>
                 {chat.avatar ? (
                     <img 
                       loading="lazy" 
                       src={chat.avatar} 
                       alt={chat.name} 
                       style={{ width: '100%', height: '100%', objectFit: 'cover', filter: chat.isArchive ? 'grayscale(100%)' : 'none' }} 
                     />
                 ) : (
                     chat.type === 'announcement' ? (
                       <Speaker size={17} className="text-primary" />
                     ) : (
                       <Users size={17} className="text-primary" />
                     )
                 )}
             </div>
             {renderBadgeIcon(chat.badgeType)}
         </div>
         
         {/* Content Area */}
         <div style={{ flex: 1, minWidth: 0 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                 <div style={{ minWidth: 0, paddingRight: '6px', flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                     <h3 style={{ 
                       fontSize: '12.5px', 
                       fontWeight: isUnread ? '700' : '600', 
                       color: 'var(--text-main)', 
                       margin: 0, 
                       whiteSpace: 'nowrap', 
                       overflow: 'hidden', 
                       textOverflow: 'ellipsis',
                       lineHeight: '1.2'
                     }}>
                         {chat.name}
                     </h3>
                     {chat.isArchive && (
                       <span style={{ fontSize: '9px', background: '#e2e8f0', color: '#64748b', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>Arşiv</span>
                     )}
                 </div>
                 <span style={{ 
                   fontSize: '10.5px', 
                   fontWeight: isUnread ? '700' : '500', 
                   color: isUnread ? 'var(--primary)' : 'var(--text-muted)',
                   flexShrink: 0
                 }}>
                   {chat.time}
                 </span>
             </div>

             {/* Tour or Role Pill only for direct chats */}
             {chat.type === 'direct' && chat.tourName && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                 <span style={{ 
                   fontSize: '9.5px', 
                   color: '#64748b', 
                   background: '#ffffff', 
                   padding: '1px 5px', 
                   borderRadius: '4px', 
                   fontWeight: '500',
                   border: '1px solid #e2e8f0',
                   whiteSpace: 'nowrap', 
                   overflow: 'hidden', 
                   textOverflow: 'ellipsis',
                   maxWidth: '200px'
                 }}>
                   {chat.category ? `🛡️ ${chat.tourName}` : `✈️ ${chat.tourName}`}
                 </span>
               </div>
             )}

             {/* Last Message and Unread Badge */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                 {renderLastMessageSnippet(chat)}
                 {isUnread && (
                     <div style={{ 
                       minWidth: '17px', 
                       height: '17px', 
                       padding: '0 5px',
                       borderRadius: '9px', 
                       background: 'linear-gradient(135deg, #D7147A, #D7147A)', 
                       color: 'white', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       fontSize: '9.5px', 
                       fontWeight: '700', 
                       boxShadow: '0 2px 5px rgba(215, 20, 122, 0.3)',
                       flexShrink: 0
                     }}>
                         {chat.unread}
                     </div>
                 )}
             </div>
         </div>
      </div>
    );
  };

  const showGroupsSection = (activeTab === 'all' || activeTab === 'groups' || activeTab === 'unread') && filteredGroups.length > 0;
  const showStaffSection = (activeTab === 'all' || activeTab === 'staff' || activeTab === 'unread') && filteredStaff.length > 0;
  const showCustomersSection = (activeTab === 'all' || activeTab === 'customers' || activeTab === 'unread') && filteredCustomers.length > 0;

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Sohbetler ve Gruplar" />
      
      <div style={{ padding: '0 14px', marginTop: '12px' }}>
         
         {/* Live Search Bar */}
         <div style={{ position: 'relative', marginBottom: '12px' }}>
             <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
             <input 
               type="text" 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               placeholder="Sohbet, kişi veya tur ara..." 
               style={{ 
                 width: '100%', 
                 padding: '9px 34px 9px 34px', 
                 borderRadius: '11px', 
                 border: '1px solid #e2e8f0', 
                 background: 'var(--surface)', 
                 outline: 'none', 
                 fontSize: '12.5px',
                 color: 'var(--text-main)',
                 boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                 transition: 'border-color 0.2s'
               }}
               onFocus={e => e.target.style.borderColor = 'var(--primary)'}
               onBlur={e => e.target.style.borderColor = '#e2e8f0'}
             />
             {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 style={{ 
                   position: 'absolute', 
                   right: '10px', 
                   top: '50%', 
                   transform: 'translateY(-50%)', 
                   background: '#f1f5f9', 
                   border: 'none', 
                   borderRadius: '50%', 
                   width: '18px', 
                   height: '18px', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   cursor: 'pointer',
                   color: '#64748b'
                 }}
               >
                 <X size={11} />
               </button>
             )}
         </div>

         {/* Filter Tabs Pills */}
         <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '14px', scrollbarWidth: 'none' }}>
             <button
               onClick={() => setActiveTab('all')}
               style={{
                 padding: '5px 11px',
                 borderRadius: '16px',
                 border: activeTab === 'all' ? '1.2px solid var(--primary)' : '1px solid #e2e8f0',
                 background: activeTab === 'all' ? 'var(--primary)' : 'var(--surface)',
                 color: activeTab === 'all' ? 'white' : '#64748b',
                 fontSize: '11.5px',
                 fontWeight: '600',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px',
                 whiteSpace: 'nowrap',
                 transition: 'all 0.15s',
                 boxShadow: activeTab === 'all' ? '0 2px 6px rgba(215, 20, 122, 0.2)' : 'none'
               }}
             >
               Tümü <span style={{ fontSize: '10px', opacity: 0.85 }}>({activeChats.length})</span>
             </button>

             <button
               onClick={() => setActiveTab('groups')}
               style={{
                 padding: '5px 11px',
                 borderRadius: '16px',
                 border: activeTab === 'groups' ? '1.2px solid var(--primary)' : '1px solid #e2e8f0',
                 background: activeTab === 'groups' ? 'var(--primary)' : 'var(--surface)',
                 color: activeTab === 'groups' ? 'white' : '#64748b',
                 fontSize: '11.5px',
                 fontWeight: '600',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '4px',
                 whiteSpace: 'nowrap',
                 transition: 'all 0.15s',
                 boxShadow: activeTab === 'groups' ? '0 2px 6px rgba(215, 20, 122, 0.2)' : 'none'
               }}
             >
               <Users size={12} /> Tur Grupları <span style={{ fontSize: '10px', opacity: 0.85 }}>({groupChats.length})</span>
             </button>

             {staffChats.length > 0 && (
               <button
                 onClick={() => setActiveTab('staff')}
                 style={{
                   padding: '5px 11px',
                   borderRadius: '16px',
                   border: activeTab === 'staff' ? '1.2px solid #6366f1' : '1px solid #e2e8f0',
                   background: activeTab === 'staff' ? '#6366f1' : 'var(--surface)',
                   color: activeTab === 'staff' ? 'white' : '#64748b',
                   fontSize: '11.5px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px',
                   whiteSpace: 'nowrap',
                   transition: 'all 0.15s',
                   boxShadow: activeTab === 'staff' ? '0 2px 6px rgba(99, 102, 241, 0.2)' : 'none'
                 }}
               >
                 <ShieldCheck size={12} /> Personel & Yetkili <span style={{ fontSize: '10px', opacity: 0.85 }}>({staffChats.length})</span>
               </button>
             )}

             {customerChats.length > 0 && (
               <button
                 onClick={() => setActiveTab('customers')}
                 style={{
                   padding: '5px 11px',
                   borderRadius: '16px',
                   border: activeTab === 'customers' ? '1.2px solid #0284c7' : '1px solid #e2e8f0',
                   background: activeTab === 'customers' ? '#0284c7' : 'var(--surface)',
                   color: activeTab === 'customers' ? 'white' : '#64748b',
                   fontSize: '11.5px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px',
                   whiteSpace: 'nowrap',
                   transition: 'all 0.15s',
                   boxShadow: activeTab === 'customers' ? '0 2px 6px rgba(2, 132, 199, 0.2)' : 'none'
                 }}
               >
                 <User size={12} /> Müşteriler <span style={{ fontSize: '10px', opacity: 0.85 }}>({customerChats.length})</span>
               </button>
             )}

             {unreadCount > 0 && (
               <button
                 onClick={() => setActiveTab('unread')}
                 style={{
                   padding: '5px 11px',
                   borderRadius: '16px',
                   border: activeTab === 'unread' ? '1.2px solid #D7147A' : '1px solid #F9BED8',
                   background: activeTab === 'unread' ? '#D7147A' : '#FDF2F8',
                   color: activeTab === 'unread' ? 'white' : '#D7147A',
                   fontSize: '11.5px',
                   fontWeight: '700',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px',
                   whiteSpace: 'nowrap',
                   transition: 'all 0.15s',
                   boxShadow: activeTab === 'unread' ? '0 2px 6px rgba(215, 20, 122, 0.2)' : 'none'
                 }}
               >
                 <Sparkles size={11} /> Okunmamış <span style={{ fontSize: '9.5px', background: activeTab === 'unread' ? 'rgba(255,255,255,0.25)' : '#D7147A', color: 'white', padding: '1px 5px', borderRadius: '6px' }}>{unreadCount}</span>
               </button>
             )}
         </div>

         {/* Chat List Categorized into Separate Cards */}
         <div>
            {totalFilteredCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--surface)', borderRadius: '14px', border: '1px dashed #e2e8f0' }}>
                    <MessageCircle size={30} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px', fontSize: '13px' }}>
                      {searchQuery ? 'Aramanıza uygun sohbet bulunamadı' : (activeTab === 'unread' ? 'Tüm mesajları okudunuz!' : 'Henüz aktif bir sohbet bulunmuyor')}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      {searchQuery ? 'Farklı bir arama terimi deneyin.' : (activeTab === 'unread' ? 'Yeni bir mesaj geldiğinde burada listelenecektir.' : 'Tur grupları ve yetkililerle buradan iletişim kurabilirsiniz.')}
                    </div>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Aramayı Temizle
                      </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* SECTION 1: TUR GRUPLARI KARTI */}
                    {showGroupsSection && (
                      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                              <Users size={12} />
                            </div>
                            <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Tur Grupları
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '10px', fontWeight: '700' }}>
                            {filteredGroups.length} Grup
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {filteredGroups.map(renderChatItem)}
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: PERSONEL & YETKİLİLER KARTI */}
                    {showStaffSection && (
                      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                              <ShieldCheck size={12} />
                            </div>
                            <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Personel & Yetkili Ekip
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '10px', fontWeight: '700' }}>
                            {filteredStaff.length} Yetkili
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {filteredStaff.map(renderChatItem)}
                        </div>
                      </div>
                    )}

                    {/* SECTION 3: MÜŞTERİLER & KATILIMCILAR KARTI */}
                    {showCustomersSection && (
                      <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                              <User size={12} />
                            </div>
                            <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Müşteriler & Katılımcılar
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '10px', fontWeight: '700' }}>
                            {filteredCustomers.length} Müşteri
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          {filteredCustomers.map(renderChatItem)}
                        </div>
                      </div>
                    )}

                </div>
            )}
         </div>

         {/* Past / Archived Tours Section */}
         {(user?.role === 'expert' || user?.role === 'admin') && pastChats.length > 0 && !searchQuery && activeTab !== 'unread' && (
             <div style={{ marginTop: '20px' }}>
                 <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '12px 14px', border: '1px solid #e2e8f0', opacity: 0.85 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)' }}>
                        <Archive size={13} />
                        <h2 style={{ fontSize: '11.5px', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Geçmiş Seyahat Sohbetleri ({pastChats.length})
                        </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                       {pastChats.map(renderChatItem)}
                    </div>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
}
