import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { Mail, KeyRound, EyeOff, Eye, User, Loader2, Check, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const login = useAuthStore(state => state.login);
  const { corporateLogo, corporateName, isFirebaseInitialized } = useSettingsStore();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email || !password) return;
    
    const res = login(email, password);
    if (res && !res.success) {
        setError(res.message);
        return;
    }
    
    navigate('/dashboard');
  };

  const handleForgotPassword = async () => {
      setError(''); setSuccessMsg('');
      if (!email || !email.includes('@')) {
          setError('Lütfen geçerli bir e-posta adresi girin.');
          return;
      }
      
      const userRecord = useUserStore.getState().findUserByEmail(email);
      if (!userRecord) {
          setError('Sistemde bu e-postaya ait hesap bulunamadı.');
          return;
      }
      
      const smtp = useSettingsStore.getState().smtpConfig;
      if (!smtp?.host || !smtp?.user || smtp.host.length < 3) {
          setError('E-Posta sunucusu (SMTP) kapalı. Yöneticinize başvurun.');
          return;
      }

      setIsSending(true);
      try {
          const res = await fetch('https://move-yanimda.web.app/api/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  host: smtp.host, port: smtp.port, user: smtp.user, pass: smtp.pass,
                  to: email, corporateName: corporateName,
                  accountName: userRecord.name, accountPassword: userRecord.password
              })
          });
          const data = await res.json();
          if (!res.ok) {
              setError(data.message || 'Gönderim sırasında hata oluştu.');
          } else {
              setSuccessMsg(`✅ Şifreniz e-posta adresinize iletildi.`);
          }
      } catch (err) {
          setError('Kritik Hata: Bulut sunucusuna (Firebase Functions) ulaşılamadı. Lütfen sunucunun (deploy) yayınlandığından emin olun.');
      } finally {
          setIsSending(false);
      }
  };

  return (
    <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', 'Quicksand', sans-serif",
        display: 'flex',
        flexDirection: 'column',
    }}>
        {/* Header Section with Wave (approx 45% height) */}
        <div style={{
            position: 'relative',
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '45vh',
            paddingTop: '60px',
            paddingBottom: '120px',
            overflow: 'hidden'
        }}>
           
           <video 
              autoPlay 
              loop 
              muted 
              playsInline
              preload="auto"
              poster="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1200"
              style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  objectFit: 'cover',
                  opacity: 0.35,
                  zIndex: 1,
                  pointerEvents: 'none'
              }}
           >
              <source src="https://www.pexels.com/download/video/35827974/" type="video/mp4" />
           </video>

           <div style={{ zIndex: 10, textAlign: 'center', position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', padding: '0 20px', minHeight: '64px', transition: 'opacity 0.3s' }}>
             {!isFirebaseInitialized ? (
                 <div style={{ opacity: 0 }}>...</div>
             ) : corporateLogo ? (
                 <img src={corporateLogo} alt="Corporate Logo" style={{ width: '140px', maxWidth: '70%', height: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1) drop-shadow(0px 4px 6px rgba(0,0,0,0.4))', animation: 'fadeIn 0.5s' }} />
             ) : (
                 <div style={{ 
                     width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                     borderRadius: '16px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     border: '1px solid rgba(255,255,255,0.5)', animation: 'fadeIn 0.5s'
                 }}>
                     <User size={32} color="white" />
                 </div>
             )}
           </div>

           {/* White SVG Wave Transition at the bottom of the header */}
           <svg 
              viewBox="0 0 1440 320" 
              xmlns="http://www.w3.org/2000/svg" 
              style={{
                  position: 'absolute',
                  bottom: -1, 
                  left: 0,
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  zIndex: 2
              }}
           >
              <path fill="#ffffff" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,197.3C672,224,768,224,864,208C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
        </div>

        {/* Form Container */}
        <div style={{
            flex: 1,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 24px 60px'
        }}>
            <div style={{ width: '100%', maxWidth: '400px', zIndex: 10 }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                    Giriş Yap
                </h1>
                <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 32px 0' }}>
                    Sisteme erişmek için devam edin.
                </p>

                {error && (
                    <div style={{ padding: '12px', marginBottom: '24px', color: '#ef4444', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4' }}>
                        <div style={{ width: '4px', height: '16px', background: '#ef4444', borderRadius: '4px', marginTop: '2px', flexShrink: 0 }}></div>
                        <span style={{ flex: 1 }}>{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '12px', marginBottom: '24px', color: '#166534', background: '#dcfce7', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', lineHeight: '1.4', textAlign: 'center', justifyContent: 'center' }}>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Minimalist Email Field */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            E-Posta
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', transition: 'border-color 0.2s' }}>
                            <Mail size={20} color="#9ca3af" style={{ marginRight: '12px', flexShrink: 0 }} />
                            <input 
                                type="email" 
                                placeholder="demo@sirket.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{
                                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                                    fontSize: '16px', color: '#1f2937', fontWeight: '500'
                                }}
                                onFocus={(e) => { e.target.parentElement.style.borderColor = 'var(--primary)'; e.target.previousElementSibling.style.color = 'var(--primary)'; }}
                                onBlur={(e) => { e.target.parentElement.style.borderColor = '#e5e7eb'; e.target.previousElementSibling.style.color = '#9ca3af'; }}
                            />
                        </div>
                    </div>

                    {/* Minimalist Password Field */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Şifre
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', transition: 'border-color 0.2s' }}>
                            <KeyRound size={20} color="#9ca3af" style={{ marginRight: '12px', flexShrink: 0 }} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="şifrenizi girin"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{
                                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                                    fontSize: '16px', color: '#1f2937', fontWeight: '500', paddingRight: '30px'
                                }}
                                onFocus={(e) => { e.target.parentElement.style.borderColor = 'var(--primary)'; e.target.previousElementSibling.style.color = 'var(--primary)'; }}
                                onBlur={(e) => { e.target.parentElement.style.borderColor = '#e5e7eb'; e.target.previousElementSibling.style.color = '#9ca3af'; }}
                            />
                            <div 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '4px', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </div>
                        </div>
                    </div>

                    {/* Custom Checkbox and Forgot Password Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div 
                            onClick={() => setRememberMe(!rememberMe)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: rememberMe ? '#1f2937' : '#6b7280', fontWeight: '600', transition: 'color 0.2s' }}
                        >
                            <div style={{
                                width: '18px', height: '18px', borderRadius: '6px', 
                                border: rememberMe ? '2px solid var(--primary)' : '2px solid #cbd5e1',
                                background: rememberMe ? 'var(--primary)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <Check size={12} color="white" style={{ opacity: rememberMe ? 1 : 0, transform: rememberMe ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }} strokeWidth={4} />
                            </div>
                            Beni Hatırla
                        </div>
                        <span 
                            onClick={handleForgotPassword}
                            style={{ fontSize: '13px', fontWeight: '600', color: isSending ? '#9ca3af' : 'var(--primary)', cursor: isSending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isSending && <Loader2 size={14} style={{ animation: 'spin 2s linear infinite' }} />}
                            Şifremi Unuttum?
                        </span>
                    </div>

                    {/* Premium Animated Button */}
                    <button 
                        type="submit" 
                        style={{
                            width: '100%', padding: '14px', fontSize: '15px', fontWeight: '800', color: 'white',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #a2105c 100%)',
                            border: 'none', borderRadius: '50px', cursor: 'pointer',
                            marginTop: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 8px 24px rgba(215, 20, 122, 0.3)'
                        }}
                        onMouseEnter={(e) => { 
                            e.currentTarget.style.transform = 'translateY(-2px)'; 
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(215, 20, 122, 0.4)';
                            if(e.currentTarget.lastChild) e.currentTarget.lastChild.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => { 
                            e.currentTarget.style.transform = 'translateY(0)'; 
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(215, 20, 122, 0.3)';
                            if(e.currentTarget.lastChild) e.currentTarget.lastChild.style.transform = 'translateX(0)';
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                    >
                        Giriş Yap
                        <ArrowRight size={18} strokeWidth={2.5} style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    </button>
                </form>

            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '10px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: '500', width: '100%', letterSpacing: '0.5px' }}>
                Made By <span style={{ color: '#e11d48', fontSize: '12px', margin: '0 2px', display: 'inline-block', animation: 'pulse 2s infinite' }}>❤️</span> Upix
            </div>
        </div>
    </div>
  );
}
