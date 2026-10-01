import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Map, Clock, Camera, Coffee, Bed, Bus, PlaneLanding, Activity, Paperclip, Download } from 'lucide-react';
import { useTourStore, isTourActive } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';

export default function TourProgram() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { tours } = useTourStore();
  const { user } = useAuthStore();
  
  // Find the tour from all tours first if tourId is provided, fallback to active tour participant check
  const activeTour = tourId 
    ? tours.find(t => t.id === tourId) 
    : (tours.find(t => isTourActive(t) && t.participants?.some(p => p.id === user?.id || p.email === user?.email)) || tours.find(t => t.participants?.some(p => p.id === user?.id || p.email === user?.email)));

  const hasProgram = activeTour && activeTour.program && (
      (typeof activeTour.program === 'string' && activeTour.program.trim().length > 0) || 
      (Array.isArray(activeTour.program) && activeTour.program.length > 0)
  );

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* App-like Top Header fixed for easy scrolling */}
      <div className="top-header" style={{ padding: 'calc(19px + env(safe-area-inset-top, 0px)) 18px 19px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px', borderRadius: '0px', boxShadow: 'var(--shadow-md)', background: 'var(--primary)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div 
          style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }} 
          onClick={() => navigate(-1)}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <ChevronLeft size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
           <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Tur Programı</h2>
           <p style={{ fontSize: '11px', opacity: 0.9, marginTop: '1px' }}>{activeTour?.name || 'Program Detayı'}</p>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '20px' }}>
          {hasProgram ? (
              typeof activeTour.program === 'string' ? (
                  <div className="card rich-text-content customer-program-content" style={{ padding: '20px 16px', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', background: 'white', border: '1px solid #e2e8f0' }} dangerouslySetInnerHTML={{ __html: activeTour.program }} />
              ) : Array.isArray(activeTour.program) ? (
                  <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '20px', width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
                      {activeTour.program.filter(Boolean).map((day, index) => (
                          <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: day.color || 'var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 0 0 4px var(--bg-color)', zIndex: 2 }}>
                                 {index + 1}
                              </div>
                              <div className="card" style={{ flex: 1, padding: '16px', margin: 0, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: day.color || 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day.day}</span>
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{day.date}</span>
                                  </div>
                                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)', lineHeight: '1.35' }}>{day.title}</h3>
                                  <div className="rich-text-content customer-program-content" style={{ color: 'var(--text-main)', marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: day.description || '' }} />
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {Array.isArray(day.activities) && day.activities.filter(Boolean).map((act, i) => {
                                          const isObj = act && typeof act === 'object';
                                          const ActIcon = isObj && (typeof act.icon === 'function' || typeof act.icon === 'object') ? act.icon : Activity;
                                          const text = isObj ? act.text : (typeof act === 'string' ? act : '');
                                          return (
                                             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9f9f9', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                 <ActIcon size={16} className="text-muted" />
                                                 <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{text}</span>
                                             </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : null
          ) : (
             <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                 <Map size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                 <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Program Henüz Hazır Değil</h3>
                 <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Seyahat uzmanınız bu tur için program detaylarını yakında yayınlayacaktır.</p>
             </div>
          )}

          {activeTour?.programFiles && activeTour.programFiles.length > 0 && (
              <div style={{ marginTop: '24px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Paperclip size={18} color="var(--primary)" />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Ekli Belgeler ve Dosyalar (Ekler)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeTour.programFiles.map((file, idx) => {
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
                          const iconInfo = getFileIcon(file.ext);
                          return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconInfo.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconInfo.color, fontWeight: 'bold', fontSize: '10px', flexShrink: 0 }}>
                                      {iconInfo.label}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {file.name}
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          {file.size}
                                      </div>
                                  </div>
                                  <a 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      download={file.name}
                                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'none' }}
                                  >
                                      <Download size={14} />
                                  </a>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
