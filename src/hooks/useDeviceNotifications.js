import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useTourStore } from '../store/tourStore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useDeviceNotifications() {
    const user = useAuthStore(state => state.user);
    const updateProfile = useAuthStore(state => state.updateProfile);
    const notifications = useNotificationStore(state => state.notifications);
    const tours = useTourStore(state => state.tours);

    const prevNotifCount = useRef(null);
    const prevRollCallStates = useRef({});

    useEffect(() => {
        if (!user) return;
        
        const syncPerms = async () => {
             let isGranted = false;
             if (Capacitor.isNativePlatform()) {
                 const cur = await LocalNotifications.checkPermissions();
                 isGranted = cur.display === 'granted';
             } else {
                 if ('Notification' in window) {
                     isGranted = Notification.permission === 'granted';
                 }
             }

             if (user.pushEnabled !== isGranted) {
                 updateProfile({ pushEnabled: isGranted });
             } else if (isGranted && user.id) {
                 import('../store/userStore').then(({ useUserStore }) => {
                     useUserStore.getState().updateUser(user.id, { pushEnabled: true }).catch(console.error);
                 });
             }
        };

        syncPerms();
    }, [user, updateProfile]);

    const fireNotification = async (title, options) => {
        try {
            if (Capacitor.isNativePlatform()) {
                const cur = await LocalNotifications.checkPermissions();
                if (cur.display !== 'granted') return;

                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: title,
                            body: options.body,
                            id: new Date().getTime() % 100000000,
                            schedule: { at: new Date(Date.now() + 100) },
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
                return;
            }

            if (!('Notification' in window) || Notification.permission !== 'granted') return;
            if ('serviceWorker' in navigator) {
                const swReg = await navigator.serviceWorker.ready;
                if (swReg) {
                    await swReg.showNotification(title, options);
                    return;
                }
            }
            new Notification(title, options);
        } catch (e) {
            console.error("Device Notification triggered an error:", e);
        }
    };

    // 1. Listen for new standard & expert notifications
    useEffect(() => {
        if (!user) return;
        
        if (prevNotifCount.current === null) {
            prevNotifCount.current = notifications.length;
            return;
        }

        if (notifications.length > prevNotifCount.current) {
            const newest = notifications[0]; // Assuming descending sort via store
            
            // Exclude self-sent messages
            if (newest && newest.senderName !== user.name) {
                let relevant = false;
                if (!newest.tourId || newest.tourId === 'all') {
                    relevant = true;
                } else {
                    const t = tours.find(tour => tour.id === newest.tourId);
                    if (t) {
                       if (t.guideName === user.name || t.expert?.name === user.name) relevant = true;
                       if (t.participants?.some(p => p.id === user.id || p.email === user.email)) relevant = true;
                    }
                }

                if (relevant) {
                    fireNotification(newest.title || "Yeni Bildirim", {
                        body: newest.message,
                        icon: 'https://ui-avatars.com/api/?name=Move&background=3b82f6&color=fff&rounded=true&bold=true&size=256',
                        badge: 'https://ui-avatars.com/api/?name=M&background=000&color=fff&size=128',
                        tag: newest.id
                    });
                }
            }
        }
        
        prevNotifCount.current = notifications.length;
    }, [notifications, user, tours]);


    // 2. Listen for active Roll Calls (Customers Only)
    useEffect(() => {
        if (!user || user.role !== 'customer') return;
        
        tours.forEach(t => {
            const isParticipant = t.participants?.some(p => p.id === user.id || p.email === user.email);
            if (!isParticipant) return;

            const isActive = t.rollCall?.active && (t.rollCall?.endTime > Date.now());
            const hasMarkedPresent = (t.rollCall?.attendees || []).some(p => p.id === user.id || p.email === user.email);
            
            const prevActiveState = prevRollCallStates.current[t.id];

            if (isActive && !prevActiveState && !hasMarkedPresent) {
                // Roll call just became active for this user! Trigger OS push.
                fireNotification("Yoklama Başladı!", {
                    body: `${t.name} seyahatiniz için uzmanınız yoklama başlattı. Lütfen uygulamaya dönüp buradayım ikonuna tıklayın.`,
                    icon: 'https://ui-avatars.com/api/?name=Sayım&background=f59e0b&color=fff&rounded=true&bold=true&size=256',
                    badge: 'https://ui-avatars.com/api/?name=S&background=000&color=fff&size=128',
                    tag: `rollcall-${t.id}-${t.rollCall?.startTime || Date.now()}`,
                    requireInteraction: true // Keeps the notification on screen until interacted with
                });
            }

            prevRollCallStates.current[t.id] = isActive;
        });

    }, [tours, user]);
}
