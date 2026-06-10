const fs = require('fs');
const path = 'd:/CRM-SaasV2/frontend/src/app/org/[slug]/dashboard/caller/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard tailwind purples with Nexora custom hex colors
content = content.replace(/text-purple-400/g, 'text-[#A78BFA]');
content = content.replace(/text-purple-300/g, 'text-[#C084FC]');
content = content.replace(/bg-purple-600/g, 'bg-[#8B5CF6]');
content = content.replace(/bg-purple-500/g, 'bg-[#A855F7]');
content = content.replace(/shadow-purple-600/g, 'shadow-[#8B5CF6]');
content = content.replace(/border-purple-500/g, 'border-[#A855F7]');
content = content.replace(/bg-gradient-to-br from-purple-600 to-blue-600/g, 'bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced colors in caller/page.tsx');
