import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { Camera, UserCog, LogOut } from 'lucide-react';

export default function Header({ title }) {
  const user = useAuthStore(state => state.user);
  const [greeting, setGöreeting] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGöreeting('Günaydın');
    else if (hour >= 12 && hour < 18) setGöreeting('İyi Günler');
    else if (hour >= 18 && hour < 22) setGöreeting('İyi Akşamlar');
    else setGöreeting('İyi Geceler');

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          useAuthStore.getState().updateProfile({ avatar: dataUrl });
          
          setShowMenu(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const formatName = (name) => {
    if (!name) return 'Misafir';
    let cleanName = name.replace('.', ' ');
    return cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const displayName = user ? formatName(user.name) : 'Misafir';
  
  const expertStatus = useSettingsStore(state => state.expertStatus);
  const setExpertStatus = useSettingsStore(state => state.setExpertStatus);

  const toggleStatus = (e) => {
     e.stopPropagation();
     if (expertStatus === 'offline') setExpertStatus('online');
     else if (expertStatus === 'online') setExpertStatus('busy');
     else setExpertStatus('offline');
  };
  
  const getStatusColor = () => {
     if (expertStatus === 'online') return '#10B981';
     if (expertStatus === 'busy') return '#FACC15';
     return '#9CA3AF';
  };
  
  const getAvatarUrl = () => {
     if (user?.avatar) return user.avatar;
     return `https://ui-avatars.com/api/?name=${displayName}&background=random&color=fff&bold=true`;
  };

  return (
    <div className="top-header" style={{ position: 'relative', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', lineHeight: '1.3' }}>
            <span style={{ display: 'block', fontSize: '12px', opacity: 0.9, fontWeight: 'normal', marginBottom: '2px' }}>{greeting},</span>
            {displayName}
        </h2>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', display: 'block' }}>{title}</span>
      </div>
      
      <div ref={menuRef} style={{ position: 'relative' }}>
        
        {user?.role === 'expert' && (
           <div 
             onClick={toggleStatus}
             title={`Durum: ${expertStatus === 'online' ? 'Çevrimiçi' : expertStatus === 'busy' ? 'Meşgul' : 'Çevrimdışı'}`}
             style={{
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                zIndex: 10,
                width: '16px', height: '16px', borderRadius: '50%', cursor: 'pointer',
                backgroundColor: getStatusColor(),
                border: '2px solid var(--primary)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'background-color 0.2s', flexShrink: 0
             }}
           />
        )}

        <div 
          onClick={() => setShowMenu(!showMenu)}
          style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
        >
          <img loading="lazy" src={getAvatarUrl()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {showMenu && (
          <div style={{ position: 'absolute', top: '56px', right: '0', background: 'var(--surface)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '260px', overflow: 'hidden', zIndex: 100, border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', background: '#fafafa' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{displayName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email || 'demo@kullanici.com'}</div>
            </div>
            <div style={{ padding: '8px' }}>
              
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{display: 'none'}} accept="image/*" />
              
              <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex-row text-muted" style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', transition: 'background 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Camera size={16} className="text-primary" /> <span style={{color: 'var(--text-main)'}}>Profil Fotoğrafını güncelle</span>
              </div>
              
              <div 
                   onClick={() => { setShowMenu(false); navigate('/dashboard/profile'); }}
                   className="flex-row text-muted" style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', transition: 'background 0.2s', marginTop: '4px' }}
                   onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <UserCog size={16} className="text-primary" /> <span style={{color: 'var(--text-main)'}}>Profilini güncelle</span>
              </div>
              
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
              
              <div 
                onClick={() => useAuthStore.getState().logout()}
                className="flex-row text-muted" 
                style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', transition: 'background 0.2s', marginTop: '4px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'inherit'; }}
              >
                <LogOut size={16} /> <span style={{fontWeight: '600', color: '#ef4444'}}>Çıkış Yap</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
