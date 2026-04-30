const fs = require('fs');
const path = 'C:/Users/otina/.gemini/antigravity/scratch/travel-app/src/pages/Customer/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. ADD ICONS
if (!content.includes('CloudSun')) {
    content = content.replace(/import \{.*?\} from 'lucide-react';/, (match) => {
        return match.replace('Eye }', 'Eye, CloudSun, Map, Utensils, Landmark, Compass, ThermometerSun }');
    });
}

// 2. ADD MOCK DATA BEFORE EXPORT DEFAULT
const mockData = `
const MOCK_DESTINATIONS = {
  "Paris - Roma - Floransa": {
    banner: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800",
    weather: { temp: "22°C", condition: "Parçalı Bulutlu" },
    places: [
      { name: "Eyfel Kulesi", desc: "Paris'in ikonik sembolü, ışıl ışıl manzaralar." },
      { name: "Kolezyum", desc: "Roma'nın kalbindeki antik gladyatör arenası." },
      { name: "Louvre Müzesi", desc: "Mona Lisa ve binlerce eşsiz eser." }
    ],
    restaurants: [
      { name: "Le Jules Verne", cuisine: "Fransız Mutfağı", rating: "4.9" },
      { name: "Armando al Pantheon", cuisine: "İtalyan Mutfağı", rating: "4.8" },
      { name: "Giolitti", cuisine: "Roma Dondurması", rating: "4.7" }
    ]
  },
  "Kapadokya": {
     banner: "https://images.unsplash.com/photo-1627885068472-ed2ebba315e2?auto=format&fit=crop&q=80&w=800",
     weather: { temp: "18°C", condition: "Açık / Güneşli" },
     places: [
       { name: "Göreme Açık Hava Müzesi", desc: "Kayalara oyulmuş tarihi kiliseler." },
       { name: "Uçhisar Kalesi", desc: "Tüm Kapadokya'yı izleyebileceğiniz zirve." },
       { name: "Ihlara Vadisi", desc: "Doğa yürüyüşü ve şelaleler." }
     ],
     restaurants: [
       { name: "Sekman Restoran", cuisine: "Testi Kebabı", rating: "4.9" },
       { name: "Topdeck Cave", cuisine: "Anadolu Mutfağı", rating: "4.8" },
       { name: "Lil'a Restoran", cuisine: "Modern Türk", rating: "4.7" }
     ]
  }
};

const DEFAULT_DESTINATION = {
    banner: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800",
    weather: { temp: "24°C", condition: "Güneşli" },
    places: [
      { name: "Tarihi Şehir Merkezi", desc: "Dar sokaklarda kültürel bir yürüyüş." },
      { name: "Ana Meydan", desc: "Şehrin en hareketli turistik noktası." },
      { name: "Doğa Parkı", desc: "Ağaçlar arasında büyüleyici manzaralar." }
    ],
    restaurants: [
      { name: "Lokal Gurme", cuisine: "Yöresel Lezzetler", rating: "4.8" },
      { name: "Deniz Manzaralı Tesis", cuisine: "Deniz Ürünleri", rating: "4.6" },
      { name: "Tarihi Kafe", cuisine: "Kahve & Tatlı", rating: "4.7" }
    ]
};
`;
if (!content.includes('MOCK_DESTINATIONS')) {
    content = content.replace('export default function CustomerDashboard() {', mockData + '\nexport default function CustomerDashboard() {\n');
}

// 3. ADD STATE
if (!content.includes('destinationModalData')) {
    content = content.replace('const [showDetailedModal, setShowDetailedModal] = useState(false);', 'const [showDetailedModal, setShowDetailedModal] = useState(false);\n  const [destinationModalData, setDestinationModalData] = useState(null);');
}

// 4. REPLACE BUTTON
content = content.replace(/<div[^>]*?>\s*<Eye size=\{16\} className="text-primary" \/>\s*<span[^>]*?>Detayları Gör<\/span>\s*<\/div>/g, 
  `<div 
    onClick={() => setDestinationModalData(tour)}
    style={{ background: '#e0e7ff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
    <Compass size={16} className="text-primary" />
    <span style={{fontWeight: '600', color: 'var(--primary)'}}>Şehir Rehberi</span>
  </div>`);

// 5. INJECT MODAL JSX BEFORE THE FINAL </div> AND EXPORT
const modalJSX = `
      {destinationModalData && (() => {
        const dKeys = Object.keys(MOCK_DESTINATIONS);
        const dMatch = dKeys.find(k => destinationModalData.destinations.includes(k) || destinationModalData.name.includes(k));
        const dInfo = dMatch ? MOCK_DESTINATIONS[dMatch] : DEFAULT_DESTINATION;
        
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(4px)' }}>
             <div onClick={() => setDestinationModalData(null)} style={{ flex: 1 }}></div>
             
             <div style={{ background: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out', position: 'relative' }}>
                <div onClick={() => setDestinationModalData(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '6px', cursor: 'pointer', zIndex: 10 }}>
                   <X size={20} />
                </div>
                
                <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                   <img src={dInfo.banner} alt="City Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
                       <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{destinationModalData.destinations}</h2>
                       <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.9 }}>
                          <MapPin size={14} /> Keşfetmeye Hazır Olun
                       </p>
                   </div>
                </div>

                <div style={{ padding: '24px 20px' }}>
                   <div style={{ display: 'flex', background: '#f8fafc', padding: '16px', borderRadius: '16px', alignItems: 'center', gap: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#f59e0b' }}>
                          <ThermometerSun size={28} />
                      </div>
                      <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beklenen Hava Durumu</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>{dInfo.weather.temp} - {dInfo.weather.condition}</div>
                      </div>
                   </div>

                   <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
                      <Landmark size={20} className="text-primary" /> Görülecek Yerler
                   </h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                      {dInfo.places.map((place, idx) => (
                          <div key={idx} style={{ padding: '12px 16px', background: '#f5f5f5', borderRadius: '12px' }}>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{place.name}</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{place.desc}</div>
                          </div>
                      ))}
                   </div>

                   <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
                      <Utensils size={20} className="text-primary" /> En İyi Restoranlar
                   </h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      {dInfo.restaurants.map((rest, idx) => (
                          <div key={idx} style={{ padding: '16px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div>
                                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{rest.name}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: '#f0f2f5', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>{rest.cuisine}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                                  <Star size={14} fill="currentColor" /> {rest.rating}
                              </div>
                          </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        );
      })()}
`;

if (!content.includes('destinationModalData && (() => {')) {
    content = content.replace(/(<\/div>\s*)$/, modalJSX + '\n$1');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully injected Destination Guide Modal!');
