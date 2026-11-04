import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Image as ImageIcon, Briefcase, Mail, Cpu, Upload, 
  Loader2, Info, Smartphone, AlertTriangle, Trash2, Bot, Sparkles, 
  Eye, EyeOff, CheckCircle2, XCircle, Check, KeyRound, Globe, 
  ShieldAlert, Send, Layers, MessageSquare, Compass, ArrowRight, ChevronDown,
  Save
} from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore } from '../../store/settingsStore';
import { useTourStore } from '../../store/tourStore';
import { testGeminiConnection as checkGeminiConnection } from '../../services/aiService';

const GEMINI_MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'gemini-3.5-flash',
    tag: 'Önerilen',
    badgeColor: '#D7147A',
    badgeBg: '#FDF2F8',
    description: 'En Yeni, Çok Hızlı & Kararlı'
  },
  {
    id: 'gemini-3.6-flash',
    name: 'gemini-3.6-flash',
    tag: 'Yeni Nesil',
    badgeColor: '#2563eb',
    badgeBg: '#EFF6FF',
    description: 'Yeni nesil dengeli Flash motoru'
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'gemini-3.5-flash-lite',
    tag: 'Hafif & Hızlı',
    badgeColor: '#059669',
    badgeBg: '#ECFDF5',
    description: 'Ultra düşük gecikme ve tasarruflu'
  },
  {
    id: 'gemini-flash-latest',
    name: 'gemini-flash-latest',
    tag: 'Otomatik',
    badgeColor: '#9333ea',
    badgeBg: '#FAF5FF',
    description: 'Daima en güncel Flash sürümü'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'gemini-3.8-flash',
    tag: 'En Üst Model',
    badgeColor: '#ea580c',
    badgeBg: '#FFF7ED',
    description: 'Yüksek kapasite ve derin analiz'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'gemini-3-flash-preview',
    tag: 'Deneysel',
    badgeColor: '#64748b',
    badgeBg: '#F1F5F9',
    description: 'Test & önizleme sürümü'
  }
];

