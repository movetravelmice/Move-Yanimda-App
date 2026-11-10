import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  ArrowRight, Sparkles, ShieldCheck, UserCheck, KeyRound, Loader2 
} from 'lucide-react';
import { verifyPasswordSetupToken, completePasswordSetup } from '../../services/authLinkService';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tokenStatus, setTokenStatus] = useState({ valid: false, reason: '' });
  const [targetUser, setTargetUser] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const corporateName = useSettingsStore(state => state.corporateName) || 'Move Yanımda';
  const login = useAuthStore(state => state.login);

  // 1. Token doğrulama
  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      if (!token) {
        if (isMounted) {
          setLoading(false);
          setTokenStatus({ valid: false, reason: 'Bağlantı parametresi eksik. Lütfen WhatsApp üzerinden gelen linke tekrar tıklayınız.' });
        }
        return;
      }

      setLoading(true);
      const res = await verifyPasswordSetupToken(token);
      if (isMounted) {
        setTokenStatus(res);
        if (res.valid && res.user) {
          setTargetUser(res.user);
        }
        setLoading(false);
      }
    };

    checkToken();
    return () => { isMounted = false; };
  }, [token]);

  // Şifre gücü hesaplayıcı
  const getPasswordStrength = (pass) => {
    const upper = /[A-Z]/.test(pass || '');
    const lower = /[a-z]/.test(pass || '');
    const number = /[0-9]/.test(pass || '');
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(pass || '');

    let score = 0;
    if (pass && pass.length >= 6) {
      if (upper) score++;
      if (lower) score++;
      if (number) score++;
      if (special) score++;
    }

    let label = 'Çok Zayıf';
    let color = '#ef4444';
    if (score === 1) {
      label = 'Zayıf';
      color = '#ef4444';
    } else if (score === 2) {
      label = 'Orta';
      color = '#f97316';
    } else if (score === 3) {
      label = 'İyi';
      color = '#eab308';
    } else if (score >= 4) {
      label = 'Güçlü';
      color = '#10b981';
    }

    return { upper, lower, number, special, score, label, color };
  };

  const strength = getPasswordStrength(password);

  // Otomatik güvenli şifre üret
  const handleGeneratePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const num = '23456789';
    const sym = '!@#$%*?';
    
    let generated = 
      upper.charAt(Math.floor(Math.random() * upper.length)) +
      lower.charAt(Math.floor(Math.random() * lower.length)) +
      lower.charAt(Math.floor(Math.random() * lower.length)) +
      num.charAt(Math.floor(Math.random() * num.length)) +
      num.charAt(Math.floor(Math.random() * num.length)) +
      sym.charAt(Math.floor(Math.random() * sym.length));
    
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setShowConfirm(true);
    setErrorMsg('');
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setErrorMsg('Lütfen bir şifre giriniz.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakterden oluşmalıdır.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMsg('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await completePasswordSetup(token, cleanPass);
      if (!res.success) {
        setErrorMsg(res.message || 'Şifre kaydedilemedi.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);

      // Oturumu hemen hafızaya al
      if (res.token && res.user) {
        useAuthStore.setState({ token: res.token, user: res.user });
      }

      // Kullanıcıyı otomatik oturum açtır
      const userEmail = targetUser?.email || res.user?.email;
      if (userEmail && login) {
        try {
          await login(userEmail, cleanPass);
        } catch (loginErr) {
          console.warn("Direct login error:", loginErr);
        }
      }

      // 1.5 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setErrorMsg('Beklenmeyen bir hata oluştu: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fdf2f8 0%, #f8fafc 40%, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 20px 40px -15px rgba(215, 20, 122, 0.08), 0 1px 3px rgba(0,0,0,0.03)',
        padding: '32px 24px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>

        {/* Logo / Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary, #D7147A) 0%, #be1268 100%)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: '900',
            boxShadow: '0 8px 20px -4px rgba(215, 20, 122, 0.35)',
            marginBottom: '12px'
          }}>
            M
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            {corporateName}
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>
            Tek Kullanımlık Şifre Belirleme
          </p>
        </div>

        {/* LOADING DURUMU */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <Loader2 size={32} color="var(--primary, #D7147A)" className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
              Bağlantı doğrulanıyor, lütfen bekleyiniz...
            </div>
          </div>
        )}

        {/* GEÇERSİZ / SÜRESİ DOLMUŞ TOKEN DURUMU */}
        {!loading && !tokenStatus.valid && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '14px'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
              Bağlantı Geçersiz veya Süresi Dolmuş
            </h3>
            
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {tokenStatus.reason || 'Bu şifre belirleme bağlantısı tek kullanımlıktır ve süresi dolmuş veya daha önce kullanılmış olabilir.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link 
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '11px',
                  borderRadius: '12px',
                  background: 'var(--primary, #D7147A)',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
                }}
              >
                <span>Giriş Ekranına Git</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {/* BAŞARILI ŞİFRE KAYDI VE YÖNLENDİRME */}
        {!loading && tokenStatus.valid && success && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              marginBottom: '14px'
            }}>
              <CheckCircle2 size={30} />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              Şifreniz Başarıyla Belirlendi!
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
              Oturumunuz açılıyor ve seyahat ekranınıza yönlendiriliyorsunuz...
            </p>
            <Loader2 size={20} color="var(--primary, #D7147A)" className="animate-spin" style={{ margin: '0 auto' }} />
          </div>
        )}

        {/* GEÇERLİ TOKEN: ŞİFRE BELİRLEME FORMU */}
        {!loading && tokenStatus.valid && !success && (
          <div>
            {/* Kullanıcı Karşılama Kartı */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <UserCheck size={16} color="var(--primary, #D7147A)" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                  Hoş Geldiniz, {targetUser?.name || 'Misafirimiz'} 👋
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '24px' }}>
                {targetUser?.email && !targetUser.email.endsWith('@move.local') && (
                  <div>• Kullanıcı Adı: <strong>{targetUser.email}</strong></div>
                )}
                {targetUser?.phone && targetUser.phone !== '-' && (
                  <div>• Telefon: <strong>{targetUser.phone}</strong></div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Şifre Alanı */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <KeyRound size={13} color="var(--primary, #D7147A)" /> Yeni Giriş Şifreniz *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{
                      background: '#fdf2f8',
                      border: '1px solid #fbcfe8',
                      color: 'var(--primary, #D7147A)',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Sparkles size={11} /> Şifre Üret
                  </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Şifrenizi yazınız..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      borderRadius: '11px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '13px',
                      background: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Şifre Güç Barı */}
                {password && (
                  <div style={{ marginTop: '8px', background: '#f8fafc', padding: '8px 10px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Şifre Gücü</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ height: '4px', width: '100%', display: 'flex', gap: '3px', marginBottom: '6px' }}>
                      <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: strength.score >= 1 ? strength.color : '#e2e8f0' }} />
                      <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: strength.score >= 2 ? strength.color : '#e2e8f0' }} />
                      <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: strength.score >= 3 ? strength.color : '#e2e8f0' }} />
                      <div style={{ flex: 1, height: '100%', borderRadius: '4px', background: strength.score >= 4 ? strength.color : '#e2e8f0' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '9.5px' }}>
                      <span style={{ color: strength.upper ? '#10b981' : '#94a3b8', fontWeight: strength.upper ? '700' : '500' }}>
                        {strength.upper ? '✓' : '○'} Büyük Harf
                      </span>
                      <span style={{ color: strength.lower ? '#10b981' : '#94a3b8', fontWeight: strength.lower ? '700' : '500' }}>
                        {strength.lower ? '✓' : '○'} Küçük Harf
                      </span>
                      <span style={{ color: strength.number ? '#10b981' : '#94a3b8', fontWeight: strength.number ? '700' : '500' }}>
                        {strength.number ? '✓' : '○'} Rakam
                      </span>
                      <span style={{ color: strength.special ? '#10b981' : '#94a3b8', fontWeight: strength.special ? '700' : '500' }}>
                        {strength.special ? '✓' : '○'} Özel Karakter
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Şifre Tekrar Alanı */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '5px' }}>
                  Şifre Tekrarı *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Şifrenizi tekrar yazınız..."
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      borderRadius: '11px',
                      border: (confirmPassword && confirmPassword !== password) ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '13px',
                      background: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: '#94a3b8'
                    }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px', fontWeight: '600' }}>
                    Şifreler eşleşmiyor.
                  </div>
                )}
              </div>

              {/* Hata Mesajı */}
              {errorMsg && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Kaydet ve Giriş Yap Butonu */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--primary, #D7147A) 0%, #be1268 100%)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(215, 20, 122, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Şifre Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Şifremi Belirle ve Giriş Yap</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Info */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '11px',
          color: '#94a3b8'
        }}>
          Güvenli Seyahat Platformu • Move Travel &amp; MICE
        </div>

      </div>
    </div>
  );
}
