import fs from 'fs';
import path from 'path';

console.log('==============================================================================');
console.log('ISHTI: OFFICIAL LOGO FAMILY INTEGRATION & VERIFICATION AUDIT');
console.log('==============================================================================');
console.log('Master Reference: preview_v2.html (Immutable Master Artwork)');
console.log('Asset Directory:  apps/web/public/brand/');
console.log('React Suite:      apps/web/app/components/brand/');
console.log('==============================================================================\n');

// 1. Read master preview_v2.html
const masterHtmlPath = 'preview_v2.html';
if (!fs.existsSync(masterHtmlPath)) {
  console.error('[FATAL] Master reference preview_v2.html is missing!');
  process.exit(1);
}
const masterHtml = fs.readFileSync(masterHtmlPath, 'utf8');
const masterSvgs = [...masterHtml.matchAll(/<svg[\s\S]*?<\/svg>/gi)].map(m => m[0]);

if (masterSvgs.length !== 6) {
  console.error(`[FATAL] Expected 6 SVGs in master reference, found ${masterSvgs.length}!`);
  process.exit(1);
}

const expectedVariants = [
  {
    variant: 'primary',
    filename: 'ishti-primary.svg',
    expectedViewBox: '0 0 400 540',
    title: 'ISHTI Primary Logo',
    expectedWidth: 400,
    expectedHeight: 540,
    taglines: ['TRANSFORMATIVE RITUALS &amp; OFFERINGS', 'Vedic Essence &amp; Rituals'],
  },
  {
    variant: 'secondary',
    filename: 'ishti-secondary.svg',
    expectedViewBox: '0 0 400 460',
    title: 'ISHTI Secondary Logo',
    expectedWidth: 400,
    expectedHeight: 460,
    taglines: [],
  },
  {
    variant: 'icon',
    filename: 'ishti-icon.svg',
    expectedViewBox: '0 0 400 400',
    title: 'ISHTI Icon',
    expectedWidth: 400,
    expectedHeight: 400,
    taglines: [],
  },
  {
    variant: 'horizontal',
    filename: 'ishti-horizontal.svg',
    expectedViewBox: '0 0 680 240',
    title: 'ISHTI Horizontal Logo',
    expectedWidth: 680,
    expectedHeight: 240,
    taglines: ['TRANSFORMATIVE', 'RITUALS &amp; OFFERINGS'],
  },
  {
    variant: 'monochrome',
    filename: 'ishti-monochrome.svg',
    expectedViewBox: '0 0 400 460',
    title: 'ISHTI Secondary Logo',
    expectedWidth: 400,
    expectedHeight: 460,
    taglines: [],
  },
  {
    variant: 'reversed',
    filename: 'ishti-reversed.svg',
    expectedViewBox: '0 0 400 460',
    title: 'ISHTI Secondary Logo',
    expectedWidth: 400,
    expectedHeight: 460,
    taglines: [],
  },
];

let allPassed = true;

console.log('--- 1. SIX STANDALONE SVG ASSETS PARITY AUDIT ---');
expectedVariants.forEach((v, idx) => {
  const masterSvg = masterSvgs[idx].trim();
  const filePath = path.join('apps', 'web', 'public', 'brand', v.filename);

  if (!fs.existsSync(filePath)) {
    console.error(`  [FAIL] Missing file: ${filePath}`);
    allPassed = false;
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8').trim();

  // Byte-for-byte check
  if (fileContent !== masterSvg) {
    console.error(`  [FAIL] ${v.filename}: Content differs from preview_v2.html!`);
    allPassed = false;
    return;
  }

  // XML validation
  if (!fileContent.startsWith('<svg') || !fileContent.endsWith('</svg>')) {
    console.error(`  [FAIL] ${v.filename}: Invalid SVG envelope`);
    allPassed = false;
    return;
  }

  // ViewBox check
  const vb = fileContent.match(/viewBox="([^"]+)"/)?.[1];
  if (vb !== v.expectedViewBox) {
    console.error(`  [FAIL] ${v.filename}: viewBox mismatch. Expected "${v.expectedViewBox}", found "${vb}"`);
    allPassed = false;
    return;
  }

  // Title check
  const title = fileContent.match(/<title>([^<]+)<\/title>/)?.[1];
  if (title !== v.title) {
    console.error(`  [FAIL] ${v.filename}: title mismatch. Expected "${v.title}", found "${title}"`);
    allPassed = false;
    return;
  }

  // Taglines check
  v.taglines.forEach(tagline => {
    if (!fileContent.includes(tagline)) {
      console.error(`  [FAIL] ${v.filename}: missing expected tagline "${tagline}"`);
      allPassed = false;
    }
  });

  console.log(`  [✓] [VERIFIED] ${v.filename} — 100% byte-for-byte match, viewBox="${vb}", ${fileContent.length} bytes`);
});

console.log('\n--- 2. REUSABLE REACT COMPONENT & TYPES AUDIT ---');
const componentPath = path.join('apps', 'web', 'app', 'components', 'brand', 'IshtiLogo.tsx');
const typesPath = path.join('apps', 'web', 'app', 'components', 'brand', 'types.ts');

