import React, { useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTourStore } from '../store/tourStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';

export default function BulkTicketManager({ tourId, participants, onClose }) {
  const { tours, editTour } = useTourStore();
  const { smtpConfig } = useSettingsStore();
  const { users } = useUserStore();
  const fileInputRef = useRef(null);
  const tour = tours.find(t => t.id === tourId);

  const getAirlineColor = (name) => {
      const n = (name || '').toLowerCase();
      if (n.includes('turkish') || n.includes('thy')) return '#C3002F';
      if (n.includes('pegasus')) return '#FFC600';
      if (n.includes('sunexpress')) return '#0055A5';
      if (n.includes('anadolu')) return '#1D1A53';
      if (n.includes('corendon')) return '#E3000F';
      if (n.includes('lufthansa')) return '#05164D';
      if (n.includes('emirates')) return '#D71920';
      if (n.includes('qatar')) return '#5C0632';
      if (n.includes('air france')) return '#002157';
      if (n.includes('klm')) return '#00A1DE';
      if (n.includes('british')) return '#075AAA';
      return 'var(--primary)';
  };

  const formatDateForExcel = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
          return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
  };

  const excelSerialToDate = (serial) => {
      const s = Number(serial);
      if (isNaN(s) || s < 1) return null;
      const days = s - (s < 60 ? 0 : 1);
      const ms = Math.round((days - 25568) * 86400 * 1000);
      const date = new Date(ms);
      const yyyy = date.getUTCFullYear();
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
  };

  const excelSerialToTime = (serial) => {
      const s = Number(serial);
      if (isNaN(s) || s < 0 || s >= 1) return null;
      const totalMinutes = Math.round(s * 1440);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      return `${hh}:${mm}`;
  };

  const parseStandardDate = (dateStr) => {
      if (!dateStr) return '';
      const cleanDate = String(dateStr).replace(/\//g, '.').replace(/-/g, '.');
      const parts = cleanDate.split('.');
      if (parts.length === 3) {
          if (parts[2].length === 4) {
              return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          if (parts[0].length === 4) {
              return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
      }
      return String(dateStr);
  };

  const parseExcelDateValue = (val) => {
      if (!val) return { date: '', departureTime: '', arrivalTime: '' };
      const str = String(val).trim();
      const parts = str.split(/\s*(?:-|\s)\s*/).filter(Boolean);
      
      let date = '';
      let departureTime = '';
      let arrivalTime = '';
      
      if (parts.length > 0) {
          const part1 = parts[0];
          if (/^\d+$/.test(part1)) {
              date = excelSerialToDate(part1) || '';
          } else {
              date = parseStandardDate(part1);
          }
      }
      
      if (parts.length > 1) {
          const part2 = parts[1];
          if (/^0\.\d+$/.test(part2) || /^\d+$/.test(part2)) {
              departureTime = excelSerialToTime(part2) || '';
          } else {
              departureTime = part2;
          }
      }
      
      if (parts.length > 2) {
          const part3 = parts[2];
          if (/^0\.\d+$/.test(part3) || /^\d+$/.test(part3)) {
              arrivalTime = excelSerialToTime(part3) || '';
          } else {
              arrivalTime = part3;
          }
      }
      
      return { date, departureTime, arrivalTime };
  };

  const parseTimeValue = (val) => {
      if (!val) return '';
      const str = String(val).trim();
      if (/^0\.\d+$/.test(str) || /^\d+$/.test(str)) {
          return excelSerialToTime(str) || str;
      }
      return str;
  };

  const handleExport = () => {
    const dataRow = [];
    
    participants.forEach(p => {
       if (!p.flights || p.flights.length === 0) {
           dataRow.push({
             'E-Posta (DEĞİŞTİRMEYİN)': p.email,
             'İsim Soyisim': p.name,
             'Uçuş Yönü (Gidiş Uçuşu / Dönüş Uçuşu)': '',
             'Havayolu': '',
             'Kalkış Limanı': '',
             'Varış Limanı': '',
             'Uçuş Kodu': '',
             'PNR': '',
             'Bilet No': '',
             'Sınıf (Ekonomi / Business)': '',
             'Tarih (GG.AA.YYYY)': '',
             'Kalkış Saati (SS:DD)': '',
             'Varış Saati (SS:DD)': ''
           });
       } else {
           p.flights.forEach(f => {
               dataRow.push({
                 'E-Posta (DEĞİŞTİRMEYİN)': p.email,
                 'İsim Soyisim': p.name,
                 'Uçuş Yönü (Gidiş Uçuşu / Dönüş Uçuşu)': f.type || 'Gidiş Uçuşu',
                 'Havayolu': f.airline || '',
                 'Kalkış Limanı': f.from || '',
                 'Varış Limanı': f.to || '',
                 'Uçuş Kodu': f.flightNo || '',
                 'PNR': f.pnr || '',
                 'Bilet No': f.ticketNo || '',
                 'Sınıf (Ekonomi / Business)': f.cabinClass || 'Ekonomi',
                 'Tarih (GG.AA.YYYY)': formatDateForExcel(f.date),
                 'Kalkış Saati (SS:DD)': f.departureTime || '',
                 'Varış Saati (SS:DD)': f.arrivalTime || ''
               });
           });
       }
    });

    const ws = XLSX.utils.json_to_sheet(dataRow);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Toplu Biletleme");

    ws['!cols'] = [ {wch: 30}, {wch: 25}, {wch: 35}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20} ];

    XLSX.writeFile(wb, `TopluBilet_${tourId}.xlsx`);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Group rows per email
        const flightsByEmail = {};

        data.forEach(row => {
          const email = String(row['E-Posta (DEĞİŞTİRMEYİN)'] || '').trim();
          if (!email) return;
          if (!flightsByEmail[email]) flightsByEmail[email] = [];
          
          if (row['PNR'] || row['Bilet No'] || row['Uçuş Kodu']) {
              flightsByEmail[email].push({
                  type: row['Uçuş Yönü (Gidiş Uçuşu / Dönüş Uçuşu)'] || 'Gidiş Uçuşu',
                  airline: row['Havayolu'] || '',
                  airlineColor: getAirlineColor(row['Havayolu']),
                  from: row['Kalkış Limanı'] || '',
                  to: row['Varış Limanı'] || '',
                  flightNo: row['Uçuş Kodu'] || '',
                  pnr: row['PNR'] || '',
                  ticketNo: row['Bilet No'] || '',
                  cabinClass: row['Sınıf (Ekonomi / Business)'] || 'Ekonomi',
                  ...(() => {
                      const parsed = parseExcelDateValue(row['Tarih (GG.AA.YYYY)']);
                      return {
                          date: parsed.date,
                          departureTime: parseTimeValue(row['Kalkış Saati (SS:DD)']) || parsed.departureTime || '',
                          arrivalTime: parseTimeValue(row['Varış Saati (SS:DD)']) || parsed.arrivalTime || ''
                      };
                  })(),
                  icon: (row['Uçuş Yönü (Gidiş Uçuşu / Dönüş Uçuşu)'] || '').includes('Dönüş') ? 'landing' : 'takeoff'
              });
          }
        });

        let processCount = 0;
        const newParticipants = [...participants];
        
        Object.keys(flightsByEmail).forEach(email => {
            const pIndex = newParticipants.findIndex(part => part.email === email);
            if (pIndex === -1) return;

            const extractedFlights = flightsByEmail[email];
            newParticipants[pIndex] = {
                ...newParticipants[pIndex],
                flights: extractedFlights
            };
            processCount++;
        });

        if (processCount > 0) {
            editTour(tourId, { participants: newParticipants });
        }

        alert(`Başarılı! ${processCount} katılımcının uçuş verileri Excel'den sisteme işlendi.`);
        onClose();
        
        if(fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert("Excel yüklenirken bir hata oluştu: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeIn 0.2s' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '24px', position: 'relative', animation: 'slideUp 0.3s ease' }}>
        <div onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="var(--text-muted)" />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px' }}>Toplu Bilet İşlemleri</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Excel tablosu ile tüm uçuşları düzenleyin</div>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
          Uçuş verilerini toplu olarak girmek ve yönetmek için şablonu indirin. Yolcuların <b>aktarmalı (veya çoklu) uçuşları</b> için aynı E-Posta adresine sahip birden fazla satır açabilirsiniz (Her satır = 1 Uçuş).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <button 
              onClick={handleExport}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-main)', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
           >
              <Download size={18} /> Uçuş Şablonunu İndir
           </button>

           <div style={{ position: 'relative' }}>
               <input 
                 type="file" 
                 accept=".xlsx, .xls"
                 onChange={handleImport}
                 ref={fileInputRef}
                 style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
               />
               <button 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'white', boxShadow: '0 4px 12px rgba(215, 20, 122, 0.2)' }}
               >
                  <Upload size={18} /> Doldurulmuş Dosyayı Yükle
               </button>
           </div>
        </div>
      </div>
    </div>
  );
}
