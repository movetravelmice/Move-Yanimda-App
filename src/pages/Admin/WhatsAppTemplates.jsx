import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import { 
  Save, Info, HelpCircle, Send, MessageSquare, Code, Eye, 
  Sparkles, Check, CheckCircle2, Loader2, Copy, ExternalLink,
  Layers, Globe, ShieldCheck, Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

const defaultWaTemplates = {
    newUserTemplate: {
        title: 'Yeni Müşteri Hoş Geldin Şablonu',
        description: 'Sisteme yeni bir kullanıcı eklendiğinde gönderilen WhatsApp karşılama şablonu.',
        variables: [
            { name: '{{1}}', desc: 'Katılımcı Adı Soyadı' }
        ],
        metaName: 'welcome_customer',
        category: 'UTILITY',
        defaultBody: 'Sayın {{1}}, Move Yanımda sistemine kaydınız başarıyla oluşturulmuştur. Seyahatlerinizi ve bilet detaylarınızı uygulamamız üzerinden takip edebilirsiniz.'
    },
    newTourTemplate: {
        title: 'Seyahat Kaydı Şablonu',
        description: 'Mevcut bir kullanıcı yeni bir tura/seyahate dahil edildiğinde gönderilen bildirim şablonu.',
        variables: [
            { name: '{{1}}', desc: 'Katılımcı Adı Soyadı' },
            { name: '{{2}}', desc: 'Seyahat / Tur Adı' }
        ],
        metaName: 'tour_registration',
        category: 'UTILITY',
        defaultBody: 'Sayın {{1}}, {{2}} seyahat kaydınız başarıyla tamamlanmıştır. Detayları Move Yanımda uygulamanızdan inceleyebilirsiniz.'
    },
    passwordResetTemplate: {
        title: 'Doğrulama Kodu / Şifre Sıfırlama (OTP) Şablonu',
        description: 'Kullanıcı şifre sıfırlama veya giriş kodu talep ettiğinde gönderilen resmi Meta AUTHENTICATION (Tek Kullanımlık Kod / Kodu Kopyala Butonlu) şablonu.',
        variables: [
            { name: '{{1}}', desc: 'Tek Kullanımlık Doğrulama Kodu (OTP)' }
        ],
        metaName: 'password_reset_otp',
        category: 'AUTHENTICATION',
        defaultBody: '{{1}} Move Yanımda tek kullanımlık doğrulama kodunuzdur. Güvenliğiniz için bu kodu kimseyle paylaşmayınız.'
    },
    ticketAddedTemplate: {
        title: 'Bilet PDF Yüklendi Şablonu',
        description: 'Kullanıcının seyahat e-bilet PDF belgesi sisteme yüklendiğinde gönderilen bildirim şablonu.',
        variables: [
            { name: '{{1}}', desc: 'Katılımcı Adı' },
            { name: '{{2}}', desc: 'Seyahat Adı' }
        ],
        metaName: 'ticket_pdf_ready',
        category: 'UTILITY',
        defaultBody: 'Sayın {{1}}, {{2}} seyahatiniz için e-bilet PDF belgeniz sisteme yüklenmiştir. Biletinizi ve seyahat detaylarınızı Move Yanımda uygulamanızdan inceleyebilirsiniz.'
    },
    checkInTemplate: {
        title: '48 Saat Check-in Hatırlatması',
        description: 'Uçuş kalkışına 48 saatten az kaldığında otomatik gönderilen check-in hatırlatma şablonu.',
        variables: [
            { name: '{{1}}', desc: 'Katılımcı Adı' },
            { name: '{{2}}', desc: 'Seyahat Adı' },
            { name: '{{3}}', desc: 'Kalan Saat' },
            { name: '{{4}}', desc: 'Havayolu' }
        ],
        metaName: 'checkin_reminder',
        category: 'UTILITY',
        defaultBody: 'Sayın {{1}}, {{2}} seyahatinizin uçuşuna {{3}} saat kaldı. {{4}} uçuşunuz için online check-in işlemlerinizi tamamlamayı unutmayınız.'
    },
    tourReviewTemplate: {
        title: '24 Saat Sonra Seyahat Puanlama Şablonu',
        description: 'Seyahat tamamlandıktan 24 saat sonra misafirlerin seyahatlerini uygulama üzerinden puanlamaları için gönderilen değerlendirme şablonu.',
        variables: [
            { name: '{{1}}', desc: 'Katılımcı Adı' },
            { name: '{{2}}', desc: 'Seyahat Adı' },
            { name: '{{3}}', desc: 'Puanlama / Uygulama Linki' }
        ],
        metaName: 'tour_review_reminder',
        category: 'UTILITY',
        defaultBody: 'Sayın {{1}}, {{2}} seyahatinizin tamamlandığını umarız. Deneyiminizi bizimle paylaşmak ve seyahatinizi puanlamak için Move Yanımda uygulamasını ziyaret edebilirsiniz: {{3}} Görüşleriniz bizim için çok değerlidir.'
    }
};

export default function WhatsAppTemplates() {
    const navigate = useNavigate();
    const { whatsappConfig, setWhatsappConfig } = useSettingsStore();

    const [selectedTemplateKey, setSelectedTemplateKey] = useState('tourReviewTemplate');
    const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'preview', 'facebook_meta', 'test'
    const [metaTemplateName, setMetaTemplateName] = useState('');
    const [bodyPattern, setBodyPattern] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [copiedVar, setCopiedVar] = useState(null);
    const [copiedSnippet, setCopiedSnippet] = useState(false);
    const [isCreatingOnMeta, setIsCreatingOnMeta] = useState(false);
    const [metaCreateResult, setMetaCreateResult] = useState(null);

    const templateMeta = defaultWaTemplates[selectedTemplateKey] || defaultWaTemplates.tourReviewTemplate;

    // Load template mapping and text pattern
    useEffect(() => {
        const loadTemplate = async () => {
            setLoading(true);
            try {
                let mappedName = whatsappConfig?.[selectedTemplateKey] || templateMeta.metaName;
                if (selectedTemplateKey === 'passwordResetTemplate' && mappedName === 'password_reset') {
                    mappedName = 'password_reset_otp';
                }
                setMetaTemplateName(mappedName);

                const docRef = doc(db, 'whatsapp_templates', selectedTemplateKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setBodyPattern(docSnap.data().bodyPattern || templateMeta.defaultBody);
                } else {
                    setBodyPattern(templateMeta.defaultBody);
                }
            } catch (e) {
                console.error("WhatsApp şablonu yükleme hatası:", e);
                setBodyPattern(templateMeta.defaultBody);
            } finally {
                setLoading(false);
            }
        };
        loadTemplate();
    }, [selectedTemplateKey, templateMeta, whatsappConfig]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setWhatsappConfig({ [selectedTemplateKey]: metaTemplateName });

            const docRef = doc(db, 'whatsapp_templates', selectedTemplateKey);
            await setDoc(docRef, { bodyPattern }, { merge: true });

            alert('WhatsApp şablon ayarları başarıyla kaydedildi!');
        } catch (e) {
            console.error("WhatsApp şablon kaydetme hatası:", e);
            alert('Şablon kaydedilirken hata oluştu: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendTest = async () => {
        if (!testPhone || testPhone.length < 9) {
            setTestResult({ success: false, message: 'Lütfen geçerli bir test telefon numarası girin (Örn: 905XXXXXXXXX).' });
            return;
        }

        if (!whatsappConfig?.isEnabled || !whatsappConfig?.phoneId || !whatsappConfig?.accessToken) {
            setTestResult({ success: false, message: 'WhatsApp API ayarlarınız eksik veya kapalı. Lütfen Sistem Konfigürasyonu altından aktif edin.' });
            return;
        }

        setSendingTest(true);
        setTestResult(null);

        try {
            let testParams = [];
            if (selectedTemplateKey === 'newUserTemplate') {
                testParams = ['Ahmet Yılmaz'];
            } else if (selectedTemplateKey === 'newTourTemplate') {
                testParams = ['Ahmet Yılmaz', 'Klasik İtalya Turu'];
            } else if (selectedTemplateKey === 'passwordResetTemplate') {
                testParams = ['481923'];
            } else if (selectedTemplateKey === 'ticketAddedTemplate') {
                testParams = ['Ahmet Yılmaz', 'Klasik İtalya Turu'];
            } else if (selectedTemplateKey === 'checkInTemplate') {
                testParams = ['Ahmet Yılmaz', 'Klasik İtalya Turu', '48', 'Pegasus'];
            } else if (selectedTemplateKey === 'tourReviewTemplate') {
                testParams = ['Ahmet Yılmaz', 'Klasik İtalya Turu', 'https://move-yanimda.web.app/dashboard'];
            }

            const sendWhatsAppNotification = useSettingsStore.getState().sendWhatsAppNotification;
            const result = await sendWhatsAppNotification(testPhone, selectedTemplateKey, testParams);

            if (result && result.success !== false) {
                setTestResult({ success: true, message: `Test WhatsApp mesajı '${testPhone}' numarasına başarıyla iletildi.` });
            } else {
                setTestResult({ success: false, message: result?.message || 'Mesaj gönderilemedi. Meta API durumunu kontrol edin.' });
            }
        } catch (e) {
            setTestResult({ success: false, message: `Bağlantı hatası: ${e.message}` });
        } finally {
            setSendingTest(false);
        }
    };

    const getPreviewHtml = () => {
        if (selectedTemplateKey === 'passwordResetTemplate') {
            return `
                <div style="margin-bottom: 6px;">
                    <strong style="letter-spacing: 1.5px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 13.5px;">481923</strong> Move Yanımda tek kullanımlık doğrulama kodunuzdur. Güvenliğiniz için bu kodu kimseyle paylaşmayınız.
                </div>
                <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
                    Bu kod 10 dakika içinde geçerliliğini yitirecektir.
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; display: flex; justify-content: center;">
                    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: #1877f2; display: flex; align-items: center; gap: 4px; width: 100%; justify-content: center;">
                        📋 Kodu Kopyala: <span style="font-family: monospace; font-weight: 800;">481923</span>
                    </div>
                </div>
            `;
        }

        let preview = bodyPattern || templateMeta.defaultBody;

        preview = preview
            .replace(/{{1}}/g, "Ahmet Yılmaz")
            .replace(/{{2}}/g, "Klasik İtalya Turu")
            .replace(/{{3}}/g, "https://move-yanimda.web.app/dashboard")
            .replace(/{{4}}/g, "Pegasus")
            .replace(/{{5}}/g, "TK8899");

        preview = preview.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        preview = preview.replace(/\n/g, '<br/>');

        return preview;
    };

    const insertVariable = (variableName) => {
        setCopiedVar(variableName);
        setTimeout(() => setCopiedVar(null), 1500);

        const textarea = document.getElementById('bodyPatternTextarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        setBodyPattern(before + variableName + after);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + variableName.length;
        }, 10);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    const handleCreateOnMeta = async () => {
        if (!whatsappConfig?.wabaId || !whatsappConfig?.accessToken) {
            setMetaCreateResult({
                success: false,
                message: 'WABA ID veya Permanent Access Token eksik. Lütfen Sistem Konfigürasyonu altından WhatsApp API bilgilerinizi kontrol edin.'
            });
            return;
        }

        setIsCreatingOnMeta(true);
        setMetaCreateResult(null);

        const isAuth = selectedTemplateKey === 'passwordResetTemplate' || templateMeta.category === 'AUTHENTICATION';

        let sampleVals = ["Ahmet Yılmaz"];
        if (selectedTemplateKey === 'newTourTemplate' || selectedTemplateKey === 'ticketAddedTemplate') {
            sampleVals = ["Ahmet Yılmaz", "Klasik İtalya Turu"];
        } else if (selectedTemplateKey === 'passwordResetTemplate') {
            sampleVals = ["481923"];
        } else if (selectedTemplateKey === 'checkInTemplate') {
            sampleVals = ["Ahmet Yılmaz", "Klasik İtalya Turu", "48", "Pegasus"];
        } else if (selectedTemplateKey === 'tourReviewTemplate') {
            sampleVals = ["Ahmet Yılmaz", "Klasik İtalya Turu", "https://move-yanimda.web.app/dashboard"];
        }

        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
            const res = await fetch(`${baseUrl}/api/create-whatsapp-template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wabaId: whatsappConfig.wabaId,
                    accessToken: whatsappConfig.accessToken,
                    name: metaTemplateName || templateMeta.metaName,
                    category: isAuth ? "AUTHENTICATION" : "UTILITY",
                    language: "tr",
                    bodyText: bodyPattern || templateMeta.defaultBody,
                    exampleValues: sampleVals
                })
            });

            const data = await res.json();
            if (res.ok && data.success !== false) {
                setMetaCreateResult({
                    success: true,
                    message: `✅ '${metaTemplateName || templateMeta.metaName}' şablonu Meta / Facebook WhatsApp hesabınızda başarıyla oluşturuldu ve onaya gönderildi!`
                });
            } else {
                setMetaCreateResult({
                    success: false,
                    message: data.message || 'Meta API şablonu oluşturamadı. Lütfen Meta Developer panelinden izinleri kontrol edin.'
                });
            }
        } catch (e) {
            setMetaCreateResult({
                success: false,
                message: `Bağlantı hatası: ${e.message}`
            });
        } finally {
            setIsCreatingOnMeta(false);
        }
    };

    const getMetaJsonPayload = () => {
        const isAuth = selectedTemplateKey === 'passwordResetTemplate' || templateMeta.category === 'AUTHENTICATION';

        if (isAuth) {
            const authPayload = {
                name: metaTemplateName || templateMeta.metaName,
                language: "tr",
                category: "AUTHENTICATION",
                components: [
                    {
                        type: "BODY",
                        add_security_recommendation: true
                    },
                    {
                        type: "FOOTER",
                        code_expiration_minutes: 10
                    },
                    {
                        type: "BUTTONS",
                        buttons: [
                            {
                                type: "OTP",
                                otp_type: "COPY_CODE",
                                text: "Kodu Kopyala"
                            }
                        ]
                    }
                ]
            };
            return JSON.stringify(authPayload, null, 2);
        }

        const exampleValues = [];
        if (selectedTemplateKey === 'newUserTemplate') {
            exampleValues.push(["Ahmet Yılmaz"]);
        } else if (selectedTemplateKey === 'newTourTemplate' || selectedTemplateKey === 'ticketAddedTemplate') {
            exampleValues.push(["Ahmet Yılmaz", "Klasik İtalya Turu"]);
        } else if (selectedTemplateKey === 'checkInTemplate') {
            exampleValues.push(["Ahmet Yılmaz", "Klasik İtalya Turu", "48", "Pegasus"]);
        } else if (selectedTemplateKey === 'tourReviewTemplate') {
            exampleValues.push(["Ahmet Yılmaz", "Klasik İtalya Turu", "https://move-yanimda.web.app/dashboard"]);
        }

        const payload = {
            name: metaTemplateName || templateMeta.metaName,
            language: "tr",
            category: "UTILITY",
            components: [
                {
                    type: "BODY",
                    text: bodyPattern || templateMeta.defaultBody,
                    example: {
                        body_text: exampleValues
                    }
                }
            ]
        };

        return JSON.stringify(payload, null, 2);
    };

    return (
        <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
            <Header title="WhatsApp Şablon Yönetimi" showBack />

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
                        {Object.entries(defaultWaTemplates).map(([key, value]) => (
                            <option key={key} value={key}>{value.title}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '10.5px', color: '#64748b' }}>
                        <Info size={12} color="#059669" style={{ flexShrink: 0 }} />
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
                            fontSize: 'clamp(9px, 2.5vw, 10.5px)',
                            fontWeight: activeTab === 'edit' ? '800' : '600',
                            background: activeTab === 'edit' ? '#059669' : 'white',
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
                            fontSize: 'clamp(9px, 2.5vw, 10.5px)',
                            fontWeight: activeTab === 'preview' ? '800' : '600',
                            background: activeTab === 'preview' ? '#059669' : 'white',
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
                        onClick={() => setActiveTab('facebook_meta')}
                        style={{
                            flex: 1.2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '6px 4px',
                            borderRadius: '9px',
                            fontSize: 'clamp(9px, 2.5vw, 10.5px)',
                            fontWeight: activeTab === 'facebook_meta' ? '800' : '600',
                            background: activeTab === 'facebook_meta' ? '#1877f2' : 'white',
                            color: activeTab === 'facebook_meta' ? 'white' : '#1877f2',
                            border: activeTab === 'facebook_meta' ? 'none' : '1px solid #bfdbfe',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Globe size={11} style={{ flexShrink: 0 }} /> Meta / Facebook Şablonu
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
                            fontSize: 'clamp(9px, 2.5vw, 10.5px)',
                            fontWeight: activeTab === 'test' ? '800' : '600',
                            background: activeTab === 'test' ? '#059669' : 'white',
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
                                
                                {/* Meta Cloud API Template Name */}
                                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                        META CLOUD API ŞABLON ADI (TEMPLATE NAME)
                                    </label>
                                    <input 
                                        type="text"
                                        value={metaTemplateName}
                                        onChange={(e) => setMetaTemplateName(e.target.value)}
                                        placeholder="Facebook Developer panelindeki şablon adı..."
                                        style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11.5px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                        Meta Business Manager üzerinde onaylattığınız resmi şablon adı (örn: <code>{templateMeta.metaName}</code>).
                                    </div>
                                    {metaTemplateName === 'password_reset' && (
                                        <div style={{ fontSize: '10.5px', color: '#b91c1c', background: '#fef2f2', padding: '6px 8px', borderRadius: '6px', marginTop: '6px', border: '1px solid #fecaca' }}>
                                            ⚠️ 'password_reset' ismi daha önce reddedildiği için Meta aynı isimle tekrar şablon oluşturmaya izin vermez. Lütfen <code>password_reset_otp</code> veya <code>move_auth_code</code> gibi yeni bir isim kullanın.
                                        </div>
                                    )}
                                </div>

                                {/* Variable Chips */}
                                <div style={{ background: 'white', padding: '10px 12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Sparkles size={11} color="#059669" /> ŞABLON PARAMETRELERİ (Dokunarak Ekle)
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
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                                            >
                                                <code style={{ fontWeight: '700', color: '#059669' }}>{v.name}</code>
                                                <span style={{ color: '#64748b', fontSize: '9px' }}>({v.desc})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Body Pattern */}
                                <div style={{ background: 'white', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block' }}>ŞABLON METİN YAPISI</label>
                                        <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>*kalın* metin destekler</span>
                                    </div>
                                    <textarea 
                                        id="bodyPatternTextarea"
                                        value={bodyPattern}
                                        onChange={(e) => setBodyPattern(e.target.value)}
                                        rows={6}
                                        placeholder="WhatsApp şablon içeriği..."
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11.5px', lineHeight: 1.4, boxSizing: 'border-box', resize: 'vertical' }}
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
                                        background: '#059669', 
                                        color: 'white', 
                                        border: 'none', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '6px', 
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)' 
                                    }}
                                >
                                    {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                                    {saving ? 'Kaydediliyor...' : 'Şablon Ayarlarını Kaydet'}
                                </button>
                            </div>
                        )}

                        {/* TAB 2: WHATSAPP PREVIEW */}
                        {activeTab === 'preview' && (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>
                                    WHATSAPP MOCKUP ÖNİZLEME
                                </div>
                                
                                <div style={{
                                    background: '#e5ddd5',
                                    padding: '16px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '160px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                }}>
                                    <div style={{
                                        alignSelf: 'flex-start',
                                        background: '#ffffff',
                                        padding: '8px 12px 14px',
                                        borderRadius: '0px 10px 10px 10px',
                                        maxWidth: '90%',
                                        position: 'relative',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                                        fontSize: '12.5px',
                                        color: '#111827',
                                        lineHeight: '1.45',
                                        wordBreak: 'break-word'
                                    }}>
                                        <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                                        <span style={{
                                            position: 'absolute',
                                            right: '6px',
                                            bottom: '2px',
                                            fontSize: '9.5px',
                                            color: '#94a3b8'
                                        }}>
                                            12:00
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: FACEBOOK / META CLOUD API TEMPLATE SPEC */}
                        {activeTab === 'facebook_meta' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                
                                {/* Header Card */}
                                <div style={{ background: 'linear-gradient(135deg, #1877f2, #0d5bbd)', color: 'white', padding: '14px', borderRadius: '14px', boxShadow: '0 3px 12px rgba(24, 119, 242, 0.25)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <Globe size={16} />
                                        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800' }}>Facebook / Meta WhatsApp Manager Şablon Yapısı</h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '11px', opacity: 0.9, lineHeight: 1.4 }}>
                                        Bu şablonu doğrudan Meta Graph API üzerinden oluşturabilir veya Meta WhatsApp Business Manager panelinde tanımlayabilirsiniz.
                                    </p>
                                </div>

                                {/* Automatic Meta Creator Action Button */}
                                <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 4px rgba(24, 119, 242, 0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e293b' }}>
                                                Meta / Facebook Hesabına Otomatik Gönder
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                                                Bu şablonu tek tıkla Meta WhatsApp Business Manager (WABA) hesabınıza yükler.
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={handleCreateOnMeta}
                                            disabled={isCreatingOnMeta}
                                            style={{ 
                                                background: '#1877f2', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '8px 14px', 
                                                borderRadius: '8px', 
                                                fontSize: '11px', 
                                                fontWeight: '800', 
                                                cursor: isCreatingOnMeta ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 8px rgba(24, 119, 242, 0.25)',
                                                flexShrink: 0
                                            }}
                                        >
                                            {isCreatingOnMeta ? <Loader2 size={12} className="spin" /> : <Globe size={12} />}
                                            {isCreatingOnMeta ? 'Gönderiliyor...' : 'Facebook / Meta’da Oluştur'}
                                        </button>
                                    </div>

                                    {metaCreateResult && (
                                        <div style={{ 
                                            padding: '8px 10px', 
                                            borderRadius: '8px', 
                                            fontSize: '10.5px', 
                                            fontWeight: '600', 
                                            background: metaCreateResult.success ? '#ecfdf5' : '#fee2e2', 
                                            color: metaCreateResult.success ? '#047857' : '#b91c1c', 
                                            border: `1px solid ${metaCreateResult.success ? '#a7f3d0' : '#fecaca'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {metaCreateResult.success ? <CheckCircle2 size={13} /> : <Info size={13} />}
                                            {metaCreateResult.message}
                                        </div>
                                    )}
                                </div>

                                {/* Field Details */}
                                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#64748b' }}>META ŞABLON ADI</div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', fontFamily: 'monospace' }}>
                                                {metaTemplateName || templateMeta.metaName}
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#64748b' }}>KATEGORİ & DİL</div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: templateMeta.category === 'AUTHENTICATION' ? '#1e40af' : '#1e293b' }}>
                                                {templateMeta.category === 'AUTHENTICATION' ? 'AUTHENTICATION (Kimlik Doğrulama)' : 'UTILITY (Hizmet)'} / TR (Türkçe)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gövde Metni Copy Block */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>META GÖVDE METNİ (BODY TEXT)</span>
                                            <button 
                                                onClick={() => copyToClipboard(bodyPattern || templateMeta.defaultBody)}
                                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {copiedSnippet ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                                                {copiedSnippet ? 'Kopyalandı!' : 'Metni Kopyala'}
                                            </button>
                                        </div>
                                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#1e293b', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                                            {templateMeta.category === 'AUTHENTICATION' 
                                                ? `{{1}} Move Yanımda giriş / şifre sıfırlama doğrulama kodunuzdur. Güvenliğiniz için bu kodu kimseyle paylaşmayınız.\n[Buton: 📋 Kodu Kopyala]` 
                                                : (bodyPattern || templateMeta.defaultBody)}
                                        </div>
                                    </div>

                                    {/* Değişken Örnekleri (Sample Values for Meta Approval) */}
                                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px' }}>
                                        <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#1e40af', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <ShieldCheck size={13} color="#2563eb" /> Meta Onay Süreci İçin Değişken Örnekleri (Sample Values)
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5 }}>
                                            {selectedTemplateKey === 'passwordResetTemplate' ? (
                                                <>
                                                    <div>• <code>{`{{1}}`}</code> (Doğrulama Kodu / OTP): <strong>481923</strong></div>
                                                    <div>• Buton Türü: <strong>Kodu Kopyala (Copy Code)</strong> | Süre: <strong>10 Dakika</strong></div>
                                                </>
                                            ) : selectedTemplateKey === 'tourReviewTemplate' ? (
                                                <>
                                                    <div>• <code>{`{{1}}`}</code> (Katılımcı Adı): <strong>Ahmet Yılmaz</strong></div>
                                                    <div>• <code>{`{{2}}`}</code> (Seyahat Adı): <strong>Klasik İtalya Turu</strong></div>
                                                    <div>• <code>{`{{3}}`}</code> (Puanlama Linki): <strong>https://move-yanimda.web.app/dashboard</strong></div>
                                                </>
                                            ) : selectedTemplateKey === 'checkInTemplate' ? (
                                                <>
                                                    <div>• <code>{`{{1}}`}</code>: <strong>Ahmet Yılmaz</strong></div>
                                                    <div>• <code>{`{{2}}`}</code>: <strong>Klasik İtalya Turu</strong></div>
                                                    <div>• <code>{`{{3}}`}</code>: <strong>48</strong></div>
                                                    <div>• <code>{`{{4}}`}</code>: <strong>Pegasus</strong></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>• <code>{`{{1}}`}</code>: <strong>Ahmet Yılmaz</strong></div>
                                                    <div>• <code>{`{{2}}`}</code>: <strong>Klasik İtalya Turu</strong></div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta Graph API JSON Payload */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>META GRAPH API JSON PAYLOAD</span>
                                            <button 
                                                onClick={() => copyToClipboard(getMetaJsonPayload())}
                                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Copy size={11} /> JSON Kopyala
                                            </button>
                                        </div>
                                        <pre style={{ margin: 0, background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.4 }}>
                                            {getMetaJsonPayload()}
                                        </pre>
                                    </div>

                                    {/* Step by step guide */}
                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                                            Facebook / Meta Business Manager'a Şablon Ekleme Adımları:
                                        </div>
                                        <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#475569', lineHeight: 1.6 }}>
                                            <li><strong>business.facebook.com</strong> adresine gidip WhatsApp Manager menüsünü açın.</li>
                                            <li><strong>Hesap Araçları {`->`} Mesaj Şablonları (Message Templates)</strong> sekmesine tıklayın.</li>
                                            <li><strong>"Şablon Oluştur"</strong> butonuna basın; Kategori olarak <strong>{templateMeta.category === 'AUTHENTICATION' ? 'Kimlik Doğrulama (Authentication)' : 'Hizmet (Utility)'}</strong>, Dil olarak <strong>Türkçe</strong> seçin.</li>
                                            <li>Şablon adına <code>{metaTemplateName || templateMeta.metaName}</code> yazın.</li>
                                            {templateMeta.category === 'AUTHENTICATION' ? (
                                                <li>Kod türü olarak <strong>Kodu Kopyala (Copy Code)</strong> seçin ve <strong>Onaya Gönderin</strong> (Meta botları Authentication şablonlarını genellikle saniyeler içinde otomatik onaylar).</li>
                                            ) : (
                                                <li>Yukarıdaki gövde metnini ve örnek değişkenleri yapıştırıp <strong>Onaya Gönderin</strong> (genellikle 1-2 dakika içinde Meta tarafından onaylanır).</li>
                                            )}
                                            <li>Şablon onaylandıktan sonra bu ekrandan <strong>"Kaydet"</strong> butonuna basarak eşleşmeyi tamamlayın.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: TEST SEND */}
                        {activeTab === 'test' && (
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <MessageSquare size={13} color="#059669" />
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Canlı Test WhatsApp Mesajı Gönder</h3>
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '10px' }}>
                                    Onaylı Meta şablonunuzu test etmek için alıcı telefon numarasını girin (Örn: 905XXXXXXXXX).
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                    <input 
                                        type="text"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        placeholder="905XXXXXXXXX"
                                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', color: '#1e293b', fontSize: '11px' }}
                                    />
                                    <button 
                                        onClick={handleSendTest}
                                        disabled={sendingTest || !testPhone}
                                        style={{ 
                                            padding: '7px 14px', 
                                            borderRadius: '8px', 
                                            background: '#059669', 
                                            color: 'white', 
                                            border: 'none', 
                                            fontWeight: '700', 
                                            fontSize: '11px', 
                                            cursor: sendingTest || !testPhone ? 'not-allowed' : 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '5px',
                                            opacity: sendingTest || !testPhone ? 0.6 : 1
                                        }}
                                    >
                                        {sendingTest ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                                        {sendingTest ? 'Yollanıyor...' : 'WhatsApp Gönder'}
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
