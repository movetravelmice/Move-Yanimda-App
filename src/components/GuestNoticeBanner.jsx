import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function GuestNoticeBanner({ 
  feature = 'default',
  customTitle,
  customMessage 
}) {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  // If user is already logged in, do not render this warning banner
  if (user) return null;

  return (
    <div style={{
      background: '#ffffff',
      border: '1.2px solid #F9BED8',
      borderRadius: '16px',
      padding: '10px 12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      boxShadow: '0 2px 10px rgba(215, 20, 122, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: '#FDF2F8',
          color: '#D7147A',
          border: '1px solid #FCE7F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Sparkles size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.2px',
            lineHeight: 1.3
          }}>
            {customTitle || 'Kayıt Edilebilmesi İçin Giriş Gerekli'}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            marginTop: '2px',
            lineHeight: 1.35
          }}>
            {customMessage || 'İşlemlerinizin kalıcı olarak kaydedilmesi ve tüm cihazlarınızda saklanması için lütfen giriş yapın.'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/login')}
        title="Giriş Yap"
        aria-label="Giriş Yap"
        style={{
          width: '42px',
          height: '42px',
          background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
          transition: 'transform 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <LogIn size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}
