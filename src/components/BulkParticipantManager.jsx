import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, UserCheck, ShieldCheck, Users } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore, formatTitleCase } from '../store/userStore';
import { isUserChild, canUserReceiveEmail, isChildEmail, normalizePhoneNumber, checkEmailDomainTypo, normalizeTurkish } from '../utils/userUtils';
import { getApiBaseUrl } from '../utils/apiConfig';

/**
 * Excel Date Serial / String Parser
 * Converts Excel serial numbers (e.g. 45123) or date strings (DD.MM.YYYY, DD/MM/YYYY) into ISO YYYY-MM-DD
 */
const parseExcelDate = (val) => {
    if (!val && val !== 0) return '';
    // Number (Excel serial date number, e.g. 31234 .. 50000)
    if (!isNaN(val) && Number(val) > 10000 && Number(val) < 80000) {
        const dateObj = new Date((Number(val) - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(dateObj.getTime())) {
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    }
    const str = String(val).trim();
    if (!str) return '';
    
    // DD.MM.YYYY or DD/MM/YYYY
    const dmy = str.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
    if (dmy) {
        const dd = dmy[1].padStart(2, '0');
        const mm = dmy[2].padStart(2, '0');
        const yyyy = dmy[3];
        return `${yyyy}-${mm}-${dd}`;
    }
    
    // YYYY-MM-DD
    const ymd = str.match(/^(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})$/);
    if (ymd) {
        const yyyy = ymd[1];
        const mm = ymd[2].padStart(2, '0');
        const dd = ymd[3].padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    
    return str;
};

const cleanHeader = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9öçşığü]/g, '');

const findVal = (row, patterns) => {
    const keys = Object.keys(row || {});
    // 1. Exact normalized match
    for (const p of patterns) {
        const cleanP = cleanHeader(p);
        const exactKey = keys.find(k => cleanHeader(k) === cleanP);
        if (exactKey !== undefined && row[exactKey] !== undefined && row[exactKey] !== null) {
            const v = String(row[exactKey]).trim();
            if (v && v !== 'undefined' && v !== 'null') return v;
        }
    }
    // 2. Substring match
    for (const p of patterns) {
        const cleanP = cleanHeader(p);
        const matchKey = keys.find(k => cleanHeader(k).includes(cleanP));
        if (matchKey !== undefined && row[matchKey] !== undefined && row[matchKey] !== null) {
            const v = String(row[matchKey]).trim();
            if (v && v !== 'undefined' && v !== 'null') return v;
        }
    }
    return '';
};

