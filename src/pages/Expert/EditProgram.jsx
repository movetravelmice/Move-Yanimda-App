import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Map, Clock, Camera, Coffee, Bed, Bus, PlaneLanding, Edit3, Plus, Save, X, Activity } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';

export default function EditProgram() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { tours, updateTourProgram } = useTourStore();
  
  const tour = tours.find(t => t.id === tourId);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'admin' || user?.role === 'ticketing';

  // Dynamic state replacing hardcoded dummy data
  const [programDays, setProgramDays] = useState(tour?.program || []);

  const [editingDay, setEditingDay] = useState(null);
  
  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Activity State
  const [newActDayId, setNewActDayId] = useState(null);
  const [newActText, setNewActText] = useState('');

  const handleEditClick = (day) => {
      setEditingDay(day);
      setEditTitle(day.title || '');
      setEditDesc(day.description || '');
  };

  const handleSaveDay = () => {
      setProgramDays(prev => prev.map(d => d.id === editingDay.id ? { ...d, title: editTitle, description: editDesc } : d));
      setEditingDay(null);
  };

  const handleAddDay = () => {
      const newDay = {
          id: Date.now(),
          day: `${programDays.length + 1}. Gün`,
          date: '',
          title: 'Yeni Program Günü',
          description: '',
          activities: [],
          color: 'var(--primary)'
      };
      setProgramDays([...programDays, newDay]);
  };

  const handleDeleteDay = () => {
      setProgramDays(prev => prev.filter(d => d.id !== editingDay.id));
      setEditingDay(null);
  };

  const saveGlobalProgram = () => {
      updateTourProgram(tourId, programDays);
      alert('Değişiklikler başarıyla kaydedildi!');
      navigate(-1);
  };

  const saveNewActivity = (dayId) => {
      if (!newActText.trim()) return;
      setProgramDays(prev => prev.map(d => {
          if (d.id === dayId) {
              return {
                  ...d,
                  activities: [...(d.activities || []), { id: Date.now(), text: newActText, icon: "Activity" }]
              };
          }
          return d;
      }));
      setNewActText('');
      setNewActDayId(null);
  };

  const removeActivity = (dayId, actId) => {
      setProgramDays(prev => prev.map(d => {
          if (d.id === dayId) {
              return { ...d, activities: d.activities.filter(a => a.id !== actId) };
          }
          return d;
      }));
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

      <div style={{ padding: '0 16px', marginTop: '24px' }}>
         <div style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '20px', width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
             
             {programDays.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Map size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Bu Turun Programı Henüz Girilmemiş</h3>
                    <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Gezi programını oluşturmaya başlamak için alttaki butondan "Yeni Gün Ekle" yapabilirsiniz.</p>
                </div>
             )}

             {programDays.map((day, index) => (
                 <div key={day.id} style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                     <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: day.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 0 0 4px var(--bg-color)', zIndex: 2 }}>
                        {index + 1}
                     </div>

                     <div className="card" style={{ flex: 1, padding: '20px', margin: 0, borderRadius: '16px', border: '1px solid transparent', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' }}>
                         
                         {/* Edit Action Button */}
                         {!isReadOnly && (
                         <div 
                            onClick={() => handleEditClick(day)}
                            style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)', transition: 'background 0.2s' }}
                         >
                            <Edit3 size={16} />
                         </div>
                         )}

                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingRight: '36px' }}>
                             <span style={{ fontSize: '13px', fontWeight: 'bold', color: day.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day.day}</span>
                             <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{day.date}</span>
                         </div>
                         <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-main)', lineHeight: '1.4', paddingRight: '20px' }}>{day.title}</h3>
                         <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                            {day.description}
                         </p>

                         {/* Day Activities List */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             {day.activities?.map((act) => {
                                 const ActIcon = typeof act.icon === 'function' || typeof act.icon === 'object' ? act.icon : Activity;
                                 return (
                                    <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9f9f9', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <ActIcon size={16} className="text-muted" />
                                          <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{act.text}</span>
                                        </div>
                                        {!isReadOnly && <X size={16} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeActivity(day.id, act.id)} />}
                                    </div>
                                 );
                             })}
                             
                             {!isReadOnly && (
                                 newActDayId === day.id ? (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <input 
                                           type="text" 
                                           value={newActText}
                                           onChange={e => setNewActText(e.target.value)}
                                           onKeyDown={e => e.key === 'Enter' && saveNewActivity(day.id)}
                                           placeholder="Örn: 08:30 Otelde Kahvaltı"
                                           style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                                           autoFocus
                                        />
                                        <button onClick={() => saveNewActivity(day.id)} style={{ padding: '0 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Ekle</button>
                                    </div>
                                 ) : (
                                    <div onClick={() => setNewActDayId(day.id)} style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '4px', background: '#fcfcfc' }}>
                                       <Plus size={16} /> Yeni Aktivite Ekle
                                    </div>
                                 )
                             )}
                         </div>
                     </div>
                 </div>
             ))}

             {/* Add Day Button */}
             {!isReadOnly && (
             <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', position: 'relative', zIndex: 1, cursor: 'pointer' }} onClick={handleAddDay}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'white', border: '2px dashed var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', zIndex: 2 }}>
                    <Plus size={18} />
                </div>
                <div style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                    Programa Yeni Gün Ekle
                </div>
             </div>
             )}

         </div>
      </div>

      {/* Save Global Changes Bottom Bar */}
      {!isReadOnly && (
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', padding: '16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', zIndex: 100 }}>
         <button className="btn-primary" onClick={saveGlobalProgram} style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <Save size={20} /> Değişiklikleri Yayınla
         </button>
      </div>
      )}

      {/* Fullscreen Editing Overlay */}
      {editingDay && (
         <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', height: '100%', background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', overflowY: 'auto' }}>
            <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{editingDay.day} Düzenle</h3>
                <div onClick={() => setEditingDay(null)} style={{ cursor: 'pointer', background: '#f1f5f9', padding: '6px', borderRadius: '50%' }}>
                    <X size={20} color="var(--text-muted)" />
                </div>
            </div>
            
            <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Gün Başlığı</label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15px', background: '#f8fafc' }} />
                </div>
                
                <div style={{ marginBottom: 'auto' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Açıklama (Günün Özeti)</label>
                    <textarea rows="6" value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15px', resize: 'none', minHeight: '160px', background: '#f8fafc' }}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                   <button onClick={handleDeleteDay} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: '#fef2f2', color: '#ef4444', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Günü Sil</button>
                   <button onClick={handleSaveDay} style={{ flex: 2, padding: '16px', borderRadius: '14px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Güncelle</button>
                </div>
            </div>
         </div>
      )}

    </div>
  );
}
