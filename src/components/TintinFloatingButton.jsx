import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';

export default function TintinFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const activeMode = useAuthStore(state => state.activeMode);
  const geminiConfig = useSettingsStore(state => state.geminiConfig);
  const [isHovered, setIsHovered] = useState(false);

  // If Tintin is disabled in admin settings, do not show
  if (geminiConfig?.isEnabled === false) {
    return null;
  }

  // If already on Tintin chat page, hide the floating button
  if (location.pathname.includes('/tintin')) {
    return null;
  }

  // Hide inside active 1-on-1 chat room to avoid covering input controls
  if (location.pathname.startsWith('/dashboard/chat/') && location.pathname !== '/dashboard/chat') {
    return null;
  }
  if (location.pathname.startsWith('/individual/chat/') && location.pathname !== '/individual/chat') {
    return null;
  }

  const handleClick = () => {
    if (activeMode === 'individual' || (!activeMode && (user?.userType === 'individual' || user?.role === 'customer'))) {
      navigate('/tintin');
    } else if (user && ['admin', 'expert', 'ticketing'].includes(user?.role)) {
      navigate('/dashboard/tintin');
    } else {
      navigate('/tintin');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(86px + env(safe-area-inset-bottom, 0px))',
        right: 'max(16px, calc(50% - 224px))',
        zIndex: 990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
      }}
    >
      {/* Floating Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Tintin AI Seyahat Asistanı"
        title="Tintin AI Seyahat Asistanı"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '2px solid #ffffff',
          outline: 'none',
          padding: 0,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #D7147A 0%, #ff8c38 100%)',
          boxShadow: isHovered
            ? '0 8px 24px rgba(255, 107, 0, 0.5), 0 0 0 4px rgba(255, 107, 0, 0.25)'
            : '0 6px 18px rgba(255, 107, 0, 0.4)',
          transform: isHovered ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        {/* Avatar Image */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
          }}
        >
          <img
            src="/tintin-avatar.png"
            alt="Tintin AI"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.style.background = 'linear-gradient(135deg, #D7147A, #ff8c38)';
            }}
          />
        </div>

        {/* AI Sparkle Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'linear-gradient(135deg, #D7147A, #D7147A)',
            border: '2px solid #ffffff',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          <Sparkles size={10} strokeWidth={2.5} />
        </div>

        {/* Online Indicator Pulse */}
        <div
          style={{
            position: 'absolute',
            bottom: '1px',
            right: '1px',
            width: '11px',
            height: '11px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            border: '2px solid #ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </button>
    </div>
  );
}
