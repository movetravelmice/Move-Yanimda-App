import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Speaker, Archive } from 'lucide-react';
import Header from '../../components/Header';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useChatStore } from '../../store/chatStore';
import { useTourStore } from '../../store/tourStore';

export default function ChatList() {
  const navigate = useNavigate();
  const { systemAnnouncementAvatar: systemAvatar, tourGroupAvatar, expertName } = useSettingsStore();
  const { messages = [] } = useChatStore();
  const { tours } = useTourStore();
  const users = useUserStore(state => state.users);
  const user = useAuthStore(state => state.user);
  const mySenderKey = user?.role === 'expert' ? 'expert' : (user?.role === 'admin' ? 'admin' : (user?.role === 'ticketing' ? 'ticketing' : 'customer'));

  const getChatPreview = (chatId) => {
    const thread = messages.filter(m => m.chatId === chatId);
    if (thread.length === 0) return { lastMessage: 'Henüz mesaj yok.', time: '' };
    const last = thread[thread.length - 1];
    
    let previewText = last.text;
    if (last.type === 'image') previewText = 'g Fotoğraf';
    if (last.type === 'location') previewText = 'g Konum paylaştı';
    if (last.type === 'real_audio') previewText = 'g?️ Ses Kaydiı';
    
    if (chatId.startsWith('tour_') && last.sender !== 'system' && last.senderName) {
        previewText = `${last.senderName.split(' ')[0]}: ${previewText}`;
    }

    return { lastMessage: previewText, time: last.timestamp };
  };

  const getDirectChatId = (tourId, pId) => {
      // Keep legacy mocked ID for the prototype scenario to match pre-written messages
      if (tourId === 'tour_avrupa_ruyasi' && pId === 'cust_1') return 'expert_direct';
      return `direct_${tourId}_${pId}`;
  };

  const activeChats = [];
  const pastChats = [];
  
  const expertGroupedChats = {};
  const customerGroupedChats = {};

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

  tours.forEach(tour => {
     const isExpertForTour = user?.role === 'expert' && (
         (tour.guideName === user?.name) || 
         (tour.expert?.name === user?.name) || 
         (tour.expert?.email === user?.email) || 
         (tour.expert2?.name === user?.name) || 
         (tour.expert2?.email === user?.email)
     ); 
     const isCustomerForTour = user?.role === 'customer' && tour.participants?.some(p => p.id === user?.id || p.email === user?.email);
     
     if (user?.role === 'admin' || isExpertForTour || isCustomerForTour) {
         const isArchive = tour.status === 'past';
         const arrayToPush = isArchive ? pastChats : activeChats;

         // Göroup Chat 
         if (!(isArchive && isExpiredArchivedTour(tour.dates))) {
             arrayToPush.push({
                id: tour.id,
                type: 'group',
                name: `${tour.name} Grubu`,
                ...getChatPreview(tour.id),
                unread: messages.filter(m => m.chatId === tour.id && m.status !== 'read' && m.sender !== mySenderKey).length,
                avatar: tour.avatar || tourGroupAvatar,
                isArchive
             });
         }

         // 1:1 Direct Chats generated from participant map
         if (!isArchive) {
             if (user?.role === 'expert' || user?.role === 'admin') {
                 tour.participants.forEach(p => {
                    if (!expertGroupedChats[p.id]) {
                        expertGroupedChats[p.id] = {
                            id: `direct_grouped_${p.id}`,
                            type: 'direct',
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
                 if (!customerGroupedChats['expert']) {
                     customerGroupedChats['expert'] = {
                         id: `direct_grouped_cust_1`,
                         type: 'direct',
                         name: expertName || tour.expert.name,
                         tourNames: [tour.name],
                         unread: messages.filter(m => m.chatId === getDirectChatId(tour.id, 'cust_1') && m.status !== 'read' && m.sender !== mySenderKey).length,
                         avatar: users.find(u => u.name === (expertName || tour.expert.name))?.avatar || tour.expert.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((expertName || tour.expert.name || 'U').charAt(0))}&background=D7147A&color=fff`,
                         isArchive: false,
                         lastTId: getDirectChatId(tour.id, 'cust_1')
                     };
                 } else {
                     customerGroupedChats['expert'].tourNames.push(tour.name);
                     customerGroupedChats['expert'].unread += messages.filter(m => m.chatId === getDirectChatId(tour.id, 'cust_1') && m.status !== 'read' && m.sender !== mySenderKey).length;
                 }
             }
         }
     }
  });

  Object.values(expertGroupedChats).forEach(c => {
      activeChats.push({
          ...c,
          tourName: c.tourNames.length > 1 ? `${c.tourNames.length} Farkliı Turda` : c.tourNames[0],
          ...getChatPreview(c.lastTId)
      });
  });

  Object.values(customerGroupedChats).forEach(c => {
      activeChats.push({
          ...c,
          tourName: c.tourNames.length > 1 ? `${c.tourNames.length} Farkliı Turda` : c.tourNames[0],
          ...getChatPreview(c.lastTId)
      });
  });

  // Inject universal organizational chats
  if (user?.role === 'admin') {
      const allExperts = users.filter(u => u.role === 'expert');
      allExperts.forEach(exp => {
          const cId = `direct_admin_${user.id}_expert_${exp.id}`;
          activeChats.push({
              id: cId,
              type: 'direct',
              category: 'expert',
              name: exp.name,
              tourName: 'Yetkili Seyahat Uzmanı',
              unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
              avatar: exp.avatar || "https://ui-avatars.com/api/?name=" + exp.name.charAt(0) + "&background=3b82f6&color=fff",
              isArchive: false,
              ...getChatPreview(cId)
          });
      });
      const allTicketing = users.filter(u => u.role === 'ticketing');
      allTicketing.forEach(tick => {
          const cId = `direct_admin_${user.id}_ticketing_${tick.id}`;
          activeChats.push({
              id: cId,
              type: 'direct',
              category: 'ticketing',
              name: tick.name,
              tourName: 'Biletleme Uzmanı',
              unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
              avatar: tick.avatar || "https://ui-avatars.com/api/?name=" + tick.name.charAt(0) + "&background=10b981&color=fff",
              isArchive: false,
              ...getChatPreview(cId)
          });
      });
  } else if (user?.role === 'expert') {
      const allAdmins = users.filter(u => u.role === 'admin');
      allAdmins.forEach(adm => {
          const cId = `direct_admin_${adm.id}_expert_${user.id}`;
          activeChats.push({
              id: cId,
              type: 'direct',
              category: 'admin',
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
          activeChats.push({
              id: cId,
              type: 'direct',
              category: 'ticketing',
              name: tick.name,
              tourName: 'Biletleme Uzmanı',
              unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
              avatar: tick.avatar || "https://ui-avatars.com/api/?name=" + tick.name.charAt(0) + "&background=10b981&color=fff",
              isArchive: false,
              ...getChatPreview(cId)
          });
      });
  } else if (user?.role === 'ticketing') {
      const allAdmins = users.filter(u => u.role === 'admin');
      allAdmins.forEach(adm => {
          const cId = `direct_admin_${adm.id}_ticketing_${user.id}`;
          activeChats.push({
              id: cId,
              type: 'direct',
              category: 'admin',
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
          activeChats.push({
              id: cId,
              type: 'direct',
              category: 'expert',
              name: exp.name || 'Seyahat Uzmanı',
              tourName: 'Uzman Ekibi',
              unread: messages.filter(m => m.chatId === cId && m.status !== 'read' && m.sender !== mySenderKey).length,
              avatar: exp.avatar || "https://ui-avatars.com/api/?name=" + exp.name.charAt(0) + "&background=3b82f6&color=fff",
              isArchive: false,
              ...getChatPreview(cId)
          });
      });
  }

  const renderChatItem = (chat) => (
      <div 
         key={chat.id} 
         onClick={() => navigate(`/dashboard/chat/${chat.id}`)}
         style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--surface)', borderRadius: '16px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', opacity: chat.isArchive ? 0.75 : 1 }}
         onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
         onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
      >
         <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {chat.avatar ? (
                 <img loading="lazy" src={chat.avatar} alt={chat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: chat.isArchive ? 'grayscale(100%)' : 'none' }} />
             ) : (
                 chat.type === 'announcement' ? <Speaker size={24} className="text-primary" /> : <Users size={24} className="text-primary" />
             )}
         </div>
         
         <div style={{ flex: 1, minWidth: 0 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                 <div style={{ minWidth: 0, paddingRight: '8px' }}>
                     <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.name}</h3>
                     {chat.tourName && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.tourName}</div>}
                 </div>
                 <span style={{ fontSize: '12px', fontWeight: chat.unread ? 'bold' : 'normal', color: chat.unread ? 'var(--primary)' : 'var(--text-muted)' }}>{chat.time}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <p style={{ fontSize: '13px', color: chat.unread ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: chat.unread ? '500' : 'normal', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{chat.lastMessage}</p>
                 {chat.unread > 0 && (
                     <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', marginLeft: '12px', flexShrink: 0 }}>
                         {chat.unread}
                     </div>
                 )}
             </div>
         </div>
      </div>
  );

  const activeGroupChats = activeChats.filter(c => c.type === 'group');
  const activeDirectChats = activeChats.filter(c => c.type === 'direct');

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Mesajlar ve Gruplar" />
      
      <div style={{ padding: '0 16px', marginTop: '20px' }}>
         <div style={{ position: 'relative', marginBottom: '24px' }}>
             <input type="text" placeholder="Sohbetlerde ara..." style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface)', outline: 'none', fontSize: '14px' }} />
         </div>

         <div>
            {activeChats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--surface)', borderRadius: '12px' }}>
                    Henüz aktif bir mesajınız bulunmuyor.
                </div>
            ) : (
                <>
                    {activeGroupChats.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Gruplar <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeGroupChats.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activeGroupChats.map(renderChatItem)}
                            </div>
                        </div>
                    )}
                    
                    {activeDirectChats.length > 0 && (user?.role === 'expert' || user?.role === 'ticketing' || user?.role === 'admin') ? (
                        <>
                            {activeDirectChats.filter(c => c.category === 'admin').length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Yönetim <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeDirectChats.filter(c => c.category === 'admin').length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {activeDirectChats.filter(c => c.category === 'admin').map(renderChatItem)}
                                    </div>
                                </div>
                            )}

                            {activeDirectChats.filter(c => c.category === 'expert').length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Seyahat Uzmanları <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeDirectChats.filter(c => c.category === 'expert').length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {activeDirectChats.filter(c => c.category === 'expert').map(renderChatItem)}
                                    </div>
                                </div>
                            )}

                            {activeDirectChats.filter(c => c.category === 'ticketing').length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Biletleme Uzmanları <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeDirectChats.filter(c => c.category === 'ticketing').length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {activeDirectChats.filter(c => c.category === 'ticketing').map(renderChatItem)}
                                    </div>
                                </div>
                            )}

                            {activeDirectChats.filter(c => !c.category).length > 0 && (
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Müşteriler <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeDirectChats.filter(c => !c.category).length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {activeDirectChats.filter(c => !c.category).map(renderChatItem)}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : activeDirectChats.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Kişiler <span style={{ background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{activeDirectChats.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activeDirectChats.map(renderChatItem)}
                            </div>
                        </div>
                    )}
                </>
            )}
         </div>

         {(user?.role === 'expert' || user?.role === 'admin') && pastChats.length > 0 && (
             <div style={{ marginTop: '36px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)' }}>
                     <Archive size={18} />
                     <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Arşiv (Geçmiş Seyahat Sohbetleri)</h2>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pastChats.map(renderChatItem)}
                 </div>
             </div>
         )}
      </div>
    </div>
  );
}

