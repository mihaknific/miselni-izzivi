import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(scriptDir, '..', 'icons');
const sourcePath = path.join(iconsDir, 'brain-noto-512.png');
const iconBackground = '#F472B6';

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Manjka izvorna ikona: ${sourcePath}`);
}

const sourceData = fs.readFileSync(sourcePath).toString('base64');
const brainImage = `data:image/png;base64,${sourceData}`;

function createBrainSvg(brainArtData) {
  const outlinedBrainImage = `data:image/png;base64,${brainArtData}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Možgani">
  <rect width="512" height="512" fill="${iconBackground}"/>
  <image href="${outlinedBrainImage}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

function createFaviconSvg(brainArtData) {
  const outlinedBrainImage = `data:image/png;base64,${brainArtData}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Možgani">
  <rect width="512" height="512" fill="${iconBackground}"/>
  <image href="${outlinedBrainImage}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>
  <rect x="8" y="8" width="496" height="496" fill="none" stroke="#000000" stroke-width="24"/>
</svg>`;
}

async function createOutlinedBrain(page) {
  await page.setContent(`<img src="${brainImage}" alt=""/>`);
  const image = page.locator('img');
  await image.evaluate(element => element.decode());

  const brainArtData = await image.evaluate(element => {
    const size = 512;
    const brainSize = 320;
    const outlineRadius = 18;
    const offset = (size - brainSize) / 2;
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = size;
    sourceCanvas.height = size;
    const sourceContext = sourceCanvas.getContext('2d');
    sourceContext.drawImage(element, offset, offset, brainSize, brainSize);

    const sourcePixels = sourceContext.getImageData(0, 0, size, size);
    const horizontalAlpha = new Uint8ClampedArray(size * size);
    const expandedAlpha = new Uint8ClampedArray(size * size);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let alpha = 0;
        for (let dx = -outlineRadius; dx <= outlineRadius; dx += 1) {
          const sampleX = x + dx;
          if (sampleX >= 0 && sampleX < size) {
            alpha = Math.max(alpha, sourcePixels.data[(y * size + sampleX) * 4 + 3]);
          }
        }
        horizontalAlpha[y * size + x] = alpha;
      }
    }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let alpha = 0;
        for (let dy = -outlineRadius; dy <= outlineRadius; dy += 1) {
          const sampleY = y + dy;
          if (sampleY >= 0 && sampleY < size) {
            alpha = Math.max(alpha, horizontalAlpha[sampleY * size + x]);
          }
        }
        expandedAlpha[y * size + x] = alpha;
      }
    }

    const outlinedPixels = new ImageData(size, size);
    for (let pixel = 0; pixel < expandedAlpha.length; pixel += 1) {
      outlinedPixels.data[pixel * 4 + 3] = expandedAlpha[pixel];
    }

    const outlinedCanvas = document.createElement('canvas');
    outlinedCanvas.width = size;
    outlinedCanvas.height = size;
    const outlinedContext = outlinedCanvas.getContext('2d');
    outlinedContext.putImageData(outlinedPixels, 0, 0);
    outlinedContext.drawImage(sourceCanvas, 0, 0);
    return outlinedCanvas.toDataURL('image/png').split(',')[1];
  });

  return Buffer.from(brainArtData, 'base64');
}

