import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const source = path.resolve('assets/inmson-recorrido-vr.mp4');
if (!existsSync(source)) throw new Error(`Missing INMSON source recording: ${source}`);

const clips = [
  { start: '0.5', duration: '6', file: 'assets/inmson-recorrido-gesto.gif' },
  { start: '8.5', duration: '3.1', file: 'assets/inmson-recorrido-espacio.gif' },
];

for (const clip of clips) {
  const filter = 'fps=7,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3[gif]';
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-ss', clip.start,
    '-t', clip.duration, '-i', source, '-an', '-filter_complex', filter,
    '-map', '[gif]', '-loop', '0', clip.file,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0 || !existsSync(clip.file)) throw new Error(`ffmpeg failed to create ${clip.file}`);
  console.log(`${clip.file}: ${(statSync(clip.file).size / 1024 / 1024).toFixed(2)} MB`);
}
