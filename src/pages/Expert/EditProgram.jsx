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
  CheckCircle2
} from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';

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
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', background: 'white', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', alignItems: 'center' }}>
                <select
                    value={activeSize}
                    onChange={(e) => {
                        execCmd('fontSize', e.target.value);
                        setActiveSize(e.target.value);
                    }}
                    style={{ 
                        height: '32px',
                        padding: '0 8px', 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        background: 'white', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        outline: 'none', 
                        minWidth: '110px' 
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

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} />

                <button
                    type="button"
                    onClick={() => execCmd('bold')}
                    style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        border: isBold ? '1px solid var(--primary)' : '1px solid #e2e8f0', 
                        background: isBold ? 'var(--primary-light)' : 'white', 
                        color: isBold ? 'var(--primary)' : 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s' 
                    }}
                    title="Kalın (Bold)"
                >
                    <Bold size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCmd('italic')}
                    style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        border: isItalic ? '1px solid var(--primary)' : '1px solid #e2e8f0', 
                        background: isItalic ? 'var(--primary-light)' : 'white', 
                        color: isItalic ? 'var(--primary)' : 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s' 
                    }}
                    title="İtalik (Italic)"
                >
                    <Italic size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCmd('underline')}
                    style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        border: isUnderline ? '1px solid var(--primary)' : '1px solid #e2e8f0', 
                        background: isUnderline ? 'var(--primary-light)' : 'white', 
                        color: isUnderline ? 'var(--primary)' : 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s' 
                    }}
                    title="Altı Çizili (Underline)"
                >
                    <Underline size={16} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} />

                <button
                    type="button"
                    onClick={() => execCmd('insertUnorderedList')}
                    style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        background: 'white', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s' 
                    }}
                    title="Madde İşaretli Liste (Bullets)"
                >
                    <List size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => execCmd('insertOrderedList')}
                    style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        background: 'white', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s' 
                    }}
                    title="Numaralı Liste (Numbers)"
                >
                    <ListOrdered size={16} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 2px' }} />

                <button
                    type="button"
                    onClick={() => execCmd('removeFormat')}
                    style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        border: '1px solid #fee2e2', 
                        background: '#fef2f2', 
                        color: '#ef4444', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.15s', 
                        marginLeft: 'auto' 
                    }}
                    title="Biçimlendirmeyi Temizle"
                >
                    <Trash2 size={16} />
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
    <div style={{ paddingBottom: '90px', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative' }}>
      
      {/* Header */}
      <div className="top-header" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: 'var(--shadow-md)', background: 'var(--primary)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div 
          style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }} 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
           <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{isReadOnly ? 'Tur Programı' : 'Programı Düzenle'}</h2>
           <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{tour.name}</p>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '20px' }}>
          {isReadOnly ? (
              <div className="card rich-text-content" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', background: 'white' }} dangerouslySetInnerHTML={{ __html: programText || '<p style="text-align:center;color:var(--text-muted);">Bu seyahatin programı henüz girilmemiş.</p>' }} />
          ) : (
              <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '4px' }}>
                      <Edit3 size={18} color="var(--primary)" />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Program Detayları</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', paddingLeft: '4px', lineHeight: '1.4' }}>
                      Tur programını dilediğiniz gibi yazın, kalınlaştırın, boyutunu ayarlayın veya Word'den kopyalayıp yapıştırın. Değişiklikler bittikten sonra aşağıdaki butona tıklayın.
                  </p>
                  <RichTextEditor value={programText} onChange={setProgramText} placeholder="Tüm tur programını buraya yazın veya yapıştırın..." />
              </div>
          )}
      </div>

      {/* Save Global Changes Bottom Bar */}
      {!isReadOnly && (
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', padding: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', zIndex: 100 }}>
         <button className="btn-primary" onClick={saveGlobalProgram} style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <Save size={20} /> Değişiklikleri Yayınla
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

    </div>
  );
}
