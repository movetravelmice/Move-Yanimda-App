import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, FileText, Upload, Save, Bus, Plus, Trash2, Eye, Download, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { isUserChild, canUserReceiveEmail, isChildEmail } from '../utils/userUtils';
import ConfirmModal from './ConfirmModal';

export default function ParticipantTransferManager({ tourId, participant, onClose }) {
  const { tours, updateParticipantTransfers } = useTourStore();
  const { smtpConfig } = useSettingsStore();
  const { users } = useUserStore();
  const tour = tours.find(t => t.id === tourId);
  const existingPart = tour?.participants.find(p => p.id === participant.id);

  const fileInputRef = useRef(null);
  const [ticketFiles, setTicketFiles] = useState([]);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [transfersInput, setTransfersInput] = useState([
     { id: Date.now(), desc: '', vehicle: '', plate: '', date: '', time: '' }
  ]);

  useEffect(() => {
    let initialFiles = [];
    if (Array.isArray(existingPart?.ticketFiles) && existingPart.ticketFiles.length > 0) {
       initialFiles = [...existingPart.ticketFiles];
    } else if (existingPart?.ticketPdf) {
       initialFiles = [existingPart.ticketPdf];
    }
    setTicketFiles(initialFiles);
    
    if (existingPart?.transfers?.length > 0) {
        setTransfersInput(existingPart.transfers.map(tr => ({
            id: Math.random(),
            desc: tr.desc || '',
            vehicle: tr.vehicle || '',
            plate: tr.plate || '',
            date: tr.date ? tr.date.split(',')[0].trim() : '',
            time: tr.date && tr.date.includes(',') ? tr.date.split(',')[1].trim() : ''
        })));
    }
  }, [existingPart]);

  const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFiles = async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      const filesArray = Array.from(fileList);
      const pdfFiles = filesArray.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

      if (pdfFiles.length === 0) {
          alert('Lütfen geçerli bir veya birden fazla PDF dosyası seçin.');
          return;
      }

      setIsUploading(true);
      try {
          const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const { storage } = await import('../lib/firebase');

          const newTickets = [];
          for (let i = 0; i < pdfFiles.length; i++) {
              const file = pdfFiles[i];
              setUploadProgress({ current: i + 1, total: pdfFiles.length, fileName: file.name });

              const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
              const storageRef = ref(storage, `tours/${tourId}/tickets/${participant.id}/${safeFileName}`);
              
              const snapshot = await uploadBytes(storageRef, file);
              const downloadUrl = await getDownloadURL(snapshot.ref);

              newTickets.push({
                  id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  name: file.name,
                  url: downloadUrl,
                  size: file.size,
                  uploadedAt: Date.now(),
                  uploadedBy: 'Bilet Operasyon'
              });
          }

          setTicketFiles(prev => [...prev, ...newTickets]);
      } catch (err) {
          console.error('Bilet yükleme hatası:', err);
          alert('Bilet PDF(leri) Firebase Storage alanına yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
      } finally {
          setIsUploading(false);
          setUploadProgress(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleFileChange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) processFiles(files);
  };

  const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) processFiles(files);
  };

  const handleSave = async () => {
      if (isSaving || isUploading) return;
      setIsSaving(true);
      try {
          const transfers = [];
          transfersInput.forEach(tr => {
              if (tr.desc || tr.plate || tr.vehicle) {
                  transfers.push({ 
                      type: 'Atanan Transfer', 
                      desc: tr.desc, 
                      vehicle: tr.vehicle, 
                      plate: tr.plate, 
                      date: tr.date ? `${tr.date}${tr.time ? ', ' + tr.time : ''}` : ''
                  });
              }
          });

          // Keep any existing flights for backwards compatibility if any
          const existingFlights = existingPart?.flights || [];
          const primaryTicket = ticketFiles.length > 0 ? ticketFiles[0] : null;
          await updateParticipantTransfers(tourId, participant.id, existingFlights, transfers, primaryTicket, ticketFiles);

          alert(ticketFiles.length > 1 
            ? `${ticketFiles.length} Adet Bilet PDF ve Transfer bilgileri başarıyla kaydedildi!` 
            : 'Bilet PDF ve Transfer bilgileri başarıyla kaydedildi!');
          onClose();
      } catch (err) {
          console.error("Kaydetme hatası:", err);
          alert('Kaydetme sırasında bir hata oluştu: ' + (err.message || 'Veritabanına kaydedilemedi.'));
      } finally {
          setIsSaving(false);
      }
  };

  const handleSaveAndNotify = async () => {
      if (isSaving || isUploading) return;
      setIsSaving(true);
      try {
          const transfers = [];
          transfersInput.forEach(tr => {
              if (tr.desc || tr.plate || tr.vehicle) {
                  transfers.push({ 
                      type: 'Atanan Transfer', 
                      desc: tr.desc, 
                      vehicle: tr.vehicle, 
                      plate: tr.plate, 
                      date: tr.date ? `${tr.date}${tr.time ? ', ' + tr.time : ''}` : ''
                  });
              }
          });

          const existingFlights = existingPart?.flights || [];
          const primaryTicket = ticketFiles.length > 0 ? ticketFiles[0] : null;
          await updateParticipantTransfers(tourId, participant.id, existingFlights, transfers, primaryTicket, ticketFiles);

          const globalUser = users.find(u => u.id === participant.id || u.email === participant.email);
          if (!globalUser) {
              alert('Bilet ve Transfer bilgileri kaydedildi, ancak kullanıcı veritabanında bulunamadığı için bildirim gönderilemedi.');
              onClose();
              return;
          }

          let emailSent = false;
          let waSent = false;
          const isChild = isUserChild(globalUser, users) || isChildEmail(globalUser.email);

          // Send Ticket Email (Çocuk kullanıcılar e-posta almaz)
          if (!isChild && canUserReceiveEmail(globalUser, users) && smtpConfig?.host && smtpConfig?.user) {
              try {
                  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
                  const res = await fetch(`${baseUrl}/api/send-ticket-email`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          ...smtpConfig,
                          to: globalUser.email,
                          participantName: globalUser.name,
                          tourName: tour?.name || '',
                          ticketPdf: primaryTicket,
                          ticketFiles: ticketFiles,
                          flights: existingFlights
                      })
                  });
                  if (res.ok) emailSent = true;
              } catch (e) {
                  console.error("Email send error for " + globalUser.name, e);
              }
          }

          // Send WhatsApp Notification (Çocuk kullanıcılara WhatsApp gitmez)
          if (!isChild && globalUser.phone && globalUser.phone !== '-') {
              try {
                  const sendWhatsAppNotification = useSettingsStore.getState().sendWhatsAppNotification;
                  await sendWhatsAppNotification(
                      globalUser.phone,
                      'ticketAddedTemplate',
                      [globalUser.name, tour?.name || '']
                  );
                  waSent = true;
              } catch (e) {
                  console.error("WhatsApp notification error for " + globalUser.name, e);
              }
          }

          let msg = 'Bilet PDF ve Transfer bilgileri başarıyla kaydedildi.';
          if (isChild) {
              msg += '\nℹ️ Çocuk profili olduğu için bildirim ebeveyn kontrolündedir (çocuğa doğrudan e-posta gönderilmez).';
          } else if (emailSent && waSent) {
              msg += '\n📧 E-posta ve 💬 WhatsApp bildirimleri müşteriye başarıyla gönderildi.';
          } else if (emailSent) {
              msg += '\n📧 E-posta bildirimi müşteriye başarıyla gönderildi.';
          } else if (waSent) {
              msg += '\n💬 WhatsApp bildirimi müşteriye başarıyla gönderildi.';
          } else {
              msg += '\n⚠️ Müşteriye bildirim gönderilemedi (E-posta veya telefon bilgilerini/ayarlarını kontrol edin).';
          }

          alert(msg);
          onClose();
      } catch (err) {
          console.error("Kaydetme hatası:", err);
          alert('Kaydetme sırasında bir hata oluştu: ' + (err.message || 'Veritabanına kaydedilemedi.'));
      } finally {
          setIsSaving(false);
      }
  };

  const updateTransfer = (id, field, value) => {
      setTransfersInput(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  
  const addTransfer = () => setTransfersInput(p => [...p, { id: Date.now(), desc: '', vehicle: '', plate: '', date: '', time: '' }]);
  const removeTransfer = (id) => setTransfersInput(p => p.filter(t => t.id !== id));

  return (
    <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        maxWidth: '480px', 
        height: '100dvh', 
        maxHeight: '100vh', 
        zIndex: 1200, 
        background: '#f8fafc', 
        display: 'flex', 
        flexDirection: 'column', 
        animation: 'slideUp 0.2s', 
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
                <div onClick={onClose} style={{ cursor: 'pointer', padding: '4px' }}>
                    <ChevronLeft size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.2 }}>Bilet PDF & Transfer Yönetimi</h2>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>{participant.name}</div>
                </div>
            </div>
        </div>

        <div style={{ 
            padding: '16px 16px calc(30px + env(safe-area-inset-bottom, 0px)) 16px', 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '14px', 
            WebkitOverflowScrolling: 'touch' 
        }}>
            
            {/* CARD 1: Havayolu Bilet PDF'leri */}
            <div style={{ 
                background: 'white', 
                borderRadius: '18px', 
                padding: '16px 14px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={15} />
                        </div>
                        <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                            Havayolu Bilet PDF'leri
                        </h3>
                    </div>
                    {ticketFiles.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                                {ticketFiles.length} Bilet
                            </span>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                style={{ 
                                    background: '#eff6ff', 
                                    color: '#2563eb', 
                                    border: '1px solid #bfdbfe', 
                                    borderRadius: '8px', 
                                    padding: '4px 8px', 
                                    fontSize: '11px', 
                                    fontWeight: '700', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    cursor: isUploading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Plus size={13} /> Ekle
                            </button>
                        </div>
                    )}
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="application/pdf" 
                    multiple
                    style={{ display: 'none' }} 
                />

                {/* Upload Progress Banner */}
                {isUploading && uploadProgress && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                            <span>PDF Yükleniyor ({uploadProgress.current}/{uploadProgress.total})...</span>
                            <span style={{ fontSize: '11px', color: '#15803d', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadProgress.fileName}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, height: '100%', background: '#16a34a', transition: 'width 0.2s' }} />
                        </div>
                    </div>
                )}

                {/* Uploaded Tickets List */}
                {ticketFiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {ticketFiles.map((ticket, idx) => (
                            <div key={ticket.id || idx} style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ticket.name}>
                                            {ticket.name}
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span>{formatFileSize(ticket.size)}</span>
                                            <span>•</span>
                                            <span>{ticket.uploadedAt ? new Date(ticket.uploadedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Yüklendi'}</span>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        background: idx === 0 ? '#ecfdf5' : '#eff6ff', 
                                        color: idx === 0 ? '#059669' : '#2563eb', 
                                        padding: '3px 7px', 
                                        borderRadius: '6px', 
                                        fontSize: '10px', 
                                        fontWeight: 'bold', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '3px', 
                                        flexShrink: 0 
                                    }}>
                                        <CheckCircle2 size={11} /> {idx === 0 ? 'Bilet #1 (Ana)' : `Bilet #${idx + 1}`}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                    <a 
                                        href={ticket.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', background: 'white', color: 'var(--primary)', border: '1px solid #e2e8f0', fontSize: '11.5px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                    >
                                        <Eye size={13} /> Görüntüle / İndir
                                    </a>
                                    <button 
                                        type="button"
                                        onClick={() => setTicketToDelete(ticket)}
                                        style={{ padding: '7px 10px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Trash2 size={12} /> Kaldır
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Dropzone button to add more */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            style={{ 
                                border: `1.5px dashed ${isDragging ? 'var(--primary)' : '#cbd5e1'}`, 
                                background: isDragging ? 'var(--primary-light)' : '#fbfcfd', 
                                borderRadius: '12px', 
                                padding: '14px', 
                                textAlign: 'center', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: 'var(--primary)',
                                fontWeight: '600',
                                fontSize: '12px'
                            }}
                        >
                            <Plus size={16} /> Başka Bilet PDF'i Ekle (veya sürükleyin)
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{ 
                            border: `1.5px dashed ${isDragging ? 'var(--primary)' : '#cbd5e1'}`, 
                            background: isDragging ? 'var(--primary-light)' : '#fafafa', 
                            borderRadius: '14px', 
                            padding: '24px 14px', 
                            textAlign: 'center', 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#FDF2F8', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={22} />
                        </div>
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '3px' }}>
                                {isUploading ? 'Bilet PDF Yükleniyor...' : "Havayolu Bilet PDF'lerini Seçin"}
                            </div>
                            <div style={{ 
                                fontSize: 'clamp(9px, 2.7vw, 11.5px)', 
                                color: 'var(--text-muted)', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                                padding: '0 4px'
                            }}>
                                Birden fazla PDF seçebilir veya buraya sürükleyebilirsiniz (Gidiş, Dönüş, Aktarma vb.)
                            </div>
                        </div>
                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '8px', fontWeight: '600' }}>
                            Maksimum dosya boyutu: 15 MB (.pdf) • Çoklu seçim desteklenir
                        </span>
                    </div>
                )}
            </div>

            {/* CARD 2: Transfer Araç Ataması */}
            <div style={{ 
                background: 'white', 
                borderRadius: '18px', 
                padding: '16px 14px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FDF2F8', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bus size={15} />
                    </div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                        Transfer Araç Ataması
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {transfersInput.map((t, idx) => (
                        <div key={t.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr', gap: '10px', position: 'relative' }}>
                            {transfersInput.length > 1 && (
                                <div onClick={() => removeTransfer(t.id)} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', color: '#ef4444', padding: '3px', borderRadius: '6px', background: '#fee2e2' }} title="Sil">
                                   <Trash2 size={13} />
                                </div>
                            )}
                            
                            <div>
                                <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Karşılama Noktası / Açıklama</label>
                                <input 
                                    type="text" 
                                    value={t.desc} 
                                    onChange={e => updateTransfer(t.id, 'desc', e.target.value)} 
                                    placeholder="Örn: Havalimanı Karşılama - Terminal 2" 
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', background: 'white', outline: 'none', boxSizing: 'border-box' }} 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Tarih</label>
                                    <input 
                                        type="date" 
                                        value={t.date} 
                                        onChange={e => updateTransfer(t.id, 'date', e.target.value)} 
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', background: 'white', outline: 'none', boxSizing: 'border-box' }} 
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Saat</label>
                                    <input 
                                        type="time" 
                                        value={t.time} 
                                        onChange={e => updateTransfer(t.id, 'time', e.target.value)} 
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', background: 'white', outline: 'none', boxSizing: 'border-box' }} 
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Araç Tipi</label>
                                    <input 
                                        type="text" 
                                        value={t.vehicle} 
                                        onChange={e => updateTransfer(t.id, 'vehicle', e.target.value)} 
                                        placeholder="Mercedes Vito" 
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', background: 'white', outline: 'none', boxSizing: 'border-box' }} 
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', marginBottom: '3px', display: 'block' }}>Plaka</label>
                                    <input 
                                        type="text" 
                                        value={t.plate} 
                                        onChange={e => updateTransfer(t.id, 'plate', e.target.value)} 
                                        placeholder="34 TRF 55" 
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', background: 'white', outline: 'none', boxSizing: 'border-box' }} 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={addTransfer} 
                    style={{ 
                        width: '100%', 
                        padding: '10px', 
                        borderRadius: '10px', 
                        background: '#f8fafc', 
                        border: '1.5px dashed #cbd5e1', 
                        color: 'var(--text-muted)', 
                        fontWeight: '600', 
                        fontSize: '11.5px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        marginTop: '2px'
                    }}
                >
                    <Plus size={15} /> Yeni Transfer Ekle
                </button>
            </div>

            {/* CARD 3: Action Buttons Card */}
            <div style={{ 
                background: 'white', 
                borderRadius: '18px', 
                padding: '14px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px' 
            }}>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving || isUploading}
                    style={{ 
                        width: '100%', 
                        padding: '11px 14px', 
                        borderRadius: '10px', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        background: (isSaving || isUploading) ? '#94a3b8' : 'var(--primary)', 
                        color: 'white', 
                        border: 'none', 
                        cursor: (isSaving || isUploading) ? 'not-allowed' : 'pointer', 
                        boxShadow: (isSaving || isUploading) ? 'none' : '0 3px 10px rgba(215, 20, 122, 0.2)',
                        transition: 'all 0.15s'
                    }}
                >
                    <Save size={15} /> {isSaving ? 'Veritabanına Kaydediliyor...' : 'Bilet PDF Ve Transfer Bilgisini Kaydet'}
                </button>

                <button 
                    onClick={handleSaveAndNotify} 
                    disabled={isSaving || isUploading}
                    style={{ 
                        width: '100%', 
                        padding: '11px 14px', 
                        borderRadius: '10px', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        background: (isSaving || isUploading) ? '#94a3b8' : '#059669', 
                        color: 'white', 
                        border: 'none', 
                        cursor: (isSaving || isUploading) ? 'not-allowed' : 'pointer', 
                        boxShadow: (isSaving || isUploading) ? 'none' : '0 3px 10px rgba(5, 150, 105, 0.2)',
                        transition: 'all 0.15s'
                    }}
                >
                    <CheckCircle2 size={15} /> {isSaving ? 'Kaydediliyor ve Bildiriliyor...' : 'Kaydet Ve Müşteriye Bildir'}
                </button>
            </div>
        </div>

        <ConfirmModal
            isOpen={!!ticketToDelete}
            title="Bilet PDF'ini Sil"
            message={`"${ticketToDelete?.name || 'Seçilen'}" bilet PDF dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
            confirmText="Evet, Sil"
            cancelText="Vazgeç"
            type="danger"
            onConfirm={() => {
                if (ticketToDelete) {
                    setTicketFiles(prev => prev.filter(t => (t.id ? t.id !== ticketToDelete.id : t.url !== ticketToDelete.url)));
                    setTicketToDelete(null);
                }
            }}
            onClose={() => setTicketToDelete(null)}
        />
    </div>
  );
}
