/**
 * Generate the app icon / splash / favicon / Android adaptive PNGs from the
 * ChargeOps brand mark, so they always match the in-app <BrandMark> artwork.
 *
 * Dev-only tool (not bundled): run `node scripts/generate-icons.mjs`.
 * Rasterizes with @resvg/resvg-js (devDependency). Edit the SVGs below or the
 * shared bolt path, then re-run to regenerate every size.
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(root, 'assets');
const BRAND = join(ASSETS, 'brand');
mkdirSync(BRAND, { recursive: true });

const EMERALD = '#10B981';
const WHITE = '#ffffff';
const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';
const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

// Full-bleed icon (iOS/Android mask the corners themselves).
const icon = wrap(
  `<rect width="100" height="100" fill="${EMERALD}"/>` +
    `<circle cx="50" cy="50" r="33" fill="${WHITE}" opacity="0.12"/>` +
    `<path d="${BOLT}" transform="translate(14,11) scale(0.72)" fill="${WHITE}"/>`,
);
// Rounded mark with transparent corners (splash, shown on a background color).
const splash = wrap(
  `<rect x="4" y="4" width="92" height="92" rx="24" fill="${EMERALD}"/>` +
    `<circle cx="50" cy="50" r="33" fill="${WHITE}" opacity="0.12"/>` +
    `<path d="${BOLT}" transform="translate(14,11) scale(0.72)" fill="${WHITE}"/>`,
);
// Android adaptive foreground: white bolt centered inside the safe zone.
const foreground = wrap(
  `<path d="${BOLT}" transform="translate(24.25,25) scale(0.5)" fill="${WHITE}"/>`,
);
// Android adaptive background: solid emerald.
const background = wrap(`<rect width="100" height="100" fill="${EMERALD}"/>`);
// Android themed (monochrome) layer: bolt silhouette, system tints it.
const monochrome = wrap(
  `<path d="${BOLT}" transform="translate(24.25,25) scale(0.5)" fill="#000000"/>`,
);

const masters = { icon, splash, foreground, background, monochrome };
for (const [name, svg] of Object.entries(masters)) {
  writeFileSync(join(BRAND, `${name}.svg`), svg);
}

const outputs = [
  ['icon.png', icon, 1024],
  ['splash-icon.png', splash, 1024],
  ['favicon.png', icon, 48],
  ['android-icon-foreground.png', foreground, 1024],
  ['android-icon-background.png', background, 1024],
  ['android-icon-monochrome.png', monochrome, 1024],
];

for (const [file, svg, size] of outputs) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(ASSETS, file), png);
  console.log(`✓ ${file} (${size}px)`);
}
console.log('Done. Master SVGs saved to assets/brand/.');