export default function BulkParticipantManager({ tourId, onClose }) {
    const { tours, addParticipantToTour } = useTourStore();
    const { smtpConfig, corporateName } = useSettingsStore();
    const { users, addUser, addCompany, companies, updateUser } = useUserStore();
    const fileInputRef = useRef(null);
    const tour = tours.find(t => t.id === tourId);

    const [fileData, setFileData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusReport, setStatusReport] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    if (!tour) return null;

    const handleDownloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const templateData = [
            {
                'Ad Soyad': 'Ahmet Yılmaz',
                'E-posta': 'ahmet@ornek.com',
                'Telefon': '+90 532 999 88 77',
                'TC Kimlik No': '12345678901',
                'Katılımcı Tipi': 'Yetişkin',
                'Firma': 'Move Travel & Mice',
                'Unvan': 'Genel Müdür',
                'Pasaport No': 'U12345678',
                'Pasaport Bitiş': '2028-10-15',
                'Doğum Tarihi': '1985-04-12',
                'Cinsiyet': 'Erkek',
                'Ebeveyn TC No': ''
            },
            {
                'Ad Soyad': 'Ayşe Kaya',
                'E-posta': 'ayse@ornek.com',
                'Telefon': '+90 533 111 22 33',
                'TC Kimlik No': '98765432109',
                'Katılımcı Tipi': 'Yetişkin',
                'Firma': 'Move Travel & Mice',
                'Unvan': 'Satış Direktörü',
                'Pasaport No': 'U87654321',
                'Pasaport Bitiş': '2029-05-20',
                'Doğum Tarihi': '1990-08-25',
                'Cinsiyet': 'Kadın',
                'Ebeveyn TC No': ''
            },
            {
                'Ad Soyad': 'Can Yılmaz',
                'E-posta': '',
                'Telefon': '',
                'TC Kimlik No': '11223344556',
                'Katılımcı Tipi': 'Çocuk',
                'Firma': 'Move Travel & Mice',
                'Unvan': '',
                'Pasaport No': '',
                'Pasaport Bitiş': '',
                'Doğum Tarihi': '2016-06-10',
                'Cinsiyet': 'Erkek',
                'Ebeveyn TC No': '12345678901'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "KatilimciSablon");
        ws['!cols'] = [
            { wch: 22 }, // Ad Soyad
            { wch: 24 }, // E-posta
            { wch: 18 }, // Telefon
            { wch: 16 }, // TC Kimlik No
            { wch: 16 }, // Katılımcı Tipi
            { wch: 22 }, // Firma
            { wch: 18 }, // Unvan
            { wch: 16 }, // Pasaport No
            { wch: 16 }, // Pasaport Bitiş
            { wch: 15 }, // Doğum Tarihi
            { wch: 12 }, // Cinsiyet
            { wch: 16 }  // Ebeveyn TC No
        ];
        XLSX.writeFile(wb, "Katilimci_Yukleme_Sablonu.xlsx");
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setErrorMsg('');
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const XLSX = await import('xlsx');
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setErrorMsg("Excel dosyası boş veya okunamadı.");
                    return;
                }

                setFileData(data);
            } catch (err) {
                console.error(err);
                setErrorMsg("Excel dosyası ayrıştırılırken hata oluştu. Lütfen şablonu kullanın.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const sendTourAssignmentEmail = async (participantName, participantEmail, password = null, participantPhone = '') => {
        const targetUser = users.find(u => u.email === participantEmail || u.name === participantName);
        if (isUserChild(targetUser, users) || isChildEmail(participantEmail)) {
            console.log(`Çocuk kullanıcı (${participantName}) için e-posta gönderimi atlandı.`);
            return;
        }

        let phone = participantPhone;
        if (!phone) {
            phone = targetUser?.phone || '';
        }
        const isInternalPlaceholder = participantEmail && (participantEmail.endsWith('@move.local') || participantEmail.endsWith('.local'));

        if (phone && phone !== '-' && phone.trim().length > 6) {
            if (password) {
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newUserTemplate',
                    [participantName]
                );
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newTourTemplate',
                    [participantName, tour.name]
                );
            } else {
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newTourTemplate',
                    [participantName, tour.name]
                );
            }
        }

        if (smtpConfig?.host && smtpConfig?.user && canUserReceiveEmail(participantEmail, users) && !isInternalPlaceholder) {
            try {
                const baseUrl = getApiBaseUrl();
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

    const generateSecurePassword = (fullName) => {
        const nameStr = fullName.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
        let base = nameStr.length > 0 ? nameStr : 'User';
        let prefix = base.slice(0, 3).toLocaleLowerCase('tr-TR');
        if (prefix.length < 3) prefix = prefix.padEnd(3, 'a');
        prefix = prefix.charAt(0).toLocaleUpperCase('tr-TR') + prefix.slice(1);
        
        const numPart = Math.floor(1000 + Math.random() * 9000).toString();
        const chars = ['!', '?'];
        const specialChar = chars[Math.floor(Math.random() * chars.length)];
        
        return prefix + numPart + specialChar;
    };

    const handleImport = async () => {
        if (!fileData || fileData.length === 0) return;
        setIsProcessing(true);

        let newUsersCreated = 0;
        let existingUsersAdded = 0;
        let alreadyInTourCount = 0;
        let errorRowsCount = 0;
        let adultsCount = 0;
        let childrenCount = 0;

        for (const row of fileData) {
            // 1. Name Resolution (Supports combined "Ad Soyad" OR separate "Ad" and "Soyad")
            const combinedName = findVal(row, ['adsoyad', 'advesoyad', 'isimsoyisim', 'fullname', 'full name', 'musteri', 'katilimci', 'yolcu']);
            const firstName = findVal(row, ['ad', 'isim', 'firstname', 'first name', 'adi']);
            const lastName = findVal(row, ['soyad', 'soyisim', 'lastname', 'last name', 'soyadi']);

            let rawName = '';
            if (combinedName) {
                rawName = combinedName;
            } else if (firstName || lastName) {
                rawName = `${firstName} ${lastName}`.trim();
            }
            const name = formatTitleCase(rawName);

            // 2. Contact & Identity
            const email = (findVal(row, ['mail', 'eposta', 'email']) || '').trim().toLowerCase();
            const phone = (findVal(row, ['tel', 'phone', 'gsm', 'telefon', 'cep']) || '').trim();
            const tcNoRaw = findVal(row, ['tc', 'kimlik', 'tcno', 'vatandaslikno', 'tckimlikno']);
            const tcNo = tcNoRaw.replace(/\D/g, '');
            const company = (findVal(row, ['firma', 'sirket', 'company', 'kurum', 'bayi']) || '').trim();

            // 3. Passenger Type / Child Classification
            const typeRaw = findVal(row, ['katilimcitipi', 'tip', 'rol', 'kullanicitipi', 'yasgrubu', 'type', 'paxtype', 'passengertype']).toLowerCase();
            const isChildExplicit = typeRaw.includes('çocuk') || typeRaw.includes('cocuk') || typeRaw.includes('child') || typeRaw.includes('bebek') || typeRaw.includes('infant') || isChildEmail(email);

            if (isChildExplicit) {
                childrenCount++;
            } else {
                adultsCount++;
            }

            // 4. Extended MICE details (Passport, Birth Date, Gender, Title)
            const passportNo = (findVal(row, ['pasaportno', 'pasaport', 'passportno', 'passport', 'belgeno']) || '').trim().toUpperCase();
            const passportExp = parseExcelDate(findVal(row, ['pasaportbitis', 'pasaportgecerlilik', 'passportexpiry', 'passportexp', 'pgecerlilik']));
            const birthDate = parseExcelDate(findVal(row, ['dogumtarihi', 'dtarihi', 'birthdate', 'birth date', 'dogum']));
            
            const genderRaw = findVal(row, ['cinsiyet', 'gender', 'sex']).toLowerCase();
            let gender = '';
            if (genderRaw.startsWith('e') || genderRaw.startsWith('m')) gender = 'Erkek';
            else if (genderRaw.startsWith('k') || genderRaw.startsWith('f') || genderRaw.startsWith('w')) gender = 'Kadın';

            const title = formatTitleCase(findVal(row, ['unvan', 'pozisyon', 'gorev', 'title', 'departman', 'gorevi']));
            const parentTcRaw = findVal(row, ['ebeveyntc', 'velitc', 'ebeveynkimlik', 'parenttc']);
            const parentTc = parentTcRaw.replace(/\D/g, '');

            // Row validation: Must have a name AND at least one identifier
            if (!name || (!email && !phone && !tcNo && !passportNo)) {
                errorRowsCount++;
                continue;
            }

            const currentUsersList = useUserStore.getState().users || [];
            let existingUser = null;

            // Typo check for email domain (e.g. hotml.com -> hotmail.com)
            let correctedEmail = email ? email.toLowerCase() : '';
            const emailTypo = checkEmailDomainTypo(correctedEmail);
            if (emailTypo) {
                correctedEmail = emailTypo.suggestedEmail;
            }

            // --- Matching existing user safely ---
            // 1. Match by TC Kimlik (11 digits)
            if (!existingUser && tcNo && tcNo.length === 11) {
                existingUser = currentUsersList.find(u => {
                    const uTc = String(u.tcNo || u.tc || '').replace(/\D/g, '');
                    return uTc === tcNo;
                });
            }

            // 2. Match by Passport No
            if (!existingUser && passportNo && passportNo.length >= 6) {
                existingUser = currentUsersList.find(u => {
                    const uPass = String(u.passportNo || '').trim().toUpperCase();
                    return uPass === passportNo;
                });
            }

            // 3. Match by Real Email (ignoring @move.local placeholders)
            if (!existingUser && (email || correctedEmail)) {
                const isPlaceholder = (em) => !em || em.endsWith('@move.local') || em.endsWith('.local');
                existingUser = currentUsersList.find(u => {
                    const uEmail = (u.email || '').trim().toLowerCase();
                    if (isPlaceholder(uEmail)) return false;
                    return (email && uEmail === email.toLowerCase()) || (correctedEmail && uEmail === correctedEmail.toLowerCase());
                });
            }

            // 4. Match by Phone ONLY IF surname also matches (preventing shared company PBX collision)
            if (!existingUser && phone) {
                const cleanP = phone.replace(/\D/g, '');
                if (cleanP.length >= 7) {
                    const candidate = currentUsersList.find(u => {
                        const uPhone = (u.phone || '').replace(/\D/g, '');
                        return uPhone.length >= 7 && (uPhone.endsWith(cleanP.slice(-10)) || cleanP.endsWith(uPhone.slice(-10)));
                    });
                    if (candidate) {
                        const uNorm = normalizeTurkish(candidate.name);
                        const rowNorm = normalizeTurkish(name);
                        const uParts = uNorm.split(/\s+/).filter(Boolean);
                        const rowParts = rowNorm.split(/\s+/).filter(Boolean);
                        const uSurname = uParts[uParts.length - 1];
                        const rowSurname = rowParts[rowParts.length - 1];
                        if (uSurname && rowSurname && uSurname === rowSurname) {
                            existingUser = candidate;
                        }
                    }
                }
            }

            // Resolve Parent ID if this row is a child and has parentTc
            let resolvedParentIds = null;
            if (isChildExplicit && parentTc && parentTc.length === 11) {
                const parentUser = currentUsersList.find(u => String(u.tcNo || '').replace(/\D/g, '') === parentTc);
                if (parentUser) {
                    resolvedParentIds = [parentUser.id];
                }
            }

            if (existingUser) {
                // Enrich existing user profile with missing passport/identity data
                const userUpdates = {};
                if (passportNo && !existingUser.passportNo) userUpdates.passportNo = passportNo;
                if (passportExp && !existingUser.passportExp) userUpdates.passportExp = passportExp;
                if (birthDate && !existingUser.birthDate) userUpdates.birthDate = birthDate;
                if (gender && !existingUser.gender) userUpdates.gender = gender;
                if (title && !existingUser.title) userUpdates.title = title;
                if (tcNo && !existingUser.tcNo) userUpdates.tcNo = tcNo;
                if (resolvedParentIds && (!existingUser.linkedTo || existingUser.linkedTo.length === 0)) {
                    userUpdates.linkedTo = resolvedParentIds;
                    userUpdates.isChildProfile = true;
                }

                if (Object.keys(userUpdates).length > 0) {
                    await updateUser(existingUser.id, userUpdates);
                }

                const isAlreadyInTour = tour.participants?.some(p => 
                    p.id === existingUser.id || 
                    (p.email && p.email.trim().toLowerCase() === existingUser.email?.trim().toLowerCase()) || 
                    (correctedEmail && p.email && p.email.trim().toLowerCase() === correctedEmail.toLowerCase()) ||
                    (tcNo && p.tcNo && p.tcNo === tcNo)
                );

                if (isAlreadyInTour) {
                    alreadyInTourCount++;
                } else {
                    const participantPayload = {
                        ...existingUser,
                        ...userUpdates,
                        isChildProfile: isChildExplicit || existingUser.isChildProfile || false,
                        userType: isChildExplicit ? 'child' : (existingUser.userType || 'corporate')
                    };
                    addParticipantToTour(tourId, participantPayload);
                    if (!isChildExplicit && !isUserChild(existingUser, users) && !isChildEmail(existingUser.email)) {
                        await sendTourAssignmentEmail(existingUser.name, existingUser.email, null, existingUser.phone || phone);
                    }
                    existingUsersAdded++;
                }
            } else {
                // Create brand new user
                const compValue = company || 'Move Travel & Mice';
                if (compValue && !companies.includes(compValue)) {
                    addCompany(compValue);
                }

                const cleanP = (phone || '').replace(/\D/g, '');
                const phoneSlug = cleanP.startsWith('90') ? cleanP.slice(2) : cleanP;
                
                let finalEmail = '';
                if (isChildExplicit) {
                    finalEmail = email || `child_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@move.local`;
                } else {
                    finalEmail = correctedEmail || (email ? email.toLowerCase() : `user_${phoneSlug || Date.now()}@move.local`);
                }

                const newUserPassword = generateSecurePassword(name);

                const newUser = await addUser({
                    name,
                    email: finalEmail,
                    role: 'customer',
                    userType: isChildExplicit ? 'child' : 'corporate',
                    phone: phone ? normalizePhoneNumber(phone) : '-',
                    company: compValue,
                    password: newUserPassword,
                    tcNo: tcNo || '',
                    passportNo: passportNo || '',
                    passportExp: passportExp || '',
                    birthDate: birthDate || '',
                    gender: gender || '',
                    title: title || '',
                    isChildProfile: isChildExplicit,
                    linkedTo: resolvedParentIds
                });

                const participantPayload = {
                    ...newUser,
                    isChildProfile: isChildExplicit,
                    userType: isChildExplicit ? 'child' : 'corporate'
                };

                addParticipantToTour(tourId, participantPayload);
                if (!isChildExplicit && !isChildEmail(finalEmail)) {
                    await sendTourAssignmentEmail(newUser.name, newUser.email, newUserPassword, newUser.phone || phone);
                }
                newUsersCreated++;
            }
        }

        setIsProcessing(false);
        setStatusReport({
            total: fileData.length,
            adultsCount,
            childrenCount,
            newUsersCreated,
            existingUsersAdded,
            alreadyInTourCount,
            errorRowsCount
        });
        setFileData(null);
        setFileName('');
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                <div onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}>
                    <X size={20} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: 'var(--primary)' }}>
                    <FileSpreadsheet size={28} />
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Excel ile Toplu Katılımcı Ekle</h2>
                </div>

                {!statusReport && (
                    <>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                            Katılımcıları TC Kimlik, E-posta ve Pasaport eşleşmesiyle aktarın. Yetişkin ve Çocuk profilleri otomatik sınıflandırılır.
                        </p>

                        <div 
                            onClick={handleDownloadTemplate} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                padding: '12px 14px', 
                                background: '#f8fafc', 
                                border: '1.5px solid #e2e8f0', 
                                borderRadius: '12px', 
                                cursor: 'pointer', 
                                marginBottom: '18px', 
                                transition: 'all 0.2s' 
                            }} 
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} 
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <Download size={22} className="text-primary" style={{ flexShrink: 0 }} />
                            <div style={{ textAlign: 'left', minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>Gelişmiş Excel Şablonunu İndir</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Ad, Soyad, TC, Katılımcı Tipi, Pasaport No, Doğum Tarihi, E-posta
                                </div>
                            </div>
                        </div>

                        <div 
                            onClick={() => fileInputRef.current.click()} 
                            style={{ 
                                border: '2px dashed var(--border-color)', 
                                borderRadius: '16px', 
                                padding: '28px 20px', 
                                textAlign: 'center', 
                                cursor: 'pointer', 
                                transition: 'all 0.2s', 
                                background: '#fafafa', 
                                marginBottom: '20px' 
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept=".xlsx, .xls" 
                                onChange={handleFileChange} 
                            />
                            <Upload size={34} className="text-muted" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                            {fileName ? (
                                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--primary)' }}>{fileName}</div>
                            ) : (
                                <>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>Dosya Seçin veya Sürükleyin</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Desteklenen formatlar: .xlsx, .xls</div>
                                </>
                            )}
                        </div>

                        {errorMsg && (
                            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={14} /> {errorMsg}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>İptal</button>
                            <button 
                                onClick={handleImport}
                                disabled={!fileData || isProcessing}
                                style={{ flex: 1.2, padding: '13px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!fileData || isProcessing) ? 0.6 : 1 }}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s infinite linear', marginRight: '6px' }} /> İşleniyor...
                                    </>
                                ) : (
                                    <>Yüklemeyi Başlat ({fileData?.length || 0})</>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {statusReport && (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '4px solid #d1fae5' }}>
                            <CheckCircle2 size={30} />
                        </div>
                        
                        <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '6px' }}>Yükleme Başarıyla Tamamlandı</h3>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                            Excel dosyasındaki katılımcı verileri sınıflandırılarak işlendi.
                        </p>

                        <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '20px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Toplam Okunan Katılımcı:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{statusReport.total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>👤 Yetişkin Katılımcı:</span>
                                <span style={{ fontWeight: 'bold', color: '#0369a1' }}>{statusReport.adultsCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                <span style={{ color: '#a21caf', display: 'flex', alignItems: 'center', gap: '5px' }}>🎈 Çocuk Katılımcı:</span>
                                <span style={{ fontWeight: 'bold', color: '#a21caf' }}>{statusReport.childrenCount}</span>
                            </div>
                            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '3px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>✨ Yeni Oluşturulan Profil:</span>
                                <span style={{ fontWeight: 'bold', color: '#059669' }}>{statusReport.newUsersCreated}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>👥 Tura Eklenen Mevcut Üye:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{statusReport.existingUsersAdded}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                <span style={{ color: '#4b5563' }}>🛡️ Zaten Turda Kayıtlı Olan:</span>
                                <span style={{ fontWeight: 'bold', color: '#4b5563' }}>{statusReport.alreadyInTourCount}</span>
                            </div>
                            {statusReport.errorRowsCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', borderTop: '1px solid #fee2e2', paddingTop: '6px', color: '#dc2626' }}>
                                    <span>⚠️ Atlanan / Hatalı Satır:</span>
                                    <span style={{ fontWeight: 'bold' }}>{statusReport.errorRowsCount}</span>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={onClose} 
                            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Tamam
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
