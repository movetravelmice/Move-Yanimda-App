import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useTourStore } from '../store/tourStore';
import { useChatStore } from '../store/chatStore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Universal Trigger for Device & Browser Push Notifications (Web & Mobile)
 */
export async function triggerDeviceNotification(title, options = {}) {
    try {
        // 1. Native Mobile App (Capacitor)
        if (Capacitor.isNativePlatform()) {
            const cur = await LocalNotifications.checkPermissions();
            if (cur.display !== 'granted') return false;

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title || 'Move Yanımda',
                        body: options.body || '',
                        id: Math.floor(Math.random() * 100000000) + 1,
                        channelId: 'default',
                        actionTypeId: "",
                        extra: options.data || null
                    }
                ]
            });
            return true;
        }

        // 2. PC / Mac Browser & Web Push (HTML5 Web Notifications API)
        if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(title || 'Move Yanımda', {
                body: options.body || '',
                icon: options.icon || 'https://ui-avatars.com/api/?name=Move&background=D7147A&color=fff&rounded=true&bold=true&size=256',
                badge: options.badge || 'https://ui-avatars.com/api/?name=M&background=D7147A&color=fff&size=128',
                tag: options.tag || `move_notif_${Date.now()}`,
                data: options.data || null,
                requireInteraction: Boolean(options.requireInteraction)
            });

            notif.onclick = () => {
                try {
                    window.focus();
                    if (options.data?.url) {
                        window.location.href = options.data.url;
                    }
                } catch (e) {}
                notif.close();
            };

            return true;
        }

        return false;
    } catch (e) {
        console.error("Device Notification triggered an error:", e);
        return false;
    }
}

