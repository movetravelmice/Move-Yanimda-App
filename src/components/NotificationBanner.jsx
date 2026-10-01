import React, { useState, useEffect } from 'react';
import { BellRing, AlertTriangle, X, Bell, Settings, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NativeSettings = registerPlugin('NativeSettings');

export default function NotificationBanner() {
    const user = useAuthStore(state => state.user);
    const updateProfile = useAuthStore(state => state.updateProfile);
    const [permissionStatus, setPermissionStatus] = useState('checking');
    const [isSecure, setIsSecure] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [justGranted, setJustGranted] = useState(false);

    const isNative = Capacitor.isNativePlatform();

    const checkPerms = async () => {
        if (!user) return;
        try {
            if (isNative) {
                const cur = await LocalNotifications.checkPermissions();
                if (cur.display === 'granted') {
                    setPermissionStatus('granted');
                } else if (cur.display === 'denied') {
                    setPermissionStatus('denied');
                } else {
                    setPermissionStatus('default');
                }
                setIsSecure(true);
            } else {
                if ('Notification' in window) {
                    setPermissionStatus(Notification.permission);
                } else {
                    setPermissionStatus('unsupported');
                }
                setIsSecure(window.isSecureContext);
            }
        } catch (e) {
            console.error("Check permission error:", e);
            setPermissionStatus('unsupported');
        }
    };

    useEffect(() => {
        checkPerms();

        // Re-check when user returns to app from settings
        const handleFocus = () => {
            checkPerms();
        };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [user]);

    const requestPermission = async () => {
        let result = 'denied';
        try {
            if (isNative) {
                const req = await LocalNotifications.requestPermissions();
                result = req.display === 'granted' ? 'granted' : 'denied';
                if (result === 'denied') {
                    // Try to direct user to Android Settings
                    try {
                        await NativeSettings.openAppSettings();
                    } catch (e) {}
                }
            } else {
                if (!('Notification' in window)) return;
                result = await Notification.requestPermission();
            }

            setPermissionStatus(result);
            const granted = result === 'granted';
            updateProfile({ pushEnabled: granted });

            if (granted) {
                setJustGranted(true);
                setTimeout(() => setDismissed(true), 1500);
            }
        } catch (e) {
            console.error("Request permission error:", e);
        }
    };

    const handleOpenSettings = async () => {
        try {
            await NativeSettings.openAppSettings();
        } catch (e) {
            if (Capacitor.getPlatform() === 'ios') {
                try {
                    window.location.href = 'app-settings:';
                } catch (err) {
                    console.error("Could not open iOS settings", err);
                }
            } else {
                console.error("Could not open native settings", e);
            }
        }
    };

    // If not logged in, or already granted, or dismissed, don't show modal
    if (!user || dismissed || permissionStatus === 'granted' || permissionStatus === 'checking') {
        return null;
    }

    if (justGranted) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
                    <div style={{ width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <CheckCircle2 size={36} color="#10b981" />
                    </div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Bildirimler Açıldı!</h2>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Tüm anlık seyahat güncellemelerini artık alabilirsiniz.</p>
                </div>
            </div>
        );
    }

    if (!isSecure || permissionStatus === 'unsupported') {
        return (
            <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '13px', lineHeight: 1.4 }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>Bildirim altyapısı bu cihazda desteklenmiyor (Güvenli bağlantı gereklidir).</span>
                </div>
                <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: 'none', color: '#b45309', padding: '4px', cursor: 'pointer' }}>
                    <X size={16} />
                </button>
            </div>
        );
    }

    // Default state: Prompt user to allow notifications
    if (permissionStatus === 'default' || permissionStatus === 'prompt') {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    
                    <div style={{ background: 'linear-gradient(135deg, #D7147A 0%, #3b82f6 100%)', padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
                         <button onClick={() => setDismissed(true)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                            <X size={18} />
                         </button>
                         <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                            <BellRing size={40} color="#D7147A" />
                         </div>
                    </div>

                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: 'var(--text-main, #1e293b)' }}>Bildirimleri Açın</h2>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14.5px', color: '#64748b', lineHeight: '1.6' }}>
                            {isNative 
                                ? "Uçuş saatleri, yoklama takibi, transfer güncellemeleri ve acil anonslardan anında haberdar olmak için cihaz bildirimlerine izin verin."
                                : "Anlık anonslar, yoklama takibi ve seyahat güncellemelerinden eksiksiz haberdar olmak için bildirimlerinizi aktif hale getirin."}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button onClick={requestPermission} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(215, 20, 122, 0.35)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <Bell size={20} /> Şimdi İzin Ver
                            </button>
                            <button onClick={() => setDismissed(true)} style={{ width: '100%', padding: '14px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Daha Sonra
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Denied state
    if (permissionStatus === 'denied') {
         return (
             <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                         <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertTriangle size={32} color="#ef4444" />
                         </div>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Bildirim İzni Kapalı</h2>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                            {isNative 
                                ? <>Cihazınızda Move Yanımda için bildirim izni kapalı durumda. Anlık tur duyuruları ve mesajları alabilmek için <b>Telefon Ayarları &gt; Bildirimler</b> menüsünden izin vermelisiniz.</>
                                : <>Daha önce bildirimleri engellediğiniz için işlem yapamıyoruz. Sistemdeki tüm anlık mesajları alabilmek için <b>tarayıcı ayarlarınızdan (adres çubuğundaki kilit simgesi)</b> izni manuel olarak vermelisiniz.</>}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {isNative && (
                                <button onClick={handleOpenSettings} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #D7147A 0%, #B01064 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Settings size={18} /> Telefon Ayarlarını Aç
                                </button>
                            )}
                            <button onClick={() => setDismissed(true)} style={{ width: '100%', padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '16px', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer' }}>
                                Anladım, Kapat
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        );
    }

    return null;
}
