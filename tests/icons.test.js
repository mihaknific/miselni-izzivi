import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

describe('enotna ikona možganov', () => {
  const source = fs.readFileSync(new URL('../icons/brain-noto-512.png', import.meta.url));

  it('uporablja lokalni prosojni vir Noto v velikosti 512 × 512', () => {
    assert.equal(source.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(source.readUInt32BE(16), 512);
    assert.equal(source.readUInt32BE(20), 512);
    assert.ok(source.includes(Buffer.from('IDAT')));
  });

  it('uporablja isti vir za logotipe in ikono zavihka', () => {
    const brainArt = fs.readFileSync(new URL('../icons/brain-art.png', import.meta.url));
    const brainArtData = brainArt.toString('base64');
    const html = read('../index.html');
    const generator = read('../scripts/build-icons.js');
    const brainSvg = read('../icons/brain-logo.svg');
    const faviconSvg = read('../icons/favicon-v2.svg');

    assert.equal((html.match(/\.\/icons\/brain-symbol\.png/g) ?? []).length, 2);
    for (const svg of [brainSvg, faviconSvg]) {
      assert.ok(svg.includes(brainArtData));
      assert.ok(svg.includes('fill="#F472B6"'));
    }
    assert.ok(generator.includes('brainSize = 320'));
    assert.ok(generator.includes('createBrainSymbol'));
    assert.ok(generator.includes('outlineRadius = 18'));
    assert.ok(generator.includes("const iconBackground = '#F472B6'"));
    assert.ok(faviconSvg.includes('stroke="#000000"'));
    assert.ok(faviconSvg.includes('stroke-width="24"'));
    assert.ok(generator.includes('canvas.width * 0.046875'));
    assert.ok(html.includes('./favicon.ico?v=1314'));
    assert.ok(html.includes('./icons/favicon-32-v2.png?v=1314'));
    assert.equal((html.match(/class="h-7 w-7 object-contain" width="28"/g) ?? []).length, 2);
    assert.ok(!html.includes('brain-logo p-1'));
  });

  it('ustvari spletne in maskabilne ikone ter jih predpomni offline', () => {
    const manifest = JSON.parse(read('../manifest.webmanifest'));
    const serviceWorker = read('../service-worker.js');
    const generatedIcons = [
      'brain-art.png',
      'brain-symbol.png',
      'favicon-v2.svg',
      'favicon-32-v2.png',
      'icon-192.png',
      'icon-512.png',
      'icon-192-maskable.png',
      'icon-512-maskable.png',
      'apple-touch-icon.png',
    ];

    for (const icon of generatedIcons) {
      assert.ok(fs.existsSync(new URL(`../icons/${icon}`, import.meta.url)), `${icon} manjka`);
      assert.ok(serviceWorker.includes(`./icons/${icon}`), `${icon} ni v offline predpomnilniku`);
    }
    const faviconIco = fs.readFileSync(new URL('../favicon.ico', import.meta.url));
    assert.equal(faviconIco.readUInt16LE(0), 0);
    assert.equal(faviconIco.readUInt16LE(2), 1);
    assert.equal(faviconIco.readUInt16LE(4), 1);
    assert.equal(faviconIco.readUInt8(6), 32);
    assert.equal(faviconIco.readUInt8(7), 32);
    assert.equal(faviconIco.readUInt32LE(18), 22);
    assert.equal(faviconIco.subarray(22, 30).toString('hex'), '89504e470d0a1a0a');
    assert.ok(serviceWorker.includes('./favicon.ico'));

    assert.ok(
      manifest.icons.some(icon => icon.purpose === 'any' && icon.src === './icons/icon-192.png')
    );
    assert.ok(
      manifest.icons.some(
        icon => icon.purpose === 'maskable' && icon.src === './icons/icon-192-maskable.png'
      )
    );
    assert.equal(manifest.theme_color, '#F472B6');
    assert.equal(manifest.background_color, '#F472B6');
    assert.ok(serviceWorker.includes("const CACHE_VERSION = 'v1314'"));
  });
});