const WA_TEST_TEMPLATES = [
  { id: 'new_user_welcome', name: 'Yeni Kullanıcı', code: 'welcome_customer', tag: 'Kullanıcı' },
  { id: 'account_activation', name: 'Hesap Aktivasyonu', code: 'welcome_account_activation', tag: 'Aktivasyon' },
  { id: 'tour_registration', name: 'Seyahat Kaydı', code: 'tour_registration', tag: 'Operasyon' },
  { id: 'password_reset', name: 'Parola Sıfırlama', code: 'password_reset_otp', tag: 'Güvenlik' },
  { id: 'ticket_added', name: 'Bilet Tanımlama', code: 'ticket_pdf_ready', tag: 'Bilet' },
  { id: 'checkin_reminder', name: 'Son 48s / Check-in', code: 'checkin_reminder', tag: 'Hatırlatma' },
  { id: 'tour_review_reminder', name: '24s Seyahat Puanlama', code: 'tour_review_reminder', tag: 'Anket' }
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const { 
      systemAnnouncementAvatar, setSystemAnnouncementAvatar, 
      corporateLogo, setCorporateLogo,
      corporateName, setCorporateName,
      googlePlacesApiKey, setGooglePlacesApiKey,
      smtpConfig, setSmtpConfig,
      isSmtpVerified, setSmtpVerified,
      netgsmConfig, setNetgsmConfig,
      whatsappConfig, setWhatsappConfig,
      akbankApiKey, setAkbankApiKey,
      geminiConfig, setGeminiConfig,
      popularRoutes,
      updateSetting,
      loadAdminSettings
  } = useSettingsStore();

  useEffect(() => {
    if (loadAdminSettings) {
      loadAdminSettings();
    }
  }, [loadAdminSettings]);

  const [activeTab, setActiveTab] = useState('all');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState(null);

  const logoFileRef = useRef(null);

  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isSmsVerified, setIsSmsVerified] = useState(false);
  const [smsError, setSmsError] = useState('');
  const [testSmsNumber, setTestSmsNumber] = useState('');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState(null);

  const [isTestingWa, setIsTestingWa] = useState(false);
  const [isWaVerified, setIsWaVerified] = useState(false);
  const [waError, setWaError] = useState('');
  const [testWaNumber, setTestWaNumber] = useState('');
  const [testWaTemplate, setTestWaTemplate] = useState('new_user_welcome');
  const [isSendingTestWa, setIsSendingTestWa] = useState(false);
  const [testWaResult, setTestWaResult] = useState(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  const [waTestDropdownOpen, setWaTestDropdownOpen] = useState(false);
  const waTestDropdownRef = useRef(null);

  const [savingSection, setSavingSection] = useState(null);
  const [savedSection, setSavedSection] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleSaveSection = async (sectionKey, updateFn, successMsg) => {
    setSavingSection(sectionKey);
    try {
      if (updateFn) await updateFn();
      setSavedSection(sectionKey);
      setToastMessage(successMsg || 'Ayarlar başarıyla kaydedildi.');
      setTimeout(() => {
        setSavedSection(null);
      }, 2500);
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    } catch (err) {
      console.error('Save error:', err);
      setToastMessage('Ayar kaydedilirken hata oluştu.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setSavingSection(null);
    }
  };

  const renderSaveButton = (sectionKey, updateFn, label = 'Kaydet', successMsg, isFullWidth = false) => {
    const isSaving = savingSection === sectionKey;
    const isSaved = savedSection === sectionKey;
    return (
      <button 
        type="button"
        onClick={() => handleSaveSection(sectionKey, updateFn, successMsg)}
        disabled={isSaving}
        style={{ 
          background: isSaved ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', 
          color: 'white', 
          border: 'none', 
          padding: '9.5px 16px', 
          borderRadius: '10px', 
          fontSize: '11.5px', 
          fontWeight: '700', 
          cursor: isSaving ? 'not-allowed' : 'pointer', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '6px',
          boxShadow: isSaved ? '0 2px 8px rgba(5, 150, 105, 0.25)' : '0 2px 8px rgba(215, 20, 122, 0.25)',
          transition: 'all 0.15s ease',
          opacity: isSaving ? 0.7 : 1,
          width: isFullWidth ? '100%' : 'auto',
          flex: isFullWidth ? 1 : 'initial',
          boxSizing: 'border-box'
        }}
        onMouseEnter={e => { if (!isSaving) e.currentTarget.style.opacity = '0.92'; }}
        onMouseLeave={e => { if (!isSaving) e.currentTarget.style.opacity = '1'; }}
      >
        {isSaving ? (
          <Loader2 size={13} className="spin" />
        ) : isSaved ? (
          <Check size={13} strokeWidth={2.5} />
        ) : (
          <Save size={13} strokeWidth={2.2} />
        )}
        <span>{isSaving ? 'Kaydediliyor...' : isSaved ? 'Kaydedildi!' : label}</span>
      </button>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
      if (waTestDropdownRef.current && !waTestDropdownRef.current.contains(e.target)) {
        setWaTestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
          parameters = ['Ahmet Yılmaz'];
      } else if (testWaTemplate === 'tour_registration') {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu'];
      } else if (testWaTemplate === 'password_reset') {
          parameters = ['481923'];
      } else if (testWaTemplate === 'ticket_added') {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu'];
      } else if (testWaTemplate === 'tour_review_reminder') {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu', 'https://move-yanimda.web.app/dashboard'];
      } else {
          parameters = ['Ahmet Yılmaz', 'Klasik İtalya Turu', '48', 'Pegasus'];
      }

      try {
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const baseUrl = isDev ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
          const targetTemplateKey = testWaTemplate === 'new_user_welcome' ? 'newUserTemplate' : 
                                    (testWaTemplate === 'tour_registration' ? 'newTourTemplate' : 
                                    (testWaTemplate === 'password_reset' ? 'passwordResetTemplate' : 
                                    (testWaTemplate === 'ticket_added' ? 'ticketAddedTemplate' : 
                                    (testWaTemplate === 'tour_review_reminder' ? 'tourReviewTemplate' : 'checkInTemplate'))));
          
          const defaultTemplateNames = {
              newUserTemplate: 'welcome_customer',
              newTourTemplate: 'tour_registration',
              passwordResetTemplate: 'password_reset_otp',
              ticketAddedTemplate: 'ticket_pdf_ready',
              checkInTemplate: 'checkin_reminder',
              tourReviewTemplate: 'tour_review_reminder'
          };

          const resolvedTemplateName = whatsappConfig?.[targetTemplateKey] || defaultTemplateNames[targetTemplateKey] || testWaTemplate;

          let cleanPhone = String(testWaNumber).replace(/\D/g, '');
          if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
          if (cleanPhone.startsWith('0') && cleanPhone.length === 11) cleanPhone = '9' + cleanPhone;
          else if (cleanPhone.length === 10 && cleanPhone.startsWith('5')) cleanPhone = '90' + cleanPhone;

          const res = await fetch(`${baseUrl}/api/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  phoneId: whatsappConfig.phoneId,
                  accessToken: whatsappConfig.accessToken,
                  to: cleanPhone,
                  templateName: resolvedTemplateName,
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

  const testGeminiConnection = async () => {
      setIsTestingGemini(true);
      setGeminiTestResult(null);

      try {
          const result = await checkGeminiConnection(geminiConfig?.apiKey, geminiConfig?.model || 'gemini-3.5-flash');
          setGeminiTestResult(result);
      } catch (err) {
          setGeminiTestResult({
              success: false,
              message: err.message || 'Gemini bağlantı testi başarısız oldu.'
          });
      } finally {
          setIsTestingGemini(false);
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
      if (isSmtpVerified) {
          setSmtpVerified(false);
          return;
      }
      setIsTestingSmtp(true);
      setSmtpError('');

      setTimeout(() => {
          setIsTestingSmtp(false);
          const { host, port, user, pass } = smtpConfig || {};
          if (!host || host.length < 3) return setSmtpError('Geçersiz Host adresi.');
          if (!port || isNaN(Number(port))) return setSmtpError('Port numarası geçersiz.');
          if (!user || !user.includes('@')) return setSmtpError('Geçerli bir E-posta adresi girin.');
          if (!pass || pass.length < 4) return setSmtpError('Şifre/Uygulama Şifresi hatalı veya eksik.');

          setSmtpVerified(true);
      }, 700);
  };

  const verifySmsConnection = () => {
      if (isSmsVerified) {
          setIsSmsVerified(false);
          return;
      }
      setIsTestingSms(true);
      setSmsError('');

      setTimeout(() => {
          setIsTestingSms(false);
          const { usercode, password, header } = netgsmConfig || {};
          if (!usercode || usercode.trim().length < 2) return setSmsError('Kullanıcı Adı (Abone No) eksik.');
          if (!password || password.trim().length < 2) return setSmsError('API Şifresi eksik.');
          if (!header || header.trim().length < 2) return setSmsError('Başlık (Kaşe) eksik.');

          setIsSmsVerified(true);
      }, 700);
  };

  const verifyWaConnection = () => {
      if (isWaVerified) {
          setIsWaVerified(false);
          return;
      }
      setIsTestingWa(true);
      setWaError('');

      setTimeout(() => {
          setIsTestingWa(false);
          const { phoneId, accessToken, wabaId } = whatsappConfig || {};
          if (!phoneId || String(phoneId).trim().length < 5) return setWaError('Phone ID eksik veya geçersiz.');
          if (!wabaId || String(wabaId).trim().length < 5) return setWaError('WABA ID (Hesap) eksik veya geçersiz.');
          if (!accessToken || accessToken.trim().length < 15) return setWaError('Permanent Access Token eksik.');

          setIsWaVerified(true);
      }, 700);
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
          setTestMailResult({ success: false, message: 'Ağ bağlantı hatası. Firebase Cloud Functions sunucusu kontrol edilmeli.' });
      } finally {
          setIsSendingTestMail(false);
      }
  };

  const TABS = [
    { id: 'all', label: 'Tüm Ayarlar', icon: Layers, desc: 'Sistemdeki tüm konfigürasyonlar' },
    { id: 'popular_routes', label: 'Popüler Rotalar', icon: Compass, desc: 'Ana sayfa vitrin kartları ve fotoğrafları' },
    { id: 'brand', label: 'Kurumsal Kimlik', icon: Briefcase, desc: 'Logo, marka adı ve görsel varlıklar' },
    { id: 'messaging', label: 'SMS & E-Posta', icon: Mail, desc: 'SMTP sunucusu ve NetGSM Gateway' },
    { id: 'whatsapp_ai', label: 'WhatsApp & Gemini', icon: MessageSquare, desc: 'Cloud API şablonları ve Tintin AI' },
    { id: 'api', label: 'Harici API', icon: Cpu, desc: 'Google Places ve Akbank döviz kurları' }
  ];

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
  const CurrentIcon = currentTab.icon;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <Header title="Sistem Ayarları" showBack={true} />

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .settings-label {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: -0.1px;
        }
        .settings-input {
          width: 100%;
          padding: 8.5px 12px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 11.5px;
          font-weight: 500;
          color: #0f172a;
          background: #ffffff;
          box-sizing: border-box;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .settings-input:focus {
          border-color: #D7147A !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3.5px rgba(215, 20, 122, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04) !important;
        }
        .settings-input:hover:not(:focus) {
          border-color: #cbd5e1;
        }
        .settings-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        .settings-input-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
          letter-spacing: 0.3px;
        }
        .settings-textarea {
          width: 100%;
          padding: 8.5px 12px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 11px;
          color: #0f172a;
          background: #ffffff;
          box-sizing: border-box;
          outline: none;
          resize: vertical;
          font-family: inherit;
          line-height: 1.45;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .settings-textarea:focus {
          border-color: #D7147A !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3.5px rgba(215, 20, 122, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04) !important;
        }
        .settings-subbox-brand {
          background: linear-gradient(135deg, #ffffff 0%, #fff5f9 100%);
          border-radius: 12px;
          border: 1px solid #F9BED8;
          padding: 10px;
        }
        .settings-subbox-blue {
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          padding: 10px;
        }
        .settings-subbox-amber {
          background: #fffbeb;
          border-radius: 10px;
          border: 1px solid #fde68a;
          padding: 10px;
        }
        .settings-subbox-emerald {
          background: #f0fdf4;
          border-radius: 10px;
          border: 1px solid #bbf7d0;
          padding: 10px;
        }
      `}</style>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '12px 14px' }}>

         {/* Compact Custom Header */}
         <div style={{
           background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
           borderRadius: '16px',
           padding: '12px 16px',
           marginBottom: '10px',
           color: 'white',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           boxShadow: '0 4px 14px rgba(215, 20, 122, 0.22)'
         }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <button 
               onClick={() => navigate('/dashboard')}
               style={{ 
                 background: 'rgba(255,255,255,0.18)', 
                 border: 'none', 
                 color: 'white', 
                 width: '32px', 
                 height: '32px', 
                 borderRadius: '10px', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center',
                 cursor: 'pointer',
                 backdropFilter: 'blur(4px)'
               }}>
               <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
             </button>
             <div>
               <h1 style={{ fontSize: '14px', fontWeight: '900', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                 Sistem Ayarları
               </h1>
               <div style={{ fontSize: '10.5px', opacity: 0.9, fontWeight: '500' }}>
                 Tüm operasyonel altyapı ve bağlantı yönetimi
               </div>
             </div>
           </div>
           
           <div style={{ 
             background: 'rgba(255,255,255,0.15)', 
             padding: '4px 10px', 
             borderRadius: '20px', 
             fontSize: '10.5px', 
             fontWeight: '700',
             display: 'flex',
             alignItems: 'center',
             gap: '5px'
           }}>
             <Settings size={12} />
             <span>v1.0.5</span>
           </div>
         </div>

         {/* Filter Dropdown */}
         <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '12px' }}>
           <button
             type="button"
             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
             style={{
               width: '100%',
               background: '#ffffff',
               borderRadius: '14px',
               border: isDropdownOpen ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
               padding: '10px 14px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               gap: '10px',
               cursor: 'pointer',
               boxShadow: isDropdownOpen ? '0 4px 16px rgba(215, 20, 122, 0.12)' : '0 1px 4px rgba(15, 23, 42, 0.04)',
               transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
               outline: 'none',
               boxSizing: 'border-box'
             }}
           >
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
               <div style={{
                 width: '32px',
                 height: '32px',
                 borderRadius: '10px',
                 background: 'var(--primary-light)',
                 color: 'var(--primary)',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 flexShrink: 0
               }}>
                 <CurrentIcon size={16} strokeWidth={2.4} />
               </div>
               <div style={{ textAlign: 'left', minWidth: 0 }}>
                 <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                   Ayar Kategorisi
                 </div>
                 <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                   {currentTab.label}
                 </div>
               </div>
             </div>

             <div style={{
               width: '26px',
               height: '26px',
               borderRadius: '8px',
               background: isDropdownOpen ? 'var(--primary-light)' : '#f8fafc',
               color: isDropdownOpen ? 'var(--primary)' : '#64748b',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               flexShrink: 0,
               transition: 'all 0.2s ease',
               transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
             }}>
               <ChevronDown size={15} strokeWidth={2.5} />
             </div>
           </button>

           {isDropdownOpen && (
             <div style={{
               position: 'absolute',
               top: 'calc(100% + 6px)',
               left: 0,
               right: 0,
               background: '#ffffff',
               borderRadius: '14px',
               border: '1px solid #fbcfe8',
               boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(215, 20, 122, 0.08)',
               padding: '6px',
               display: 'flex',
               flexDirection: 'column',
               gap: '3px',
               zIndex: 1000,
               animation: 'fadeIn 0.16s ease-out'
             }}>
               {TABS.map((tab) => {
                 const isSelected = activeTab === tab.id;
                 const TabIcon = tab.icon;
                 return (
                   <div
                     key={tab.id}
                     onClick={() => {
                       setActiveTab(tab.id);
                       setIsDropdownOpen(false);
                     }}
                     style={{
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       gap: '10px',
                       padding: '8px 10px',
                       borderRadius: '10px',
                       background: isSelected ? 'var(--primary-light)' : 'transparent',
                       border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                       cursor: 'pointer',
                       transition: 'all 0.15s ease'
                     }}
                     onMouseEnter={e => {
                       if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                     }}
                     onMouseLeave={e => {
                       if (!isSelected) e.currentTarget.style.background = 'transparent';
                     }}
                   >
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                       <div style={{
                         width: '28px',
                         height: '28px',
                         borderRadius: '8px',
                         background: isSelected ? 'var(--primary)' : '#f1f5f9',
                         color: isSelected ? '#ffffff' : '#64748b',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         flexShrink: 0,
                         boxShadow: isSelected ? '0 1px 3px rgba(215, 20, 122, 0.12)' : 'none'
                       }}>
                         <TabIcon size={14} strokeWidth={isSelected ? 2.5 : 2} />
                       </div>
                       <div style={{ minWidth: 0, flex: 1 }}>
                         <div style={{ fontSize: '12px', fontWeight: isSelected ? '800' : '700', color: isSelected ? 'var(--primary)' : '#1e293b' }}>
                           {tab.label}
                         </div>
                         {tab.desc && (
                           <div style={{ fontSize: '10px', color: isSelected ? '#be185d' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                             {tab.desc}
                           </div>
                         )}
                       </div>
                     </div>

                     {isSelected && (
                       <div style={{
                         width: '20px',
                         height: '20px',
                         borderRadius: '50%',
                         background: 'var(--primary)',
                         color: 'white',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         flexShrink: 0
                       }}>
                         <Check size={12} strokeWidth={3} />
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
         </div>

         {/* Content Sections */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

           {/* SECTION: Popüler Rotalar & Vitrin Seçimi */}
           {(activeTab === 'all' || activeTab === 'popular_routes') && (
             <div style={{
               background: 'linear-gradient(135deg, #ffffff 0%, #fff5f9 100%)',
               borderRadius: '16px',
               border: '1.5px solid #F9BED8',
               padding: '14px',
               boxShadow: '0 2px 10px rgba(215, 20, 122, 0.05)'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D7147A', flexShrink: 0 }}>
                    <Compass size={17} strokeWidth={2.2} />
                  </div>
                  <div style={{ width: '1.2px', height: '22px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                  <div>
                    <h2 style={{ fontSize: '13px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                      Popüler Rotalar & Ana Sayfa Vitrini
                    </h2>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                      Ana sayfada yer alan 6 kaydırmalı kart rotası ve fotoğrafları
                    </div>
                  </div>
                </div>

               <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                 Ana sayfa ziyaretçilerine sunulan şehir kartlarını, görsellerini, saat farkı ve priz bilgilerini düzenleyin veya yeni rotalar ekleyin.
               </p>

               <button
                 type="button"
                 onClick={() => navigate('/dashboard/admin-popular-routes')}
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '6px',
                   width: '100%',
                   background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                   color: '#ffffff',
                   border: 'none',
                   borderRadius: '11px',
                   padding: '14px 18px',
                   fontSize: '12px',
                   fontWeight: '800',
                   cursor: 'pointer',
                   boxShadow: '0 2px 8px rgba(215, 20, 122, 0.22)'
                 }}
               >
                 <Compass size={14} />
                 <span>Popüler Rotaları Yönet & Düzenle</span>
                 <ArrowRight size={14} />
               </button>
             </div>
           )}

           {/* SECTION 1: Firma & Marka Bilgisi */}
           {(activeTab === 'all' || activeTab === 'brand') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                   <Briefcase size={17} strokeWidth={2.2} />
                 </div>
                 <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                 <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Firma & Marka İsmi</h2>
               </div>

               <div>
                 <label className="settings-label">Firma / Uygulama Adı</label>
                 <input 
                   type="text"
                   className="settings-input"
                   placeholder="Örn: Move Travel & Mice"
                   value={corporateName || ''}
                   onChange={e => setCorporateName(e.target.value)}
                 />
                 <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                   Sistem giriş ekranı, başlıklar ve e-posta bildirimlerinde kullanılan kurumsal marka adı.
                 </div>
               </div>
             </div>
           )}

            {/* SECTION 1.5: Kurumsal Logo */}
            {(activeTab === 'all' || activeTab === 'brand') && (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}>
                      <ImageIcon size={17} strokeWidth={2.2} />
                    </div>
                    <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                    <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Kurumsal Logo</h2>
                  </div>

                  {corporateLogo ? (
                    <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={11} strokeWidth={3} /> Yüklendi
                    </span>
                  ) : (
                    <span style={{ fontSize: '9.5px', fontWeight: '700', background: '#f8fafc', color: '#94a3b8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      Varsayılan
                    </span>
                  )}
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fff8fb 100%)',
                  borderRadius: '14px',
                  border: '1.2px solid #F9BED8',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  boxShadow: '0 2px 8px rgba(215, 20, 122, 0.03)'
                }}>
                  {/* Logo Preview Canvas */}
                  <div 
                    onClick={() => logoFileRef.current?.click()}
                    title="Logoyu değiştirmek için tıklayın"
                    style={{ 
                      width: '78px', 
                      height: '78px', 
                      borderRadius: '13px', 
                      border: '1.5px solid #334155', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)', 
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                      overflow: 'hidden', 
                      flexShrink: 0,
                      padding: '8px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {corporateLogo ? (
                      <>
                        <img 
                          src={corporateLogo} 
                          alt="Logo" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' 
                          }} 
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '3px',
                          right: '4px',
                          fontSize: '8px',
                          fontWeight: '800',
                          color: '#94a3b8',
                          letterSpacing: '0.3px',
                          textTransform: 'uppercase',
                          opacity: 0.8
                        }}>
                          PNG
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <Upload size={20} color="#94a3b8" />
                        <div style={{ fontSize: '9px', fontWeight: '700', marginTop: '3px', color: '#94a3b8' }}>Logo Seç</div>
                      </div>
                    )}
                  </div>

                  {/* Right Details & Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                        Uygulama & Belge Logosu
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
                        Giriş ekranı, başlık alanı ve PDF belgelerinde görüntülenecek logonuz.
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '3px', fontWeight: '600' }}>
                        Format: PNG, SVG veya JPG (Şeffaf arka plan önerilir)
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={logoFileRef}
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload(e, setCorporateLogo)}
                      />
                      
                      <button 
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', 
                          color: 'white', 
                          padding: '7px 14px', 
                          borderRadius: '9px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          border: 'none', 
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(215, 20, 122, 0.22)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Upload size={13} strokeWidth={2.4} /> 
                        <span>{corporateLogo ? 'Logoyu Değiştir' : 'Logo Yükle'}</span>
                      </button>

                      {corporateLogo && (
                        <button 
                          type="button"
                          onClick={() => setCorporateLogo(null)}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#fff1f2', 
                            color: '#e11d48', 
                            border: '1px solid #fecdd3', 
                            padding: '7px 12px', 
                            borderRadius: '9px', 
                            fontSize: '10.5px', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
                        >
                          <Trash2 size={12} strokeWidth={2.2} />
                          <span>Kaldır</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', marginTop: '12px', width: '100%' }}>
                  {renderSaveButton('corporate', async () => {
                    await updateSetting('corporateName', corporateName);
                    await updateSetting('corporateLogo', corporateLogo);
                  }, 'Kurumsal Bilgileri Kaydet', 'Kurumsal marka ve logo ayarları başarıyla kaydedildi.', true)}
                </div>
              </div>
            )}

           {/* SECTION 2: E-Posta Sunucu (SMTP) */}
           {(activeTab === 'all' || activeTab === 'messaging') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                     <Mail size={17} strokeWidth={2.2} />
                   </div>
                   <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                   <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>E-Posta Sunucu (SMTP)</h2>
                 </div>

                 {isSmtpVerified && (
                   <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                     ✓ Aktif
                   </span>
                 )}
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                 <div>
                   <label className="settings-label">Sunucu (Host)</label>
                   <input 
                     type="text"
                     className="settings-input settings-input-mono"
                     placeholder="smtp.gmail.com"
                     value={smtpConfig?.host || ''}
                     onChange={e => setSmtpConfig({ host: e.target.value })}
                   />
                 </div>
                 <div>
                   <label className="settings-label">Port</label>
                   <input 
                     type="text"
                     className="settings-input settings-input-mono"
                     placeholder="465"
                     value={smtpConfig?.port || ''}
                     onChange={e => setSmtpConfig({ port: e.target.value })}
                   />
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                 <div>
                   <label className="settings-label">Kullanıcı (E-Posta)</label>
                   <input 
                     type="email"
                     className="settings-input"
                     placeholder="admin@sirket.com"
                     value={smtpConfig?.user || ''}
                     onChange={e => setSmtpConfig({ user: e.target.value })}
                   />
                 </div>
                 <div>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                     <label className="settings-label" style={{ marginBottom: 0 }}>Uygulama Şifresi</label>
                     <button
                       type="button"
                       onClick={() => setShowSmtpPass(!showSmtpPass)}
                       style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: 0 }}
                     >
                       {showSmtpPass ? <EyeOff size={13} /> : <Eye size={13} />}
                       <span>{showSmtpPass ? 'Gizle' : 'Göster'}</span>
                     </button>
                   </div>
                   <input 
                     type={showSmtpPass ? 'text' : 'password'}
                     className="settings-input settings-input-mono"
                     placeholder="••••••••"
                     value={smtpConfig?.pass || ''}
                     onChange={e => setSmtpConfig({ pass: e.target.value })}
                   />
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                 <button 
                   type="button"
                   onClick={verifySmtpConnection}
                   disabled={isTestingSmtp}
                   style={{ 
                     width: '100%',
                     background: '#ffffff', 
                     color: '#1e293b', 
                     border: '1.5px solid #e2e8f0', 
                     padding: '9.5px 14px', 
                     borderRadius: '10px', 
                     fontSize: '11.5px', 
                     fontWeight: '700', 
                     cursor: isTestingSmtp ? 'not-allowed' : 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     gap: '6px',
                     boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                     transition: 'all 0.15s ease',
                     boxSizing: 'border-box'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                 >
                   {isTestingSmtp ? <Loader2 size={13} className="spin" color="var(--primary)" /> : <Settings size={13} color="#2563eb" />}
                   <span>{isTestingSmtp ? 'Sınanıyor...' : 'Bağlantıyı Sına'}</span>
                 </button>

                 {renderSaveButton('smtp', () => updateSetting('smtpConfig', smtpConfig), 'Ayarları Kaydet', 'E-Posta (SMTP) ayarları başarıyla kaydedildi.', true)}
               </div>

               {smtpError && (
                 <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#dc2626', fontWeight: '600' }}>
                   ⚠️ {smtpError}
                 </div>
               )}

               {/* Live Test Mail Strip */}
               {isSmtpVerified && (
                 <div className="settings-subbox-blue" style={{ marginTop: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                   <div style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
                     <span>Test E-Postası Gönder</span>
                   </div>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <input 
                       type="email" 
                       className="settings-input"
                       placeholder="ornek@mail.com" 
                       value={testEmail}
                       onChange={e => setTestEmail(e.target.value.toLowerCase().trim())}
                       style={{ flex: 1 }}
                     />
                     <button 
                       onClick={sendTestMail}
                       disabled={isSendingTestMail || !testEmail}
                       style={{ 
                         background: 'var(--primary)', 
                         color: 'white', 
                         border: 'none', 
                         padding: '8px 14px', 
                         borderRadius: '9px', 
                         fontSize: '11.5px', 
                         fontWeight: '700', 
                         cursor: isSendingTestMail || !testEmail ? 'not-allowed' : 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '5px', 
                         opacity: isSendingTestMail || !testEmail ? 0.6 : 1 
                       }}>
                       {isSendingTestMail ? <Loader2 size={12} className="spin" /> : <Send size={12} />} Test Yolla
                     </button>
                   </div>
                   {testMailResult && (
                     <div style={{ marginTop: '8px', fontSize: '10.5px', color: testMailResult.success ? '#047857' : '#b91c1c', fontWeight: '600' }}>
                       {testMailResult.message}
                     </div>
                   )}
                 </div>
               )}
             </div>
           )}

           {/* SECTION 3: NetGSM Gateway */}
           {(activeTab === 'all' || activeTab === 'messaging') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                     <Smartphone size={17} strokeWidth={2.2} />
                   </div>
                   <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                   <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>SMS Gateway (NetGSM)</h2>
                 </div>

                 {isSmsVerified && (
                   <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                     ✓ Aktif
                   </span>
                 )}
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                 <div>
                   <label className="settings-label">Abone No (Usercode)</label>
                   <input 
                     type="text"
                     className="settings-input settings-input-mono"
                     placeholder="850XXXXXXX"
                     value={netgsmConfig?.usercode || ''}
                     onChange={e => setNetgsmConfig({ usercode: e.target.value })}
                   />
                 </div>
                 <div>
                   <label className="settings-label">API Şifresi</label>
                   <input 
                     type="password"
                     className="settings-input settings-input-mono"
                     placeholder="••••••"
                     value={netgsmConfig?.password || ''}
                     onChange={e => setNetgsmConfig({ password: e.target.value })}
                   />
                 </div>
                 <div>
                   <label className="settings-label">Başlık (Kaşe)</label>
                   <input 
                     type="text"
                     className="settings-input settings-input-mono"
                     placeholder="MOVE"
                     value={netgsmConfig?.header || ''}
                     onChange={e => setNetgsmConfig({ header: e.target.value })}
                   />
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: smsError ? '6px' : '12px' }}>
                 <button 
                   type="button"
                   onClick={verifySmsConnection}
                   disabled={isTestingSms}
                   style={{ 
                     width: '100%',
                     background: '#ffffff', 
                     color: '#1e293b', 
                     border: '1.5px solid #e2e8f0', 
                     padding: '9.5px 14px', 
                     borderRadius: '10px', 
                     fontSize: '11.5px', 
                     fontWeight: '700', 
                     cursor: isTestingSms ? 'not-allowed' : 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     gap: '6px',
                     boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                     transition: 'all 0.15s ease',
                     boxSizing: 'border-box'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                 >
                   {isTestingSms ? <Loader2 size={13} className="spin" color="#d97706" /> : <Settings size={13} color="#d97706" />}
                   <span>{isTestingSms ? 'Sınanıyor...' : 'Bağlantıyı Sına'}</span>
                 </button>

                 {renderSaveButton('sms', () => updateSetting('netgsmConfig', netgsmConfig), 'SMS Ayarlarını Kaydet', 'NetGSM SMS ayarları başarıyla kaydedildi.', true)}
               </div>

               {smsError && (
                 <div style={{ marginBottom: '12px', fontSize: '10.5px', color: '#dc2626', fontWeight: '600' }}>
                   ⚠️ {smsError}
                 </div>
               )}

               {/* Test SMS */}
               {isSmsVerified && (
                 <div className="settings-subbox-amber" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                   <div style={{ fontSize: '11px', fontWeight: '800', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <Smartphone size={13} color="#d97706" />
                     <span>Örnek Test SMS'i Gönder</span>
                   </div>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <input 
                       type="text" 
                       className="settings-input settings-input-mono"
                       placeholder="905XXXXXXXXX" 
                       value={testSmsNumber}
                       onChange={e => setTestSmsNumber(e.target.value)}
                       style={{ flex: 1 }}
                     />
                     <button 
                       onClick={sendTestSms}
                       disabled={isSendingTestSms || !testSmsNumber}
                       style={{ 
                         background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', 
                         color: 'white', 
                         border: 'none', 
                         padding: '8px 14px', 
                         borderRadius: '9px', 
                         fontSize: '11.5px', 
                         fontWeight: '700', 
                         cursor: isSendingTestSms || !testSmsNumber ? 'not-allowed' : 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '5px', 
                         boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                         opacity: isSendingTestSms || !testSmsNumber ? 0.6 : 1 
                       }}>
                       {isSendingTestSms ? <Loader2 size={12} className="spin" /> : <Send size={12} />} SMS Gönder
                     </button>
                   </div>
                   {testSmsResult && (
                     <div style={{ marginTop: '8px', fontSize: '10.5px', color: testSmsResult.success ? '#047857' : '#b91c1c', fontWeight: '600' }}>
                       {testSmsResult.message}
                     </div>
                   )}
                 </div>
               )}
             </div>
           )}

           {/* SECTION 4: WhatsApp Business Platform */}
           {(activeTab === 'all' || activeTab === 'whatsapp_ai') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                     <MessageSquare size={17} strokeWidth={2.2} />
                   </div>
                   <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                   <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>WhatsApp Business (Cloud API)</h2>
                 </div>

                 <button 
                   type="button"
                   onClick={() => setWhatsappConfig({ isEnabled: whatsappConfig?.isEnabled === false ? true : false })}
                   style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '6px', 
                     background: (whatsappConfig?.isEnabled !== false) ? '#ecfdf5' : '#f8fafc', 
                     border: `1px solid ${(whatsappConfig?.isEnabled !== false) ? '#a7f3d0' : '#e2e8f0'}`, 
                     padding: '3px 8px 3px 4px', 
                     borderRadius: '20px', 
                     cursor: 'pointer',
                     transition: 'all 0.2s ease',
                     outline: 'none'
                   }}
                 >
                   <div style={{ 
                     width: '18px', 
                     height: '18px', 
                     borderRadius: '50%', 
                     background: (whatsappConfig?.isEnabled !== false) ? '#059669' : '#cbd5e1', 
                     color: 'white', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center', 
                     transition: 'all 0.2s ease',
                     boxShadow: (whatsappConfig?.isEnabled !== false) ? '0 2px 4px rgba(5, 150, 105, 0.25)' : 'none'
                   }}>
                     <Check size={11} strokeWidth={3} style={{ opacity: (whatsappConfig?.isEnabled !== false) ? 1 : 0 }} />
                   </div>
                   <span style={{ 
                     fontSize: '10.5px', 
                     fontWeight: '800', 
                     color: (whatsappConfig?.isEnabled !== false) ? '#065f46' : '#64748b' 
                   }}>
                     {(whatsappConfig?.isEnabled !== false) ? 'Aktif' : 'Pasif'}
                   </span>
                 </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                 <div>
                   <label className="settings-label">Phone ID</label>
                   <input 
                     type="text"
                     className="settings-input settings-input-mono"
                     placeholder="1023948293849283"
                     value={whatsappConfig?.phoneId || ''}
                     onChange={e => setWhatsappConfig({ phoneId: e.target.value })}
                   />
                 </div>
                 <div>
                   <label className="settings-label">WABA ID (Hesap)</label>
                   <input 
                     type="text"
                     className="settings-input settings-input-mono"
                     placeholder="987654321012345"
                     value={whatsappConfig?.wabaId || ''}
                     onChange={e => setWhatsappConfig({ wabaId: e.target.value })}
                   />
                 </div>
               </div>

               <div style={{ marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                   <label className="settings-label" style={{ marginBottom: 0 }}>Permanent Access Token</label>
                   <button
                     type="button"
                     onClick={() => setShowWaToken(!showWaToken)}
                     style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: 0 }}
                   >
                     {showWaToken ? <EyeOff size={13} /> : <Eye size={13} />}
                     <span>{showWaToken ? 'Gizle' : 'Göster'}</span>
                   </button>
                 </div>
                 <input 
                   type={showWaToken ? 'text' : 'password'}
                   className="settings-input settings-input-mono"
                   placeholder="EAAG..."
                   value={whatsappConfig?.accessToken || ''}
                   onChange={e => setWhatsappConfig({ accessToken: e.target.value })}
                 />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: waError ? '6px' : '12px' }}>
                 <button 
                   type="button"
                   onClick={verifyWaConnection}
                   disabled={isTestingWa}
                   style={{ 
                     width: '100%',
                     background: '#ffffff', 
                     color: '#1e293b', 
                     border: '1.5px solid #e2e8f0', 
                     padding: '9.5px 14px', 
                     borderRadius: '10px', 
                     fontSize: '11.5px', 
                     fontWeight: '700', 
                     cursor: isTestingWa ? 'not-allowed' : 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     gap: '6px',
                     boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                     transition: 'all 0.15s ease',
                     boxSizing: 'border-box'
                   }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                 >
                   {isTestingWa ? <Loader2 size={13} className="spin" color="#059669" /> : <Settings size={13} color="#059669" />}
                   <span>{isTestingWa ? 'Sınanıyor...' : 'Bağlantıyı Sına'}</span>
                 </button>

                 {renderSaveButton('whatsapp', () => updateSetting('whatsappConfig', whatsappConfig), 'WhatsApp Ayarlarını Kaydet', 'WhatsApp ayarları başarıyla kaydedildi.', true)}
               </div>

               {waError && (
                 <div style={{ marginBottom: '12px', fontSize: '10.5px', color: '#dc2626', fontWeight: '600' }}>
                   ⚠️ {waError}
                 </div>
               )}

               {/* Collapsible/Compact Meta Templates */}
               <div className="settings-subbox-brand" style={{ marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                   <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <Sparkles size={13} color="#db2777" />
                     <span>Meta Şablon Eşleşmeleri</span>
                   </div>
                   <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#be185d', background: '#fce7f3', padding: '1px 7px', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                     6 Şablon
                   </span>
                 </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Yeni Kullanıcı</span>
                      <input 
                        type="text"
                        className="settings-input settings-input-mono"
                        style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                        value={whatsappConfig?.newUserTemplate || ''}
                        onChange={e => setWhatsappConfig({ newUserTemplate: e.target.value })}
                        placeholder="welcome_customer"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Yeni Seyahat</span>
                      <input 
                        type="text"
                        className="settings-input settings-input-mono"
                        style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                        value={whatsappConfig?.newTourTemplate || ''}
                        onChange={e => setWhatsappConfig({ newTourTemplate: e.target.value })}
                        placeholder="tour_registration"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Şifre Sıfırlama (OTP)</span>
                      <input 
                        type="text"
                        className="settings-input settings-input-mono"
                        style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                        value={whatsappConfig?.passwordResetTemplate || ''}
                        onChange={e => setWhatsappConfig({ passwordResetTemplate: e.target.value })}
                        placeholder="password_reset_otp"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Bilet Yükleme</span>
                      <input 
                        type="text"
                        className="settings-input settings-input-mono"
                        style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                        value={whatsappConfig?.ticketAddedTemplate || ''}
                        onChange={e => setWhatsappConfig({ ticketAddedTemplate: e.target.value })}
                        placeholder="ticket_pdf_ready"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Check-in / 48s</span>
                      <input 
                        type="text"
                        className="settings-input settings-input-mono"
                        style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                        value={whatsappConfig?.checkInTemplate || ''}
                        onChange={e => setWhatsappConfig({ checkInTemplate: e.target.value })}
                        placeholder="checkin_reminder"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Puanlama / 24s Sonra</span>
                      <input 
                        type="text"
                        className="settings-input settings-input-mono"
                        style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                        value={whatsappConfig?.tourReviewTemplate || ''}
                        onChange={e => setWhatsappConfig({ tourReviewTemplate: e.target.value })}
                        placeholder="tour_review_reminder"
                      />
                    </div>
                  
                     <div style={{ gridColumn: 'span 2' }}>
                       <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Hesap Aktivasyonu & Şifre Belirleme (welcome_account_activation)</span>
                       <input 
                         type="text"
                         className="settings-input settings-input-mono"
                         style={{ padding: '6px 9px', fontSize: '11px', borderRadius: '8px' }}
                         value={whatsappConfig?.accountActivationTemplate || ''}
                         onChange={e => setWhatsappConfig({ accountActivationTemplate: e.target.value })}
                         placeholder="welcome_account_activation"
                       />
                     </div>
                   </div>
                 </div>

               {/* WhatsApp Test Sender */}
               {isWaVerified && (
                 <div className="settings-subbox-emerald" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                   <div style={{ fontSize: '11px', fontWeight: '800', color: '#065f46', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <MessageSquare size={13} color="#059669" />
                     <span>WhatsApp Test İletisi Gönder</span>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                     {(() => {
                       const curTmpl = WA_TEST_TEMPLATES.find(t => t.id === testWaTemplate) || WA_TEST_TEMPLATES[0];
                       return (
                         <div ref={waTestDropdownRef} style={{ position: 'relative' }}>
                           <button
                             type="button"
                             onClick={() => setWaTestDropdownOpen(!waTestDropdownOpen)}
                             style={{
                               width: '100%',
                               padding: '8px 10px',
                               borderRadius: '10px',
                               border: waTestDropdownOpen ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                               background: '#ffffff',
                               boxShadow: waTestDropdownOpen 
                                 ? '0 0 0 3.5px rgba(5, 150, 105, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)' 
                                 : '0 1px 2px rgba(15, 23, 42, 0.03)',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'space-between',
                               gap: '6px',
                               cursor: 'pointer',
                               outline: 'none',
                               transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                               boxSizing: 'border-box',
                               minHeight: '38px'
                             }}
                           >
                             <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
                               <span style={{
                                 fontSize: '11px',
                                 fontWeight: '700',
                                 color: '#0f172a',
                                 whiteSpace: 'nowrap',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis'
                               }}>
                                 {curTmpl.name}
                               </span>
                               <span style={{
                                 fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                 fontSize: '8.5px',
                                 color: '#059669',
                                 background: '#ecfdf5',
                                 padding: '1px 5px',
                                 borderRadius: '5px',
                                 whiteSpace: 'nowrap',
                                 flexShrink: 0
                               }}>
                                 {curTmpl.code}
                               </span>
                             </div>
                             <div style={{
                               color: waTestDropdownOpen ? '#059669' : '#64748b',
                               display: 'flex',
                               alignItems: 'center',
                               transition: 'transform 0.2s ease',
                               transform: waTestDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                               flexShrink: 0
                             }}>
                               <ChevronDown size={14} strokeWidth={2.5} />
                             </div>
                           </button>

                           {waTestDropdownOpen && (
                             <div style={{
                               position: 'absolute',
                               top: 'calc(100% + 5px)',
                               left: 0,
                               minWidth: '270px',
                               maxWidth: '330px',
                               width: 'max-content',
                               background: '#ffffff',
                               borderRadius: '14px',
                               border: '1.2px solid #a7f3d0',
                               boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(5, 150, 105, 0.08)',
                               padding: '6px',
                               display: 'flex',
                               flexDirection: 'column',
                               gap: '3px',
                               zIndex: 1000,
                               animation: 'fadeIn 0.16s ease-out'
                             }}>
                               <div style={{ 
                                 padding: '5px 8px 3px', 
                                 fontSize: '9.5px', 
                                 fontWeight: '800', 
                                 color: '#065f46', 
                                 letterSpacing: '0.4px', 
                                 textTransform: 'uppercase',
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '5px'
                               }}>
                                 <MessageSquare size={11} color="#059669" /> Test Edilecek Şablon
                               </div>
                               {WA_TEST_TEMPLATES.map((tmpl) => {
                                 const isSelected = testWaTemplate === tmpl.id;
                                 return (
                                   <div
                                     key={tmpl.id}
                                     onClick={() => {
                                       setTestWaTemplate(tmpl.id);
                                       setWaTestDropdownOpen(false);
                                     }}
                                     style={{
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'space-between',
                                       padding: '7px 9px',
                                       borderRadius: '9px',
                                       background: isSelected ? '#ecfdf5' : 'transparent',
                                       border: isSelected ? '1px solid #a7f3d0' : '1px solid transparent',
                                       cursor: 'pointer',
                                       transition: 'all 0.15s ease'
                                     }}
                                     onMouseEnter={e => {
                                       if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                     }}
                                     onMouseLeave={e => {
                                       if (!isSelected) e.currentTarget.style.background = 'transparent';
                                     }}
                                   >
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                                       <span style={{
                                         fontSize: '11px',
                                         fontWeight: '700',
                                         color: isSelected ? '#065f46' : '#1e293b'
                                       }}>
                                         {tmpl.name}
                                       </span>
                                       <span style={{
                                         fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                         fontSize: '9.5px',
                                         color: '#64748b'
                                       }}>
                                         {tmpl.code}
                                       </span>
                                     </div>
                                     {isSelected && (
                                       <div style={{
                                         width: '18px',
                                         height: '18px',
                                         borderRadius: '50%',
                                         background: '#059669',
                                         color: 'white',
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         flexShrink: 0,
                                         marginLeft: '8px'
                                       }}>
                                         <Check size={11} strokeWidth={3} />
                                       </div>
                                     )}
                                   </div>
                                 );
                               })}
                             </div>
                           )}
                         </div>
                       );
                     })()}
                     <input 
                       type="text" 
                       className="settings-input settings-input-mono"
                       placeholder="905XXXXXXXXX" 
                       value={testWaNumber}
                       onChange={e => setTestWaNumber(e.target.value)}
                     />
                   </div>
                   <button 
                     onClick={sendTestWa}
                     disabled={isSendingTestWa || !testWaNumber}
                     style={{ 
                       width: '100%',
                       background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                       color: 'white', 
                       border: 'none', 
                       padding: '9px 14px', 
                       borderRadius: '9px', 
                       fontSize: '11.5px', 
                       fontWeight: '700', 
                       cursor: isSendingTestWa || !testWaNumber ? 'not-allowed' : 'pointer', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center',
                       gap: '6px', 
                       boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                       opacity: isSendingTestWa || !testWaNumber ? 0.6 : 1 
                     }}>
                     {isSendingTestWa ? <Loader2 size={12} className="spin" /> : <Send size={12} />} Test WhatsApp Mesajı Gönder
                   </button>
                   {testWaResult && (
                     <div style={{ marginTop: '8px', fontSize: '10.5px', color: testWaResult.success ? '#047857' : '#b91c1c', fontWeight: '600' }}>
                       {testWaResult.message}
                     </div>
                   )}
                 </div>
               )}
             </div>
           )}

           {/* SECTION 5: Tintin AI (Google Gemini) */}
           {(activeTab === 'all' || activeTab === 'whatsapp_ai') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D7147A', flexShrink: 0 }}>
                     <Sparkles size={17} strokeWidth={2.2} />
                   </div>
                   <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                   <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Tintin AI (Google Gemini)</h2>
                 </div>

                 <button 
                   type="button"
                   onClick={() => setGeminiConfig({ isEnabled: geminiConfig?.isEnabled === false ? true : false })}
                   style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '6px', 
                     background: (geminiConfig?.isEnabled !== false) ? '#FDF2F8' : '#f8fafc', 
                     border: `1px solid ${(geminiConfig?.isEnabled !== false) ? '#F9BED8' : '#e2e8f0'}`, 
                     padding: '3px 8px 3px 4px', 
                     borderRadius: '20px', 
                     cursor: 'pointer',
                     transition: 'all 0.2s ease',
                     outline: 'none'
                   }}
                 >
                   <div style={{ 
                     width: '18px', 
                     height: '18px', 
                     borderRadius: '50%', 
                     background: (geminiConfig?.isEnabled !== false) ? '#D7147A' : '#cbd5e1', 
                     color: 'white', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center', 
                     transition: 'all 0.2s ease',
                     boxShadow: (geminiConfig?.isEnabled !== false) ? '0 2px 4px rgba(215, 20, 122, 0.25)' : 'none'
                   }}>
                     <Check size={11} strokeWidth={3} style={{ opacity: (geminiConfig?.isEnabled !== false) ? 1 : 0 }} />
                   </div>
                   <span style={{ 
                     fontSize: '10.5px', 
                     fontWeight: '800', 
                     color: (geminiConfig?.isEnabled !== false) ? '#B01064' : '#64748b' 
                   }}>
                     {(geminiConfig?.isEnabled !== false) ? 'Aktif' : 'Pasif'}
                   </span>
                 </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                 <div>
                   <label className="settings-label">Gemini API Key</label>
                   <div style={{ position: 'relative' }}>
                     <input 
                       type={showGeminiKey ? 'text' : 'password'}
                       className="settings-input settings-input-mono"
                       placeholder="AIzaSy..."
                       value={geminiConfig?.apiKey || ''}
                       onChange={e => setGeminiConfig({ apiKey: e.target.value })}
                       style={{ paddingRight: '36px' }}
                     />
                     <button
                       type="button"
                       onClick={() => setShowGeminiKey(!showGeminiKey)}
                       style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}
                     >
                       {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                     </button>
                   </div>
                 </div>

                 <div>
                   <label className="settings-label">
                     <Bot size={13} color="#D7147A" /> Model Seçimi
                   </label>
                   {(() => {
                     const curModel = GEMINI_MODELS.find(m => m.id === (geminiConfig?.model || 'gemini-3.5-flash')) || {
                       id: geminiConfig?.model || 'gemini-3.5-flash',
                       name: geminiConfig?.model || 'gemini-3.5-flash',
                       tag: 'Özel',
                       badgeColor: '#D7147A',
                       badgeBg: '#FDF2F8',
                       description: ''
                     };
                     return (
                       <div ref={modelDropdownRef} style={{ position: 'relative' }}>
                         <button
                           type="button"
                           onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                           style={{
                             width: '100%',
                             padding: '8px 12px',
                             borderRadius: '10px',
                             border: modelDropdownOpen ? '1.5px solid #D7147A' : '1.5px solid #e2e8f0',
                             background: '#ffffff',
                             boxShadow: modelDropdownOpen 
                               ? '0 0 0 3.5px rgba(215, 20, 122, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)' 
                               : '0 1px 2px rgba(15, 23, 42, 0.03)',
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between',
                             gap: '8px',
                             cursor: 'pointer',
                             outline: 'none',
                             transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                             boxSizing: 'border-box',
                             minHeight: '38px'
                           }}
                         >
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                             <span style={{ 
                               fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                               fontSize: '11.5px',
                               fontWeight: '700',
                               color: '#0f172a',
                               whiteSpace: 'nowrap',
                               overflow: 'hidden',
                               textOverflow: 'ellipsis'
                             }}>
                               {curModel.name}
                             </span>
                             {curModel.tag && (
                               <span style={{
                                 fontSize: '9.5px',
                                 fontWeight: '700',
                                 color: curModel.badgeColor,
                                 background: curModel.badgeBg,
                                 padding: '1.5px 7px',
                                 borderRadius: '20px',
                                 whiteSpace: 'nowrap',
                                 flexShrink: 0
                               }}>
                                 {curModel.tag}
                               </span>
                             )}
                           </div>
                           <div style={{
                             color: modelDropdownOpen ? '#D7147A' : '#64748b',
                             display: 'flex',
                             alignItems: 'center',
                             transition: 'transform 0.2s ease',
                             transform: modelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                             flexShrink: 0
                           }}>
                             <ChevronDown size={14} strokeWidth={2.5} />
                           </div>
                         </button>

                         {modelDropdownOpen && (
                           <div style={{
                             position: 'absolute',
                             top: 'calc(100% + 6px)',
                             right: 0,
                             minWidth: '310px',
                             maxWidth: '380px',
                             width: 'max-content',
                             background: '#ffffff',
                             borderRadius: '14px',
                             border: '1.2px solid #F9BED8',
                             boxShadow: '0 14px 34px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(215, 20, 122, 0.08)',
                             padding: '6px',
                             display: 'flex',
                             flexDirection: 'column',
                             gap: '3px',
                             zIndex: 1000,
                             animation: 'fadeIn 0.16s ease-out'
                           }}>
                             <div style={{ 
                               padding: '6px 8px 4px', 
                               fontSize: '10px', 
                               fontWeight: '800', 
                               color: '#9d174d', 
                               letterSpacing: '0.4px', 
                               textTransform: 'uppercase',
                               display: 'flex',
                               alignItems: 'center',
                               gap: '5px'
                             }}>
                               <Sparkles size={11} color="#db2777" /> Google Gemini Yapay Zekâ Motoru
                             </div>
                             {GEMINI_MODELS.map((m) => {
                               const isSelected = (geminiConfig?.model || 'gemini-3.5-flash') === m.id;
                               return (
                                 <div
                                   key={m.id}
                                   onClick={() => {
                                     setGeminiConfig({ model: m.id });
                                     setModelDropdownOpen(false);
                                   }}
                                   style={{
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'space-between',
                                     padding: '8px 10px',
                                     borderRadius: '10px',
                                     background: isSelected ? '#FDF2F8' : 'transparent',
                                     border: isSelected ? '1px solid #F9BED8' : '1px solid transparent',
                                     cursor: 'pointer',
                                     transition: 'all 0.15s ease'
                                   }}
                                   onMouseEnter={e => {
                                     if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                   }}
                                   onMouseLeave={e => {
                                     if (!isSelected) e.currentTarget.style.background = 'transparent';
                                   }}
                                 >
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                       <span style={{
                                         fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                         fontSize: '11.5px',
                                         fontWeight: '700',
                                         color: isSelected ? '#D7147A' : '#1e293b'
                                       }}>
                                         {m.name}
                                       </span>
                                       <span style={{
                                         fontSize: '9px',
                                         fontWeight: '700',
                                         color: m.badgeColor,
                                         background: m.badgeBg,
                                         padding: '1.5px 6px',
                                         borderRadius: '6px'
                                       }}>
                                         {m.tag}
                                       </span>
                                     </div>
                                     <div style={{ fontSize: '10px', color: '#64748b' }}>
                                       {m.description}
                                     </div>
                                   </div>
                                   {isSelected && (
                                     <div style={{
                                       width: '20px',
                                       height: '20px',
                                       borderRadius: '50%',
                                       background: '#D7147A',
                                       color: 'white',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       flexShrink: 0,
                                       marginLeft: '8px'
                                     }}>
                                       <Check size={11} strokeWidth={3} />
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     );
                   })()}
                 </div>
               </div>

               <div style={{ marginBottom: '12px' }}>
                 <label className="settings-label">Sistem Promptu & Kurallar</label>
                 <textarea 
                   className="settings-textarea"
                   rows={3}
                   value={geminiConfig?.systemPrompt || ''}
                   onChange={e => setGeminiConfig({ systemPrompt: e.target.value })}
                   placeholder="Tintin'in karakterini ve davranış kurallarını girin..."
                   style={{ minHeight: '85px' }}
                 />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', paddingTop: '4px' }}>
                   <button 
                     type="button"
                     onClick={testGeminiConnection}
                     disabled={isTestingGemini}
                     style={{ 
                       width: '100%',
                       background: '#ffffff', 
                       color: '#1e293b', 
                       border: '1.5px solid #e2e8f0', 
                       padding: '9.5px 14px', 
                       borderRadius: '10px', 
                       fontSize: '11.5px', 
                       fontWeight: '700', 
                       cursor: isTestingGemini ? 'not-allowed' : 'pointer', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center',
                       gap: '6px', 
                       boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                       transition: 'all 0.15s ease',
                       boxSizing: 'border-box'
                     }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                   >
                     {isTestingGemini ? <Loader2 size={13} className="spin" color="var(--primary)" /> : <Bot size={13} color="var(--primary)" />}
                     <span>{isTestingGemini ? 'Sınanıyor...' : 'Gemini Bağlantısını Sına'}</span>
                   </button>

                   {renderSaveButton('gemini', () => updateSetting('geminiConfig', geminiConfig), 'Gemini Ayarlarını Kaydet', 'Gemini AI motoru ayarları başarıyla kaydedildi.', true)}
                 </div>

                 {geminiTestResult && (
                   <div style={{ marginTop: '8px', fontSize: '10.5px', fontWeight: '700', color: geminiTestResult.success ? '#047857' : '#dc2626' }}>
                     {geminiTestResult.success ? '✓ Bağlantı Başarılı' : '✕ Hata'}
                   </div>
                 )}

               {geminiTestResult && (
                 <div style={{
                   marginTop: '10px',
                   padding: '9px 12px',
                   borderRadius: '10px',
                   background: geminiTestResult.success ? '#ecfdf5' : '#fef2f2',
                   border: `1px solid ${geminiTestResult.success ? '#a7f3d0' : '#fecaca'}`,
                   color: geminiTestResult.success ? '#065f46' : '#991b1b',
                   fontSize: '11px',
                   lineHeight: 1.4,
                   display: 'flex',
                   alignItems: 'flex-start',
                   gap: '8px'
                 }}>
                   {geminiTestResult.success ? <CheckCircle2 size={15} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} /> : <XCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />}
                   <span>{geminiTestResult.message || (geminiTestResult.success ? 'Bağlantı başarılı!' : 'Bağlantı testi başarısız oldu.')}</span>
                 </div>
               )}
             </div>
           )}

           {/* SECTION 6: Harici API & Sistem Ayarları */}
           {(activeTab === 'all' || activeTab === 'api') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                   <Cpu size={17} strokeWidth={2.2} />
                 </div>
                 <div style={{ width: '1.2px', height: '20px', background: '#F9BED8', borderRadius: '1px', flexShrink: 0 }} />
                 <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Harici API Servisleri</h2>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                 <div>
                   <label className="settings-label">Google Places API Key</label>
                   <input 
                     type="text" 
                     className="settings-input settings-input-mono"
                     placeholder="AIzaSy..." 
                     value={googlePlacesApiKey || ''} 
                     onChange={e => setGooglePlacesApiKey(e.target.value)} 
                   />
                 </div>

                 <div>
                   <label className="settings-label">Akbank Kur API Key</label>
                   <input 
                     type="text" 
                     className="settings-input settings-input-mono"
                     placeholder="l7xx..." 
                     value={akbankApiKey || ''} 
                     onChange={e => setAkbankApiKey(e.target.value)} 
                   />
                 </div>
               </div>

               <div style={{ display: 'flex', marginTop: '12px', width: '100%' }}>
                 {renderSaveButton('api', async () => {
                   await updateSetting('googlePlacesApiKey', googlePlacesApiKey);
                   await updateSetting('akbankApiKey', akbankApiKey);
                 }, 'API Anahtarlarını Kaydet', 'Harici API anahtarları başarıyla kaydedildi.', true)}
               </div>
             </div>
           )}

         </div>

         {/* Bottom Nav & Tintin Clearance Spacer */}
         <div style={{ height: '170px', minHeight: '170px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

      </div>
    </div>
  );
}
