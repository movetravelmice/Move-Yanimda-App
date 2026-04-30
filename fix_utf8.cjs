const fs = require('fs');
let c = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');

const map = {
  'Å\\x9E': 'Þ',
  'ÅŸ': 'þ',
  'Ã¶': 'ö',
  'Ã–': 'Ö',
  'Ä±': 'ý',
  'Ä°': 'Ý',
  'ÄŸ': 'ð',
  'Äz': 'Ð',
  'Ã§': 'ç',
  'Ã‡': 'Ç',
  'Ã¼': 'ü',
  'Ãœ': 'Ü',
  'ï¿½x': 'ð',
  'ï¿½x': 'þ', 
  'ï¿½': 'ü'
};

// Replace known artifacts globally
c = c.replace(/Å\x9E/g, 'Þ');
c = c.replace(/ÅŸ/g, 'þ');
c = c.replace(/Ã¶/g, 'ö');
c = c.replace(/Ã–/g, 'Ö');
c = c.replace(/Ä±/g, 'ý');
c = c.replace(/Ä°/g, 'Ý');
c = c.replace(/ÄŸ/g, 'ð');
c = c.replace(/Äz/g, 'Ð');
c = c.replace(/Ã§/g, 'ç');
c = c.replace(/Ã‡/g, 'Ç');
c = c.replace(/Ã¼/g, 'ü');
c = c.replace(/Ãœ/g, 'Ü');
// Manual patch for mixed ones
c = c.replace(/deï¿½xerlendirdiniz/g, 'deðerlendirdiniz');
c = c.replace(/GÃ¼ncel/g, 'Güncel');
c = c.replace(/GeÃ§miÅŸ/g, 'Geçmiþ');
c = c.replace(/yÄ±ldÄ±z/g, 'yýldýz');
c = c.replace(/teÃ¾ekkÃ¼r/g, 'teþekkür');
c = c.replace(/dÃ¼Ã¾Ã¼nceler/g, 'düþünceler');
c = c.replace(/paylaÃ¾Ã½n/g, 'paylaþýn');
c = c.replace(/teï¿½xekkï¿½xr/g, 'teþekkür');
c = c.replace(/dï¿½xï¿½xncelerinizi/g, 'düþüncelerinizi');
c = c.replace(/paylaï¿½xï¿½xn/g, 'paylaþýn');
c = c.replace(/Henï¿½xz/g, 'Henüz');

fs.writeFileSync('src/pages/Customer/Dashboard.jsx', c, 'utf8');
console.log('UTF-8 text cleaned.');
