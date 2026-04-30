const fs = require('fs');
let doc = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');
doc = doc.replace(/G.ncel Turlar.m/g, 'Güncel Turlarým');
doc = doc.replace(/Su an kay.tl. oldu.unuz aktif bir tur bulunmuyor\./g, 'Þu an kayýtlý olduðunuz aktif bir tur bulunmuyor.');
doc = doc.replace(/U.u. & Transfer/g, 'Uçuþ & Transfer');
doc = doc.replace(/Tur Program./g, 'Tur Programý');
doc = doc.replace(/.ehir Rehberi/g, 'Þehir Rehberi');
doc = doc.replace(/Ge.mi. Turlar.m/g, 'Geçmiþ Turlarým');
doc = doc.replace(/Hen.z ge.mi. bir seyahatiniz bulunmuyor\./g, 'Henüz geçmiþ bir seyahatiniz bulunmuyor.');
doc = doc.replace(/Detayl. De.erlendirme/g, 'Detaylý Deðerlendirme');
doc = doc.replace(/{generalRating} y.ld.z ile/g, '{generalRating} yýldýz ile');
doc = doc.replace(/ile de.erlendirdiniz/g, 'ile deðerlendirdiniz');
doc = doc.replace(/i.in detaylar. puanlay.n/g, 'için detaylarý puanlayýn');
doc = doc.replace(/hakk.nda d...ncelerinizi payla..n/g, 'hakkýnda düþüncelerinizi paylaþýn');
doc = doc.replace(/>.{1,2}ptal</g, '>Ýptal<');
doc = doc.replace(/>G.nder</g, '>Gönder<');
doc = doc.replace(/Zaten Puanlad.n.z/g, 'Zaten Puanladýnýz');
doc = doc.replace(/g.nderdi.iniz i.in te.ekk.r ederiz/g, 'gönderdiðiniz için teþekkür ederiz');
doc = doc.replace(/B.lge Seyahat Uzman.n.z/g, 'Bölge Seyahat Uzmanýnýz');
fs.writeFileSync('src/pages/Customer/Dashboard.jsx', doc, 'utf8');

let store = fs.readFileSync('src/store/chatStore.js', 'utf8');
store = store.replace(/g\.\.\./g, 'görüþürüz');
store = store.replace(/g\uFFFD\uFFFD\uFFFD/g, 'görüþürüz');
fs.writeFileSync('src/store/chatStore.js', store, 'utf8');

console.log('Fixed using wildcards!');
