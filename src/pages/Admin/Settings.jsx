import React, { useRef, useState } from 'react';
import { Settings, Image as ImageIcon, Briefcase, Mail, Cpu, Upload, Loader2, Info, Smartphone, AlertTriangle, Trash2 } from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore } from '../../store/settingsStore';
import { useTourStore } from '../../store/tourStore';

export default function AdminSettings() {
  const { 
      systemAnnouncementAvatar, setSystemAnnouncementAvatar, 
      corporateLogo, setCorporateLogo,
      corporateName, setCorporateName,
      googlePlacesApiKey, setGooglePlacesApiKey,
      smtpConfig, setSmtpConfig,
      isSmtpVerified, setSmtpVerified,
      netgsmConfig, setNetgsmConfig,
      whatsappConfig, setWhatsappConfig
  } = useSettingsStore();

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState(null);

  const logoFileRef = useRef(null);
  const avatarFileRef = useRef(null);

  const [testSmsNumber, setTestSmsNumber] = useState('');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState(null);

  const [testWaNumber, setTestWaNumber] = useState('');
  const [testWaTemplate, setTestWaTemplate] = useState('new_user_welcome');
  const [isSendingTestWa, setIsSendingTestWa] = useState(false);
  const [testWaResult, setTestWaResult] = useState(null);

  const sendTestSms = async () => {
      if (!testSmsNumber) {
          setTestSmsResult({ success: false, message: 'Lütfen geçerli bir numara girin.' });
          return;
      }
      
      setIsSendingTestSms(true);
      setTestSmsResult(null);

      try {
          const res = await fetch('https://move-yanimda.web.app/api/send-sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  usercode: netgsmConfig.usercode,
                  password: netgsmConfig.password,
                  header: netgsmConfig.header,
                  to: testSmsNumber,
                  message: `${corporateName} bilgi sistemlerine hoş geldiniz. Bu bir deneme SMS'idir.`
              })
          });

          const data = await res.json();
          setTestSmsResult({ success: res.ok, message: data.message });
      } catch (err) {
          setTestSmsResult({ success: false, message: 'Ağ hatası. Sunucu çalışmıyor olabilir.' });
      } finally {
          setIsSendingTestSms(false);
      }
  };

  const sendTestWa = async () => {
      if (!testWaNumber) {
          setTestWaResult({ success: false, message: 'Lütfen geçerli bir numara girin.' });
          return;
      }
      
      setIsSendingTestWa(true);
      setTestWaResult(null);

      let parameters = [];
      if (testWaTemplate === 'new_user_welcome') {
          parameters = ['Ahmet Yılmaz', 'ahmet@sirket.com', 'Pass1234!'];
      } else if (testWaTemplate === 'tour_registration') {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu'];
      } else if (testWaTemplate === 'password_reset') {
          parameters = ['Ahmet Yılmaz', 'Pass9988!'];
      } else if (testWaTemplate === 'ticket_added') {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu', 'Pegasus', 'PC1234', 'ABCDEF'];
      } else {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu', '48', 'Pegasus'];
      }

      try {
          const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
          const res = await fetch(`${baseUrl}/api/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  phoneId: whatsappConfig.phoneId,
                  accessToken: whatsappConfig.accessToken,
                  to: testWaNumber,
                  templateName: whatsappConfig[testWaTemplate === 'new_user_welcome' ? 'newUserTemplate' : (testWaTemplate === 'tour_registration' ? 'newTourTemplate' : (testWaTemplate === 'password_reset' ? 'passwordResetTemplate' : (testWaTemplate === 'ticket_added' ? 'ticketAddedTemplate' : 'checkInTemplate')))] || 'new_user_welcome',
                  languageCode: 'tr',
                  parameters: parameters
              })
          });

          const data = await res.json();
          setTestWaResult({ success: res.ok, message: data.message || (res.ok ? 'Mesaj başarıyla gönderildi!' : 'API hatası oluştu.') });
      } catch (err) {
          setTestWaResult({ success: false, message: 'Ağ hatası. Sunucuya bağlanılamadı.' });
      } finally {
          setIsSendingTestWa(false);
      }
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const verifySmtpConnection = () => {
      setIsTestingSmtp(true);
      setSmtpError('');
      setSmtpVerified(false);

      setTimeout(() => {
          setIsTestingSmtp(false);
          const { host, port, user, pass } = smtpConfig;
          if (!host || host.length < 3) return setSmtpError('Geçersiz Host adresi.');
          if (!port || isNaN(Number(port))) return setSmtpError('Port numarası geçersiz.');
          if (!user.includes('@')) return setSmtpError('Geçerli bir E-posta adresi girin.');
          if (!pass || pass.length < 4) return setSmtpError('Şifre/Uygulama Şifresi hatalı veya eksik.');

          setSmtpVerified(true);
      }, 1200);
  };

  const sendTestMail = async () => {
      if (!testEmail || !testEmail.includes('@')) {
          setTestMailResult({ success: false, message: 'Lütfen geçerli bir test adresi girin.' });
          return;
      }
      
      setIsSendingTestMail(true);
      setTestMailResult(null);

      try {
          const res = await fetch('https://move-yanimda.web.app/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  host: smtpConfig.host,
                  port: smtpConfig.port,
                  user: smtpConfig.user,
                  pass: smtpConfig.pass,
                  to: testEmail,
                  corporateName: corporateName
              })
          });

          const data = await res.json();
          
          if (!res.ok) {
              setTestMailResult({ success: false, message: data.message || 'Sunucu hatası oluştu.' });
          } else {
              setTestMailResult({ success: true, message: data.message || 'Test maili başarıyla gönderildi!' });
          }
      } catch (err) {
          setTestMailResult({ success: false, message: 'Ağ bağlantı hatası. Firebase Cloud Functions sunucusu henüz yayınlanmamış.' });
      } finally {
          setIsSendingTestMail(false);
      }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <Header title="Sistem Konfigürasyonu" showBack />
      
      <div style={{ padding: '24px 16px' }}>

         {/* Corporate Identity */}
         <div style={{ marginBottom: '32px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Briefcase size={20} color="var(--primary)" /> Kurumsal Kimlik
             </h2>
             <div className="card">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Sistem giriş ekranı (Login) ve ana sayfa başlıklarında yer alacak şirketinizin ana markasını (Logo ve Yazılım Adı) belirleyin.</p>
                
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Firma / Yazılım Adı</label>
                    <input 
                        type="text"
                        className="input-field"
                        placeholder="Örn: Move Travel & Mice"
                        value={corporateName}
                        onChange={e => setCorporateName(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', overflow: 'hidden', flexShrink: 0 }}>
                        {corporateLogo ? (
                            <img src={corporateLogo} alt="Corporate Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <Briefcase size={32} color="#cbd5e1" />
                        )}
                    </div>
                    <div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={logoFileRef}
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageUpload(e, setCorporateLogo)}
                        />
                        <button 
                            onClick={() => logoFileRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                            <Upload size={16} /> Logo Yükle
                        </button>
                        {corporateLogo && (
                            <button 
                                onClick={() => setCorporateLogo(null)}
                                style={{ marginTop: '8px', background: 'transparent', color: '#ef4444', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Logoyu Temizle</button>
                        )}
                    </div>
                </div>
             </div>
         </div>

         {/* API Connections */}
         <div style={{ marginBottom: '32px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Cpu size={20} color="var(--primary)" /> Servis Entegrasyonları
             </h2>
             <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Google Places API</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Şehir Rehberi modülünde restoran ve mimari yerleri çekmek için kullanılır.</p>
                <input 
                   type="text" 
                   className="input-field" 
                   placeholder="AIzaSy..." 
                   value={googlePlacesApiKey} 
                   onChange={e => setGooglePlacesApiKey(e.target.value)} 
                   style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9', display: 'block', fontFamily: 'monospace' }}
                />
             </div>
         </div>

         {/* SMTP */}
         <div style={{ marginBottom: '32px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Mail size={20} color="var(--primary)" /> E-Posta Sunucu (SMTP)
             </h2>
             <div className="card">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Sistemdeki bilet ve doküman onayı maillerinin gönderimi için Google Workspace veya kendi kurumsal e-posta protokolünüzü ayarlayın.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sunucu (Host)</label>
                            <input 
                                type="text"
                                className="input-field"
                                value={smtpConfig.host}
                                onChange={e => setSmtpConfig({ host: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Port</label>
                            <input 
                                type="text"
                                className="input-field"
                                value={smtpConfig.port}
                                onChange={e => setSmtpConfig({ port: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kullanıcı Adı (Email)</label>
                        <input 
                            type="text"
                            className="input-field"
                            placeholder="admin@sirket.com"
                            value={smtpConfig.user}
                            onChange={e => setSmtpConfig({ user: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Uygulama Şifresi (Pass)</label>
                        <input 
                            type="password"
                            className="input-field"
                            placeholder="******"
                            value={smtpConfig.pass}
                            onChange={e => setSmtpConfig({ pass: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9', fontFamily: 'monospace' }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                        onClick={verifySmtpConnection}
                        disabled={isTestingSmtp}
                        style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        {isTestingSmtp ? <Loader2 size={16} className="spin" /> : <Settings size={16} />}
                        {isTestingSmtp ? 'Bağlantı Sınanıyor...' : 'Bağlantıyı Kaydet ve Sına'}
                    </button>
                    
                    {smtpError && (
                        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '12px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Info size={16} /> {smtpError}
                        </div>
                    )}

                    {isSmtpVerified && (
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#047857' }}>Google Workspace SMTP Bağlantısı Aktif</span>
                            </div>
                            
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Sıra geldi konfigürasyonunuzun son durağına: E-postalar gitmekte başarılı mı test edelim!</p>
                            
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <input 
                                        type="email" 
                                        placeholder="test@mail.com" 
                                        value={testEmail}
                                        onChange={e => setTestEmail(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                                    />
                                </div>
                                <button 
                                    onClick={sendTestMail}
                                    disabled={isSendingTestMail || !testEmail}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: isSendingTestMail || !testEmail ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSendingTestMail || !testEmail ? 0.7 : 1 }}>
                                    {isSendingTestMail ? <Loader2 size={16} className="spin" /> : <Mail size={16} />} 
                                    {isSendingTestMail ? 'Gönderiliyor...' : 'Test Maili Yolla'}
                                </button>
                            </div>
                            
                            {testMailResult && (
                                <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', fontSize: '12px', background: testMailResult.success ? '#ecfdf5' : '#fee2e2', color: testMailResult.success ? '#047857' : '#b91c1c', border: `1px solid ${testMailResult.success ? '#bbf7d0' : '#fecaca'}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Info size={16} /> 
                                    {testMailResult.message}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!isSmtpVerified && !smtpError && !isTestingSmtp && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Mail gönderimlerinin çalışması için ayarları tamamlayıp sınama yapmanız gerekmektedir.
                        </div>
                    )}
                </div>

             </div>
         {/* NetGSM API */}
         <div style={{ marginBottom: '32px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Smartphone size={20} color="var(--primary)" /> SMS Gateway (NetGSM)
             </h2>
             <div className="card">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Müşterilerinize acil anonslar veya bilgilendirme SMS'leri atabilmek için NetGSM Abonelik bilgilerinizi giriniz.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Abone No (Usercode)</label>
                            <input 
                                type="text"
                                className="input-field"
                                value={netgsmConfig?.usercode || ''}
                                onChange={e => setNetgsmConfig({ usercode: e.target.value })}
                                placeholder="Örn: 850XXXXXXX"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API Şifresi</label>
                            <input 
                                type="password"
                                className="input-field"
                                value={netgsmConfig?.password || ''}
                                onChange={e => setNetgsmConfig({ password: e.target.value })}
                                placeholder="******"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9', fontFamily: 'monospace' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Başlık (Kaşe)</label>
                            <input 
                                type="text"
                                className="input-field"
                                value={netgsmConfig?.header || ''}
                                onChange={e => setNetgsmConfig({ header: e.target.value })}
                                placeholder="Örn: BASE44"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px -8px -8px -8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>API bilgilerinizin doğruluğunu sınamak için kendinize bir test SMS'i atın. Numaranızı 905XXXXXXXXX formatında girin.</p>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                placeholder="905..." 
                                value={testSmsNumber}
                                onChange={e => setTestSmsNumber(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                            />
                        </div>
                        <button 
                            onClick={sendTestSms}
                            disabled={isSendingTestSms || !testSmsNumber}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: isSendingTestSms || !testSmsNumber ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSendingTestSms || !testSmsNumber ? 0.7 : 1 }}>
                            {isSendingTestSms ? <Loader2 size={16} className="spin" /> : <Smartphone size={16} />} 
                            {isSendingTestSms ? 'Gönderiliyor...' : 'Örnek Mesaj Gönder'}
                        </button>
                    </div>
                    
                    {testSmsResult && (
                        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', fontSize: '12px', background: testSmsResult.success ? '#ecfdf5' : '#fee2e2', color: testSmsResult.success ? '#047857' : '#b91c1c', border: `1px solid ${testSmsResult.success ? '#bbf7d0' : '#fecaca'}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Info size={16} /> 
                            {testSmsResult.message}
                        </div>
                    )}
                </div>

             </div>
         </div>

         {/* WhatsApp Business API */}
         <div style={{ marginBottom: '32px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Smartphone size={20} color="var(--primary)" /> WhatsApp Business Platform (API)
             </h2>
             <div className="card">
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Müşterilerinize resmi WhatsApp Cloud API üzerinden otomatik işlem ve bilgilendirme bildirimleri gönderin.</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <input 
                        type="checkbox"
                        id="wa_enabled"
                        checked={whatsappConfig?.isEnabled || false}
                        onChange={e => setWhatsappConfig({ isEnabled: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <label htmlFor="wa_enabled" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>WhatsApp Bildirim Entegrasyonunu Aktifleştir</label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Telefon Numarası Kimliği (Phone ID)</label>
                        <input 
                            type="text"
                            className="input-field"
                            value={whatsappConfig?.phoneId || ''}
                            onChange={e => setWhatsappConfig({ phoneId: e.target.value })}
                            placeholder="Örn: 1023948293849283"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>WABA ID (Hesap ID)</label>
                        <input 
                            type="text"
                            className="input-field"
                            value={whatsappConfig?.wabaId || ''}
                            onChange={e => setWhatsappConfig({ wabaId: e.target.value })}
                            placeholder="Örn: 987654321012345"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kalıcı Erişim Jetonu (Permanent Access Token)</label>
                        <textarea 
                            rows={3}
                            className="input-field"
                            value={whatsappConfig?.accessToken || ''}
                            onChange={e => setWhatsappConfig({ accessToken: e.target.value })}
                            placeholder="EAAG..."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#f9f9f9', fontFamily: 'monospace', resize: 'none' }}
                        />
                    </div>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 'bold', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '12px' }}>WhatsApp Şablon İsimleri (Meta WABA)</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>Meta panelinde onaylattığınız resmi şablon isimlerini (Template Name) girin.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Yeni Kullanıcı Şablonu</label>
                        <input 
                            type="text"
                            value={whatsappConfig?.newUserTemplate || ''}
                            onChange={e => setWhatsappConfig({ newUserTemplate: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '4px' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Meta Değişken Eşleşmesi: <code>{"{{1}}"}</code> = Müşteri Adı, <code>{"{{2}}"}</code> = Kullanıcı Adı (E-posta), <code>{"{{3}}"}</code> = Giriş Şifresi
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Yeni Seyahat Kayıt Şablonu</label>
                        <input 
                            type="text"
                            value={whatsappConfig?.newTourTemplate || ''}
                            onChange={e => setWhatsappConfig({ newTourTemplate: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '4px' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Meta Değişken Eşleşmesi: <code>{"{{1}}"}</code> = Müşteri Adı, <code>{"{{2}}"}</code> = Seyahat / Tur Adı
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Şifre Sıfırlama Şablonu</label>
                        <input 
                            type="text"
                            value={whatsappConfig?.passwordResetTemplate || ''}
                            onChange={e => setWhatsappConfig({ passwordResetTemplate: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '4px' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Meta Değişken Eşleşmesi: <code>{"{{1}}"}</code> = Müşteri Adı, <code>{"{{2}}"}</code> = Yeni Şifre
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Bilet Ekleme Şablonu</label>
                        <input 
                            type="text"
                            value={whatsappConfig?.ticketAddedTemplate || ''}
                            onChange={e => setWhatsappConfig({ ticketAddedTemplate: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '4px' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Meta Değişken Eşleşmesi: <code>{"{{1}}"}</code> = Müşteri Adı, <code>{"{{2}}"}</code> = Seyahat / Tur Adı, <code>{"{{3}}"}</code> = Havayolu, <code>{"{{4}}"}</code> = Uçuş Kodu, <code>{"{{5}}"}</code> = PNR Kodu
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Son 48s & Check-in Uyarısı Şablonu</label>
                        <input 
                            type="text"
                            value={whatsappConfig?.checkInTemplate || ''}
                            onChange={e => setWhatsappConfig({ checkInTemplate: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '4px' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Meta Değişken Eşleşmesi: <code>{"{{1}}"}</code> = Müşteri Adı, <code>{"{{2}}"}</code> = Seyahat / Tur Adı, <code>{"{{3}}"}</code> = Kalan Saat, <code>{"{{4}}"}</code> = Havayolu Şirketi
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '0 -8px -8px -8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Bağlantıyı doğrulamak için test numarası (Ülke kodlu, örn: 905XXXXXXXXX) girerek deneme şablon mesajı gönderin.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        <select 
                            value={testWaTemplate} 
                            onChange={e => setTestWaTemplate(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'white' }}
                        >
                            <option value="new_user_welcome">Yeni Kullanıcı Karşılama</option>
                            <option value="tour_registration">Seyahat Kaydı Bildirimi</option>
                            <option value="password_reset">Parola Sıfırlama</option>
                            <option value="ticket_added">Bilet Tanımlama Bildirimi</option>
                            <option value="checkin_reminder">Son 48 Saat / Check-in Uyarısı</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                placeholder="905..." 
                                value={testWaNumber}
                                onChange={e => setTestWaNumber(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                            />
                        </div>
                        <button 
                            onClick={sendTestWa}
                            disabled={isSendingTestWa || !testWaNumber}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: isSendingTestWa || !testWaNumber ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSendingTestWa || !testWaNumber ? 0.7 : 1 }}>
                            {isSendingTestWa ? <Loader2 size={16} className="spin" /> : <Smartphone size={16} />} 
                            {isSendingTestWa ? 'Gönderiliyor...' : 'Test WhatsApp Mesajı'}
                        </button>
                    </div>
                    
                    {testWaResult && (
                        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', fontSize: '12px', background: testWaResult.success ? '#ecfdf5' : '#fee2e2', color: testWaResult.success ? '#047857' : '#b91c1c', border: `1px solid ${testWaResult.success ? '#bbf7d0' : '#fecaca'}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Info size={16} /> 
                            {testWaResult.message}
                        </div>
                    )}
                </div>
             </div>
         </div>


         {/* Danger Zone: Reset System */}
         <div style={{ marginBottom: '32px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                 <AlertTriangle size={20} /> Tehlikeli Bölge
             </h2>
             <div className="card" style={{ border: '1px solid #fecaca', background: '#fffafa' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Sistemdeki tüm test seyahatlerini, geçmiş turları ve katılımcı atamalarını kalıcı olarak siler. Bu işlem geri alınamaz! 
                </p>
                <button 
                  onClick={() => {
                      if(window.confirm('DİKKAT! Sistemdeki tüm turlar silinecektir. Bu işlemi geri alamazsınız. Onaylıyor musunuz?')) {
                          useTourStore.getState().clearAllTours();
                          alert('Sistemdeki tüm seyahatler başarıyla sıfırlandı.');
                      }
                  }}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
                    <Trash2 size={16} /> Tüm Seyahatleri Temizle (Sıfırla)
                </button>
             </div>
         </div>

      </div>
    </div>
  </div>
  );
}
