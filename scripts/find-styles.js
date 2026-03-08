// Simple scanner to locate inline styles and <style> blocks across the repo HTML files
// Usage: node scripts/find-styles.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.html', '.htm'];

function walk(dir, cb) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) walk(fp, cb);
    else cb(fp);
  }
}

const results = { inlineAttrs: [], styleBlocks: [], linkSheets: [] };
walk(root, file => {
  if (!exts.includes(path.extname(file).toLowerCase())) return;
  const rel = path.relative(root, file);
  const content = fs.readFileSync(file, 'utf8');

  // Find inline style attributes
  const inlineRegex = /\bstyle=\"([^\"]*)\"/gi;
  let m;
  while ((m = inlineRegex.exec(content)) !== null) {
    results.inlineAttrs.push({ file: rel, snippet: m[0], value: m[1].trim() });
  }

  // Find <style> blocks
  const styleBlockRegex = /<style[\s\S]*?>[\s\S]*?<\/style>/gi;
  while ((m = styleBlockRegex.exec(content)) !== null) {
    const snippet = m[0].slice(0, 400).replace(/\s+/g,' ').trim();
    results.styleBlocks.push({ file: rel, snippet });
  }

  // Find external CSS links
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  while ((m = linkRegex.exec(content)) !== null) {
    results.linkSheets.push({ file: rel, snippet: m[0] });
  }
});

console.log('\nTuwa style scan results:');
console.log('Inline style attributes found:', results.inlineAttrs.length);
if (results.inlineAttrs.length) console.log(results.inlineAttrs.slice(0,20));
console.log('\nStyle blocks found:', results.styleBlocks.length);
if (results.styleBlocks.length) console.log(results.styleBlocks.slice(0,20));
console.log('\nExternal stylesheet links found:', results.linkSheets.length);
if (results.linkSheets.length) console.log(results.linkSheets.slice(0,20));

console.log('\nNext steps: review the list, then plan conversions:');
console.log('- Replace inline style attributes with Tailwind utility classes');
console.log('- Move <style> blocks into components in src/styles.css under @layer components or base');
console.log('- Build the Tailwind CSS and switch HTML to use assets/tuwa-tailwind.css when ready');
