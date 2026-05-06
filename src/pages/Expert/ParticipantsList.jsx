import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Plus, Phone, MessageCircle, X, Search, User as UserIcon, Building, Mail, CheckCircle2, History, Activity, Users, PlaneTakeoff, BellRing, BellOff, Trash2, AlertTriangle, FileSpreadsheet, Lock } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useUserStore } from '../../store/userStore';
import ParticipantTransferManager from '../../components/ParticipantTransferManager';
import BulkTicketManager from '../../components/BulkTicketManager';
import BulkDataEntryManager from '../../components/BulkDataEntryManager';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

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

    const [showSht, setShowSht] = useState(false); // Bottom sheet for user details
    const [selectedUser, setSelectedUser] = useState(null);
    const [identityForm, setIdentityForm] = useState({
        passportCountry: '', passportNo: '', passportExp: '',
        bloodType: '', birthDate: '', emergencyContactName: '', emergencyContactPhone: '',
        allergies: '', medications: '', dietaryReq: ''
    });
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [showTransferSheet, setShowTransferSheet] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showBulkDataEntry, setShowBulkDataEntry] = useState(false);
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

    const isUserChild = (u) => {
        const fullUser = users.find(usr => usr.id === u.id) || u;
        if (!fullUser) return false;

        // An adult is someone who is a parent to ANYONE
        const isParent = users.some(other => {
            if (!other.linkedTo) return false;
            if (Array.isArray(other.linkedTo)) return other.linkedTo.includes(fullUser.id) || other.linkedTo.includes(String(fullUser.id));
            if (typeof other.linkedTo === 'string') return other.linkedTo === String(fullUser.id);
            return false;
        });
        if (isParent) return false;

        // If they are explicitly marked as a child
        if (fullUser.isChildProfile === true) return true;

        // If they have a child email
        if (fullUser.email && fullUser.email.startsWith('child_')) return true;

        // If they have a linkedTo field (and are not a parent)
        const lt = fullUser.linkedTo;
        if (Array.isArray(lt)) return lt.length > 0;
        if (typeof lt === 'string') {
            const val = lt.trim().toLowerCase();
            return val !== '' && val !== 'null' && val !== 'undefined' && val !== '[]' && val !== '-';
        }

        return false;
    };

    const [showWizard, setShowWizard] = useState(false);

    // Wizard State
    const [step, setStep] = useState(1); // 1: Email query, 1.5: Confirm missing, 2: New user form
    const [emailQuery, setEmailQuery] = useState('');
    const [searchError, setSearchError] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);

    const filteredUsers = users.filter(u =>
        (u.email.toLowerCase().includes(emailQuery.toLowerCase()) ||
            u.name.toLowerCase().includes(emailQuery.toLowerCase())) &&
        emailQuery.length > 0
    );

    // New User form state
    const [newCustomerType, setNewCustomerType] = useState('parent'); // 'parent' or 'child'
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newCompany, setNewCompany] = useState('');
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
    const safeCompanies = Array.isArray(companies) ? companies.map(c => String(c || '')) : ['Move Travel & Mice'];
    const filteredCompanies = safeCompanies.filter(c => c && c.toLowerCase().includes(newCompany.toLowerCase()));

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
        setIdentityForm({
            passportCountry: globalUser.passportCountry || '',
            passportNo: globalUser.passportNo || '',
            passportExp: globalUser.passportExp || '',
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

    const sendTourAssignmentEmail = async (participantName, participantEmail, password = null) => {
        if (smtpConfig?.host && smtpConfig?.user) {
            try {
                // Determine base URL: Use current origin in dev, or the production cloud functions URL
                const baseUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:5001/travel-app-move/us-central1/backend' : 'https://us-central1-travel-app-move.cloudfunctions.net/backend';
                await fetch(`${baseUrl}/api/send-tour-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...smtpConfig,
                        to: participantEmail,
                        corporateName: corporateName,
                        participantName: participantName,
                        tourName: tour.name,
                        password: password
                    })
                });
            } catch(e) {
                console.error("Email send error", e);
            }
        }
    };

    const handleEmailSearch = async () => {
        if (!emailQuery.trim()) return;
        setSearchError('');

        const existing = findUserByEmail(emailQuery);
        if (existing) {
            const isAlreadyInTour = participants.some(p => p.id === existing.id || p.email === existing.email);
            if (isAlreadyInTour) {
                setSearchError('Bu müşteri zaten seyahate kayıtlı!');
            } else {
                addParticipantToTour(tourId, existing);
                await sendTourAssignmentEmail(existing.name, existing.email);
                setSuccessPopup({
                    title: '✅ Başarıyla Eklendi!',
                    message: `Kullanıcı sistemde bulundu (${existing.name}) ve seyahate dahil edildi.\n\n📧 Müşteriye Gönderilen E-Posta:\n"Sayın ${existing.name}, ${tour.name} seyahati kaydınız yapılmıştır."`
                });
                resetWizard();
            }
        } else {
            setStep(1.5);
        }
    };

    const handleCreateUser = async () => {
        const isChild = newCustomerType === 'child';

        if (!newName.trim()) {
            alert('Lütfen İsim Soyisim alanını doldurun.');
            return;
        }

        if (!isChild && (!newCompany.trim() || !emailQuery.trim())) {
            alert('Lütfen E-posta ve Firma alanlarını doldurun.');
            return;
        }

        const compValue = isChild ? 'Move Travel & Mice' : (newCompany.trim() || 'Move Travel & Mice');
        if (!isChild && compValue && !companies.includes(compValue)) {
            addCompany(compValue);
        }

        const finalEmail = isChild ? `child_${Date.now()}@move.local` : emailQuery;

        const newUser = await addUser({
            name: newName,
            email: finalEmail,
            role: 'customer',
            phone: isChild ? '-' : (newPhone || '-'),
            company: compValue,
            password: isChild ? '123456' : undefined,
            linkedTo: isChild && newParentIds.length > 0 ? newParentIds : null,
            isChildProfile: isChild
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

        if (isChild && newParentIds.length > 0) {
            const parentNames = newParentIds.map(pid => participants.find(p => p.id === pid)?.name).filter(Boolean).join(', ');
            setSuccessPopup({
                title: '✅ Çocuk Profili Oluşturuldu!',
                message: (
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ marginBottom: '12px', color: 'var(--text-main)', fontWeight: 'bold' }}>Aşağıdaki bilgilendirme e-postası ebeveynlere gönderildi:</p>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontFamily: 'sans-serif', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#D7147A', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>
                                    M
                                </div>
                            </div>
                            <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
                                <b>Sayın {parentNames || 'Müşterimiz'},</b><br /><br />
                                Move sistemine <b>{newUser.name}</b> adlı çocuğunuzun profili başarıyla eklenmiş ve sizin hesabınıza bağlanmıştır.<br /><br />
                                <div style={{ background: '#fdf2f8', padding: '12px', borderRadius: '8px', border: '1px solid #fbcfe8', color: '#D7147A', textAlign: 'center', margin: '16px 0', fontSize: '13px', fontWeight: '600' }}>
                                    Sisteme kendi bilgilerinizle giriş yaparak "Profil" sayfanız üzerinden çocuğunuzun bilet, sağlık ve acil durum bilgilerini hemen yönetmeye başlayabilirsiniz.
                                </div>
                                Bizi tercih ettiğiniz için teşekkür ederiz.<br /><br />
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Move Travel & Mice Seyahat Yönetimi</span>
                            </div>
                        </div>
                    </div>
                )
            });
        } else {
            await sendTourAssignmentEmail(newUser.name, newUser.email, '123456');
            setSuccessPopup({
                title: '✅ Yeni Profil Oluşturuldu!',
                message: `Kullanıcı başarıyla oluşturuldu ve tura dahil edildi.\n\n📧 Müşteriye Gönderilen E-Posta:\n"Sayın ${newUser.name}, ${tour.name} seyahatine kaydınız yapıldı.\n\nKullanıcı Adınız: ${newUser.email}\nŞifreniz: 123456"`
            });
        }

        resetWizard();
    };

    if (!tour) return <div style={{ padding: '20px' }}>Tur bulunamadı.</div>;

    return (
        <div style={{ paddingBottom: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>

            {/* Header */}
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={handleBack} style={{ cursor: 'pointer', padding: '4px' }}>
                        <ChevronLeft size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px' }}>Katılımcılar</h2>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>{tour.name} • {participants.length} Kişi</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(user?.role === 'admin' || user?.role === 'ticketing') && participants.length > 0 && (
                        <>
                            <div onClick={() => setShowBulkDataEntry(true)} style={{ background: 'rgba(255,255,255,0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Tümüne Bilet/Transfer Ekle">
                                <PlaneTakeoff size={20} />
                            </div>
                            <div onClick={() => setShowBulkUpload(true)} style={{ background: 'rgba(255,255,255,0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Toplu Bilet İşlemleri (Excel)">
                                <FileSpreadsheet size={20} />
                            </div>
                        </>
                    )}
                    <div onClick={() => setShowWizard(true)} style={{ background: 'rgba(255,255,255,0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Plus size={20} />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {participants.map(p => {
                            const globalP = users.find(u => u.id === p.id) || p;
                            const isLinked = !!globalP.linkedTo && (Array.isArray(globalP.linkedTo) ? globalP.linkedTo.length > 0 : true);
                            const parents = isLinked ? users.filter(parentP => Array.isArray(globalP.linkedTo) ? globalP.linkedTo.includes(parentP.id) || globalP.linkedTo.includes(String(parentP.id)) : parentP.id === globalP.linkedTo || String(parentP.id) === String(globalP.linkedTo)) : [];

                            return (
                                <div key={p.id} onClick={() => openProfile(p)} style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                    <img loading="lazy" src={p.avatar} alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {parents.length > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', background: '#f1f5f9', padding: '2px 8px 2px 2px', borderRadius: '12px', width: 'fit-content' }}>
                                                <div style={{ display: 'flex' }}>
                                                    {parents.slice(0, 3).map((par, idx) => (
                                                        <img key={par.id} src={par.avatar} title={par.name} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid white', marginLeft: idx > 0 ? '-6px' : '0', position: 'relative', zIndex: parents.length - idx, objectFit: 'cover', background: '#e2e8f0' }} />
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                                    {parents.map(par => par.name.split(' ')[0]).join(' & ')}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            {p.flights?.find(f => f.ticketNo)?.ticketNo && (
                                                <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                                    🎫 Bilet No: {p.flights.find(f => f.ticketNo).ticketNo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {isLinked ? (
                                            <span style={{ background: '#fdf4ff', color: '#c026d3', border: '1px solid #fae8ff', fontSize: '11px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🎈 Çocuk
                                            </span>
                                        ) : (
                                            <>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    const globalP = users.find(u => u.id === p.id || u.email === p.email) || p;
                                                    if (globalP.phone) {
                                                        window.location.href = `tel:${globalP.phone}`;
                                                    } else {
                                                        alert("Kullanıcıya ait telefon numarası kayıtlı değil.");
                                                    }
                                                }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <Phone size={18} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/chat/direct_${tour.id}_${p.id}`); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <MessageCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Full Screen Profile Page Overlay */}
            {showSht && selectedUser && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#f8fafc', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s' }}>

                    {/* Header */}
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div onClick={() => setShowSht(false)} style={{ cursor: 'pointer', padding: '4px' }}>
                                <ChevronLeft size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px' }}>Müşteri Profili</h2>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>{selectedUser.name}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '32px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                            <img loading="lazy" src={selectedUser.avatar} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px', color: 'var(--text-main)' }}>{selectedUser.name}</h2>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'white', padding: '6px 16px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {selectedUser.company ? <Building size={16} /> : <UserIcon size={16} />} {selectedUser.company || 'Bireysel Müşteri'}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                <Activity size={28} color="#3b82f6" style={{ marginBottom: '12px' }} />
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{calcUserStats(selectedUser.email || selectedUser.name).activeCount}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Aktif Tur</div>
                            </div>
                            <div style={{ background: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                <History size={28} color="#10b981" style={{ marginBottom: '12px' }} />
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{calcUserStats(selectedUser.email || selectedUser.name).pastCount}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Geçmiş Tur</div>
                            </div>
                        </div>

                        {selectedUser.role === 'customer' && (
                            <>
                                <div style={{ background: 'white', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                                            Kimlik & Pasaport Bilgileri
                                        </h3>
                                        {selectedUser.identityLastEditedBy && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                                                <History size={12} />
                                                <span>Son Düzenleme: <b>{selectedUser.identityLastEditedBy}</b> • {selectedUser.identityLastEditedAt ? new Date(selectedUser.identityLastEditedAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Ülke Pasaportu</label>
                                            <input type="text" placeholder="Örn: Türkiye" value={identityForm.passportCountry} onChange={e => setIdentityForm({ ...identityForm, passportCountry: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#f8fafc' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Pasaport No</label>
                                            <input type="text" placeholder="Örn: U12345678" value={identityForm.passportNo} onChange={e => setIdentityForm({ ...identityForm, passportNo: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#f8fafc' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>P. Geçerlilik T.</label>
                                            <input type="date" value={identityForm.passportExp} onChange={e => setIdentityForm({ ...identityForm, passportExp: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#f8fafc' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Doğum Tarihi</label>
                                            <input type="date" value={identityForm.birthDate} onChange={e => setIdentityForm({ ...identityForm, birthDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', background: '#f8fafc' }} />
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
                                            // Update local selectedUser visually
                                            setSelectedUser({ ...selectedUser, ...payload });
                                            setIsSavingIdentity(false);
                                            alert('Müşterinin kimlik bilgileri başarıyla güncellendi!');
                                        }}
                                        style={{ background: 'var(--primary)', border: 'none', padding: '14px', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.2)', transition: 'opacity 0.2s', alignSelf: 'flex-start', paddingLeft: '24px', paddingRight: '24px' }}
                                        disabled={isSavingIdentity}
                                    >
                                        {isSavingIdentity ? 'Kaydediliyor...' : 'Pasaport Bilgilerini Kaydet'}
                                    </button>
                                </div>

                                <div style={{ background: '#fdfce8', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: '32px', border: '1px solid #fef08a' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #fef08a', paddingBottom: '12px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#a16207' }}>
                                            Sağlık & Acil Durum Bilgileri
                                        </h3>
                                        <div style={{ fontSize: '10px', color: '#a16207', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Lock size={10} /> Sadece Müşteri
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Kan Grubu</label>
                                            <div style={{ position: 'relative' }}>
                                                <select disabled value={identityForm.bloodType} onChange={e => { }} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #fde047', background: '#fef9c3', fontSize: '14px', fontWeight: 'bold', color: '#a16207', appearance: 'none', cursor: 'not-allowed', opacity: 0.9 }}>
                                                    <option value="">(Belirtilmemiş)</option>
                                                    <option value="A+">A RH Pozitif (+)</option><option value="A-">A RH Negatif (-)</option>
                                                    <option value="B+">B RH Pozitif (+)</option><option value="B-">B RH Negatif (-)</option>
                                                    <option value="AB+">AB RH Pozitif (+)</option><option value="AB-">AB RH Negatif (-)</option>
                                                    <option value="0+">0 (Sıfır) RH Pozitif (+)</option><option value="0-">0 (Sıfır) RH Negatif (-)</option>
                                                </select>
                                                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a16207', opacity: 0.4 }}>▼</div>
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Alerjiler</label>
                                            <input disabled type="text" placeholder="(Belirtilmemiş)" value={identityForm.allergies} onChange={e => { }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', background: '#fef9c3', color: '#a16207', fontWeight: '500', cursor: 'not-allowed' }} />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Düzenli Kullanılan İlaçlar</label>
                                            <input disabled type="text" placeholder="(Belirtilmemiş)" value={identityForm.medications} onChange={e => { }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', background: '#fef9c3', color: '#a16207', fontWeight: '500', cursor: 'not-allowed' }} />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Özel Beslenme Planı</label>
                                            <input disabled type="text" placeholder="(Belirtilmemiş)" value={identityForm.dietaryReq} onChange={e => { }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', background: '#fef9c3', color: '#a16207', fontWeight: '500', cursor: 'not-allowed' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Acil Durum Kişisi</label>
                                            <input disabled type="text" placeholder="(Belirtilmemiş)" value={identityForm.emergencyContactName} onChange={e => { }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', background: '#fef9c3', color: '#a16207', fontWeight: '500', cursor: 'not-allowed' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207', marginBottom: '4px', display: 'block' }}>Acil Durum Telefonu</label>
                                            <input disabled type="tel" placeholder="(Belirtilmemiş)" value={identityForm.emergencyContactPhone} onChange={e => { }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', background: '#fef9c3', color: '#a16207', fontWeight: '500', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {!isUserChild(selectedUser) && (
                            <div style={{ background: 'white', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>İletişim Bilgileri</h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <Mail size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>E-posta Adresi</div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)' }}>{selectedUser.email || '-'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <Phone size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cep Telefonu</div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)' }}>{selectedUser.phone || '-'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: selectedUser.pushEnabled ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedUser.pushEnabled ? '#10B981' : '#f59e0b' }}>
                                        {selectedUser.pushEnabled ? <BellRing size={20} /> : <BellOff size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cihaz Bildirimleri (Push)</div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: selectedUser.pushEnabled ? '#10B981' : '#f59e0b' }}>{selectedUser.pushEnabled ? 'Açık (Bildirim Alabilir)' : 'Kapalı veya İzin Verilmemiş'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(() => {
                            const parentIdsRaw = Array.isArray(selectedUser.linkedTo)
                                ? selectedUser.linkedTo
                                : (typeof selectedUser.linkedTo === 'string' ? [selectedUser.linkedTo] : []);

                            const parentIds = parentIdsRaw.filter(id => id && String(id).trim() !== '');
                            const isChild = parentIds.length > 0;

                            if (isChild) {
                                return (
                                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            👨‍👩‍👧 Ebeveynler
                                        </h3>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            Bu kullanıcının bağlı olduğu ana müşteriler (ebeveynleri). Ekleme işlemini ebeveynin kendi profilinden yapabilirsiniz.
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {parentIds.map(parentId => {
                                                const parent = participants.find(p => p.id === parentId);
                                                return (
                                                    <div key={parentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {parent ? (
                                                                <>
                                                                    <img src={parent.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{parent.name}</span>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>⚠️ Silinmiş / Geçersiz Bağlantı</span>
                                                            )}
                                                        </div>
                                                        <button onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const newLinkedTo = parentIds.filter(id => id !== parentId);
                                                            const val = newLinkedTo.length > 0 ? newLinkedTo : null;
                                                            await updateUser(selectedUser.id, { linkedTo: val });
                                                            setSelectedUser({ ...selectedUser, linkedTo: val });
                                                        }} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            👨‍👩‍👧‍👦 Bağlı Çocuklar
                                        </h3>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                            Bu kişiye bağlı olan müşteriler <br />
                                            <span style={{ fontSize: '11px', opacity: 0.8 }}>(Bu kişinin panelinden biletlerini görebileceği kişiler)</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {users.filter(u => u.linkedTo && (Array.isArray(u.linkedTo) ? u.linkedTo.includes(selectedUser.id) || u.linkedTo.includes(String(selectedUser.id)) : u.linkedTo === selectedUser.id || u.linkedTo === String(selectedUser.id))).map(fm => (
                                                <div key={fm.id} onClick={() => openProfile(fm)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '10px 12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                                    <img src={fm.avatar} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{fm.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bağlı Hesap</div>
                                                    </div>
                                                    <span style={{ background: '#fdf4ff', color: '#c026d3', border: '1px solid #fae8ff', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', marginRight: '8px' }}>
                                                        Çocuk
                                                    </span>
                                                    <button onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const childLinkedToIds = Array.isArray(fm.linkedTo) ? fm.linkedTo : (fm.linkedTo ? [fm.linkedTo] : []);
                                                        const newLinkedTo = childLinkedToIds.filter(id => String(id) !== String(selectedUser.id));
                                                        await updateUser(fm.id, { linkedTo: newLinkedTo.length > 0 ? newLinkedTo : null });
                                                    }} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Çocuk Ara (İsim)..." 
                                                    value={profileChildSearchQuery}
                                                    onChange={(e) => {
                                                        setProfileChildSearchQuery(e.target.value);
                                                        setShowProfileChildDropdown(true);
                                                    }}
                                                    onFocus={() => setShowProfileChildDropdown(true)}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', background: 'white', color: 'var(--text-main)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'border-color 0.2s' }}
                                                />
                                                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                                    <Search size={16} />
                                                </div>
                                                
                                                {showProfileChildDropdown && profileChildSearchQuery.trim().length > 0 && (
                                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '4px', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
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
                                                            }} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                                <img src={u.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{u.name}</span>
                                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {users.filter(u => {
                                                            const isAlreadyLinked = u.linkedTo && (Array.isArray(u.linkedTo) ? u.linkedTo.includes(selectedUser.id) || u.linkedTo.includes(String(selectedUser.id)) : u.linkedTo === selectedUser.id || u.linkedTo === String(selectedUser.id));
                                                            return u.id !== selectedUser.id && isUserChild(u) && !isAlreadyLinked && u.name.toLowerCase().includes(profileChildSearchQuery.toLowerCase());
                                                        }).length === 0 && (
                                                            <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Aradığınız isimde çocuk profili bulunamadı.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })()}



                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button onClick={() => setShowTransferSheet(true)} className="btn-primary" style={{ flex: 1, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary)' }}>
                                <PlaneTakeoff size={20} /> Transfer & Uçuş
                            </button>
                            <button onClick={() => setUserToRemove(selectedUser)} style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <Trash2 size={24} />
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

            {/* Bulk Ticket Manager Layer */}
            {showBulkUpload && (
                <BulkTicketManager
                    tourId={tourId}
                    participants={participants}
                    onClose={() => setShowBulkUpload(false)}
                />
            )}

            {/* Bulk Data Entry Manager Layer */}
            {showBulkDataEntry && (
                <BulkDataEntryManager
                    tourId={tourId}
                    participants={participants}
                    onClose={() => setShowBulkDataEntry(false)}
                />
            )}

            {/* Addition Wizard Modal */}
            {showWizard && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', position: 'relative', animation: 'fadeIn 0.2s' }}>
                        <div onClick={resetWizard} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', padding: '4px' }}>
                            <X size={20} color="var(--text-muted)" />
                        </div>

                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 16px' }}>Yeni Katılımcı</h2>

                        {step === 1 && (
                            <div style={{ position: 'relative' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                                    Katılımcıyı eklemek için e-posta adresini girin. Sistemde kayıtlıysa hızlıca aktarılır.
                                </p>

                                {searchError && (
                                    <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.2s' }}>
                                        <X size={14} /> {searchError}
                                    </div>
                                )}

                                <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '24px' }}>
                                    <Search size={20} color="var(--text-muted)" />
                                    <input
                                        type="text"
                                        name={`search_mz_${Math.random()}`}
                                        autoComplete="new-password"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        data-lpignore="true"
                                        placeholder="musteri@ornek.com veya isim..."
                                        value={emailQuery}
                                        onFocus={() => setShowAutocomplete(true)}
                                        onChange={e => {
                                            setEmailQuery(e.target.value);
                                            setSearchError('');
                                            setShowAutocomplete(true);
                                        }}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
                                    />
                                </div>

                                {showAutocomplete && filteredUsers.length > 0 && (
                                    <div style={{ position: 'absolute', top: '140px', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                                        {filteredUsers.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => {
                                                    setEmailQuery(u.email);
                                                    setShowAutocomplete(false);
                                                }}
                                                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                            >
                                                <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{u.email}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({u.name})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className="btn-primary" onClick={() => { setShowAutocomplete(false); handleEmailSearch(); }} style={{ width: '100%', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <CheckCircle2 size={18} /> Sorgula
                                </button>
                            </div>
                        )}

                        {step === 1.5 && (
                            <div style={{ animation: 'slideRight 0.3s ease' }}>
                                <div style={{ background: '#fef9c3', color: '#854d0e', padding: '16px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
                                    <b style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Kullanıcı tespit edilemedi! ⚠️</b>
                                    <b>{emailQuery}</b> adresi sistemde yok. Bu kişi ilk kez mi bir seyahate katılıyor? E-posta adresini doğru yazdığınıza emin misiniz?
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer' }}>Hayır, Düzelt</button>
                                    <button onClick={() => {
                                        if (!emailQuery.includes('@')) {
                                            setNewName(emailQuery);
                                            setEmailQuery('');
                                        }
                                        setStep(2);
                                    }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Evet, Doğru</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ animation: 'slideUp 0.3s ease' }}>
                                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
                                    Yeni profil oluşturuluyor. Lütfen bilgileri doldurun.
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                    <button
                                        onClick={() => setNewCustomerType('parent')}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid ' + (newCustomerType === 'parent' ? 'var(--primary)' : 'var(--border-color)'), background: newCustomerType === 'parent' ? '#fdf2f8' : 'white', color: newCustomerType === 'parent' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <UserIcon size={16} /> Ana Müşteri
                                    </button>
                                    <button
                                        onClick={() => setNewCustomerType('child')}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid ' + (newCustomerType === 'child' ? 'var(--primary)' : 'var(--border-color)'), background: newCustomerType === 'child' ? '#fdf2f8' : 'white', color: newCustomerType === 'child' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <Users size={16} /> Çocuk Kullanıcı
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    {newCustomerType === 'parent' && (
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>E-Posta (Kullanıcı Adı)</label>
                                            <input
                                                type="email"
                                                value={emailQuery}
                                                onChange={e => setEmailQuery(e.target.value)}
                                                placeholder="Örn: musteri@ornek.com"
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>İsim Soyisim</label>
                                        <input type="text" placeholder="Örn: Ahmet Yılmaz" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                                    </div>

                                    {newCustomerType === 'parent' && (
                                        <>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Telefon Numarası</label>
                                                <input type="tel" placeholder="Örn: 0555 123 4567" value={newPhone} onChange={e => setNewPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', margin: '0 0 4px', display: 'block' }}>Şirket / Firma (Zorunlu)</label>
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
                                                            padding: '12px 36px 12px 12px',
                                                            borderRadius: showCompanyAutocomplete && filteredCompanies.length > 0 ? '8px 8px 0 0' : '8px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'white',
                                                            outline: 'none',
                                                            transition: 'border-radius 0.2s ease'
                                                        }}
                                                    />
                                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: `translateY(-50%) ${showCompanyAutocomplete ? 'rotate(180deg)' : 'rotate(0)'}`, pointerEvents: 'none', color: 'var(--text-muted)', transition: 'transform 0.2s ease' }}>
                                                        <ChevronDown size={18} />
                                                    </div>
                                                </div>

                                                {showCompanyAutocomplete && filteredCompanies.length > 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        background: 'white',
                                                        border: '1px solid var(--border-color)',
                                                        borderTop: 'none',
                                                        borderRadius: '0 0 8px 8px',
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
                                                                style={{ padding: '12px 16px', cursor: 'pointer', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{c}</span>
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
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Ebeveyn Seçin (Birden fazla seçilebilir)</label>

                                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                                    <Search size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="İsim veya soyisim yazarak ebeveyn arayın..."
                                                    value={parentSearchQuery}
                                                    onChange={e => {
                                                        setParentSearchQuery(e.target.value);
                                                        setShowParentSearchDropdown(true);
                                                    }}
                                                    onFocus={() => setShowParentSearchDropdown(true)}
                                                    style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }}
                                                />
                                            </div>

                                            {showParentSearchDropdown && parentSearchQuery && (
                                                <div style={{ position: 'absolute', top: '64px', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                                                    {participants.filter(p => p.role === 'customer' && !newParentIds.includes(p.id) && !isUserChild(p) && p.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).slice(0, 5).map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                setNewParentIds([...newParentIds, p.id]);
                                                                setParentSearchQuery('');
                                                                setShowParentSearchDropdown(false);
                                                            }}
                                                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 'bold' }}>{p.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {participants.filter(p => p.role === 'customer' && !newParentIds.includes(p.id) && !isUserChild(p) && p.name.toLowerCase().includes(parentSearchQuery.toLowerCase())).length === 0 && (
                                                        <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Uygun ana kullanıcı bulunamadı veya eklendi.</div>
                                                    )}
                                                </div>
                                            )}

                                            {newParentIds.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                                    {newParentIds.map(parentId => {
                                                        const p = participants.find(u => u.id === parentId);
                                                        if (!p) return null;
                                                        return (
                                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                                        {p.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>{p.name}</span>
                                                                </div>
                                                                <div onClick={() => setNewParentIds(newParentIds.filter(id => id !== p.id))} style={{ cursor: 'pointer', background: 'white', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Trash2 size={14} />
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
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Bağlı Çocuklar (Varsa)</label>

                                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                                    <Search size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="İsim yazarak çocuk arayın ve ekleyin..."
                                                    value={childSearchQuery}
                                                    onChange={e => {
                                                        setChildSearchQuery(e.target.value);
                                                        setShowChildSearchDropdown(true);
                                                    }}
                                                    onFocus={() => setShowChildSearchDropdown(true)}
                                                    style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }}
                                                />
                                            </div>

                                            {showChildSearchDropdown && childSearchQuery && (
                                                <div style={{ position: 'absolute', top: '64px', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                                                    {participants.filter(p => p.role === 'customer' && !newChildrenIds.includes(p.id) && isUserChild(p) && p.name.toLowerCase().includes(childSearchQuery.toLowerCase())).slice(0, 5).map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                setNewChildrenIds([...newChildrenIds, p.id]);
                                                                setChildSearchQuery('');
                                                                setShowChildSearchDropdown(false);
                                                            }}
                                                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 'bold' }}>{p.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {participants.filter(p => p.role === 'customer' && !newChildrenIds.includes(p.id) && isUserChild(p) && p.name.toLowerCase().includes(childSearchQuery.toLowerCase())).length === 0 && (
                                                        <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Uygun çocuk hesabı bulunamadı veya eklendi.</div>
                                                    )}
                                                </div>
                                            )}

                                            {newChildrenIds.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                                    {newChildrenIds.map(childId => {
                                                        const c = participants.find(u => u.id === childId);
                                                        if (!c) return null;
                                                        return (
                                                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                                        {c.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>{c.name}</span>
                                                                </div>
                                                                <div onClick={() => setNewChildrenIds(newChildrenIds.filter(id => id !== c.id))} style={{ cursor: 'pointer', background: 'white', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Trash2 size={14} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>

                                <button className="btn-primary" onClick={handleCreateUser} style={{ width: '100%', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    Kaydet ve Tura Ekle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Popup */}
            {successPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '340px', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 12px' }}>{successPopup.title}</h2>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', textAlign: 'left', background: '#f8fafc', padding: '12px', borderRadius: '12px', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
                            {successPopup.message}
                        </div>
                        <button
                            onClick={() => setSuccessPopup(null)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold' }}>
                            Tamam, Kapat
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
