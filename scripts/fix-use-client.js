const fs = require('fs');
const path = require('path');

const files = [
  'src/app/org/[slug]/dashboard/page.tsx',
  'src/app/org/[slug]/dashboard/sales/page.tsx',
  'src/app/org/[slug]/dashboard/receptionist/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove all useRequestLock imports
    content = content.replace(/import \{ useRequestLock \} from '@\/lib\/hooks\/useRequestLock';\n?/g, '');
    
    // Find where "use client" is
    const useClientRegex = /(['"]use client['"];?)/i;
    const match = content.match(useClientRegex);
    
    if (match) {
      // Insert right after "use client"
      const insertIdx = match.index + match[0].length;
      content = content.slice(0, insertIdx) + "\nimport { useRequestLock } from '@/lib/hooks/useRequestLock';\n" + content.slice(insertIdx);
    } else {
      content = "import { useRequestLock } from '@/lib/hooks/useRequestLock';\n" + content;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fixed " + file);
  }
});
