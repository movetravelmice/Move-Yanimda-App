import fs from 'fs';

let tintin = fs.readFileSync('src/pages/Customer/TintinChat.jsx', 'utf8');

if (!tintin.includes('findMatchingParticipant')) {
  tintin = tintin.replace(
    "import { isTourActive } from '../../store/tourStore';",
    "import { isTourActive } from '../../store/tourStore';\nimport { findMatchingParticipant } from '../../utils/userUtils';"
  );
}

tintin = tintin.replace(
  `    return tours.filter(t => 
      t.participants?.some(p => 
        p.id === user.id || 
        (p.email && user.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase())
      )
    );`,
  `    return tours.filter(t => findMatchingParticipant(t.participants, user));`
);

tintin = tintin.replace(
  `      const myParticipant = participantsList.find(p => 
        p?.id === user?.id || 
        (p?.email && user?.email && p.email.trim().toLowerCase() === user.email.trim().toLowerCase())
      );`,
  `      const myParticipant = findMatchingParticipant(participantsList, user);`
);

fs.writeFileSync('src/pages/Customer/TintinChat.jsx', tintin, 'utf8');
console.log('TintinChat.jsx updated successfully!');
