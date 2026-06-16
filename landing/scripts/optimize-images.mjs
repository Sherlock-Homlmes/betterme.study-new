// Optimize public/ raster images with sharp.
//
// Mascot images are SPRITE SHEETS (1536x1872, 192x208 frames, coords hardcoded
// in src/scripts/main.js). We MUST keep pixel dimensions unchanged or the frame
// math breaks. So we only re-encode (lossy webp q80) to shrink file size, and
// convert the lone PNG sprite (capybara) to webp.
//
// Run: node scripts/optimize-images.mjs   (inside the landing container)

import sharp from 'sharp';
import { readdir, mkdir, stat, rename, unlink, copyFile, access } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname;
const BACKUP_DIR = new URL('../.image-backup/', import.meta.url).pathname;

const WEBP_OPTS = { quality: 80, effort: 6, smartSubsample: true };

// PNG sprite sheets to convert to webp (must keep dimensions).
const PNG_TO_WEBP = new Set(['capybara.png']);
// PNGs to keep as PNG but re-compress (palette quantize), e.g. QR codes.
const PNG_KEEP = new Set(['qr-betterme.png', 'favicon.png']);

const fmtKB = (b) => `${(b / 1024).toFixed(1)} KB`;

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function backup(file) {
  const src = join(PUBLIC_DIR, file);
  const dst = join(BACKUP_DIR, file);
  if (!(await exists(dst))) await copyFile(src, dst);
}

async function processFile(file) {
  const ext = extname(file).toLowerCase();
  const name = basename(file, ext);
  const src = join(PUBLIC_DIR, file);
  const before = (await stat(src)).size;
  const meta = await sharp(src).metadata();

  let outName, tmp, pipeline;

  if (ext === '.webp') {
    outName = file;
    tmp = join(PUBLIC_DIR, `.tmp-${file}`);
    pipeline = sharp(src).webp(WEBP_OPTS);
  } else if (ext === '.png' && PNG_TO_WEBP.has(file)) {
    outName = `${name}.webp`;
    tmp = join(PUBLIC_DIR, `.tmp-${outName}`);
    pipeline = sharp(src).webp(WEBP_OPTS);
  } else if (ext === '.png' && PNG_KEEP.has(file)) {
    outName = file;
    tmp = join(PUBLIC_DIR, `.tmp-${file}`);
    pipeline = sharp(src).png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 });
  } else {
    return null;
  }

  await backup(file);
  await pipeline.toFile(tmp);
  const after = (await stat(tmp)).size;
  await rename(tmp, join(PUBLIC_DIR, outName));

  // If we converted png -> webp, drop the original png from public.
  if (outName !== file) await unlink(src);

  return {
    file, out: outName, dims: `${meta.width}x${meta.height}`,
    before, after, saved: (1 - after / before) * 100,
  };
}

async function main() {
  await mkdir(BACKUP_DIR, { recursive: true });
  const entries = await readdir(PUBLIC_DIR);
  const targets = entries.filter((f) => /\.(webp|png)$/i.test(f));

  let totalBefore = 0, totalAfter = 0;
  const rows = [];
  for (const f of targets) {
    const r = await processFile(f);
    if (r) { rows.push(r); totalBefore += r.before; totalAfter += r.after; }
  }

  console.log('\nImage optimization (dimensions unchanged — sprite-safe):\n');
  for (const r of rows) {
    const arrow = r.out === r.file ? '' : ` -> ${r.out}`;
    console.log(
      `  ${r.file}${arrow}  [${r.dims}]  ${fmtKB(r.before)} -> ${fmtKB(r.after)}  (-${r.saved.toFixed(0)}%)`
    );
  }
  console.log(
    `\n  TOTAL: ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)} ` +
    `(-${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%, saved ${fmtKB(totalBefore - totalAfter)})\n`
  );
  console.log(`  Originals backed up to landing/.image-backup/\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
