import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { 
  Mail, 
  KeyRound, 
  EyeOff, 
  Eye, 
  User, 
  Loader2, 
  ArrowRight, 
  ChevronLeft, 
  ShieldCheck, 
  X,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const login = useAuthStore(state => state.login);
  const user = useAuthStore(state => state.user);
  const { corporateLogo, corporateName, isFirebaseInitialized } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.userType === 'individual' || user.role === 'customer') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setError('');
    setSuccessMsg('');
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) return;
    
    setIsLoggingIn(true);
    try {
        const res = await login(cleanEmail, cleanPassword);
        if (res && !res.success) {
            setError(res.message);
            return;
        }
        const loggedUser = useAuthStore.getState().user;
        if (loggedUser?.userType === 'individual' || loggedUser?.role === 'customer') {
          navigate('/individual/dashboard');
        } else {
          navigate('/dashboard');
        }
    } catch (err) {
        setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
      setError(''); setSuccessMsg('');
      const cleanEmail = email.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
          setError('Lütfen geçerli bir e-posta adresi girin.');
          return;
      }
      
      const userRecord = useUserStore.getState().findUserByEmail(cleanEmail);
      if (!userRecord) {
          setError('Sistemde bu e-postaya ait hesap bulunamadı.');
          return;
      }

      if (userRecord.isChildProfile === true || (userRecord.email && (userRecord.email.startsWith('child_') || userRecord.email.endsWith('.local') || userRecord.email.includes('@move.local')))) {
          setError('Çocuk hesapları ebeveyn kontrolündedir ve e-posta alamaz. Lütfen ebeveyn hesabınızla giriş yapınız.');
          return;
      }
      
      const smtp = useSettingsStore.getState().smtpConfig;
      if (!smtp?.host || !smtp?.user || smtp.host.length < 3) {
          setError('E-Posta sunucusu (SMTP) yapılandırılmamış. Yöneticinize başvurun.');
          return;
      }

      setIsSending(true);
      try {
          let customSubject = null;
          let customHtml = null;
          try {
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('../lib/firebase');
              const docRef = doc(db, 'email_templates', 'forgot_password');
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  customSubject = docSnap.data().subject;
                  customHtml = docSnap.data().body;
              }
          } catch (e) {
              console.error("Forgot password template load error:", e);
          }

          const res = await fetch('https://move-yanimda.web.app/api/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  host: smtp.host, port: smtp.port, user: smtp.user, pass: smtp.pass,
                  to: email, corporateName: corporateName,
                  accountName: userRecord.name, accountPassword: userRecord.password,
                  customSubject, customHtml
              })
          });
          const data = await res.json();
          if (!res.ok) {
              setError(data.message || 'Gönderim sırasında hata oluştu.');
          } else {
              setSuccessMsg(`✅ Şifreniz e-posta adresinize iletildi.`);
              if (userRecord.phone && userRecord.phone !== '-') {
                  useSettingsStore.getState().sendWhatsAppNotification(
                      userRecord.phone,
                      'passwordResetTemplate',
                      [String(userRecord.password || '123456')]
                  );
              }
          }
      } catch (err) {
          setError('Kritik Hata: Bulut sunucusuna (Firebase Functions) ulaşılamadı. Lütfen sunucunun (deploy) yayınlandığından emin olun.');
      } finally {
          setIsSending(false);
      }
  };

  return (
    <div style={{
        height: 'calc(100dvh - 95px - env(safe-area-inset-bottom, 0px))',
        minHeight: 'calc(100dvh - 95px - env(safe-area-inset-bottom, 0px))',
        maxHeight: 'calc(100dvh - 95px - env(safe-area-inset-bottom, 0px))',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowY: 'auto',
        overscrollBehavior: 'none',
        boxSizing: 'border-box'
    }}>
        {/* Top Hero Banner */}
        <div style={{
            position: 'relative',
            background: 'linear-gradient(145deg, #090d16 0%, #0f172a 55%, #1e293b 100%)',
            height: 'clamp(240px, 28vh, 270px)',
            minHeight: '240px',
            maxHeight: '270px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 38px',
            overflow: 'hidden',
            boxSizing: 'border-box',
            flexShrink: 0
        }}>
            {/* Background Ambient Glow */}
            <div style={{
                position: 'absolute',
                top: '-30%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120%',
                height: '140%',
                background: 'radial-gradient(circle at 50% 30%, rgba(215, 20, 122, 0.18) 0%, rgba(15, 23, 42, 0) 65%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />

            {/* Background Video with refined overlay */}
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              preload="auto"
              poster="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1200"
              style={{
                  position: 'absolute',
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.18,
                  zIndex: 0,
                  pointerEvents: 'none',
                  mixBlendMode: 'luminosity'
              }}
            >
              <source src="https://www.pexels.com/download/video/35827974/" type="video/mp4" />
            </video>

            {/* Top Left Back Button */}
            <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="Ana Sayfaya Dön"
                style={{
                    position: 'absolute',
                    top: 'calc(16px + env(safe-area-inset-top, 0px))',
                    left: '16px',
                    zIndex: 30,
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Centered Corporate Logo & Brand Identity */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '4px 0'
            }}>
                {!isFirebaseInitialized ? (
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center' }}>
                        <Loader2 size={24} color="#D7147A" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : corporateLogo ? (
                    <img 
                        src={corporateLogo} 
                        alt={corporateName || "Corporate Logo"} 
                        style={{ 
                            maxHeight: '94px', 
                            maxWidth: '260px', 
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain', 
                            filter: 'brightness(0) invert(1) drop-shadow(0px 4px 14px rgba(0,0,0,0.65))',
                            animation: 'fadeIn 0.4s ease'
                        }} 
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '13px',
                            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(215, 20, 122, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <Compass size={24} color="#ffffff" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '19px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                                {corporateName || 'Move Yanımda'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
                                Seyahat Portalı
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Subtle bottom curved gradient divider */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '18px',
                background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.4))',
                pointerEvents: 'none'
            }} />
        </div>

        {/* Main Card Container */}
        <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 16px 14px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                padding: '20px 18px 16px',
                marginTop: '-18px',
                position: 'relative',
                zIndex: 20,
                boxSizing: 'border-box'
            }}>
                {/* Title & Subtitle */}
                <div style={{ marginBottom: '17px' }}>
                    <h1 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#0f172a',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.2
                    }}>
                        Giriş Yap
                    </h1>
                    <p style={{
                        fontSize: '12px',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: 1.45
                    }}>
                        Seyahatlerinizi yönetmek için hesabınıza erişin.
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        padding: '11px 13px',
                        marginBottom: '18px',
                        color: '#b91c1c',
                        background: '#fef2f2',
                        borderRadius: '12px',
                        border: '1px solid #fee2e2',
                        fontSize: '12.5px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '9px',
                        lineHeight: '1.45',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <AlertCircle size={17} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ flex: 1 }}>{error}</span>
                    </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                    <div style={{
                        padding: '11px 13px',
                        marginBottom: '18px',
                        color: '#166534',
                        background: '#f0fdf4',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        border: '1px solid #bbf7d0',
                        lineHeight: '1.45',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                    
                    {/* Email / Phone Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#334155',
                            marginBottom: '4px',
                            letterSpacing: '-0.1px'
                        }}>
                            E-Posta veya Telefon
                        </label>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: emailFocused ? '#ffffff' : '#f8fafc',
                            border: `1.5px solid ${emailFocused ? '#D7147A' : '#e2e8f0'}`,
                            borderRadius: '11px',
                            padding: '0 12px',
                            height: '40px',
                            boxShadow: emailFocused ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                        }}>
                            <Mail 
                                size={16} 
                                color={emailFocused ? '#D7147A' : '#94a3b8'} 
                                style={{ marginRight: '9px', flexShrink: 0, transition: 'color 0.2s' }} 
                            />
                            <input 
                                type="text" 
                                placeholder="E-posta veya telefon"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                required
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: '12.5px',
                                    color: '#0f172a',
                                    fontWeight: '500',
                                    width: '100%'
                                }}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#334155',
                            marginBottom: '4px',
                            letterSpacing: '-0.1px'
                        }}>
                            Şifre
                        </label>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: passFocused ? '#ffffff' : '#f8fafc',
                            border: `1.5px solid ${passFocused ? '#D7147A' : '#e2e8f0'}`,
                            borderRadius: '11px',
                            padding: '0 12px',
                            height: '40px',
                            boxShadow: passFocused ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                        }}>
                            <KeyRound 
                                size={16} 
                                color={passFocused ? '#D7147A' : '#94a3b8'} 
                                style={{ marginRight: '9px', flexShrink: 0, transition: 'color 0.2s' }} 
                            />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setPassFocused(true)}
                                onBlur={() => setPassFocused(false)}
                                required
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: '12.5px',
                                    color: '#0f172a',
                                    fontWeight: '500',
                                    paddingRight: '26px',
                                    width: '100%'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '3px',
                                    borderRadius: '6px',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#334155'}
                                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                            >
                                {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '2px',
                        userSelect: 'none'
                    }}>
                        <div 
                            onClick={() => setRememberMe(!rememberMe)}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '7px', 
                                cursor: 'pointer',
                                padding: '2px 0'
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '16px',
                                borderRadius: '10px',
                                background: rememberMe ? '#D7147A' : '#e2e8f0',
                                padding: '1.5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: rememberMe ? 'flex-end' : 'flex-start',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: rememberMe ? '0 2px 6px rgba(215, 20, 122, 0.3)' : 'none'
                            }}>
                                <div style={{
                                    width: '13px',
                                    height: '13px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    transition: 'transform 0.2s ease'
                                }} />
                            </div>
                            <span style={{ 
                                fontSize: '11px', 
                                color: rememberMe ? '#0f172a' : '#64748b', 
                                fontWeight: rememberMe ? '600' : '500', 
                                transition: 'color 0.2s' 
                            }}>
                                Beni Hatırla
                            </span>
                        </div>

                        <span 
                            onClick={handleForgotPassword}
                            style={{ 
                                fontSize: '11px', 
                                fontWeight: '600', 
                                color: isSending ? '#94a3b8' : '#D7147A', 
                                cursor: isSending ? 'wait' : 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={e => !isSending && (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => !isSending && (e.currentTarget.style.textDecoration = 'none')}
                        >
                            {isSending && <Loader2 size={12} style={{ animation: 'spin 1.5s linear infinite' }} />}
                            Şifremi Unuttum?
                        </span>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isLoggingIn}
                        style={{
                            width: '100%',
                            height: '38px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            color: 'white',
                            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                            border: 'none',
                            borderRadius: '9px',
                            cursor: isLoggingIn ? 'wait' : 'pointer',
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
                            opacity: isLoggingIn ? 0.75 : 1
                        }}
                        onMouseEnter={(e) => { 
                            if (isLoggingIn) return;
                            e.currentTarget.style.transform = 'translateY(-1px)'; 
                            e.currentTarget.style.boxShadow = '0 5px 14px rgba(215, 20, 122, 0.35)';
                        }}
                        onMouseLeave={(e) => { 
                            if (isLoggingIn) return;
                            e.currentTarget.style.transform = 'translateY(0)'; 
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122, 0.25)';
                        }}
                        onMouseDown={(e) => {
                            if (isLoggingIn) return;
                            e.currentTarget.style.transform = 'translateY(0.5px)';
                        }}
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader2 size={15} style={{ animation: 'spin 1s infinite linear' }} />
                                <span>Giriş Yapılıyor...</span>
                            </>
                        ) : (
                            <>
                                <span>Giriş Yap</span>
                                <ArrowRight size={14} strokeWidth={2} />
                            </>
                        )}
                    </button>

                    {/* KVKK Legal Notice - Centered between button and divider */}
                    <div style={{
                        textAlign: 'center',
                        fontSize: '10px',
                        color: '#94a3b8',
                        lineHeight: 1.45,
                        padding: '0 4px',
                        marginTop: '3px'
                    }}>
                        Giriş yaparak{' '}
                        <span 
                            onClick={() => setShowKvkkModal(true)}
                            style={{
                                color: '#D7147A',
                                opacity: 0.72,
                                fontWeight: '600',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textUnderlineOffset: '2px',
                                transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.72'}
                        >
                            KVKK Koşulları
                        </span>
                        'nı kabul etmiş sayılırsınız.
                    </div>
                </form>

                {/* Don't have an account & Registration Callout */}
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    paddingBottom: '0px',
                    borderTop: '1px solid #f1f5f9',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <span>Hesabınız yok mu?</span>
                        <span 
                            onClick={() => navigate('/register')}
                            style={{ 
                                color: '#D7147A', 
                                fontWeight: '800', 
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                            Ücretsiz Kayıt Ol
                        </span>
                    </div>
                </div>

            </div>

            {/* Separate Card for Made By Astraeus Technology */}
            <div style={{
                width: '100%',
                maxWidth: '420px',
                marginTop: '9px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '12px 14px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                fontSize: '10.5px',
                color: '#64748b',
                boxSizing: 'border-box'
            }}>
                <span>Made By</span>
                <span style={{ color: '#ef4444', fontSize: '11px', display: 'inline-flex' }}>❤️</span>
                <span style={{ fontWeight: '500', color: '#64748b' }}>Astraeus Technology & Upix Media</span>
            </div>
        </div>

        {/* Full Screen KVKK Reader Page Modal */}
        {showKvkkModal && (
            <div style={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '100dvh',
                maxHeight: '100vh',
                zIndex: 2500,
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 35px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: 'white',
                    padding: 'calc(18px + env(safe-area-inset-top, 0px)) 16px 16px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                            onClick={() => setShowKvkkModal(false)} 
                            style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                            <ChevronLeft size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 1px', lineHeight: 1.2 }}>KVKK Aydınlatma Metni</h2>
                            <div style={{ fontSize: '10.5px', opacity: 0.85 }}>Kişisel Verilerin Korunması & Koşulları</div>
                        </div>
                    </div>
                    <div 
                        onClick={() => setShowKvkkModal(false)} 
                        style={{ cursor: 'pointer', padding: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={16} />
                    </div>
                </div>

                {/* Content Body */}
                <div style={{
                    padding: '16px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px',
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    {/* Top Badge Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '14px 14px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                    }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            background: '#FDF2F8',
                            color: '#D7147A',
                            border: '1px solid #FCE7F3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px' }}>
                                6698 Sayılı KVKK Uyarınca Bilgilendirme
                            </h3>
                            <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                                EVOM DANIŞMANLIK VE TUR ORG. TİC. LTD. ŞTİ.
                            </p>
                        </div>
                    </div>

                    {/* Main Text Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '16px 14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                            6698 sayılı “Kişisel Verilerin Korunması Kanunu” gereğince, kişisel verilerimin, özel nitelikli kişisel verilerimin, iletişim bilgilerimin işlenmesine, tarafımca sözlü/yazılı ve/veya elektronik ortamda verilen kimliğimi ve iletişim bilgilerimi belirleyen veya belirlemeye yarayanlar da dahil olmak üzere her türlü kişisel verimin, <b>EVOM DANIŞMANLIK VE TUR ORG. TİC. LTD. ŞTİ.</b> tarafından işlenmesine, ilgili mevzuatlar kapsamında paylaşım gerektiren sponsor şirketler ile ticari amaçla paylaşılmasına; kişisel veriler ve iletişim bilgilerinin 6698 sayılı “Kişisel Verilerin Korunması Kanunu”nda tanımlanan kapsamda aşağıda detayları verilen kişisel ve iletişim verilerin işlenmesine muvafakat ettiğimi kabul, beyan ve taahhüt ederim.
                        </p>

                        {/* Bullet Points */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                <span style={{ color: '#D7147A', fontWeight: 'bold' }}>•</span>
                                <span>
                                    Kimliği belirli veya belirlenebilir bir gerçek kişiye ait olduğu açık olan; kısmen veya tamamen otomatik şekilde veya veri kayıt sisteminin bir parçası olarak otomatik olmayan şekilde işlenen; kişinin kimliğine dair bilgilerin bulunduğu verilerdir; <b>ad-soyad, T.C.Kimlik numarası, uyruk bilgisi, anne adı-baba adı, doğum yeri, doğum tarihi, cinsiyet gibi bilgileri içeren ehliyet, nüfus cüzdanı ve pasaport gibi belgeler ile vergi numarası, SGK numarası, imza bilgisi, taşıt plakası v.b. bilgiler</b>
                                </span>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                <span style={{ color: '#D7147A', fontWeight: 'bold' }}>•</span>
                                <span>
                                    Kimliği belirli veya belirlenebilir bir gerçek kişiye ait olduğu açık olan; kısmen veya tamamen otomatik şekilde veya veri kayıt sisteminin bir parçası olarak otomatik olmayan şekilde işlenen; <b>telefon numarası, adres, e-mail adresi, faks numarası, IP adresi gibi bilgiler</b>
                                </span>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                <span style={{ color: '#D7147A', fontWeight: 'bold' }}>•</span>
                                <span>
                                    Kimliği belirli veya belirlenebilir bir gerçek kişiye ait olduğu açık olan; kısmen veya tamamen otomatik şekilde veya veri kayıt sisteminin bir parçası olarak otomatik olmayan şekilde işlenen; fiziksel mekana (örneğin otel) girişte, fiziksel mekanın içerisinde kalış sırasında alınan kayıtlar ve belgelere ilişkin kişisel veriler; <b>kamera kayıtları, parmak izi kayıtları ve güvenlik noktasında alınan kayıtlar</b>
                                </span>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                <span style={{ color: '#D7147A', fontWeight: 'bold' }}>•</span>
                                <span>
                                    Kimliği belirli veya belirlenebilir bir gerçek kişiye ait olduğu açık olan; <b>fotoğraf ve kamera kayıtları</b> (Fiziksel Mekan Güvenlik Bilgisi kapsamında giren kayıtlar hariç), kişisel veri içeren belgelerin kopyası niteliğindeki belgelerde yer alan veriler
                                </span>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                <span style={{ color: '#D7147A', fontWeight: 'bold' }}>•</span>
                                <span>
                                    Kimliği belirli veya belirlenebilir bir gerçek kişiye ait olduğu açık olan; kısmen veya tamamen otomatik şekilde veya veri kayıt sisteminin bir parçası olarak otomatik olmayan şekilde işlenen; <b>EVOM DANIŞMANLIK VE TUR ORG. TİC. LTD. ŞTİ'ne yöneltilmiş olan her türlü talep veya şikayetin alınması ve değerlendirilmesine ilişkin kişisel veriler</b>
                                </span>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                <span style={{ color: '#D7147A', fontWeight: 'bold' }}>•</span>
                                <span>
                                    Kimliği belirli veya belirlenebilir bir gerçek kişiye ait olduğu açık olan; kısmen veya tamamen otomatik şekilde veya veri kayıt sisteminin bir parçası olarak otomatik olmayan şekilde işlenen; <b>Kişisel Verilerin Korunması Kanunu’nun 6. maddesinde belirtilen veriler (örn. kan grubu da dahil sağlık verileri, biyometrik veriler vb.)</b>
                                </span>
                            </div>
                        </div>

                        <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.6, margin: '4px 0 0' }}>
                            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, kişisel verilerimin ve iletişim bilgilerimin <b>EVOM DANIŞMANLIK VE TUR ORG. TİC. LTD. ŞTİ</b> tarafından yasadaki esaslar çerçevesinde toplanmasına, kaydedilmesine, işlenmesine, saklanmasına ve EVOM DANIŞMANLIK VE TUR ORG. TİC. LTD. ŞTİ. yönetim kurulunun belirlediği sponsor şirketler ve paydaşlar ile ticari amaçla paylaşılmasına peşinen izin verdiğimi kabul, beyan ve taahhüt ederim. Kişisel Verilerin Korunması ve İşlenmesi Hakkında Bilgilendirme metnini ve haklarımı okudum ve kabul ediyorum.
                        </p>
                    </div>

                    {/* Bottom Close Button */}
                    <button
                        type="button"
                        onClick={() => setShowKvkkModal(false)}
                        style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                            color: 'white',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(215, 20, 122, 0.25)',
                            marginTop: '2px'
                        }}
                    >
                        Okudum, Anladım
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}
