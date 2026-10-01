import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Edit3, 
  Save, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Trash2,
  CheckCircle2,
  Paperclip,
  Download
} from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';
import ConfirmModal from '../../components/ConfirmModal';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const editorRef = React.useRef(null);
    const [activeSize, setActiveSize] = useState('3');
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    const execCmd = (command, arg = null) => {
        document.execCommand(command, false, arg);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        updateToolbarStates();
    };

    const updateToolbarStates = () => {
        if (typeof window === 'undefined') return;
        try {
            const size = document.queryCommandValue('fontSize');
            if (size) {
                setActiveSize(size);
            } else {
                setActiveSize('3');
            }
            setIsBold(document.queryCommandState('bold'));
            setIsItalic(document.queryCommandState('italic'));
            setIsUnderline(document.queryCommandState('underline'));
        } catch (e) {
            // Ignore if query fails
        }
    };

    React.useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    React.useEffect(() => {
        updateToolbarStates();
        
        const handleSelectionChange = () => {
            if (document.activeElement === editorRef.current) {
                updateToolbarStates();
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', overflow: 'hidden' }}>
            {/* Toolbar (Single Line Responsive) */}
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '3px', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                <select
                    value={activeSize}
                    onChange={(e) => {
                        execCmd('fontSize', e.target.value);
                        setActiveSize(e.target.value);
                    }}
                    style={{ 
                        height: '28px',
                        padding: '0 4px', 
                        borderRadius: '6px', 
                        border: '1px solid #cbd5e1', 
                        background: 'white', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        outline: 'none', 
                        flexShrink: 0,
                        width: '88px' 
                    }}
                    title="Yazı Boyutu"
                >
                    <option value="1">11px (Çok Küçük)</option>
                    <option value="2">13px (Küçük)</option>
                    <option value="3">15px (Normal)</option>
                    <option value="4">17px (Orta)</option>
                    <option value="5">20px (Büyük)</option>
                    <option value="6">25px (Çok Büyük)</option>
                    <option value="7">32px (Devasa)</option>
                </select>

                <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 1px', flexShrink: 0 }} />

                <button
                    type="button"
                    onClick={() => execCmd('bold')}
                    style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        border: isBold ? '1px solid var(--primary)' : '1px solid #e2e8f0', 
                        background: isBold ? 'var(--primary-light)' : 'white', 
                        color: isBold ? 'var(--primary)' : 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s',
                        flexShrink: 0 
                    }}
                    title="Kalın (Bold)"
                >
                    <Bold size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => execCmd('italic')}
                    style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        border: isItalic ? '1px solid var(--primary)' : '1px solid #e2e8f0', 
                        background: isItalic ? 'var(--primary-light)' : 'white', 
                        color: isItalic ? 'var(--primary)' : 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s',
                        flexShrink: 0 
                    }}
                    title="İtalik (Italic)"
                >
                    <Italic size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => execCmd('underline')}
                    style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        border: isUnderline ? '1px solid var(--primary)' : '1px solid #e2e8f0', 
                        background: isUnderline ? 'var(--primary-light)' : 'white', 
                        color: isUnderline ? 'var(--primary)' : 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s',
                        flexShrink: 0 
                    }}
                    title="Altı Çizili (Underline)"
                >
                    <Underline size={14} />
                </button>

                <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 1px', flexShrink: 0 }} />

                <button
                    type="button"
                    onClick={() => execCmd('insertUnorderedList')}
                    style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        border: '1px solid #e2e8f0', 
                        background: 'white', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s',
                        flexShrink: 0 
                    }}
                    title="Madde İşaretli Liste (Bullets)"
                >
                    <List size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => execCmd('insertOrderedList')}
                    style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        border: '1px solid #e2e8f0', 
                        background: 'white', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s',
                        flexShrink: 0 
                    }}
                    title="Numaralı Liste (Numbers)"
                >
                    <ListOrdered size={14} />
                </button>

                <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 1px', flexShrink: 0 }} />

                <button
                    type="button"
                    onClick={() => execCmd('removeFormat')}
                    style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        border: '1px solid #fee2e2', 
                        background: '#fef2f2', 
                        color: '#ef4444', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s', 
                        marginLeft: 'auto',
                        flexShrink: 0 
                    }}
                    title="Biçimlendirmeyi Temizle"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable={true}
                className="rich-text-content"
                placeholder={placeholder}
                onInput={(e) => {
                    onChange(e.currentTarget.innerHTML);
                    updateToolbarStates();
                }}
                onKeyUp={updateToolbarStates}
                onMouseUp={updateToolbarStates}
                onFocus={updateToolbarStates}
                style={{
                    padding: '18px',
                    minHeight: '400px',
                    maxHeight: '600px',
                    overflowY: 'auto',
                    outline: 'none',
                    background: 'white',
                    fontSize: '14.5px',
                    lineHeight: '1.6',
                    textAlign: 'left'
                }}
            />
        </div>
    );
};

