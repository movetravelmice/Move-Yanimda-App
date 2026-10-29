import { db } from '../src/lib/firebase.js';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { findMatchingParticipant, getParticipantMatchScore, isUserChild } from '../src/utils/userUtils.js';

async function testMatching() {
  console.log("=== TESTING MATCHING & CHILD FLAGS ===");

  const tourSnap = await getDoc(doc(db, 'tours', 'tour_1793180002643'));
  const tour = tourSnap.data();
  const participants = tour.participants || [];

  const ayhanCeyhanUser = (await getDoc(doc(db, 'users', 'cust_1793299722862_necjs'))).data();
  const ayhanOzdoganUser = (await getDoc(doc(db, 'users', 'customer_1793186491314_rete09'))).data();

  console.log("\n1. Testing for User: Ayhan Ceyhan (email: " + ayhanCeyhanUser.email + ", phone: " + ayhanCeyhanUser.phone + ")");
  const matchedForCeyhan = findMatchingParticipant(participants, ayhanCeyhanUser);
  console.log("-> MATCHED PARTICIPANT:", matchedForCeyhan ? matchedForCeyhan.name : "NONE");
  console.log("-> MATCHED TICKET:", matchedForCeyhan ? matchedForCeyhan.ticketPdf?.name : "NONE");

  console.log("\n2. Testing for User: Ayhan Özdoğan (email: " + ayhanOzdoganUser.email + ", phone: " + ayhanOzdoganUser.phone + ")");
  const matchedForOzdogan = findMatchingParticipant(participants, ayhanOzdoganUser);
  console.log("-> MATCHED PARTICIPANT:", matchedForOzdogan ? matchedForOzdogan.name : "NONE");
  console.log("-> MATCHED TICKET:", matchedForOzdogan ? matchedForOzdogan.ticketPdf?.name : "NONE");

  console.log("\n3. Testing child flags across all 258 participants of TLC Klima...");
  const usersSnap = await getDocs(collection(db, 'users'));
  const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  let childCount = 0;
  participants.forEach(p => {
    if (isUserChild(p, allUsers)) {
      childCount++;
      console.log("Erroneous child found:", p.name, p.email);
    }
  });

  console.log("Total TLC participants considered child by isUserChild:", childCount);

  process.exit(0);
}

testMatching().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
