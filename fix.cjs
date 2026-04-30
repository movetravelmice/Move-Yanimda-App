const fs = require('fs');
let doc = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');
doc = doc.replace(/G\uFFFDncel Turlar\uFFFDm/g, 'Güncel Turlarým');
doc = doc.replace(/Su an kay\uFFFDtl\uFFFD oldu\uFFFDunuz aktif bir tur bulunmuyor\./g, 'Þu an kayýtlý olduðunuz aktif bir tur bulunmuyor.');
doc = doc.replace(/U\uFFFDu\uFFFD & Transfer/g, 'Uçuþ & Transfer');
doc = doc.replace(/Tur Program\uFFFD/g, 'Tur Programý');
doc = doc.replace(/\uFFFDehir Rehberi/g, 'Þehir Rehberi');
doc = doc.replace(/Ge\uFFFDmi\uFFFD Turlar\uFFFDm/g, 'Geçmiþ Turlarým');
doc = doc.replace(/Hen\uFFFDz ge\uFFFDmi\uFFFD bir seyahatiniz bulunmuyor\./g, 'Henüz geçmiþ bir seyahatiniz bulunmuyor.');
doc = doc.replace(/Detayl\uFFFD De\uFFFDerlendirme/g, 'Detaylý Deðerlendirme');
doc = doc.replace(/y\uFFFDld\uFFFDz/g, 'yýldýz');
doc = doc.replace(/de\uFFFDerlendirdiniz\./g, 'deðerlendirdiniz.');
doc = doc.replace(/i\uFFFDin detaylar\uFFFD puanlay\uFFFDn\./g, 'için detaylarý puanlayýn.');
doc = doc.replace(/hakk\uFFFDnda d\uFFFD\uFFFD\uFFFDncelerinizi payla\uFFFD\uFFFDn\.\.\./g, 'hakkýnda düþüncelerinizi paylaþýn...');
doc = doc.replace(/\uFFFD\uFFFDptal/g, 'Ýptal');
doc = doc.replace(/G\uFFFDnder/g, 'Gönder');
doc = doc.replace(/Zaten Puanlad\uFFFDn\uFFFDz/g, 'Zaten Puanladýnýz');
doc = doc.replace(/Bu seYildizli degerlendirme g\uFFFDnderdi\uFFFDi/g, 'Bu deðerlendirmeyi gönderdiði');
doc = doc.replace(/i\uFFFDin te\uFFFDekk\uFFFDr ederiz\./g, 'için teþekkür ederiz.');
doc = doc.replace(/B\uFFFDlge Seyahat Uzman\uFFFDn\uFFFDz/g, 'Bölge Seyahat Uzmanýnýz');
fs.writeFileSync('src/pages/Customer/Dashboard.jsx', doc, 'utf8');

let store = fs.readFileSync('src/store/chatStore.js', 'utf8');
store = store.replace(/g\uFFFD\uFFFD\uFFFD/g, 'görüþürüz');
fs.writeFileSync('src/store/chatStore.js', store, 'utf8');

console.log('Fixed');
