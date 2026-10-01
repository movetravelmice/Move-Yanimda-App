import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { useSettingsStore } from './store/settingsStore';
import { useTourStore } from './store/tourStore';
import { useUserStore } from './store/userStore';
import { useChatStore } from './store/chatStore';
import { useNotificationStore } from './store/notificationStore';
import { useAuthStore } from './store/authStore';

import WelcomeLanding from './pages/Public/WelcomeLanding';
import RegisterIndividual from './pages/Public/RegisterIndividual';
import PublicTranslator from './pages/Public/PublicTranslator';
import PublicTools from './pages/Public/PublicTools';
import BudgetInviteAccept from './pages/Individual/BudgetInviteAccept';
import IndividualLayout from './pages/Individual/IndividualLayout';
import AppBottomNav from './components/AppBottomNav';
import TintinFloatingButton from './components/TintinFloatingButton';
import TintinChat from './pages/Customer/TintinChat';
import CityGuidePage from './pages/Public/CityGuidePage';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import NotificationBanner from './components/NotificationBanner';
import { useDeviceNotifications } from './hooks/useDeviceNotifications';

function GlobalDeviceNotificationListener() {
  useDeviceNotifications();
  return null;
}

function App() {
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const corporateName = useSettingsStore(state => state.corporateName);
  const deleteTour = useTourStore(state => state.deleteTour);
  const initFirestoreTours = useTourStore(state => state.initFirestoreTours);
  const initFirestoreUsers = useUserStore(state => state.initFirestoreUsers);
  const initFirestoreChats = useChatStore(state => state.initFirestoreChats);
  const initFirestoreNotifications = useNotificationStore(state => state.initFirestoreNotifications);
  const initFirestoreSettings = useSettingsStore(state => state.initFirestoreSettings);

  const tours = useTourStore(state => state.tours);
  const users = useUserStore(state => state.users);
  const checkAndSendFlightReminders = useTourStore(state => state.checkAndSendFlightReminders);
  const checkAndSendTourReviewReminders = useTourStore(state => state.checkAndSendTourReviewReminders);
  const sendWhatsAppNotification = useSettingsStore(state => state.sendWhatsAppNotification);
  const whatsappConfig = useSettingsStore(state => state.whatsappConfig);

  useEffect(() => {
    document.title = `${corporateName || 'Move Yanımda'} - Seyahat Yönetimi`;
    
    // Geçmiş prototip verilerini temizle
    deleteTour('tour_avrupa_ruyasi');

    // Initialize Firebase Database streams
    initFirestoreUsers();
    initFirestoreTours();
    initFirestoreChats();
    initFirestoreNotifications();
    initFirestoreSettings();
  }, [corporateName, deleteTour, initFirestoreUsers, initFirestoreTours, initFirestoreChats, initFirestoreNotifications, initFirestoreSettings]);

  useEffect(() => {
    if (tours.length > 0 && users.length > 0 && whatsappConfig?.isEnabled) {
      if (checkAndSendFlightReminders) {
        checkAndSendFlightReminders(users, whatsappConfig, sendWhatsAppNotification);
      }
      if (checkAndSendTourReviewReminders) {
        checkAndSendTourReviewReminders(users, whatsappConfig, sendWhatsAppNotification);
      }
      
      const interval = setInterval(() => {
        if (checkAndSendFlightReminders) {
          checkAndSendFlightReminders(users, whatsappConfig, sendWhatsAppNotification);
        }
        if (checkAndSendTourReviewReminders) {
          checkAndSendTourReviewReminders(users, whatsappConfig, sendWhatsAppNotification);
        }
      }, 10 * 60 * 1000); // 10 mins
      
      return () => clearInterval(interval);
    }
  }, [tours, users, checkAndSendFlightReminders, checkAndSendTourReviewReminders, whatsappConfig, sendWhatsAppNotification]);

  const getRootRedirect = () => {
    if (!user) return <WelcomeLanding />;
    if (activeMode === 'individual' || (!activeMode && (user.userType === 'individual' || user.role === 'customer'))) {
      return <Navigate to="/individual/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <BrowserRouter>
      <GlobalDeviceNotificationListener />
      <div className="container">
        <Routes>
          {/* Public & Landing Routes */}
          <Route path="/" element={getRootRedirect()} />
          <Route path="/welcome" element={<WelcomeLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterIndividual />} />
          <Route path="/city-guide" element={<CityGuidePage />} />
          <Route path="/city-guide/:cityId" element={<CityGuidePage />} />
          <Route path="/sehir-rehberi" element={<Navigate to="/city-guide" replace />} />
          {/* Direct Tool Routes */}
          <Route path="/translator" element={<Navigate to="/travel-tools?tab=translator" replace />} />
          <Route path="/travel-translator" element={<Navigate to="/travel-tools?tab=translator" replace />} />
          <Route path="/socket-guide" element={<Navigate to="/travel-tools?tab=socket" replace />} />
          <Route path="/travel-tools/socket" element={<Navigate to="/travel-tools?tab=socket" replace />} />
          <Route path="/tax-free" element={<Navigate to="/travel-tools?tab=taxfree" replace />} />
          <Route path="/travel-tools/taxfree" element={<Navigate to="/travel-tools?tab=taxfree" replace />} />
          <Route path="/emergency" element={<Navigate to="/travel-tools?tab=emergency" replace />} />
          <Route path="/travel-tools/emergency" element={<Navigate to="/travel-tools?tab=emergency" replace />} />
          <Route path="/ne-giyilir" element={<Navigate to="/travel-tools?tab=outfit" replace />} />
          <Route path="/giyim-rehberi" element={<Navigate to="/travel-tools?tab=outfit" replace />} />
          <Route path="/travel-tools/outfit" element={<Navigate to="/travel-tools?tab=outfit" replace />} />
          <Route path="/siren" element={<Navigate to="/travel-tools?tab=siren" replace />} />
          <Route path="/sos" element={<Navigate to="/travel-tools?tab=siren" replace />} />
          <Route path="/travel-tools/siren" element={<Navigate to="/travel-tools?tab=siren" replace />} />
          <Route path="/timezone" element={<Navigate to="/travel-tools?tab=timezone" replace />} />
          <Route path="/time" element={<Navigate to="/travel-tools?tab=timezone" replace />} />
          <Route path="/saat-farki" element={<Navigate to="/travel-tools?tab=timezone" replace />} />
          <Route path="/travel-tools/timezone" element={<Navigate to="/travel-tools?tab=timezone" replace />} />
          <Route path="/distance" element={<Navigate to="/travel-tools?tab=distance" replace />} />
          <Route path="/mesafe" element={<Navigate to="/travel-tools?tab=distance" replace />} />
          <Route path="/rota" element={<Navigate to="/travel-tools?tab=distance" replace />} />
          <Route path="/travel-tools/distance" element={<Navigate to="/travel-tools?tab=distance" replace />} />
          <Route path="/travel-tools" element={<PublicTools />} />
          <Route path="/invite/:token" element={<BudgetInviteAccept />} />

          {/* Individual User Portal */}
          <Route path="/individual/*" element={<IndividualLayout />} />

          {/* Tintin AI Assistant Direct Route */}
          <Route path="/tintin" element={<TintinChat />} />

          {/* Corporate Dashboard Routes (Strictly Isolated & Preserved) */}
          <Route path="/dashboard/*" element={<DashboardLayout />} />
        </Routes>

        {/* Global In-App / OS Notification Permission Prompt */}
        <NotificationBanner />

        {/* Global PWA Install Prompt Banner */}
        <PwaInstallPrompt />

        {/* Global Floating AI Assistant (Tintin) */}
        <TintinFloatingButton />

        {/* Global Signature Floating Bottom Navigation (Corporate, Individual, Public) */}
        <AppBottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
