import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, Plus, Phone, PhoneOff, MessageCircle, X, Search, User as UserIcon, Building, Mail, CheckCircle2, History, Activity, Users, PlaneTakeoff, BellRing, BellOff, Trash2, AlertTriangle, FileSpreadsheet, FileText, Lock, UserPlus, Ticket, KeyRound, Send, Loader2, Settings, Check, AlertCircle, Sparkles, Filter, ExternalLink, Copy, MessageSquare, Info, Eye, EyeOff, Smartphone, Globe, Monitor } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useUserStore, formatTitleCase } from '../../store/userStore';
import ParticipantTransferManager from '../../components/ParticipantTransferManager';
import BulkParticipantManager from '../../components/BulkParticipantManager';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useNotificationStore } from '../../store/notificationStore';
import { isUserChild as checkUserChild, canUserReceiveEmail, isChildEmail, normalizePhoneNumber, normalizeTurkish, normalizeEmail, formatPhoneInputWithoutPrefix, isUserMatch, findMatchingUser, isRealEmailMatch, resolveParticipantUser } from '../../utils/userUtils';
import { createPasswordSetupLink, sendWelcomeAndActivationWhatsApp } from '../../services/authLinkService';

const generateSecurePassword = (fullName) => {
    const nameStr = (fullName || '').replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
    let base = nameStr.length > 0 ? nameStr : 'User';
    let prefix = base.slice(0, 3).toLocaleLowerCase('tr-TR');
    if (prefix.length < 3) prefix = prefix.padEnd(3, 'a');
    prefix = prefix.charAt(0).toLocaleUpperCase('tr-TR') + prefix.slice(1);
    
    const numPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
    const chars = ['!', '?'];
    const specialChar = chars[Math.floor(Math.random() * chars.length)];
    
    return prefix + numPart + specialChar;
};

const waModalTemplates = [
    {
        key: 'newTourTemplate',
        title: 'Seyahat Kaydı Şablonu',
        desc: 'Katılımcıya tur kaydının tamamlandığını iletir.',
        previewText: (name, tourName) => `Sayın ${name}, ${tourName} seyahat kaydınız başarıyla tamamlanmıştır. Detayları Move Yanımda uygulamanızdan inceleyebilirsiniz.`,
        buttons: [
            { type: 'url', text: 'Seyahati İncele', url: 'https://move-yanimda.web.app' }
        ]
    },
    {
        key: 'ticketAddedTemplate',
        title: 'Bilet PDF Yüklendi Şablonu',
        desc: 'Seyahat e-bilet PDF belgesinin yüklendiğini bildirir.',
        previewText: (name, tourName) => `Sayın ${name}, ${tourName} seyahatiniz için e-bilet PDF belgeniz sisteme yüklenmiştir. Biletinizi ve seyahat detaylarınızı Move Yanımda uygulamanızdan inceleyebilirsiniz.`,
        buttons: [
            { type: 'url', text: 'E-Bileti Görüntüle', url: 'https://move-yanimda.web.app' }
        ]
    },
    {
        key: 'passwordResetTemplate',
        title: 'Giriş Kodu & Şifre',
        desc: 'Katılımcının sisteme giriş şifresini iletir.',
        previewText: (name, tourName, pwd) => `${pwd || '123456'} Move Yanımda tek kullanımlık doğrulama kodunuzdur. Güvenliğiniz için bu kodu kimseyle paylaşmayınız.`,
        buttons: [
            { type: 'copy_code', text: 'Kodu Kopyala' }
        ]
    },
    {
        key: 'newUserTemplate',
        title: 'Yeni Müşteri Hoş Geldin Şablonu',
        desc: 'Sisteme yeni kayıt olan kullanıcılar için hoş geldin mesajı.',
        previewText: (name) => `Sayın ${name}, Move Yanımda sistemine kaydınız başarıyla oluşturulmuştur. Seyahatlerinizi ve bilet detaylarınızı uygulamamız üzerinden takip edebilirsiniz.`,
        buttons: [
            { type: 'url', text: 'Uygulamayı Aç', url: 'https://move-yanimda.web.app' }
        ]
    },
    {
        key: 'accountActivationTemplate',
        title: 'Hesap Aktivasyonu & Şifre Belirleme Şablonu',
        desc: 'Misafire tek tıkla şifresini belirlemesi için aktivasyon butonu iletir.',
        previewText: (name) => `Sayın ${name}, Move Yanımda seyahat profiliniz hazırlandı. Uçuş, transfer ve tur programınıza erişmek için aşağıdaki butona tıklayarak hesabınızı aktif hale getirebilirsiniz.`,
        buttons: [
            { type: 'url', text: 'Hesabı Aktifleştir', url: 'https://move-yanimda.web.app/set-password' }
        ]
    },
    {
        key: 'checkInTemplate',
        title: 'Online Check-in Hatırlatması',
        desc: 'Uçuş öncesi online check-in işlemlerini hatırlatır.',
        previewText: (name, tourName) => `Sayın ${name}, ${tourName} seyahatinizin uçuşuna 24 saat kaldı. Uçuşunuz için online check-in işlemlerinizi tamamlamayı unutmayınız.`,
        buttons: [
            { type: 'url', text: 'Online Check-in Yap', url: 'https://move-yanimda.web.app' }
        ]
    },
    {
        key: 'tourReviewTemplate',
        title: 'Seyahat Değerlendirme & Puanlama',
        desc: 'Seyahat sonrası geri bildirim ve değerlendirme talep eder.',
        previewText: (name, tourName) => `Sayın ${name}, ${tourName} seyahatinizin tamamlandığını umarız. Deneyiminizi bizimle paylaşmak ve seyahatinizi puanlamak için Move Yanımda uygulamasını ziyaret edebilirsiniz.`,
        buttons: [
            { type: 'url', text: 'Seyahati Değerlendir', url: 'https://move-yanimda.web.app/dashboard' }
        ]
    }
];

const emailModalTemplates = [
    {
        key: 'tour_email',
        title: 'Seyahat Kaydı Hoşgeldiniz E-postası',
        endpoint: '/api/send-tour-email',
        desc: 'Giriş bilgileri ve seyahat detaylarını içeren karşılama postası.',
        subjectPreview: (cName, tName) => `${cName}: ${tName} Seyahati Kaydınız Alındı`,
        ctaText: 'Seyahat Detaylarını Gör'
    },
    {
        key: 'ticket_email',
        title: 'Uçuş & Biletleme Bilgilendirme E-postası',
        endpoint: '/api/send-ticket-email',
        desc: 'Uçuş detayları ve e-bilet belgelerinin hazır olduğunu bildirir.',
        subjectPreview: (cName, tName) => `${cName}: Uçuş Biletleriniz Sisteme Eklendi`,
        ctaText: 'E-Bileti İndir'
    },
    {
        key: 'credentials_email',
        title: 'Kullanıcı Adı ve Şifre İletim E-postası',
        endpoint: '/api/send-credentials',
        desc: 'Kullanıcı adı ve sisteme giriş parolasını müşteriye iletir.',
        subjectPreview: (cName) => `${cName}: Giriş Bilgileriniz (Kullanıcı Adı ve Şifre)`,
        ctaText: 'Sisteme Giriş Yap'
    },
    {
        key: 'forgot_password',
        title: 'Parola Sıfırlama / Hatırlatma E-postası',
        endpoint: '/api/forgot-password',
        desc: 'Kayıtlı giriş parolasını hatırlatan güvenlik iletisidir.',
        subjectPreview: (cName) => `${cName}: Parola Sıfırlama / Hatırlatma Talebi`,
        ctaText: 'Şifremi Belirle'
    }
];

