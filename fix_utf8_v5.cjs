const fs = require('fs');
let c = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');

c = c.replace(/UÃ§uÅŸ/g, 'Uçuþ');
c = c.replace(/Tur ProgramÄ±/g, 'Tur Programý');
c = c.replace(/Å\x9Eehir/g, 'Þehir');
c = c.replace(/HenÃ¼z/g, 'Henüz');
c = c.replace(/geÃ§miÅŸ/g, 'geçmiþ');
c = c.replace(/Geï¿½miï¿½/g, 'Geçmiþ');
c = c.replace(/Turlarï¿½m/g, 'Turlarým');
c = c.replace(/Detaylï¿½/g, 'Detaylý');
c = c.replace(/Deï¿½erlendirme/g, 'Deðerlendirme');
c = c.replace(/yï¿½ldï¿½z/g, 'yýldýz');
c = c.replace(/deï¿½erlendirdiniz/g, 'deðerlendirdiniz');
c = c.replace(/iï¿½in/g, 'için');
c = c.replace(/detaylarï¿½/g, 'detaylarý');
c = c.replace(/puanlayï¿½n/g, 'puanlayýn');
c = c.replace(/hakkï¿½nda/g, 'hakkýnda');
c = c.replace(/dï¿½ï¿½ï¿½ncelerinizi/g, 'düþüncelerinizi');
c = c.replace(/paylaï¿½ï¿½n/g, 'paylaþýn');
c = c.replace(/ï¿½ptal/g, 'Ýptal');
c = c.replace(/Gï¿½nder/g, 'Gönder');
c = c.replace(/Puanladï¿½nï¿½z/g, 'Puanladýnýz');
c = c.replace(/gï¿½nderdiï¿½iniz/g, 'gönderdiðiniz');
c = c.replace(/teï¿½ekkï¿½r/g, 'teþekkür');
c = c.replace(/Bï¿½lge/g, 'Bölge');
c = c.replace(/Uzmanï¿½nï¿½z/g, 'Uzmanýnýz');

fs.writeFileSync('src/pages/Customer/Dashboard.jsx', c, 'utf8');
