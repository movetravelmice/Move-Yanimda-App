const cleanHeader = (str) => {
    return String(str || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
};

const findVal = (row, patterns, allowSubstring = true) => {
    const keys = Object.keys(row || {});
    // 1. Exact normalized match first
    for (const p of patterns) {
        const cleanP = cleanHeader(p);
        const exactKey = keys.find(k => cleanHeader(k) === cleanP);
        if (exactKey !== undefined && row[exactKey] !== undefined && row[exactKey] !== null) {
            const v = String(row[exactKey]).trim();
            if (v && v !== 'undefined' && v !== 'null') return v;
        }
    }
    // 2. Substring match only if allowed
    if (allowSubstring) {
        for (const p of patterns) {
            const cleanP = cleanHeader(p);
            if (cleanP.length < 3) continue;
            const matchKey = keys.find(k => cleanHeader(k).includes(cleanP));
            if (matchKey !== undefined && row[matchKey] !== undefined && row[matchKey] !== null) {
                const v = String(row[matchKey]).trim();
                if (v && v !== 'undefined' && v !== 'null') return v;
            }
        }
    }
    return '';
};

function parseRowName(row) {
    // 1. Check for single combined full name column
    const combinedName = findVal(row, [
        'adsoyad', 'adisoyadi', 'advesoyad', 'adivesoyadi',
        'isimsoyisim', 'isimvesoyisim', 'fullname', 'full name',
        'tamad', 'tamadi', 'musteri', 'katilimci', 'yolcu'
    ]);

    // 2. Check for separate first and last name columns (exact match preferred)
    const firstName = findVal(row, ['ad', 'isim', 'adi', 'isimi', 'firstname', 'first name', 'fname'], false) 
                   || findVal(row, ['firstname', 'first name', 'fname'], true);
                   
    const lastName = findVal(row, ['soyad', 'soyisim', 'soyadi', 'soyisimi', 'lastname', 'last name', 'lname', 'surname'], false)
                  || findVal(row, ['lastname', 'last name', 'surname'], true);

    let rawName = '';
    if (firstName && lastName) {
        rawName = `${firstName} ${lastName}`;
    } else if (combinedName) {
        rawName = combinedName;
    } else if (firstName || lastName) {
        rawName = firstName || lastName;
    }
    return rawName.trim();
}

console.log('Test 1 (İsim / Soyisim):', parseRowName({ 'İsim': 'Ahmet', 'Soyisim': 'Yılmaz' }));
console.log('Test 2 (Ad / Soyad):', parseRowName({ 'Ad': 'Ahmet', 'Soyad': 'Yılmaz' }));
console.log('Test 3 (Adı / Soyadı):', parseRowName({ 'Adı': 'Ahmet', 'Soyadı': 'Yılmaz' }));
console.log('Test 4 (İsim Soyisim single):', parseRowName({ 'İsim Soyisim': 'Ahmet Yılmaz' }));
console.log('Test 5 (Ad Soyad single):', parseRowName({ 'Ad Soyad': 'Ahmet Yılmaz' }));
console.log('Test 6 (Adı Soyadı single):', parseRowName({ 'Adı Soyadı': 'Ahmet Yılmaz' }));
console.log('Test 7 (Ad + E-posta Adresi):', parseRowName({ 'Ad': 'Ahmet', 'Soyad': 'Yılmaz', 'E-posta Adresi': 'ahmet@test.com' }));
console.log('Test 8 (İsim + Soyisim + Adres):', parseRowName({ 'İsim': 'Can', 'Soyisim': 'Kaya', 'Adres': 'İstanbul' }));
console.log('Test 9 (Uppercase TR):', parseRowName({ 'İSİM': 'SİNEM', 'SOYİSİM': 'SARIKAYA' }));
console.log('Test 10 (Uppercase AD SOYAD):', parseRowName({ 'AD': 'SİNEM', 'SOYAD': 'SARIKAYA' }));
