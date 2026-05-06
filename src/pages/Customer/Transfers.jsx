import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, PlaneTakeoff, PlaneLanding, MapPin, Bus, CalendarClock } from 'lucide-react';
import { useTourStore } from '../../store/tourStore';
import { useAuthStore } from '../../store/authStore';

export default function Transfers() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { tours } = useTourStore();
  const { user } = useAuthStore();

  const myTours = tours.filter(t => t.participants?.some(p => p.id === user?.id || p.email === user?.email));
  const activeTour = tourId ? myTours.find(t => t.id === tourId) : myTours.find(t => t.status === 'active');
  
  // Find primary user and their linked family members
  const myParticipant = activeTour?.participants?.find(p => p.id === user?.id || p.email === user?.email);
  const familyParticipants = activeTour?.participants?.filter(p => p.linkedTo && (Array.isArray(p.linkedTo) ? (p.linkedTo.includes(user?.id) || p.linkedTo.includes(myParticipant?.id)) : (p.linkedTo === user?.id || p.linkedTo === myParticipant?.id))) || [];
  
  const allRelatedParticipants = myParticipant ? [myParticipant, ...familyParticipants] : [...familyParticipants];

  // Combine flights and add passenger names
  let combinedFlights = [];
  let combinedTransfers = [];

  allRelatedParticipants.forEach(p => {
      const pFlights = (p.flights || []).map(f => ({ ...f, passengerName: p.name, isFamily: p.id !== myParticipant?.id }));
      const pTransfers = (p.transfers || []).map(t => ({ ...t, passengerName: p.name, isFamily: p.id !== myParticipant?.id }));
      
      combinedFlights = [...combinedFlights, ...pFlights];
      combinedTransfers = [...combinedTransfers, ...pTransfers];
  });

  const flightData = combinedFlights.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === 'Gidiş Uçuşu' ? -1 : 1;
  });
  const transferData = combinedTransfers;

  // Algorithmic generator to create completely unique Barcodes dynamically based exactly on the PNR string hash
  const renderBarcode = (pnr) => {
    let seed = 0;
    for (let i = 0; i < pnr.length; i++) {
      seed += pnr.charCodeAt(i);
    }
    
    const bars = [];
    for (let i = 0; i < 40; i++) {
        // Pseudo-random width and margin logic tied to the seed
        const width = 1 + ((seed + i * 17) % 5);
        const margin = ((seed + i * 13) % 4);
        bars.push(<div key={i} style={{ width: `${width}px`, height: '100%', background: '#111', marginRight: `${margin}px` }}></div>);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '54px', display: 'flex', justifyContent: 'center', opacity: 0.85 }}>
            {bars}
          </div>
          <span style={{ fontSize: '13px', letterSpacing: '4px', marginTop: '6px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-main)' }}>{pnr}</span>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* App-like Top Header */}
      <div className="top-header" style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: 'var(--shadow-md)', background: 'var(--primary)', color: 'white' }}>
        <div 
          style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }} 
          onClick={() => navigate(-1)}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <ChevronLeft size={24} color="#fff" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, flex: 1 }}>Uçuş ve Transfer Biletlerim</h2>
      </div>

      <div style={{ padding: '0 16px', marginTop: '20px' }}>
        
        {flightData.length === 0 && transferData.length === 0 && (
           <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <PlaneTakeoff size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Uçuş Eklenmedi</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Seyahat uzmanınız henüz sizin için uçuş ve transfer ataması gerçekleştirmedi. Lütfen daha sonra tekrar kontrol edin.</p>
           </div>
        )}

        {flightData.map((flight, index) => {
          const Icon = flight.type === 'Gidiş Uçuşu' ? PlaneTakeoff : PlaneLanding;
          const bgCol = flight.airlineColor || 'var(--primary)';

          return (
            <div key={index} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={18} className="text-primary" /> {flight.type} <span style={{fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal'}}>({flight.date})</span>
                </h3>
                <div style={{ background: flight.isFamily ? '#fffbeb' : '#f8fafc', color: flight.isFamily ? '#d97706' : '#475569', fontSize: '12px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${flight.isFamily ? '#fde68a' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    👤 Yolcu: {flight.passengerName}
                </div>
              </div>
              
              {/* Boarding Pass Card */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                {/* Top colored section depending on Airline */}
                <div style={{ backgroundColor: bgCol, color: '#FFFFFF', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>

                   <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                       <span style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{flight.from}</span>
                   </div>
                   
                   <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <span style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>{flight.airline?.toUpperCase()}</span>
                       <Icon size={24} color="#FFFFFF" style={{ opacity: 0.9 }} />
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', zIndex: 1 }}>
                       <span style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1 }}>{flight.to}</span>
                   </div>
                </div>
                
                {/* Middle details section */}
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: '16px', background: 'var(--surface)' }}>
                   <div>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Uçuş Kodu</div>
                     <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>{flight.flightNo || '-'}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Kalkış Saati</div>
                     <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>{flight.departureTime || '-'}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Varış Saati</div>
                     <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>{flight.arrivalTime || '-'}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>PNR</div>
                     <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>{flight.pnr || '-'}</div>
                   </div>
                   <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '-6px' }}>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Bilet No</div>
                     <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>{flight.ticketNo || '-'}</div>
                   </div>
                </div>
                
                {/* Cuttable Dashed separator with 3D semi-circles */}
                <div style={{ height: '2px', background: 'transparent', position: 'relative', borderTop: '2px dashed var(--border-color)', margin: '0 20px' }}>
                  <div style={{ position: 'absolute', left: '-30px', top: '-10px', width: '20px', height: '20px', background: 'var(--bg-color)', borderRadius: '50%', boxShadow: 'inset -3px 0 4px rgba(0,0,0,0.04)' }}></div>
                  <div style={{ position: 'absolute', right: '-30px', top: '-10px', width: '20px', height: '20px', background: 'var(--bg-color)', borderRadius: '50%', boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.04)' }}></div>
                </div>
                
                {/* Barcode section */}
                <div style={{ padding: '24px 20px', background: '#fafafa', display: 'flex', justifyContent: 'center' }}>
                   {renderBarcode(flight.pnr || 'NOPNR')}
                </div>
              </div>
            </div>
          );
        })}

        {/* Transfer Section */}
        {transferData.length > 0 && (
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={18} className="text-primary" /> Atanan Transferler
            </h3>
        )}

        {transferData.map((trans, index) => (
            <div key={index} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: '12px', flexShrink: 0 }}>
                    <Bus size={28} className="text-primary" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-main)' }}>{trans.type}</div>
                        <div style={{ background: trans.isFamily ? '#fffbeb' : '#f8fafc', color: trans.isFamily ? '#d97706' : '#475569', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${trans.isFamily ? '#fde68a' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👤 {trans.passengerName}
                        </div>
                    </div>
                    
                    {trans.date && (
                      <div className="flex-row text-muted" style={{ fontSize: '13px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <CalendarClock size={16} className="text-primary" style={{marginTop: '2px'}} /> 
                        <span>{trans.date}</span>
                      </div>
                    )}
                    
                    <div className="flex-row text-muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
                      <MapPin size={16} className="text-primary" /> 
                      <span>{trans.desc}</span>
                    </div>
                    
                    <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Araç & Plaka:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{trans.vehicle}</strong>
                        <strong style={{ color: 'var(--primary)', fontSize: '13px' }}>{trans.plate}</strong>
                      </div>
                    </div>
                </div>
            </div>
        ))}
        
      </div>
    </div>
  );
}
