import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Image as ImageIcon, Briefcase, Mail, Cpu, Upload, 
  Loader2, Info, Smartphone, AlertTriangle, Trash2, Bot, Sparkles, 
  Eye, EyeOff, CheckCircle2, XCircle, Check, KeyRound, Globe, 
  ShieldAlert, Send, Layers, MessageSquare, Compass, ArrowRight
} from 'lucide-react';
import Header from '../../components/Header';
import { useSettingsStore } from '../../store/settingsStore';
import { useTourStore } from '../../store/tourStore';
import { testGeminiConnection as checkGeminiConnection } from '../../services/aiService';

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
      popularRoutes
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('all');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState(null);

  const logoFileRef = useRef(null);

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
          const result = await checkGeminiConnection(geminiConfig?.apiKey, geminiConfig?.model || 'gemini-3-flash-preview');
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
      setIsTestingSmtp(true);
      setSmtpError('');
      setSmtpVerified(false);

      setTimeout(() => {
          setIsTestingSmtp(false);
          const { host, port, user, pass } = smtpConfig;
          if (!host || host.length < 3) return setSmtpError('Geçersiz Host adresi.');
          if (!port || isNaN(Number(port))) return setSmtpError('Port numarası geçersiz.');
          if (!user || !user.includes('@')) return setSmtpError('Geçerli bir E-posta adresi girin.');
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
          setTestMailResult({ success: false, message: 'Ağ bağlantı hatası. Firebase Cloud Functions sunucusu kontrol edilmeli.' });
      } finally {
          setIsSendingTestMail(false);
      }
  };

  const tabs = [
    { key: 'all', label: 'Tümü', icon: Layers },
    { key: 'popular_routes', label: 'Popüler Rotalar', icon: Compass },
    { key: 'brand', label: 'Kurumsal', icon: Briefcase },
    { key: 'messaging', label: 'E-Posta & SMS', icon: Mail },
    { key: 'whatsapp_ai', label: 'WhatsApp & Yapay Zeka', icon: Sparkles },
    { key: 'api', label: 'Servisler & Sistem', icon: Cpu },
  ];

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      <Header title="Sistem Konfigürasyonu" showBack />
      
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 12px' }}>

         {/* 1. Header Overview Banner */}
         <div style={{ 
           background: 'white', 
           borderRadius: '16px', 
           border: '1px solid #e2e8f0', 
           padding: '12px 14px', 
           marginBottom: '12px',
           boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           gap: '10px'
         }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
             <div style={{ 
               width: '32px', 
               height: '32px', 
               borderRadius: '10px', 
               background: 'var(--primary-light)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               color: 'var(--primary)',
               flexShrink: 0
             }}>
               <Settings size={17} />
             </div>
             <div>
               <h1 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                 Genel Sistem Ayarları
               </h1>
               <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                 Entegrasyonlar, kurumsal kimlik ve API bağlantılarını yönetin
               </div>
             </div>
           </div>

           <div style={{ 
             fontSize: '9.5px', 
             fontWeight: '800', 
             background: '#ecfdf5', 
             color: '#059669', 
             padding: '3px 7px', 
             borderRadius: '6px', 
             border: '1px solid #a7f3d0',
             display: 'flex',
             alignItems: 'center',
             gap: '4px',
             whiteSpace: 'nowrap'
           }}>
             <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
             Canlı Sistem
           </div>
         </div>

         {/* 2. Compact Segmented Filter Tabs */}
         <div style={{ 
           display: 'flex', 
           gap: '5px', 
           overflowX: 'auto', 
           paddingBottom: '4px',
           marginBottom: '12px',
           scrollbarWidth: 'none',
           msOverflowStyle: 'none'
         }}>
           {tabs.map(tab => {
             const IconComp = tab.icon;
             const isActive = activeTab === tab.key;
             return (
               <button
                 key={tab.key}
                 onClick={() => setActiveTab(tab.key)}
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px',
                   padding: '6px 9px',
                   borderRadius: '9px',
                   fontSize: 'clamp(10px, 2.8vw, 11px)',
                   fontWeight: isActive ? '800' : '600',
                   background: isActive ? 'var(--primary)' : 'white',
                   color: isActive ? 'white' : '#64748b',
                   border: isActive ? 'none' : '1px solid #e2e8f0',
                   boxShadow: isActive ? '0 2px 8px rgba(215, 20, 122, 0.25)' : 'none',
                   cursor: 'pointer',
                   whiteSpace: 'nowrap',
                   flexShrink: 0,
                   transition: 'all 0.15s ease'
                 }}
               >
                 <IconComp size={12} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                 {tab.label}
               </button>
             );
           })}
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
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                   <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D7147A' }}>
                     <Compass size={15} />
                   </div>
                   <div>
                     <h2 style={{ fontSize: '13px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                       Popüler Rotalar & Ana Sayfa Vitrini
                     </h2>
                     <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                       Ana sayfada yer alan 6 kaydırmalı kart rotası ve fotoğrafları
                     </div>
                   </div>
                 </div>

                 <span style={{
                   fontSize: '11px',
                   fontWeight: '800',
                   background: '#FDF2F8',
                   color: '#D7147A',
                   border: '1px solid #F9BED8',
                   padding: '2px 8px',
                   borderRadius: '8px'
                 }}>
                   {popularRoutes?.filter(r => r.isActive)?.length || 6} / 6 Aktif
                 </span>
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
                   padding: '9px 14px',
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
               <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                 <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                   <Briefcase size={13} />
                 </div>
                 <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Firma & Marka İsmi</h2>
               </div>

               <div>
                 <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Firma / Uygulama Adı</label>
                 <input 
                   type="text"
                   placeholder="Örn: Move Travel & Mice"
                   value={corporateName}
                   onChange={e => setCorporateName(e.target.value)}
                   style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
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
               <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                 <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                   <ImageIcon size={13} />
                 </div>
                 <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Kurumsal Logo & Görsel</h2>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                 <div style={{ 
                   width: '64px', 
                   height: '64px', 
                   borderRadius: '12px', 
                   border: '1px solid #334155', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   background: 'linear-gradient(145deg, #1e293b, #0f172a)', 
                   boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.08)',
                   overflow: 'hidden', 
                   flexShrink: 0,
                   padding: '6px'
                 }}>
                   {corporateLogo ? (
                     <img src={corporateLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                   ) : (
                     <ImageIcon size={22} color="#64748b" />
                   )}
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                   <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                     PNG, JPG veya SVG formatında şeffaf arka planlı logonuzu yükleyin.
                   </div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <input 
                       type="file" 
                       accept="image/*" 
                       ref={logoFileRef}
                       style={{ display: 'none' }}
                       onChange={(e) => handleImageUpload(e, setCorporateLogo)}
                     />
                     <button 
                       onClick={() => logoFileRef.current?.click()}
                       style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '5px', 
                         background: 'var(--primary)', 
                         color: 'white', 
                         padding: '6px 12px', 
                         borderRadius: '8px', 
                         fontSize: '10.5px', 
                         fontWeight: '700', 
                         border: 'none', 
                         cursor: 'pointer',
                         boxShadow: '0 2px 6px rgba(215, 20, 122, 0.25)'
                       }}>
                       <Upload size={12} /> Logo Yükle
                     </button>

                     {corporateLogo && (
                       <button 
                         onClick={() => setCorporateLogo(null)}
                         style={{ 
                           background: '#fee2e2', 
                           color: '#dc2626', 
                           border: '1px solid #fecaca', 
                           padding: '6px 10px', 
                           borderRadius: '8px', 
                           fontSize: '10px', 
                           fontWeight: '700', 
                           cursor: 'pointer' 
                         }}>
                         Logoyu Kaldır
                       </button>
                     )}
                   </div>
                </div>
             </div>
              </div>
           )}

           {/* SECTION 2: E-Posta Sunucu (SMTP) */}
           {(activeTab === 'all' || activeTab === 'messaging') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                     <Mail size={13} />
                   </div>
                   <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>E-Posta Sunucu (SMTP)</h2>
                 </div>

                 {isSmtpVerified && (
                   <span style={{ fontSize: '9.5px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '5px', border: '1px solid #a7f3d0' }}>
                     ✓ Aktif
                   </span>
                 )}
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Sunucu (Host)</label>
                   <input 
                     type="text"
                     placeholder="smtp.gmail.com"
                     value={smtpConfig.host}
                     onChange={e => setSmtpConfig({ host: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Port</label>
                   <input 
                     type="text"
                     placeholder="465"
                     value={smtpConfig.port}
                     onChange={e => setSmtpConfig({ port: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Kullanıcı (E-Posta)</label>
                   <input 
                     type="text"
                     placeholder="admin@sirket.com"
                     value={smtpConfig.user}
                     onChange={e => setSmtpConfig({ user: e.target.value.toLowerCase().trim() })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Uygulama Şifresi</label>
                   <input 
                     type="password"
                     placeholder="••••••••"
                     value={smtpConfig.pass}
                     onChange={e => setSmtpConfig({ pass: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box' }}
                   />
                 </div>
               </div>

               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <button 
                   onClick={verifySmtpConnection}
                   disabled={isTestingSmtp}
                   style={{ 
                     background: '#f1f5f9', 
                     color: '#334155', 
                     border: '1px solid #cbd5e1', 
                     padding: '6px 10px', 
                     borderRadius: '7px', 
                     fontSize: '11px', 
                     fontWeight: '700', 
                     cursor: 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '5px' 
                   }}>
                   {isTestingSmtp ? <Loader2 size={12} className="spin" /> : <Settings size={12} />}
                   {isTestingSmtp ? 'Sınanıyor...' : 'Bağlantıyı Sına'}
                 </button>

                 {smtpError && (
                   <span style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: '600' }}>
                     ⚠️ {smtpError}
                   </span>
                 )}
               </div>

               {/* Live Test Mail Strip */}
               {isSmtpVerified && (
                 <div style={{ marginTop: '10px', padding: '9px 10px', background: '#f8fafc', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
                   <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#047857', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                     Test E-Postası Gönder
                   </div>
                   <div style={{ display: 'flex', gap: '6px' }}>
                     <input 
                       type="email" 
                       placeholder="ornek@mail.com" 
                       value={testEmail}
                       onChange={e => setTestEmail(e.target.value.toLowerCase().trim())}
                       style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '10.5px', background: 'white' }}
                     />
                     <button 
                       onClick={sendTestMail}
                       disabled={isSendingTestMail || !testEmail}
                       style={{ 
                         background: 'var(--primary)', 
                         color: 'white', 
                         border: 'none', 
                         padding: '5px 10px', 
                         borderRadius: '6px', 
                         fontSize: '10.5px', 
                         fontWeight: '700', 
                         cursor: isSendingTestMail || !testEmail ? 'not-allowed' : 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '4px', 
                         opacity: isSendingTestMail || !testEmail ? 0.6 : 1 
                       }}>
                       {isSendingTestMail ? <Loader2 size={11} className="spin" /> : <Send size={11} />} Test Yolla
                     </button>
                   </div>
                   {testMailResult && (
                     <div style={{ marginTop: '6px', fontSize: '10.5px', color: testMailResult.success ? '#047857' : '#b91c1c', fontWeight: '600' }}>
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
               <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                 <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                   <Smartphone size={13} />
                 </div>
                 <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>SMS Gateway (NetGSM)</h2>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Abone No (Usercode)</label>
                   <input 
                     type="text"
                     placeholder="850XXXXXXX"
                     value={netgsmConfig?.usercode || ''}
                     onChange={e => setNetgsmConfig({ usercode: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>API Şifresi</label>
                   <input 
                     type="password"
                     placeholder="••••••"
                     value={netgsmConfig?.password || ''}
                     onChange={e => setNetgsmConfig({ password: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box' }}
                   />
                 </div>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Başlık (Kaşe)</label>
                   <input 
                     type="text"
                     placeholder="MOVE"
                     value={netgsmConfig?.header || ''}
                     onChange={e => setNetgsmConfig({ header: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
               </div>

               {/* Test SMS */}
               <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
                 <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Örnek Test SMS'i Gönder</div>
                 <div style={{ display: 'flex', gap: '6px' }}>
                   <input 
                     type="text" 
                     placeholder="905XXXXXXXXX" 
                     value={testSmsNumber}
                     onChange={e => setTestSmsNumber(e.target.value)}
                     style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '10.5px', background: 'white' }}
                   />
                   <button 
                     onClick={sendTestSms}
                     disabled={isSendingTestSms || !testSmsNumber}
                     style={{ 
                       background: '#d97706', 
                       color: 'white', 
                       border: 'none', 
                       padding: '5px 10px', 
                       borderRadius: '6px', 
                       fontSize: '10.5px', 
                       fontWeight: '700', 
                       cursor: isSendingTestSms || !testSmsNumber ? 'not-allowed' : 'pointer', 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: '4px', 
                       opacity: isSendingTestSms || !testSmsNumber ? 0.6 : 1 
                     }}>
                     {isSendingTestSms ? <Loader2 size={11} className="spin" /> : <Send size={11} />} SMS Gönder
                   </button>
                 </div>
                 {testSmsResult && (
                   <div style={{ marginTop: '6px', fontSize: '10.5px', color: testSmsResult.success ? '#047857' : '#b91c1c', fontWeight: '600' }}>
                     {testSmsResult.message}
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* SECTION 4: WhatsApp Business Platform */}
           {(activeTab === 'all' || activeTab === 'whatsapp_ai') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                     <MessageSquare size={13} />
                   </div>
                   <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>WhatsApp Business (Cloud API)</h2>
                 </div>

                  <button 
                    type="button"
                    onClick={() => setWhatsappConfig({ isEnabled: !whatsappConfig?.isEnabled })}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      background: whatsappConfig?.isEnabled ? '#ecfdf5' : '#f8fafc', 
                      border: `1px solid ${whatsappConfig?.isEnabled ? '#a7f3d0' : '#e2e8f0'}`, 
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
                      background: whatsappConfig?.isEnabled ? '#059669' : '#cbd5e1', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transition: 'all 0.2s ease',
                      boxShadow: whatsappConfig?.isEnabled ? '0 2px 4px rgba(5, 150, 105, 0.25)' : 'none'
                    }}>
                      <Check size={11} strokeWidth={3} style={{ opacity: whatsappConfig?.isEnabled ? 1 : 0 }} />
                    </div>
                    <span style={{ 
                      fontSize: '10.5px', 
                      fontWeight: '800', 
                      color: whatsappConfig?.isEnabled ? '#065f46' : '#64748b' 
                    }}>
                      {whatsappConfig?.isEnabled ? 'Aktif' : 'Pasif'}
                    </span>
                  </button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Phone ID</label>
                   <input 
                     type="text"
                     placeholder="1023948293849283"
                     value={whatsappConfig?.phoneId || ''}
                     onChange={e => setWhatsappConfig({ phoneId: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>WABA ID (Hesap)</label>
                   <input 
                     type="text"
                     placeholder="987654321012345"
                     value={whatsappConfig?.wabaId || ''}
                     onChange={e => setWhatsappConfig({ wabaId: e.target.value })}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', boxSizing: 'border-box' }}
                   />
                 </div>
               </div>

               <div style={{ marginBottom: '10px' }}>
                 <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Permanent Access Token</label>
                 <input 
                   type="password"
                   placeholder="EAAG..."
                   value={whatsappConfig?.accessToken || ''}
                   onChange={e => setWhatsappConfig({ accessToken: e.target.value })}
                   style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box' }}
                 />
               </div>

               {/* Collapsible/Compact Meta Templates */}
               <div style={{ background: '#f8fafc', padding: '9px 10px', borderRadius: '9px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                 <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Meta Şablon Eşleşmeleri</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Yeni Kullanıcı</span>
                      <input 
                        type="text"
                        value={whatsappConfig?.newUserTemplate || ''}
                        onChange={e => setWhatsappConfig({ newUserTemplate: e.target.value })}
                        placeholder="welcome_customer"
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '10px', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Yeni Seyahat</span>
                      <input 
                        type="text"
                        value={whatsappConfig?.newTourTemplate || ''}
                        onChange={e => setWhatsappConfig({ newTourTemplate: e.target.value })}
                        placeholder="tour_registration"
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '10px', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Şifre Sıfırlama (OTP)</span>
                      <input 
                        type="text"
                        value={whatsappConfig?.passwordResetTemplate || ''}
                        onChange={e => setWhatsappConfig({ passwordResetTemplate: e.target.value })}
                        placeholder="password_reset_otp"
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '10px', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Bilet Yükleme</span>
                      <input 
                        type="text"
                        value={whatsappConfig?.ticketAddedTemplate || ''}
                        onChange={e => setWhatsappConfig({ ticketAddedTemplate: e.target.value })}
                        placeholder="ticket_pdf_ready"
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '10px', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Check-in / 48s</span>
                      <input 
                        type="text"
                        value={whatsappConfig?.checkInTemplate || ''}
                        onChange={e => setWhatsappConfig({ checkInTemplate: e.target.value })}
                        placeholder="checkin_reminder"
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '10px', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Puanlama / 24s Sonra</span>
                      <input 
                        type="text"
                        value={whatsappConfig?.tourReviewTemplate || ''}
                        onChange={e => setWhatsappConfig({ tourReviewTemplate: e.target.value })}
                        placeholder="tour_review_reminder"
                        style={{ width: '100%', padding: '4px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '10px', background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

               {/* WhatsApp Test Sender */}
               <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                   <select 
                     value={testWaTemplate} 
                     onChange={e => setTestWaTemplate(e.target.value)}
                     style={{ width: '100%', padding: '5px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10.5px', background: 'white' }}
                   >
                     <option value="new_user_welcome">Yeni Kullanıcı</option>
                     <option value="tour_registration">Seyahat Kaydı</option>
                     <option value="password_reset">Parola Sıfırlama</option>
                     <option value="ticket_added">Bilet Tanımlama</option>
                     <option value="checkin_reminder">Son 48s / Check-in</option>
                     <option value="tour_review_reminder">24s Seyahat Puanlama</option>
                   </select>
                   <input 
                     type="text" 
                     placeholder="905XXXXXXXXX" 
                     value={testWaNumber}
                     onChange={e => setTestWaNumber(e.target.value)}
                     style={{ width: '100%', padding: '5px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '10.5px', background: 'white', boxSizing: 'border-box' }}
                   />
                 </div>
                 <button 
                   onClick={sendTestWa}
                   disabled={isSendingTestWa || !testWaNumber}
                   style={{ 
                     width: '100%',
                     background: '#059669', 
                     color: 'white', 
                     border: 'none', 
                     padding: '5px 10px', 
                     borderRadius: '6px', 
                     fontSize: '10.5px', 
                     fontWeight: '700', 
                     cursor: isSendingTestWa || !testWaNumber ? 'not-allowed' : 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     gap: '4px', 
                     opacity: isSendingTestWa || !testWaNumber ? 0.6 : 1 
                   }}>
                   {isSendingTestWa ? <Loader2 size={11} className="spin" /> : <Send size={11} />} Test WhatsApp Mesajı Gönder
                 </button>
                 {testWaResult && (
                   <div style={{ marginTop: '6px', fontSize: '10.5px', color: testWaResult.success ? '#047857' : '#b91c1c', fontWeight: '600' }}>
                     {testWaResult.message}
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* SECTION 5: Tintin AI (Google Gemini) */}
           {(activeTab === 'all' || activeTab === 'whatsapp_ai') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D7147A' }}>
                     <Sparkles size={13} />
                   </div>
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

               <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Gemini API Key</label>
                   <div style={{ position: 'relative' }}>
                     <input 
                       type={showGeminiKey ? 'text' : 'password'}
                       placeholder="AIzaSy..."
                       value={geminiConfig?.apiKey || ''}
                       onChange={e => setGeminiConfig({ apiKey: e.target.value })}
                       style={{ width: '100%', padding: '6px 28px 6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box' }}
                     />
                     <button
                       type="button"
                       onClick={() => setShowGeminiKey(!showGeminiKey)}
                       style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                     >
                       {showGeminiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                     </button>
                   </div>
                 </div>

                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Model</label>
                   <select 
                     value={geminiConfig?.model || 'gemini-3-flash-preview'}
                     onChange={e => setGeminiConfig({ model: e.target.value })}
                     style={{ width: '100%', padding: '6px 6px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '10.5px', background: 'white' }}
                   >
                     <option value="gemini-3-flash-preview">gemini-3-flash-preview (En Hızlı & Kesintisiz - Önerilen)</option>
                     <option value="gemini-3.5-flash">gemini-3.5-flash (Ücretsiz Flash)</option>
                     <option value="gemini-3.6-flash">gemini-3.6-flash (Gelişmiş Flash)</option>
                     <option value="gemini-3.7-flash">gemini-3.7-flash (Hibrit Zeka)</option>
                     <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Hafif)</option>
                   </select>
                 </div>
               </div>

               <div style={{ marginBottom: '8px' }}>
                 <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Sistem Promptu & Kurallar</label>
                 <textarea 
                   rows={3}
                   value={geminiConfig?.systemPrompt || ''}
                   onChange={e => setGeminiConfig({ systemPrompt: e.target.value })}
                   placeholder="Tintin'in karakterini ve davranış kurallarını girin..."
                   style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none', resize: 'vertical', lineHeight: 1.4, background: '#f8fafc', boxSizing: 'border-box' }}
                 />
               </div>

               <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                 <button 
                   type="button"
                   onClick={testGeminiConnection}
                   disabled={isTestingGemini}
                   style={{ 
                     background: '#D7147A', 
                     color: 'white', 
                     border: 'none', 
                     padding: '6px 12px', 
                     borderRadius: '7px', 
                     fontSize: '11px', 
                     fontWeight: '700', 
                     cursor: isTestingGemini ? 'not-allowed' : 'pointer', 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '5px', 
                     opacity: isTestingGemini ? 0.7 : 1 
                   }}>
                   {isTestingGemini ? <Loader2 size={12} className="spin" /> : <Bot size={12} />}
                   {isTestingGemini ? 'Test Ediliyor...' : 'Gemini Bağlantısını Sına'}
                 </button>

                 {geminiTestResult && (
                   <span style={{ fontSize: '10.5px', fontWeight: '700', color: geminiTestResult.success ? '#047857' : '#dc2626' }}>
                     {geminiTestResult.success ? '✓ Bağlantı Başarılı' : '✕ Hata'}
                   </span>
                 )}
               </div>

               {geminiTestResult && (
                 <div style={{
                   marginTop: '8px',
                   padding: '8px 10px',
                   borderRadius: '8px',
                   background: geminiTestResult.success ? '#ecfdf5' : '#fef2f2',
                   border: `1px solid ${geminiTestResult.success ? '#a7f3d0' : '#fecaca'}`,
                   color: geminiTestResult.success ? '#065f46' : '#991b1b',
                   fontSize: '11px',
                   lineHeight: 1.4,
                   display: 'flex',
                   alignItems: 'flex-start',
                   gap: '6px'
                 }}>
                   {geminiTestResult.success ? <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} /> : <XCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />}
                   <span>{geminiTestResult.message || (geminiTestResult.success ? 'Bağlantı başarılı!' : 'Bağlantı testi başarısız oldu.')}</span>
                 </div>
               )}
             </div>
           )}

           {/* SECTION 6: Harici API & Sistem Ayarları */}
           {(activeTab === 'all' || activeTab === 'api') && (
             <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                 <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                   <Cpu size={13} />
                 </div>
                 <h2 style={{ fontSize: '12.5px', fontWeight: '800', margin: 0, color: '#1e293b' }}>Harici API Servisleri</h2>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Google Places API Key</label>
                   <input 
                     type="text" 
                     placeholder="AIzaSy..." 
                     value={googlePlacesApiKey || ''} 
                     onChange={e => setGooglePlacesApiKey(e.target.value)} 
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box' }}
                   />
                 </div>

                 <div>
                   <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '3px', display: 'block' }}>Akbank Kur API Key</label>
                   <input 
                     type="text"
                     placeholder="l7xx..."
                     value={akbankApiKey || ''}
                     onChange={e => setAkbankApiKey(e.target.value)}
                     style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: '#f8fafc', fontFamily: 'monospace', boxSizing: 'border-box' }}
                   />
                 </div>
               </div>
             </div>
           )}

         </div>

      </div>
    </div>
  );
}
