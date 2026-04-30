const fs = require('fs');
let t1 = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');
t1 = t1.replace(/Ge\uFFFDmi\uFFFD Turlar\uFFFDm/g, 'Geçmiþ Turlarým');
t1 = t1.replace(/Hen\uFFFDz ge\uFFFDmi\uFFFD bir seyahatiniz/g, 'Henüz geçmiþ bir seyahatiniz');
t1 = t1.replace(/\uFFFDehir Rehberi/g, 'Þehir Rehberi');
t1 = t1.replace(/Te\uFFFDekk\uFFFDrl/g, 'Teþekkürl');
t1 = t1.replace(/g\uFFFDnderdi\uFFFDi/g, 'gönderdiði');
t1 = t1.replace(/ptal/g, 'Ýptal');
t1 = t1.replace(/G\uFFFDen/g, 'Gön');
fs.writeFileSync('src/pages/Customer/Dashboard.jsx', t1, 'utf8');

let t2 = fs.readFileSync('src/pages/Customer/ChatList.jsx', 'utf8');
t2 = t2.replace(/Farkl\uFFFD Turda/g, 'Farklý Turda');
t2 = t2.replace(/Hen\uFFFDz mesaj yok/g, 'Henüz mesaj yok');
t2 = t2.replace(/payla\uFFFDt\uFFFD/g, 'paylaþtý');
t2 = t2.replace(/Foto\uFFFDr/g, 'Fotoðr');
t2 = t2.replace(/Ses Kayd\uFFFD/g, 'Ses Kaydý');
fs.writeFileSync('src/pages/Customer/ChatList.jsx', t2, 'utf8');
console.log('Fixed Encoding Issues');
