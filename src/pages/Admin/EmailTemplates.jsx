import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import { 
  Save, Info, HelpCircle, Send, Mail, Code, Eye, 
  Sparkles, Check, CheckCircle2, Loader2, Copy 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

const defaultTemplates = {
    tour_email: {
        title: 'Seyahat Kaydı Hoşgeldiniz E-postası',
        description: 'Müşteriye yeni bir seyahat kaydı yapıldığında veya tura dahil edildiğinde gönderilen hoş geldiniz maili.',
        variables: [
            { name: '{{participantName}}', desc: 'Katılımcı Adı' },
            { name: '{{tourName}}', desc: 'Tur İsmi' },
            { name: '{{corporateName}}', desc: 'Firma Adı' },
            { name: '{{username}}', desc: 'Giriş E-postası' },
            { name: '{{password}}', desc: 'Oluşturulan Şifre' },
            { name: '{{credentialSection}}', desc: 'Giriş Bilgileri Bloğu' }
        ],
        subject: '{{corporateName}}: {{tourName}} Seyahati Kaydınız Alındı',
        body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; background: #D7147A; color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900;">
            M
        </div>
    </div>
    <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Seyahat Kaydı Başarılı</h2>
    <p>Sayın <strong>{{participantName}}</strong>,</p>
    <p><strong>{{tourName}}</strong> seyahatine kaydınız başarıyla yapılmıştır.</p>
    {{credentialSection}}
    <p>Uygulamamıza giriş yaparak seyahatiniz ile ilgili uçuş, transfer, tur programı ve yetkili bilgilerine dilediğiniz zaman ulaşabilirsiniz.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
</div>`
    },
    ticket_email: {
        title: 'Uçuş & Biletleme Bilgilendirme E-postası',
        description: 'Müşteriye bilet atandığında veya güncellendiğinde gönderilen bilet detayları maili.',
        variables: [
            { name: '{{participantName}}', desc: 'Katılımcı Adı' },
            { name: '{{tourName}}', desc: 'Tur İsmi' },
            { name: '{{corporateName}}', desc: 'Firma Adı' },
            { name: '{{flightsHtml}}', desc: 'Uçuş Detayları Bloğu' }
        ],
        subject: '{{corporateName}}: Uçuş Biletleriniz Sisteme Eklendi',
        body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #D7147A; margin-top: 0; text-align: center;">Biletleriniz Sisteme Eklendi</h2>
    <p>Sayın <strong>{{participantName}}</strong>,</p>
    <p><strong>{{tourName}}</strong> seyahatiniz için uçuş biletleriniz sisteme başarıyla işlenmiştir. Detayları aşağıda bulabilirsiniz:</p>
    {{flightsHtml}}
    <p>Uygulamamıza giriş yaparak seyahatiniz ile ilgili detaylara dilediğiniz zaman ulaşabilirsiniz.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bizi tercih ettiğiniz için teşekkür ederiz.<br/>Move Travel & Mice</p>
</div>`
    },
    forgot_password: {
        title: 'Parola Sıfırlama / Hatırlatma E-postası',
        description: 'Kullanıcı giriş ekranında "Şifremi Unuttum" talebinde bulunduğunda şifresini gönderen mail.',
        variables: [
            { name: '{{accountName}}', desc: 'Alıcı Adı' },
            { name: '{{accountPassword}}', desc: 'Güncel Şifre' },
            { name: '{{corporateName}}', desc: 'Firma Adı' }
        ],
        subject: '{{corporateName}}: Parola Sıfırlama / Hatırlatma Talebi',
        body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #D7147A; margin-top: 0;">Parola Hatırlatma</h2>
    <p>Merhaba <strong>{{accountName}}</strong>,</p>
    <p>{{corporateName}} sistemine giriş yapabilmeniz için sistemde kayıtlı olan güncel parolanız aşağıdadır:</p>
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1;">
        {{accountPassword}}
    </div>
    <p>Güvenliğiniz için sisteme giriş yaptıktan sonra "Hesap Ayarları" bölümünden parolanızı düzenli olarak değiştirmeyi unutmayın.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 11px; color: #94a3b8;">Eğer bu talebi siz yapmadıysanız lütfen kurum yöneticinizle irtibata geçin.</p>
</div>`
    }
};

export default function EmailTemplates() {
    const navigate = useNavigate();
    const [selectedTemplateKey, setSelectedTemplateKey] = useState('tour_email');
    const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'preview', 'test'
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [copiedVar, setCopiedVar] = useState(null);

    const templateMeta = defaultTemplates[selectedTemplateKey];

    // Load template
    useEffect(() => {
        const loadTemplate = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'email_templates', selectedTemplateKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSubject(docSnap.data().subject || templateMeta.subject);
                    setBody(docSnap.data().body || templateMeta.body);
                } else {
                    setSubject(templateMeta.subject);
                    setBody(templateMeta.body);
                }
            } catch (e) {
                console.error("Şablon yükleme hatası:", e);
                setSubject(templateMeta.subject);
                setBody(templateMeta.body);
            } finally {
                setLoading(false);
            }
        };
        loadTemplate();
    }, [selectedTemplateKey, templateMeta]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'email_templates', selectedTemplateKey);
            await setDoc(docRef, { subject, body }, { merge: true });
            alert('E-posta şablonu başarıyla kaydedildi!');
        } catch (e) {
            console.error("Şablon kaydetme hatası:", e);
            alert('Şablon kaydedilirken hata oluştu: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail || !testEmail.includes('@')) {
            setTestResult({ success: false, message: 'Lütfen geçerli bir test e-posta adresi girin.' });
            return;
        }

        const smtp = useSettingsStore.getState().smtpConfig;
        if (!smtp?.host || !smtp?.user || !smtp?.pass) {
            setTestResult({ success: false, message: 'SMTP ayarlarınız eksik. Lütfen Sistem Konfigürasyonu altından SMTP ayarlarını tamamlayın.' });
            return;
        }

        setSendingTest(true);
        setTestResult(null);

        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
            let endpoint = '';
            let payload = {
                host: smtp.host,
                port: smtp.port,
                user: smtp.user,
                pass: smtp.pass,
                to: testEmail,
                customSubject: subject,
                customHtml: body
            };

            if (selectedTemplateKey === 'tour_email') {
                endpoint = '/api/send-tour-email';
                payload = {
                    ...payload,
                    corporateName: 'Move Travel & Mice',
                    participantName: 'Ahmet Yılmaz',
                    tourName: 'Klasik İtalya Turu',
                    password: 'Pass1234!'
                };
            } else if (selectedTemplateKey === 'ticket_email') {
                endpoint = '/api/send-ticket-email';
                payload = {
                    ...payload,
                    participantName: 'Ahmet Yılmaz',
                    tourName: 'Klasik İtalya Turu',
                    flights: [
                        {
                            type: "Gidiş Uçuşu",
                            airline: "Turkish Airlines",
                            from: "IST",
                            to: "FCO",
                            date: "2026-09-20",
                            departureTime: "10:30",
                            arrivalTime: "12:15",
                            pnr: "TK8899",
                            ticketNo: "235-9876543210"
                        }
                    ]
                };
            } else if (selectedTemplateKey === 'forgot_password') {
                endpoint = '/api/forgot-password';
                payload = {
                    ...payload,
                    accountName: 'Ahmet Yılmaz',
                    accountPassword: 'Pass9988!',
                    corporateName: 'Move Travel & Mice'
                };
            }

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await res.json();
            if (res.ok) {
                setTestResult({ success: true, message: `Test e-postası '${testEmail}' adresine başarıyla yollandı.` });
            } else {
                setTestResult({ success: false, message: resData.message || 'Gönderim başarısız oldu.' });
            }
        } catch (e) {
            setTestResult({ success: false, message: `Bağlantı hatası: ${e.message}` });
        } finally {
            setSendingTest(false);
        }
    };

    const getPreviewHtml = () => {
        let preview = body;
        const mockFlightsHtml = `
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin: 10px 0; border: 1px dashed #cbd5e1; font-size: 13px;">
                <div style="font-weight:bold; color: #D7147A; margin-bottom: 6px;">Gidiş Uçuşu - Turkish Airlines</div>
                <div><strong>Kalkış:</strong> IST (İstanbul) ➔ <strong>Varış:</strong> FCO (Roma)</div>
                <div><strong>Tarih:</strong> 2026-09-20 10:30 | <strong>Uçuş:</strong> TK 1871</div>
                <div><strong>PNR:</strong> TK8899 | <strong>Bilet:</strong> 235-9876543210</div>
            </div>
        `;
        const mockCredentialSection = `
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin: 14px 0; border: 1px dashed #cbd5e1; text-align: center; font-size: 13px;">
                <div style="margin-bottom: 4px;"><strong>Kullanıcı Adı:</strong> ahmet@sirket.com</div>
                <div><strong>Şifre:</strong> Pass1234!</div>
            </div>
        `;

        preview = preview
            .replace(/{{participantName}}/g, "Ahmet Yılmaz")
            .replace(/{{tourName}}/g, "Klasik İtalya Turu")
            .replace(/{{flightsHtml}}/g, mockFlightsHtml)
            .replace(/{{credentialSection}}/g, mockCredentialSection)
            .replace(/{{username}}/g, "ahmet@sirket.com")
            .replace(/{{password}}/g, "Pass1234!")
            .replace(/{{corporateName}}/g, "Move Travel & Mice")
            .replace(/{{accountName}}/g, "Ahmet Yılmaz")
            .replace(/{{accountPassword}}/g, "Pass1234!");
            
        return preview;
    };

    const insertVariable = (variableName) => {
        setCopiedVar(variableName);
        setTimeout(() => setCopiedVar(null), 1500);

        setBody(prev => {
            const textarea = document.getElementById('bodyTextarea');
            if (!textarea) return prev + variableName;
            
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + variableName.length;
            }, 10);
            
            return before + variableName + after;
        });
    };

    return (
        <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
            <Header title="E-Posta Şablon Yönetimi" showBack />

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '14px 12px' }}>
                
                {/* 1. Template Selector Card */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px 14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        YÖNETİLECEK ŞABLON
                    </label>
                    <select 
                        value={selectedTemplateKey}
                        onChange={(e) => setSelectedTemplateKey(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        {Object.entries(defaultTemplates).map(([key, value]) => (
                            <option key={key} value={key}>{value.title}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '10.5px', color: '#64748b' }}>
                        <Info size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span>{templateMeta.description}</span>
                    </div>
                </div>

                {/* 2. Sleek Tab Navigation */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                    <button
                        onClick={() => setActiveTab('edit')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '6px 4px',
                            borderRadius: '9px',
                            fontSize: 'clamp(9.5px, 2.7vw, 11px)',
                            fontWeight: activeTab === 'edit' ? '800' : '600',
                            background: activeTab === 'edit' ? 'var(--primary)' : 'white',
                            color: activeTab === 'edit' ? 'white' : '#64748b',
                            border: activeTab === 'edit' ? 'none' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Code size={11} style={{ flexShrink: 0 }} /> Şablon Düzenle
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '6px 4px',
                            borderRadius: '9px',
                            fontSize: 'clamp(9.5px, 2.7vw, 11px)',
                            fontWeight: activeTab === 'preview' ? '800' : '600',
                            background: activeTab === 'preview' ? 'var(--primary)' : 'white',
                            color: activeTab === 'preview' ? 'white' : '#64748b',
                            border: activeTab === 'preview' ? 'none' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Eye size={11} style={{ flexShrink: 0 }} /> Önizleme
                    </button>
                    <button
                        onClick={() => setActiveTab('test')}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '6px 4px',
                            borderRadius: '9px',
                            fontSize: 'clamp(9.5px, 2.7vw, 11px)',
                            fontWeight: activeTab === 'test' ? '800' : '600',
                            background: activeTab === 'test' ? 'var(--primary)' : 'white',
                            color: activeTab === 'test' ? 'white' : '#64748b',
                            border: activeTab === 'test' ? 'none' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Send size={11} style={{ flexShrink: 0 }} /> Test Gönder
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px', color: '#64748b', fontSize: '11px' }}>
                        <Loader2 size={16} className="spin" style={{ marginRight: '6px' }} /> Şablon yükleniyor...
                    </div>
                ) : (
                    <>
                        {/* TAB 1: EDIT */}
                        {activeTab === 'edit' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                
                                {/* Variable Chips */}
                                <div style={{ background: 'white', padding: '10px 12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Sparkles size={11} color="var(--primary)" /> DİNAMİK DEĞİŞKENLER (Dokunarak Ekle)
                                        </div>
                                        {copiedVar && (
                                            <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: '800' }}>✓ Eklendi</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {templateMeta.variables.map((v) => (
                                            <button 
                                                key={v.name}
                                                type="button"
                                                onClick={() => insertVariable(v.name)}
                                                style={{ 
                                                    background: '#f8fafc', 
                                                    border: '1px solid #cbd5e1', 
                                                    padding: '3px 7px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '10px', 
                                                    color: '#334155', 
                                                    cursor: 'pointer', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                                            >
                                                <code style={{ fontWeight: '700', color: 'var(--primary)' }}>{v.name}</code>
                                                <span style={{ color: '#64748b', fontSize: '9px' }}>({v.desc})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>E-POSTA KONUSU (SUBJECT)</label>
                                    <input 
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="E-posta konusu..."
                                        style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11.5px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* HTML Body */}
                                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block' }}>E-POSTA İÇERİĞİ (HTML)</label>
                                        <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>UTF-8 / Responsive</span>
                                    </div>
                                    <textarea 
                                        id="bodyTextarea"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={12}
                                        placeholder="HTML kodları..."
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#0f172a', color: '#38bdf8', fontSize: '11px', fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Save Button */}
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        borderRadius: '10px', 
                                        fontSize: '12px', 
                                        fontWeight: '800', 
                                        background: 'var(--primary)', 
                                        color: 'white', 
                                        border: 'none', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '6px', 
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 2px 8px rgba(215, 20, 122, 0.25)' 
                                    }}
                                >
                                    {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                                    {saving ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
                                </button>
                            </div>
                        )}

                        {/* TAB 2: LIVE PREVIEW */}
                        {activeTab === 'preview' && (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>
                                    CANLI ÖNİZLEME (Örnek Parametreler ile)
                                </div>
                                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
                                    <iframe 
                                        title="E-posta Canlı Önizleme"
                                        srcDoc={getPreviewHtml()}
                                        style={{ width: '100%', height: '360px', border: 'none', display: 'block', background: 'white' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TEST SEND */}
                        {activeTab === 'test' && (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <Mail size={13} color="var(--primary)" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Canlı Test E-Postası Gönder</h3>
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '10px' }}>
                                    Düzenlediğiniz şablonu gerçek gelen kutusunda görmek için bir alıcı adresi girin (Önceden kaydetmeniz gerekmez).
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                    <input 
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value.toLowerCase().trim())}
                                        placeholder="ornek@alanadi.com"
                                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11px' }}
                                    />
                                    <button 
                                        onClick={handleSendTest}
                                        disabled={sendingTest || !testEmail}
                                        style={{ 
                                            padding: '7px 14px', 
                                            borderRadius: '8px', 
                                            background: '#2563eb', 
                                            color: 'white', 
                                            border: 'none', 
                                            fontWeight: '700', 
                                            fontSize: '11px', 
                                            cursor: sendingTest || !testEmail ? 'not-allowed' : 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '5px',
                                            opacity: sendingTest || !testEmail ? 0.6 : 1
                                        }}
                                    >
                                        {sendingTest ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                                        {sendingTest ? 'Yollanıyor...' : 'Test Yolla'}
                                    </button>
                                </div>

                                {testResult && (
                                    <div style={{ 
                                        padding: '8px 10px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        background: testResult.success ? '#ecfdf5' : '#fee2e2', 
                                        color: testResult.success ? '#047857' : '#b91c1c', 
                                        border: `1px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {testResult.success ? <CheckCircle2 size={13} /> : <Info size={13} />}
                                        {testResult.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
