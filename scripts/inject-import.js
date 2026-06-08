const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(process.cwd(), 'src', 'app', 'org', '[slug]', 'dashboard', 'sales', 'page.tsx'),
  path.join(process.cwd(), 'src', 'app', 'org', '[slug]', 'dashboard', 'receptionist', 'page.tsx'),
  path.join(process.cwd(), 'src', 'app', 'org', '[slug]', 'dashboard', 'page.tsx')
];

targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it already has the import
  if (!content.includes("import { useRequestLock } from '@/lib/hooks/useRequestLock'")) {
    const importStatement = "\nimport { useRequestLock } from '@/lib/hooks/useRequestLock';\n";
    
    // insert after 'use client'
    if (content.startsWith("'use client';") || content.startsWith('"use client";')) {
      const firstLineBreak = content.indexOf('\n');
      content = content.slice(0, firstLineBreak + 1) + importStatement + content.slice(firstLineBreak + 1);
    } else {
      content = importStatement + content;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added import to ${filePath}`);
  } else {
    console.log(`Import already exists in ${filePath}`);
  }
});