export default function ParticipantsList() {
    const navigate = useNavigate();
    const { tourId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();
    const { smtpConfig, corporateName } = useSettingsStore();

    const { tours, addParticipantToTour, removeParticipantFromTour, editTour } = useTourStore();
    const { users, companies, findUserByEmail, addUser, addCompany, updateUser } = useUserStore();

    const tour = tours.find(t => t.id === tourId);
    const participants = tour?.participants || [];

    const isUserChild = (u) => checkUserChild(u, users);

    const missingTicketsCount = participants.filter(p => !p.ticketPdf && (!p.ticketFiles || p.ticketFiles.length === 0)).length;
    const allTicketsCompleted = participants.length > 0 && missingTicketsCount === 0;

    // Katılımcı Filtreleme State & Mantığı
    const [filterType, setFilterType] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterDropdownRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Özel Şık Şablon Seçici Dropdown State'leri
    const [isWaTemplateDropdownOpen, setIsWaTemplateDropdownOpen] = useState(false);
    const waTemplateDropdownRef = useRef(null);
    const [isEmailTemplateDropdownOpen, setIsEmailTemplateDropdownOpen] = useState(false);
    const emailTemplateDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
                setIsFilterOpen(false);
            }
            if (waTemplateDropdownRef.current && !waTemplateDropdownRef.current.contains(e.target)) {
                setIsWaTemplateDropdownOpen(false);
            }
            if (emailTemplateDropdownRef.current && !emailTemplateDropdownRef.current.contains(e.target)) {
                setIsEmailTemplateDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Güvenlik: Sadece yetkili personel (admin, expert, ticketing) bu sayfaya erişebilir
    useEffect(() => {
        const isStaff = ['admin', 'expert', 'ticketing'].includes(user?.role) || ['admin', 'expert', 'ticketing'].includes(user?.secondaryRole);
        if (!isStaff) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [customWaTemplates, setCustomWaTemplates] = useState({});

    useEffect(() => {
        let isMounted = true;
        const loadCustomWaTemplates = async () => {
            try {
                const { collection, getDocs } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                const snap = await getDocs(collection(db, 'whatsapp_templates'));
                const map = {};
                snap.forEach(d => { map[d.id] = d.data(); });
                if (isMounted) setCustomWaTemplates(map);
            } catch (err) {
                console.warn("Could not load custom whatsapp templates:", err);
            }
        };
        loadCustomWaTemplates();
        return () => { isMounted = false; };
    }, []);

    const getParticipantTickets = (p, globalP) => {
        const gUser = globalP || findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
        return (Array.isArray(p.ticketFiles) && p.ticketFiles.length > 0)
            ? p.ticketFiles
            : ((Array.isArray(gUser.ticketFiles) && gUser.ticketFiles.length > 0)
                ? gUser.ticketFiles
                : ((p.ticketPdf || gUser.ticketPdf) ? [p.ticketPdf || gUser.ticketPdf] : []));
    };

    const checkParticipantHasPhone = (p, globalP) => {
        const gUser = globalP || findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
        const ph = ((gUser.phone && gUser.phone !== '-') ? gUser.phone : (p.phone || '')).trim();
        return ph !== '' && ph !== '-' && ph.length >= 7;
    };

    const checkParticipantHasEmail = (p, globalP) => {
        const gUser = globalP || findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
        const em = ((gUser.email && !gUser.email.endsWith('@move.local') && !gUser.email.endsWith('.local') && !gUser.email.startsWith('user_')) ? gUser.email : (p.email || '')).trim().toLowerCase();
        if (!em || !em.includes('@')) return false;
        if (em.endsWith('@move.local') || em.endsWith('.local') || em.startsWith('user_')) return false;
        return true;
    };

    const getParticipantCommStatus = (p, globalP) => {
        const gUser = globalP || findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
        const isChild = isUserChild(gUser);
        const pPhone = ((gUser.phone && gUser.phone !== '-') ? gUser.phone : (p.phone || '')).trim().replace(/\D/g, '').slice(-10);
        const pEmail = (p.email || gUser.email || '').trim().toLowerCase();
        const pName = (p.name || gUser.name || '').trim().toLowerCase();
        const isPlaceholderEmail = !pEmail || pEmail === '-' || pEmail.endsWith('@move.local') || pEmail.endsWith('.local') || isChildEmail(pEmail);

        // WhatsApp status
        const hasPhone = pPhone && pPhone.length >= 7;
        let waTourSent = false;
        let waActivationSent = false;
        let waWelcomeSent = false;
        let waFailed = false;
        let waLastDate = null;

        (tour?.whatsappReports || []).forEach(rep => {
            const d = (rep.details || []).find(item => {
                if (item.id && (item.id === p.id || item.id === gUser.id)) return true;
                if (pPhone && item.phone && String(item.phone).replace(/\D/g, '').slice(-10) === pPhone) return true;
                if (item.name && item.name.trim().toLowerCase() === pName) return true;
                return false;
            });
            if (d) {
                if (d.status === 'success') {
                    if (rep.templateKey === 'newTourTemplate') waTourSent = true;
                    if (rep.templateKey === 'accountActivationTemplate') waActivationSent = true;
                    if (rep.templateKey === 'newUserTemplate') waWelcomeSent = true;
                    if (!waLastDate) waLastDate = rep.dateFormatted || rep.createdAt;
                } else if (d.status === 'failed') {
                    waFailed = true;
                }
            }
        });

        if (p.tourWaSent || gUser.tourWaSent) waTourSent = true;
        if (p.activationWaSent || gUser.activationWaSent) waActivationSent = true;

        // Email status
        let emailSent = false;
        let emailFailed = false;
        let emailLastDate = null;

        (tour?.emailReports || []).forEach(rep => {
            const d = (rep.details || []).find(item => {
                if (item.id && (item.id === p.id || item.id === gUser.id)) return true;
                if (pEmail && d.email && d.email.trim().toLowerCase() === pEmail) return true;
                if (item.name && item.name.trim().toLowerCase() === pName) return true;
                return false;
            });
            if (d) {
                if (d.status === 'success') {
                    emailSent = true;
                    if (!emailLastDate) emailLastDate = rep.dateFormatted || rep.createdAt;
                } else if (d.status === 'failed') {
                    emailFailed = true;
                }
            }
        });

        // Excel ile yüklenen ve e-posta tanımlı olan katılımcıların karşılama postası durumu
        (tour?.importReports || []).forEach(rep => {
            const d = (rep.details || []).find(item => {
                if (item.id && (item.id === p.id || item.id === gUser.id)) return true;
                if (pEmail && item.email && item.email.trim().toLowerCase() === pEmail) return true;
                if (item.name && item.name.trim().toLowerCase() === pName) return true;
                return false;
            });
            if (d && d.email && d.email !== '-' && !d.email.endsWith('@move.local') && !d.email.endsWith('.local')) {
                emailSent = true;
                if (!emailLastDate) emailLastDate = rep.dateFormatted || rep.createdAt;
            }
        });

        if (p.emailSent || p.lastEmailSent || p.tourEmailSent || p.credentialSent || gUser.emailSent) {
            emailSent = true;
            if (!emailLastDate && p.emailSentDateFormatted) emailLastDate = p.emailSentDateFormatted;
        }

        // App & Login Status
        const lastLoginAt = gUser.lastLoginAt || p.lastLoginAt || null;
        const lastPlatform = gUser.lastPlatform || p.lastPlatform || null;
        const hasInstalledApp = Boolean(gUser.hasInstalledApp || p.hasInstalledApp || (lastPlatform === 'ios' || lastPlatform === 'android'));
        const loginCount = gUser.loginCount || p.loginCount || (lastLoginAt ? 1 : 0);

        let appStatus = 'none'; // 'none' | 'native_ios' | 'native_android' | 'web'
        if (hasInstalledApp || lastPlatform === 'ios' || lastPlatform === 'android') {
            appStatus = lastPlatform === 'android' ? 'native_android' : 'native_ios';
        } else if (lastLoginAt || lastPlatform === 'web') {
            appStatus = 'web';
        }

        let lastLoginFormatted = null;
        if (lastLoginAt) {
            try {
                const d = new Date(lastLoginAt);
                if (!isNaN(d.getTime())) {
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const hours = String(d.getHours()).padStart(2, '0');
                    const mins = String(d.getMinutes()).padStart(2, '0');
                    lastLoginFormatted = `${day}.${month} ${hours}:${mins}`;
                }
            } catch (e) {}
        }

        return {
            isChild,
            hasPhone,
            hasEmail: !isPlaceholderEmail,
            waTourSent,
            waActivationSent,
            waWelcomeSent,
            waFailed,
            waAnySent: waTourSent || waActivationSent || waWelcomeSent,
            waLastDate,
            emailSent,
            emailFailed,
            emailLastDate,
            // Mobil Uygulama & Giriş
            lastLoginAt,
            lastPlatform,
            hasInstalledApp,
            loginCount,
            appStatus,
            lastLoginFormatted
        };
    };

    const filterOptions = [
        { id: 'all', label: 'Tüm Katılımcılar', icon: Users, color: '#475569', bg: '#f1f5f9' },
        { id: 'app_native', label: 'Mobil Uygulamada Aktif (iOS/Android)', icon: Smartphone, color: '#16a34a', bg: '#dcfce7' },
        { id: 'app_web', label: 'Yalnızca Web\'den Girenler', icon: Globe, color: '#0284c7', bg: '#e0f2fe' },
        { id: 'app_none', label: 'Henüz Giriş Yapmayanlar', icon: AlertCircle, color: '#d97706', bg: '#fef3c7' },
        { id: 'has_phone', label: 'Telefonu Olanlar', icon: Phone, color: '#16a34a', bg: '#dcfce7' },
        { id: 'no_phone', label: 'Telefonu Olmayanlar', icon: Phone, color: '#dc2626', bg: '#fee2e2' },
        { id: 'has_email', label: 'E-Postası Olanlar', icon: Mail, color: '#2563eb', bg: '#dbeafe' },
        { id: 'no_email', label: 'E-Postası Olmayanlar', icon: Mail, color: '#ea580c', bg: '#ffedd5' },
        { id: 'wa_act_sent', label: 'WA Aktivasyon İletilenler', icon: KeyRound, color: '#059669', bg: '#d1fae5' },
        { id: 'wa_act_pending', label: 'WA Aktivasyon Bekleyenler', icon: MessageSquare, color: '#d97706', bg: '#fef3c7' },
        { id: 'wa_tour_sent', label: 'WA Seyahat Kaydı İletilenler', icon: Send, color: '#0284c7', bg: '#e0f2fe' },
        { id: 'mail_sent', label: 'Mail İletilenler', icon: CheckCircle2, color: '#2563eb', bg: '#dbeafe' },
        { id: 'mail_pending', label: 'Mail Bekleyenler', icon: Mail, color: '#64748b', bg: '#f1f5f9' },
        { id: 'has_ticket', label: 'Bileti Yüklenmiş Olanlar', icon: Ticket, color: '#059669', bg: '#d1fae5' },
        { id: 'no_ticket', label: 'Bileti Yüklenmemiş Olanlar', icon: AlertTriangle, color: '#d97706', bg: '#fef3c7' }
    ];

    const activeFilterOption = filterOptions.find(opt => opt.id === filterType) || filterOptions[0];

    const getFilterCount = (filterId) => {
        if (filterId === 'all') return participants.length;
        return participants.filter(p => {
            const globalP = findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
            if (filterId === 'app_native') {
                const s = getParticipantCommStatus(p, globalP);
                return !s.isChild && (s.appStatus === 'native_ios' || s.appStatus === 'native_android');
            }
            if (filterId === 'app_web') {
                const s = getParticipantCommStatus(p, globalP);
                return !s.isChild && s.appStatus === 'web';
            }
            if (filterId === 'app_none') {
                const s = getParticipantCommStatus(p, globalP);
                return !s.isChild && s.appStatus === 'none';
            }
            if (filterId === 'has_phone') return checkParticipantHasPhone(p, globalP);
            if (filterId === 'no_phone') return !checkParticipantHasPhone(p, globalP);
            if (filterId === 'has_email') return checkParticipantHasEmail(p, globalP);
            if (filterId === 'no_email') return !checkParticipantHasEmail(p, globalP);
            if (filterId === 'wa_act_sent') return getParticipantCommStatus(p, globalP).waActivationSent;
            if (filterId === 'wa_act_pending') {
                const s = getParticipantCommStatus(p, globalP);
                return !s.isChild && s.hasPhone && !s.waActivationSent;
            }
            if (filterId === 'wa_tour_sent') return getParticipantCommStatus(p, globalP).waTourSent;
            if (filterId === 'mail_sent') return getParticipantCommStatus(p, globalP).emailSent;
            if (filterId === 'mail_pending') {
                const s = getParticipantCommStatus(p, globalP);
                return !s.isChild && s.hasEmail && !s.emailSent;
            }
            if (filterId === 'has_ticket') return getParticipantTickets(p, globalP).length > 0;
            if (filterId === 'no_ticket') return getParticipantTickets(p, globalP).length === 0;
            return true;
        }).length;
    };

    const filteredParticipants = participants.filter(p => {
        const globalP = findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
        if (filterType === 'app_native') {
            const s = getParticipantCommStatus(p, globalP);
            if (s.isChild || (s.appStatus !== 'native_ios' && s.appStatus !== 'native_android')) return false;
        }
        if (filterType === 'app_web') {
            const s = getParticipantCommStatus(p, globalP);
            if (s.isChild || s.appStatus !== 'web') return false;
        }
        if (filterType === 'app_none') {
            const s = getParticipantCommStatus(p, globalP);
            if (s.isChild || s.appStatus !== 'none') return false;
        }
        if (filterType === 'has_phone') return checkParticipantHasPhone(p, globalP);
        if (filterType === 'no_phone') return !checkParticipantHasPhone(p, globalP);
        if (filterType === 'has_email') return checkParticipantHasEmail(p, globalP);
        if (filterType === 'no_email') return !checkParticipantHasEmail(p, globalP);
        if (filterType === 'wa_act_sent') return getParticipantCommStatus(p, globalP).waActivationSent;
        if (filterType === 'wa_act_pending') {
            const s = getParticipantCommStatus(p, globalP);
            return !s.isChild && s.hasPhone && !s.waActivationSent;
        }
        if (filterType === 'wa_tour_sent') return getParticipantCommStatus(p, globalP).waTourSent;
        if (filterType === 'mail_sent') return getParticipantCommStatus(p, globalP).emailSent;
        if (filterType === 'mail_pending') {
            const s = getParticipantCommStatus(p, globalP);
            return !s.isChild && s.hasEmail && !s.emailSent;
        }
        if (filterType === 'has_ticket') return getParticipantTickets(p, globalP).length > 0;
        if (filterType === 'no_ticket') return getParticipantTickets(p, globalP).length === 0;

        if (searchQuery.trim()) {
            const rawQ = searchQuery.trim();
            const normQ = normalizeTurkish(rawQ);
            const digitsQ = rawQ.replace(/\D/g, '');

            const pNameNorm = normalizeTurkish(p.name);
            const gNameNorm = normalizeTurkish(globalP.name);

            const pEmailNorm = normalizeTurkish(p.email);
            const gEmailNorm = normalizeTurkish(globalP.email);

            const pPhoneDigits = String(p.phone || '').replace(/\D/g, '');
            const gPhoneDigits = String(globalP.phone || '').replace(/\D/g, '');

            const pTcDigits = String(p.tcNo || p.tc || '').replace(/\D/g, '');
            const gTcDigits = String(globalP.tcNo || globalP.tc || '').replace(/\D/g, '');

            const pPassportNorm = normalizeTurkish(p.passportNo);
            const gPassportNorm = normalizeTurkish(globalP.passportNo);

            const pCompanyNorm = normalizeTurkish(p.company);
            const gCompanyNorm = normalizeTurkish(globalP.company);

            const matchName = (pNameNorm && pNameNorm.includes(normQ)) || (gNameNorm && gNameNorm.includes(normQ));
            const matchEmail = (pEmailNorm && pEmailNorm.includes(normQ)) || (gEmailNorm && gEmailNorm.includes(normQ));
            const matchPhone = digitsQ.length >= 3 && (pPhoneDigits.includes(digitsQ) || gPhoneDigits.includes(digitsQ));
            const matchTc = digitsQ.length >= 3 && (pTcDigits.includes(digitsQ) || gTcDigits.includes(digitsQ));
            const matchPassport = normQ.length >= 3 && (pPassportNorm.includes(normQ) || gPassportNorm.includes(normQ));
            const matchCompany = (pCompanyNorm && pCompanyNorm.includes(normQ)) || (gCompanyNorm && gCompanyNorm.includes(normQ));

            return matchName || matchEmail || matchPhone || matchTc || matchPassport || matchCompany;
        }

        return true;
    });

    const [sendingNotifications, setSendingNotifications] = useState(false);

    const handleSendNotifications = async () => {
        if (!allTicketsCompleted || sendingNotifications) return;
        setSendingNotifications(true);
        try {
            const sendWhatsAppNotification = useSettingsStore.getState().sendWhatsAppNotification;
            
            let customSubject = null;
            let customHtml = null;
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                const docSnap = await getDoc(doc(db, 'email_templates', 'ticket_email'));
                if (docSnap.exists()) {
                    customSubject = docSnap.data().subject;
                    customHtml = docSnap.data().body;
                }
            } catch (templateErr) {
                console.error("Error loading ticket email template:", templateErr);
            }

            let sentCount = 0;
            
            for (const p of participants) {
                const globalUser = resolveParticipantUser(p, users);
                if (!globalUser) continue;

                // Çocuk kullanıcılar e-posta almaz ve bildirim gönderilmez
                if (isUserChild(globalUser)) {
                    continue;
                }
                
                const flights = p.flights || [];
                const ticketPdf = p.ticketPdf || (p.ticketFiles && p.ticketFiles[0]) || null;
                
                // Send Email (Yalnızca e-posta alabilen yetişkin kullanıcılara)
                if (canUserReceiveEmail(globalUser, users) && smtpConfig?.host && smtpConfig?.user) {
                    try {
                        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
                        await fetch(`${baseUrl}/api/send-ticket-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...smtpConfig,
                                to: globalUser.email,
                                participantName: globalUser.name,
                                tourName: tour?.name || '',
                                flights: flights,
                                ticketPdf: ticketPdf,
                                customSubject,
                                customHtml
                            })
                        });
                    } catch (e) {
                        console.error("Email send error for " + globalUser.name, e);
                    }
                }
                
                // Send WhatsApp
                if (globalUser.phone && globalUser.phone !== '-') {
                    try {
                        sendWhatsAppNotification(
                            globalUser.phone,
                            'ticketAddedTemplate',
                            [globalUser.name, tour?.name || '']
                        );
                    } catch (e) {
                        console.error("WhatsApp notification error for " + globalUser.name, e);
                    }
                }
                
                sentCount++;
            }

            // Sistemsel uygulama içi bildirimi tüm tur katılımcılarına oluştur
            try {
                const addNotif = useNotificationStore.getState().addNotification;
                if (addNotif && tour?.id) {
                    await addNotif({
                        type: 'info',
                        title: `✈️ Biletleriniz Yüklendi`,
                        message: `${tour.name || 'Seyahatiniz'} için uçuş detayları ve biletleriniz sisteme tanımlanmıştır. Uçuş & Transfer sekmesinden veya profilinizden detaylara hızlıca ulaşabilirsiniz.`,
                        tourId: tour.id,
                        target: 'tour',
                        senderName: user?.name || 'Biletleme Ekibi',
                        senderRole: user?.role || 'staff'
                    });
                }
            } catch (notifErr) {
                console.warn("Could not create in-app ticket notification:", notifErr);
            }
            
            alert(`Başarılı! Biletleme bilgilendirmesi ${sentCount} katılımcıya gönderildi.`);
        } catch (err) {
            alert("Gönderim sırasında bir hata oluştu: " + err.message);
        } finally {
            setSendingNotifications(false);
        }
    };

    const [showSht, setShowSht] = useState(false); // Bottom sheet for user details
    const [selectedUser, setSelectedUser] = useState(null);
    const [contactForm, setContactForm] = useState({ email: '', phone: '', password: '' });
    const [showContactPassword, setShowContactPassword] = useState(false);
    const [passwordCopied, setPasswordCopied] = useState(false);
    const [isSavingContact, setIsSavingContact] = useState(false);
    const [identityForm, setIdentityForm] = useState({
        passportCountry: '', passportNo: '', passportExp: '', tcNo: '',
        bloodType: '', birthDate: '', emergencyContactName: '', emergencyContactPhone: '',
        allergies: '', medications: '', dietaryReq: ''
    });
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [isSendingCredentials, setIsSendingCredentials] = useState(false);
    const [credentialSentMessage, setCredentialSentMessage] = useState(null);
    const [showTransferSheet, setShowTransferSheet] = useState(false);
    const [showBulkParticipant, setShowBulkParticipant] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const actionsMenuRef = useRef(null);

    const [showWhatsAppPage, setShowWhatsAppPage] = useState(false);
    const [selectedWaReportForView, setSelectedWaReportForView] = useState(null);
    const [waReportSearchQuery, setWaReportSearchQuery] = useState('');
    const [waReportFilterTab, setWaReportFilterTab] = useState('');
    const [waReportVisibleCount, setWaReportVisibleCount] = useState(20);
    const [isWaReportFilterOpen, setIsWaReportFilterOpen] = useState(false);
    const waReportFilterDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (waReportFilterDropdownRef.current && !waReportFilterDropdownRef.current.contains(event.target)) {
                setIsWaReportFilterOpen(false);
            }
        };
        if (isWaReportFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isWaReportFilterOpen]);

    const [selectedWaTemplateKey, setSelectedWaTemplateKey] = useState('newTourTemplate');
    const [isSendingBatchWa, setIsSendingBatchWa] = useState(false);
    const [batchWaProgress, setBatchWaProgress] = useState(null);

    const [showEmailPage, setShowEmailPage] = useState(false);
    const [selectedEmailTemplateKey, setSelectedEmailTemplateKey] = useState('tour_email');
    const [isSendingBatchEmail, setIsSendingBatchEmail] = useState(false);
    const [batchEmailProgress, setBatchEmailProgress] = useState(null);

    const [successPopup, setSuccessPopup] = useState(null);
    const [userToRemove, setUserToRemove] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
                setShowActionsMenu(false);
            }
        };
        if (showActionsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showActionsMenu]);

    React.useEffect(() => {
        const transferTarget = searchParams.get('openTransfer');
        if (transferTarget && participants.length > 0) {
            const userToOpen = participants.find(p => p.id === transferTarget || p.id === parseInt(transferTarget, 10));
            if (userToOpen) {
                const globalUser = resolveParticipantUser(userToOpen, users);
                setSelectedUser({ ...userToOpen, ...globalUser });
                setShowTransferSheet(true);
            }
            // Clear URL so it doesn't keep opening on refresh
            searchParams.delete('openTransfer');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, participants, users, setSearchParams]);

    // Keep selectedUser in sync with real-time Firestore updates
    React.useEffect(() => {
        if (selectedUser) {
            const upToDate = resolveParticipantUser(selectedUser, users);
            if (upToDate && (upToDate.pushEnabled !== selectedUser.pushEnabled || upToDate.phone !== selectedUser.phone || upToDate.email !== selectedUser.email)) {
                setSelectedUser(prev => ({ ...prev, ...upToDate }));
            }
        }
    }, [users, selectedUser]);

    const [showWizard, setShowWizard] = useState(false);

    // Wizard State
    const [step, setStep] = useState(1); // 1: Email query, 1.5: Confirm missing, 2: New user form
    const [emailQuery, setEmailQuery] = useState('');
    const [searchError, setSearchError] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    const filteredUsers = (users || []).filter(u => {
        if (!u || u.role !== 'customer') return false;
        const q = (emailQuery || '').trim();
        if (!q) return false;
        const qNorm = normalizeTurkish(q);
        const nameNorm = normalizeTurkish(u.name || '');
        const emailLower = (u.email || '').toLowerCase();
        const phoneClean = (u.phone || '').replace(/\D/g, '');
        const qDigits = q.replace(/\D/g, '');

        if (nameNorm.includes(qNorm)) return true;
        if (emailLower && !emailLower.endsWith('@move.local') && emailLower.includes(q.toLowerCase())) return true;
        if (qDigits.length >= 3 && phoneClean.includes(qDigits)) return true;
        return false;
    });

    // New User form state
    const [newCustomerType, setNewCustomerType] = useState('parent'); // 'parent' or 'child'
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newTcNo, setNewTcNo] = useState('');
    const [showCompanyAutocomplete, setShowCompanyAutocomplete] = useState(false);

    // Parent selection (for child users)
    const [newParentIds, setNewParentIds] = useState([]);
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [showParentSearchDropdown, setShowParentSearchDropdown] = useState(false);

    // Children selection (for parent users)
    const [newChildrenIds, setNewChildrenIds] = useState([]);
    const [childSearchQuery, setChildSearchQuery] = useState('');
    const [showChildSearchDropdown, setShowChildSearchDropdown] = useState(false);

    // Failsafe filter
    const safeCompanies = Array.isArray(companies) ? companies.map(c => String(c || '')).filter(c => c && !c.toLowerCase().includes('tgundogan')) : ['Move Travel & Mice'];
    const filteredCompanies = safeCompanies.filter(c => c && c.toLowerCase().includes(newCompany.toLowerCase()));

    const formatPhoneNumber = (value) => {
        return formatPhoneInputWithoutPrefix(value);
    };

    const resetWizard = () => {
        setShowWizard(false);
        setStep(1);
        setEmailQuery('');
        setSearchError('');
        setShowAutocomplete(false);
        setNewCustomerType('parent');
        setNewName('');
        setNewPhone('');
        setNewCompany('');
        setNewTcNo('');
        setShowCompanyAutocomplete(false);
        setNewParentIds([]);
        setParentSearchQuery('');
        setShowParentSearchDropdown(false);
        setNewChildrenIds([]);
        setChildSearchQuery('');
        setShowChildSearchDropdown(false);
    };

    // Profile Child Linking state
    const [profileChildSearchQuery, setProfileChildSearchQuery] = useState('');
    const [showProfileChildDropdown, setShowProfileChildDropdown] = useState(false);
    const [isCopyingSetupLink, setIsCopyingSetupLink] = useState(false);
    const [setupLinkCopied, setSetupLinkCopied] = useState(false);

    const handleCopyPasswordSetupLink = async () => {
        if (!selectedUser) return;
        setIsCopyingSetupLink(true);
        try {
            const targetUserDoc = findMatchingUser(selectedUser, users) || users.find(u => u.id === selectedUser.id) || selectedUser;
            const res = await createPasswordSetupLink(targetUserDoc);
            
            await navigator.clipboard.writeText(res.url);
            setSetupLinkCopied(true);
            setTimeout(() => setSetupLinkCopied(false), 4000);
            
            setSuccessPopup({
                title: 'Bağlantı Kopyalandı',
                description: `Tek kullanımlık şifre belirleme bağlantısı panoya kopyalandı:\n\n${res.url}\n\nBu bağlantıyı misafirinizle WhatsApp veya SMS üzerinden paylaşabilirsiniz. Bağlantı 72 saat boyunca geçerlidir.`,
                type: 'success'
            });
        } catch (err) {
            console.error("Create password setup link error:", err);
            setSuccessPopup({
                title: 'Bağlantı Oluşturulamadı',
                description: err.message || 'Şifre belirleme bağlantısı oluşturulurken hata meydana geldi.',
                type: 'error'
            });
        } finally {
            setIsCopyingSetupLink(false);
        }
    };

    const calcUserStats = (pEmail) => {
        let activeCount = 0;
        let pastCount = 0;
        tours.forEach(t => {
            const isPart = t.participants.some(p => p.email === pEmail || p.name === pEmail);
            if (isPart) {
                if (t.status === 'active') activeCount++;
                if (t.status === 'past') pastCount++;
            }
        });
        return { activeCount, pastCount };
    };

    const handleBack = () => navigate(-1);

    const openProfile = (p) => {
        const globalUser = resolveParticipantUser(p, users);
        setSelectedUser({ ...p, ...globalUser });
        setCredentialSentMessage(null);
        setShowContactPassword(false);
        setPasswordCopied(false);
        const hasPlaceholder = globalUser.email && (globalUser.email.endsWith('@move.local') || globalUser.email.endsWith('.local') || globalUser.email.startsWith('user_'));
        const initialEmail = hasPlaceholder ? '' : (globalUser.email || '');
        const rawPhone = (globalUser.phone && globalUser.phone !== '-') ? globalUser.phone : (p.phone && p.phone !== '-' ? p.phone : '');
        const initialPhone = formatPhoneInputWithoutPrefix(rawPhone);
        const initialPassword = (globalUser.password || p.password || '').trim();

        setContactForm({
            email: initialEmail,
            phone: initialPhone,
            password: initialPassword
        });

        // Her profil açılışında Firestore'daki en güncel şifre ve iletişim bilgilerini doğrudan çekip eşitle
        const targetDocId = (globalUser && globalUser.id && !globalUser.id.startsWith('temp_')) ? globalUser.id : (p.id || p.userId);
        if (targetDocId) {
            import('firebase/firestore').then(async ({ doc, getDoc }) => {
                const { db } = await import('../../lib/firebase');
                const snap = await getDoc(doc(db, 'users', targetDocId));
                if (snap.exists()) {
                    const uData = snap.data();
                    if (uData.password) {
                        const pass = String(uData.password).trim();
                        setContactForm(prev => ({ ...prev, password: pass }));
                        setSelectedUser(prev => ({ ...prev, password: pass }));
                    }
                    if (uData.phone && uData.phone !== '-') {
                        const freshPhone = formatPhoneInputWithoutPrefix(uData.phone);
                        setContactForm(prev => ({ ...prev, phone: freshPhone }));
                    }
                    if (uData.email && !uData.email.endsWith('@move.local') && !uData.email.endsWith('.local') && !uData.email.startsWith('user_')) {
                        setContactForm(prev => ({ ...prev, email: uData.email }));
                    }
                    if (uData.lastLoginAt || uData.hasInstalledApp || uData.lastPlatform) {
                        setSelectedUser(prev => ({
                            ...prev,
                            lastLoginAt: uData.lastLoginAt || prev?.lastLoginAt,
                            lastPlatform: uData.lastPlatform || prev?.lastPlatform,
                            hasInstalledApp: Boolean(uData.hasInstalledApp || prev?.hasInstalledApp),
                            loginCount: uData.loginCount || prev?.loginCount,
                            deviceInfo: uData.deviceInfo || prev?.deviceInfo,
                            appVersion: uData.appVersion || prev?.appVersion
                        }));
                    }
                }
            }).catch(e => console.warn("Password & contact live fetch error:", e));
        }

        setIdentityForm({
            passportCountry: globalUser.passportCountry || p.passportCountry || '',
            passportNo: globalUser.passportNo || p.passportNo || '',
            passportExp: globalUser.passportExp || p.passportExp || '',
            tcNo: globalUser.tcNo || p.tcNo || '',
            bloodType: globalUser.bloodType || p.bloodType || '',
            birthDate: globalUser.birthDate || p.birthDate || '',
            emergencyContactName: globalUser.emergencyContactName || p.emergencyContactName || '',
            emergencyContactPhone: globalUser.emergencyContactPhone || p.emergencyContactPhone || '',
            allergies: globalUser.allergies || p.allergies || '',
            medications: globalUser.medications || p.medications || '',
            dietaryReq: globalUser.dietaryReq || p.dietaryReq || ''
        });
        setShowTransferSheet(false);
        setShowSht(true);
        const appContentEl = document.querySelector('.mobile-app-content');
        if (appContentEl) appContentEl.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleGeneratePassword = () => {
        const newPass = generateSecurePassword(selectedUser?.name || 'User');
        setContactForm(prev => ({ ...prev, password: newPass }));
        setShowContactPassword(true);
    };

    const handleSaveContact = async () => {
        if (!selectedUser) return;
        setIsSavingContact(true);
        try {
            const cleanEmail = (contactForm.email || '').trim().toLowerCase();
            let cleanPhone = (contactForm.phone || '').trim();
            const cleanPassword = (contactForm.password || '').trim();

            if (!cleanEmail && !cleanPhone && !cleanPassword) {
                setSuccessPopup({
                    title: 'Eksik İletişim Bilgisi',
                    description: 'Lütfen en az bir iletişim bilgisi (e-posta veya telefon) giriniz.',
                    type: 'error'
                });
                setIsSavingContact(false);
                return;
            }

            const formattedPhone = cleanPhone ? normalizePhoneNumber(cleanPhone) : '-';

            // Eski ve yeni bilgileri karşılaştır
            const oldPhoneDigits = String(selectedUser.phone || '').replace(/\D/g, '').slice(-10);
            const newPhoneDigits = String(formattedPhone || '').replace(/\D/g, '').slice(-10);
            const isPhoneChanged = (newPhoneDigits.length === 10) && (newPhoneDigits !== oldPhoneDigits);

            const oldEmail = String(selectedUser.email || '').trim().toLowerCase();
            const isOldPlaceholder = !oldEmail || oldEmail.endsWith('@move.local') || oldEmail.endsWith('.local') || oldEmail.startsWith('user_');
            const isNewPlaceholder = !cleanEmail || cleanEmail.endsWith('@move.local') || cleanEmail.endsWith('.local') || cleanEmail.startsWith('user_');
            const isEmailChanged = !isNewPlaceholder && cleanEmail.includes('@') && (cleanEmail !== oldEmail);
            const isChild = isUserChild(selectedUser);

            const payload = {
                email: cleanEmail,
                phone: formattedPhone,
                ...(cleanPassword ? { password: cleanPassword } : {})
            };

            const targetUserDoc = findMatchingUser(selectedUser, users) || users.find(u => u.id === selectedUser.id);
            const userDocId = targetUserDoc ? targetUserDoc.id : selectedUser.id;

            await updateUser(userDocId, payload);

            if (tour && tour.participants) {
                const updatedParticipants = tour.participants.map(p => {
                    const isMatch = (p.id && (p.id === selectedUser.id || (userDocId && p.id === userDocId))) ||
                        (selectedUser.tcNo && p.tcNo && String(p.tcNo).replace(/\D/g, '') === String(selectedUser.tcNo).replace(/\D/g, '')) ||
                        (selectedUser.email && p.email && p.email.toLowerCase() === selectedUser.email.toLowerCase()) ||
                        (selectedUser.name && p.name && normalizeTurkish(p.name) === normalizeTurkish(selectedUser.name)) ||
                        isUserMatch(p, selectedUser);

                    if (isMatch) {
                        return {
                            ...p,
                            ...(payload.email ? { email: payload.email } : {}),
                            phone: payload.phone,
                            ...(cleanPassword ? { password: cleanPassword } : {})
                        };
                    }
                    return p;
                });
                const { updateDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                await updateDoc(doc(db, 'tours', tour.id), { participants: updatedParticipants });

                useTourStore.setState(state => ({
                    tours: (state.tours || []).map(t => t.id === tour.id ? { ...t, participants: updatedParticipants } : t)
                }));
            }

            setSelectedUser(prev => ({ ...prev, ...payload }));

            // 1. TELEFON DEĞİŞTİYSE: Yeni numaraya sırasıyla welcome_customer ardından welcome_account_activation Gönder
            let whatsappSent = false;
            let setupLinkInfo = null;
            if (isPhoneChanged && formattedPhone && formattedPhone !== '-' && !isChild) {
                try {
                    const waRes = await sendWelcomeAndActivationWhatsApp({
                        id: userDocId,
                        name: selectedUser.name || 'Değerli Misafirimiz',
                        email: cleanEmail || selectedUser.email,
                        phone: formattedPhone
                    });

                    if (waRes?.welcomeSent || waRes?.activationSent) {
                        whatsappSent = true;
                    }
                    if (waRes?.setupUrl) {
                        setupLinkInfo = { url: waRes.setupUrl, token: waRes.token };
                    }
                } catch (waErr) {
                    console.warn("WhatsApp welcome and activation notification error on phone change:", waErr);
                }
            }

            // 2. TELEFON VEYA E-POSTA DEĞİŞTİYSE: Yeni mail adresine kullanıcı adı, şifre ve bilgi güncelleme maili gönder
            let emailSent = false;
            const targetEmail = (!isNewPlaceholder && cleanEmail) ? cleanEmail : (!isOldPlaceholder && oldEmail ? oldEmail : null);

            if ((isPhoneChanged || isEmailChanged) && targetEmail && !isChild && smtpConfig?.host && smtpConfig?.user && smtpConfig?.pass) {
                try {
                    // Şifre bağlantısı henüz üretilmediyse üretelim
                    if (!setupLinkInfo) {
                        try {
                            setupLinkInfo = await createPasswordSetupLink({
                                id: userDocId,
                                name: selectedUser.name || targetEmail,
                                email: targetEmail,
                                phone: formattedPhone !== '-' ? formattedPhone : (selectedUser.phone || '-')
                            });
                        } catch (lnkErr) {
                            console.warn("Setup link generation error:", lnkErr);
                        }
                    }

                    // Güncel parolayı tespit et
                    let activePassword = cleanPassword || selectedUser.password || '';
                    if (!activePassword) {
                        try {
                            const { doc, getDoc } = await import('firebase/firestore');
                            const { db } = await import('../../lib/firebase');
                            const uSnap = await getDoc(doc(db, 'users', userDocId));
                            if (uSnap.exists() && uSnap.data().password) {
                                activePassword = String(uSnap.data().password).trim();
                            }
                        } catch (pErr) {
                            console.warn("Password fetch error for auto-email:", pErr);
                        }
                    }
                    if (!activePassword) activePassword = '123456';

                    // Şablon yükle: Öncelikle 'account_updated_email', yoksa 'credentials_email'
                    let customSubject = null;
                    let customHtml = null;
                    try {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const { db } = await import('../../lib/firebase');
                        let tSnap = await getDoc(doc(db, 'email_templates', 'account_updated_email'));
                        if (!tSnap.exists()) {
                            tSnap = await getDoc(doc(db, 'email_templates', 'credentials_email'));
                        }
                        if (tSnap.exists()) {
                            customSubject = tSnap.data().subject;
                            customHtml = tSnap.data().body;
                        }
                    } catch (tErr) {
                        console.warn("Auto-email template load error:", tErr);
                    }

                    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
                    const emailRes = await fetch(`${baseUrl}/api/send-account-update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...smtpConfig,
                            to: targetEmail,
                            corporateName: corporateName || 'Move Yanımda',
                            accountName: selectedUser.name || targetEmail,
                            accountEmail: targetEmail,
                            accountPhone: formattedPhone !== '-' ? formattedPhone : (selectedUser.phone || '-'),
                            accountPassword: activePassword,
                            setupUrl: setupLinkInfo?.url || `${baseUrl}/login`,
                            customSubject,
                            customHtml
                        })
                    });

                    if (emailRes.ok) {
                        emailSent = true;
                    }
                } catch (emErr) {
                    console.warn("Auto account update email error:", emErr);
                }
            }

            // Kullanıcıya bildirim özeti
            const notes = [];
            if (whatsappSent) {
                notes.push(`Yeni numaraya (${formattedPhone}) WhatsApp karşılama mesajı iletildi.`);
            }
            if (emailSent) {
                notes.push(`Yeni e-posta adresine (${targetEmail}) güncel kullanıcı adı ve şifre iletildi.`);
            }

            const descriptionText = notes.length > 0
                ? `İletişim ve giriş bilgileri kaydedildi.\n• ${notes.join('\n• ')}`
                : 'Müşteri iletişim ve giriş bilgileri başarıyla kaydedildi.';

            setSuccessPopup({
                title: 'İletişim Bilgileri Güncellendi',
                description: descriptionText,
                type: 'success'
            });
        } catch (e) {
            console.error("Save contact error:", e);
            setSuccessPopup({
                title: 'Kayıt Hatası',
                description: 'İletişim bilgileri kaydedilirken hata oluştu: ' + (e.message || ''),
                type: 'error'
            });
        } finally {
            setIsSavingContact(false);
        }
    };

    const handleSendCredentialsEmail = async () => {
        if (!selectedUser) return;
        
        const rawEmail = (contactForm.email || selectedUser.email || '').trim();
        const targetEmail = rawEmail.toLowerCase();
        
        if (!targetEmail || !targetEmail.includes('@')) {
            setSuccessPopup({
                title: 'Geçersiz E-Posta',
                description: 'Lütfen geçerli bir e-posta adresi giriniz.',
                type: 'error'
            });
            return;
        }

        if (targetEmail.endsWith('@move.local') || targetEmail.endsWith('.local') || isChildEmail(targetEmail) || isUserChild(selectedUser)) {
            setSuccessPopup({
                title: 'E-Posta Gönderilemez',
                description: 'Çocuk hesapları veya dahili hesaplar için giriş bilgisi e-postası gönderilemez.',
                type: 'error'
            });
            return;
        }

        if (!smtpConfig?.host || !smtpConfig?.user || !smtpConfig?.pass) {
            setSuccessPopup({
                title: 'SMTP Yapılandırması Eksik',
                description: 'SMTP sunucu ayarları yapılandırılmamış. Lütfen Yönetici Panelinden SMTP ayarlarını kontrol edin.',
                type: 'error'
            });
            return;
        }

        setIsSendingCredentials(true);
        setCredentialSentMessage(null);

        try {
            // E-posta veya telefon formda güncellendiyse önce kaydet
            let cleanPhone = (contactForm.phone || '').trim();
            const normalizedCleanPhone = cleanPhone ? normalizePhoneNumber(cleanPhone) : '-';
            if (rawEmail !== (selectedUser.email || '') || (cleanPhone && normalizedCleanPhone !== (selectedUser.phone || ''))) {
                const targetUserDoc = findMatchingUser(selectedUser, users) || users.find(u => u.id === selectedUser.id);
                const userDocId = targetUserDoc ? targetUserDoc.id : selectedUser.id;
                const payload = {
                    email: targetEmail,
                    phone: cleanPhone ? normalizedCleanPhone : (selectedUser.phone || '-')
                };
                await updateUser(userDocId, payload);
                if (tour && tour.participants) {
                    const updatedParticipants = tour.participants.map(p => {
                        const isMatch = (p.id && (p.id === selectedUser.id || (userDocId && p.id === userDocId))) ||
                            (selectedUser.tcNo && p.tcNo && String(p.tcNo).replace(/\D/g, '') === String(selectedUser.tcNo).replace(/\D/g, '')) ||
                            (selectedUser.email && p.email && p.email.toLowerCase() === selectedUser.email.toLowerCase()) ||
                            (selectedUser.name && p.name && normalizeTurkish(p.name) === normalizeTurkish(selectedUser.name)) ||
                            isUserMatch(p, selectedUser);
                        if (isMatch) {
                            return { ...p, ...payload };
                        }
                        return p;
                    });
                    const { updateDoc, doc } = await import('firebase/firestore');
                    const { db } = await import('../../lib/firebase');
                    await updateDoc(doc(db, 'tours', tour.id), { participants: updatedParticipants });

                    useTourStore.setState(state => ({
                        tours: (state.tours || []).map(t => t.id === tour.id ? { ...t, participants: updatedParticipants } : t)
                    }));
                }
                setSelectedUser(prev => ({ ...prev, ...payload }));
            }

            // Şifreyi tespit et veya yeni güvenli şifre ata
            let activePassword = (contactForm.password || selectedUser.password || '').trim();
            if (!activePassword && selectedUser.id) {
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('../../lib/firebase');
                    const uSnap = await getDoc(doc(db, 'users', selectedUser.id));
                    if (uSnap.exists() && uSnap.data().password) {
                        activePassword = String(uSnap.data().password).trim();
                    }
                } catch (snapErr) {
                    console.warn("Could not read user password from firestore:", snapErr);
                }
            }

            if (!activePassword) {
                activePassword = generateSecurePassword(selectedUser.name || 'User');
                try {
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('../../lib/firebase');
                    await updateDoc(doc(db, 'users', selectedUser.id), { password: activePassword });
                    await updateUser(selectedUser.id, { password: activePassword });
                    setSelectedUser(prev => ({ ...prev, password: activePassword }));
                    setContactForm(prev => ({ ...prev, password: activePassword }));
                } catch (updateErr) {
                    console.warn("Could not save generated password:", updateErr);
                }
            } else {
                setContactForm(prev => ({ ...prev, password: activePassword }));
            }

            // Şablon yükle (özelleştirilmiş şablon varsa kullanılır)
            let customSubject = null;
            let customHtml = null;
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                let docSnap = await getDoc(doc(db, 'email_templates', 'credentials_email'));
                if (!docSnap.exists()) {
                    docSnap = await getDoc(doc(db, 'email_templates', 'forgot_password'));
                }
                if (docSnap.exists()) {
                    customSubject = docSnap.data().subject;
                    customHtml = docSnap.data().body;
                }
            } catch (templateErr) {
                console.error("Error loading credentials template:", templateErr);
            }

            // Tek kullanımlık şifre belirleme bağlantısı oluştur
            let setupLinkInfo = null;
            try {
                setupLinkInfo = await createPasswordSetupLink({
                    id: selectedUser.id,
                    name: selectedUser.name || targetEmail,
                    email: targetEmail,
                    phone: selectedUser.phone || cleanPhone || '-'
                });
            } catch (linkErr) {
                console.warn("Could not create setup link for email:", linkErr);
            }

            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
            const res = await fetch(`${baseUrl}/api/send-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...smtpConfig,
                    to: targetEmail,
                    corporateName: corporateName || 'Move Yanımda',
                    accountName: selectedUser.name || targetEmail,
                    accountEmail: targetEmail,
                    accountPassword: activePassword,
                    setupUrl: setupLinkInfo?.url || `${baseUrl}/login`,
                    loginUrl: `${baseUrl}/login`,
                    customSubject,
                    customHtml
                })
            });

            const resData = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(resData.message || `Sunucu hatası: ${res.status}`);
            }

            // WhatsApp bildirimi (varsa)
            const targetPhone = selectedUser.phone && selectedUser.phone !== '-' ? selectedUser.phone : (contactForm.phone || '');
            let waSentOk = false;
            if (targetPhone && targetPhone.trim().length > 6) {
                try {
                    const waRes = await useSettingsStore.getState().sendWhatsAppNotification(
                        targetPhone,
                        'accountActivationTemplate',
                        [selectedUser.name || 'Değerli Misafirimiz'],
                        setupLinkInfo?.token
                    );
                    if (waRes?.success) waSentOk = true;
                } catch (waErr) {
                    console.warn("WhatsApp notification error:", waErr);
                }
            }

            // Katılımcının kartında anında görünmesi için tur kayıtlarını güncelle
            try {
                const updatedParts = (tour?.participants || []).map(tp => {
                    if (tp.id === selectedUser.id || (targetEmail && tp.email?.toLowerCase() === targetEmail.toLowerCase())) {
                        return {
                            ...tp,
                            emailSent: true,
                            lastEmailSentAt: Date.now(),
                            activationWaSent: waSentOk || tp.activationWaSent,
                            lastWaSentAt: waSentOk ? Date.now() : tp.lastWaSentAt
                        };
                    }
                    return tp;
                });
                await editTour(tourId, { participants: updatedParts });
            } catch (partUpdateErr) {
                console.warn("Could not update participant comm flags:", partUpdateErr);
            }

            setCredentialSentMessage(`Kullanıcı adı (${targetEmail}) ve şifre e-posta ile gönderildi.`);
            setSuccessPopup({
                title: 'Giriş Bilgileri Gönderildi',
                description: 'Kullanıcı adı ve şifre müşterinin e-posta adresine başarıyla iletildi.',
                email: targetEmail,
                password: activePassword,
                labelPassword: 'Şifre',
                type: 'success'
            });
        } catch (err) {
            console.error("Send credentials error:", err);
            setSuccessPopup({
                title: 'E-Posta Gönderilemedi',
                description: err.message || 'E-posta gönderilirken bir hata oluştu.',
                type: 'error'
            });
        } finally {
            setIsSendingCredentials(false);
        }
    };

    const handleExecuteBatchWhatsApp = async () => {
        const { whatsappConfig } = useSettingsStore.getState();
        if (!whatsappConfig?.isEnabled || !whatsappConfig?.phoneId || !whatsappConfig?.accessToken) {
            setSuccessPopup({
                title: 'WhatsApp Entegrasyonu Eksik',
                description: 'WhatsApp entegrasyonu aktif değil veya eksik yapılandırılmış. Lütfen Yönetici Panelinden WhatsApp ayarlarını kontrol edin.',
                type: 'error'
            });
            return;
        }

        const eligible = participants.filter(p => {
            const globalU = resolveParticipantUser(p, users);
            if (isUserChild(globalU)) return false;
            const phone = ((globalU.phone && globalU.phone !== '-') ? globalU.phone : (p.phone || '')).trim();
            return phone && phone !== '-' && phone.length > 6;
        });

        if (eligible.length === 0) {
            setSuccessPopup({
                title: 'Katılımcı Bulunamadı',
                description: 'Bu turda WhatsApp bildirimi gönderilebilecek uygun telefon numarasına sahip katılımcı bulunamadı.',
                type: 'error'
            });
            return;
        }

        const targetTpl = waModalTemplates.find(t => t.key === selectedWaTemplateKey) || waModalTemplates[0];

        setIsSendingBatchWa(true);
        let successCount = 0;
        let failCount = 0;
        const recipientResults = [];

        for (let i = 0; i < eligible.length; i++) {
            const p = eligible[i];
            const globalU = resolveParticipantUser(p, users);
            const phone = ((globalU.phone && globalU.phone !== '-') ? globalU.phone : (p.phone || '')).trim();
            const pName = p.name || globalU.name || 'Katılımcı';
            const pPass = globalU.password || p.password || '123456';
            
            setBatchWaProgress({ current: i + 1, total: eligible.length, name: pName, successCount, failCount });

            let params = [];
            let buttonParam = undefined;
            if (selectedWaTemplateKey === 'newUserTemplate') {
                params = [pName];
            } else if (selectedWaTemplateKey === 'accountActivationTemplate') {
                params = [pName];
                try {
                    const setupInfo = await createPasswordSetupLink(globalU);
                    buttonParam = setupInfo.token;
                } catch (tokErr) {
                    console.warn("Setup token error in batch activation:", tokErr);
                }
            } else if (selectedWaTemplateKey === 'newTourTemplate' || selectedWaTemplateKey === 'ticketAddedTemplate') {
                params = [pName, tour.name];
            } else if (selectedWaTemplateKey === 'passwordResetTemplate') {
                params = [String(pPass)];
            } else if (selectedWaTemplateKey === 'checkInTemplate') {
                const airline = (p.flights && p.flights[0]?.airline) || 'THY';
                params = [pName, tour.name, '24', airline];
            } else if (selectedWaTemplateKey === 'tourReviewTemplate') {
                params = [pName, tour.name, window.location.origin];
            } else {
                params = [pName, tour.name];
            }

            try {
                const res = await useSettingsStore.getState().sendWhatsAppNotification(phone, selectedWaTemplateKey, params, buttonParam);
                if (res.success) {
                    successCount++;
                    recipientResults.push({
                        id: p.id || String(i),
                        name: pName,
                        phone: phone,
                        userType: isUserChild(globalU) ? 'child' : 'adult',
                        company: p.company || globalU.company || '',
                        status: 'success',
                        reason: 'Mesaj WhatsApp Cloud API üzerinden başarıyla teslim edildi.'
                    });
                } else {
                    failCount++;
                    console.warn(`WhatsApp send failed for ${pName} (${phone}):`, res.message);
                    recipientResults.push({
                        id: p.id || String(i),
                        name: pName,
                        phone: phone,
                        userType: isUserChild(globalU) ? 'child' : 'adult',
                        company: p.company || globalU.company || '',
                        status: 'failed',
                        reason: res.message || 'WhatsApp API gönderim hatası veya geçersiz numara.'
                    });
                }
            } catch (err) {
                failCount++;
                console.error(`WhatsApp send error for ${pName}:`, err);
                recipientResults.push({
                    id: p.id || String(i),
                    name: pName,
                    phone: phone,
                    userType: isUserChild(globalU) ? 'child' : 'adult',
                    company: p.company || globalU.company || '',
                    status: 'failed',
                    reason: err.message || 'Bağlantı veya sunucu hatası.'
                });
            }

            // Hafif duraksama (rate-limit koruması)
            await new Promise(r => setTimeout(r, 120));
        }

        // Atlanan / Numarası olmayan katılımcılar
        const nonEligible = participants.filter(p => !eligible.some(ep => (ep.id && ep.id === p.id) || (isRealEmailMatch(ep.email, p.email)) || isUserMatch(ep, p)));
        const skippedDetails = nonEligible.map(sp => {
            const globalU = resolveParticipantUser(sp, users);
            const isChild = isUserChild(globalU);
            const userPhone = ((globalU.phone && globalU.phone !== '-') ? globalU.phone : (sp.phone || '')).trim();
            return {
                id: sp.id || Math.random().toString(),
                name: sp.name || globalU.name || 'Katılımcı',
                phone: userPhone || '-',
                userType: isChild ? 'child' : 'adult',
                company: sp.company || globalU.company || '',
                status: isChild ? 'child_skipped' : 'missing_phone',
                reason: isChild ? 'Çocuk katılımcı profili (WhatsApp iletimi ebeveyn üzerinden yapılır).' : 'Telefon numarası sistemde kayıtlı değil veya geçersiz.'
            };
        });

        const newReport = {
            id: 'wa_rep_' + Date.now(),
            type: 'whatsapp',
            templateKey: selectedWaTemplateKey,
            templateTitle: targetTpl.title,
            createdAt: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            totalRecipients: participants.length,
            successCount,
            failCount,
            skippedCount: nonEligible.length,
            details: [
                ...recipientResults,
                ...skippedDetails
            ]
        };

        const existingReports = tour?.whatsappReports || [];
        const updatedReports = [newReport, ...existingReports];
        try {
            await editTour(tourId, { whatsappReports: updatedReports });
        } catch (e) {
            console.warn("Could not save whatsappReports to tour:", e);
        }

        setIsSendingBatchWa(false);
        setBatchWaProgress(null);
        setShowWhatsAppPage(false);
        setSuccessPopup({
            title: 'WhatsApp Gönderimi Tamamlandı',
            description: `Seçilen "${targetTpl.title}" şablonu katılımcılara iletildi.`,
            stats: [
                { label: 'Toplam Hedef', value: eligible.length },
                { label: 'Başarılı', value: successCount, color: '#16a34a' },
                { label: 'Başarısız', value: failCount, color: failCount > 0 ? '#dc2626' : '#64748b' }
            ],
            type: failCount === eligible.length ? 'error' : 'success'
        });
    };

    const handleExecuteBatchEmail = async () => {
        if (!smtpConfig?.host || !smtpConfig?.user || !smtpConfig?.pass) {
            setSuccessPopup({
                title: 'SMTP Yapılandırması Eksik',
                description: 'SMTP e-posta sunucu ayarları eksik. Lütfen Yönetici Panelinden SMTP ayarlarını kontrol edin.',
                type: 'error'
            });
            return;
        }

        const eligible = participants.filter(p => {
            const globalU = resolveParticipantUser(p, users);
            if (isUserChild(globalU)) return false;
            const email = (p.email || globalU.email || '').trim().toLowerCase();
            if (!email || !email.includes('@')) return false;
            if (email.endsWith('@move.local') || email.endsWith('.local') || isChildEmail(email)) return false;
            return true;
        });

        if (eligible.length === 0) {
            setSuccessPopup({
                title: 'Katılımcı Bulunamadı',
                description: 'Bu turda e-posta gönderilebilecek uygun e-posta adresine sahip katılımcı bulunamadı.',
                type: 'error'
            });
            return;
        }

        const targetTpl = emailModalTemplates.find(t => t.key === selectedEmailTemplateKey) || emailModalTemplates[0];

        setIsSendingBatchEmail(true);
        let successCount = 0;
        let failCount = 0;
        const recipientResults = [];

        // Özel şablon varsa veritabanından al
        let customSubject = null;
        let customHtml = null;
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../../lib/firebase');
            const docSnap = await getDoc(doc(db, 'email_templates', selectedEmailTemplateKey));
            if (docSnap.exists()) {
                customSubject = docSnap.data().subject;
                customHtml = docSnap.data().body;
            }
        } catch (e) {
            console.warn("Could not load template from firestore:", e);
        }

        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';

        for (let i = 0; i < eligible.length; i++) {
            const p = eligible[i];
            const globalU = resolveParticipantUser(p, users);
            const targetEmail = (p.email || globalU.email || '').trim().toLowerCase();
            const pName = p.name || globalU.name || targetEmail;
            let pPass = (globalU.password || p.password || '').trim();

            if (!pPass && (selectedEmailTemplateKey === 'credentials_email' || selectedEmailTemplateKey === 'forgot_password')) {
                pPass = generateSecurePassword(pName);
                try {
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('../../lib/firebase');
                    if (globalU.id) {
                        await updateDoc(doc(db, 'users', globalU.id), { password: pPass });
                        await updateUser(globalU.id, { password: pPass });
                    }
                } catch (err) {
                    console.warn("Save password error:", err);
                }
            }
            if (!pPass) pPass = '123456';

            setBatchEmailProgress({ current: i + 1, total: eligible.length, name: pName, successCount, failCount });

            let payload = {
                ...smtpConfig,
                to: targetEmail,
                corporateName: corporateName || 'Move Yanımda',
                participantName: pName,
                tourName: tour.name,
                accountName: pName,
                accountEmail: targetEmail,
                accountPassword: pPass,
                password: pPass,
                customSubject,
                customHtml
            };

            if (selectedEmailTemplateKey === 'ticket_email') {
                payload.flights = p.flights || [];
                payload.ticketPdf = p.ticketPdf || (p.ticketFiles && p.ticketFiles[0]) || null;
            }

            let sentOk = false;
            let lastError = '';

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const res = await fetch(`${baseUrl}${targetTpl.endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        sentOk = true;
                        break;
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        lastError = errData.message || `Sunucu yanıtı: ${res.status}`;
                        if (attempt === 1) {
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                } catch (err) {
                    lastError = err.message;
                    if (attempt === 1) {
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }

            if (sentOk) {
                successCount++;
                recipientResults.push({
                    id: p.id || globalU.id || String(i),
                    name: pName,
                    email: targetEmail,
                    status: 'success',
                    reason: 'E-posta başarıyla iletildi.'
                });
            } else {
                failCount++;
                console.warn(`Email send failed for ${targetEmail}:`, lastError);
                recipientResults.push({
                    id: p.id || globalU.id || String(i),
                    name: pName,
                    email: targetEmail,
                    status: 'failed',
                    reason: lastError || 'E-posta gönderimi başarısız oldu.'
                });
            }

            // Gmail SMTP rate-limit önleme: Güvenli bekleme ve 25'li paket soğuma süresi
            if (i > 0 && i % 25 === 0) {
                await new Promise(r => setTimeout(r, 3000));
            } else {
                await new Promise(r => setTimeout(r, 650));
            }
        }

        const newEmailReport = {
            id: 'mail_rep_' + Date.now(),
            type: 'email',
            templateKey: selectedEmailTemplateKey,
            templateTitle: targetTpl.title,
            createdAt: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            totalRecipients: participants.length,
            successCount,
            failCount,
            details: recipientResults
        };

        const existingEmailReports = tour?.emailReports || [];
        const updatedEmailReports = [newEmailReport, ...existingEmailReports];

        // Başarılı katılımcıların e-posta durumunu güncelle
        const successfulEmails = new Set(recipientResults.filter(r => r.status === 'success').map(r => r.email.toLowerCase()));
        const updatedParticipants = (tour?.participants || []).map(tp => {
            const tpEmail = (tp.email || '').toLowerCase();
            if (successfulEmails.has(tpEmail)) {
                return { ...tp, emailSent: true, lastEmailSentAt: Date.now() };
            }
            return tp;
        });

        try {
            await editTour(tourId, { emailReports: updatedEmailReports, participants: updatedParticipants });
        } catch (e) {
            console.warn("Could not save emailReports to tour:", e);
        }

        setIsSendingBatchEmail(false);
        setBatchEmailProgress(null);
        setShowEmailPage(false);
        setSuccessPopup({
            title: 'E-Posta Gönderimi Tamamlandı',
            description: `Seçilen "${targetTpl.title}" şablonu katılımcılara e-posta olarak iletildi.`,
            stats: [
                { label: 'Toplam Hedef', value: eligible.length },
                { label: 'Başarılı', value: successCount, color: '#16a34a' },
                { label: 'Başarısız', value: failCount, color: failCount > 0 ? '#dc2626' : '#64748b' }
            ],
            type: failCount === eligible.length ? 'error' : 'success'
        });
    };

    const sendTourAssignmentEmail = async (participantName, participantEmail, password = null, participantPhone = '') => {
        const targetUser = users.find(u => u.email === participantEmail || u.name === participantName);
        if (isUserChild(targetUser) || isChildEmail(participantEmail)) {
            console.log(`Çocuk kullanıcı (${participantName}) için e-posta ve bildirim gönderimi atlandı.`);
            return;
        }

        let phone = participantPhone;
        if (!phone) {
            phone = targetUser?.phone || '';
        }
        const isInternalPlaceholder = participantEmail && (participantEmail.endsWith('@move.local') || participantEmail.endsWith('.local'));

        if (phone && phone !== '-' && phone.trim().length > 6) {
            if (password) {
                // Yeni kullanıcı eklendiğinde sırasıyla:
                // 1) welcome_customer
                // 2) welcome_account_activation
                sendWelcomeAndActivationWhatsApp(targetUser || {
                    id: targetUser?.id || participantEmail,
                    name: participantName,
                    phone: phone,
                    email: participantEmail
                }).then(() => {
                    // 3) tour_registration (2 params: Name, Tour Name)
                    useSettingsStore.getState().sendWhatsAppNotification(
                        phone,
                        'newTourTemplate',
                        [participantName, tour.name]
                    );
                }).catch(err => {
                    console.warn("sendWelcomeAndActivationWhatsApp in sendTourAssignmentEmail error:", err);
                    useSettingsStore.getState().sendWhatsAppNotification(
                        phone,
                        'newTourTemplate',
                        [participantName, tour.name]
                    );
                });
            } else {
                // 1) tour_registration (2 params: Name, Tour Name)
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newTourTemplate',
                    [participantName, tour.name]
                );
            }
        }

        if (canUserReceiveEmail(participantEmail, users) && !isInternalPlaceholder) {
            if (smtpConfig?.host && smtpConfig?.user) {
                try {
                    let customSubject = null;
                    let customHtml = null;
                    try {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const { db } = await import('../../lib/firebase');
                        const docSnap = await getDoc(doc(db, 'email_templates', 'tour_email'));
                        if (docSnap.exists()) {
                            customSubject = docSnap.data().subject;
                            customHtml = docSnap.data().body;
                        }
                    } catch (templateErr) {
                        console.error("Error loading tour email template:", templateErr);
                    }

                    let setupLinkInfo = null;
                    const userObj = targetUser || users.find(u => u.email === participantEmail || u.name === participantName);
                    if (userObj && userObj.id) {
                        try {
                            setupLinkInfo = await createPasswordSetupLink(userObj);
                        } catch (lnkErr) {
                            console.warn("Setup link generation error in sendTourAssignmentEmail:", lnkErr);
                        }
                    }

                    // Determine base URL: Use current origin in dev, or the production cloud functions URL
                    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
                    const res = await fetch(`${baseUrl}/api/send-tour-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...smtpConfig,
                            to: participantEmail,
                            corporateName: corporateName,
                            participantName: participantName,
                            tourName: tour.name,
                            setupUrl: setupLinkInfo?.url || `${baseUrl}/set-password`,
                            customSubject,
                            customHtml
                        })
                    });

                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        alert("Mail Gönderim Hatası: " + (err.message || `Sunucu ${res.status} hatası döndürdü.`));
                    }
                } catch(e) {
                    console.error("Email send error", e);
                }
            } else {
                console.log("SMTP ayarları bulunamadı, e-posta gönderimi atlandı.");
            }
        }
    };

    const selectUserFromAutocomplete = async (u) => {
        try {
            setShowAutocomplete(false);
            if (!u) return;
            if (u.role !== 'customer') {
                setSearchError('Sadece müşteri rolündeki kullanıcılar katılımcı olarak eklenebilir!');
                return;
            }
            const isAlreadyInTour = participants.some(p => p.id === u.id || isRealEmailMatch(p.email, u.email));
            if (isAlreadyInTour) {
                setSearchError('Bu müşteri zaten seyahate kayıtlı!');
                return;
            }
            addParticipantToTour(tourId, u);
            const isExistingChild = isUserChild(u);
            if (!isExistingChild) {
                await sendTourAssignmentEmail(u.name, u.email, null, u.phone);
            }
            setSuccessPopup({
                title: isExistingChild ? 'Çocuk Katılımcı Eklendi' : 'Katılımcı Başarıyla Eklendi',
                description: isExistingChild 
                    ? `${u.name} adlı çocuk katılımcı seyahate dahil edildi.` 
                    : `Kullanıcı sistemde bulundu (${u.name}) ve seyahate dahil edildi.`,
                email: isExistingChild ? undefined : (u.email || u.phone),
                tourName: tour.name
            });
            resetWizard();
        } catch (err) {
            console.error("selectUserFromAutocomplete error:", err);
            setSearchError('Katılımcı eklenirken bir hata oluştu: ' + (err.message || ''));
        }
    };

    const handleEmailSearch = async () => {
        try {
            if (!emailQuery || !emailQuery.trim()) return;
            setSearchError('');

            const rawQuery = emailQuery.trim();
            const query = normalizeEmail(rawQuery);
            const cleanPhoneQuery = rawQuery.replace(/\D/g, '');

            let existing = findUserByEmail(query || rawQuery);
            if (!existing && cleanPhoneQuery.length >= 7) {
                existing = users.find(u => {
                    const uPhone = (u.phone || '').replace(/\D/g, '');
                    return uPhone.length >= 7 && (uPhone.endsWith(cleanPhoneQuery.slice(-10)) || cleanPhoneQuery.endsWith(uPhone.slice(-10)));
                });
            }

            // Name Search (Exact or Partial match)
            if (!existing && rawQuery.length >= 2) {
                const normQ = normalizeTurkish(rawQuery);
                // 1. Exact name
                existing = users.find(u => u.name && normalizeTurkish(u.name) === normQ);
                
                // 2. Single candidate with startsWith or includes
                if (!existing) {
                    const candidates = (users || []).filter(u => u.role === 'customer' && u.name && normalizeTurkish(u.name).includes(normQ));
                    if (candidates.length === 1) {
                        existing = candidates[0];
                    } else if (candidates.length > 1) {
                        setShowAutocomplete(true);
                        setSearchError(`'${rawQuery}' ile eşleşen ${candidates.length} kayıtlı misafir bulundu. Lütfen listeden seçin.`);
                        return;
                    }
                }
            }

            if (existing) {
                if (existing.role !== 'customer') {
                    setSearchError('Sadece müşteri rolündeki kullanıcılar katılımcı olarak eklenebilir!');
                    return;
                }
                const isAlreadyInTour = participants.some(p => p.id === existing.id || isRealEmailMatch(p.email, existing.email));
                if (isAlreadyInTour) {
                    setSearchError('Bu müşteri zaten seyahate kayıtlı!');
                } else {
                    addParticipantToTour(tourId, existing);
                    const isExistingChild = isUserChild(existing);
                    if (!isExistingChild) {
                        await sendTourAssignmentEmail(existing.name, existing.email, null, existing.phone);
                    }
                    setSuccessPopup({
                        title: isExistingChild ? 'Çocuk Katılımcı Eklendi' : 'Katılımcı Başarıyla Eklendi',
                        description: isExistingChild 
                            ? `${existing.name} adlı çocuk katılımcı seyahate dahil edildi.` 
                            : `Kullanıcı sistemde bulundu (${existing.name}) ve seyahate dahil edildi.`,
                        email: isExistingChild ? undefined : (existing.email || existing.phone),
                        tourName: tour.name
                    });
                    resetWizard();
                }
            } else {
                if (cleanPhoneQuery.length >= 10 && !rawQuery.includes('@')) {
                    setNewPhone(formatPhoneNumber(cleanPhoneQuery));
                    setEmailQuery('');
                    setNewName('');
                } else if (!rawQuery.includes('@') && isNaN(rawQuery.replace(/\s/g, ''))) {
                    setNewName(formatTitleCase(rawQuery));
                    setEmailQuery('');
                    setNewPhone('');
                } else {
                    setNewName('');
                    setNewPhone('');
                }
                setStep(1.5);
            }
        } catch (err) {
            console.error("handleEmailSearch error:", err);
            setSearchError('Arama sırasında bir hata oluştu: ' + (err.message || ''));
        }
    };

    const handleCreateUser = async () => {
        const isChild = newCustomerType === 'child';

        if (!newName.trim()) {
            alert('Lütfen İsim Soyisim alanını doldurun.');
            return;
        }

        const hasEmail = Boolean(emailQuery && emailQuery.trim() && emailQuery.includes('@'));
        const rawPhone = (newPhone || '').trim();
        const cleanDigits = rawPhone.replace(/\D/g, '');
        const hasPhone = cleanDigits.length >= 10;

        if (!isChild && !hasEmail && !hasPhone) {
            alert('Lütfen en az bir iletişim bilgisi (E-posta veya Telefon Numarası) girin.');
            return;
        }

        if (!isChild && !newCompany.trim()) {
            alert('Lütfen Firma alanını doldurun.');
            return;
        }

        const generateSecurePassword = (fullName) => {
            const nameStr = fullName.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
            let base = nameStr.length > 0 ? nameStr : 'User';
            let prefix = base.slice(0, 3).toLocaleLowerCase('tr-TR');
            if (prefix.length < 3) prefix = prefix.padEnd(3, 'a');
            prefix = prefix.charAt(0).toLocaleUpperCase('tr-TR') + prefix.slice(1);
            
            const numPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
            const chars = ['!', '?'];
            const specialChar = chars[Math.floor(Math.random() * chars.length)];
            
            return prefix + numPart + specialChar;
        };

        const compValue = isChild ? 'Move Travel & Mice' : (newCompany.trim() || 'Move Travel & Mice');
        if (!isChild && compValue && !companies.includes(compValue)) {
            addCompany(compValue);
        }

        const formattedPhone = rawPhone ? normalizePhoneNumber(rawPhone) : '-';

        let finalEmail;
        if (isChild) {
            finalEmail = `child_${Date.now()}@move.local`;
        } else if (hasEmail) {
            finalEmail = emailQuery.trim().toLowerCase();
        } else {
            finalEmail = '';
        }

        const newUserPassword = generateSecurePassword(newName);

        const newUser = await addUser({
            name: newName,
            email: finalEmail,
            role: 'customer',
            userType: 'corporate',
            phone: isChild ? '-' : formattedPhone,
            company: compValue,
            password: newUserPassword,
            linkedTo: isChild && newParentIds.length > 0 ? newParentIds : null,
            isChildProfile: isChild,
            tcNo: newTcNo
        });

        // Link existing children to this new parent (if parent)
        if (!isChild && newChildrenIds.length > 0) {
            for (const childId of newChildrenIds) {
                const childObj = participants.find(p => p.id === childId);
                if (childObj) {
                    const existingLinkedTo = Array.isArray(childObj.linkedTo) ? childObj.linkedTo : (typeof childObj.linkedTo === 'string' ? [childObj.linkedTo] : []);
                    const cleanLinkedTo = existingLinkedTo.filter(id => id && String(id).trim() !== '');
                    if (!cleanLinkedTo.includes(newUser.id)) {
                        await updateUser(childId, { linkedTo: [...cleanLinkedTo, newUser.id] });
                    }
                }
            }
        }

        addParticipantToTour(tourId, newUser);

        if (isChild) {
            const parentNames = newParentIds.map(pid => participants.find(p => p.id === pid)?.name).filter(Boolean).join(', ');
            setSuccessPopup({
                title: 'Çocuk Profili Oluşturuldu',
                description: `${newUser.name} adlı çocuk profili başarıyla oluşturuldu${parentNames ? ' ve ' + parentNames + ' hesabına bağlandı.' : '.'}`
            });
        } else {
            if (newUser.email) {
                await sendTourAssignmentEmail(newUser.name, newUser.email, newUserPassword, newUser.phone);
            }
            setSuccessPopup({
                title: 'Yeni Profil Oluşturuldu',
                description: `Kullanıcı başarıyla oluşturuldu ve tura dahil edildi.`,
                name: newUser.name,
                email: newUser.email || newUser.phone,
                password: newUserPassword,
                tourName: tour.name
            });
        }

        resetWizard();
    };

    const renderProfileView = () => {
        if (!selectedUser) return null;
        return (
            <div style={{ paddingBottom: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
                {/* Header */}
                <div style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 22px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 10, 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div onClick={() => setShowSht(false)} style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>Müşteri Profili</h2>
                            <div style={{ fontSize: '11px', opacity: 0.9 }}>{selectedUser.name}</div>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div style={{ 
                    padding: '16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px',
                    animation: 'fadeIn 0.2s ease'
                }}>
                        {/* 1. Hero Identity & Quick Contact Card */}
                        <div style={{ 
                            background: 'white', 
                            borderRadius: '20px', 
                            padding: '20px 18px', 
                            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img 
                                    loading="lazy" 
                                    src={selectedUser.avatar} 
                                    alt="Avatar" 
                                    style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '50%', 
                                        objectFit: 'cover', 
                                        border: '1.5px solid #f1f5f9', 
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                        flexShrink: 0
                                    }} 
                                />
                                <div style={{ width: '1px', height: '34px', background: '#e2e8f0', flexShrink: 0 }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                        <h2 style={{ fontSize: '15px', fontWeight: '750', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.2px', lineHeight: 1.25 }}>
                                            {selectedUser.name}
                                        </h2>
                                        {isUserChild(selectedUser) && (
                                            <span style={{ background: '#fdf4ff', color: '#a21caf', border: '1px solid #fae8ff', fontSize: '9.5px', fontWeight: '700', padding: '1px 6px', borderRadius: '6px' }}>
                                                🎈 Çocuk
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Building size={12} color="#94a3b8" />
                                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {selectedUser.company || 'Bireysel Müşteri'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Action Buttons */}
                            {!isUserChild(selectedUser) && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px' }}>
                                    <button
                                        onClick={() => {
                                            if (selectedUser.phone && selectedUser.phone !== '-') {
                                                window.location.href = `tel:${selectedUser.phone}`;
                                            } else {
                                                alert("Kullanıcıya ait telefon numarası kayıtlı değil.");
                                            }
                                        }}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '12px',
                                            background: '#f0fdf4',
                                            color: '#16a34a',
                                            border: '1px solid #dcfce7',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '12.5px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <Phone size={15} /> Ara
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowSht(false);
                                            navigate(`/dashboard/chat/direct_${tour.id}_${selectedUser.id}`);
                                        }}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '12px',
                                            background: '#eff6ff',
                                            color: '#2563eb',
                                            border: '1px solid #dbeafe',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '12.5px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <MessageCircle size={15} /> Mesaj
                                    </button>
                                </div>
                            )}

                            {/* Compact Stats Strip */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '10px', 
                                background: '#f8fafc', 
                                padding: '10px 14px', 
                                borderRadius: '14px', 
                                border: '1px solid #f1f5f9' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Activity size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.1 }}>
                                            {calcUserStats(selectedUser.email || selectedUser.name).activeCount}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Aktif Tur</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <History size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.1 }}>
                                            {calcUserStats(selectedUser.email || selectedUser.name).pastCount}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Geçmiş Tur</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. E-Bilet (PDF) Card */}
                        {(() => {
                            const userPart = participants.find(p => p.id === selectedUser.id || isRealEmailMatch(p.email, selectedUser.email));
                            const tickets = (Array.isArray(userPart?.ticketFiles) && userPart.ticketFiles.length > 0)
                                ? userPart.ticketFiles
                                : ((Array.isArray(selectedUser?.ticketFiles) && selectedUser.ticketFiles.length > 0)
                                    ? selectedUser.ticketFiles
                                    : ((userPart?.ticketPdf || selectedUser?.ticketPdf) ? [userPart?.ticketPdf || selectedUser?.ticketPdf] : []));
                            const hasTickets = tickets.length > 0;

                            if (!hasTickets) {
                                return (
                                    <div style={{ 
                                        background: '#fffbeb', 
                                        border: '1px solid #fef3c7', 
                                        borderRadius: '18px', 
                                        padding: '14px 16px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        gap: '12px' 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <div style={{ 
                                                width: '38px', 
                                                height: '38px', 
                                                borderRadius: '12px', 
                                                background: '#fef3c7', 
                                                color: '#d97706', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                flexShrink: 0 
                                            }}>
                                                <Ticket size={20} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    E-Bilet PDF Bekleniyor
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#b45309' }}>
                                                    Henüz bilet PDF'i yüklenmedi
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowTransferSheet(true)}
                                            style={{
                                                background: '#d97706',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                fontSize: '11.5px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            Yükle
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ 
                                    background: '#f0fdf4', 
                                    border: '1px solid #bbf7d0', 
                                    borderRadius: '18px', 
                                    padding: '14px 16px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '10px' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '10px', 
                                                background: '#dcfce7', 
                                                color: '#16a34a', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                flexShrink: 0 
                                            }}>
                                                <Ticket size={17} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                                                    Resmi E-Biletler ({tickets.length} Adet PDF)
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#15803d' }}>
                                                    Sisteme kayıtlı uçuş belgeleri
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowTransferSheet(true)}
                                            style={{
                                                background: 'white',
                                                color: '#16a34a',
                                                border: '1px solid #86efac',
                                                padding: '5px 10px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Yönet / Ekle
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {tickets.map((t, tIdx) => {
                                            const url = typeof t === 'string' ? t : t?.url;
                                            const name = typeof t === 'object' ? (t.name || `Bilet_${tIdx + 1}.pdf`) : `Bilet_${tIdx + 1}.pdf`;
                                            return (
                                                <div key={t.id || tIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #dcfce7', borderRadius: '10px', padding: '8px 10px', gap: '8px' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }} title={name}>
                                                        📄 {name}
                                                    </div>
                                                    <a 
                                                        href={url} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        style={{ 
                                                            background: '#16a34a', 
                                                            color: 'white', 
                                                            textDecoration: 'none', 
                                                            padding: '5px 10px', 
                                                            borderRadius: '7px', 
                                                            fontSize: '11px', 
                                                            fontWeight: 'bold', 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '4px', 
                                                            flexShrink: 0 
                                                        }}
                                                    >
                                                        Aç / İndir
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 3. Kimlik & Pasaport Bilgileri Card */}
                        {selectedUser.role === 'customer' && (
                            <div style={{ 
                                background: 'white', 
                                borderRadius: '18px', 
                                padding: '16px 14px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '12px', 
                                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                    <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                                        Kimlik & Pasaport Bilgileri
                                    </h3>
                                    {selectedUser.identityLastEditedBy && (
                                        <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <History size={10} /> Güncellendi
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>T.C. Kimlik Numarası</label>
                                        <input 
                                            type="text" 
                                            maxLength={11} 
                                            placeholder="Örn: 12345678901" 
                                            value={identityForm.tcNo || ''} 
                                            onChange={e => setIdentityForm({ ...identityForm, tcNo: e.target.value.replace(/\D/g, '') })} 
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '11.5px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Pasaport Ülkesi</label>
                                        <input 
                                            type="text" 
                                            placeholder="Örn: Türkiye" 
                                            value={identityForm.passportCountry} 
                                            onChange={e => setIdentityForm({ ...identityForm, passportCountry: e.target.value })} 
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '11.5px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Pasaport No</label>
                                        <input 
                                            type="text" 
                                            placeholder="Örn: U12345678" 
                                            value={identityForm.passportNo} 
                                            onChange={e => setIdentityForm({ ...identityForm, passportNo: e.target.value })} 
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '11.5px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>P. Geçerlilik Tarihi</label>
                                        <input 
                                            type="date" 
                                            value={identityForm.passportExp} 
                                            onChange={e => setIdentityForm({ ...identityForm, passportExp: e.target.value })} 
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '11.5px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Doğum Tarihi</label>
                                        <input 
                                            type="date" 
                                            value={identityForm.birthDate} 
                                            onChange={e => setIdentityForm({ ...identityForm, birthDate: e.target.value })} 
                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '11.5px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        setIsSavingIdentity(true);
                                        const payload = {
                                            ...identityForm,
                                            identityLastEditedBy: user?.name + (user?.role === 'admin' ? ' (Admin)' : ' (Yönetici)'),
                                            identityLastEditedAt: new Date().toISOString()
                                        };
                                        await updateUser(selectedUser.id, payload);
                                        setSelectedUser({ ...selectedUser, ...payload });
                                        setIsSavingIdentity(false);
                                        alert('Müşterinin kimlik bilgileri başarıyla güncellendi!');
                                    }}
                                    style={{ 
                                        background: 'var(--primary)', 
                                        border: 'none', 
                                        padding: '10px', 
                                        borderRadius: '10px', 
                                        color: 'white', 
                                        fontSize: '11.5px',
                                        fontWeight: '700', 
                                        cursor: 'pointer', 
                                        marginTop: '4px', 
                                        boxShadow: '0 3px 10px rgba(215, 20, 122, 0.2)', 
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                    disabled={isSavingIdentity}
                                >
                                    <CheckCircle2 size={14} />
                                    {isSavingIdentity ? 'Kaydediliyor...' : 'Pasaport Bilgilerini Kaydet'}
                                </button>
                            </div>
                        )}

                        {/* 4. Sağlık & Acil Durum Bilgileri Card */}
                        {selectedUser.role === 'customer' && (
                            <div style={{ 
                                background: 'white', 
                                borderRadius: '18px', 
                                padding: '16px 14px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '12px', 
                                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)', 
                                border: '1px solid #e2e8f0' 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                    <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                                        Sağlık & Acil Durum
                                    </h3>
                                    <span style={{ fontSize: '9.5px', color: '#854d0e', background: '#fef9c3', padding: '2px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                        <Lock size={9} /> Müşteri Özel
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Kan Grubu</label>
                                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-main)' }}>
                                            {identityForm.bloodType || 'Belirtilmedi'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Alerjiler</label>
                                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {identityForm.allergies || 'Belirtilmedi'}
                                        </div>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>İlaçlar & Beslenme</label>
                                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '500', color: 'var(--text-main)' }}>
                                            {identityForm.medications || identityForm.dietaryReq ? `${identityForm.medications || ''} ${identityForm.dietaryReq ? '• ' + identityForm.dietaryReq : ''}` : 'Belirtilmedi'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Acil Durum Kişisi</label>
                                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {identityForm.emergencyContactName || 'Belirtilmedi'}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Acil Durum Tel</label>
                                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {identityForm.emergencyContactPhone || 'Belirtilmedi'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4.5. Mobil Uygulama & Giriş Durumu Card */}
                        {!isUserChild(selectedUser) && (() => {
                            const selStatus = getParticipantCommStatus(selectedUser, selectedUser);
                            return (
                                <div style={{ 
                                    background: 'white', 
                                    borderRadius: '18px', 
                                    padding: '16px 14px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '12px', 
                                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                                    border: '1px solid #e2e8f0' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                        <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Smartphone size={15} color="#d7147a" />
                                            Mobil Uygulama & Oturum
                                        </h3>
                                        {selStatus.hasInstalledApp ? (
                                            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#15803d', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Check size={11} strokeWidth={3} /> Yüklendi
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '10.5px', fontWeight: '600', color: selStatus.appStatus === 'web' ? '#0369a1' : '#64748b', background: selStatus.appStatus === 'web' ? '#e0f2fe' : '#f1f5f9', border: selStatus.appStatus === 'web' ? '1px solid #bae6fd' : '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
                                                {selStatus.appStatus === 'web' ? 'Yalnızca Web' : 'Giriş Bekleniyor'}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Kullanılan Platform</label>
                                            <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '700', color: selStatus.appStatus === 'native_ios' || selStatus.appStatus === 'native_android' ? '#15803d' : (selStatus.appStatus === 'web' ? '#0369a1' : '#64748b') }}>
                                                {selStatus.appStatus === 'native_ios' ? '📱 Apple iOS App' : (selStatus.appStatus === 'native_android' ? '🤖 Android App' : (selStatus.appStatus === 'web' ? '🌐 Web Tarayıcısı' : '⏳ Giriş Yapılmadı'))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Toplam Oturum</label>
                                            <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                                                {selStatus.loginCount ? `${selStatus.loginCount} Giriş` : '0 Giriş'}
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Son Giriş / Aktivite Tarihi</label>
                                            <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '11.5px', fontWeight: '600', color: selStatus.lastLoginAt ? '#1e293b' : '#94a3b8' }}>
                                                {selStatus.lastLoginAt ? new Date(selStatus.lastLoginAt).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' }) : 'Henüz sisteme giriş yapmadı'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 5. İletişim Bilgileri Card */}
                        {!isUserChild(selectedUser) && (
                            <div style={{ 
                                background: 'white', 
                                borderRadius: '18px', 
                                padding: '16px 14px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '12px', 
                                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                                border: '1px solid #e2e8f0' 
                            }}>
                                <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', color: 'var(--text-main)' }}>
                                    İletişim & Bildirimler
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} color="#64748b" /> E-Posta
                                            </label>
                                            {!contactForm.email && (
                                                <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '600', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                                    Tanımlı Değil
                                                </span>
                                            )}
                                        </div>
                                        <input 
                                            type="email" 
                                            placeholder="Henüz Mail Adresi Tanımlı Değil"
                                            value={contactForm.email} 
                                            onChange={e => setContactForm({ ...contactForm, email: e.target.value })} 
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px 10px', 
                                                borderRadius: '9px', 
                                                border: '1px solid #e2e8f0', 
                                                fontSize: '11.5px', 
                                                background: '#f8fafc', 
                                                outline: 'none', 
                                                boxSizing: 'border-box',
                                                color: 'var(--text-main)',
                                                fontWeight: '600'
                                            }} 
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={12} color="#64748b" /> Telefon
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '10px', fontSize: '11.5px', color: '#94a3b8', fontWeight: '600', pointerEvents: 'none' }}>+90</span>
                                            <input 
                                                type="tel" 
                                                placeholder="5XX XXX XX XX"
                                                maxLength={20}
                                                value={formatPhoneInputWithoutPrefix(contactForm.phone || '')} 
                                                onChange={e => setContactForm({ ...contactForm, phone: formatPhoneInputWithoutPrefix(e.target.value) })} 
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 10px 8px 38px', 
                                                    borderRadius: '9px', 
                                                    border: '1px solid #e2e8f0', 
                                                    fontSize: '11.5px', 
                                                    background: '#f8fafc', 
                                                    outline: 'none', 
                                                    boxSizing: 'border-box',
                                                    color: 'var(--text-main)',
                                                    fontWeight: '600'
                                                }} 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <KeyRound size={12} color="#64748b" /> Giriş Şifresi
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {!contactForm.password && (
                                                    <button
                                                        type="button"
                                                        onClick={handleGeneratePassword}
                                                        style={{
                                                            background: '#fdf2f8',
                                                            border: '1px solid #fbcfe8',
                                                            color: 'var(--primary)',
                                                            fontSize: '9.5px',
                                                            fontWeight: '700',
                                                            padding: '2px 7px',
                                                            borderRadius: '5px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '3px'
                                                        }}
                                                    >
                                                        <Sparkles size={10} /> Yeni Şifre Üret
                                                    </button>
                                                )}
                                                {contactForm.password ? (
                                                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                                                        Kayıtlı
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '600', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                                        Tanımlı Değil
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                            <input 
                                                type={showContactPassword ? "text" : "password"} 
                                                placeholder="Şifre henüz tanımlanmamış"
                                                value={contactForm.password || ''} 
                                                onChange={e => setContactForm({ ...contactForm, password: e.target.value })} 
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px 70px 8px 10px', 
                                                    borderRadius: '9px', 
                                                    border: '1px solid #e2e8f0', 
                                                    fontSize: '11.5px', 
                                                    background: '#f8fafc', 
                                                    outline: 'none', 
                                                    boxSizing: 'border-box',
                                                    color: 'var(--text-main)',
                                                    fontWeight: '600',
                                                    letterSpacing: (!showContactPassword && contactForm.password) ? '2px' : 'normal'
                                                }} 
                                            />
                                            <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                {contactForm.password && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(contactForm.password);
                                                            setPasswordCopied(true);
                                                            setTimeout(() => setPasswordCopied(false), 2000);
                                                        }}
                                                        title={passwordCopied ? "Kopyalandı!" : "Şifreyi Kopyala"}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: passwordCopied ? '#16a34a' : '#64748b',
                                                            borderRadius: '6px'
                                                        }}
                                                    >
                                                        {passwordCopied ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowContactPassword(prev => !prev)}
                                                    title={showContactPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#64748b',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    {showContactPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        {passwordCopied && (
                                            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600', marginTop: '3px', display: 'block' }}>
                                                ✓ Şifre panoya kopyalandı!
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleSaveContact}
                                        disabled={isSavingContact}
                                        style={{ 
                                            background: 'var(--primary)', 
                                            border: 'none', 
                                            padding: '10px', 
                                            borderRadius: '10px', 
                                            color: 'white', 
                                            fontSize: '11.5px',
                                            fontWeight: '700', 
                                            cursor: isSavingContact ? 'not-allowed' : 'pointer', 
                                            opacity: isSavingContact ? 0.7 : 1,
                                            marginTop: '2px', 
                                            boxShadow: '0 3px 10px rgba(215, 20, 122, 0.2)', 
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <CheckCircle2 size={14} />
                                        {isSavingContact ? 'Kaydediliyor...' : 'İletişim Bilgilerini Kaydet'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSendCredentialsEmail}
                                        disabled={isSendingCredentials || !contactForm.email}
                                        title={!contactForm.email ? 'Kullanıcının tanımlı bir e-posta adresi bulunmuyor.' : ''}
                                        style={{ 
                                            background: '#fff', 
                                            border: '1.5px solid var(--primary)', 
                                            padding: '10px', 
                                            borderRadius: '10px', 
                                            color: 'var(--primary)', 
                                            fontSize: '11.5px',
                                            fontWeight: '700', 
                                            cursor: (isSendingCredentials || !contactForm.email) ? 'not-allowed' : 'pointer', 
                                            opacity: (isSendingCredentials || !contactForm.email) ? 0.6 : 1,
                                            marginTop: '4px', 
                                            boxShadow: '0 2px 6px rgba(215, 20, 122, 0.08)', 
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSendingCredentials && contactForm.email) {
                                                e.currentTarget.style.background = '#fdf2f8';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#fff';
                                        }}
                                    >
                                        {isSendingCredentials ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <KeyRound size={14} />
                                        )}
                                        {isSendingCredentials ? 'Giriş Bilgileri Gönderiliyor...' : 'Kullanıcı Adı ve Şifreyi E-Posta ile Gönder'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCopyPasswordSetupLink}
                                        disabled={isCopyingSetupLink}
                                        title="Kullanıcının şifresini kendisinin belirlemesi için tek kullanımlık güvenli bir sihirli bağlantı üretir ve panoya kopyalar."
                                        style={{ 
                                            background: '#f8fafc', 
                                            border: '1.5px dashed #cbd5e1', 
                                            padding: '10px', 
                                            borderRadius: '10px', 
                                            color: '#334155', 
                                            fontSize: '11.5px',
                                            fontWeight: '700', 
                                            cursor: isCopyingSetupLink ? 'not-allowed' : 'pointer', 
                                            opacity: isCopyingSetupLink ? 0.7 : 1,
                                            marginTop: '4px', 
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isCopyingSetupLink) {
                                                e.currentTarget.style.background = '#f1f5f9';
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                e.currentTarget.style.color = 'var(--primary)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.color = '#334155';
                                        }}
                                    >
                                        {isCopyingSetupLink ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : setupLinkCopied ? (
                                            <Check size={14} style={{ color: '#16a34a' }} />
                                        ) : (
                                            <Sparkles size={14} style={{ color: '#e11d48' }} />
                                        )}
                                        {setupLinkCopied 
                                            ? '✓ Bağlantı Kopyalandı!' 
                                            : isCopyingSetupLink 
                                                ? 'Bağlantı Oluşturuluyor...' 
                                                : 'Şifre Belirleme Bağlantısını Kopyala'}
                                    </button>

                                    {credentialSentMessage && (
                                        <div style={{
                                            background: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: '8px',
                                            padding: '8px 10px',
                                            fontSize: '11px',
                                            color: '#166534',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginTop: '2px'
                                        }}>
                                            <CheckCircle2 size={13} color="#16a34a" />
                                            <span>{credentialSentMessage}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 2px 0', borderTop: '1px solid #f1f5f9', marginTop: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: selectedUser.pushEnabled ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedUser.pushEnabled ? '#10B981' : '#f59e0b' }}>
                                            {selectedUser.pushEnabled ? <BellRing size={15} /> : <BellOff size={15} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Push Bildirim İzni</div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: selectedUser.pushEnabled ? '#10B981' : '#d97706' }}>
                                                {selectedUser.pushEnabled ? 'Aktif (Bildirim Alabilir)' : 'Kapalı'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. Aile & Çocuk Bağlantıları */}
                        {(() => {
                            const parentIdsRaw = Array.isArray(selectedUser.linkedTo)
                                ? selectedUser.linkedTo
                                : (typeof selectedUser.linkedTo === 'string' ? [selectedUser.linkedTo] : []);

                            const parentIds = parentIdsRaw.filter(id => id && String(id).trim() !== '');
                            const isChild = parentIds.length > 0;

                            if (isChild) {
                                return (
                                    <div style={{ background: 'white', borderRadius: '18px', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)' }}>
                                        <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            👨‍👩‍👧 Ebeveynler
                                        </h3>
                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                            Bu çocuğun bağlı olduğu ana müşteri profilleri:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {parentIds.map(parentId => {
                                                const parent = participants.find(p => p.id === parentId);
                                                return (
                                                    <div key={parentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', border: '1px solid #f1f5f9', borderRadius: '10px', background: '#f8fafc' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {parent ? (
                                                                <>
                                                                    <img src={parent.avatar} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>{parent.name}</span>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444' }}>⚠️ Geçersiz Bağlantı</span>
                                                            )}
                                                        </div>
                                                        <button onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const newLinkedTo = parentIds.filter(id => id !== parentId);
                                                            const val = newLinkedTo.length > 0 ? newLinkedTo : null;
                                                            await updateUser(selectedUser.id, { linkedTo: val });
                                                            setSelectedUser({ ...selectedUser, linkedTo: val });
                                                        }} style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div style={{ background: 'white', borderRadius: '18px', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)' }}>
                                        <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            👨‍👩‍👧‍👦 Bağlı Çocuklar
                                        </h3>
                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                            Bu müşterinin panelinden bilet ve seyahat bilgilerini görebileceği bağlı hesaplar:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {users.filter(u => u.linkedTo && (Array.isArray(u.linkedTo) ? u.linkedTo.includes(selectedUser.id) || u.linkedTo.includes(String(selectedUser.id)) : u.linkedTo === selectedUser.id || u.linkedTo === String(selectedUser.id))).map(fm => (
                                                <div key={fm.id} onClick={() => openProfile(fm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 10px', borderRadius: '10px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                                    <img src={fm.avatar} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fm.name}</div>
                                                        <div style={{ fontSize: '9.5px', color: '#64748b' }}>Bağlı Çocuk Profili</div>
                                                    </div>
                                                    <button onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const childLinkedToIds = Array.isArray(fm.linkedTo) ? fm.linkedTo : (fm.linkedTo ? [fm.linkedTo] : []);
                                                        const newLinkedTo = childLinkedToIds.filter(id => String(id) !== String(selectedUser.id));
                                                        await updateUser(fm.id, { linkedTo: newLinkedTo.length > 0 ? newLinkedTo : null });
                                                    }} style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ position: 'relative', marginTop: '2px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Çocuk hesabı ara ve bağla..." 
                                                value={profileChildSearchQuery}
                                                onChange={(e) => {
                                                    setProfileChildSearchQuery(e.target.value);
                                                    setShowProfileChildDropdown(true);
                                                }}
                                                onFocus={() => setShowProfileChildDropdown(true)}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '9px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '11.5px', background: '#f8fafc', boxSizing: 'border-box' }}
                                            />
                                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                                                <Search size={14} />
                                            </div>
                                            {showProfileChildDropdown && profileChildSearchQuery.trim().length > 0 && (
                                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', marginTop: '4px', zIndex: 100, maxHeight: '160px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                                    {users.filter(u => {
                                                        const isAlreadyLinked = u.linkedTo && (Array.isArray(u.linkedTo) ? u.linkedTo.includes(selectedUser.id) || u.linkedTo.includes(String(selectedUser.id)) : u.linkedTo === selectedUser.id || u.linkedTo === String(selectedUser.id));
                                                        return u.id !== selectedUser.id && isUserChild(u) && !isAlreadyLinked && u.name.toLowerCase().includes(profileChildSearchQuery.toLowerCase());
                                                    }).map(u => (
                                                        <div key={u.id} onClick={async () => {
                                                            const childLinkedToIds = Array.isArray(u.linkedTo) ? u.linkedTo : (u.linkedTo ? [u.linkedTo] : []);
                                                            const newLinkedTo = [...childLinkedToIds, selectedUser.id];
                                                            await updateUser(u.id, { linkedTo: newLinkedTo });
                                                            setProfileChildSearchQuery('');
                                                            setShowProfileChildDropdown(false);
                                                        }} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <img src={u.avatar} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '11.5px' }}>{u.name}</span>
                                                                <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{u.email}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        })()}

                        {/* 7. Bottom Sticky Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                            <button 
                                onClick={() => setShowTransferSheet(true)} 
                                style={{ 
                                    flex: 1, 
                                    padding: '12px', 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '8px', 
                                    background: 'var(--primary)', 
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '12.5px',
                                    fontWeight: '700', 
                                    cursor: 'pointer', 
                                    boxShadow: '0 4px 12px rgba(215, 20, 122, 0.2)' 
                                }}
                            >
                                <PlaneTakeoff size={16} /> Transfer & Uçuş Biletleri
                            </button>
                            <button 
                                onClick={() => setUserToRemove(selectedUser)} 
                                style={{ 
                                    width: '44px', 
                                    height: '44px', 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    background: '#fee2e2', 
                                    color: '#dc2626', 
                                    border: '1px solid #fecaca', 
                                    cursor: 'pointer',  
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                                title="Listeden Çıkar"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                </div>

                {/* Bottom clearance spacer so that cards & buttons are never covered by floating bottom nav & Tintin button */}
                <div style={{ height: '160px', minHeight: '160px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

                {/* Remove Confirmation Popup */}
                {userToRemove && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '340px', borderRadius: '24px', padding: '24px', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 12px' }}>Listeden Çıkart</h2>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
                                <b>{userToRemove.name}</b> adlı kişiyi bu seyahatin katılımcı listesinden tamamen çıkartmak istediğinize emin misiniz?
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setUserToRemove(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>İptal</button>
                                <button onClick={() => {
                                    removeParticipantFromTour(tourId, userToRemove.id);
                                    setUserToRemove(null);
                                    setShowSht(false);
                                }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#dc2626', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Evet, Çıkart</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Manager Layer */}
                {showTransferSheet && selectedUser && (
                    <ParticipantTransferManager
                        tourId={tourId}
                        participant={selectedUser}
                        onClose={() => setShowTransferSheet(false)}
                    />
                )}
            </div>
        );
    };

    const renderWaReportPageView = (report) => {
        const details = report.details || [];

        const successCount = details.filter(d => d.status === 'success').length;
        const failCount = details.filter(d => d.status === 'failed').length;
        const missingPhoneCount = details.filter(d => d.status === 'missing_phone').length;
        const childCount = details.filter(d => d.status === 'child_skipped').length;

        const reportFilterOptions = [
            ...(successCount > 0 ? [{ id: 'success', label: 'Başarılı İletilenler', count: successCount, icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4' }] : []),
            ...(failCount > 0 ? [{ id: 'failed', label: 'Hatalı / İletilemedi', count: failCount, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' }] : []),
            ...(missingPhoneCount > 0 ? [{ id: 'missing_phone', label: 'Telefonu Bulunmayanlar', count: missingPhoneCount, icon: PhoneOff, color: '#d97706', bg: '#fffbeb' }] : []),
            ...(childCount > 0 ? [{ id: 'child_skipped', label: 'Çocuk Katılımcılar', count: childCount, icon: Users, color: '#9333ea', bg: '#faf5ff' }] : [])
        ];

        const activeReportFilter = reportFilterOptions.find(o => o.id === waReportFilterTab) || null;
        const ActiveFilterIcon = activeReportFilter ? activeReportFilter.icon : Filter;

        const isSearchActive = !!waReportSearchQuery.trim();
        const hasGroupSelected = !!waReportFilterTab;

        let filteredDetails = [];
        if (hasGroupSelected || isSearchActive) {
            filteredDetails = details.filter(item => {
                if (waReportFilterTab && item.status !== waReportFilterTab) return false;

                if (isSearchActive) {
                    const q = waReportSearchQuery.trim().toLowerCase();
                    const matchName = (item.name || '').toLowerCase().includes(q);
                    const matchPhone = (item.phone || '').includes(q);
                    const matchCompany = (item.company || '').toLowerCase().includes(q);
                    const matchReason = (item.reason || '').toLowerCase().includes(q);
                    return matchName || matchPhone || matchCompany || matchReason;
                }
                return true;
            });
        }

        const displayedDetails = filteredDetails.slice(0, waReportVisibleCount);

        return (
            <div style={{ paddingBottom: '90px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
                {/* Sticky Header */}
                <div style={{ 
                    background: '#16a34a', 
                    color: 'white', 
                    padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 20px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 30, 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                            onClick={() => {
                                setSelectedWaReportForView(null);
                                setWaReportSearchQuery('');
                                setWaReportFilterTab('');
                                setWaReportVisibleCount(20);
                                setIsWaReportFilterOpen(false);
                            }} 
                            style={{ 
                                cursor: 'pointer', 
                                padding: '4px', 
                                display: 'flex', 
                                alignItems: 'center' 
                            }}
                        >
                            <ChevronLeft size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 1px', lineHeight: 1.2 }}>
                                WhatsApp Gönderim Detayları
                            </h2>
                            <div style={{ fontSize: '10.5px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                {report.templateTitle} • {report.dateFormatted}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <MessageSquare size={20} color="white" />
                    </div>
                </div>

                {/* Page Body Container */}
                <div style={{ padding: '16px', maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* 4 Özet İstatistik Kartı Container (Tıklanabilir Hızlı Filtre) */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            {/* Toplam */}
                            <div 
                                onClick={() => {
                                    setWaReportFilterTab('');
                                    setWaReportVisibleCount(20);
                                }}
                                style={{ 
                                    background: '#f8fafc', 
                                    border: '1px solid #edf2f7', 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>Toplam Hedef</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={13} color="#475569" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{report.totalRecipients || details.length}</div>
                                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                                    Kayıtlı katılımcı
                                </div>
                            </div>

                            {/* Başarılı */}
                            <div 
                                onClick={() => {
                                    if (successCount > 0) {
                                        setWaReportFilterTab(waReportFilterTab === 'success' ? '' : 'success');
                                        setWaReportVisibleCount(20);
                                    }
                                }}
                                style={{ 
                                    background: waReportFilterTab === 'success' ? '#ecfdf5' : '#f0fdf4', 
                                    border: waReportFilterTab === 'success' ? '2px solid #16a34a' : '1px solid #bbf7d0', 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: successCount > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                    boxShadow: waReportFilterTab === 'success' ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '700' }}>Başarılı İletildi</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={13} color="#16a34a" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>{report.successCount}</div>
                                <div style={{ fontSize: '9.5px', color: '#16a34a', marginTop: '2px' }}>
                                    WhatsApp iletildi
                                </div>
                            </div>

                            {/* Hatalı / Başarısız */}
                            <div 
                                onClick={() => {
                                    if (failCount > 0) {
                                        setWaReportFilterTab(waReportFilterTab === 'failed' ? '' : 'failed');
                                        setWaReportVisibleCount(20);
                                    }
                                }}
                                style={{ 
                                    background: waReportFilterTab === 'failed' ? '#fef2f2' : (failCount > 0 ? '#fff5f5' : '#f8fafc'), 
                                    border: waReportFilterTab === 'failed' ? '2px solid #dc2626' : (failCount > 0 ? '1px solid #fecaca' : '1px solid #edf2f7'), 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: failCount > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                    boxShadow: waReportFilterTab === 'failed' ? '0 2px 8px rgba(220, 38, 38, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: failCount > 0 ? '#dc2626' : '#64748b', fontWeight: '700' }}>Hatalı / İletilemedi</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: failCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={13} color={failCount > 0 ? '#dc2626' : '#64748b'} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: failCount > 0 ? '#dc2626' : '#64748b' }}>{report.failCount}</div>
                                <div style={{ fontSize: '9.5px', color: failCount > 0 ? '#dc2626' : '#64748b', marginTop: '2px' }}>
                                    {failCount > 0 ? `${failCount} gönderim hatası` : 'Hata oluşmadı'}
                                </div>
                            </div>

                            {/* Telefonu Olmayan / Atlanan */}
                            <div 
                                onClick={() => {
                                    if (missingPhoneCount > 0) {
                                        setWaReportFilterTab(waReportFilterTab === 'missing_phone' ? '' : 'missing_phone');
                                        setWaReportVisibleCount(20);
                                    }
                                }}
                                style={{ 
                                    background: waReportFilterTab === 'missing_phone' ? '#fffbeb' : (missingPhoneCount > 0 ? '#fefce8' : '#f8fafc'), 
                                    border: waReportFilterTab === 'missing_phone' ? '2px solid #d97706' : (missingPhoneCount > 0 ? '1px solid #fde68a' : '1px solid #edf2f7'), 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: missingPhoneCount > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                    boxShadow: waReportFilterTab === 'missing_phone' ? '0 2px 8px rgba(217, 119, 6, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: missingPhoneCount > 0 ? '#d97706' : '#64748b', fontWeight: '700' }}>Numara Eksik</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: missingPhoneCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PhoneOff size={13} color={missingPhoneCount > 0 ? '#d97706' : '#64748b'} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: missingPhoneCount > 0 ? '#d97706' : '#64748b' }}>
                                    {report.skippedCount || missingPhoneCount}
                                </div>
                                <div style={{ fontSize: '9.5px', color: missingPhoneCount > 0 ? '#d97706' : '#64748b', marginTop: '2px' }}>
                                    {missingPhoneCount > 0 ? `${missingPhoneCount} numarasız katılımcı` : 'Tüm numaralar tam'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arama ve Filtreleme Kartı */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                        {/* Arama Input (Aşağı açılır menü ile aynı tasarım ve boyutta) */}
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: waReportSearchQuery ? '#f0fdf4' : '#f8fafc',
                            border: `1.5px solid ${waReportSearchQuery ? '#16a34a' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            padding: '7px 10px',
                            gap: '8px',
                            boxShadow: waReportSearchQuery ? '0 2px 8px rgba(22, 163, 74, 0.08)' : 'none',
                            transition: 'all 0.18s ease'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '7px',
                                background: waReportSearchQuery ? '#16a34a' : '#ffffff',
                                border: waReportSearchQuery ? 'none' : '1px solid #e2e8f0',
                                color: waReportSearchQuery ? '#ffffff' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Search size={13} />
                            </div>
                            <div style={{ width: '1px', height: '18px', background: waReportSearchQuery ? '#bbf7d0' : '#e2e8f0', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={waReportSearchQuery}
                                onChange={(e) => {
                                    setWaReportSearchQuery(e.target.value);
                                    setWaReportVisibleCount(20);
                                }}
                                placeholder="İsim, telefon veya firma ile ara..."
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    width: '100%',
                                    color: '#0f172a'
                                }}
                            />
                            {waReportSearchQuery && (
                                <div
                                    onClick={() => {
                                        setWaReportSearchQuery('');
                                        setWaReportVisibleCount(20);
                                    }}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        flexShrink: 0
                                    }}
                                    title="Aramayı Temizle"
                                >
                                    <X size={11} />
                                </div>
                            )}
                        </div>

                        {/* Filtre Dropdown ve Katılımcı Sayısı */}
                        <div 
                            ref={waReportFilterDropdownRef}
                            style={{ 
                                position: 'relative', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: '10px'
                            }}
                        >
                            {/* Dropdown Tetikleyici */}
                            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsWaReportFilterOpen(!isWaReportFilterOpen)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 10px',
                                        background: hasGroupSelected ? '#f0fdf4' : '#f8fafc',
                                        border: `1.5px solid ${hasGroupSelected ? '#16a34a' : '#e2e8f0'}`,
                                        borderRadius: '10px',
                                        color: hasGroupSelected ? '#16a34a' : '#475569',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: hasGroupSelected ? '0 2px 8px rgba(22, 163, 74, 0.12)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '7px',
                                            background: hasGroupSelected ? '#16a34a' : '#ffffff',
                                            border: hasGroupSelected ? 'none' : '1px solid #e2e8f0',
                                            color: hasGroupSelected ? '#ffffff' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <ActiveFilterIcon size={13} />
                                        </div>
                                        <div style={{ width: '1px', height: '18px', background: hasGroupSelected ? '#bbf7d0' : '#e2e8f0', flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700' }}>
                                            {activeReportFilter ? activeReportFilter.label : 'Grup Seçiniz'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '6px' }}>
                                        {activeReportFilter && (
                                            <span style={{
                                                fontSize: '9.5px',
                                                fontWeight: '700',
                                                minWidth: '20px',
                                                padding: '0 5px',
                                                height: '17px',
                                                borderRadius: '5px',
                                                background: '#16a34a',
                                                color: '#ffffff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                flexShrink: 0,
                                                boxSizing: 'border-box'
                                            }}>
                                                {activeReportFilter.count}
                                            </span>
                                        )}
                                        <ChevronDown 
                                            size={14} 
                                            style={{ 
                                                transform: isWaReportFilterOpen ? 'rotate(180deg)' : 'none', 
                                                transition: 'transform 0.2s ease',
                                                color: hasGroupSelected ? '#16a34a' : '#94a3b8'
                                            }} 
                                        />
                                    </div>
                                </button>

                                {/* Dropdown Açılır Menü */}
                                {isWaReportFilterOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        left: 0,
                                        width: '100%',
                                        minWidth: '260px',
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15), 0 4px 10px rgba(15, 23, 42, 0.05)',
                                        padding: '6px',
                                        zIndex: 100
                                    }}>
                                        <div style={{ padding: '6px 8px 4px 8px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Gönderim Durumları
                                        </div>
                                        {reportFilterOptions.map((opt) => {
                                            const isSelected = waReportFilterTab === opt.id;
                                            const OptIcon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setWaReportFilterTab(opt.id);
                                                        setWaReportVisibleCount(20);
                                                        setIsWaReportFilterOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 10px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: isSelected ? '#f0fdf4' : 'transparent',
                                                        color: isSelected ? '#16a34a' : '#1e293b',
                                                        cursor: 'pointer',
                                                        fontSize: '11.5px',
                                                        fontWeight: isSelected ? '700' : '600',
                                                        textAlign: 'left',
                                                        transition: 'all 0.12s',
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '26px',
                                                            height: '26px',
                                                            borderRadius: '7px',
                                                            background: isSelected ? '#dcfce7' : opt.bg,
                                                            color: isSelected ? '#16a34a' : opt.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <OptIcon size={14} />
                                                        </div>
                                                        <div style={{ width: '1px', height: '18px', background: isSelected ? '#bbf7d0' : '#e2e8f0', flexShrink: 0 }} />
                                                        <span style={{ whiteSpace: 'nowrap' }}>{opt.label}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '9.5px',
                                                        fontWeight: '700',
                                                        minWidth: '20px',
                                                        padding: '0 5px',
                                                        height: '17px',
                                                        borderRadius: '5px',
                                                        background: isSelected ? '#16a34a' : '#f1f5f9',
                                                        color: isSelected ? '#ffffff' : '#64748b',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textAlign: 'center',
                                                        flexShrink: 0,
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        {opt.count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        {hasGroupSelected && (
                                            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '4px', paddingTop: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWaReportFilterTab('');
                                                        setWaReportVisibleCount(20);
                                                        setIsWaReportFilterOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: '#64748b',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <X size={12} />
                                                    Filtreyi Temizle
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sağ tarafta Katılımcı Sayısı Göstergesi */}
                            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                {hasGroupSelected ? (
                                    <>Grup: <strong style={{ color: '#0f172a' }}>{filteredDetails.length}</strong> Katılımcı</>
                                ) : isSearchActive ? (
                                    <>Arama: <strong style={{ color: '#0f172a' }}>{filteredDetails.length}</strong> Sonuç</>
                                ) : (
                                    <>Toplam <strong style={{ color: '#0f172a' }}>{details.length}</strong> Katılımcı</>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Katılımcı Listesi */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {!hasGroupSelected && !isSearchActive ? (
                            /* Hızlı Kategori Seçim Ekranı */
                            <div style={{ 
                                background: '#ffffff', 
                                borderRadius: '16px', 
                                padding: '22px 16px', 
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '13px',
                                    background: '#f0fdf4',
                                    color: '#16a34a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px auto'
                                }}>
                                    <Filter size={20} />
                                </div>
                                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 5px 0' }}>
                                    Lütfen İncelemek İstediğiniz Grubu Seçin
                                </h4>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                                    Kalabalık gönderimlerde hızlı ve rahat inceleme yapabilmeniz için sonuçlar kategorilere ayrılmıştır:
                                </p>

                                {/* Hızlı Grup Kartları */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                                    {successCount > 0 && (
                                        <div 
                                            onClick={() => { setWaReportFilterTab('success'); setWaReportVisibleCount(20); }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#f0fdf4',
                                                border: '1px solid #bbf7d0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>Başarıyla İletilenler</div>
                                                    <div style={{ fontSize: '10px', color: '#166534' }}>WhatsApp mesajı teslim edilen katılımcılar</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#16a34a', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {successCount}
                                            </span>
                                        </div>
                                    )}

                                    {failCount > 0 && (
                                        <div 
                                            onClick={() => { setWaReportFilterTab('failed'); setWaReportVisibleCount(20); }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#fef2f2',
                                                border: '1px solid #fecaca',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <AlertTriangle size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>Hatalı / İletilemeyenler</div>
                                                    <div style={{ fontSize: '10px', color: '#991b1b' }}>API veya numara hatası nedeniyle iletilemeyenler</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {failCount}
                                            </span>
                                        </div>
                                    )}

                                    {missingPhoneCount > 0 && (
                                        <div 
                                            onClick={() => { setWaReportFilterTab('missing_phone'); setWaReportVisibleCount(20); }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#fffbeb',
                                                border: '1px solid #fde68a',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <PhoneOff size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706' }}>Numarası Olmayanlar</div>
                                                    <div style={{ fontSize: '10px', color: '#92400e' }}>Telefon bilgisi eksik olduğundan atlananlar</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#d97706', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {missingPhoneCount}
                                            </span>
                                        </div>
                                    )}

                                    {childCount > 0 && (
                                        <div 
                                            onClick={() => { setWaReportFilterTab('child_skipped'); setWaReportVisibleCount(20); }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#faf5ff',
                                                border: '1px solid #e9d5ff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#9333ea' }}>Çocuk Katılımcılar</div>
                                                    <div style={{ fontSize: '10px', color: '#6b21a8' }}>Ebeveyn üzerinden iletişim sağlananlar</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#9333ea', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {childCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : filteredDetails.length === 0 ? (
                            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px 16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                    Seçili filtre veya aramaya uygun katılımcı kaydı bulunamadı.
                                </div>
                            </div>
                        ) : (
                            <>
                                {displayedDetails.map((item, idx) => {
                                    const isSuccess = item.status === 'success';
                                    const isFailed = item.status === 'failed';
                                    const isMissingPhone = item.status === 'missing_phone';
                                    const isChild = item.status === 'child_skipped';

                                    const theme = isSuccess 
                                        ? { primary: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: CheckCircle2, badge: 'İletildi' }
                                        : isFailed 
                                        ? { primary: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: AlertTriangle, badge: 'İletilemedi' }
                                        : isChild
                                        ? { primary: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', icon: Users, badge: 'Çocuk Katılımcı' }
                                        : { primary: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: PhoneOff, badge: 'Numara Yok' };

                                    const StatusIcon = theme.icon;

                                    return (
                                        <div
                                            key={item.id || idx}
                                            style={{
                                                background: '#ffffff',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '16px',
                                                padding: '13px 15px',
                                                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '9px',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {/* Üst Kısım: İkon + İsim + Durum Rozeti */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        background: theme.bg,
                                                        border: `1px solid ${theme.border}`,
                                                        color: theme.primary,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <StatusIcon size={17} />
                                                    </div>

                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                            <span style={{ 
                                                                fontSize: '13px', 
                                                                fontWeight: '700', 
                                                                color: '#0f172a',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {item.name}
                                                            </span>
                                                            <span style={{ 
                                                                fontSize: '9.5px', 
                                                                padding: '1px 5px', 
                                                                borderRadius: '5px', 
                                                                fontWeight: '600',
                                                                background: item.userType === 'child' ? '#fdf2f8' : '#f1f5f9',
                                                                color: item.userType === 'child' ? '#c026d3' : '#64748b'
                                                            }}>
                                                                {item.userType === 'child' ? 'Çocuk' : 'Yetişkin'}
                                                            </span>
                                                        </div>

                                                        {item.company && (
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '4px', 
                                                                fontSize: '10.5px', 
                                                                color: '#64748b', 
                                                                marginTop: '2px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                <Building size={11} color="#94a3b8" />
                                                                <span>{item.company}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '3px 8px',
                                                    borderRadius: '7px',
                                                    background: theme.bg,
                                                    border: `1px solid ${theme.border}`,
                                                    color: theme.primary,
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    flexShrink: 0,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    <StatusIcon size={11} />
                                                    <span>{theme.badge}</span>
                                                </div>
                                            </div>

                                            {/* Orta Kısım: Telefon Bilgisi */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '7px 9px',
                                                background: '#f8fafc',
                                                borderRadius: '9px',
                                                border: '1px solid #f1f5f9',
                                                fontSize: '11px',
                                                color: '#475569'
                                            }}>
                                                <Phone size={12} color="#94a3b8" />
                                                <strong style={{ color: '#0f172a' }}>{item.phone || '-'}</strong>
                                            </div>

                                            {/* Alt Kısım: Açıklama Şeridi */}
                                            {item.reason && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '6px',
                                                    padding: '7px 9px',
                                                    borderRadius: '8px',
                                                    background: theme.bg,
                                                    border: `1px solid ${theme.border}`,
                                                    color: theme.text,
                                                    fontSize: '10.5px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    <Info size={12} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                    <div>
                                                        <strong style={{ color: theme.primary }}>Durum: </strong>
                                                        {item.reason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Daha Fazla Yükle Kartı (+20) */}
                                {filteredDetails.length > waReportVisibleCount && (
                                    <div style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '12px 14px',
                                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                                        marginTop: '4px'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => setWaReportVisibleCount(prev => prev + 20)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: '#f0fdf4',
                                                border: '1.5px solid #86efac',
                                                color: '#15803d',
                                                fontSize: '12.5px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.08)',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#16a34a';
                                                e.currentTarget.style.borderColor = '#16a34a';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = '#f0fdf4';
                                                e.currentTarget.style.borderColor = '#86efac';
                                                e.currentTarget.style.color = '#15803d';
                                            }}
                                        >
                                            <ChevronDown size={16} />
                                            <span>Daha Fazla Yükle (+20)</span>
                                            <span style={{
                                                background: '#dcfce7',
                                                color: '#166534',
                                                fontSize: '11px',
                                                padding: '2.5px 8px',
                                                borderRadius: '7px',
                                                fontWeight: '800',
                                                marginLeft: '4px'
                                            }}>
                                                {Math.min(waReportVisibleCount, filteredDetails.length)} / {filteredDetails.length}
                                            </span>
                                        </button>
                                    </div>
                                )}
                                {waReportVisibleCount >= filteredDetails.length && filteredDetails.length > 20 && (
                                    <div style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '14px',
                                        padding: '10px 14px',
                                        textAlign: 'center',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        color: '#16a34a',
                                        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                                        marginTop: '4px'
                                    }}>
                                        ✓ Grubun tümü ({filteredDetails.length} kişi) listelendi
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Bottom Clearance Spacer */}
                    <div style={{ height: '140px', minHeight: '140px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />

                    {/* Alt Dönüş Butonu */}
                    <div style={{ paddingTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedWaReportForView(null);
                                setWaReportSearchQuery('');
                                setWaReportFilterTab('');
                                setWaReportVisibleCount(20);
                                setIsWaReportFilterOpen(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '11px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                        >
                            <ChevronLeft size={16} /> WhatsApp Gönderim Ekranına Dön
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    const renderWhatsAppPageView = () => {
        if (selectedWaReportForView) {
            return renderWaReportPageView(selectedWaReportForView);
        }

        const eligible = participants.filter(p => {
            const globalU = resolveParticipantUser(p, users);
            if (isUserChild(globalU)) return false;
            const phone = ((globalU.phone && globalU.phone !== '-') ? globalU.phone : (p.phone || '')).trim();
            return phone && phone !== '-' && phone.length > 6;
        });
        const missingCount = participants.length - eligible.length;
        const missingPhoneAdultsCount = participants.filter(p => {
            const globalU = resolveParticipantUser(p, users);
            if (isUserChild(globalU)) return false;
            const phone = ((globalU.phone && globalU.phone !== '-') ? globalU.phone : (p.phone || '')).trim();
            return !phone || phone === '-' || phone.length <= 6;
        }).length;
        const currentTpl = waModalTemplates.find(t => t.key === selectedWaTemplateKey) || waModalTemplates[0];
        const cleanTemplateName = (currentTpl.title || '').replace(/\s*\([^)]*\)$/, '').trim();
        const customTpl = customWaTemplates[selectedWaTemplateKey];
        const activeButtons = (customTpl?.buttons && Array.isArray(customTpl.buttons)) ? customTpl.buttons : (currentTpl.buttons || []);
        const sampleName = participants[0]?.name || 'Ahmet Yılmaz';
        const previewText = currentTpl.previewText(sampleName, tour.name, 'Pass123!');

        // WhatsApp Gönderim Raporları Listesi (Mevcut veya sentetik ilk rapor)
        const whatsappReports = (() => {
            const rawReports = (tour && Array.isArray(tour.whatsappReports)) ? tour.whatsappReports : [];
            if (rawReports.length > 0) return rawReports;

            if (participants && participants.length > 0) {
                const details = participants.map((p, idx) => {
                    const globalU = resolveParticipantUser(p, users);
                    const isChild = isUserChild(globalU);
                    const phone = ((globalU.phone && globalU.phone !== '-') ? globalU.phone : (p.phone || '')).trim();
                    const hasPhone = phone && phone !== '-' && phone.length > 6;
                    let status = 'success';
                    let reason = 'Mesaj başarıyla iletildi.';
                    if (isChild) {
                        status = 'child_skipped';
                        reason = 'Çocuk katılımcı profili (WhatsApp iletimi ebeveyn üzerinden yapılır).';
                    } else if (!hasPhone) {
                        status = 'missing_phone';
                        reason = 'Telefon numarası sistemde kayıtlı değil veya geçersiz.';
                    }
                    return {
                        id: p.id || String(idx),
                        name: p.name || globalU.name || 'Katılımcı',
                        phone: hasPhone ? phone : '-',
                        userType: isChild ? 'child' : 'adult',
                        company: p.company || globalU.company || '',
                        status,
                        reason
                    };
                });
                const successCount = details.filter(d => d.status === 'success').length;
                const missingCount = details.filter(d => d.status === 'missing_phone').length;
                const childCount = details.filter(d => d.status === 'child_skipped').length;
                return [{
                    id: 'wa_init_' + (tour?.id || 'default'),
                    type: 'whatsapp',
                    templateKey: 'newTourTemplate',
                    templateTitle: 'Seyahat Kaydı Şablonu',
                    createdAt: tour?.createdAt || new Date().toISOString(),
                    dateFormatted: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    totalRecipients: participants.length,
                    successCount,
                    failCount: 0,
                    skippedCount: missingCount + childCount,
                    details
                }];
            }
            return [];
        })();

        return (
            <div style={{ paddingBottom: '90px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
                {/* Sticky Header */}
                <div style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 20px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 20, 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                            onClick={() => {
                                if (!isSendingBatchWa) setShowWhatsAppPage(false);
                            }} 
                            style={{ 
                                cursor: isSendingBatchWa ? 'not-allowed' : 'pointer', 
                                padding: '4px', 
                                display: 'flex', 
                                alignItems: 'center' 
                            }}
                        >
                            <ChevronLeft size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>
                                WhatsApp İle Mesaj Gönder
                            </h2>
                            <div style={{ fontSize: '11px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                {tour.name}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <MessageCircle size={20} />
                    </div>
                </div>

                {/* Page Body Container */}
                <div style={{ padding: '20px 16px', maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* 1. Recipient Info Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                    }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle2 size={18} color="#16a34a" />
                        </div>
                        <div style={{ width: '1px', height: '26px', background: '#bbf7d0', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', lineHeight: 1.4 }}>
                            {eligible.length} telefon numarası doğrulandı, WhatsApp {cleanTemplateName} gönderilebilir.
                        </div>
                    </div>

                    {/* 1.1 Eksik Telefon Uyarısı Kartı */}
                    {missingPhoneAdultsCount > 0 && (
                        <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)'
                        }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={18} />
                            </div>
                            <div style={{ width: '1px', height: '26px', background: '#fcd34d', flexShrink: 0 }} />
                            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', lineHeight: 1.4 }}>
                                {missingPhoneAdultsCount} katılımcının telefon numarası bulunmadığından gönderim sağlanamayacaktır.
                            </div>
                        </div>
                    )}

                    {/* 2. Template Selector Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        position: 'relative',
                        zIndex: isWaTemplateDropdownOpen ? 30 : 2
                    }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '8px', display: 'block', letterSpacing: '0.4px' }}>
                            GÖNDERİLECEK WHATSAPP ŞABLONU
                        </label>

                        {/* Custom Sleek Dropdown */}
                        <div ref={waTemplateDropdownRef} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => !isSendingBatchWa && setIsWaTemplateDropdownOpen(!isWaTemplateDropdownOpen)}
                                disabled={isSendingBatchWa}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '12px',
                                    border: isWaTemplateDropdownOpen ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                                    background: isWaTemplateDropdownOpen ? '#f0fdf4' : '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: isSendingBatchWa ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.18s ease',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: '#dcfce7',
                                        color: '#16a34a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <MessageSquare size={14} />
                                    </div>
                                    <div style={{ width: '1px', height: '20px', background: '#cbd5e1', flexShrink: 0 }} />
                                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {currentTpl.title}
                                    </span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    color="#64748b"
                                    style={{
                                        transform: isWaTemplateDropdownOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0,
                                        marginLeft: '8px'
                                    }}
                                />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isWaTemplateDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    right: 0,
                                    zIndex: 50,
                                    background: '#ffffff',
                                    borderRadius: '14px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px'
                                }}>
                                    {waModalTemplates.map(tpl => {
                                        const isSelected = tpl.key === selectedWaTemplateKey;
                                        return (
                                            <div
                                                key={tpl.key}
                                                onClick={() => {
                                                    setSelectedWaTemplateKey(tpl.key);
                                                    setIsWaTemplateDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: '9px 12px',
                                                    borderRadius: '10px',
                                                    background: isSelected ? '#f0fdf4' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.12s ease'
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                                    <div style={{
                                                        width: '26px',
                                                        height: '26px',
                                                        borderRadius: '7px',
                                                        background: isSelected ? '#16a34a' : '#f1f5f9',
                                                        color: isSelected ? '#ffffff' : '#64748b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <MessageSquare size={13} />
                                                    </div>
                                                    <div style={{ width: '1px', height: '18px', background: isSelected ? '#bbf7d0' : '#e2e8f0', flexShrink: 0 }} />
                                                    <span style={{
                                                        fontSize: '12.5px',
                                                        fontWeight: isSelected ? '700' : '600',
                                                        color: isSelected ? '#166534' : '#1e293b',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {tpl.title}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <Check size={15} color="#16a34a" style={{ flexShrink: 0, marginLeft: '8px' }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '8px',
                            lineHeight: 1.2,
                            background: '#f8fafc',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        }}>
                            <span style={{ flexShrink: 0 }}>💡</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                {currentTpl.desc}
                            </span>
                        </div>
                    </div>

                    {/* 3. Live Preview Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Canlı Mesaj Önizleme (Örnek Katılımcı)
                        </div>
                        <div style={{
                            background: '#efeae2',
                            backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)',
                            backgroundSize: '12px 12px',
                            borderRadius: '14px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '12px 12px 12px 2px',
                                maxWidth: '90%',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                alignSelf: 'flex-start',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '12px 14px' }}>
                                    <div style={{ fontSize: '12.5px', color: '#111b21', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                        {previewText}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '6px', fontSize: '10.5px', color: '#667781' }}>
                                        <span>12:00</span>
                                        <Check size={13} color="#53bdeb" />
                                    </div>
                                </div>

                                {/* WhatsApp CTA Buttons */}
                                {activeButtons && activeButtons.length > 0 && (
                                    <div style={{ borderTop: '1px solid #f0f2f5', background: '#ffffff' }}>
                                        {activeButtons.map((btn, bIdx) => (
                                            <div
                                                key={bIdx}
                                                style={{
                                                    padding: '9px 14px',
                                                    borderTop: bIdx > 0 ? '1px solid #f0f2f5' : 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '7px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#00a884',
                                                    cursor: 'default',
                                                    userSelect: 'none',
                                                    background: '#ffffff'
                                                }}
                                            >
                                                {btn.type === 'copy_code' ? (
                                                    <>
                                                        <Copy size={13} color="#00a884" />
                                                        <span>{btn.text || 'Kodu Kopyala'}</span>
                                                    </>
                                                ) : btn.type === 'phone' ? (
                                                    <>
                                                        <Phone size={13} color="#00a884" />
                                                        <span>{btn.text}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ExternalLink size={13} color="#00a884" />
                                                        <span>{btn.text}</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. Sending Progress (if active) */}
                    {isSendingBatchWa && batchWaProgress && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '700', color: '#166534', marginBottom: '8px' }}>
                                <span>WhatsApp Gönderiliyor...</span>
                                <span>{batchWaProgress.current} / {batchWaProgress.total}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(batchWaProgress.current / batchWaProgress.total) * 100}%`,
                                    height: '100%',
                                    background: '#16a34a',
                                    transition: 'width 0.2s'
                                }} />
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '8px' }}>
                                Şu anki alıcı: <strong>{batchWaProgress.name}</strong>
                            </div>
                        </div>
                    )}

                    {/* 5. Action Buttons Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setShowWhatsAppPage(false)}
                            disabled={isSendingBatchWa}
                            style={{
                                flex: 1,
                                padding: '10.5px 12px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: isSendingBatchWa ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="button"
                            onClick={handleExecuteBatchWhatsApp}
                            disabled={isSendingBatchWa || eligible.length === 0}
                            style={{
                                flex: 2,
                                padding: '10.5px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#16a34a',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: (isSendingBatchWa || eligible.length === 0) ? 'not-allowed' : 'pointer',
                                opacity: (isSendingBatchWa || eligible.length === 0) ? 0.7 : 1,
                                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '7px'
                            }}
                        >
                            {isSendingBatchWa ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Send size={14} />
                            )}
                            <span>{isSendingBatchWa ? 'Gönderiliyor...' : 'WhatsApp Mesajlarını Gönder'}</span>
                        </button>
                    </div>

                    {/* 6. WhatsApp Gönderim Raporları Kartı (En Altta) */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <MessageCircle size={15} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                                        WhatsApp Gönderim Raporları
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                                        Bu sayfadan yapılan toplu bildirim iletim kayıtları
                                    </div>
                                </div>
                            </div>
                            <span style={{ fontSize: '10px', color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '8px', fontWeight: '700' }}>
                                {whatsappReports.length} Rapor
                            </span>
                        </div>

                        {whatsappReports.length === 0 ? (
                            <div style={{
                                padding: '24px 16px',
                                textAlign: 'center',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px dashed #cbd5e1',
                                color: '#94a3b8',
                                fontSize: '12px'
                            }}>
                                Henüz bu tur için WhatsApp gönderim raporu bulunmuyor.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {whatsappReports.map((report, rIdx) => {
                                    const totalCount = report.totalRecipients || (report.details?.length || 0);

                                    return (
                                        <div
                                            key={report.id || rIdx}
                                            onClick={() => {
                                                setSelectedWaReportForView(report);
                                                setWaReportFilterTab('');
                                                setWaReportSearchQuery('');
                                                setWaReportVisibleCount(20);
                                                setIsWaReportFilterOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = '#16a34a';
                                                e.currentTarget.style.background = '#f0fdf4';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#f8fafc';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                    width: '34px',
                                                    height: '34px',
                                                    borderRadius: '9px',
                                                    background: '#dcfce7',
                                                    color: '#16a34a',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <FileText size={17} />
                                                </div>
                                                <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {report.templateTitle || 'WhatsApp Bildirimi'}
                                                    </div>
                                                    <div style={{ fontSize: '9.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                                        <span>{report.dateFormatted || new Date(report.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>•</span>
                                                        <span>{totalCount} Katılımcı</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '8px',
                                                    background: '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#16a34a',
                                                    flexShrink: 0,
                                                    marginLeft: '8px'
                                                }}
                                                title="Gönderim Raporunu İncele"
                                            >
                                                <ChevronRight size={15} strokeWidth={2.4} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bottom Clearance Spacer so floating nav never blocks content */}
                    <div style={{ height: '140px', width: '100%', flexShrink: 0 }} />

                </div>
            </div>
        );
    };

    const renderEmailPageView = () => {
        const eligible = participants.filter(p => {
            const globalU = resolveParticipantUser(p, users);
            if (isUserChild(globalU)) return false;
            const email = (p.email || globalU.email || '').trim().toLowerCase();
            if (!email || !email.includes('@')) return false;
            if (email.endsWith('@move.local') || email.endsWith('.local') || isChildEmail(email)) return false;
            return true;
        });
        const missingCount = participants.length - eligible.length;
        const missingEmailAdultsCount = participants.filter(p => {
            const globalU = resolveParticipantUser(p, users);
            if (isUserChild(globalU)) return false;
            const email = (p.email || globalU.email || '').trim().toLowerCase();
            return !email || !email.includes('@') || email.endsWith('@move.local') || email.endsWith('.local') || isChildEmail(email);
        }).length;
        const currentTpl = emailModalTemplates.find(t => t.key === selectedEmailTemplateKey) || emailModalTemplates[0];
        const cleanEmailTemplateName = (currentTpl.title || '').trim();
        const brand = corporateName || 'Move Yanımda';
        const sampleSubject = currentTpl.subjectPreview(brand, tour.name);

        return (
            <div style={{ paddingBottom: '90px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
                {/* Sticky Header */}
                <div style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 20px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 20, 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                            onClick={() => {
                                if (!isSendingBatchEmail) setShowEmailPage(false);
                            }} 
                            style={{ 
                                cursor: isSendingBatchEmail ? 'not-allowed' : 'pointer', 
                                padding: '4px', 
                                display: 'flex', 
                                alignItems: 'center' 
                            }}
                        >
                            <ChevronLeft size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>
                                Mail Sistemi İle Mesaj Gönder
                            </h2>
                            <div style={{ fontSize: '11px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                {tour.name}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Mail size={20} />
                    </div>
                </div>

                {/* Page Body Container */}
                <div style={{ padding: '20px 16px', maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* 1. Recipient Info Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                    }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle2 size={18} color="var(--primary)" />
                        </div>
                        <div style={{ width: '1px', height: '26px', background: '#fbcfe8', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: '#831843', fontWeight: '600', lineHeight: 1.4 }}>
                            {eligible.length} e-posta adresi doğrulandı, E-Posta {cleanEmailTemplateName} gönderilebilir.
                        </div>
                    </div>

                    {/* 1.1 Eksik E-Posta Uyarısı Kartı */}
                    {missingEmailAdultsCount > 0 && (
                        <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)'
                        }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={18} />
                            </div>
                            <div style={{ width: '1px', height: '26px', background: '#fcd34d', flexShrink: 0 }} />
                            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', lineHeight: 1.4 }}>
                                {missingEmailAdultsCount} katılımcının geçerli e-posta adresi bulunmadığından gönderim sağlanamayacaktır.
                            </div>
                        </div>
                    )}

                    {/* 2. Template Selector Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        position: 'relative',
                        zIndex: isEmailTemplateDropdownOpen ? 30 : 2
                    }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '8px', display: 'block', letterSpacing: '0.4px' }}>
                            GÖNDERİLECEK E-POSTA ŞABLONU
                        </label>

                        {/* Custom Sleek Dropdown */}
                        <div ref={emailTemplateDropdownRef} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => !isSendingBatchEmail && setIsEmailTemplateDropdownOpen(!isEmailTemplateDropdownOpen)}
                                disabled={isSendingBatchEmail}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '12px',
                                    border: isEmailTemplateDropdownOpen ? '1.5px solid var(--primary)' : '1px solid #cbd5e1',
                                    background: isEmailTemplateDropdownOpen ? '#fdf2f8' : '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: isSendingBatchEmail ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.18s ease',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: '#fce7f3',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Mail size={14} />
                                    </div>
                                    <div style={{ width: '1px', height: '20px', background: '#cbd5e1', flexShrink: 0 }} />
                                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {currentTpl.title}
                                    </span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    color="#64748b"
                                    style={{
                                        transform: isEmailTemplateDropdownOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0,
                                        marginLeft: '8px'
                                    }}
                                />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isEmailTemplateDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    right: 0,
                                    zIndex: 50,
                                    background: '#ffffff',
                                    borderRadius: '14px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px'
                                }}>
                                    {emailModalTemplates.map(tpl => {
                                        const isSelected = tpl.key === selectedEmailTemplateKey;
                                        return (
                                            <div
                                                key={tpl.key}
                                                onClick={() => {
                                                    setSelectedEmailTemplateKey(tpl.key);
                                                    setIsEmailTemplateDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: '9px 12px',
                                                    borderRadius: '10px',
                                                    background: isSelected ? '#fdf2f8' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.12s ease'
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                                    <div style={{
                                                        width: '26px',
                                                        height: '26px',
                                                        borderRadius: '7px',
                                                        background: isSelected ? 'var(--primary)' : '#f1f5f9',
                                                        color: isSelected ? '#ffffff' : '#64748b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <Mail size={13} />
                                                    </div>
                                                    <div style={{ width: '1px', height: '18px', background: isSelected ? '#fbcfe8' : '#e2e8f0', flexShrink: 0 }} />
                                                    <span style={{
                                                        fontSize: '12.5px',
                                                        fontWeight: isSelected ? '700' : '600',
                                                        color: isSelected ? 'var(--primary)' : '#1e293b',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {tpl.title}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <Check size={15} color="var(--primary)" style={{ flexShrink: 0, marginLeft: '8px' }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '8px',
                            lineHeight: 1.2,
                            background: '#f8fafc',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                        }}>
                            <span style={{ flexShrink: 0 }}>💡</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                {currentTpl.desc}
                            </span>
                        </div>
                    </div>

                    {/* 3. Live Email Preview Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            E-Posta Önizleme
                        </div>
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '12px',
                            color: '#334155'
                        }}>
                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                <strong style={{ color: '#0f172a' }}>Konu:</strong> {sampleSubject}
                            </div>
                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                <strong style={{ color: '#0f172a' }}>Gönderen:</strong> {brand} &lt;noreply@move.com.tr&gt;
                            </div>
                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                                <strong style={{ color: '#0f172a' }}>Şablon Başlığı:</strong> {currentTpl.title}
                            </div>
                            <div style={{ paddingTop: '4px', lineHeight: 1.5 }}>
                                Sayın <strong>Ahmet Yılmaz</strong>, seyahatiniz ile ilgili detaylar ve sisteme erişim bilgileriniz e-posta ekinde veya içeriğinde yer almaktadır.
                            </div>
                            {currentTpl.ctaText && (
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        fontSize: '11.5px',
                                        fontWeight: '700',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 2px 6px rgba(215, 20, 122, 0.2)'
                                    }}>
                                        <ExternalLink size={12} />
                                        <span>{currentTpl.ctaText}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Sending Progress (if active) */}
                    {isSendingBatchEmail && batchEmailProgress && (
                        <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '700', color: '#9d174d', marginBottom: '8px' }}>
                                <span>E-Postalar Gönderiliyor...</span>
                                <span>{batchEmailProgress.current} / {batchEmailProgress.total}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#fce7f3', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(batchEmailProgress.current / batchEmailProgress.total) * 100}%`,
                                    height: '100%',
                                    background: 'var(--primary)',
                                    transition: 'width 0.2s'
                                }} />
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#be185d', marginTop: '8px' }}>
                                Şu anki alıcı: <strong>{batchEmailProgress.name}</strong>
                            </div>
                        </div>
                    )}

                    {/* 5. Action Buttons Card */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setShowEmailPage(false)}
                            disabled={isSendingBatchEmail}
                            style={{
                                flex: 1,
                                padding: '10.5px 12px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: isSendingBatchEmail ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="button"
                            onClick={handleExecuteBatchEmail}
                            disabled={isSendingBatchEmail || eligible.length === 0}
                            style={{
                                flex: 2,
                                padding: '10.5px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: (isSendingBatchEmail || eligible.length === 0) ? 'not-allowed' : 'pointer',
                                opacity: (isSendingBatchEmail || eligible.length === 0) ? 0.7 : 1,
                                boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '7px'
                            }}
                        >
                            {isSendingBatchEmail ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Send size={14} />
                            )}
                            <span>{isSendingBatchEmail ? 'Gönderiliyor...' : 'E-Postaları Gönder'}</span>
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    if (!tour) return <div style={{ padding: '20px' }}>Tur bulunamadı.</div>;
    if (showSht && selectedUser) return renderProfileView();
    if (showWhatsAppPage) return renderWhatsAppPageView();
    if (showEmailPage) return renderEmailPageView();
    if (showBulkParticipant) return <BulkParticipantManager tourId={tourId} onClose={() => setShowBulkParticipant(false)} />;

    return (
        <div style={{ paddingBottom: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>

            {/* Header */}
            <div style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: 'calc(24px + env(safe-area-inset-top, 0px)) 16px 22px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                    <div onClick={handleBack} style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <ChevronLeft size={24} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>Katılımcılar</h2>
                        <div 
                            title={tour.name} 
                            style={{ 
                                fontSize: '11px', 
                                opacity: 0.9, 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                                display: 'block'
                            }}
                        >
                            {tour.name}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, position: 'relative' }}>

                    {/* Çark İkonu & Aşağı Açılır İşlemler Menüsü */}
                    <div style={{ position: 'relative' }} ref={actionsMenuRef}>
                        <div 
                            onClick={() => setShowActionsMenu(!showActionsMenu)} 
                            style={{ 
                                background: showActionsMenu ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)', 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer', 
                                flexShrink: 0,
                                transition: 'all 0.2s',
                                transform: showActionsMenu ? 'rotate(60deg)' : 'none'
                            }} 
                            title="Toplu İşlemler Menüsü"
                        >
                            <Settings size={20} color="white" />
                        </div>

                        {showActionsMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '44px',
                                right: 0,
                                minWidth: '245px',
                                width: 'max-content',
                                maxWidth: 'calc(100vw - 32px)',
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0',
                                padding: '6px',
                                zIndex: 1050,
                                animation: 'scaleUp 0.18s ease-out'
                            }}>
                                {/* 1. Excel İle Katılımcı Ekle */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowActionsMenu(false);
                                        setShowBulkParticipant(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                                        <FileSpreadsheet size={16} />
                                    </div>
                                    <div style={{ width: '1px', height: '22px', background: '#e2e8f0', flexShrink: 0 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>Excel İle Katılımcı Ekle</span>
                                        <span style={{ fontSize: '9.5px', color: '#64748b', whiteSpace: 'nowrap' }}>Toplu liste içe aktar</span>
                                    </div>
                                </button>

                                {/* 2. WhatsApp İle Mesaj Gönder */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowActionsMenu(false);
                                        setShowWhatsAppPage(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                                        <MessageCircle size={16} />
                                    </div>
                                    <div style={{ width: '1px', height: '22px', background: '#e2e8f0', flexShrink: 0 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>WhatsApp İle Mesaj Gönder</span>
                                        <span style={{ fontSize: '9.5px', color: '#64748b', whiteSpace: 'nowrap' }}>Şablon bildirimi ilet</span>
                                    </div>
                                </button>

                                {/* 3. Mail Sistemi İle Mesaj Gönder */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowActionsMenu(false);
                                        setShowEmailPage(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fdf2f8'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                        <Mail size={16} />
                                    </div>
                                    <div style={{ width: '1px', height: '22px', background: '#e2e8f0', flexShrink: 0 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>Mail Sistemi İle Mesaj Gönder</span>
                                        <span style={{ fontSize: '9.5px', color: '#64748b', whiteSpace: 'nowrap' }}>Toplu e-posta iletimi</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                    <div 
                        onClick={() => setShowWizard(true)} 
                        style={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer',
                            position: 'relative',
                            flexShrink: 0
                        }} 
                        title="Münferit Katılımcı Ekle"
                    >
                        <Plus size={20} />
                        {participants.length > 0 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    background: '#ffffff',
                                    color: 'var(--primary)',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    minWidth: '17px',
                                    height: '17px',
                                    padding: '0 4px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    border: '1.5px solid var(--primary)',
                                    lineHeight: 1
                                }}
                            >
                                {participants.length}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List */}
            <div style={{ padding: '16px 16px 30px' }}>
                {/* 1. Katılımcı Filtreleme Kartı */}
                {participants.length > 0 && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                        marginBottom: '10px',
                        position: 'relative'
                    }}>
                        <div 
                            ref={filterDropdownRef}
                            style={{ 
                                position: 'relative', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: '10px'
                            }}
                        >
                            {/* Dropdown Tetikleyici */}
                            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 10px',
                                        background: filterType !== 'all' ? '#fdf2f8' : '#f8fafc',
                                        border: `1.5px solid ${filterType !== 'all' ? 'var(--primary)' : '#e2e8f0'}`,
                                        borderRadius: '10px',
                                        color: filterType !== 'all' ? 'var(--primary)' : '#1e293b',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: filterType !== 'all' ? '0 2px 8px rgba(215, 20, 122, 0.12)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '7px',
                                            background: filterType !== 'all' ? 'var(--primary)' : '#ffffff',
                                            border: filterType !== 'all' ? 'none' : '1px solid #e2e8f0',
                                            color: filterType !== 'all' ? '#ffffff' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Filter size={13} />
                                        </div>
                                        <div style={{ width: '1px', height: '18px', background: filterType !== 'all' ? '#fbcfe8' : '#e2e8f0', flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700' }}>
                                            {activeFilterOption.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '6px' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            width: '38px',
                                            minWidth: '38px',
                                            height: '22px',
                                            borderRadius: '6px',
                                            background: filterType !== 'all' ? 'var(--primary)' : '#e2e8f0',
                                            color: filterType !== 'all' ? '#ffffff' : '#475569',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            flexShrink: 0,
                                            boxSizing: 'border-box'
                                        }}>
                                            {getFilterCount(filterType)}
                                        </span>
                                        <ChevronDown 
                                            size={14} 
                                            style={{ 
                                                transform: isFilterOpen ? 'rotate(180deg)' : 'none', 
                                                transition: 'transform 0.2s ease',
                                                color: filterType !== 'all' ? 'var(--primary)' : '#94a3b8'
                                            }} 
                                        />
                                    </div>
                                </button>

                                {/* Dropdown Açılır Menü */}
                                {isFilterOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        left: 0,
                                        width: '100%',
                                        minWidth: '270px',
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15), 0 4px 10px rgba(15, 23, 42, 0.05)',
                                        padding: '6px',
                                        zIndex: 100,
                                        animation: 'scaleUp 0.18s ease-out'
                                    }}>
                                        <div style={{ padding: '6px 8px 4px 8px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Katılımcı Filtreleri
                                        </div>
                                        {filterOptions.map((opt) => {
                                            const isSelected = filterType === opt.id;
                                            const count = getFilterCount(opt.id);
                                            const OptIcon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFilterType(opt.id);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 10px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: isSelected ? '#fdf2f8' : 'transparent',
                                                        color: isSelected ? 'var(--primary)' : '#1e293b',
                                                        cursor: 'pointer',
                                                        fontSize: '11.5px',
                                                        fontWeight: isSelected ? '700' : '600',
                                                        textAlign: 'left',
                                                        transition: 'all 0.12s',
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '26px',
                                                            height: '26px',
                                                            borderRadius: '7px',
                                                            background: isSelected ? '#fce7f3' : opt.bg,
                                                            color: isSelected ? 'var(--primary)' : opt.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <OptIcon size={14} />
                                                        </div>
                                                        <div style={{ width: '1px', height: '18px', background: isSelected ? '#fbcfe8' : '#e2e8f0', flexShrink: 0 }} />
                                                        <span style={{ whiteSpace: 'nowrap' }}>{opt.label}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        width: '38px',
                                                        minWidth: '38px',
                                                        height: '22px',
                                                        borderRadius: '6px',
                                                        background: isSelected ? 'var(--primary)' : '#f1f5f9',
                                                        color: isSelected ? '#ffffff' : '#64748b',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textAlign: 'center',
                                                        flexShrink: 0,
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Filtreyi Sıfırla Butonu veya Katılımcı Sayısı */}
                            {filterType !== 'all' ? (
                                <button
                                    type="button"
                                    onClick={() => setFilterType('all')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '7px 11px',
                                        borderRadius: '10px',
                                        border: '1px solid #fee2e2',
                                        background: '#fff1f2',
                                        color: '#e11d48',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'all 0.15s'
                                    }}
                                    title="Filtreyi Temizle"
                                >
                                    <X size={12} />
                                    <span>Filtreyi Sıfırla</span>
                                </button>
                            ) : (
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                                    Toplam <strong>{participants.length}</strong> Katılımcı
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Katılımcı Arama Kartı (Hemen Filtre Kartının Altında) */}
                {participants.length > 0 && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                        marginBottom: '14px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '7px 11px',
                            transition: 'all 0.18s ease'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '7px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: searchQuery ? 'var(--primary)' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Search size={13} />
                            </div>
                            <div style={{ width: '1px', height: '18px', background: '#e2e8f0', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="İsim, soyisim, e-posta veya telefon ile ara..."
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: '11.5px',
                                    width: '100%',
                                    color: '#1e293b',
                                    fontWeight: '500'
                                }}
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        background: '#f1f5f9',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        padding: 0,
                                        flexShrink: 0
                                    }}
                                    title="Aramayı Temizle"
                                >
                                    <X size={12} />
                                </button>
                            ) : (
                                <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: '600' }}>
                                    {filteredParticipants.length} kişi
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {participants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Henüz bir katılımcı eklenmedi</h3>
                        <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Sağ üstteki (+) butonunu kullanarak bilet satışı gerçekleşen müşterileri bu tura atayın.</p>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                        <Filter size={36} color="var(--primary)" style={{ opacity: 0.5, margin: '0 auto 10px auto' }} />
                        <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Uygun Katılımcı Bulunamadı</h4>
                        <p style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '14px' }}>
                            {searchQuery 
                                ? `"${searchQuery}" aramanıza uygun katılımcı bulunamadı.` 
                                : `"${activeFilterOption.label}" filtresine uyan katılımcı bulunamadı.`}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setFilterType('all');
                                setSearchQuery('');
                            }}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(215, 20, 122, 0.2)'
                            }}
                        >
                            {searchQuery ? 'Aramayı ve Filtreyi Temizle' : 'Tüm Katılımcıları Göster'}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredParticipants.map(p => {
                            const globalP = findMatchingUser(p, users) || users.find(u => u.id === p.id) || p;
                            const isChild = isUserChild(globalP);
                            const isLinked = isChild && !!globalP.linkedTo && (Array.isArray(globalP.linkedTo) ? globalP.linkedTo.length > 0 : true);
                            const parents = isLinked ? users.filter(parentP => Array.isArray(globalP.linkedTo) ? globalP.linkedTo.includes(parentP.id) || globalP.linkedTo.includes(String(parentP.id)) : parentP.id === globalP.linkedTo || String(parentP.id) === String(globalP.linkedTo)) : [];
                            
                            const partTickets = (Array.isArray(p.ticketFiles) && p.ticketFiles.length > 0)
                                ? p.ticketFiles
                                : ((Array.isArray(globalP.ticketFiles) && globalP.ticketFiles.length > 0)
                                    ? globalP.ticketFiles
                                    : ((p.ticketPdf || globalP.ticketPdf) ? [p.ticketPdf || globalP.ticketPdf] : []));
                            const ticketCount = partTickets.length;
                            const hasTicketPdf = ticketCount > 0;
                            const companyName = globalP.company && globalP.company !== 'Bireysel Müşteri' && globalP.company !== 'Move Travel & Mice' ? globalP.company : null;
                            const comm = getParticipantCommStatus(p, globalP);

                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => openProfile(p)} 
                                    style={{ 
                                        background: '#ffffff', 
                                        borderRadius: '16px', 
                                        padding: '12px 14px 9px 14px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        border: '1px solid #f1f5f9', 
                                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(15, 23, 42, 0.07)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#f1f5f9';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Üst Satır: Bilet İkonu, Katılımcı Bilgileri, Arama/Sohbet Butonları */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                        {/* Ticket Icon Indicator (Replaces Avatar) */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUser(globalP);
                                                setShowTransferSheet(true);
                                            }}
                                            style={{ 
                                                width: '44px', 
                                                height: '44px', 
                                                borderRadius: '14px', 
                                                background: hasTicketPdf ? '#f0fdf4' : '#fef2f2', 
                                                border: hasTicketPdf ? '1.5px solid #bbf7d0' : '1.5px solid #fecaca', 
                                                color: hasTicketPdf ? '#16a34a' : '#dc2626', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                boxShadow: hasTicketPdf ? '0 2px 6px rgba(22, 163, 74, 0.08)' : '0 2px 6px rgba(220, 38, 38, 0.08)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'scale(1.08)';
                                                e.currentTarget.style.boxShadow = hasTicketPdf ? '0 4px 10px rgba(22, 163, 74, 0.22)' : '0 4px 10px rgba(220, 38, 38, 0.22)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = hasTicketPdf ? '0 2px 6px rgba(22, 163, 74, 0.08)' : '0 2px 6px rgba(220, 38, 38, 0.08)';
                                            }}
                                            title={hasTicketPdf ? (ticketCount > 1 ? `${ticketCount} Adet Bilet PDF Yüklendi (Görüntüle / Yönet)` : "Bilet PDF Yüklendi (Görüntüle / Değiştir)") : "Bilet PDF Bekleniyor (Yüklemek için tıklayın)"}
                                        >
                                            <Ticket size={22} />
                                            {ticketCount > 1 && (
                                                <div 
                                                    style={{ 
                                                        position: 'absolute', 
                                                        top: '-4px', 
                                                        right: '-4px', 
                                                        background: '#16a34a', 
                                                        color: 'white', 
                                                        border: '1.5px solid #ffffff', 
                                                        borderRadius: '10px', 
                                                        padding: '0 4px', 
                                                        fontSize: '9.5px', 
                                                        fontWeight: 'bold', 
                                                        lineHeight: '14px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)' 
                                                    }}
                                                >
                                                    {ticketCount}
                                                </div>
                                            )}
                                        </div>
                                        {isLinked && (
                                            <div 
                                                style={{ 
                                                    position: 'absolute', 
                                                    bottom: '-3px', 
                                                    right: '-3px', 
                                                    background: '#ffffff', 
                                                    border: '1.5px solid #fdf4ff', 
                                                    borderRadius: '50%', 
                                                    width: '18px', 
                                                    height: '18px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                                    fontSize: '10px'
                                                }}
                                                title="Çocuk Katılımcı"
                                            >
                                                🎈
                                            </div>
                                        )}
                                    </div>

                                    {/* Dikey Çizgi Ayrıcı */}
                                    <div style={{ width: '1px', height: '28px', background: '#e2e8f0', flexShrink: 0 }} />

                                    {/* Content Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Parent Info for Children */}
                                        {parents.length > 0 && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '3px', background: '#f8fafc', padding: '1px 7px 1px 2px', borderRadius: '10px', border: '1px solid #e2e8f0', maxWidth: '100%' }}>
                                                <div style={{ display: 'flex' }}>
                                                    {parents.slice(0, 2).map((par, idx) => (
                                                        <img key={par.id} src={par.avatar} title={par.name} style={{ width: '15px', height: '15px', borderRadius: '50%', border: '1px solid white', marginLeft: idx > 0 ? '-4px' : '0', position: 'relative', zIndex: parents.length - idx, objectFit: 'cover' }} />
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                                    {parents.map(par => par.name.split(' ')[0]).join(' & ')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Participant Name & Company */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12.5px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.1px', lineHeight: 1.25 }}>
                                                {p.name}
                                            </h4>
                                            {companyName && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10.5px', lineHeight: 1 }}>
                                                    <Building size={10} color="#94a3b8" style={{ flexShrink: 0 }} />
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', fontWeight: '500' }}>
                                                        {companyName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                        {isChild && isLinked ? (
                                            <span style={{ 
                                                background: '#fdf4ff', 
                                                color: '#a21caf', 
                                                border: '1px solid #fae8ff', 
                                                fontSize: '11px', 
                                                fontWeight: '700', 
                                                width: '70px', 
                                                height: '34px', 
                                                borderRadius: '20px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                                boxSizing: 'border-box'
                                            }}>
                                                Çocuk
                                            </span>
                                        ) : (
                                            <div 
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'space-between', 
                                                    width: '70px', 
                                                    height: '34px', 
                                                    background: '#f8fafc', 
                                                    border: '1px solid #e2e8f0', 
                                                    borderRadius: '20px', 
                                                    padding: '0 3px', 
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const globalP = resolveParticipantUser(p, users);
                                                        const callPhone = ((globalP.phone && globalP.phone !== '-') ? globalP.phone : (p.phone || '')).trim();
                                                        if (callPhone && callPhone !== '-') {
                                                            window.location.href = `tel:${callPhone}`;
                                                        } else {
                                                            alert("Kullanıcıya ait telefon numarası kayıtlı değil.");
                                                        }
                                                    }} 
                                                    style={{ 
                                                        width: '28px', 
                                                        height: '28px', 
                                                        borderRadius: '50%', 
                                                        background: 'transparent', 
                                                        color: '#16a34a', 
                                                        border: 'none', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    title="Telefonla Ara"
                                                >
                                                    <Phone size={13} />
                                                </button>
                                                <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        navigate(`/dashboard/chat/direct_${tour.id}_${p.id}`); 
                                                    }} 
                                                    style={{ 
                                                        width: '28px', 
                                                        height: '28px', 
                                                        borderRadius: '50%', 
                                                        background: 'transparent', 
                                                        color: '#2563eb', 
                                                        border: 'none', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    title="Mesaj Gönder"
                                                >
                                                    <MessageCircle size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ayrıcı ve Şık İletişim Şeridi */}
                                <div style={{ 
                                    marginTop: '10px', 
                                    padding: '7px 10px', 
                                    background: '#f8fafc', 
                                    borderRadius: '12px', 
                                    border: '1px solid #edf2f7', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '6px', 
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    {/* 1. Satır: WhatsApp & Mail İletişim Durumları */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        gap: '8px', 
                                        width: '100%' 
                                    }}>
                                        {/* Sol: WhatsApp Durumu */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <div 
                                                style={{ 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    borderRadius: '6px', 
                                                    background: '#dcfce7', 
                                                    color: '#16a34a', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    flexShrink: 0 
                                                }} 
                                                title="WhatsApp Gönderim Durumları"
                                            >
                                                <MessageSquare size={11} strokeWidth={2.4} />
                                            </div>

                                            {comm.isChild ? (
                                                <span style={{ 
                                                    background: '#fdf4ff', 
                                                    color: '#a21caf', 
                                                    border: '1px solid #f5d0fe', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '600' 
                                                }}>
                                                    Ebeveynde
                                                </span>
                                            ) : !comm.hasPhone ? (
                                                <span style={{ 
                                                    background: '#fee2e2', 
                                                    color: '#dc2626', 
                                                    border: '1px solid #fecaca', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '600',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }} title="Katılımcının telefon numarası kayıtlı değil">
                                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#dc2626' }} />
                                                    Numara Yok
                                                </span>
                                            ) : (
                                                <>
                                                    {/* Aktivasyon Şablonu */}
                                                    <span style={{ 
                                                        background: comm.waActivationSent ? '#dcfce7' : '#ffffff', 
                                                        color: comm.waActivationSent ? '#15803d' : '#64748b', 
                                                        border: comm.waActivationSent ? '1px solid #bbf7d0' : '1px solid #e2e8f0', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '12px', 
                                                        fontSize: '10px', 
                                                        fontWeight: comm.waActivationSent ? '700' : '500',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        boxShadow: comm.waActivationSent ? '0 1px 2px rgba(22, 163, 74, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
                                                    }} title={comm.waActivationSent ? "Hesap Aktivasyon (welcome_account_activation) mesajı iletildi" : "welcome_account_activation henüz gönderilmedi"}>
                                                        {comm.waActivationSent ? (
                                                            <Check size={10} strokeWidth={3} />
                                                        ) : (
                                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }} />
                                                        )}
                                                        Aktivasyon
                                                    </span>

                                                    {/* Seyahat Kaydı Şablonu */}
                                                    <span style={{ 
                                                        background: comm.waTourSent ? '#dcfce7' : '#ffffff', 
                                                        color: comm.waTourSent ? '#15803d' : '#64748b', 
                                                        border: comm.waTourSent ? '1px solid #bbf7d0' : '1px solid #e2e8f0', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '12px', 
                                                        fontSize: '10px', 
                                                        fontWeight: comm.waTourSent ? '700' : '500',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        boxShadow: comm.waTourSent ? '0 1px 2px rgba(22, 163, 74, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
                                                    }} title={comm.waTourSent ? "Seyahat Kaydı (tour_registration) mesajı iletildi" : "Seyahat Kaydı mesajı henüz gönderilmedi"}>
                                                        {comm.waTourSent ? (
                                                            <Check size={10} strokeWidth={3} />
                                                        ) : (
                                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }} />
                                                        )}
                                                        Seyahat
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Sağ: E-Posta (Mail) Durumu */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div 
                                                style={{ 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    borderRadius: '6px', 
                                                    background: '#dbeafe', 
                                                    color: '#2563eb', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    flexShrink: 0 
                                                }} 
                                                title="E-Posta Gönderim Durumu"
                                            >
                                                <Mail size={11} strokeWidth={2.4} />
                                            </div>

                                            {comm.isChild ? (
                                                <span style={{ 
                                                    background: '#fdf4ff', 
                                                    color: '#a21caf', 
                                                    border: '1px solid #f5d0fe', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '600' 
                                                }}>
                                                    Ebeveynde
                                                </span>
                                            ) : !comm.hasEmail ? (
                                                <span style={{ 
                                                    background: '#ffffff', 
                                                    color: '#94a3b8', 
                                                    border: '1px solid #e2e8f0', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '500' 
                                                }} title="Kayıtlı e-posta adresi bulunmuyor">
                                                    Tanımlı Değil
                                                </span>
                                            ) : comm.emailSent ? (
                                                <span style={{ 
                                                    background: '#dbeafe', 
                                                    color: '#1d4ed8', 
                                                    border: '1px solid #bfdbfe', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '700', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.1)'
                                                }} title={comm.emailLastDate ? `${comm.emailLastDate} tarihinde iletildi` : "E-posta başarıyla iletildi"}>
                                                    <Check size={10} strokeWidth={3} />
                                                    İletildi
                                                </span>
                                            ) : comm.emailFailed ? (
                                                <span style={{ 
                                                    background: '#fee2e2', 
                                                    color: '#b91c1c', 
                                                    border: '1px solid #fecaca', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '700', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px' 
                                                }} title="E-posta gönderimi başarısız oldu">
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#b91c1c' }} />
                                                    Başarısız
                                                </span>
                                            ) : (
                                                <span style={{ 
                                                    background: '#ffffff', 
                                                    color: '#64748b', 
                                                    border: '1px solid #e2e8f0', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '500', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px' 
                                                }} title="E-posta henüz gönderilmedi">
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }} />
                                                    Bekliyor
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Satır: Mobil Uygulama & Giriş Durumu */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        gap: '8px', 
                                        paddingTop: '6px', 
                                        borderTop: '1px dashed #e2e8f0', 
                                        width: '100%' 
                                    }}>
                                        {/* Sol: Uygulama İkonu & Rozeti */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div 
                                                style={{ 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    borderRadius: '6px', 
                                                    background: comm.appStatus === 'native_ios' || comm.appStatus === 'native_android' ? '#dcfce7' : (comm.appStatus === 'web' ? '#e0f2fe' : '#f1f5f9'), 
                                                    color: comm.appStatus === 'native_ios' || comm.appStatus === 'native_android' ? '#16a34a' : (comm.appStatus === 'web' ? '#0284c7' : '#64748b'), 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    flexShrink: 0 
                                                }} 
                                                title="Mobil Uygulama Durumu"
                                            >
                                                <Smartphone size={11} strokeWidth={2.4} />
                                            </div>

                                            {comm.isChild ? (
                                                <span style={{ 
                                                    background: '#fdf4ff', 
                                                    color: '#a21caf', 
                                                    border: '1px solid #f5d0fe', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '600' 
                                                }}>
                                                    Ebeveynde
                                                </span>
                                            ) : comm.appStatus === 'native_ios' ? (
                                                <span style={{ 
                                                    background: '#dcfce7', 
                                                    color: '#15803d', 
                                                    border: '1px solid #bbf7d0', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '700', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    boxShadow: '0 1px 2px rgba(22, 163, 74, 0.1)'
                                                }} title="Apple App Store uygulamasını indirip giriş yaptı">
                                                    <Check size={10} strokeWidth={3} />
                                                    iOS App Aktif
                                                </span>
                                            ) : comm.appStatus === 'native_android' ? (
                                                <span style={{ 
                                                    background: '#dcfce7', 
                                                    color: '#15803d', 
                                                    border: '1px solid #bbf7d0', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '700', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    boxShadow: '0 1px 2px rgba(22, 163, 74, 0.1)'
                                                }} title="Google Play Store uygulamasını indirip giriş yaptı">
                                                    <Check size={10} strokeWidth={3} />
                                                    Android App Aktif
                                                </span>
                                            ) : comm.appStatus === 'web' ? (
                                                <span style={{ 
                                                    background: '#e0f2fe', 
                                                    color: '#0369a1', 
                                                    border: '1px solid #bae6fd', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '600', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    boxShadow: '0 1px 2px rgba(2, 132, 199, 0.08)'
                                                }} title="Yalnızca web tarayıcısı üzerinden giriş yaptı">
                                                    <Globe size={10} strokeWidth={2.4} />
                                                    Yalnızca Web
                                                </span>
                                            ) : (
                                                <span style={{ 
                                                    background: '#ffffff', 
                                                    color: '#94a3b8', 
                                                    border: '1px solid #e2e8f0', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '10px', 
                                                    fontWeight: '500', 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px' 
                                                }} title="Henüz mobil uygulamayı indirmedi veya giriş yapmadı">
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }} />
                                                    Giriş Yok
                                                </span>
                                            )}
                                        </div>

                                        {/* Sağ: Son Giriş Tarihi veya Durum */}
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
                                            {comm.isChild ? '' : comm.lastLoginFormatted ? (
                                                <span title={`Son giriş: ${comm.lastLoginFormatted}`}>
                                                    Son: <strong style={{ color: '#334155' }}>{comm.lastLoginFormatted}</strong>
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8' }}>İndirme Bekleniyor</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}

                {participants.length > 0 && (
                    <div style={{ 
                        marginTop: '32px', 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '16px 14px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', minWidth: 0 }}>
                            <div style={{ 
                                width: '7px', 
                                height: '7px', 
                                borderRadius: '50%', 
                                background: allTicketsCompleted ? '#10b981' : '#f59e0b',
                                flexShrink: 0
                            }}></div>
                            <span style={{ 
                                fontSize: 'clamp(9px, 2.85vw, 12.5px)', 
                                fontWeight: '700', 
                                color: allTicketsCompleted ? '#10b981' : '#d97706',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                                minWidth: 0
                            }}>
                                {allTicketsCompleted 
                                    ? 'Tüm katılımcıların uçak biletleri (PDF) sisteme yüklendi.' 
                                    : `Biletleme tamamlanmadı (${missingTicketsCount} katılımcının bilet PDF\'i eksik).`}
                            </span>
                        </div>
                        
                        <button
                            onClick={handleSendNotifications}
                            disabled={!allTicketsCompleted || sendingNotifications}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                fontSize: 'clamp(12px, 3.2vw, 13.5px)',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: allTicketsCompleted && !sendingNotifications ? 'pointer' : 'not-allowed',
                                background: allTicketsCompleted 
                                    ? 'linear-gradient(135deg, var(--primary), #ec4899)' 
                                    : '#cbd5e1',
                                color: allTicketsCompleted ? 'white' : '#94a3b8',
                                boxShadow: allTicketsCompleted && !sendingNotifications 
                                    ? '0 6px 16px rgba(215, 20, 122, 0.25)' 
                                    : 'none',
                                transition: 'all 0.25s ease-in-out',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {sendingNotifications ? (
                                <>Katılımcılar Bilgilendiriliyor...</>
                            ) : (
                                <>Biletleme bilgisini müşterilere gönder</>
                            )}
                        </button>
                    </div>
                )}

                {/* Bottom clearance spacer so that cards & buttons are never covered by floating bottom nav & Tintin button */}
                <div style={{ height: '160px', minHeight: '160px', width: '100%', flexShrink: 0, pointerEvents: 'none' }} aria-hidden="true" />
            </div>


            {/* Remove Confirmation Popup */}
            {userToRemove && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '340px', borderRadius: '24px', padding: '24px', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 12px' }}>Listeden Çıkart</h2>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
                            <b>{userToRemove.name}</b> adlı kişiyi bu seyahatin katılımcı listesinden tamamen çıkartmak istediğinize emin misiniz?
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setUserToRemove(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>İptal</button>
                            <button onClick={() => {
                                removeParticipantFromTour(tourId, userToRemove.id);
                                setUserToRemove(null);
                                setShowSht(false);
                            }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#dc2626', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Evet, Çıkart</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Manager Layer */}
            {showTransferSheet && selectedUser && (
                <ParticipantTransferManager
                    tourId={tourId}
                    participant={selectedUser}
                    onClose={() => setShowTransferSheet(false)}
                />
            )}





            {/* Addition Wizard Modal */}
            {showWizard && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '20px', padding: '18px 16px', position: 'relative', animation: 'fadeIn 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                        <div onClick={resetWizard} style={{ position: 'absolute', top: '14px', right: '14px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                            <X size={18} />
                        </div>

                        <h2 style={{ fontSize: '15.5px', fontWeight: '700', margin: '0 0 14px', letterSpacing: '-0.2px', color: '#1e293b' }}>Yeni Katılımcı</h2>

                        {step === 1 && (
                            <div style={{ position: 'relative' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                                    Katılımcıyı eklemek için e-posta adresi, telefon numarası veya isim girin. Sistemde kayıtlıysa hızlıca aktarılır.
                                </p>

                                {searchError && (
                                    <div style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.2s' }}>
                                        <X size={13} /> {searchError}
                                    </div>
                                )}

                                <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', marginBottom: '16px', background: '#f8fafc' }}>
                                    <Search size={16} color="var(--text-muted)" />
                                    <input
                                        type="text"
                                        name={`search_mz_${Math.random()}`}
                                        autoComplete="new-password"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        data-lpignore="true"
                                        placeholder="musteri@ornek.com veya 0532... veya isim..."
                                        value={emailQuery}
                                        onFocus={() => setShowAutocomplete(true)}
                                        onChange={e => {
                                            setEmailQuery(e.target.value);
                                            setSearchError('');
                                            setShowAutocomplete(true);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                setShowAutocomplete(false);
                                                handleEmailSearch();
                                            }
                                        }}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '12.5px' }}
                                    />
                                </div>

                                {showAutocomplete && filteredUsers.length > 0 && (
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginBottom: '14px' }}>
                                        <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                                            Eşleşen Kayıtlı Misafirler ({filteredUsers.length})
                                        </div>
                                        {filteredUsers.slice(0, 6).map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => selectUserFromAutocomplete(u)}
                                                style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: '700' }}>{u.name}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {u.email && !u.email.endsWith('@move.local') ? u.email : (u.phone || 'Kayıtlı Profil')}
                                                        {u.company ? ` • ${u.company}` : ''}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: '700', background: '#fdf2f8', padding: '3px 8px', borderRadius: '6px' }}>+ Dahil Et</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className="btn-primary" onClick={() => { setShowAutocomplete(false); handleEmailSearch(); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                                    <CheckCircle2 size={16} /> Sorgula
                                </button>
                            </div>
                        )}

                        {step === 1.5 && (
                            <div style={{ animation: 'slideRight 0.3s ease' }}>
                                <div style={{ background: '#fef9c3', color: '#854d0e', padding: '12px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', lineHeight: 1.4 }}>
                                    <b style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px' }}>Kullanıcı tespit edilemedi! ⚠️</b>
                                    <b>{newName || emailQuery || newPhone || 'Bu kişi'}</b> sistemde kayıtlı değil. Bu kişi ilk kez mi bir seyahate katılıyor?
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: 'var(--text-main)', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Hayır, Düzelt</button>
                                    <button onClick={() => {
                                        setStep(2);
                                    }} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Evet, Doğru</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ animation: 'slideUp 0.3s ease' }}>
                                <div style={{ background: '#f0fdf4', color: '#166534', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', marginBottom: '14px', fontWeight: '600', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    💡 E-posta veya Telefon numarasından en az birinin girilmesi yeterlidir.
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                    <button
                                        onClick={() => setNewCustomerType('parent')}
                                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid ' + (newCustomerType === 'parent' ? 'var(--primary)' : '#e2e8f0'), background: newCustomerType === 'parent' ? '#FDF2F8' : 'white', color: newCustomerType === 'parent' ? 'var(--primary)' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}
                                    >
                                        <UserIcon size={14} /> Ana Müşteri
                                    </button>
                                    <button
                                        onClick={() => setNewCustomerType('child')}
                                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid ' + (newCustomerType === 'child' ? 'var(--primary)' : '#e2e8f0'), background: newCustomerType === 'child' ? '#FDF2F8' : 'white', color: newCustomerType === 'child' ? 'var(--primary)' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}
                                    >
                                        <Users size={14} /> Çocuk Kullanıcı
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                    {newCustomerType === 'parent' && (
                                        <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>
                                                E-Posta {newPhone ? '(Opsiyonel)' : '(veya Telefon Numarası)'}
                                            </label>
                                            <input
                                                type="email"
                                                value={emailQuery}
                                                onChange={e => setEmailQuery(e.target.value)}
                                                placeholder="Örn: musteri@ornek.com"
                                                style={{ width: '100%', padding: '8.5px 10px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', color: '#1e293b', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>İsim Soyisim *</label>
                                        <input type="text" placeholder="Örn: Ahmet Yılmaz" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '8.5px 10px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', color: '#1e293b', boxSizing: 'border-box' }} />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>T.C. Kimlik Numarası (Opsiyonel)</label>
                                        <input type="text" maxLength={11} placeholder="Örn: 12345678901" value={newTcNo} onChange={e => setNewTcNo(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '8.5px 10px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', color: '#1e293b', boxSizing: 'border-box' }} />
                                    </div>

                                    {newCustomerType === 'parent' && (
                                        <>
                                            <div>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>
                                                    Telefon Numarası {emailQuery ? '(Opsiyonel)' : '(veya E-Posta)'}
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid #cbd5e1', borderRadius: '9px', background: '#f8fafc', overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 9px', background: '#f1f5f9', borderRight: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: '700', userSelect: 'none' }}>
                                                        +90
                                                    </div>
                                                    <input 
                                                        type="tel" 
                                                        placeholder="555 123 45 67" 
                                                        value={newPhone} 
                                                        onChange={e => setNewPhone(formatPhoneNumber(e.target.value))} 
                                                        maxLength={14} 
                                                        style={{ flex: 1, padding: '8.5px 10px', border: 'none', outline: 'none', background: 'transparent', fontSize: '12.5px', color: '#1e293b', boxSizing: 'border-box' }} 
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', margin: '0 0 3px', display: 'block' }}>Şirket / Firma (Zorunlu)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        name="random_comp_xyz_9988"
                                                        id="company_input_field"
                                                        autoComplete="off"
                                                        data-lpignore="true"
                                                        data-form-type="other"
                                                        autoCorrect="off"
                                                        spellCheck="false"
                                                        placeholder="Firma Adı Yazın veya Seçin..."
                                                        value={newCompany}
                                                        onChange={e => {
                                                            setNewCompany(e.target.value);
                                                            setShowCompanyAutocomplete(true);
                                                        }}
                                                        onFocus={() => setShowCompanyAutocomplete(true)}
                                                        onBlur={() => setTimeout(() => setShowCompanyAutocomplete(false), 200)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8.5px 30px 8.5px 10px',
                                                            borderRadius: showCompanyAutocomplete && filteredCompanies.length > 0 ? '9px 9px 0 0' : '9px',
                                                            border: '1px solid #cbd5e1',
                                                            background: '#f8fafc',
                                                            outline: 'none',
                                                            fontSize: '12.5px',
                                                            color: '#1e293b',
                                                            boxSizing: 'border-box',
                                                            transition: 'border-radius 0.2s ease'
                                                        }}
                                                    />
                                                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) ${showCompanyAutocomplete ? 'rotate(180deg)' : 'rotate(0)'}`, pointerEvents: 'none', color: '#64748b', transition: 'transform 0.2s ease' }}>
                                                        <ChevronDown size={15} />
                                                    </div>
                                                </div>

                                                {showCompanyAutocomplete && filteredCompanies.length > 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        background: 'white',
                                                        border: '1px solid #cbd5e1',
                                                        borderTop: 'none',
                                                        borderRadius: '0 0 9px 9px',
                                                        boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                                                        zIndex: 1000,
                                                        overflow: 'hidden'
                                                    }}>
                                                        {filteredCompanies.map((c, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => {
                                                                    setNewCompany(c);
                                                                    setShowCompanyAutocomplete(false);
                                                                }}
                                                                style={{ padding: '9px 12px', cursor: 'pointer', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>{c}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Parent Search (For Child Profile) */}
                                    {newCustomerType === 'child' && (
                                        <div style={{ position: 'relative' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Ebeveyn Seçin (Birden fazla seçilebilir)</label>

                                            <div style={{ position: 'relative', marginBottom: '6px' }}>
                                                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                                                    <Search size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="İsim ile ebeveyn arayın..."
                                                    value={parentSearchQuery}
                                                    onChange={e => {
                                                        setParentSearchQuery(e.target.value);
                                                        setShowParentSearchDropdown(true);
                                                    }}
                                                    onFocus={() => setShowParentSearchDropdown(true)}
                                                    style={{ width: '100%', padding: '8.5px 10px 8.5px 30px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            {showParentSearchDropdown && parentSearchQuery && (
                                                <div style={{ position: 'absolute', top: '56px', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                                                    {participants.filter(p => p.role === 'customer' && !newParentIds.includes(p.id) && !isUserChild(p) && p.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).slice(0, 5).map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                setNewParentIds([...newParentIds, p.id]);
                                                                setParentSearchQuery('');
                                                                setShowParentSearchDropdown(false);
                                                            }}
                                                            style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '700' }}>{p.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {participants.filter(p => p.role === 'customer' && !newParentIds.includes(p.id) && !isUserChild(p) && p.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).length === 0 && (
                                                        <div style={{ padding: '9px 12px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center' }}>Uygun ana kullanıcı bulunamadı veya eklendi.</div>
                                                    )}
                                                </div>
                                            )}

                                            {newParentIds.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                                                    {newParentIds.map(parentId => {
                                                        const p = participants.find(u => u.id === parentId);
                                                        if (!p) return null;
                                                        return (
                                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                                        {p.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{p.name}</span>
                                                                </div>
                                                                <div onClick={() => setNewParentIds(newParentIds.filter(id => id !== p.id))} style={{ cursor: 'pointer', background: 'white', width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #fecaca', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Trash2 size={12} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Children Search (For Parent Profile) */}
                                    {newCustomerType === 'parent' && (
                                        <div style={{ position: 'relative' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px', display: 'block' }}>Bağlı Çocuklar (Varsa)</label>

                                            <div style={{ position: 'relative', marginBottom: '6px' }}>
                                                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                                                    <Search size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="İsim ile çocuk arayın..."
                                                    value={childSearchQuery}
                                                    onChange={e => {
                                                        setChildSearchQuery(e.target.value);
                                                        setShowChildSearchDropdown(true);
                                                    }}
                                                    onFocus={() => setShowChildSearchDropdown(true)}
                                                    style={{ width: '100%', padding: '8.5px 10px 8.5px 30px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12.5px', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            {showChildSearchDropdown && childSearchQuery && (
                                                <div style={{ position: 'absolute', top: '56px', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                                                    {participants.filter(p => p.role === 'customer' && !newChildrenIds.includes(p.id) && isUserChild(p) && p.name.toLowerCase().includes(childSearchQuery.toLowerCase())).slice(0, 5).map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                setNewChildrenIds([...newChildrenIds, p.id]);
                                                                setChildSearchQuery('');
                                                                setShowChildSearchDropdown(false);
                                                            }}
                                                            style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '700' }}>{p.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {participants.filter(p => p.role === 'customer' && !newChildrenIds.includes(p.id) && isUserChild(p) && p.name.toLowerCase().includes(childSearchQuery.toLowerCase())).length === 0 && (
                                                        <div style={{ padding: '9px 12px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center' }}>Uygun çocuk hesabı bulunamadı veya eklendi.</div>
                                                    )}
                                                </div>
                                            )}

                                            {newChildrenIds.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                                                    {newChildrenIds.map(childId => {
                                                        const c = participants.find(u => u.id === childId);
                                                        if (!c) return null;
                                                        return (
                                                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                                        {c.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{c.name}</span>
                                                                </div>
                                                                <div onClick={() => setNewChildrenIds(newChildrenIds.filter(id => id !== c.id))} style={{ cursor: 'pointer', background: 'white', width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #fecaca', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Trash2 size={12} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>

                                <button className="btn-primary" onClick={handleCreateUser} style={{ width: '100%', padding: '11px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
                                    Kaydet ve Tura Ekle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* In-App Alert / Success Popup */}
            {successPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '350px', borderRadius: '22px', padding: '24px 20px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid #edf2f7' }}>
                        
                        {/* Top Icon Badge */}
                        {successPopup.type === 'error' ? (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)' }}>
                                <AlertTriangle size={26} color="#dc2626" />
                            </div>
                        ) : successPopup.type === 'info' ? (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)' }}>
                                <Mail size={26} color="#0284c7" />
                            </div>
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>
                                <CheckCircle2 size={26} color="#10b981" />
                            </div>
                        )}

                        <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px', letterSpacing: '-0.2px' }}>
                            {successPopup.title || 'İşlem Başarılı!'}
                        </h2>

                        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
                            {successPopup.description || (typeof successPopup.message === 'string' ? successPopup.message : 'İşlem başarıyla tamamlandı.')}
                        </p>

                        {/* Credential / Email Summary Card (if applicable) */}
                        {(successPopup.email || successPopup.password) && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', textAlign: 'left', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                                    <Mail size={13} color="#0284c7" /> <span>Müşteri Giriş Bilgileri</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                                    {successPopup.email && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Kullanıcı Adı:</span>
                                            <span style={{ color: '#1e293b', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {successPopup.email}
                                            </span>
                                        </div>
                                    )}
                                    {successPopup.password && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600', flexShrink: 0 }}>{successPopup.labelPassword || 'Şifre'}:</span>
                                            <span style={{ background: '#FDF2F8', color: '#B01064', border: '1px solid #F9BED8', padding: '3px 9px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.4px' }}>
                                                {successPopup.password}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stats Breakdown Card (if applicable) */}
                        {Array.isArray(successPopup.stats) && successPopup.stats.length > 0 && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                {successPopup.stats.map((st, sIdx) => (
                                    <div key={sIdx} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>{st.label}</div>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: st.color || '#1e293b' }}>{st.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setSuccessPopup(null)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 10px rgba(215, 20, 122, 0.25)' }}>
                            Tamam
                        </button>
                    </div>
                </div>
            )}



        </div>
    );
}
