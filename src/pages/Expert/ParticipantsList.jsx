import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Plus, Phone, MessageCircle, X, Search, User as UserIcon, Building, Mail, CheckCircle2, History, Activity, Users, PlaneTakeoff, BellRing, BellOff, Trash2, AlertTriangle, FileSpreadsheet, Lock, UserPlus, Ticket } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';
import ParticipantTransferManager from '../../components/ParticipantTransferManager';
import BulkParticipantManager from '../../components/BulkParticipantManager';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { isUserChild as checkUserChild, canUserReceiveEmail, isChildEmail } from '../../utils/userUtils';

export default function ParticipantsList() {
    const navigate = useNavigate();
    const { tourId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();
    const { smtpConfig, corporateName } = useSettingsStore();

    const { tours, addParticipantToTour, removeParticipantFromTour } = useTourStore();
    const { users, companies, findUserByEmail, addUser, addCompany, updateUser } = useUserStore();

    const tour = tours.find(t => t.id === tourId);
    const participants = tour?.participants || [];

    const isUserChild = (u) => checkUserChild(u, users);

    const missingTicketsCount = participants.filter(p => !p.ticketPdf && (!p.ticketFiles || p.ticketFiles.length === 0)).length;
    const allTicketsCompleted = participants.length > 0 && missingTicketsCount === 0;

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
                const globalUser = users.find(u => u.id === p.id || u.email === p.email);
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
            
            alert(`Başarılı! Biletleme bilgilendirmesi ${sentCount} katılımcıya gönderildi.`);
        } catch (err) {
            alert("Gönderim sırasında bir hata oluştu: " + err.message);
        } finally {
            setSendingNotifications(false);
        }
    };

    const [showSht, setShowSht] = useState(false); // Bottom sheet for user details
    const [selectedUser, setSelectedUser] = useState(null);
    const [contactForm, setContactForm] = useState({ email: '', phone: '' });
    const [isSavingContact, setIsSavingContact] = useState(false);
    const [identityForm, setIdentityForm] = useState({
        passportCountry: '', passportNo: '', passportExp: '', tcNo: '',
        bloodType: '', birthDate: '', emergencyContactName: '', emergencyContactPhone: '',
        allergies: '', medications: '', dietaryReq: ''
    });
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [showTransferSheet, setShowTransferSheet] = useState(false);
    const [showBulkParticipant, setShowBulkParticipant] = useState(false);
    const [successPopup, setSuccessPopup] = useState(null);
    const [userToRemove, setUserToRemove] = useState(null);

    React.useEffect(() => {
        const transferTarget = searchParams.get('openTransfer');
        if (transferTarget && participants.length > 0) {
            const userToOpen = participants.find(p => p.id === transferTarget || p.id === parseInt(transferTarget, 10));
            if (userToOpen) {
                const globalUser = users.find(u => u.id === userToOpen.id || u.email === userToOpen.email) || userToOpen;
                setSelectedUser(globalUser);
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
            const upToDate = users.find(u => u.id === selectedUser.id || u.email === selectedUser.email);
            if (upToDate && upToDate.pushEnabled !== selectedUser.pushEnabled) {
                setSelectedUser(upToDate);
            }
        }
    }, [users, selectedUser]);

    const [showWizard, setShowWizard] = useState(false);

    // Wizard State
    const [step, setStep] = useState(1); // 1: Email query, 1.5: Confirm missing, 2: New user form
    const [emailQuery, setEmailQuery] = useState('');
    const [searchError, setSearchError] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    const filteredUsers = users.filter(u =>
        u.role === 'customer' &&
        (u.email.toLowerCase().includes(emailQuery.toLowerCase()) ||
            u.name.toLowerCase().includes(emailQuery.toLowerCase())) &&
        emailQuery.length > 0
    );

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
        if (!value) return '';
        const digits = value.replace(/\D/g, '');
        const cleanDigits = digits.startsWith('0') ? digits.substring(1).slice(0, 10) : (digits.startsWith('90') ? digits.substring(2).slice(0, 10) : digits.slice(0, 10));
        if (cleanDigits.length <= 3) return cleanDigits;
        if (cleanDigits.length <= 6) return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3)}`;
        if (cleanDigits.length <= 8) return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6)}`;
        return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6, 8)} ${cleanDigits.slice(8, 10)}`;
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
        const globalUser = users.find(u => u.id === p.id || u.email === p.email) || p;
        setSelectedUser(globalUser);
        const initialEmail = globalUser.email && !globalUser.email.endsWith('@move.local') ? globalUser.email : (globalUser.email || '');
        const initialPhone = globalUser.phone && globalUser.phone !== '-' ? globalUser.phone : '';
        setContactForm({
            email: initialEmail,
            phone: initialPhone
        });
        setIdentityForm({
            passportCountry: globalUser.passportCountry || '',
            passportNo: globalUser.passportNo || '',
            passportExp: globalUser.passportExp || '',
            tcNo: globalUser.tcNo || '',
            bloodType: globalUser.bloodType || '',
            birthDate: globalUser.birthDate || '',
            emergencyContactName: globalUser.emergencyContactName || '',
            emergencyContactPhone: globalUser.emergencyContactPhone || '',
            allergies: globalUser.allergies || '',
            medications: globalUser.medications || '',
            dietaryReq: globalUser.dietaryReq || ''
        });
        setShowTransferSheet(false);
        setShowSht(true);
    };

    const handleSaveContact = async () => {
        if (!selectedUser) return;
        setIsSavingContact(true);
        try {
            const cleanEmail = (contactForm.email || '').trim().toLowerCase();
            let cleanPhone = (contactForm.phone || '').trim();

            if (!cleanEmail && !cleanPhone) {
                alert('Lütfen en az bir iletişim bilgisi (e-posta veya telefon) giriniz.');
                setIsSavingContact(false);
                return;
            }

            const payload = {
                email: cleanEmail || selectedUser.email,
                phone: cleanPhone || '-'
            };

            await updateUser(selectedUser.id, payload);

            if (tour && tour.participants) {
                const updatedParticipants = tour.participants.map(p => {
                    if (p.id === selectedUser.id || p.email === selectedUser.email) {
                        return {
                            ...p,
                            email: payload.email,
                            phone: payload.phone
                        };
                    }
                    return p;
                });
                const { updateDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                await updateDoc(doc(db, 'tours', tour.id), { participants: updatedParticipants });
            }

            setSelectedUser(prev => ({ ...prev, ...payload }));
            alert('Müşteri iletişim bilgileri başarıyla güncellendi!');
        } catch (e) {
            console.error("Save contact error:", e);
            alert('İletişim bilgileri kaydedilirken hata oluştu: ' + e.message);
        } finally {
            setIsSavingContact(false);
        }
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
                // 1) welcome_customer (1 param: Name)
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newUserTemplate',
                    [participantName]
                );
                // 2) tour_registration (2 params: Name, Tour Name)
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newTourTemplate',
                    [participantName, tour.name]
                );
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
                            password: password,
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

    const handleEmailSearch = async () => {
        if (!emailQuery.trim()) return;
        setSearchError('');

        const query = emailQuery.trim().toLowerCase();
        const cleanPhoneQuery = query.replace(/\D/g, '');

        let existing = findUserByEmail(query);
        if (!existing && cleanPhoneQuery.length >= 7) {
            existing = users.find(u => {
                const uPhone = (u.phone || '').replace(/\D/g, '');
                return uPhone.length >= 7 && (uPhone.endsWith(cleanPhoneQuery.slice(-10)) || cleanPhoneQuery.endsWith(uPhone.slice(-10)));
            });
        }
        if (!existing && query.length >= 3) {
            existing = users.find(u => u.name && u.name.trim().toLowerCase() === query);
        }

        if (existing) {
            if (existing.role !== 'customer') {
                setSearchError('Sadece müşteri rolündeki kullanıcılar katılımcı olarak eklenebilir!');
                return;
            }
            const isAlreadyInTour = participants.some(p => p.id === existing.id || p.email === existing.email);
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
                    email: isExistingChild ? undefined : (existing.email?.endsWith('@move.local') ? existing.phone : existing.email),
                    tourName: tour.name
                });
                resetWizard();
            }
        } else {
            if (cleanPhoneQuery.length >= 10 && !query.includes('@')) {
                setNewPhone(formatPhoneNumber(cleanPhoneQuery));
                setEmailQuery('');
            } else if (!query.includes('@') && isNaN(query.replace(/\s/g, ''))) {
                setNewName(formatTitleCase(emailQuery));
                setEmailQuery('');
            }
            setStep(1.5);
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

        const formattedPhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+90 ${rawPhone}`) : '-';

        let finalEmail;
        if (isChild) {
            finalEmail = `child_${Date.now()}@move.local`;
        } else if (hasEmail) {
            finalEmail = emailQuery.trim().toLowerCase();
        } else {
            const phoneSlug = cleanDigits.startsWith('90') ? cleanDigits.slice(2) : cleanDigits;
            finalEmail = `user_${phoneSlug || Date.now()}@move.local`;
        }

        const newUserPassword = generateSecurePassword(newName);

        const newUser = await addUser({
            name: newName,
            email: finalEmail,
            role: 'customer',
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
            await sendTourAssignmentEmail(newUser.name, newUser.email, newUserPassword, newUser.phone);
            setSuccessPopup({
                title: 'Yeni Profil Oluşturuldu',
                description: `Kullanıcı başarıyla oluşturuldu ve tura dahil edildi.`,
                name: newUser.name,
                email: newUser.email?.endsWith('@move.local') ? newUser.phone : newUser.email,
                password: newUserPassword,
                tourName: tour.name
            });
        }

        resetWizard();
    };

    if (!tour) return <div style={{ padding: '20px' }}>Tur bulunamadı.</div>;

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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>

                    <div onClick={() => setShowBulkParticipant(true)} style={{ background: 'rgba(255,255,255,0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title="Excel ile Toplu Katılımcı Ekle">
                        <UserPlus size={20} />
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
            <div style={{ padding: '20px 16px' }}>
                {participants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Henüz bir katılımcı eklenmedi</h3>
                        <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Sağ üstteki (+) butonunu kullanarak bilet satışı gerçekleşen müşterileri bu tura atayın.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {participants.map(p => {
                            const globalP = users.find(u => u.id === p.id) || p;
                            const isLinked = !!globalP.linkedTo && (Array.isArray(globalP.linkedTo) ? globalP.linkedTo.length > 0 : true);
                            const parents = isLinked ? users.filter(parentP => Array.isArray(globalP.linkedTo) ? globalP.linkedTo.includes(parentP.id) || globalP.linkedTo.includes(String(parentP.id)) : parentP.id === globalP.linkedTo || String(parentP.id) === String(globalP.linkedTo)) : [];
                            
                            const partTickets = (Array.isArray(p.ticketFiles) && p.ticketFiles.length > 0)
                                ? p.ticketFiles
                                : ((Array.isArray(globalP.ticketFiles) && globalP.ticketFiles.length > 0)
                                    ? globalP.ticketFiles
                                    : ((p.ticketPdf || globalP.ticketPdf) ? [p.ticketPdf || globalP.ticketPdf] : []));
                            const ticketCount = partTickets.length;
                            const hasTicketPdf = ticketCount > 0;
                            const companyName = globalP.company && globalP.company !== 'Bireysel Müşteri' && globalP.company !== 'Move Travel & Mice' ? globalP.company : null;

                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => openProfile(p)} 
                                    style={{ 
                                        background: '#ffffff', 
                                        borderRadius: '16px', 
                                        padding: '12px 14px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
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
                                        {isLinked ? (
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
                                                        const globalP = users.find(u => u.id === p.id || u.email === p.email) || p;
                                                        if (globalP.phone && globalP.phone !== '-') {
                                                            window.location.href = `tel:${globalP.phone}`;
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
            </div>

            {/* Full Screen Profile Page Overlay */}
            {showSht && selectedUser && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    width: '100%', 
                    maxWidth: '480px', 
                    height: '100dvh', 
                    maxHeight: '100vh', 
                    zIndex: 1100, 
                    background: '#f8fafc', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    animation: 'fadeIn 0.2s',
                    boxShadow: '0 0 30px rgba(0,0,0,0.15)'
                }}>

                    {/* Header */}
                    <div style={{ 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: 'calc(20px + env(safe-area-inset-top, 0px)) 16px 18px 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        position: 'sticky', 
                        top: 0, 
                        zIndex: 10, 
                        flexShrink: 0,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div onClick={() => setShowSht(false)} style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                                <ChevronLeft size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>Müşteri Profili</h2>
                                <div style={{ fontSize: '11px', opacity: 0.85 }}>{selectedUser.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div style={{ 
                        padding: '16px 16px calc(30px + env(safe-area-inset-bottom, 0px)) 16px', 
                        flex: 1, 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '14px', 
                        WebkitOverflowScrolling: 'touch',
                        animation: 'slideUp 0.3s ease' 
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <img 
                                    loading="lazy" 
                                    src={selectedUser.avatar} 
                                    alt="Avatar" 
                                    style={{ 
                                        width: '64px', 
                                        height: '64px', 
                                        borderRadius: '50%', 
                                        objectFit: 'cover', 
                                        border: '2px solid #f1f5f9', 
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                        flexShrink: 0
                                    }} 
                                />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                                            {selectedUser.name}
                                        </h2>
                                        {isUserChild(selectedUser) && (
                                            <span style={{ background: '#fdf4ff', color: '#a21caf', border: '1px solid #fae8ff', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '8px' }}>
                                                🎈 Çocuk
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Building size={13} color="#94a3b8" />
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
                            const userPart = participants.find(p => p.id === selectedUser.id || p.email === selectedUser.email);
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
                                        <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Mail size={12} color="#64748b" /> E-Posta
                                        </label>
                                        <input 
                                            type="email" 
                                            placeholder="ornek@domain.com"
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
                                                value={contactForm.phone.replace(/^\+90\s*/, '')} 
                                                onChange={e => setContactForm({ ...contactForm, phone: formatPhoneNumber(e.target.value) })} 
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
                </div>
            )}

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




            {/* Excel Bulk Participant Import Layer */}
            {showBulkParticipant && (
                <BulkParticipantManager
                    tourId={tourId}
                    onClose={() => setShowBulkParticipant(false)}
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
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '12.5px' }}
                                    />
                                </div>

                                {showAutocomplete && filteredUsers.length > 0 && (
                                    <div style={{ position: 'absolute', top: '110px', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                                        {filteredUsers.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => {
                                                    setEmailQuery(u.email);
                                                    setShowAutocomplete(false);
                                                }}
                                                style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                            >
                                                <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: '600' }}>{u.email}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({u.name})</span>
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
                                    <b>{emailQuery || newPhone || newName}</b> sistemde kayıtlı değil. Bu kişi ilk kez mi bir seyahate katılıyor?
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: 'var(--text-main)', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Hayır, Düzelt</button>
                                    <button onClick={() => {
                                        const q = (emailQuery || '').trim();
                                        const cleanP = q.replace(/\D/g, '');
                                        if (cleanP.length >= 10 && !q.includes('@')) {
                                            setNewPhone(formatPhoneNumber(cleanP));
                                            setEmailQuery('');
                                        } else if (!q.includes('@') && isNaN(q.replace(/\s/g, ''))) {
                                            setNewName(formatTitleCase(q));
                                            setEmailQuery('');
                                        }
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

            {/* Success Popup */}
            {successPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '330px', borderRadius: '20px', padding: '22px 18px', textAlign: 'center', boxShadow: '0 12px 36px rgba(0,0,0,0.18)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid #edf2f7' }}>
                        
                        {/* Top Green Badge */}
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>
                            <CheckCircle2 size={24} color="#10b981" />
                        </div>

                        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px', letterSpacing: '-0.2px' }}>
                            {successPopup.title || 'İşlem Başarılı!'}
                        </h2>

                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.4 }}>
                            {successPopup.description || (typeof successPopup.message === 'string' ? successPopup.message : 'Kullanıcı başarıyla seyahate dahil edildi.')}
                        </p>

                        {/* Credential / Email Summary Card (if applicable) */}
                        {(successPopup.email || successPopup.password) && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', textAlign: 'left', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                                    <Mail size={13} color="#0284c7" /> <span>Müşteri Giriş Bilgileri</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                                    {successPopup.email && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600', flexShrink: 0 }}>E-Posta:</span>
                                            <span style={{ color: '#1e293b', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {successPopup.email}
                                            </span>
                                        </div>
                                    )}
                                    {successPopup.password && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#64748b', fontWeight: '600', flexShrink: 0 }}>Geçici Şifre:</span>
                                            <span style={{ background: '#FDF2F8', color: '#B01064', border: '1px solid #F9BED8', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace', fontSize: '11.5px', letterSpacing: '0.3px' }}>
                                                {successPopup.password}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSuccessPopup(null)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '10.5px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)' }}>
                            Tamam, Kapat
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
