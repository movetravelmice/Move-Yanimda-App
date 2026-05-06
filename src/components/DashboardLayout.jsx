import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTourStore } from '../store/tourStore';
import CustomerDashboard from '../pages/Customer/Dashboard';
import ExpertDashboard from '../pages/Expert/Dashboard';
import AdminDashboard from '../pages/Admin/Dashboard';
import TicketingDashboard from '../pages/Ticketing/Dashboard';
import AdminSettings from '../pages/Admin/Settings';
import PastOperations from '../pages/Admin/PastOperations';
import AdminUsers from '../pages/Admin/Users';
import Currency from '../pages/Customer/Currency';
import Transfers from '../pages/Customer/Transfers';
import TourProgram from '../pages/Customer/TourProgram';
import ChatList from '../pages/Customer/ChatList';
import Chat from '../pages/Customer/Chat';
import ProfileSettings from '../pages/ProfileSettings';
import Notifications from '../pages/Notifications';
import ParticipantsList from '../pages/Expert/ParticipantsList';
import EditProgram from '../pages/Expert/EditProgram';
import CreateTour from '../pages/Expert/CreateTour';
import PastTourDetails from '../pages/Expert/PastTourDetails';
import DestinationGuide from '../pages/Customer/DestinationGuide';
import CustomerRollCallModal from './CustomerRollCallModal';
import NotificationBanner from './NotificationBanner';
import { useNotificationStore } from '../store/notificationStore';
import { useDeviceNotifications } from '../hooks/useDeviceNotifications';
import { Home, MessageCircle, Banknote, User, Bell } from 'lucide-react';

export default function DashboardLayout() {
  useDeviceNotifications(); // Invoke background device notifications hook
  
  const user = useAuthStore(state => state.user);
  const location = useLocation();
  const { notifications } = useNotificationStore();
  const { tours } = useTourStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'customer': return <CustomerDashboard />;
      case 'expert': return <ExpertDashboard />;
      case 'ticketing': return <TicketingDashboard />;
      case 'admin': 
        return <AdminDashboard />;
      default: return <Navigate to="/login" />;
    }
  };

  return (
    <>
      <NotificationBanner />
      <Routes>
        <Route path="/" element={renderDashboard()} />
        <Route path="currency" element={<Currency />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="transfers/:tourId" element={<Transfers />} />
        <Route path="program" element={<TourProgram />} />
        <Route path="program/:tourId" element={<TourProgram />} />
        <Route path="chat" element={<ChatList />} />
        <Route path="chat/:chatId" element={<Chat />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="participants/:tourId" element={<ParticipantsList />} />
        <Route path="program-edit/:tourId" element={<EditProgram />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="create-tour" element={<CreateTour />} />
        <Route path="create-tour/:tourId" element={<CreateTour />} />
        <Route path="past-tour/:tourId" element={<PastTourDetails />} />
        <Route path="guide/:tourId" element={<DestinationGuide />} />
        {/* Admin specific standalone routes */}
        <Route path="admin-settings" element={<AdminSettings />} />
        <Route path="admin-users" element={<AdminUsers />} />
        <Route path="admin-past-operations" element={<PastOperations />} />
      </Routes>
      
      {/* Global Roll Call Modal for active customers */}
      <CustomerRollCallModal />
      
      {/* Calculate Unread Logic for Badge */}
      {(() => {
         const myTourIds = tours.filter(t => {
            if (user?.role === 'expert') return (t.guideName === user?.name) || (t.expert?.name === user?.name);
            if (user?.role === 'customer') return t.participants?.some(p => p.id === user?.id || p.email === user?.email);
            if (user?.role === 'ticketing' || user?.role === 'admin') return true;
            return true;
         }).map(t => t.id);
         
         const myUnreadCount = notifications
            .filter(n => !n.tourId || myTourIds.includes(n.tourId))
            .filter(n => !(n.deletedBy || []).includes(user?.email || 'mock_user'))
            .filter(n => !n.readBy.includes(user?.email || 'mock_user'))
            .length;

         return (
            <nav className="bottom-nav">
              <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                <Home size={22} />
                <span style={{ fontSize: '10px' }}>Ana Sayfa</span>
              </Link>
              <Link to="/dashboard/chat" className={`nav-item ${location.pathname === '/dashboard/chat' ? 'active' : ''}`}>
                <MessageCircle size={22} />
                <span style={{ fontSize: '10px' }}>Mesajlar</span>
              </Link>
              <Link to="/dashboard/notifications" className={`nav-item ${location.pathname === '/dashboard/notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                   <Bell size={22} />
                   {myUnreadCount > 0 && (
                      <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%', border: '2px solid white' }}></div>
                   )}
                </div>
                <span style={{ fontSize: '10px' }}>Bildirim</span>
              </Link>
              <Link to="/dashboard/currency" className={`nav-item ${location.pathname === '/dashboard/currency' ? 'active' : ''}`}>
                <Banknote size={22} />
                <span style={{ fontSize: '10px' }}>Kur</span>
              </Link>
              <Link to="/dashboard/profile" className={`nav-item ${location.pathname === '/dashboard/profile' ? 'active' : ''}`}>
                <User size={22} />
                <span style={{ fontSize: '10px' }}>Hesabım</span>
              </Link>
            </nav>
         );
      })()}
    </>
  );
}
