const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(process.cwd(), 'src', 'app', 'org', '[slug]', 'dashboard');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace #{someVar.id} with #{someVar.lead_number ?? someVar.id}
    // We only want to target variables like lead, l, selectedLead, enquiry, selectedClosedLead
    const regex = /#\{((?:lead|l|selectedLead|enquiry|selectedClosedLead|reassignLead|v)\.id)\}/g;
    
    content = content.replace(regex, (match, p1) => {
      const objName = p1.split('.')[0];
      return `#{${objName}.lead_number ?? ${p1}}`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});

// Also update LeadDetailClient
const leadDetailPath = path.join(process.cwd(), 'src', 'app', '(dashboard)', 'enterprise', 'leads', '[id]', 'LeadDetailClient.tsx');
if (fs.existsSync(leadDetailPath)) {
  let content = fs.readFileSync(leadDetailPath, 'utf8');
  if (content.includes("<h1 className=\"text-2xl font-bold text-slate-900 dark:text-white\">{lead.name || 'Unnamed Lead'}</h1>")) {
    content = content.replace(
      "<h1 className=\"text-2xl font-bold text-slate-900 dark:text-white\">{lead.name || 'Unnamed Lead'}</h1>",
      "<h1 className=\"text-2xl font-bold text-slate-900 dark:text-white\">#{lead.lead_number ?? lead.id} — {lead.name || 'Unnamed Lead'}</h1>"
    );
    fs.writeFileSync(leadDetailPath, content, 'utf8');
    console.log(`Updated LeadDetailClient`);
  }
}

