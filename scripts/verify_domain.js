const fs = require('fs');
const path = require('path');

const domainDir = path.join(__dirname, '..', 'src', 'domain');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const tsFiles = getAllFiles(domainDir);
const forbiddenPatterns = [
  /from\s+['"]react['"]/,
  /from\s+['"]react-native['"]/,
  /from\s+['"]expo/,
  /from\s+['"]@shopify/,
  /from\s+['"]@nozbe/,
  /from\s+['"]@supabase/,
  /from\s+['"]zustand/
];

let violations = 0;

tsFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  forbiddenPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      console.error(`[VIOLATION] Forbidden import matching ${pattern} found in: ${file}`);
      violations++;
    }
  });
});

if (violations === 0) {
  console.log(`[PASS] Domain integrity check passed (${tsFiles.length} files scanned, 0 violations).`);
  process.exit(0);
} else {
  console.error(`[FAIL] ${violations} violations found in domain layer.`);
  process.exit(1);
}
