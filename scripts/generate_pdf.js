const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const htmlPath = path.join(__dirname, '..', 'Capstone-Report-1-Proposal.html');
const pdfPath = path.join(__dirname, '..', 'Capstone-Report-1-Proposal.pdf');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const command = `"${edgePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}"`;

console.log('Converting HTML to PDF via Microsoft Edge Chromium Engine...');
execSync(command, { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`SUCCESS: PDF generated cleanly at ${pdfPath} (${stats.size} bytes)`);
} else {
  console.error('ERROR: PDF file not found after generation.');
  process.exit(1);
}
