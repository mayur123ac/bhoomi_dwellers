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
  let original = content;

  // 1. Add import if missing
  if (!content.includes('useRequestLock')) {
    content = content.replace(
      "import React, { useState, useEffect, useRef, useMemo } from \"react\";",
      "import React, { useState, useEffect, useRef, useMemo } from \"react\";\nimport { useRequestLock } from \"@/lib/hooks/useRequestLock\";"
    );
  }

  // 2. Replace isSaving with isLocked in SiteVisitScheduler
  content = content.replace(
    /const \[isSaving, setIsSaving\] = useState\(false\);/,
    "const { isLocked, withLock } = useRequestLock();\n  const isSaving = isLocked;" // keep isSaving for the UI components
  );

  // 3. Wrap handleSchedule body with withLock
  const handleScheduleRegex = /const handleSchedule = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*if \(\!visitDate\) return;\s*setIsSaving\(true\);\s*try \{([\s\S]*?)\} catch \{ showToast\("❌ Something went wrong\."\); \}\s*finally \{ setIsSaving\(false\); \}\s*\};/;
  
  content = content.replace(handleScheduleRegex, (match, tryBody) => {
    return `const handleSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!visitDate) return;
    
    await withLock(async () => {
      try {${tryBody}} catch { showToast("❌ Something went wrong."); }
    });
  };`;
  });

  // 4. Change button type="submit" to type="button" and add onClick={handleSchedule}
  // We look for the button inside the form.
  const buttonRegex = /<button type="submit" disabled=\{isSaving \|\| \!visitDate\}/;
  content = content.replace(buttonRegex, '<button type="button" onClick={handleSchedule} disabled={isSaving || !visitDate}');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No changes made to ${filePath}`);
  }
});