export function useDeviceNotifications() {
    const user = useAuthStore(state => state.user);
    const updateProfile = useAuthStore(state => state.updateProfile);
    const notifications = useNotificationStore(state => state.notifications);
    const initFirestoreNotifications = useNotificationStore(state => state.initFirestoreNotifications);
    const tours = useTourStore(state => state.tours);
    const messages = useChatStore(state => state.messages);

    const prevNotifCount = useRef(null);
    const prevRollCallStates = useRef({});
    const prevMaxMessageId = useRef(null);
    const startupTime = useRef(Date.now());

    // 0. Initialize real-time Firestore notification listener & check current permission
    useEffect(() => {
        if (!user) return;

        // Ensure Firestore notifications are continuously streamed
        initFirestoreNotifications();

        const checkCurrentPermission = async () => {
            let isGranted = false;
            if (Capacitor.isNativePlatform()) {
                const cur = await LocalNotifications.checkPermissions();
                isGranted = cur.display === 'granted';
            } else if ('Notification' in window) {
                isGranted = Notification.permission === 'granted';
            }

            if (user.pushEnabled !== isGranted) {
                updateProfile({ pushEnabled: isGranted });
            }
        };

        checkCurrentPermission();
    }, [user, updateProfile, initFirestoreNotifications]);

    // 1. Listen for new incoming broadcast & admin notifications
    useEffect(() => {
        if (!user) return;
        
        if (prevNotifCount.current === null) {
            prevNotifCount.current = notifications.length;
            return;
        }

        if (notifications.length > prevNotifCount.current) {
            const newest = notifications[0]; // newest first
            
            // Don't notify if sent by current user
            const isSentByMe = (newest?.senderId && newest.senderId === user.id) || 
                               (newest?.senderName && newest.senderName === user.name);

            if (newest && !isSentByMe) {
                let relevant = false;

                // Targeting logic (OneSignal style)
                const target = newest.target || (newest.tourId ? 'tour' : 'all');

                if (target === 'all') {
                    relevant = true;
                } else if (target === 'individual') {
                    relevant = user.userType === 'individual' || user.role === 'customer';
                } else if (target === 'corporate') {
                    relevant = user.userType === 'corporate' || ['admin', 'expert', 'customer', 'ticketing'].includes(user.role);
                } else if (target === 'tour' && newest.tourId) {
                    const t = tours.find(tour => tour.id === newest.tourId);
                    if (t) {
                       if (t.guideName === user.name || t.expert?.name === user.name) relevant = true;
                       if (t.participants?.some(p => p.id === user.id || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()))) relevant = true;
                    }
                }

                if (relevant) {
                    triggerDeviceNotification(newest.title || "Move Yanımda Bildirimi", {
                        body: newest.message || "Yeni bir bildirim aldınız.",
                        icon: 'https://ui-avatars.com/api/?name=Move&background=D7147A&color=fff&rounded=true&bold=true&size=256',
                        tag: newest.id || String(Date.now()),
                        data: {
                            url: newest.actionUrl || (user.userType === 'individual' ? '/individual/notifications' : '/dashboard/notifications')
                        }
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
                triggerDeviceNotification("Yoklama Başladı!", {
                    body: `${t.name} seyahatiniz için uzmanınız yoklama başlattı. Lütfen uygulamaya dönüp buradayım ikonuna tıklayın.`,
                    icon: 'https://ui-avatars.com/api/?name=Sayım&background=f59e0b&color=fff&rounded=true&bold=true&size=256',
                    tag: `rollcall-${t.id}-${t.rollCall?.startTime || Date.now()}`,
                    requireInteraction: true
                });
            }

            prevRollCallStates.current[t.id] = isActive;
        });

    }, [tours, user]);

    // 3. Listen for new chat messages
    useEffect(() => {
        if (!user) return;

        if (prevMaxMessageId.current === null) {
            if (messages.length > 0) {
                prevMaxMessageId.current = Math.max(...messages.map(m => m.id));
            } else {
                prevMaxMessageId.current = 0;
            }
            return;
        }

        const newMessages = messages.filter(m => m.id > prevMaxMessageId.current && m.id > startupTime.current);
        if (newMessages.length > 0) {
            newMessages.forEach(m => {
                const mySenderKey = user.role === 'expert' ? 'expert' : (user.role === 'admin' ? 'admin' : (user.role === 'ticketing' ? 'ticketing' : 'customer'));
                
                // Don't notify if sent by self
                if (m.sender === mySenderKey || m.senderName === user.name) return;

                // Don't notify if user is currently viewing this chat room
                const pathParts = window.location.pathname.split('/chat/');
                const activeChatId = pathParts.length > 1 ? pathParts[1] : null;
                if (activeChatId === m.chatId) return;

                const isExpiredArchivedTour = (datesString) => {
                    try {
                        if (!datesString) return false;
                        const matches = datesString.toLowerCase().match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})/g);
                        if (matches && matches.length > 0) {
                            const lastDateStr = matches[matches.length - 1];
                            const parts = lastDateStr.match(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})/);
                            if (parts) {
                                const trMonths = {
                                    'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
                                    'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
                                };
                                const endDate = new Date(parseInt(parts[3]), trMonths[parts[2]], parseInt(parts[1]));
                                endDate.setMonth(endDate.getMonth() + 3);
                                return new Date() > endDate;
                            }
                        }
                        return false;
                    } catch (e) {
                        return false;
                    }
                };

                const isChatRelevant = (chatId) => {
                    if (!user) return false;
                    if (chatId === 'announcement') return true;

                    if (chatId.startsWith('tour_')) {
                        const t = tours.find(tour => tour.id === chatId);
                        if (!t) return false;
                        if (t.status === 'past' && isExpiredArchivedTour(t.dates)) return false;

                        if (user.role === 'customer') {
                            return t.participants?.some(p => p.id === user.id || p.email === user.email);
                        }
                        if (user.role === 'expert' || user.role === 'admin' || user.role === 'ticketing') {
                            return (t.guideName === user.name) || (t.expert?.name === user.name) || (t.expert?.email === user.email) || (t.expert2?.name === user.name) || (t.expert2?.email === user.email);
                        }
                        return false;
                    }

                    if (chatId.startsWith('direct_') || chatId === 'expert_direct') {
                        if (chatId.startsWith('direct_admin_') || chatId.startsWith('direct_ticketing_')) {
                            return chatId.includes(user.id);
                        }

                        const cleanId = chatId.replace('direct_', '');
                        const sortedTours = [...tours].sort((a, b) => b.id.length - a.id.length);
                        const t = chatId === 'expert_direct' 
                            ? tours.find(tour => tour.id === 'tour_avrupa_ruyasi')
                            : sortedTours.find(tour => cleanId.startsWith(tour.id));
                            
                        if (!t || t.status === 'past') return false;

                        if (user.role === 'customer') {
                            if (chatId === 'expert_direct') return user.id === 'cust_1';
                            return chatId.endsWith(`_${user.id}`);
                        }
                        if (user.role === 'expert') {
                            return (t.guideName === user.name) || (t.expert?.name === user.name) || (t.expert?.email === user.email) || (t.expert2?.name === user.name) || (t.expert2?.email === user.email);
                        }
                        if (user.role === 'admin' || user.role === 'ticketing') {
                            return chatId.includes(user.id);
                        }
                        return false;
                    }
                    return false;
                };

                const relevant = isChatRelevant(m.chatId);

                if (relevant) {
                    let bodyText = m.text || "";
                    if (m.type === 'image') bodyText = "📷 Fotoğraf gönderdi";
                    if (m.type === 'location') bodyText = "📍 Konum paylaştı";
                    if (m.type === 'real_audio') bodyText = "🎵 Ses kaydı gönderdi";

                    triggerDeviceNotification(m.senderName || "Yeni Mesaj", {
                        body: bodyText,
                        icon: 'https://ui-avatars.com/api/?name=Chat&background=ec4899&color=fff&rounded=true&bold=true&size=256',
                        tag: `chat-${m.chatId}-${m.id}`
                    });
                }
            });

            prevMaxMessageId.current = Math.max(...messages.map(m => m.id));
        }
    }, [messages, user, tours]);
}
