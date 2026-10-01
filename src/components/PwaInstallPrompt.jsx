import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Check if user dismissed it in this session
    if (sessionStorage.getItem('move_pwa_dismissed')) return;

    // Check for iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Show iOS banner after a short delay for smooth entrance
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android / Desktop Chrome / Edge install event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    sessionStorage.setItem('move_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Floating Install Notification Card */}
      <div style={{
        position: 'fixed',
        top: 'calc(12px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        boxShadow: '0 10px 30px rgba(215, 20, 122, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1.5px solid #F9BED8',
        padding: '12px 14px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* App Icon */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          border: '1px solid #F9BED8'
        }}>
          <img 
            src="/icons/icon-96.png" 
            alt="Move Yanımda" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        {/* Text Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13.5px',
            fontWeight: '800',
            color: '#0f172a',
            lineHeight: 1.2
          }}>
            Move Yanımda
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            marginTop: '2px',
            lineHeight: 1.3
          }}>
            {isIos 
              ? 'Ana ekranınıza ekleyip anında kullanın' 
              : 'Hızlı erişim için uygulamayı yükleyin'}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 13px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 3px 10px rgba(215, 20, 122, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Download size={14} strokeWidth={2.5} />
            <span>Yükle</span>
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Kapat"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div 
          onClick={() => setShowIosGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              width: 'calc(100% - 32px)',
              maxWidth: '400px',
              borderRadius: '24px',
              padding: '22px 20px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1.5px solid #F9BED8'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              margin: '0 auto 12px auto',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)'
            }}>
              <img src="/icons/icon-128.png" alt="Move Yanımda" style={{ width: '100%', height: '100%' }} />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              Move Yanımda'yı Ana Ekrana Ekle
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Safari tarayıcısında uygulamayı indirmek için 2 kolay adım:
            </p>

            <div style={{
              backgroundColor: '#FDF2F8',
              borderRadius: '14px',
              padding: '12px 14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '18px',
              border: '1px solid #F9BED8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#1e293b' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#D7147A',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '11px',
                  flexShrink: 0
                }}>1</span>
                <span>Safari alt menüsündeki <strong style={{ color: '#D7147A' }}>Paylaş</strong> (<Share size={13} style={{ display: 'inline', verticalAlign: '-2px' }} />) butonuna dokunun.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#1e293b' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#D7147A',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '11px',
                  flexShrink: 0
                }}>2</span>
                <span>Açılan menüyü aşağı kaydırıp <strong style={{ color: '#D7147A' }}>"Ana Ekrana Ekle"</strong> (<PlusSquare size={13} style={{ display: 'inline', verticalAlign: '-2px' }} />) seçeneğini seçin.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
