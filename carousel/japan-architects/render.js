// Renders each .slide of carousel.html:
//   node render.js          -> slides/NN.png (1818×2000, final frame of the motion)
//   node render.js --video  -> video/NN.mp4  (1080×1188, 6 s @ 30 fps, via ffmpeg)
//   add --only=03,05 to render just those slides
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const VIDEO = process.argv.includes('--video'), DUR = 6000, FPS = 30, SCALE = 1080 / 1818;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1900, height: 2100 }, deviceScaleFactor: VIDEO ? SCALE : 1 });
  await page.goto('file://' + path.join(__dirname, 'carousel.html'));
  await page.evaluate(() => window.__ready);
  await page.waitForTimeout(500);
  const seek = t => page.evaluate(t => document.getAnimations().forEach(a => { a.pause(); a.currentTime = t; }), t);
  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    const id = String(i + 1).padStart(2, '0');
    if (ONLY.length && !ONLY.includes(id)) continue;
    await slides[i].scrollIntoViewIfNeeded();
    if (!VIDEO) {
      await seek(DUR);
      await slides[i].screenshot({ path: path.join(__dirname, 'slides', id + '.png') });
      continue;
    }
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'frames-'));
    for (let f = 0; f < DUR / 1000 * FPS; f++) {
      await seek(f * 1000 / FPS);
      await slides[i].screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png') });
    }
    fs.mkdirSync(path.join(__dirname, 'video'), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%04d.png'),
      '-vf', 'scale=1080:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart',
      path.join(__dirname, 'video', id + '.mp4')]);
    fs.rmSync(dir, { recursive: true });
    console.log('video', id);
  }
  await browser.close();
})();