async function createBrainSymbol(page, brainArtData) {
  const outlinedBrainImage = `data:image/png;base64,${brainArtData}`;
  await page.setContent(`<img src="${outlinedBrainImage}" alt=""/>`);
  const image = page.locator('img');
  await image.evaluate(element => element.decode());

  const symbolData = await image.evaluate(element => {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = element.naturalWidth;
    sourceCanvas.height = element.naturalHeight;
    const sourceContext = sourceCanvas.getContext('2d');
    sourceContext.drawImage(element, 0, 0);
    const { data, width, height } = sourceContext.getImageData(
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height
    );
    let left = width;
    let top = height;
    let right = 0;
    let bottom = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    const padding = Math.ceil(Math.max(right - left + 1, bottom - top + 1) * 0.06);
    left = Math.max(0, left - padding);
    right = Math.min(width - 1, right + padding);
    top = Math.max(0, top - padding);
    bottom = Math.min(height - 1, bottom + padding);
    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;
    const symbolCanvas = document.createElement('canvas');
    symbolCanvas.width = 512;
    symbolCanvas.height = 512;
    const scale = 512 / Math.max(cropWidth, cropHeight);
    const drawWidth = cropWidth * scale;
    const drawHeight = cropHeight * scale;
    const context = symbolCanvas.getContext('2d');
    context.drawImage(
      sourceCanvas,
      left,
      top,
      cropWidth,
      cropHeight,
      (512 - drawWidth) / 2,
      (512 - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    return symbolCanvas.toDataURL('image/png').split(',')[1];
  });

  return Buffer.from(symbolData, 'base64');
}

async function renderIcon(page, brainArtData, size, artworkScale = 1, withFrame = false) {
  const outlinedBrainImage = `data:image/png;base64,${brainArtData}`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html>
<html>
  <head>
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
      canvas { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body><canvas width="${size}" height="${size}"></canvas><img src="${outlinedBrainImage}" alt="" hidden/></body>
</html>`);

  const image = page.locator('img');
  await image.evaluate(element => element.decode());
  await page.evaluate(
    ({ artworkScale, background, withFrame }) => {
      const canvas = document.querySelector('canvas');
      const context = canvas.getContext('2d');
      const image = document.querySelector('img');
      const imageSize = canvas.width * artworkScale;
      const offset = (canvas.width - imageSize) / 2;
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, offset, offset, imageSize, imageSize);
      if (withFrame) {
        context.strokeStyle = '#000000';
        context.lineWidth = canvas.width * 0.046875;
        context.strokeRect(
          context.lineWidth / 2,
          context.lineWidth / 2,
          canvas.width - context.lineWidth,
          canvas.height - context.lineWidth
        );
      }
    },
    { artworkScale, background: iconBackground, withFrame }
  );
  return page.screenshot({ type: 'png' });
}

async function generatePngs() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const brainArt = await createOutlinedBrain(page);
    fs.writeFileSync(path.join(iconsDir, 'brain-art.png'), brainArt);
    const brainArtData = brainArt.toString('base64');
    const brainSymbol = await createBrainSymbol(page, brainArtData);
    fs.writeFileSync(path.join(iconsDir, 'brain-symbol.png'), brainSymbol);
    const brainSvg = createBrainSvg(brainArtData);
    fs.writeFileSync(path.join(iconsDir, 'brain-logo.svg'), brainSvg, 'utf8');
    const faviconSvg = createFaviconSvg(brainArtData);
    fs.writeFileSync(path.join(iconsDir, 'favicon-v2.svg'), faviconSvg, 'utf8');
    fs.writeFileSync(path.join(iconsDir, 'icon.svg'), faviconSvg, 'utf8');
    console.log('✅ icons/brain-art.png generiran z vidnim črnim obrisom');
    console.log('✅ icons/brain-symbol.png generiran za ikone velikosti emojija');
    console.log('✅ icons/favicon-v2.svg generiran s kvadratnim črnim robom');

    const targets = [
      { file: 'brain-logo.png', size: 512, artworkScale: 1 },
      { file: 'favicon-32-v2.png', size: 32, artworkScale: 1, withFrame: true },
      { file: 'icon-512.png', size: 512, artworkScale: 1 },
      { file: 'icon-192.png', size: 192, artworkScale: 1 },
      { file: 'icon-512-maskable.png', size: 512, artworkScale: 0.88 },
      { file: 'icon-192-maskable.png', size: 192, artworkScale: 0.88 },
      { file: 'apple-touch-icon.png', size: 180, artworkScale: 1 },
    ];

    for (const target of targets) {
      const buffer = await renderIcon(
        page,
        brainArtData,
        target.size,
        target.artworkScale,
        target.withFrame
      );
      fs.writeFileSync(path.join(iconsDir, target.file), buffer);
      console.log(`✅ icons/${target.file} generiran (${target.size}x${target.size})`);
      if (target.file === 'favicon-32-v2.png') {
        const icoHeader = Buffer.alloc(22);
        icoHeader.writeUInt16LE(0, 0);
        icoHeader.writeUInt16LE(1, 2);
        icoHeader.writeUInt16LE(1, 4);
        icoHeader.writeUInt8(32, 6);
        icoHeader.writeUInt8(32, 7);
        icoHeader.writeUInt8(0, 8);
        icoHeader.writeUInt8(0, 9);
        icoHeader.writeUInt16LE(1, 10);
        icoHeader.writeUInt16LE(32, 12);
        icoHeader.writeUInt32LE(buffer.length, 14);
        icoHeader.writeUInt32LE(22, 18);
        fs.writeFileSync(
          path.join(scriptDir, '..', 'favicon.ico'),
          Buffer.concat([icoHeader, buffer])
        );
        console.log('✅ favicon.ico generiran za Live Server in klasične brskalnike');
      }
    }
  } finally {
    await browser.close();
  }
}

generatePngs().catch(error => {
  console.error('Napaka pri generiranju PNG ikon:', error);
  process.exitCode = 1;
});
