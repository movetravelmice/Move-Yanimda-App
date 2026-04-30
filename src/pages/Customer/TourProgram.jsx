import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Map, Clock, Camera, Coffee, Bed, Bus, PlaneLanding, Activity } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';

export default function TourProgram() {
  const navigate = useNavigate();
  const { tours } = useTourStore();
  
  const activeTour = tours.find(t => t.status === 'active');
  const programDays = activeTour?.program || [];



  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* App-like Top Header fixed for easy scrolling */}
      <div className="top-header" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: 'var(--shadow-md)', background: 'var(--primary)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div 
          style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }} 
          onClick={() => navigate(-1)}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <ChevronLeft size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
           <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Tur Programı</h2>
           <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{activeTour?.name || 'Program Detayı'}</p>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '24px' }}>
         <div style={{ position: 'relative' }}>
             {/* CSS Line behind timeline dots */}
             <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '20px', width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
             
             {programDays.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Map size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Program Henüz Hazır Değil</h3>
                    <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Seyahat uzmanınız bu tur için program detaylarını yakında yayınlayacaktır.</p>
                </div>
             )}

             {programDays.map((day, index) => (
                 <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                     {/* Timeline Dot with number */}
                     <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: day.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 0 0 4px var(--bg-color)', zIndex: 2 }}>
                        {index + 1}
                     </div>

                     {/* Content Card with Day Info */}
                     <div className="card" style={{ flex: 1, padding: '20px', margin: 0, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span style={{ fontSize: '13px', fontWeight: 'bold', color: day.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day.day}</span>
                             <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{day.date}</span>
                         </div>
                         <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-main)', lineHeight: '1.4' }}>{day.title}</h3>
                         <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                            {day.description}
                         </p>

                         {/* Day Activities List */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             {day.activities?.map((act, i) => {
                                 const ActIcon = typeof act.icon === 'function' || typeof act.icon === 'object' ? act.icon : Activity;
                                 return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9f9f9', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <ActIcon size={16} className="text-muted" />
                                        <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{act.text}</span>
                                    </div>
                                 );
                             })}
                         </div>
                     </div>
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
}
