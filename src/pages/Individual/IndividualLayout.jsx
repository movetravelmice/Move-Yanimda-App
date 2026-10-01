import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Luggage, 
  CheckSquare, 
  Wallet, 
  Languages, 
  Compass, 
  User, 
  LogOut, 
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndividualStore } from '../../store/individualStore';
import IndividualDashboard from './IndividualDashboard';
import Travels from './Travels';
import CreateTravel from './CreateTravel';
import Checklists from './Checklists';
import CreateChecklist from './CreateChecklist';
import AiPackingAssistant from './AiPackingAssistant';
import Budget from './Budget';
import SharedBudget from './SharedBudget';
import PublicTranslator from '../Public/PublicTranslator';
import PublicTools from '../Public/PublicTools';
import ProfileSettings from '../ProfileSettings';
import Notifications from '../Notifications';
import TintinChat from '../Customer/TintinChat';
import TintinFloatingButton from '../../components/TintinFloatingButton';
import Header from '../../components/Header';

export default function IndividualLayout() {
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const setActiveMode = useAuthStore(state => state.setActiveMode);
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const initUserStreams = useIndividualStore(state => state.initUserStreams);
  const clearStreams = useIndividualStore(state => state.clearStreams);

  useEffect(() => {
    if (user && activeMode !== 'individual') {
      setActiveMode('individual');
    }
  }, [user, activeMode, setActiveMode]);

  useEffect(() => {
    if (user?.id) {
      initUserStreams(user.id, user.email);
    }
    return () => {
      clearStreams();
    };
  }, [user?.id, user?.email]);

  // Check if this user is a corporate user bridging to individual space
  const isCorporateUser = user && (user.userType === 'corporate' || (user.role && ['admin', 'expert', 'ticketing'].includes(user.role)) || (user.company && user.company !== 'Bireysel'));

  const isTintin = location.pathname.includes('/tintin');

  return (
    <div style={{
      minHeight: isTintin ? '100dvh' : '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Header - Unified Corporate Design (Do not render on Tintin) */}
      {!isTintin && (
        <Header 
          title={location.pathname.includes('/profile') ? "Hesap Ayarları" : undefined} 
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: isTintin ? '0px' : '90px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<IndividualDashboard />} />
          <Route path="travels" element={<Travels />} />
          <Route path="travels/new" element={<CreateTravel />} />
          <Route path="travels/edit/:id" element={<CreateTravel />} />
          <Route path="checklists" element={<Checklists />} />
          <Route path="checklists/new" element={<CreateChecklist />} />
          <Route path="checklists/ai" element={<AiPackingAssistant />} />
          <Route path="budget" element={<Budget />} />
          <Route path="budget/shared" element={<SharedBudget />} />
          <Route path="translator" element={<PublicTranslator isEmbedded />} />
          <Route path="tools" element={<PublicTools isEmbedded />} />
          <Route path="tintin" element={<Navigate to="/tintin" replace />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={user ? <ProfileSettings hideHeader /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
