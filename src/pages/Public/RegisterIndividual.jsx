import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ChevronLeft, 
  Loader2, 
  ShieldCheck, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useUserStore, formatTitleCase } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function RegisterIndividual() {
  const navigate = useNavigate();
  const { corporateLogo, corporateName } = useSettingsStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeKvkk, setAgreeKvkk] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPass = password.trim();
    const cleanPassConfirm = passwordConfirm.trim();

    if (!cleanFirst || !cleanLast) {
      setError('Lütfen adınızı ve soyadınızı girin.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (cleanPass.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (cleanPass !== cleanPassConfirm) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (!agreeKvkk) {
      setError('Devam etmek için KVKK ve Kullanım Koşullarını onaylamalısınız.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if email already registered in Firestore
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', cleanEmail));
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        setError('Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır. Lütfen giriş yapın.');
        setIsLoading(false);
        return;
      }

      // 2. Generate unique individual user record
      const userId = 'ind_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const fullName = formatTitleCase(`${cleanFirst} ${cleanLast}`);
      const safeName = encodeURIComponent(fullName);
      const avatarUrl = `https://ui-avatars.com/api/?name=${safeName}&background=D7147A&color=fff&bold=true`;

      const newUser = {
        id: userId,
        name: fullName,
        email: cleanEmail,
        phone: cleanPhone || '-',
        password: cleanPass,
        avatar: avatarUrl,
        userType: 'individual',
        role: 'customer',
        company: 'Bireysel',
        status: 'Aktif',
        createdAt: new Date().toISOString()
      };

      // 3. Save to Firestore
      await setDoc(doc(db, 'users', userId), newUser);

      // 4. Update userStore state
      const currentUsers = useUserStore.getState().users;
      useUserStore.setState({ users: [newUser, ...currentUsers] });

      // 5. Authenticate user immediately
      useAuthStore.setState({ user: newUser });

      // 6. Direct to main dashboard
      navigate('/');
    } catch (err) {
      console.error("Bireysel kayıt hatası:", err);
      setError('Kayıt oluşturulurken bir hata oluştu: ' + (err.message || 'Lütfen tekrar deneyin.'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBoxStyle = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: isFocused ? '#ffffff' : '#f8fafc',
      border: `1.5px solid ${isFocused ? '#D7147A' : '#e2e8f0'}`,
      borderRadius: '9px',
      padding: '0 9px',
      height: '35px',
      boxShadow: isFocused ? '0 0 0 3px rgba(215, 20, 122, 0.12)' : 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    };
  };

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '11px',
    color: '#0f172a',
    fontWeight: '500',
    width: '100%'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '2px',
    letterSpacing: '-0.1px'
  };

  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      paddingBottom: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Top Hero Banner - Consistent Corporate Header */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(145deg, #090d16 0%, #0f172a 55%, #1e293b 100%)',
        height: 'clamp(180px, 22vh, 205px)',
        minHeight: '180px',
        maxHeight: '205px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(14px + env(safe-area-inset-top, 0px)) 16px 34px',
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

        {/* Background Video with subtle overlay */}
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
            top: 'calc(14px + env(safe-area-inset-top, 0px))',
            left: '14px',
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

        {/* Top Right "Giriş Yap" Action Button */}
        <Link
          to="/login"
          style={{
            position: 'absolute',
            top: 'calc(14px + env(safe-area-inset-top, 0px))',
            right: '14px',
            zIndex: 30,
            padding: '6px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: '600',
            textDecoration: 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          Giriş Yap
        </Link>

        {/* Centered Corporate Brand Logo */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '6px 0'
        }}>
          {corporateLogo ? (
            <img 
              src={corporateLogo} 
              alt={corporateName || "Corporate Logo"} 
              style={{ 
                maxHeight: '76px', 
                maxWidth: '230px', 
                width: 'auto',
                height: 'auto',
                objectFit: 'contain', 
                filter: 'brightness(0) invert(1) drop-shadow(0px 4px 14px rgba(0,0,0,0.65))',
                animation: 'fadeIn 0.4s ease'
              }} 
            />
          ) : (
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
              {corporateName || 'Move Yanımda'}
            </div>
          )}
        </div>
      </div>

      {/* Main Registration Card Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 16px',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
          padding: '20px 18px 16px',
          marginTop: '-22px',
          position: 'relative',
          zIndex: 20,
          boxSizing: 'border-box'
        }}>
          {/* Title & Subtitle */}
          <div style={{ marginBottom: '14px' }}>
            <h1 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 2px 0',
              letterSpacing: '-0.2px',
              lineHeight: 1.2
            }}>
              Bireysel Hesap Oluştur
            </h1>
            <p style={{
              fontSize: '11px',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.4
            }}>
              Seyahatlerinizi planlayın, bütçenizi yönetin.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '10px 12px',
              marginBottom: '14px',
              color: '#b91c1c',
              background: '#fef2f2',
              borderRadius: '11px',
              border: '1px solid #fee2e2',
              fontSize: '11.5px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              lineHeight: '1.4',
              animation: 'fadeIn 0.3s ease'
            }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* First & Last Name (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              <div>
                <label style={labelStyle}>Adınız *</label>
                <div style={getInputBoxStyle('firstName')}>
                  <User size={14} color={focusedField === 'firstName' ? '#D7147A' : '#94a3b8'} style={{ marginRight: '6px', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Örn: Ahmet"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Soyadınız *</label>
                <div style={getInputBoxStyle('lastName')}>
                  <User size={14} color={focusedField === 'lastName' ? '#D7147A' : '#94a3b8'} style={{ marginRight: '6px', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Örn: Yılmaz"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={labelStyle}>E-Posta Adresi *</label>
              <div style={getInputBoxStyle('email')}>
                <Mail size={14} color={focusedField === 'email' ? '#D7147A' : '#94a3b8'} style={{ marginRight: '6px', flexShrink: 0 }} />
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={labelStyle}>Telefon Numarası</label>
              <div style={getInputBoxStyle('phone')}>
                <Phone size={14} color={focusedField === 'phone' ? '#D7147A' : '#94a3b8'} style={{ marginRight: '6px', flexShrink: 0 }} />
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password & Password Confirm (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              <div>
                <label style={labelStyle}>Şifre (Min. 6) *</label>
                <div style={getInputBoxStyle('password')}>
                  <KeyRound size={14} color={focusedField === 'password' ? '#D7147A' : '#94a3b8'} style={{ marginRight: '5px', flexShrink: 0 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={{ ...inputStyle, paddingRight: '20px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px',
                      borderRadius: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Şifre Tekrar *</label>
                <div style={getInputBoxStyle('passwordConfirm')}>
                  <KeyRound size={14} color={focusedField === 'passwordConfirm' ? '#D7147A' : '#94a3b8'} style={{ marginRight: '5px', flexShrink: 0 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    onFocus={() => setFocusedField('passwordConfirm')}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* KVKK Checkbox & Agreement */}
            <div 
              onClick={() => setAgreeKvkk(!agreeKvkk)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                cursor: 'pointer',
                marginTop: '3px',
                userSelect: 'none'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '5px',
                border: `1.5px solid ${agreeKvkk ? '#D7147A' : '#cbd5e1'}`,
                background: agreeKvkk ? '#D7147A' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
                transition: 'all 0.2s ease',
                boxShadow: agreeKvkk ? '0 2px 6px rgba(215, 20, 122, 0.25)' : 'none'
              }}>
                {agreeKvkk && <Check size={11} color="#ffffff" strokeWidth={3.5} />}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.45 }}>
                <span 
                  onClick={(e) => { e.stopPropagation(); setShowKvkkModal(true); }}
                  style={{
                    color: '#D7147A',
                    opacity: 0.85,
                    fontWeight: '600',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    cursor: 'pointer'
                  }}
                >
                  KVKK Aydınlatma Metni
                </span>
                'ni ve kullanım koşullarını okudum, onaylıyorum.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '36px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                border: 'none',
                borderRadius: '9px',
                cursor: isLoading ? 'wait' : 'pointer',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 3px 10px rgba(215, 20, 122, 0.25)',
                opacity: isLoading ? 0.75 : 1
              }}
              onMouseEnter={(e) => { 
                if (isLoading) return;
                e.currentTarget.style.transform = 'translateY(-1px)'; 
                e.currentTarget.style.boxShadow = '0 5px 14px rgba(215, 20, 122, 0.35)';
              }}
              onMouseLeave={(e) => { 
                if (isLoading) return;
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(215, 20, 122, 0.25)';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 1s infinite linear' }} />
                  <span>Hesabınız Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <span>Ücretsiz Kayıt Ol</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div style={{
            marginTop: '15px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <span>Zaten bir hesabınız var mı?</span>
              <Link
                to="/login"
                style={{
                  color: '#D7147A',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                Giriş Yap
              </Link>
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

      {/* KVKK Modal */}
      {showKvkkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '15px 18px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#D7147A" />
                <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700' }}>KVKK Aydınlatma Metni</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKvkkModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '16px 18px', overflowY: 'auto', fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>
                6698 sayılı “Kişisel Verilerin Korunması Kanunu” gereğince, bireysel kullanıcı olarak sağladığınız ad, soyad, e-posta ve iletişim bilgileri yalnızca seyahat planlama, bütçe yönetimi ve asistan hizmetlerinin sunulması amacıyla işlenir.
              </p>
              <p style={{ marginBottom: 0 }}>
                Kişisel verileriniz kesinlikle üçüncü parti reklam verenlerle paylaşılmaz. Dilediğiniz zaman hesabınızı ve verilerinizi silme veya güncelleme hakkına sahipsiniz.
              </p>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'right', background: '#fafafa' }}>
              <button
                type="button"
                onClick={() => { setAgreeKvkk(true); setShowKvkkModal(false); }}
                style={{
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                }}
              >
                Okudum, Kabul Ediyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
