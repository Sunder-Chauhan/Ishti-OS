import fs from 'fs';
import path from 'path';

const htmlPath = 'preview_v2.html';
if (!fs.existsSync(htmlPath)) {
  console.error(`Fatal: ${htmlPath} does not exist!`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Match all 6 SVGs from preview_v2.html
const svgMatches = [...html.matchAll(/<svg[\s\S]*?<\/svg>/gi)].map(m => m[0]);

if (svgMatches.length !== 6) {
  console.error(`Fatal: expected 6 SVGs in ${htmlPath}, but found ${svgMatches.length}`);
  process.exit(1);
}

const targetVariants = [
  { filename: 'ishti-primary.svg', legacy: 'ishti-logo-primary.svg', expectedViewBox: '0 0 400 540', title: 'ISHTI Primary Logo' },
  { filename: 'ishti-secondary.svg', legacy: 'ishti-logo-secondary.svg', expectedViewBox: '0 0 400 460', title: 'ISHTI Secondary Logo' },
  { filename: 'ishti-icon.svg', legacy: 'ishti-logo-icon.svg', expectedViewBox: '0 0 400 400', title: 'ISHTI Icon' },
  { filename: 'ishti-horizontal.svg', legacy: 'ishti-logo-horizontal.svg', expectedViewBox: '0 0 680 240', title: 'ISHTI Horizontal Logo' },
  { filename: 'ishti-monochrome.svg', legacy: 'ishti-logo-monochrome.svg', expectedViewBox: '0 0 400 460', title: 'ISHTI Secondary Logo' },
  { filename: 'ishti-reversed.svg', legacy: 'ishti-logo-reversed.svg', expectedViewBox: '0 0 400 460', title: 'ISHTI Secondary Logo' },
];

const brandDir = path.join('apps', 'web', 'public', 'brand');
if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

console.log('Extracting and verifying verbatim SVGs from preview_v2.html:\n');

targetVariants.forEach((variant, idx) => {
  const rawSvg = svgMatches[idx].trim();
  
  // Verify viewBox
  const vbMatch = rawSvg.match(/viewBox="([^"]+)"/i);
  const actualVb = vbMatch ? vbMatch[1] : null;
  if (actualVb !== variant.expectedViewBox) {
    console.error(`[FAIL] Variant ${variant.filename}: expected viewBox "${variant.expectedViewBox}", found "${actualVb}"`);
    process.exit(1);
  }

  // Verify Title
  const titleMatch = rawSvg.match(/<title>([^<]+)<\/title>/i);
  const actualTitle = titleMatch ? titleMatch[1] : null;
  if (actualTitle !== variant.title) {
    console.error(`[FAIL] Variant ${variant.filename}: expected title "${variant.title}", found "${actualTitle}"`);
    process.exit(1);
  }

  // Destination paths
  const canonicalPath = path.join(brandDir, variant.filename);
  const legacyPath = path.join(brandDir, variant.legacy);

  fs.writeFileSync(canonicalPath, rawSvg + '\n', 'utf8');
  fs.writeFileSync(legacyPath, rawSvg + '\n', 'utf8');

  console.log(`[✓] Extracted ${variant.filename}`);
  console.log(`    - Destination: ${canonicalPath}`);
  console.log(`    - Legacy alias: ${legacyPath}`);
  console.log(`    - viewBox: ${actualVb}`);
  console.log(`    - Size: ${Buffer.byteLength(rawSvg, 'utf8')} bytes`);
});

console.log('\nAll 6 approved SVG assets successfully extracted with 100% vector parity.');
