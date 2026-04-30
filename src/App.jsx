import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { useSettingsStore } from './store/settingsStore';
import { useTourStore } from './store/tourStore';
import { useUserStore } from './store/userStore';
import { useChatStore } from './store/chatStore';
import { useNotificationStore } from './store/notificationStore';

function App() {
  const corporateName = useSettingsStore(state => state.corporateName);
  const deleteTour = useTourStore(state => state.deleteTour);
  const initFirestoreTours = useTourStore(state => state.initFirestoreTours);
  const initFirestoreUsers = useUserStore(state => state.initFirestoreUsers);
  const initFirestoreChats = useChatStore(state => state.initFirestoreChats);
  const initFirestoreNotifications = useNotificationStore(state => state.initFirestoreNotifications);
  const initFirestoreSettings = useSettingsStore(state => state.initFirestoreSettings);

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

  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/*" element={<DashboardLayout />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
