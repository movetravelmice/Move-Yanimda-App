const fs = require('fs');
const path = 'C:/Users/otina/.gemini/antigravity/scratch/travel-app/src/pages/Customer/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const modalExtPath = 'C:/Users/otina/.gemini/antigravity/scratch/travel-app/modifier.cjs';
const modalJSX = fs.readFileSync(modalExtPath, 'utf8').split('const modalJSX = `')[1].split('`;')[0];

if (!content.includes('destinationModalData && (() => {')) {
    // Find the LAST closing div which corresponds to the container wrapper.
    const lastDivIndex = content.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
        content = content.slice(0, lastDivIndex) + modalJSX + '\n' + content.slice(lastDivIndex);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Injected via lastIndexOf!');
    } else {
        console.log('Could not find </div>');
    }
} else {
    console.log('Already injected!');
}
