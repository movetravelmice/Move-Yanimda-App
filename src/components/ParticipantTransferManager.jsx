import React, { useState, useEffect } from 'react';
import { ChevronLeft, PlaneTakeoff, PlaneLanding, Save, Bus, Plus, Trash2 } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';

export default function ParticipantTransferManager({ tourId, participant, onClose }) {
  const { tours, updateParticipantTransfers } = useTourStore();
  const { smtpConfig } = useSettingsStore();
  const { users } = useUserStore();
  const tour = tours.find(t => t.id === tourId);
  const existingPart = tour?.participants.find(p => p.id === participant.id);

  const majorAirlines = [
      "Turkish Airlines", "Pegasus", "SunExpress", "AnadoluJet", "Corendon",
      "Lufthansa", "Emirates", "Qatar Airways", "Air France", "KLM", "British Airways", "Diğer"
  ];

  const [flightsInput, setFlightsInput] = useState([]);
  const [transfersInput, setTransfersInput] = useState([
     { id: Date.now(), desc: '', vehicle: '', plate: '', date: '', time: '' }
  ]);

  useEffect(() => {
    if (existingPart?.flights?.length > 0) {
       setFlightsInput(existingPart.flights.map(f => ({ ...f, cabinClass: f.cabinClass || 'Ekonomi', id: Math.random() })));
    } else {
       // Start with one empty departure flight for convenience
       setFlightsInput([
         { id: Date.now(), type: 'Gidiş Uçuşu', airline: '', from: '', to: '', flightNo: '', date: '', departureTime: '', arrivalTime: '', pnr: '', ticketNo: '', cabinClass: 'Ekonomi' }
       ]);
    }
    
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

  const getAirlineColor = (name) => {
      const n = (name || '').toLowerCase();
      if (n.includes('turkish') || n.includes('thy')) return '#C3002F'; // THY Red
      if (n.includes('pegasus')) return '#FFC600'; // Pegasus Yellow
      if (n.includes('sunexpress')) return '#0055A5'; // SunExpress Blue
      if (n.includes('anadolu')) return '#1D1A53'; // AnadoluJet Dark Blue
      if (n.includes('corendon')) return '#E3000F'; // Corendon Red
      if (n.includes('lufthansa')) return '#05164D'; // Lufthansa Navy
      if (n.includes('emirates')) return '#D71920'; // Emirates Red
      if (n.includes('qatar')) return '#5C0632'; // Qatar Maroon
      if (n.includes('air france')) return '#002157'; // Air France Navy
      if (n.includes('klm')) return '#00A1DE'; // KLM Light Blue
      if (n.includes('british')) return '#075AAA'; // British Airways Blue
      return 'var(--primary)';
  };

  const handleSave = () => {
      const flightsToSave = flightsInput.filter(f => f.pnr || f.ticketNo || f.flightNo || f.airline || f.from || f.to).map(f => ({
          type: f.type,
          airline: f.airline,
          airlineColor: getAirlineColor(f.airline),
          from: f.from,
          to: f.to,
          flightNo: f.flightNo,
          date: f.date,
          departureTime: f.departureTime,
          arrivalTime: f.arrivalTime,
          pnr: f.pnr,
          ticketNo: f.ticketNo,
          cabinClass: f.cabinClass || 'Ekonomi',
          icon: f.type === 'Gidiş Uçuşu' ? 'takeoff' : 'landing'
      }));
      
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

      updateParticipantTransfers(tourId, participant.id, flightsToSave, transfers);
      
      // Trigger Notifications
      if (flightsToSave.length > 0) {
          const globalUser = users.find(u => u.id === participant.id) || participant;
          if (globalUser) {
              if (smtpConfig?.host && smtpConfig?.user && globalUser.email && globalUser.email.includes('@')) {
                  try {
                      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://move-yanimda.web.app';
                      fetch(`${baseUrl}/api/send-ticket-email`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              ...smtpConfig,
                              to: globalUser.email,
                              participantName: participant.name,
                              tourName: tour?.name || '',
                              flights: flightsToSave
                          })
                      });
                  } catch (e) { console.error("Ticket email error", e); }
              }

              if (globalUser.phone && globalUser.phone !== '-') {
                  useSettingsStore.getState().sendWhatsAppNotification(
                      globalUser.phone,
                      'ticketAddedTemplate',
                      [participant.name, tour?.name || '', flightsToSave[0]?.airline || '-', flightsToSave[0]?.flightNo || '-', flightsToSave[0]?.pnr || '-']
                  );
              }
          }
      }

      alert('Uçuş ve Transfer bilgileri başarıyla atandı!');
      onClose();
  };

  const updateFlight = (id, field, value) => {
      setFlightsInput(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  
  const addFlight = () => setFlightsInput(p => [...p, { id: Date.now(), type: 'Gidiş Uçuşu', airline: '', from: '', to: '', flightNo: '', date: '', departureTime: '', arrivalTime: '', pnr: '', ticketNo: '', cabinClass: 'Ekonomi' }]);
  const removeFlight = (id) => setFlightsInput(p => p.filter(f => f.id !== id));

  const updateTransfer = (id, field, value) => {
      setTransfersInput(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  
  const addTransfer = () => setTransfersInput(p => [...p, { id: Date.now(), desc: '', vehicle: '', plate: '', date: '', time: '' }]);
  const removeTransfer = (id) => setTransfersInput(p => p.filter(t => t.id !== id));

  const renderLiveTicketPreview = (flight) => {
      if (!flight.pnr && !flight.ticketNo && !flight.flightNo) return null;
      const bgCol = getAirlineColor(flight.airline);
      return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', marginBottom: '16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ backgroundColor: bgCol, color: '#FFFFFF', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>{flight.from || '???'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{flight.airline ? flight.airline.toUpperCase() : 'HAVAYOLU'}</span>
                    {flight.type === 'Gidiş Uçuşu' ? <PlaneTakeoff size={20} /> : <PlaneLanding size={20} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>{flight.to || '???'}</span>
                </div>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', background: 'var(--surface)', flexWrap: 'wrap', gap: '12px' }}>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>UÇUŞ</div><div style={{ fontSize: '13px', fontWeight: 'bold' }}>{flight.flightNo || '-'}</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TARİH</div><div style={{ fontSize: '13px', fontWeight: 'bold' }}>{flight.date || '-'} {flight.departureTime || '-'} - {flight.arrivalTime || '-'}</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PNR</div><div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>{flight.pnr || '-'}</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BİLET NO</div><div style={{ fontSize: '13px', fontWeight: 'bold' }}>{flight.ticketNo || '-'}</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SINIF</div><div style={{ fontSize: '13px', fontWeight: 'bold', color: flight.cabinClass === 'Business' ? 'var(--primary)' : 'var(--text-main)' }}>{flight.cabinClass || 'Ekonomi'}</div></div>
            </div>
        </div>
      );
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, background: '#f8fafc', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.2s' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div onClick={onClose} style={{ cursor: 'pointer', padding: '4px' }}>
                    <ChevronLeft size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px' }}>Uçuş ve Transferler</h2>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{participant.name}</div>
                </div>
            </div>
        </div>

        <div style={{ padding: '20px 16px' }}>
            
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <PlaneTakeoff size={18} /> Uçuş Biletleri Defteri
            </h3>

            {flightsInput.map((flight, index) => (
               <div key={flight.id} style={{ position: 'relative' }}>
                   {flightsInput.length > 1 && (
                        <div onClick={() => removeFlight(flight.id)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: '#ef4444', padding: '4px', zIndex: 5 }}>
                           <Trash2 size={16} />
                        </div>
                    )}
                   {renderLiveTicketPreview(flight)}
                   <div style={{ background: 'white', padding: '16px', paddingTop: flightsInput.length > 1 ? '36px' : '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Uçuş Yönü</label>
                            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                <div 
                                    onClick={() => updateFlight(flight.id, 'type', 'Gidiş Uçuşu')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: flight.type === 'Gidiş Uçuşu' ? 'white' : 'transparent', color: flight.type === 'Gidiş Uçuşu' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', boxShadow: flight.type === 'Gidiş Uçuşu' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                >
                                    <PlaneTakeoff size={16} /> Gidiş Uçuşu
                                </div>
                                <div 
                                    onClick={() => updateFlight(flight.id, 'type', 'Dönüş Uçuşu')}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: flight.type === 'Dönüş Uçuşu' ? 'white' : 'transparent', color: flight.type === 'Dönüş Uçuşu' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', boxShadow: flight.type === 'Dönüş Uçuşu' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                                >
                                    <PlaneLanding size={16} /> Dönüş Uçuşu
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Havayolu</label>
                            <select value={flight.airline} onChange={e => updateFlight(flight.id, 'airline', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}>
                                <option value="">Seçim Yapın...</option>
                                {majorAirlines.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Bilet Sınıfı</label>
                            <select value={flight.cabinClass || 'Ekonomi'} onChange={e => updateFlight(flight.id, 'cabinClass', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}>
                                <option value="Ekonomi">Ekonomi</option>
                                <option value="Business">Business</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Kalkış (IST vb.)</label>
                            <input type="text" value={flight.from} onChange={e => updateFlight(flight.id, 'from', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', textTransform: 'uppercase' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Varış (CDG vb.)</label>
                            <input type="text" value={flight.to} onChange={e => updateFlight(flight.id, 'to', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', textTransform: 'uppercase' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Uçuş Kodu</label>
                            <input type="text" value={flight.flightNo} onChange={e => updateFlight(flight.id, 'flightNo', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="TK 1821" />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>PNR</label>
                            <input type="text" value={flight.pnr} onChange={e => updateFlight(flight.id, 'pnr', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', textTransform: 'uppercase', fontWeight: 'bold' }} placeholder="WX93AB" />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Bilet No</label>
                            <input type="text" value={flight.ticketNo} onChange={e => updateFlight(flight.id, 'ticketNo', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="2352xxxxxxx" />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Tarih</label>
                            <input type="date" value={flight.date} onChange={e => updateFlight(flight.id, 'date', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Kalkış Saati</label>
                            <input type="time" value={flight.departureTime} onChange={e => updateFlight(flight.id, 'departureTime', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Varış Saati</label>
                            <input type="time" value={flight.arrivalTime} onChange={e => updateFlight(flight.id, 'arrivalTime', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                   </div>
               </div>
            ))}

            <button onClick={addFlight} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'transparent', border: '2px dashed var(--border-color)', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }}>
                <Plus size={18} /> Yeni Uçuş Ekle
            </button>

            {/* Transfer settings */}
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <Bus size={18} /> Transfer Araç Ataması
            </h3>
            
            {transfersInput.map((t, idx) => (
                <div key={t.id} style={{ background: 'white', padding: '16px', paddingTop: transfersInput.length > 1 ? '36px' : '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px', position: 'relative' }}>
                    {transfersInput.length > 1 && (
                        <div onClick={() => removeTransfer(t.id)} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                           <Trash2 size={16} />
                        </div>
                    )}
                    
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Karşılama Noktası / Açıklama</label>
                        <input type="text" value={t.desc} onChange={e => updateTransfer(t.id, 'desc', e.target.value)} placeholder="Örn: Havalimanı Karşılama - Terminal 2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Tarih</label>
                            <input type="date" value={t.date} onChange={e => updateTransfer(t.id, 'date', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Saat</label>
                            <input type="time" value={t.time} onChange={e => updateTransfer(t.id, 'time', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Araç Tipi</label>
                            <input type="text" value={t.vehicle} onChange={e => updateTransfer(t.id, 'vehicle', e.target.value)} placeholder="Mercedes Vito" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Plaka</label>
                            <input type="text" value={t.plate} onChange={e => updateTransfer(t.id, 'plate', e.target.value)} placeholder="34 TRF 55" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        </div>
                    </div>
                </div>
            ))}

            <button onClick={addTransfer} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'transparent', border: '2px dashed var(--border-color)', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px', cursor: 'pointer' }}>
                <Plus size={18} /> Yeni Transfer Ekle
            </button>

            <button className="btn-primary" onClick={handleSave} style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <Save size={20} /> Bilgileri Müşteriye Yayınla
            </button>
            <div style={{height: '40px'}}></div>
        </div>
    </div>
  );
}
