const fs = require('fs');
const path = 'C:/Users/otina/.gemini/antigravity/scratch/travel-app/src/pages/Customer/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove MOCK_DESTINATIONS and DEFAULT_DESTINATION blocks
content = content.replace(/const MOCK_DESTINATIONS = \{[\s\S]*?\};\s*const DEFAULT_DESTINATION = \{[\s\S]*?\};\s*/, '');

// 2. Remove destinationModalData state
content = content.replace(/\s*const \[destinationModalData, setDestinationModalData\] = useState\(null\);/, '');

// 3. Update onClick logic in the Dashboard to navigate instead of showing modal
content = content.replace(/onClick=\{\(\) => setDestinationModalData\(tour\)\}/g, "onClick={() => navigate('/dashboard/guide/' + tour.id)}");

// 4. Remove the modal JSX slice at the bottom
const lastDivIndex = content.lastIndexOf('{destinationModalData && (() => {');
if (lastDivIndex !== -1) {
    const endOfModal = content.indexOf('})()}', lastDivIndex) + 5;
    content = content.slice(0, lastDivIndex) + content.slice(endOfModal);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Cleaned up Dashboard.jsx!');
