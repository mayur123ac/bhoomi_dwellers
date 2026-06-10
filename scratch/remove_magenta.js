const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedFiles = 0;

walkDir('d:/CRM-SaasV2/frontend/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/#9E217B/gi, '#8B5CF6');
    content = content.replace(/#d946a8/gi, '#A78BFA');
    content = content.replace(/#b8268f/gi, '#7C3AED');
    content = content.replace(/pink-50/g, 'indigo-50');
    content = content.replace(/pink-100/g, 'indigo-100');
    content = content.replace(/pink-200/g, 'indigo-200');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
    }
  }
});

console.log(`Replaced magenta in ${modifiedFiles} files.`);
