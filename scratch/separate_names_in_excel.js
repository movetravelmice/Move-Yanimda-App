import * as XLSX from 'xlsx';
import fs from 'fs';

function splitName(fullName) {
  const clean = (fullName || '').trim();
  if (!clean) return { ad: '', soyad: '' };
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { ad: parts[0], soyad: '' };
  }
  const soyad = parts.pop();
  const ad = parts.join(' ');
  return { ad, soyad };
}

async function main() {
  const filePath = 'C:\\Users\\otina\\Desktop\\TLC_Klima_Katilimci_Listesi_Guncel.xlsx';
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws);

  console.log(`Read ${rows.length} rows from Desktop Excel...`);

  const updatedRows = rows.map(r => {
    let ad = r['İsim'] || r['Ad'] || '';
    let soyad = r['Soyisim'] || r['Soyad'] || '';

    if (!ad && !soyad && r['Ad Soyad']) {
      const split = splitName(r['Ad Soyad']);
      ad = split.ad;
      soyad = split.soyad;
    }

    return {
      'Sıra': r['Sıra'],
      'İsim': ad,
      'Soyisim': soyad,
      'Telefon': r['Telefon'] || '',
      'E-posta': r['E-posta'] || '',
      'TC Kimlik No': r['TC Kimlik No'] || '',
      'Katılımcı Tipi': r['Katılımcı Tipi'] || 'Yetişkin',
      'Firma': r['Firma'] || 'Tlc Klima',
      'Şifre': r['Şifre'] || '',
      'Bilet Durumu': r['Bilet Durumu'] || '',
      'Bilet Dosya Adı': r['Bilet Dosya Adı'] || '',
      'Bilet URL': r['Bilet URL'] || ''
    };
  });

  const newWs = XLSX.utils.json_to_sheet(updatedRows);
  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, newWs, "TLC_Katilimcilar");

  newWs['!cols'] = [
    { wch: 6 },  // Sıra
    { wch: 18 }, // İsim
    { wch: 16 }, // Soyisim
    { wch: 20 }, // Telefon
    { wch: 32 }, // E-posta
    { wch: 16 }, // TC Kimlik No
    { wch: 14 }, // Katılımcı Tipi
    { wch: 18 }, // Firma
    { wch: 14 }, // Şifre
    { wch: 14 }, // Bilet Durumu
    { wch: 26 }, // Bilet Dosya Adı
    { wch: 60 }  // Bilet URL
  ];

  XLSX.writeFile(newWb, filePath);
  console.log(`Successfully updated Desktop Excel with separate 'İsim' and 'Soyisim' columns!`);
}

main().catch(console.error);
