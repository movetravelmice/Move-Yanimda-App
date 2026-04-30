import React, { useState, useEffect } from 'react';
import { BellRing, AlertTriangle, X, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function NotificationBanner() {
    const updateProfile = useAuthStore(state => state.updateProfile);
    const [permissionStatus, setPermissionStatus] = useState('denied');
    const [isSecure, setIsSecure] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const checkPerms = async () => {
            if (Capacitor.isNativePlatform()) {
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
        };
        checkPerms();
    }, []);

    const requestPermission = async () => {
        let result = 'denied';
        if (Capacitor.isNativePlatform()) {
            const req = await LocalNotifications.requestPermissions();
            result = req.display === 'granted' ? 'granted' : 'denied';
        } else {
            if (!('Notification' in window)) return;
            result = await Notification.requestPermission();
        }

        setPermissionStatus(result);
        updateProfile({ pushEnabled: result === 'granted' });
        if (result === 'granted') {
             setTimeout(() => setDismissed(true), 1500); // Give them time to see green state
        }
    };

    if (dismissed || permissionStatus === 'granted') return null;

    if (!isSecure || permissionStatus === 'unsupported') {
        // Still use banner for unsupported so it doesn't block UI permanently
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

    if (permissionStatus === 'default') {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    
                    <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)', padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
                         <button onClick={() => setDismissed(true)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                            <X size={18} />
                         </button>
                         <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                            <BellRing size={40} color="var(--primary)" />
                         </div>
                    </div>

                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>Bildirimleri Açın</h2>
                        <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            Anlık anonslar, yoklama takibi ve seyahat güncellemelerinden eksiksiz haberdar olmak için cihaz bildirimlerinizi aktif hale getirin.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button onClick={requestPermission} style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <Bell size={20} /> Şimdi İzin Ver
                            </button>
                            <button onClick={() => setDismissed(true)} style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--text-muted)', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Daha Sonra
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (permissionStatus === 'denied') {
         return (
             <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                         <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertTriangle size={32} color="#ef4444" />
                         </div>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Bildirim İzni Reddedildi</h2>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            Daha önce bildirimleri engellediğiniz için işlem yapamıyoruz. Sistemdeki tüm anlık mesajları alabilmek için <b>tarayıcı ayarlarınızdan (adres çubuğundaki kilit simgesi)</b> izni manuel olarak vermelisiniz.
                        </p>
                        <button onClick={() => setDismissed(true)} style={{ width: '100%', padding: '16px', background: '#f1f5f9', color: 'var(--text-muted)', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Anladım, Kapat
                        </button>
                    </div>
                </div>
             </div>
        );
    }

    return null;
}
