const fs = require('fs');
const path = 'd:/CRM-SaasV2/frontend/src/app/org/[slug]/dashboard/receptionist/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');
// We want to remove lines 59, 60, 61, 62. Which are indices 58, 59, 60, 61.
lines.splice(58, 4);
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Removed orphaned lines.');
