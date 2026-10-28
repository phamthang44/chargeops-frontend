import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');

console.log('[post-export-web] Starting post-export asset cleanup for Cloudflare Pages...');

if (!fs.existsSync(distDir)) {
  console.error('[post-export-web] dist directory not found. Please run expo export first.');
  process.exit(1);
}

// 1. Move dist/assets/node_modules -> dist/assets/compiled
// Cloudflare Pages / Wrangler automatically ignores and skips uploading any folder named "node_modules".
const oldAssetDir = path.join(distDir, 'assets', 'node_modules');
const newAssetDir = path.join(distDir, 'assets', 'compiled');

if (fs.existsSync(oldAssetDir)) {
  if (fs.existsSync(newAssetDir)) {
    fs.rmSync(newAssetDir, { recursive: true, force: true });
  }
  fs.renameSync(oldAssetDir, newAssetDir);
  console.log('[post-export-web] Renamed dist/assets/node_modules -> dist/assets/compiled');
} else if (fs.existsSync(newAssetDir)) {
  console.log('[post-export-web] dist/assets/compiled already exists, skipping rename.');
} else {
  console.warn('[post-export-web] Neither dist/assets/node_modules nor dist/assets/compiled found.');
}

// 2. Replace references in generated bundles and HTML
function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = walk(distDir);
let replacedCount = 0;

for (const filePath of allFiles) {
  if (
    filePath.endsWith('.js') ||
    filePath.endsWith('.html') ||
    filePath.endsWith('.json') ||
    filePath.endsWith('.css')
  ) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('assets/node_modules/')) {
      const updated = content.replaceAll('assets/node_modules/', 'assets/compiled/');
      fs.writeFileSync(filePath, updated, 'utf8');
      replacedCount++;
      console.log(`[post-export-web] Patched asset references in: ${path.relative(distDir, filePath)}`);
    }
  }
}

console.log(`[post-export-web] Patched ${replacedCount} file(s).`);

// 3. Create _redirects in dist/ and public/
// Rewrite old requests to the compiled asset path and fallback SPA routes to /index.html 200
const redirectsContent = `/assets/node_modules/* /assets/compiled/:splat 200\n/* /index.html 200\n`;

fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent, 'utf8');
console.log('[post-export-web] Created dist/_redirects');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent, 'utf8');
console.log('[post-export-web] Created public/_redirects');

console.log('[post-export-web] Successfully prepared dist for Cloudflare Pages deployment!');
