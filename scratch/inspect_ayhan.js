import { db } from '../src/lib/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function inspect() {
  console.log("=== USERS SEARCH ===");
  const usersRef = collection(db, 'users');
  const userSnap = await getDocs(usersRef);
  
  let ayhanCeyhan = null;
  let ayhanOzdogan = null;
  const tlcUsers = [];

  userSnap.forEach(d => {
    const data = { id: d.id, ...d.data() };
    const name = (data.name || '').toLowerCase();
    if (name.includes('ayhan') || name.includes('ceyhan') || name.includes('özdoğan') || name.includes('ozdogan')) {
      console.log(`User: ${data.name} (id: ${data.id}) | email: ${data.email} | phone: ${data.phone} | tc: ${data.tcNo || data.tc} | isChild: ${data.isChildProfile} | linkedTo: ${JSON.stringify(data.linkedTo)}`);
      if (name.includes('ceyhan')) ayhanCeyhan = data;
      if (name.includes('özdoğan') || name.includes('ozdogan')) ayhanOzdogan = data;
    }
    if ((data.corporate || data.company || '').toLowerCase().includes('tlc')) {
      tlcUsers.push(data);
    }
  });

  console.log(`\nTotal TLC users found: ${tlcUsers.length}`);

  console.log("\n=== TOURS SEARCH ===");
  const toursRef = collection(db, 'tours');
  const tourSnap = await getDocs(toursRef);
  
  tourSnap.forEach(d => {
    const tour = { id: d.id, ...d.data() };
    const tName = tour.name || '';
    if (tName.toLowerCase().includes('tlc') || tName.toLowerCase().includes('klima')) {
      console.log(`\nTour found: "${tour.name}" (id: ${tour.id})`);
      const participants = tour.participants || [];
      console.log(`Total participants in tour: ${participants.length}`);
      
      participants.forEach((p, idx) => {
        const pName = (p.name || '').toLowerCase();
        if (pName.includes('ayhan') || pName.includes('ceyhan') || pName.includes('özdoğan') || pName.includes('ozdogan')) {
          console.log(`\nParticipant #${idx}: ${p.name}`);
          console.log(`  id: ${p.id}`);
          console.log(`  email: ${p.email}`);
          console.log(`  phone: ${p.phone}`);
          console.log(`  tc: ${p.tcNo || p.tc}`);
          console.log(`  isChild: ${p.isChildProfile || p.isChild}`);
          console.log(`  linkedTo: ${JSON.stringify(p.linkedTo)}`);
          console.log(`  ticketPdf: ${JSON.stringify(p.ticketPdf)}`);
          console.log(`  ticketFiles: ${JSON.stringify(p.ticketFiles)}`);
        }
      });

      const childParticipants = participants.filter(p => p.isChildProfile || p.isChild || (p.type && p.type.toLowerCase().includes('çocuk')));
      console.log(`\nTotal participants marked as child in this tour: ${childParticipants.length}`);
      childParticipants.forEach(cp => {
        console.log(`  Child participant: ${cp.name} | email: ${cp.email} | phone: ${cp.phone} | linkedTo: ${JSON.stringify(cp.linkedTo)} | isChildProfile: ${cp.isChildProfile}`);
      });
    }
  });

  process.exit(0);
}

inspect().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
