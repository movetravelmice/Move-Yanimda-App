import { db } from '../src/lib/firebase.js';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

async function fixAyhanData() {
  console.log("=== FIXING AYHAN CEYHAN & AYHAN ÖZDOĞAN DATA ===");

  // 1. Fix user cust_1793299722862_necjs (Ayhan Ceyhan)
  const ayhanRef = doc(db, 'users', 'cust_1793299722862_necjs');
  const ayhanSnap = await getDoc(ayhanRef);
  if (ayhanSnap.exists()) {
    console.log("Updating user cust_1793299722862_necjs with correct phone, tc and company...");
    await updateDoc(ayhanRef, {
      phone: "+90 533 365 88 19",
      tcNo: "58201316208",
      company: "Tlc Klima",
      isChildProfile: false
    });
    console.log("User cust_1793299722862_necjs updated successfully!");
  }

  // 2. Fix the tour participant record for Ayhan Ceyhan in TLC tour
  const tourRef = doc(db, 'tours', 'tour_1793180002643');
  const tourSnap = await getDoc(tourRef);
  if (tourSnap.exists()) {
    const tourData = tourSnap.data();
    const participants = tourData.participants || [];
    let updated = false;

    const newParticipants = participants.map(p => {
      const pName = (p.name || '').toLowerCase();
      // If Ayhan Ceyhan
      if (pName.includes('ayhan') && pName.includes('ceyhan')) {
        console.log(`Found Ayhan Ceyhan in tour participants (id: ${p.id}). Updating email and clearing child flag...`);
        updated = true;
        return {
          ...p,
          email: 'a.c.teknik@hotmail.com',
          phone: '+90 533 365 88 19',
          tcNo: '58201316208',
          isChildProfile: false,
          isChild: false,
          type: 'adult'
        };
      }
      // For all TLC participants: remove any erroneous child flags
      if (p.isChildProfile || p.isChild) {
        console.log(`Clearing child flag for participant ${p.name}`);
        updated = true;
        const copy = { ...p };
        delete copy.isChildProfile;
        delete copy.isChild;
        return copy;
      }
      return p;
    });

    if (updated) {
      await updateDoc(tourRef, { participants: newParticipants });
      console.log("Tour participants updated successfully!");
    }
  }

  // 3. Scan all users in TLC Klima to make sure none have erroneous isChildProfile=true
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const d of usersSnap.docs) {
    const u = d.data();
    const comp = (u.company || u.corporate || '').toLowerCase();
    if (comp.includes('tlc') && u.isChildProfile === true) {
      console.log(`Clearing isChildProfile on user ${u.name} (${d.id})`);
      await updateDoc(doc(db, 'users', d.id), { isChildProfile: false });
    }
  }

  console.log("=== DATA REPAIR COMPLETED ===");
  process.exit(0);
}

fixAyhanData().catch(err => {
  console.error("Error fixing data:", err);
  process.exit(1);
});