export default function EditProgram() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { tours, updateTourProgram } = useTourStore();
  
  const tour = tours.find(t => t.id === tourId);
  const { user } = useAuthStore();
  const isReadOnly = user?.role === 'admin' || user?.role === 'ticketing';

  const getInitialProgramText = () => {
      if (!tour?.program) return '';
      if (typeof tour.program === 'string') return tour.program;
      if (Array.isArray(tour.program)) {
          return tour.program.map((d, index) => `
              <h3><strong>${d.day || `${index + 1}. Gün`}: ${d.title || ''}</strong></h3>
              <p>${d.description || ''}</p>
              ${d.activities && d.activities.length > 0 ? `
                  <ul>
                      ${d.activities.map(a => `<li>${a.text}</li>`).join('')}
                  </ul>
              ` : ''}
              <br/>
          `).join('');
      }
      return '';
  };

  const [programText, setProgramText] = useState(getInitialProgramText());
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e) => {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length === 0) return;
      
      setUploadingFiles(true);
      try {
          const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const { storage } = await import('../../lib/firebase');
          const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
          const { db } = await import('../../lib/firebase');
          
          for (const file of selectedFiles) {
              const ext = file.name.split('.').pop().toLowerCase();
              const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
              if (!allowed.includes(ext)) {
                  alert(`Geçersiz dosya uzantısı: .${ext}. Sadece PDF, Word ve Excel yüklenebilir.`);
                  continue;
              }

              const fileRef = ref(storage, `tour_attachments/${tourId}/${Date.now()}_${file.name}`);
              const snapshot = await uploadBytes(fileRef, file);
              const downloadURL = await getDownloadURL(snapshot.ref);
              
              const fileMeta = {
                  name: file.name,
                  url: downloadURL,
                  ext: ext,
                  size: formatFileSize(file.size),
                  uploadedAt: Date.now()
              };
              
              await updateDoc(doc(db, 'tours', tourId), {
                  programFiles: arrayUnion(fileMeta)
              });
          }
      } catch (err) {
          console.error("Dosya yükleme hatası:", err);
          alert("Dosya yüklenirken bir hata oluştu: " + err.message);
      } finally {
          setUploadingFiles(false);
          e.target.value = '';
      }
  };

  const handleFileDelete = (fileMeta) => {
      setFileToDelete(fileMeta);
  };

  const confirmFileDelete = async () => {
      if (!fileToDelete) return;
      setIsDeletingFile(true);
      try {
          const { ref, deleteObject } = await import('firebase/storage');
          const { storage } = await import('../../lib/firebase');
          const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
          const { db } = await import('../../lib/firebase');
          
          try {
              const fileRef = ref(storage, fileToDelete.url);
              await deleteObject(fileRef);
          } catch (err) {
              console.error("Storage delete failed, continuing firestore remove:", err);
          }
          
          await updateDoc(doc(db, 'tours', tourId), {
              programFiles: arrayRemove(fileToDelete)
          });
          setFileToDelete(null);
      } catch (err) {
          console.error("Dosya silme hatası:", err);
      } finally {
          setIsDeletingFile(false);
      }
  };

  const renderAttachments = (isEditable = false) => {
      const files = tour?.programFiles || [];
      if (files.length === 0 && !isEditable) return null;

      const getFileIcon = (ext) => {
          switch (ext) {
              case 'pdf': return { color: '#ef4444', label: 'PDF' };
              case 'xls':
              case 'xlsx': return { color: '#10b981', label: 'Excel' };
              case 'doc':
              case 'docx': return { color: '#3b82f6', label: 'Word' };
              default: return { color: '#6b7280', label: 'Dosya' };
          }
      };

      return (
          <div style={{ marginTop: '24px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Paperclip size={18} color="var(--primary)" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Ekli Belgeler ve Dosyalar</span>
              </div>

              {isEditable && (
                  <div style={{ marginBottom: '20px' }}>
                      <label 
                          style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '8px', 
                              padding: '12px', 
                              borderRadius: '10px', 
                              border: '2px dashed var(--border-color)', 
                              background: '#f8fafc',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: 'var(--text-muted)',
                              transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                          <Paperclip size={16} />
                          {uploadingFiles ? 'Yükleniyor...' : 'Ek Dosya Yükle (.pdf, .doc, .xls)'}
                          <input 
                              type="file" 
                              multiple 
                              accept=".pdf,.doc,.docx,.xls,.xlsx" 
                              onChange={handleFileUpload} 
                              disabled={uploadingFiles}
                              style={{ display: 'none' }} 
                          />
                      </label>
                  </div>
              )}

              {files.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      Henüz ek dosya yüklenmemiş.
                  </div>
              ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {files.map((file, idx) => {
                          const iconInfo = getFileIcon(file.ext);
                          return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconInfo.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconInfo.color, fontWeight: 'bold', fontSize: '10px', flexShrink: 0 }}>
                                      {iconInfo.label}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                                          {file.name}
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          {file.size}
                                      </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                      <a 
                                          href={file.url} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          download={file.name}
                                          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'none' }}
                                      >
                                          <Download size={14} />
                                      </a>
                                      {isEditable && (
                                          <button 
                                              onClick={() => handleFileDelete(file)}
                                              style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  const saveGlobalProgram = () => {
      updateTourProgram(tourId, programText);
      setShowSuccessPopup(true);
      setTimeout(() => {
          setShowSuccessPopup(false);
          navigate(-1);
      }, 2000);
  };

  if (!tour) return <div style={{padding:'20px'}}>Tur bulunamadı</div>;

  return (
    <div style={{ paddingBottom: '180px', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative' }}>
      
      {/* Header */}
      <div className="top-header" style={{ padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 16px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px', borderRadius: '0px', boxShadow: 'var(--shadow-md)', background: 'var(--primary)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div 
          style={{ width: '34px', height: '34px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} 
          onClick={() => navigate(-1)}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <ChevronLeft size={19} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
           <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, letterSpacing: '-0.2px', lineHeight: 1.2 }}>{isReadOnly ? 'Tur Programı' : 'Programı Düzenle'}</h2>
           <p style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tour.name}</p>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '16px' }}>
          {isReadOnly ? (
              <div>
                  <div className="card rich-text-content customer-program-content" style={{ padding: '20px 16px', borderRadius: '16px', boxShadow: '0 4px 18px rgba(0,0,0,0.04)', border: '1px solid #edf2f7', background: 'white' }} dangerouslySetInnerHTML={{ __html: programText || '<p style="text-align:center;color:var(--text-muted);">Bu seyahatin programı henüz girilmemiş.</p>' }} />
                  {renderAttachments(false)}
              </div>
          ) : (
              <div>
                  {/* Program Details Card */}
                  <div style={{ 
                    background: '#ffffff', 
                    borderRadius: '16px', 
                    border: '1px solid #edf2f7', 
                    boxShadow: '0 4px 18px rgba(0,0,0,0.04)', 
                    padding: '16px', 
                    marginBottom: '16px' 
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Edit3 size={15} color="var(--primary)" />
                          </div>
                          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', letterSpacing: '-0.2px' }}>Program Detayları</span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '14px', lineHeight: '1.45', margin: '0 0 14px 0' }}>
                          Tur programını dilediğiniz gibi yazın, kalınlaştırın, boyutunu ayarlayın veya Word'den kopyalayıp yapıştırın. Değişiklikler bittikten sonra aşağıdaki butona tıklayın.
                      </p>
                      <RichTextEditor value={programText} onChange={setProgramText} placeholder="Tüm tur programını buraya yazın veya yapıştırın..." />
                  </div>
                  {renderAttachments(true)}
              </div>
          )}
      </div>

      {/* Save Global Changes Bottom Bar */}
      {!isReadOnly && (
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        maxWidth: '480px', 
        background: '#ffffff', 
        padding: '12px 16px calc(84px + env(safe-area-inset-bottom, 12px)) 16px', 
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', 
        borderTop: '1px solid #f1f5f9',
        zIndex: 90 
      }}>
         <button className="btn-primary" onClick={saveGlobalProgram} style={{ width: '100%', padding: '13px', borderRadius: '14px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.25)' }}>
             <Save size={19} /> Değişiklikleri Yayınla
         </button>
      </div>
      )}

      {/* Custom Success Popup */}
      {showSuccessPopup && (
          <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.6)', 
              zIndex: 9999, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '24px', 
              backdropFilter: 'blur(4px)' 
          }}>
              <div className="card" style={{ 
                  width: '100%', 
                  maxWidth: '340px', 
                  padding: '32px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  background: 'white',
                  borderRadius: '24px',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
              }}>
                  <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '50%', 
                      background: '#ecfdf5', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginBottom: '16px' 
                  }}>
                      <CheckCircle2 size={32} color="#10b981" />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)', textAlign: 'center' }}>Başarılı</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                      Değişiklikler başarıyla kaydedildi!
                  </p>
                  <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                      Yönlendiriliyorsunuz...
                  </div>
              </div>
          </div>
      )}

      <ConfirmModal
        isOpen={Boolean(fileToDelete)}
        title="Dosyayı Sil"
        message={`"${fileToDelete?.name}" dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        type="danger"
        isLoading={isDeletingFile}
        onConfirm={confirmFileDelete}
        onClose={() => setFileToDelete(null)}
      />
    </div>
  );
}
