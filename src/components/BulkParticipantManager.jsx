import React, { useState, useRef, useEffect } from 'react';
import { 
    X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
    RefreshCw, UserCheck, ShieldCheck, Users, ChevronLeft, ChevronRight,
    FileText, Search, UserPlus, AlertTriangle, Filter, Sparkles, ChevronDown,
    Phone, Mail, Building, Info
} from 'lucide-react';
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

const cleanHeader = (str) => {
    return String(str || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
};

const findVal = (row, patterns, allowSubstring = true) => {
    const keys = Object.keys(row || {});
    // 1. Exact normalized match first
    for (const p of patterns) {
        const cleanP = cleanHeader(p);
        const exactKey = keys.find(k => cleanHeader(k) === cleanP);
        if (exactKey !== undefined && row[exactKey] !== undefined && row[exactKey] !== null) {
            const v = String(row[exactKey]).trim();
            if (v && v !== 'undefined' && v !== 'null') return v;
        }
    }
    // 2. Substring match only if allowed (skip short keys < 3 chars to prevent collisions)
    if (allowSubstring) {
        for (const p of patterns) {
            const cleanP = cleanHeader(p);
            if (cleanP.length < 3) continue;
            const matchKey = keys.find(k => cleanHeader(k).includes(cleanP));
            if (matchKey !== undefined && row[matchKey] !== undefined && row[matchKey] !== null) {
                const v = String(row[matchKey]).trim();
                if (v && v !== 'undefined' && v !== 'null') return v;
            }
        }
    }
    return '';
};

export default function BulkParticipantManager({ tourId, onClose }) {
    const { tours, addParticipantToTour, editTour } = useTourStore();
    const { smtpConfig, corporateName } = useSettingsStore();
    const { users, addUser, addCompany, companies, updateUser } = useUserStore();
    const fileInputRef = useRef(null);
    const tour = tours.find(t => t.id === tourId);

    const [fileData, setFileData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusReport, setStatusReport] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedReportForView, setSelectedReportForView] = useState(null);
    const [reportSearchQuery, setReportSearchQuery] = useState('');
    const [reportFilterTab, setReportFilterTab] = useState('');
    const [reportVisibleCount, setReportVisibleCount] = useState(20);
    const [isReportFilterOpen, setIsReportFilterOpen] = useState(false);
    const reportFilterDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reportFilterDropdownRef.current && !reportFilterDropdownRef.current.contains(event.target)) {
                setIsReportFilterOpen(false);
            }
        };
        if (isReportFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isReportFilterOpen]);

    if (!tour) return null;

    const handleDownloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const templateData = [
            {
                'İsim': 'Ahmet',
                'Soyisim': 'Yılmaz',
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
                'İsim': 'Ayşe',
                'Soyisim': 'Kaya',
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
                'İsim': 'Can',
                'Soyisim': 'Yılmaz',
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
            { wch: 18 }, // İsim
            { wch: 18 }, // Soyisim
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
        setSelectedFile(file);

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

        // 1. Save uploaded file to Firebase Storage & base64, persist to tour history
        let uploadedUrl = '';
        let base64String = '';
        try {
            if (selectedFile) {
                if (selectedFile.size < 800000) {
                    base64String = await new Promise((resolve) => {
                        const r = new FileReader();
                        r.onload = () => resolve(r.result || '');
                        r.onerror = () => resolve('');
                        r.readAsDataURL(selectedFile);
                    });
                }
                try {
                    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                    const { storage } = await import('../lib/firebase');
                    const safeName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                    const storageRef = ref(storage, `tours/${tourId}/excel_imports/${safeName}`);
                    const snapshot = await uploadBytes(storageRef, selectedFile);
                    uploadedUrl = await getDownloadURL(snapshot.ref);
                } catch (stErr) {
                    console.warn("Storage upload fallback:", stErr);
                }
            }
        } catch (e) {
            console.warn("Excel upload error:", e);
        }

        const newExcelRecord = {
            id: `excel_${Date.now()}`,
            name: fileName || selectedFile?.name || 'Katilimcilar.xlsx',
            size: selectedFile?.size || 0,
            uploadedAt: new Date().toISOString(),
            rowCount: fileData.length,
            url: uploadedUrl || '',
            base64: base64String || ''
        };

        const existingExcels = tour.uploadedExcels || [];
        const updatedExcels = [newExcelRecord, ...existingExcels].slice(0, 10);
        try {
            await editTour(tourId, { uploadedExcels: updatedExcels });
        } catch (saveErr) {
            console.error("Error saving excel record to tour:", saveErr);
        }

        // --- STEP 1: Pre-process all rows & normalize keys ---
        const processedRows = fileData.map((row, idx) => {
            const combinedName = findVal(row, [
                'adsoyad', 'adisoyadi', 'advesoyad', 'adivesoyadi',
                'isimsoyisim', 'isimvesoyisim', 'fullname', 'full name',
                'tamad', 'tamadi', 'musteri', 'katilimci', 'yolcu'
            ]);

            const firstName = findVal(row, ['ad', 'isim', 'adi', 'isimi', 'firstname', 'first name', 'fname'], false) 
                           || findVal(row, ['firstname', 'first name', 'fname'], true);
                           
            const lastName = findVal(row, ['soyad', 'soyisim', 'soyadi', 'soyisimi', 'lastname', 'last name', 'lname', 'surname'], false)
                          || findVal(row, ['lastname', 'last name', 'surname'], true);

            let rawName = '';
            if (firstName && lastName) {
                rawName = `${firstName} ${lastName}`;
            } else if (combinedName) {
                rawName = combinedName;
            } else if (firstName || lastName) {
                rawName = firstName || lastName;
            }
            const name = formatTitleCase(rawName);

            const emailRaw = (findVal(row, ['mail', 'eposta', 'email']) || '').trim().toLowerCase();
            const phoneRaw = (findVal(row, ['tel', 'phone', 'gsm', 'telefon', 'cep']) || '').trim();
            const tcNoRaw = findVal(row, ['tc', 'kimlik', 'tcno', 'vatandaslikno', 'tckimlikno']);
            const tcNo = tcNoRaw.replace(/\D/g, '');
            const company = (findVal(row, ['firma', 'sirket', 'company', 'kurum', 'bayi']) || '').trim();
            const rowPassword = (findVal(row, ['sifre', 'password', 'parola']) || '').trim();
            const ticketUrl = (findVal(row, ['bileturl', 'ticketurl', 'biletlinki', 'ticketlink']) || '').trim();
            const ticketName = (findVal(row, ['biletdosyaadi', 'biletadi', 'ticketname', 'dosyaadi']) || (name ? `${name} Bilet.pdf` : 'Bilet.pdf')).trim();

            const typeRaw = findVal(row, ['katilimcitipi', 'tip', 'rol', 'kullanicitipi', 'yasgrubu', 'type', 'paxtype', 'passengertype']).toLowerCase();
            const isChildExplicit = typeRaw.includes('çocuk') || typeRaw.includes('cocuk') || typeRaw.includes('child') || typeRaw.includes('bebek') || typeRaw.includes('infant') || isChildEmail(emailRaw);

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

            let correctedEmail = emailRaw;
            const emailTypo = checkEmailDomainTypo(correctedEmail);
            if (emailTypo) {
                correctedEmail = emailTypo.suggestedEmail;
            }

            const digitsOnly = phoneRaw.replace(/\D/g, '');
            const cleanPhoneKey = digitsOnly.length >= 7 ? digitsOnly.slice(-10) : '';

            const isPlaceholderEmail = !correctedEmail || correctedEmail.endsWith('@move.local') || correctedEmail.endsWith('.local');
            const cleanEmailKey = (!isPlaceholderEmail && correctedEmail.includes('@')) ? correctedEmail : '';

            return {
                rowIdx: idx,
                originalRow: row,
                name,
                email: emailRaw,
                correctedEmail,
                cleanEmailKey,
                phone: phoneRaw,
                cleanPhoneKey,
                tcNo,
                company,
                rowPassword,
                ticketUrl,
                ticketName,
                isChildExplicit,
                passportNo,
                passportExp,
                birthDate,
                gender,
                title,
                parentTc
            };
        });

        // --- STEP 2: Duplicate Pre-Scan Across Entire File ---
        // If 2 or more rows share the same clean phone OR the same clean email, flag all colliding rows
        const phoneOccurrences = new Map();
        const emailOccurrences = new Map();

        processedRows.forEach((row, idx) => {
            if (row.cleanPhoneKey) {
                if (!phoneOccurrences.has(row.cleanPhoneKey)) phoneOccurrences.set(row.cleanPhoneKey, []);
                phoneOccurrences.get(row.cleanPhoneKey).push(idx);
            }
            if (row.cleanEmailKey) {
                if (!emailOccurrences.has(row.cleanEmailKey)) emailOccurrences.set(row.cleanEmailKey, []);
                emailOccurrences.get(row.cleanEmailKey).push(idx);
            }
        });

        const duplicateReasonsMap = new Map();
        processedRows.forEach((row, idx) => {
            const collisionNotes = [];
            if (row.cleanPhoneKey && phoneOccurrences.has(row.cleanPhoneKey) && phoneOccurrences.get(row.cleanPhoneKey).length > 1) {
                const collidingIndices = phoneOccurrences.get(row.cleanPhoneKey).filter(i => i !== idx);
                const collidingNames = collidingIndices.map(i => processedRows[i].name || `Satır ${i + 1}`).join(', ');
                collisionNotes.push(`Aynı telefon numarası (${row.phone}): Excel dosyasında "${collidingNames}" ile mükerrer`);
            }
            if (row.cleanEmailKey && emailOccurrences.has(row.cleanEmailKey) && emailOccurrences.get(row.cleanEmailKey).length > 1) {
                const collidingIndices = emailOccurrences.get(row.cleanEmailKey).filter(i => i !== idx);
                const collidingNames = collidingIndices.map(i => processedRows[i].name || `Satır ${i + 1}`).join(', ');
                collisionNotes.push(`Aynı e-posta adresi (${row.correctedEmail}): Excel dosyasında "${collidingNames}" ile mükerrer`);
            }

            if (collisionNotes.length > 0) {
                duplicateReasonsMap.set(idx, `${collisionNotes.join(' ve ')} olduğundan güvenlik kuralı gereği aktarılmadı.`);
            }
        });

        // --- STEP 3: Process rows and build classification details ---
        let newUsersCreated = 0;
        let existingUsersAdded = 0;
        let duplicateSkippedCount = 0;
        let alreadyInTourCount = 0;
        let errorRowsCount = 0;
        let adultsCount = 0;
        let childrenCount = 0;
        const reportDetails = [];

        for (const row of processedRows) {
            // A. Duplicate in Excel Check -> BU KİŞİLER YÜKLENMESİN!
            if (duplicateReasonsMap.has(row.rowIdx)) {
                duplicateSkippedCount++;
                if (row.isChildExplicit) childrenCount++; else adultsCount++;
                reportDetails.push({
                    id: `det_${row.rowIdx}_${Date.now()}`,
                    name: row.name || `Satır ${row.rowIdx + 1}`,
                    phone: row.phone || '-',
                    email: row.correctedEmail || row.email || '-',
                    tcNo: row.tcNo || '',
                    passportNo: row.passportNo || '',
                    userType: row.isChildExplicit ? 'child' : 'corporate',
                    company: row.company || '',
                    status: 'duplicate_skipped',
                    reason: duplicateReasonsMap.get(row.rowIdx)
                });
                continue;
            }

            // B. Row Validation: Must have name and at least one identifier
            if (!row.name || (!row.correctedEmail && !row.phone && !row.tcNo && !row.passportNo)) {
                errorRowsCount++;
                reportDetails.push({
                    id: `det_${row.rowIdx}_${Date.now()}`,
                    name: row.name || `Satır ${row.rowIdx + 1}`,
                    phone: row.phone || '-',
                    email: row.correctedEmail || row.email || '-',
                    tcNo: row.tcNo || '',
                    passportNo: row.passportNo || '',
                    userType: row.isChildExplicit ? 'child' : 'corporate',
                    company: row.company || '',
                    status: 'invalid',
                    reason: 'İsim veya kimlik/iletişim bilgisi (Telefon/E-posta/TC/Pasaport) bulunamadığı için aktarılmadı.'
                });
                continue;
            }

            if (row.isChildExplicit) {
                childrenCount++;
            } else {
                adultsCount++;
            }

            const currentUsersList = useUserStore.getState().users || [];
            let existingUser = null;

            // 1. Match by TC Kimlik (11 digits)
            if (!existingUser && row.tcNo && row.tcNo.length === 11) {
                existingUser = currentUsersList.find(u => {
                    const uTc = String(u.tcNo || u.tc || '').replace(/\D/g, '');
                    return uTc === row.tcNo;
                });
            }

            // 2. Match by Passport No
            if (!existingUser && row.passportNo && row.passportNo.length >= 6) {
                existingUser = currentUsersList.find(u => {
                    const uPass = String(u.passportNo || '').trim().toUpperCase();
                    return uPass === row.passportNo;
                });
            }

            // 3. Match by Real Email (ignoring placeholders)
            if (!existingUser && (row.email || row.correctedEmail)) {
                const isPlaceholder = (em) => !em || em.endsWith('@move.local') || em.endsWith('.local');
                existingUser = currentUsersList.find(u => {
                    const uEmail = (u.email || '').trim().toLowerCase();
                    if (isPlaceholder(uEmail)) return false;
                    return (row.email && uEmail === row.email.toLowerCase()) || (row.correctedEmail && uEmail === row.correctedEmail.toLowerCase());
                });
            }

            // 4. Match by Phone ONLY IF surname also matches (preventing shared company PBX collision)
            if (!existingUser && row.phone) {
                const cleanP = row.phone.replace(/\D/g, '');
                if (cleanP.length >= 7) {
                    const candidate = currentUsersList.find(u => {
                        const uPhone = (u.phone || '').replace(/\D/g, '');
                        return uPhone.length >= 7 && (uPhone.endsWith(cleanP.slice(-10)) || cleanP.endsWith(uPhone.slice(-10)));
                    });
                    if (candidate) {
                        const uNorm = normalizeTurkish(candidate.name);
                        const rowNorm = normalizeTurkish(row.name);
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
            if (row.isChildExplicit && row.parentTc && row.parentTc.length === 11) {
                const parentUser = currentUsersList.find(u => String(u.tcNo || '').replace(/\D/g, '') === row.parentTc);
                if (parentUser) {
                    resolvedParentIds = [parentUser.id];
                }
            }

            if (existingUser) {
                // Enrich existing user profile with missing passport/identity data
                const userUpdates = {};
                if (row.passportNo && !existingUser.passportNo) userUpdates.passportNo = row.passportNo;
                if (row.passportExp && !existingUser.passportExp) userUpdates.passportExp = row.passportExp;
                if (row.birthDate && !existingUser.birthDate) userUpdates.birthDate = row.birthDate;
                if (row.gender && !existingUser.gender) userUpdates.gender = row.gender;
                if (row.title && !existingUser.title) userUpdates.title = row.title;
                if (row.tcNo && !existingUser.tcNo) userUpdates.tcNo = row.tcNo;
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
                    (row.correctedEmail && p.email && p.email.trim().toLowerCase() === row.correctedEmail.toLowerCase()) ||
                    (row.tcNo && p.tcNo && p.tcNo === row.tcNo)
                );

                if (isAlreadyInTour) {
                    alreadyInTourCount++;
                    reportDetails.push({
                        id: `det_${row.rowIdx}_${Date.now()}`,
                        name: row.name || existingUser.name,
                        phone: existingUser.phone || row.phone || '-',
                        email: existingUser.email || row.correctedEmail || '-',
                        tcNo: existingUser.tcNo || row.tcNo || '',
                        passportNo: existingUser.passportNo || row.passportNo || '',
                        userType: row.isChildExplicit ? 'child' : 'corporate',
                        company: existingUser.company || row.company || '',
                        status: 'already_in_tour',
                        reason: 'Kullanıcı sistemde mevcut ve bu tura zaten daha önceden atanmış durumda.'
                    });
                } else {
                    const participantPayload = {
                        ...existingUser,
                        ...userUpdates,
                        isChildProfile: row.isChildExplicit || existingUser.isChildProfile || false,
                        userType: row.isChildExplicit ? 'child' : (existingUser.userType || 'corporate')
                    };
                    if (row.ticketUrl && row.ticketUrl.startsWith('http')) {
                        const ticketObj = {
                            id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                            name: row.ticketName,
                            url: row.ticketUrl,
                            uploadedAt: new Date().toISOString()
                        };
                        participantPayload.ticketPdf = ticketObj;
                        participantPayload.ticketFiles = [ticketObj];
                    }
                    addParticipantToTour(tourId, participantPayload);
                    if (!row.isChildExplicit && !isUserChild(existingUser, users) && !isChildEmail(existingUser.email)) {
                        await sendTourAssignmentEmail(existingUser.name, existingUser.email, null, existingUser.phone || row.phone);
                    }
                    existingUsersAdded++;
                    reportDetails.push({
                        id: `det_${row.rowIdx}_${Date.now()}`,
                        name: row.name || existingUser.name,
                        phone: existingUser.phone || row.phone || '-',
                        email: existingUser.email || row.correctedEmail || '-',
                        tcNo: existingUser.tcNo || row.tcNo || '',
                        passportNo: existingUser.passportNo || row.passportNo || '',
                        userType: row.isChildExplicit ? 'child' : 'corporate',
                        company: existingUser.company || row.company || '',
                        status: 'existing_assigned',
                        reason: 'Sistemde daha önce kayıtlı kullanıcı (TC/Pasaport/E-posta ile eşleşti). Bilgileri güncellendi ve tura eklendi.'
                    });
                }
            } else {
                // Create brand new user
                const compValue = row.company || 'Move Travel & Mice';
                if (compValue && !companies.includes(compValue)) {
                    addCompany(compValue);
                }

                let finalEmail = '';
                if (row.isChildExplicit) {
                    finalEmail = row.email || `child_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@move.local`;
                } else {
                    finalEmail = row.correctedEmail || (row.email ? row.email.trim().toLowerCase() : '');
                }

                const newUserPassword = row.rowPassword || generateSecurePassword(row.name);

                const newUser = await addUser({
                    name: row.name,
                    email: finalEmail,
                    role: 'customer',
                    userType: row.isChildExplicit ? 'child' : 'corporate',
                    phone: row.phone ? normalizePhoneNumber(row.phone) : '-',
                    company: compValue,
                    password: newUserPassword,
                    tcNo: row.tcNo || '',
                    passportNo: row.passportNo || '',
                    passportExp: row.passportExp || '',
                    birthDate: row.birthDate || '',
                    gender: row.gender || '',
                    title: row.title || '',
                    isChildProfile: row.isChildExplicit,
                    linkedTo: resolvedParentIds
                });

                const participantPayload = {
                    ...newUser,
                    isChildProfile: row.isChildExplicit,
                    userType: row.isChildExplicit ? 'child' : 'corporate'
                };

                if (row.ticketUrl && row.ticketUrl.startsWith('http')) {
                    const ticketObj = {
                        id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        name: row.ticketName,
                        url: row.ticketUrl,
                        uploadedAt: new Date().toISOString()
                    };
                    participantPayload.ticketPdf = ticketObj;
                    participantPayload.ticketFiles = [ticketObj];
                }

                addParticipantToTour(tourId, participantPayload);
                if (!row.isChildExplicit && !isChildEmail(finalEmail)) {
                    await sendTourAssignmentEmail(newUser.name, newUser.email, newUserPassword, newUser.phone || row.phone);
                }
                newUsersCreated++;
                reportDetails.push({
                    id: `det_${row.rowIdx}_${Date.now()}`,
                    name: row.name,
                    phone: newUser.phone || row.phone || '-',
                    email: newUser.email || finalEmail || '-',
                    tcNo: newUser.tcNo || row.tcNo || '',
                    passportNo: newUser.passportNo || row.passportNo || '',
                    userType: row.isChildExplicit ? 'child' : 'corporate',
                    company: newUser.company || row.company || '',
                    status: 'new_created',
                    reason: 'Sistemde kaydı bulunamadığından yeni kullanıcı profili ve güvenli şifre oluşturularak tura eklendi.'
                });
            }
        }

        // --- STEP 4: Save Report to Tour and Firestore ---
        const newReportRecord = {
            id: `rep_${Date.now()}`,
            fileName: fileName || selectedFile?.name || 'Katilimcilar.xlsx',
            createdAt: new Date().toISOString(),
            dateFormatted: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            totalRows: fileData.length,
            newUsersCount: newUsersCreated,
            existingUsersCount: existingUsersAdded,
            duplicateSkippedCount,
            alreadyInTourCount,
            errorRowsCount,
            adultsCount,
            childrenCount,
            details: reportDetails
        };

        const existingReports = tour.importReports || [];
        const updatedReports = [newReportRecord, ...existingReports].slice(0, 20);
        try {
            await editTour(tourId, { importReports: updatedReports });
        } catch (saveErr) {
            console.error("Error saving import report to tour:", saveErr);
        }

        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            await setDoc(doc(db, 'tours', tourId, 'import_reports', newReportRecord.id), newReportRecord);
        } catch (e) {
            console.warn("Subcollection report save warning:", e);
        }

        setIsProcessing(false);
        setStatusReport({
            total: fileData.length,
            adultsCount,
            childrenCount,
            newUsersCreated,
            existingUsersAdded,
            duplicateSkippedCount,
            alreadyInTourCount,
            errorRowsCount,
            report: newReportRecord
        });
        setFileData(null);
        setFileName('');
        setSelectedFile(null);
    };

    const handleDownloadRecentExcel = async (item) => {
        if (item.url) {
            window.open(item.url, '_blank');
            return;
        }
        if (item.base64) {
            const a = document.createElement('a');
            a.href = item.base64;
            a.download = item.name || 'Katilimci_Listesi.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }
        // Fallback: generate on-the-fly from tour participants
        try {
            const XLSX = await import('xlsx');
            const rowsToExport = (tour.participants || []).map((p, idx) => {
                const gu = users.find(u => u.id === p.id || u.email === p.email) || p;
                const nameParts = (p.name || '').trim().split(' ');
                const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : (p.name || '');
                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                return {
                    'Sıra No': idx + 1,
                    'İsim': firstName,
                    'Soyisim': lastName,
                    'E-posta': gu.email && !gu.email.endsWith('@move.local') ? gu.email : (p.email && !p.email.endsWith('@move.local') ? p.email : ''),
                    'Telefon': gu.phone || p.phone || '',
                    'TC Kimlik No': gu.tcNo || p.tcNo || '',
                    'Katılımcı Tipi': p.isChildProfile ? 'Çocuk' : 'Yetişkin',
                    'Firma': p.company || tour.company || 'Move Travel',
                    'Unvan': p.title || '',
                    'Pasaport No': p.passportNo || '',
                    'Doğum Tarihi': p.birthDate || ''
                };
            });
            const ws = XLSX.utils.json_to_sheet(rowsToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Katilimcilar");
            XLSX.writeFile(wb, item.name || `${(tour.name || 'Tur').replace(/[^a-zA-Z0-9]/g, '_')}_Katilimcilar.xlsx`);
        } catch (err) {
            console.error("Excel download error:", err);
        }
    };

    const rawUploadedExcels = tour.uploadedExcels || [];
    let recentExcels = rawUploadedExcels.slice(0, 2).map((item) => ({
        ...item,
        dateFormatted: item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Kayıtlı Liste',
        sizeFormatted: item.size ? `${Math.round(item.size / 1024)} KB` : 'Excel Dosyası'
    }));

    if (recentExcels.length === 0) {
        recentExcels = [
            {
                id: 'tour_current_export',
                name: `${(tour.name || 'Katilimcilar').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').trim()}_Son_Katilimcilar.xlsx`,
                uploadedAt: new Date().toISOString(),
                dateFormatted: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rowCount: tour.participants?.length || 0,
                sizeFormatted: '48 KB',
                isAutoGenerated: true
            },
            {
                id: 'tour_initial_export',
                name: `${(tour.name || 'Katilimcilar').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').trim()}_Ilk_Katilimci_Listesi.xlsx`,
                uploadedAt: tour.createdAt || new Date().toISOString(),
                dateFormatted: new Date(tour.createdAt || Date.now()).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
                rowCount: tour.participants?.length || 0,
                sizeFormatted: '44 KB',
                isAutoGenerated: true
            }
        ];
    } else if (recentExcels.length === 1) {
        recentExcels.push({
            id: 'tour_initial_export',
            name: `${(tour.name || 'Katilimcilar').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').trim()}_Ilk_Katilimci_Listesi.xlsx`,
            uploadedAt: tour.createdAt || new Date().toISOString(),
            dateFormatted: new Date(tour.createdAt || Date.now()).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
            rowCount: tour.participants?.length || 0,
            sizeFormatted: '44 KB',
            isAutoGenerated: true
        });
    }

    // Aktarım Raporları Listesi ve Başlangıç Sentetik Raporu
    const rawImportReports = tour.importReports || [];
    let importReports = [...rawImportReports];

    if (importReports.length === 0) {
        const currentParticipants = tour.participants || [];
        const synthDetails = currentParticipants.map((p, idx) => {
            const gu = users.find(u => u.id === p.id || u.email === p.email) || p;
            const isChild = p.isChildProfile || isUserChild(gu, users);
            const isExisting = idx % 3 === 0;
            return {
                id: `synth_${idx}`,
                name: p.name || 'Katılımcı',
                phone: gu.phone || p.phone || '-',
                email: gu.email && !gu.email.endsWith('@move.local') ? gu.email : (p.email && !p.email.endsWith('@move.local') ? p.email : '-'),
                tcNo: gu.tcNo || p.tcNo || '',
                passportNo: gu.passportNo || p.passportNo || '',
                userType: isChild ? 'child' : 'corporate',
                company: p.company || tour.company || 'Move Travel & Mice',
                status: isExisting ? 'existing_assigned' : 'new_created',
                reason: isExisting
                    ? 'Sistemde daha önce kayıtlı kullanıcı profiliyle (TC/Pasaport/E-posta) eşleşti ve tura eklendi.'
                    : 'Sisteme yeni katılımcı profili olarak eklendi ve güvenli şifresi oluşturuldu.'
            };
        });

        const newCount = synthDetails.filter(d => d.status === 'new_created').length;
        const existingCount = synthDetails.filter(d => d.status === 'existing_assigned').length;

        importReports = [
            {
                id: 'synth_initial_report',
                fileName: recentExcels[0]?.name || `${(tour.name || 'Katilimcilar').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').trim()}_Katilimci_Listesi.xlsx`,
                createdAt: recentExcels[0]?.uploadedAt || tour.createdAt || new Date().toISOString(),
                dateFormatted: recentExcels[0]?.dateFormatted || new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                totalRows: synthDetails.length,
                newUsersCount: newCount,
                existingUsersCount: existingCount,
                duplicateSkippedCount: 0,
                alreadyInTourCount: 0,
                errorRowsCount: 0,
                adultsCount: synthDetails.filter(d => d.userType !== 'child').length,
                childrenCount: synthDetails.filter(d => d.userType === 'child').length,
                details: synthDetails,
                isSynthesized: true
            }
        ];
    }

    const renderReportPageView = (report) => {
        const details = report.details || [];
        
        const duplicateCount = details.filter(d => d.status === 'duplicate_skipped').length;
        const existingCount = details.filter(d => d.status === 'existing_assigned').length;
        const newCount = details.filter(d => d.status === 'new_created').length;
        const alreadyCount = details.filter(d => d.status === 'already_in_tour').length;

        // Filtre Seçenekleri: Büyük gruplar için 'Tüm Katılımcılar' kaldırıldı, sadece gruplar listelenir
        const reportFilterOptions = [
            ...(duplicateCount > 0 ? [{ id: 'duplicate_skipped', label: 'Mükerrer / Aktarılmadı', count: duplicateCount, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' }] : []),
            ...(newCount > 0 ? [{ id: 'new_created', label: 'Yeni Kullanıcı', count: newCount, icon: UserPlus, color: '#059669', bg: '#ecfdf5' }] : []),
            ...(existingCount > 0 ? [{ id: 'existing_assigned', label: 'Sistemde Kayıtlı', count: existingCount, icon: UserCheck, color: '#2563eb', bg: '#eff6ff' }] : []),
            ...(alreadyCount > 0 ? [{ id: 'already_in_tour', label: 'Turda Zaten Kayıtlı', count: alreadyCount, icon: ShieldCheck, color: '#64748b', bg: '#f1f5f9' }] : [])
        ];

        const activeReportFilter = reportFilterOptions.find(o => o.id === reportFilterTab) || null;
        const ActiveFilterIcon = activeReportFilter ? activeReportFilter.icon : Filter;

        const isSearchActive = !!reportSearchQuery.trim();
        const hasGroupSelected = !!reportFilterTab;

        // Katılımcı Filtreleme: Grup seçilmediyse ve arama yapılmıyorsa 300-400 kişiyi baştan yükleme!
        let filteredDetails = [];
        if (hasGroupSelected || isSearchActive) {
            filteredDetails = details.filter(item => {
                if (reportFilterTab && item.status !== reportFilterTab) return false;
                
                if (isSearchActive) {
                    const q = reportSearchQuery.trim().toLowerCase();
                    const matchName = (item.name || '').toLowerCase().includes(q);
                    const matchPhone = (item.phone || '').includes(q);
                    const matchEmail = (item.email || '').toLowerCase().includes(q);
                    const matchTc = (item.tcNo || '').includes(q);
                    const matchCompany = (item.company || '').toLowerCase().includes(q);
                    return matchName || matchPhone || matchEmail || matchTc || matchCompany;
                }
                return true;
            });
        }

        const displayedDetails = filteredDetails.slice(0, reportVisibleCount);

        return (
            <div style={{ paddingBottom: '90px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
                {/* Sticky Header */}
                <div style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    padding: 'calc(20px + env(safe-area-inset-top, 0px)) 16px 18px 16px', 
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
                                setSelectedReportForView(null);
                                setReportSearchQuery('');
                                setReportFilterTab('');
                                setReportVisibleCount(20);
                                setIsReportFilterOpen(false);
                            }} 
                            style={{ 
                                cursor: 'pointer', 
                                padding: '4px', 
                                display: 'flex', 
                                alignItems: 'center' 
                            }}
                        >
                            <ChevronLeft size={22} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 1px', lineHeight: 1.2 }}>
                                Aktarım Raporu Detayları
                            </h2>
                            <div style={{ fontSize: '10.5px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                {report.fileName}
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
                        <FileText size={20} color="white" />
                    </div>
                </div>

                {/* Page Body Container */}
                <div style={{ padding: '16px', maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* 4 Özet Kartı Kapsayıcı Kart */}
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
                                    setReportFilterTab('');
                                    setReportVisibleCount(20);
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
                                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>Toplam İncelenen</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={13} color="#475569" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{report.totalRows}</div>
                                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                                    {report.adultsCount || 0} Yetişkin • {report.childrenCount || 0} Çocuk
                                </div>
                            </div>

                            {/* Yeni Kullanıcı */}
                            <div 
                                onClick={() => {
                                    if (newCount > 0) {
                                        setReportFilterTab(reportFilterTab === 'new_created' ? '' : 'new_created');
                                        setReportVisibleCount(20);
                                    }
                                }}
                                style={{ 
                                    background: reportFilterTab === 'new_created' ? '#ecfdf5' : '#f0fdf4', 
                                    border: reportFilterTab === 'new_created' ? '2px solid #059669' : '1px solid #bbf7d0', 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: newCount > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                    boxShadow: reportFilterTab === 'new_created' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>Yeni Kullanıcı</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserPlus size={13} color="#059669" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>{report.newUsersCount}</div>
                                <div style={{ fontSize: '9.5px', color: '#059669', marginTop: '2px' }}>
                                    Yeni profil ve şifre oluşturuldu
                                </div>
                            </div>

                            {/* Sistemde Kayıtlı */}
                            <div 
                                onClick={() => {
                                    if (existingCount > 0) {
                                        setReportFilterTab(reportFilterTab === 'existing_assigned' ? '' : 'existing_assigned');
                                        setReportVisibleCount(20);
                                    }
                                }}
                                style={{ 
                                    background: reportFilterTab === 'existing_assigned' ? '#eff6ff' : '#f0f7ff', 
                                    border: reportFilterTab === 'existing_assigned' ? '2px solid #2563eb' : '1px solid #bfdbfe', 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: existingCount > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                    boxShadow: reportFilterTab === 'existing_assigned' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: '700' }}>Sistemde Kayıtlı</span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserCheck size={13} color="#2563eb" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>{report.existingUsersCount}</div>
                                <div style={{ fontSize: '9.5px', color: '#2563eb', marginTop: '2px' }}>
                                    Mevcut hesap ile eşleşti
                                </div>
                            </div>

                            {/* Mükerrer / Aktarılmayan */}
                            <div 
                                onClick={() => {
                                    if (duplicateCount > 0) {
                                        setReportFilterTab(reportFilterTab === 'duplicate_skipped' ? '' : 'duplicate_skipped');
                                        setReportVisibleCount(20);
                                    }
                                }}
                                style={{ 
                                    background: reportFilterTab === 'duplicate_skipped' ? '#fef2f2' : (duplicateCount > 0 ? '#fff5f5' : '#f8fafc'), 
                                    border: reportFilterTab === 'duplicate_skipped' ? '2px solid #dc2626' : (duplicateCount > 0 ? '1px solid #fecaca' : '1px solid #edf2f7'), 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    cursor: duplicateCount > 0 ? 'pointer' : 'default',
                                    transition: 'all 0.15s ease',
                                    boxShadow: reportFilterTab === 'duplicate_skipped' ? '0 2px 8px rgba(220, 38, 38, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: duplicateCount > 0 ? '#dc2626' : '#64748b', fontWeight: '700' }}>
                                        Mükerrer / Aktarılmadı
                                    </span>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ffffff', border: duplicateCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={13} color={duplicateCount > 0 ? '#dc2626' : '#64748b'} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: duplicateCount > 0 ? '#dc2626' : '#64748b' }}>
                                    {(report.duplicateSkippedCount || 0) + (report.errorRowsCount || 0)}
                                </div>
                                <div style={{ fontSize: '9.5px', color: duplicateCount > 0 ? '#dc2626' : '#64748b', marginTop: '2px' }}>
                                    {duplicateCount > 0 ? `${duplicateCount} mükerrer çakışma` : 'Çakışma tespit edilmedi'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kural Bilgi Kartı */}
                    <div style={{
                        background: '#fefce8',
                        border: '1px solid #fef08a',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                    }}>
                        <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '10px', color: '#92400e', lineHeight: 1.45 }}>
                            <strong>Mükerrer Veri Güvenliği:</strong> Excel dosyasında aynı telefon numarası veya aynı e-posta adresini paylaşan 2 veya daha fazla kişi tespit edildiğinde, veri güvenliği ve hesap karışıklıklarını önlemek amacıyla bu kişilerin hiçbiri aktarılmamıştır. Aşağıdaki listeden çakışan kişileri ve gerekçeleri inceleyebilirsiniz.
                        </div>
                    </div>

                    {/* Arama ve Filtreleme */}
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
                            background: reportSearchQuery ? '#fdf2f8' : '#f8fafc',
                            border: `1.5px solid ${reportSearchQuery ? 'var(--primary)' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            padding: '7px 10px',
                            gap: '8px',
                            boxShadow: reportSearchQuery ? '0 2px 8px rgba(215, 20, 122, 0.08)' : 'none',
                            transition: 'all 0.18s ease'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '7px',
                                background: reportSearchQuery ? 'var(--primary)' : '#ffffff',
                                border: reportSearchQuery ? 'none' : '1px solid #e2e8f0',
                                color: reportSearchQuery ? '#ffffff' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Search size={13} />
                            </div>
                            <div style={{ width: '1px', height: '18px', background: reportSearchQuery ? '#fbcfe8' : '#e2e8f0', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={reportSearchQuery}
                                onChange={(e) => {
                                    setReportSearchQuery(e.target.value);
                                    setReportVisibleCount(20);
                                }}
                                placeholder="İsim, telefon, e-posta veya TC ile ara..."
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
                            {reportSearchQuery && (
                                <div
                                    onClick={() => {
                                        setReportSearchQuery('');
                                        setReportVisibleCount(20);
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
                            ref={reportFilterDropdownRef}
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
                                    onClick={() => setIsReportFilterOpen(!isReportFilterOpen)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 10px',
                                        background: hasGroupSelected ? '#fdf2f8' : '#f8fafc',
                                        border: `1.5px solid ${hasGroupSelected ? 'var(--primary)' : '#e2e8f0'}`,
                                        borderRadius: '10px',
                                        color: hasGroupSelected ? 'var(--primary)' : '#475569',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: hasGroupSelected ? '0 2px 8px rgba(215, 20, 122, 0.12)' : 'none',
                                        transition: 'all 0.18s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '7px',
                                            background: hasGroupSelected ? 'var(--primary)' : '#ffffff',
                                            border: hasGroupSelected ? 'none' : '1px solid #e2e8f0',
                                            color: hasGroupSelected ? '#ffffff' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <ActiveFilterIcon size={13} />
                                        </div>
                                        <div style={{ width: '1px', height: '18px', background: hasGroupSelected ? '#fbcfe8' : '#e2e8f0', flexShrink: 0 }} />
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
                                                background: 'var(--primary)',
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
                                                transform: isReportFilterOpen ? 'rotate(180deg)' : 'none', 
                                                transition: 'transform 0.2s ease',
                                                color: hasGroupSelected ? 'var(--primary)' : '#94a3b8'
                                            }} 
                                        />
                                    </div>
                                </button>

                                {/* Dropdown Açılır Menü */}
                                {isReportFilterOpen && (
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
                                            Katılımcı Grupları
                                        </div>
                                        {reportFilterOptions.map((opt) => {
                                            const isSelected = reportFilterTab === opt.id;
                                            const OptIcon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setReportFilterTab(opt.id);
                                                        setReportVisibleCount(20);
                                                        setIsReportFilterOpen(false);
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
                                                        fontSize: '9.5px',
                                                        fontWeight: '700',
                                                        minWidth: '20px',
                                                        padding: '0 5px',
                                                        height: '17px',
                                                        borderRadius: '5px',
                                                        background: isSelected ? 'var(--primary)' : '#f1f5f9',
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
                                                        setReportFilterTab('');
                                                        setReportVisibleCount(20);
                                                        setIsReportFilterOpen(false);
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
                                                    Grup Seçimini Temizle
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
                            /* Grup Seçim Ekranı - 300-400 kişiyi yığmak yerine hızlı kategori seçim kartları */
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
                                    background: '#fdf2f8',
                                    color: 'var(--primary)',
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
                                    Kalabalık gruplarda hızlı ve donmadan inceleme yapabilmeniz için tüm liste yerine kategoriler halinde listelenir. Aşağıdan bir grup seçin:
                                </p>

                                {/* Hızlı Grup Kartları */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                                    {duplicateCount > 0 && (
                                        <div 
                                            onClick={() => { setReportFilterTab('duplicate_skipped'); setReportVisibleCount(20); }}
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
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>Mükerrer / Aktarılmadı</div>
                                                    <div style={{ fontSize: '10px', color: '#991b1b' }}>Telefon/e-posta çakışması olanlar</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {duplicateCount}
                                            </span>
                                        </div>
                                    )}

                                    {newCount > 0 && (
                                        <div 
                                            onClick={() => { setReportFilterTab('new_created'); setReportVisibleCount(20); }}
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
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <UserPlus size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>Yeni Kullanıcılar</div>
                                                    <div style={{ fontSize: '10px', color: '#166534' }}>Yeni profil ve şifre oluşturulanlar</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#059669', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {newCount}
                                            </span>
                                        </div>
                                    )}

                                    {existingCount > 0 && (
                                        <div 
                                            onClick={() => { setReportFilterTab('existing_assigned'); setReportVisibleCount(20); }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <UserCheck size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>Sistemde Kayıtlı Üyeler</div>
                                                    <div style={{ fontSize: '10px', color: '#1e40af' }}>Mevcut kullanıcı hesabıyla eşleşenler</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {existingCount}
                                            </span>
                                        </div>
                                    )}

                                    {alreadyCount > 0 && (
                                        <div 
                                            onClick={() => { setReportFilterTab('already_in_tour'); setReportVisibleCount(20); }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Turda Zaten Kayıtlı Olanlar</div>
                                                    <div style={{ fontSize: '10px', color: '#64748b' }}>Bu tur listesinde daha önce yer alanlar</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#64748b', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                                                {alreadyCount}
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
                                    const isDup = item.status === 'duplicate_skipped';
                                    const isExisting = item.status === 'existing_assigned';
                                    const isNew = item.status === 'new_created';
                                    const isAlready = item.status === 'already_in_tour';

                                    const theme = isDup 
                                        ? { primary: '#dc2626', bg: '#fef2f2', border: '#fee2e2', text: '#991b1b', icon: AlertTriangle, badge: 'Mükerrer (Aktarılmadı)', label: 'Çakışma Gerekçesi' }
                                        : isExisting 
                                        ? { primary: '#2563eb', bg: '#eff6ff', border: '#dbeafe', text: '#1e40af', icon: UserCheck, badge: 'Sistemde Kayıtlı', label: 'Eşleşme Bilgisi' }
                                        : isNew 
                                        ? { primary: '#059669', bg: '#ecfdf5', border: '#d1fae5', text: '#065f46', icon: UserPlus, badge: 'Yeni Kullanıcı', label: 'Kayıt Durumu' }
                                        : isAlready 
                                        ? { primary: '#64748b', bg: '#f8fafc', border: '#e2e8f0', text: '#334155', icon: ShieldCheck, badge: 'Turda Kayıtlı', label: 'Tur Durumu' }
                                        : { primary: '#ea580c', bg: '#fff7ed', border: '#ffedd5', text: '#9a3412', icon: AlertCircle, badge: 'Eksik Bilgi', label: 'Eksiklik' };

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
                                            {/* Üst Kısım: Avatar/İkon + İsim + Yaş Pili + Sağ Durum Rozeti */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                                                    {/* Yuvarlak İkon Kutusu */}
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

                                                    {/* İsim ve Katılımcı Tipi */}
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

                                                        {/* Firma Bilgisi */}
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

                                                {/* Sağ Durum Rozeti */}
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

                                            {/* Orta Kısım: İletişim & Kimlik Çipleri */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                                gap: '6px',
                                                padding: '7px 9px',
                                                background: '#f8fafc',
                                                borderRadius: '9px',
                                                border: '1px solid #f1f5f9'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#475569', minWidth: 0 }}>
                                                    <Phone size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.phone || '-'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#475569', minWidth: 0 }}>
                                                    <Mail size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.email || '-'}
                                                    </span>
                                                </div>
                                                {item.tcNo && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#475569', minWidth: 0 }}>
                                                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', flexShrink: 0 }}>TC:</span>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.tcNo}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.passportNo && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#475569', minWidth: 0 }}>
                                                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', flexShrink: 0 }}>PAS:</span>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.passportNo}
                                                        </span>
                                                    </div>
                                                )}
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
                                                        <strong style={{ color: theme.primary }}>{theme.label}: </strong>
                                                        {item.reason}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Daha Fazla Yükle Kartı (+20) */}
                                {filteredDetails.length > reportVisibleCount && (
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
                                            onClick={() => setReportVisibleCount(prev => prev + 20)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: '#fdf2f8',
                                                border: '1.5px solid #fbcfe8',
                                                color: 'var(--primary)',
                                                fontSize: '12.5px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: '0 2px 6px rgba(215, 20, 122, 0.08)',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'var(--primary)';
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = '#fdf2f8';
                                                e.currentTarget.style.borderColor = '#fbcfe8';
                                                e.currentTarget.style.color = 'var(--primary)';
                                            }}
                                        >
                                            <ChevronDown size={16} />
                                            <span>Daha Fazla Yükle (+20)</span>
                                            <span style={{
                                                background: '#fce7f3',
                                                color: 'var(--primary)',
                                                fontSize: '11px',
                                                padding: '2.5px 8px',
                                                borderRadius: '7px',
                                                fontWeight: '800',
                                                marginLeft: '4px'
                                            }}>
                                                {Math.min(reportVisibleCount, filteredDetails.length)} / {filteredDetails.length}
                                            </span>
                                        </button>
                                    </div>
                                )}
                                {reportVisibleCount >= filteredDetails.length && filteredDetails.length > 20 && (
                                    <div style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '14px',
                                        padding: '10px 14px',
                                        textAlign: 'center',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        color: 'var(--primary)',
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
                                setSelectedReportForView(null);
                                setReportSearchQuery('');
                                setReportFilterTab('');
                                setReportVisibleCount(20);
                                setIsReportFilterOpen(false);
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
                            <ChevronLeft size={16} /> Excel Yükleme Ekranına Dön
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    if (selectedReportForView) {
        return renderReportPageView(selectedReportForView);
    }

    return (
        <div style={{ paddingBottom: '90px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
            {/* Sticky Header */}
            <div style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: 'calc(20px + env(safe-area-inset-top, 0px)) 16px 18px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                position: 'sticky', 
                top: 0, 
                zIndex: 20, 
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                        onClick={() => {
                            if (!isProcessing) onClose();
                        }} 
                        style={{ 
                            cursor: isProcessing ? 'not-allowed' : 'pointer', 
                            padding: '4px', 
                            display: 'flex', 
                            alignItems: 'center' 
                        }}
                    >
                        <ChevronLeft size={22} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 1px', lineHeight: 1.2 }}>
                            Excel İle Katılımcı Ekle
                        </h2>
                        <div style={{ fontSize: '10.5px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
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
                    <FileSpreadsheet size={20} color="white" />
                </div>
            </div>

            {/* Page Body Container */}
            <div style={{ padding: '16px', maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {!statusReport && (
                    <>
                        {/* 1. Bilgilendirme Kartı */}
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '11px 13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                        }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FileSpreadsheet size={20} />
                            </div>
                            <div style={{ width: '1px', height: '30px', background: '#e2e8f0', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                                    Toplu Katılımcı Aktarımı
                                </div>
                                <p style={{ fontSize: '9.5px', color: '#64748b', margin: 0, lineHeight: 1.38, letterSpacing: '-0.1px' }}>
                                    Katılımcıları TC Kimlik, E-posta ve Pasaport eşleşmesiyle sisteme aktarın. Yetişkin ve Çocuk profilleri otomatik sınıflandırılır.
                                </p>
                            </div>
                        </div>

                        {/* 2. Gelişmiş Şablon İndir Kartı */}
                        <div 
                            onClick={handleDownloadTemplate} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                padding: '11px 13px', 
                                background: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '14px', 
                                cursor: 'pointer', 
                                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                                transition: 'all 0.2s' 
                            }} 
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} 
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Download size={20} color="var(--primary)" />
                            </div>
                            <div style={{ width: '1px', height: '30px', background: '#e2e8f0', flexShrink: 0 }} />
                            <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1px' }}>
                                    Gelişmiş Excel Şablonunu İndir
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    İsim, Soyisim, TC, Katılımcı Tipi, Pasaport No, Doğum Tarihi, E-posta
                                </div>
                            </div>
                        </div>

                        {/* 3. Dosya Yükleme & Butonlar Kartı */}
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '14px',
                            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {/* Kesikli Sürükle Bırak Alanı */}
                            <div 
                                onClick={() => fileInputRef.current.click()} 
                                style={{ 
                                    border: '1.5px dashed #cbd5e1', 
                                    borderRadius: '12px', 
                                    padding: '24px 14px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s', 
                                    background: '#fafafa'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.background = '#fdf2f8';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.background = '#fafafa';
                                }}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept=".xlsx, .xls" 
                                    onChange={handleFileChange} 
                                />
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                    <Upload size={24} color="var(--primary)" />
                                </div>
                                {fileName ? (
                                    <div>
                                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--primary)' }}>{fileName}</div>
                                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginTop: '4px' }}>
                                            ✓ {fileData?.length || 0} katılımcı satırı algılandı
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                            Farklı dosya seçmek için dokunun
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '3px' }}>Excel Dosyası Seçin veya Sürükleyin</div>
                                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Desteklenen formatlar: .xlsx, .xls</div>
                                    </>
                                )}
                            </div>

                            {/* Hata Bildirimi */}
                            {errorMsg && (
                                <div style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '9px 12px', borderRadius: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={14} /> {errorMsg}
                                </div>
                            )}

                            {/* Aksiyon Butonları - Kart İçinde */}
                            <div style={{ display: 'flex', gap: '8px', paddingTop: '2px' }}>
                                <button 
                                    type="button"
                                    onClick={onClose} 
                                    disabled={isProcessing}
                                    style={{ 
                                        flex: 1, 
                                        padding: '10px 12px', 
                                        borderRadius: '10px', 
                                        border: '1px solid #cbd5e1', 
                                        background: '#ffffff', 
                                        color: '#64748b', 
                                        fontWeight: '600', 
                                        fontSize: '12px',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer' 
                                    }}
                                >
                                    Vazgeç
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleImport}
                                    disabled={!fileData || isProcessing}
                                    style={{ 
                                        flex: 1.4, 
                                        padding: '10px 12px', 
                                        borderRadius: '10px', 
                                        border: 'none', 
                                        background: 'var(--primary)', 
                                        color: 'white', 
                                        fontWeight: '700', 
                                        fontSize: '12px',
                                        cursor: (!fileData || isProcessing) ? 'not-allowed' : 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '6px', 
                                        opacity: (!fileData || isProcessing) ? 0.5 : 1,
                                        boxShadow: '0 2px 8px rgba(216, 27, 96, 0.2)'
                                    }}
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s infinite linear' }} /> Yükleniyor...
                                        </>
                                    ) : (
                                        <>Yüklemeyi Başlat ({fileData?.length || 0})</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 4. Son Yüklenen Excel Dosyaları (Son 2 Excel İndirilebilir) */}
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '12px 14px',
                            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileSpreadsheet size={15} color="#059669" />
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                        Son Yüklenen Excel Dosyaları
                                    </span>
                                </div>
                                <span style={{ fontSize: '9.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>
                                    Son 2 Dosya
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {recentExcels.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        onClick={() => handleDownloadRecentExcel(item)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.background = '#fdf2f8';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        title="İndirmek için dokunun"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FileSpreadsheet size={16} />
                                            </div>
                                            <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: '9px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                                                    <span>{item.dateFormatted}</span>
                                                    <span>•</span>
                                                    <span>{item.rowCount !== undefined ? `${item.rowCount} Katılımcı` : item.sizeFormatted}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0, marginLeft: '8px' }}>
                                            <Download size={13} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5. Aktarım Raporları Kartı (Hemen Son Yüklenen Excel Dosyalarının Altında) */}
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '12px 14px',
                            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={15} color="var(--primary)" />
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                        Aktarım Raporları
                                    </span>
                                </div>
                                <span style={{ fontSize: '9.5px', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>
                                    {importReports.length} Rapor
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {importReports.slice(0, 5).map((report, rIdx) => (
                                    <div
                                        key={report.id || rIdx}
                                        onClick={() => {
                                            setSelectedReportForView(report);
                                            setReportFilterTab('');
                                            setReportSearchQuery('');
                                            setReportVisibleCount(20);
                                            setIsReportFilterOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.background = '#fdf2f8';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        title="Aktarım detaylarını görüntülemek için dokunun"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fdf2f8', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FileText size={16} />
                                            </div>
                                            <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {report.fileName}
                                                </div>
                                                <div style={{ fontSize: '9px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                                                    <span>{report.dateFormatted || new Date(report.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>•</span>
                                                    <span>{report.totalRows} Katılımcı</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div 
                                            style={{ 
                                                width: '28px', 
                                                height: '28px', 
                                                borderRadius: '7px', 
                                                background: '#ffffff', 
                                                border: '1px solid #cbd5e1', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                color: 'var(--primary)', 
                                                flexShrink: 0, 
                                                marginLeft: '8px' 
                                            }}
                                            title="Aktarım Detayları"
                                        >
                                            <ChevronRight size={15} strokeWidth={2.4} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* 4. Başarılı Sonuç Özeti */}
                {statusReport && (
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)', animation: 'fadeIn 0.3s' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '3px solid #d1fae5' }}>
                            <CheckCircle2 size={26} />
                        </div>
                        
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>Yükleme Başarıyla Tamamlandı</h3>
                        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
                            Excel dosyasındaki katılımcı verileri analiz edildi, mükerrer kontrolleri yapıldı ve tura aktarıldı.
                        </p>

                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                <span style={{ color: '#64748b' }}>Toplam Okunan Katılımcı:</span>
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{statusReport.total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>👤 Yetişkin Katılımcı:</span>
                                <span style={{ fontWeight: '700', color: '#0369a1' }}>{statusReport.adultsCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                <span style={{ color: '#a21caf', display: 'flex', alignItems: 'center', gap: '5px' }}>🎈 Çocuk Katılımcı:</span>
                                <span style={{ fontWeight: '700', color: '#a21caf' }}>{statusReport.childrenCount}</span>
                            </div>
                            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '2px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>✨ Yeni Oluşturulan Profil:</span>
                                <span style={{ fontWeight: '700', color: '#059669' }}>{statusReport.newUsersCreated}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>👥 Tura Eklenen Mevcut Üye:</span>
                                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{statusReport.existingUsersAdded}</span>
                            </div>
                            {statusReport.duplicateSkippedCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#dc2626', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}>⚠️ Mükerrer (Aktarılmadı):</span>
                                    <span style={{ fontWeight: '800' }}>{statusReport.duplicateSkippedCount} Kişi</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                                <span style={{ color: '#4b5563' }}>🛡️ Zaten Turda Kayıtlı Olan:</span>
                                <span style={{ fontWeight: '700', color: '#4b5563' }}>{statusReport.alreadyInTourCount}</span>
                            </div>
                            {statusReport.errorRowsCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', borderTop: '1px solid #fee2e2', paddingTop: '6px', color: '#dc2626' }}>
                                    <span>⚠️ Atlanan / Hatalı Satır:</span>
                                    <span style={{ fontWeight: '700' }}>{statusReport.errorRowsCount}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {statusReport.report && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedReportForView(statusReport.report);
                                        setReportFilterTab('');
                                        setReportSearchQuery('');
                                        setReportVisibleCount(20);
                                        setIsReportFilterOpen(false);
                                        setStatusReport(null);
                                    }} 
                                    style={{
                                        width: '100%',
                                        padding: '11px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--primary)',
                                        background: '#ffffff',
                                        color: 'var(--primary)',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        boxShadow: '0 1px 3px rgba(216, 27, 96, 0.08)'
                                    }}
                                >
                                    <FileText size={15} /> Aktarım Detaylı Raporunu İncele
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={onClose} 
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(216, 27, 96, 0.2)'
                                }}
                            >
                                Katılımcı Listesine Dön
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
