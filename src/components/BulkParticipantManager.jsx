import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTourStore } from '../store/tourStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';

export default function BulkParticipantManager({ tourId, onClose }) {
    const { tours, addParticipantToTour } = useTourStore();
    const { smtpConfig, corporateName } = useSettingsStore();
    const { users, addUser, addCompany, companies } = useUserStore();
    const fileInputRef = useRef(null);
    const tour = tours.find(t => t.id === tourId);

    const [fileData, setFileData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusReport, setStatusReport] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    if (!tour) return null;

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Ad Soyad': 'Ahmet Yılmaz',
                'E-posta': 'ahmet@ornek.com',
                'Telefon': '+905329998877',
                'TC Kimlik No': '12345678901',
                'Firma': 'Move Travel & Mice'
            },
            {
                'Ad Soyad': 'Ayşe Kaya',
                'E-posta': 'ayse@ornek.com',
                'Telefon': '+905331112233',
                'TC Kimlik No': '98765432109',
                'Firma': 'Move Travel & Mice'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "KatilimciSablon");
        ws['!cols'] = [ {wch: 25}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 25} ];
        XLSX.writeFile(wb, "Katilimci_Yukleme_Sablonu.xlsx");
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setErrorMsg('');
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
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

    const findVal = (row, patterns) => {
        const key = Object.keys(row).find(k => 
            patterns.some(p => k.toLowerCase().replace(/[^a-z0-9öçşığü]/g, '').includes(p))
        );
        return key ? String(row[key]).trim() : '';
    };

    const sendTourAssignmentEmail = async (participantName, participantEmail, password = null) => {
        const targetUser = users.find(u => u.email === participantEmail);
        const phone = targetUser?.phone || '';

        if (phone && phone !== '-') {
            if (password) {
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newUserTemplate',
                    [participantName, participantEmail, password]
                );
            } else {
                useSettingsStore.getState().sendWhatsAppNotification(
                    phone,
                    'newTourTemplate',
                    [participantName, tour.name]
                );
            }
        }

        if (smtpConfig?.host && smtpConfig?.user) {
            try {
                const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
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

        for (const row of fileData) {
            const name = findVal(row, ['adsoyad', 'isim', 'name', 'musteri', 'katilimci', 'ad']);
            const email = findVal(row, ['mail', 'eposta', 'email']);
            const phone = findVal(row, ['tel', 'phone', 'gsm', 'telefon']);
            const tcNoRaw = findVal(row, ['tc', 'kimlik', 'tcno']);
            const company = findVal(row, ['firma', 'sirket', 'company']);

            if (!name || (!email && !tcNoRaw)) {
                errorRowsCount++;
                continue;
            }

            const tcNo = tcNoRaw.replace(/\D/g, '');

            let existingUser = null;
            if (tcNo && tcNo.length === 11) {
                existingUser = users.find(u => u.tcNo === tcNo);
            }
            if (!existingUser && email) {
                existingUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            }

            if (existingUser) {
                const isAlreadyInTour = tour.participants?.some(p => 
                    p.id === existingUser.id || 
                    (p.email && p.email.toLowerCase() === existingUser.email.toLowerCase()) || 
                    (p.tcNo && p.tcNo === existingUser.tcNo)
                );

                if (isAlreadyInTour) {
                    alreadyInTourCount++;
                } else {
                    addParticipantToTour(tourId, existingUser);
                    await sendTourAssignmentEmail(existingUser.name, existingUser.email);
                    existingUsersAdded++;
                }
            } else {
                const compValue = company || 'Move Travel & Mice';
                if (compValue && !companies.includes(compValue)) {
                    addCompany(compValue);
                }

                const finalEmail = email || `user_${Date.now()}@move.local`;
                const newUserPassword = generateSecurePassword(name);

                const newUser = await addUser({
                    name,
                    email: finalEmail,
                    role: 'customer',
                    phone: phone || '-',
                    company: compValue,
                    password: newUserPassword,
                    tcNo: tcNo || ''
                });

                addParticipantToTour(tourId, newUser);
                await sendTourAssignmentEmail(newUser.name, newUser.email, newUserPassword);
                newUsersCreated++;
            }
        }

        setIsProcessing(false);
        setStatusReport({
            total: fileData.length,
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
            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                <div onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}>
                    <X size={20} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--primary)' }}>
                    <FileSpreadsheet size={28} />
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Excel ile Toplu Katılımcı Ekle</h2>
                </div>

                {!statusReport && (
                    <>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                            Katılımcıları TC Kimlik Numarası eşleşmesiyle sisteme aktarın. Kaydı olmayan kullanıcılar otomatik olarak oluşturulacaktır.
                        </p>

                        <div onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                            <Download size={20} className="text-primary" />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>Excel Şablonunu İndir</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ad Soyad, E-posta, Telefon, TC Kimlik No, Firma</div>
                            </div>
                        </div>

                        <div 
                            onClick={() => fileInputRef.current.click()} 
                            style={{ border: '2px dashed var(--border-color)', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#fafafa', marginBottom: '24px' }}
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
                            <Upload size={36} className="text-muted" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            {fileName ? (
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>{fileName}</div>
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
                            <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>İptal</button>
                            <button 
                                onClick={handleImport}
                                disabled={!fileData || isProcessing}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!fileData || isProcessing) ? 0.6 : 1 }}
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
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '4px solid #d1fae5' }}>
                            <CheckCircle2 size={32} />
                        </div>
                        
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Yükleme Tamamlandı!</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                            Excel dosyasındaki katılımcı verileri başarıyla işlendi.
                        </p>

                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Toplam Okunan Satır:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{statusReport.total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>✨ Yeni Oluşturulan Profil:</span>
                                <span style={{ fontWeight: 'bold', color: '#059669' }}>{statusReport.newUsersCreated}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>👥 Tura Eklenen Mevcut Üye:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{statusReport.existingUsersAdded}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#4b5563' }}>Zaten Kayıtlı Olanlar (Geçildi):</span>
                                <span style={{ fontWeight: 'bold', color: '#4b5563' }}>{statusReport.alreadyInTourCount}</span>
                            </div>
                            {statusReport.errorRowsCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                                    <span style={{ color: '#dc2626' }}>Hatalı/Eksik Satır (Atlanan):</span>
                                    <span style={{ fontWeight: 'bold', color: '#dc2626' }}>{statusReport.errorRowsCount}</span>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={onClose} 
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Kapat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
