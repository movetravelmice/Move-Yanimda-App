import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Languages, 
  Compass, 
  Luggage, 
  UserPlus, 
  LogIn, 
  MessageCircle, 
  Bell, 
  User,
  CheckSquare,
  Wallet 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTourStore } from '../store/tourStore';
import { useChatStore } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';

export default function AppBottomNav() {
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const location = useLocation();
  const messages = useChatStore(state => state.messages);
  const { notifications } = useNotificationStore();
  const { tours } = useTourStore();

  const pathname = location.pathname;

  const isGuest = !user;

  // Determine user mode reliably:
  // 1. If activeMode is explicitly 'individual' -> Individual mode
  // 2. If current route starts with '/individual' -> Individual mode
  // 3. If user is strictly individual account and activeMode !== 'corporate' -> Individual mode
  // Otherwise -> Corporate mode
  const isIndividual = !isGuest && (
    activeMode === 'individual' ||
    pathname.startsWith('/individual') ||
    (user?.userType === 'individual' && activeMode !== 'corporate') ||
    (user?.role === 'individual' && activeMode !== 'corporate')
  );
  const isCorporate = !isGuest && !isIndividual;

  // -------------------------------------------------------------
  // Corporate unread counts calculation (identical to DashboardLayout)
  // -------------------------------------------------------------
  let unreadMessagesCount = 0;
  let myUnreadNotificationsCount = 0;

  if (isCorporate) {
    const myTourIds = tours.filter(t => {
      if (user?.role === 'expert') return (t.guideName === user?.name) || (t.expert?.name === user?.name);
      if (user?.role === 'customer') return t.participants?.some(p => p.id === user?.id || (p.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
      if (user?.role === 'ticketing' || user?.role === 'admin') return true;
      return true;
    }).map(t => t.id);

    myUnreadNotificationsCount = notifications
      .filter(n => !n.tourId || myTourIds.includes(n.tourId))
      .filter(n => !(n.deletedBy || []).includes(user?.email || 'mock_user'))
      .filter(n => !n.readBy.includes(user?.email || 'mock_user'))
      .length;

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

    const isChatRelevant = (chatId) => {
      if (!user) return false;
      if (chatId === 'announcement') return true;

      if (chatId.startsWith('tour_')) {
        const t = tours.find(tour => tour.id === chatId);
        if (!t) return false;
        if (t.status === 'past' && isExpiredArchivedTour(t.dates)) return false;

        if (user.role === 'customer') {
          return t.participants?.some(p => p.id === user.id || (p.email && user.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
        }
        if (user.role === 'expert' || user.role === 'admin' || user.role === 'ticketing') {
          return (t.guideName === user.name) || (t.expert?.name === user.name) || (t.expert?.email === user.email) || (t.expert2?.name === user.name) || (t.expert2?.email === user.email);
        }
        return false;
      }

      if (chatId.startsWith('direct_') || chatId === 'expert_direct') {
        if (chatId.startsWith('direct_admin_') || chatId.startsWith('direct_ticketing_')) {
          return chatId.includes(user.id);
        }
        const cleanId = chatId.replace('direct_', '');
        const sortedTours = [...tours].sort((a, b) => b.id.length - a.id.length);
        const t = chatId === 'expert_direct' 
          ? tours.find(tour => tour.id === 'tour_avrupa_ruyasi')
          : sortedTours.find(tour => cleanId.startsWith(tour.id));
            
        if (!t || t.status === 'past') return false;

        if (user.role === 'customer') {
          if (chatId === 'expert_direct') return user.id === 'cust_1';
          return chatId.endsWith(`_${user.id}`);
        }
        if (user.role === 'expert') {
          return (t.guideName === user.name) || (t.expert?.name === user.name) || (t.expert?.email === user.email) || (t.expert2?.name === user.name) || (t.expert2?.email === user.email);
        }
        if (user.role === 'admin' || user.role === 'ticketing') {
          return chatId.includes(user.id);
        }
        return false;
      }
      return false;
    };

    const mySenderKey = user?.role === 'expert' ? 'expert' : (user?.role === 'admin' ? 'admin' : (user?.role === 'ticketing' ? 'ticketing' : 'customer'));
    unreadMessagesCount = messages.filter(m => {
      if (m.status === 'read') return false;
      if (m.sender === mySenderKey || m.senderName === user.name) return false;
      return isChatRelevant(m.chatId);
    }).length;
  }

  // -------------------------------------------------------------
  // BUILD NAV ITEMS ACCORDING TO USER MODE
  // -------------------------------------------------------------
  let navItems = [];

  if (isGuest) {
    // Giriş Yapmadan (Guest / Public): 6 Items
    // Ana Sayfa, Seyahatler, Checklist, Bütçe, Araçlar, Giriş Yap
    navItems = [
      {
        path: '/welcome',
        label: 'Ana Sayfa',
        icon: Home,
        isActive: pathname === '/' || pathname === '/welcome'
      },
      {
        path: '/individual/travels',
        label: 'Seyahatler',
        icon: Luggage,
        isActive: pathname.startsWith('/individual/travels')
      },
      {
        path: '/individual/checklists',
        label: 'Checklist',
        icon: CheckSquare,
        isActive: pathname.startsWith('/individual/checklists')
      },
      {
        path: '/individual/budget',
        label: 'Bütçe',
        icon: Wallet,
        isActive: pathname.startsWith('/individual/budget')
      },
      {
        path: '/travel-tools',
        label: 'Araçlar',
        icon: Compass,
        isActive: pathname.startsWith('/travel-tools') || pathname.startsWith('/translator')
      },
      {
        path: '/login',
        label: 'Giriş Yap',
        icon: LogIn,
        isActive: pathname.startsWith('/login') || pathname.startsWith('/register')
      }
    ];
  } else if (isIndividual) {
    // Bireysel Kullanıcı (Individual Logged-in): 6 Items
    // Ana Sayfa, Seyahatler, Checklist, Bütçe, Araçlar, Hesabım
    navItems = [
      {
        path: '/individual/dashboard',
        label: 'Ana Sayfa',
        icon: Home,
        isActive: pathname === '/' || pathname === '/welcome' || pathname === '/individual' || pathname === '/individual/dashboard'
      },
      {
        path: '/individual/travels',
        label: 'Seyahatler',
        icon: Luggage,
        isActive: pathname.startsWith('/individual/travels')
      },
      {
        path: '/individual/checklists',
        label: 'Checklist',
        icon: CheckSquare,
        isActive: pathname.startsWith('/individual/checklists')
      },
      {
        path: '/individual/budget',
        label: 'Bütçe',
        icon: Wallet,
        isActive: pathname.startsWith('/individual/budget')
      },
      {
        path: '/travel-tools',
        label: 'Araçlar',
        icon: Compass,
        isActive: pathname.startsWith('/travel-tools') || pathname.startsWith('/translator')
      },
      {
        path: '/individual/profile',
        label: 'Hesabım',
        icon: User,
        isActive: pathname.startsWith('/individual/profile')
      }
    ];
  } else {
    // Kurumsal Kullanıcı (Corporate Logged-in): 5 Items
    // Ana Sayfa, Mesajlar, Bildirim, Araçlar, Hesabım
    navItems = [
      {
        path: '/dashboard',
        label: 'Ana Sayfa',
        icon: Home,
        isActive: pathname === '/dashboard' || (!pathname.startsWith('/dashboard/chat') && !pathname.startsWith('/dashboard/notifications') && !pathname.startsWith('/dashboard/currency') && !pathname.startsWith('/dashboard/profile') && !pathname.startsWith('/travel-tools') && !pathname.startsWith('/translator') && pathname.startsWith('/dashboard'))
      },
      {
        path: '/dashboard/chat',
        label: 'Mesajlar',
        icon: MessageCircle,
        badgeCount: unreadMessagesCount,
        isActive: pathname.startsWith('/dashboard/chat')
      },
      {
        path: '/dashboard/notifications',
        label: 'Bildirim',
        icon: Bell,
        hasDotBadge: myUnreadNotificationsCount > 0,
        isActive: pathname === '/dashboard/notifications' || pathname.startsWith('/dashboard/broadcast')
      },
      {
        path: '/travel-tools',
        label: 'Araçlar',
        icon: Compass,
        isActive: pathname.startsWith('/travel-tools') || pathname === '/dashboard/currency' || pathname.startsWith('/translator')
      },
      {
        path: '/dashboard/profile',
        label: 'Hesabım',
        icon: User,
        isActive: pathname === '/dashboard/profile'
      }
    ];
  }

  return (
    <nav className="bottom-nav" aria-label="Ana Menü">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} strokeWidth={isActive ? 2.3 : 2} />
              
              {/* Badge for unread messages count */}
              {item.badgeCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-9px',
                  background: isActive ? 'var(--primary)' : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--primary)',
                  borderRadius: '10px',
                  minWidth: '15px',
                  height: '15px',
                  padding: '0 3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}>
                  {item.badgeCount}
                </div>
              )}

              {/* Dot badge for notifications */}
              {item.hasDotBadge && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  background: isActive ? 'var(--primary)' : '#ffffff',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
