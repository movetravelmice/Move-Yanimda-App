import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTourStore } from '../store/tourStore';
import CustomerDashboard from '../pages/Customer/Dashboard';
import { useChatStore } from '../store/chatStore';
import ExpertDashboard from '../pages/Expert/Dashboard';
import AdminDashboard from '../pages/Admin/Dashboard';
import TicketingDashboard from '../pages/Ticketing/Dashboard';
import AdminSettings from '../pages/Admin/Settings';
import PastOperations from '../pages/Admin/PastOperations';
import ActiveOperations from '../pages/Admin/ActiveOperations';
import AdminUsers from '../pages/Admin/Users';
import EmailTemplates from '../pages/Admin/EmailTemplates';
import WhatsAppTemplates from '../pages/Admin/WhatsAppTemplates';
import PopularRoutes from '../pages/Admin/PopularRoutes';
import BroadcastNotification from '../pages/Admin/BroadcastNotification';
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
import PastTours from '../pages/PastTours';
import DestinationGuide from '../pages/Customer/DestinationGuide';
import TourReview from '../pages/Customer/TourReview';
import TintinChat from '../pages/Customer/TintinChat';
import TintinFloatingButton from './TintinFloatingButton';
import CustomerRollCallModal from './CustomerRollCallModal';
import { useNotificationStore } from '../store/notificationStore';
import { useDeviceNotifications } from '../hooks/useDeviceNotifications';
import { Home, MessageCircle, Banknote, User, Bell } from 'lucide-react';

export default function DashboardLayout() {
  useDeviceNotifications(); // Invoke background device notifications hook
  
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const setActiveMode = useAuthStore(state => state.setActiveMode);
  const location = useLocation();

  useEffect(() => {
    if (user && activeMode !== 'corporate') {
      setActiveMode('corporate');
    }
  }, [user, activeMode, setActiveMode]);
  const { notifications } = useNotificationStore();
  const { tours } = useTourStore();
  const messages = useChatStore(state => state.messages);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Strictly block individual users from accessing corporate dashboard routes
  if (user.userType === 'individual') {
    return <Navigate to="/individual/dashboard" replace />;
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
        <Route path="past-tours" element={<PastTours />} />
        <Route path="guide/:tourId" element={<DestinationGuide />} />
        <Route path="review/:tourId" element={<TourReview />} />
        <Route path="tintin" element={<TintinChat />} />
        {/* Admin specific standalone routes */}
        <Route path="admin-active-operations" element={<ActiveOperations />} />
        <Route path="admin-settings" element={<AdminSettings />} />
        <Route path="admin-users" element={<AdminUsers />} />
        <Route path="admin-past-operations" element={<PastOperations />} />
        <Route path="admin-email-templates" element={<EmailTemplates />} />
        <Route path="admin-whatsapp-templates" element={<WhatsAppTemplates />} />
        <Route path="admin-popular-routes" element={<PopularRoutes />} />
        <Route path="popular-routes" element={<PopularRoutes />} />
        <Route path="broadcast" element={<BroadcastNotification />} />
        <Route path="admin-broadcast" element={<BroadcastNotification />} />
        <Route path="push-notifications" element={<BroadcastNotification />} />
      </Routes>
      
      {/* Global Roll Call Modal for active customers */}
      <CustomerRollCallModal />
    </>
  );
}
