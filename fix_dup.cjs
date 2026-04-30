const fs = require('fs');
const c = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');

const regex = /\{activeTours\.map\(tour => [\s\S]*?Şehir Rehberi<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\)\}/;
const template = `{activeTours.map(tour => (
            <div key={tour.id} className="card" style={{ marginBottom: '24px' }}>
              <div style={{ height: '140px', background: 'var(--primary-light)', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <img loading="lazy" src={tour.avatar} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{tour.name}</h2>

              <div className="flex-row text-muted" style={{ marginBottom: '6px', fontSize: '14px' }}>
                <MapPin size={16} /> {tour.destinations}
              </div>
              <div className="flex-row text-muted" style={{ marginBottom: '16px', fontSize: '14px' }}>
                <Calendar size={16} /> {tour.dates}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div 
                  onClick={() => navigate('/dashboard/transfers')}
                  style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <PlaneTakeoff size={16} className="text-primary" />
                  <span style={{fontWeight: '600'}}>Uçuş & Transfer</span>
                </div>
                <div 
                  onClick={() => navigate('/dashboard/program')}
                  style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <Info size={16} className="text-primary" />
                  <span style={{fontWeight: '600'}}>Tur Programı</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div 
                  onClick={() => setExpertModalData(tour.expert || { name: expertName })}
                  style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <UserCheck size={16} className="text-primary" />
                  <span style={{fontWeight: '600'}}>Tur Yetkilisi</span>
                </div>
                
                <div 
                  onClick={() => navigate('/dashboard/guide/' + tour.id)}
                  style={{ background: '#e0e7ff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <Compass size={16} className="text-primary" />
                  <span style={{fontWeight: '600', color: 'var(--primary)'}}>Şehir Rehberi</span>
                </div>
              </div>
            </div>
        ))}`;

let fixed = c.replace(regex, template);
fs.writeFileSync('src/pages/Customer/Dashboard.jsx', fixed, 'utf8');