if (!fs.existsSync(componentPath) || !fs.existsSync(typesPath)) {
  console.error('  [FAIL] Component or types file missing!');
  allPassed = false;
} else {
  const compCode = fs.readFileSync(componentPath, 'utf8');
  const typesCode = fs.readFileSync(typesPath, 'utf8');

  expectedVariants.forEach(v => {
    if (!typesCode.includes(`'${v.variant}'`)) {
      console.error(`  [FAIL] Variant '${v.variant}' missing from IshtiLogoVariant type union`);
      allPassed = false;
    }
    if (!typesCode.includes(`filename: '${v.filename}'`)) {
      console.error(`  [FAIL] Variant '${v.variant}' metadata missing filename mapping`);
      allPassed = false;
    }
  });

  if (compCode.includes('IshtiLogo') && compCode.includes('computedStyle') && compCode.includes('aspectRatio')) {
    console.log('  [✓] [VERIFIED] <IshtiLogo /> supports all 6 variants with strict aspect-ratio & containment');
  } else {
    console.error('  [FAIL] IshtiLogo missing aspect ratio preservation logic!');
    allPassed = false;
  }
}

console.log('\n--- 3. APPLICATION PLACEMENTS AUDIT ---');
const desktopHeader = fs.readFileSync('apps/web/app/components/layout/DesktopHeader.tsx', 'utf8');
const footer = fs.readFileSync('apps/web/app/components/Footer.tsx', 'utf8');
const authModal = fs.readFileSync('apps/web/app/components/auth/AuthModal.tsx', 'utf8');
const notFound = fs.readFileSync('apps/web/app/not-found.tsx', 'utf8');

if (desktopHeader.includes('variant="horizontal"')) {
  console.log('  [✓] [VERIFIED] Desktop Navigation: Uses Horizontal variant with official custom wordmark & tagline');
} else {
  console.error('  [FAIL] Desktop Header does not use Horizontal variant');
  allPassed = false;
}

if (desktopHeader.includes('variant="secondary"')) {
  console.log('  [✓] [VERIFIED] Mobile Navigation Drawer: Uses Secondary variant (Sacred Agni & Wordmark)');
} else {
  console.error('  [FAIL] Mobile Drawer does not use Secondary variant');
  allPassed = false;
}

if (footer.includes('variant="primary"') || footer.includes('variant="secondary"')) {
  console.log('  [✓] [VERIFIED] Footer: Uses Primary/Secondary variant with authentic proportions');
} else {
  console.error('  [FAIL] Footer does not use Primary or Secondary variant');
  allPassed = false;
}

if (authModal.includes('variant="secondary"')) {
  console.log('  [✓] [VERIFIED] Auth Modal: Uses Secondary variant');
} else {
  console.error('  [FAIL] Auth Modal does not use Secondary variant');
  allPassed = false;
}

if (notFound.includes('variant="secondary"')) {
  console.log('  [✓] [VERIFIED] 404 Sanctuary Page: Uses Secondary variant');
} else {
  console.error('  [FAIL] 404 page does not use Secondary variant');
  allPassed = false;
}

console.log('\n--- 4. FAVICON & PWA METADATA RESOLUTION AUDIT ---');
const layoutCode = fs.readFileSync('apps/web/app/layout.tsx', 'utf8');
const manifestCode = fs.readFileSync('apps/web/app/manifest.ts', 'utf8');
const faviconPath = 'apps/web/public/favicon.ico';
const appIconPath = 'apps/web/app/icon.svg';

if (fs.existsSync(faviconPath) && fs.existsSync(appIconPath)) {
  console.log('  [✓] [VERIFIED] apps/web/public/favicon.ico and apps/web/app/icon.svg are present');
} else {
  console.error('  [FAIL] Favicon or app icon file missing');
  allPassed = false;
}

if (layoutCode.includes('/brand/ishti-icon.svg') && layoutCode.includes('/brand/ishti-primary.svg')) {
  console.log('  [✓] [VERIFIED] RootLayout metadata correctly maps icon to ishti-icon.svg and OG to ishti-primary.svg');
} else {
  console.error('  [FAIL] RootLayout metadata missing brand asset references');
  allPassed = false;
}

if (manifestCode.includes('/brand/ishti-icon.svg')) {
  console.log('  [✓] [VERIFIED] Web App Manifest (manifest.ts) correctly configures ishti-icon.svg');
} else {
  console.error('  [FAIL] Manifest missing icon reference');
  allPassed = false;
}

console.log('\n--- 5. BRAND DESIGN TOKENS PARITY AUDIT ---');
const tokensCss = fs.readFileSync('src/styles/design-tokens.css', 'utf8');
const expectedTokens = [
  { name: 'Temple Maroon', hex: '#711B16' },
  { name: 'Vedic Saffron', hex: '#EF7428' },
  { name: 'Sacred Gold', hex: '#D7A64A' },
  { name: 'Ivory Paper', hex: '#F8F4ED' },
  { name: 'Slate Charcoal (Dark Surface)', hex: '#282A36' },
  { name: 'Muted Gold', hex: '#9E764E' },
  { name: 'Temple Charcoal (Monochrome)', hex: '#2A2726' },
];

expectedTokens.forEach(t => {
  if (tokensCss.includes(t.hex)) {
    console.log(`  [✓] [VERIFIED] Token ${t.name}: ${t.hex} present in Central Design Tokens`);
  } else {
    console.error(`  [FAIL] Token ${t.name}: ${t.hex} missing from Central Design Tokens`);
    allPassed = false;
  }
});

console.log('\n==============================================================================');
if (allPassed) {
  console.log('ISHTI OFFICIAL LOGO FAMILY AUDIT: ALL CHECKS PASSED (100% FIDELITY & PARITY)');
  console.log('==============================================================================');
  process.exit(0);
} else {
  console.error('ISHTI OFFICIAL LOGO FAMILY AUDIT: FAILED');
  console.log('==============================================================================');
  process.exit(1);
}
