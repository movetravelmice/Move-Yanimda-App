import fs from 'fs';

// 1. Transfers.jsx
let transfers = fs.readFileSync('src/pages/Customer/Transfers.jsx', 'utf8');

if (!transfers.includes('findMatchingParticipant')) {
  transfers = transfers.replace(
    "import { useUserStore } from '../../store/userStore';",
    "import { useUserStore } from '../../store/userStore';\nimport { findMatchingParticipant, isUserMatch, isUserChild } from '../../utils/userUtils';"
  );
}

const regexTransfers = /const isUserMatch = \([\s\S]*?const myParticipant = activeTour\?\.participants\?\.find\(isUserMatch\);/;
const replacementTransfers = `const myTours = tours.filter(t => findMatchingParticipant(t.participants, user));
  const activeTour = tourId ? myTours.find(t => t.id === tourId) : (myTours.find(isTourActive) || myTours[0]);
  
  // Find primary user with robust match scoring
  const myParticipant = findMatchingParticipant(activeTour?.participants, user);`;

if (regexTransfers.test(transfers)) {
  transfers = transfers.replace(regexTransfers, replacementTransfers);
  console.log('Transfers.jsx matching updated successfully!');
} else {
  console.log('Transfers.jsx regex did not match!');
}

transfers = transfers.replace(
  "{isFamily ? '🎈 Bağlı Profil / Çocuk' : 'Ana Yolcu'}",
  "{isFamily ? (isUserChild(p, users) ? '🎈 Çocuk' : 'Bağlı Profil') : 'Ana Yolcu'}"
);
fs.writeFileSync('src/pages/Customer/Transfers.jsx', transfers, 'utf8');

// 2. TourProgram.jsx
let tourProg = fs.readFileSync('src/pages/Customer/TourProgram.jsx', 'utf8');
if (!tourProg.includes('findMatchingParticipant')) {
  tourProg = tourProg.replace(
    "import { useAuthStore } from '../../store/authStore';",
    "import { useAuthStore } from '../../store/authStore';\nimport { findMatchingParticipant, isUserMatch } from '../../utils/userUtils';"
  );
}

const regexTourProg = /const isUserMatch = \([\s\S]*?const activeTour = tourId[\s\S]*?t\.participants\?\.some\(isUserMatch\)\)\);/;
const replacementTourProg = `const myTours = tours.filter(t => findMatchingParticipant(t.participants, user));
  const activeTour = tourId 
    ? tours.find(t => t.id === tourId) 
    : (myTours.find(isTourActive) || myTours[0]);`;

if (regexTourProg.test(tourProg)) {
  tourProg = tourProg.replace(regexTourProg, replacementTourProg);
  console.log('TourProgram.jsx matching updated successfully!');
} else {
  console.log('TourProgram.jsx regex did not match!');
}
fs.writeFileSync('src/pages/Customer/TourProgram.jsx', tourProg, 'utf8');

// 3. Customer Dashboard.jsx
let custDash = fs.readFileSync('src/pages/Customer/Dashboard.jsx', 'utf8');
if (!custDash.includes('findMatchingParticipant')) {
  custDash = custDash.replace(
    "import { useTourStore, isTourActive, isTourPast } from '../../store/tourStore';",
    "import { useTourStore, isTourActive, isTourPast } from '../../store/tourStore';\nimport { findMatchingParticipant, isUserMatch } from '../../utils/userUtils';"
  );
}

const regexCustDashMyTours = /const myTours = tours\.filter\(t => t\.participants\?\.some\(p => \{[\s\S]*?return false;\s*\}\)\);/;
const replacementCustDashMyTours = `const myTours = tours.filter(t => findMatchingParticipant(t.participants, user));`;

if (regexCustDashMyTours.test(custDash)) {
  custDash = custDash.replace(regexCustDashMyTours, replacementCustDashMyTours);
  console.log('Dashboard.jsx myTours updated successfully!');
} else {
  console.log('Dashboard.jsx myTours regex did not match!');
}

custDash = custDash.replace(
  "const myParticipant = tour.participants?.find(p => p.id === user?.id || p.email === user?.email);",
  "const myParticipant = findMatchingParticipant(tour.participants, user);"
);
fs.writeFileSync('src/pages/Customer/Dashboard.jsx', custDash, 'utf8');
console.log('Dashboard.jsx updated successfully!');
