import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Assemble generated sprite sheets without changing the original artwork.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = process.argv.slice(2);
const sequence = [0, 1, 2, 3, 4, 5, 6, 7, 7, 6, 5, 4, 3, 2, 1, 0];
const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

for (const name of names.length ? names : ['front', 'side', 'back']) {
  if (!['front', 'side', 'back', 'scroll', 'scroll-original-v2', 'scroll-original-v3', 'scroll-original-v4', 'scroll-original-v5', 'scroll-original-v6'].includes(name)) throw new Error(`Unknown variant: ${name}`);
  const isScroll = name.startsWith('scroll');
  const columns = isScroll ? 6 : 4;
  const rows = isScroll ? 4 : 2;
  const frameCount = columns * rows;
  const frames = isScroll ? Array.from({ length: frameCount }, (_, index) => index) : sequence;
  const frameRate = isScroll ? 12 : 5;
  const size = isScroll ? '256:256' : '288:384';
  const source = path.join(root, 'output/loading-mascot/source', `${name}.png`);
  const destination = path.join(root, 'assets/images/loading-mascot', `saju-writing-${name}.gif`);
  const temporary = mkdtempSync(path.join(tmpdir(), 'saju-loading-'));
  mkdirSync(path.dirname(destination), { recursive: true });
  try {
    for (let index = 0; index < frameCount; index++) {
      run(['-i', source, '-vf',
        `crop=iw/${columns}:ih/${rows}:${index % columns}*iw/${columns}:${Math.floor(index / columns)}*ih/${rows},scale=${size}:flags=lanczos`,
        '-frames:v', '1', path.join(temporary, `pose-${index}.png`)]);
    }
    frames.forEach((pose, index) => copyFileSync(
      path.join(temporary, `pose-${pose}.png`),
      path.join(temporary, `frame-${String(index).padStart(2, '0')}.png`),
    ));
    run(['-framerate', String(frameRate), '-i', path.join(temporary, 'frame-%02d.png'),
      '-filter_complex', '[0:v]split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:alpha_threshold=128',
      '-loop', '0', destination]);
    console.log(destination);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
