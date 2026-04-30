const fs = require('fs');
let doc = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');

doc = doc.replace(/G.{1,3}ncel Turlar.{1,3}m/g, 'Güncel Turlarým');
doc = doc.replace(/an kay.{1,3}tl.{1,3} oldu.{1,3}unuz aktif bir tur bulunmuyor/g, 'an kayýtlý olduðunuz aktif bir tur bulunmuyor');
doc = doc.replace(/U.{1,3}u.{1,3} & Transfer/g, 'Uçuþ & Transfer');
doc = doc.replace(/Tur Program.{1,3}/g, 'Tur Programý');
doc = doc.replace(/.{1,3}ehir Rehberi/g, 'Þehir Rehberi');
doc = doc.replace(/Ge.{1,3}mi.{1,3} Turlar.{1,3}m/g, 'Geçmiþ Turlarým');
doc = doc.replace(/Hen.{1,3}z ge.{1,3}mi.{1,3} bir seyahatiniz bulunmuyor/g, 'Henüz geçmiþ bir seyahatiniz bulunmuyor');
doc = doc.replace(/Detayl.{1,3} De.{1,3}erlendirme/g, 'Detaylý Deðerlendirme');
doc = doc.replace(/{generalRating} y.{1,3}ld.{1,3}z ile/g, '{generalRating} yýldýz ile');
doc = doc.replace(/ile de.{1,3}erlendirdiniz/g, 'ile deðerlendirdiniz');
doc = doc.replace(/i.{1,3}in detaylar.{1,3} puanlay.{1,3}n/g, 'için detaylarý puanlayýn');
doc = doc.replace(/hakk.{1,3}nda d.{1,5}ncelerinizi payla.{1,3}n/g, 'hakkýnda düþüncelerinizi paylaþýn');
doc = doc.replace(/>.{1,4}ptal</g, '>Ýptal<');
doc = doc.replace(/>G.{1,3}nder</g, '>Gönder<');
doc = doc.replace(/Zaten Puanlad.{1,3}n.{1,3}z/g, 'Zaten Puanladýnýz');
doc = doc.replace(/g.{1,3}nderdi.{1,3}iniz i.{1,3}in te.{1,5}k.{1,3}r ederiz/g, 'gönderdiðiniz için teþekkür ederiz');
doc = doc.replace(/B.{1,3}lge Seyahat Uzman.{1,3}n.{1,3}z/g, 'Bölge Seyahat Uzmanýnýz');

fs.writeFileSync('src/pages/Customer/Dashboard.jsx', doc, 'utf8');

let store = fs.readFileSync('src/store/chatStore.js', 'utf8');
store = store.replace(/g.{1,5}/g, 'görüþürüz');
fs.writeFileSync('src/store/chatStore.js', store, 'utf8');

console.log('Fixed using robust wildcards!');
