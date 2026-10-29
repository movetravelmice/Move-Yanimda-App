import fs from 'fs';

let nav = fs.readFileSync('src/components/AppBottomNav.jsx', 'utf8');

if (!nav.includes('isUserMatch')) {
  nav = nav.replace(
    "import { useNotificationStore } from '../store/notificationStore';",
    "import { useNotificationStore } from '../store/notificationStore';\nimport { isUserMatch } from '../utils/userUtils';"
  );
}

const regexNav = /const isUserInTour = \(p\) => \{[\s\S]*?return false;\s*\};/;
const replacementNav = `const isUserInTour = (p) => isUserMatch(p, user);`;

if (regexNav.test(nav)) {
  nav = nav.replace(regexNav, replacementNav);
  console.log('AppBottomNav.jsx updated successfully!');
} else {
  console.log('AppBottomNav.jsx regex did not match!');
}

fs.writeFileSync('src/components/AppBottomNav.jsx', nav, 'utf8');
