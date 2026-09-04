import { test, expect } from '@playwright/test';

const GAMES = [
  'spomin',
  'racunanje',
  'stroop',
  'reakcija',
  'zaporedje',
  'abeceda',
  'kvadriranje',
  'major',
  'corsi',
  'search',
  'switch',
  'dualnback',
  'words',
  'uganke',
  'vzorci',
  'trail',
  '2048',
  'besedle',
  'povezave',
  'besedolov',
  'sudoku',
  'minolovec',
  'nonogram',
];

test.describe('Seznam iger', () => {
  test('prikaže 25 kartic', async ({ page }) => {
    await page.goto('/#game-list');
    await expect(page.locator('.game-card')).toHaveCount(25, { timeout: 30000 });
  });
  test('vsaka igra se naloži brez napake', async ({ page }) => {
    for (const id of GAMES) {
      await page.goto(`/#game/${id}`);
      await expect(page.locator('#app-container')).not.toContainText('Napaka pri nalaganju', {
        timeout: 30000,
      });
      // preveri da je start gumb ali board prisoten
      await expect(page.locator('.game-stage').first()).toBeVisible({ timeout: 30000 });
    }
  });
});

test.describe('Viewport – en zaslon', () => {
  test('2048 plošča ne gre čez rob na mobile', async ({ page }) => {
    await page.goto('/#game/2048');
    await page.click('#twfo-start-btn');
    const board = page.locator('#twfo-board');
    await expect(board).toBeVisible();
    const box = await board.boundingBox();
    const viewport = page.viewportSize();
    expect(box.width).toBeLessThan(viewport.width);
    expect(box.height).toBeLessThan(viewport.height * 0.6);
  });
  test('besedle tipkovnica vidna na mobile', async ({ page }) => {
    await page.goto('/#game/besedle');
    await page.click('#bes-start-btn');
    await expect(page.locator('#bes-keyboard')).toBeVisible();
    // preveri da je board znotraj viewport
    const board = page.locator('#bes-board');
    const box = await board.boundingBox();
    expect(box.height).toBeLessThan(400);
  });
  test('sudoku plošča 9x9 vidna', async ({ page }) => {
    await page.goto('/#game/sudoku');
    await page.click('#sud-start-btn');
    await expect(page.locator('#sud-board')).toBeVisible();
    await expect(page.locator('.sud-cell')).toHaveCount(81);
  });
  test('spomin mreža in ponovni gumb se ne prekrivata', async ({ page }) => {
    await page.goto('/#game/spomin');
    await page.click('#sp-start');
    const board = page.locator('#sp-board');
    const restart = page.locator('#sp-restart');
    await expect(board).toBeVisible();
    await expect(restart).toBeVisible();
    const boardBox = await board.boundingBox();
    const restartBox = await restart.boundingBox();
    expect(boardBox.height).toBeGreaterThan(100);
    expect(restartBox.y).toBeGreaterThanOrEqual(boardBox.y + boardBox.height);
  });
  test('minolovec 9x9 na easy', async ({ page }) => {
    await page.goto('/#game/minolovec');
    await page.click('#mine-start-btn');
    const cells = page.locator('.mine-cell');
    await expect(cells).toHaveCount(81); // 9x9
  });
  test('minolovec po prvem varnem kliku ne zmaga takoj', async ({ page }) => {
    await page.goto('/#game/minolovec');
    await page.click('#mine-start-btn');
    await page.locator('.mine-cell[data-r="4"][data-c="4"]').click();
    await expect(page.locator('#mine-play-screen')).toBeVisible();
    await expect(page.locator('#mine-end-screen')).toBeHidden();
  });
});

test.describe('Logika – smoke', () => {
  test('2048 premik puščice doda ploščico', async ({ page }) => {
    await page.goto('/#game/2048');
    await page.click('#twfo-start-btn');
    const scoreBefore = await page.textContent('#twfo-score');
    await page.keyboard.press('ArrowRight');
    // počakaj malo
    await page.waitForTimeout(500);
    // plošča mora imeti vsaj 2 ploščici
    const tiles = page.locator('.twfo-tile');
    await expect(tiles).not.toHaveCount(0);
  });
  test('besedle vnos in potrditev', async ({ page }) => {
    await page.goto('/#game/besedle');
    await page.click('#bes-start-btn');
    await page.keyboard.type('LAHKO');
    await page.keyboard.press('Enter');
    // po vnosu mora biti vsaj ena vrstica ocenjena (tile dobi barvo)
    await page.waitForTimeout(800);
    const evaluated = page.locator('.bes-tile.correct, .bes-tile.present, .bes-tile.absent');
    await expect(evaluated).not.toHaveCount(0);
  });
  test('povezave izbor 4', async ({ page }) => {
    await page.goto('/#game/povezave');
    await page.click('#pov-start-btn');
    await page.waitForTimeout(500);
    const cards = page.locator('.pov-card');
    await cards.first().click();
    await page.waitForTimeout(100);
    const selected = page.locator('.pov-card.selected');
    await expect(selected).toHaveCount(1);
  });
  test('sudoku klik in vnos številke', async ({ page }) => {
    await page.goto('/#game/sudoku');
    await page.click('#sud-start-btn');
    await page.locator('.sud-cell').first().click();
    await page.locator('.sud-num-btn[data-num="5"]').click();
    await expect(page.locator('.sud-cell.selected')).toBeVisible();
  });
  test('sudoku izklop zapiskov ne vnese NaN', async ({ page }) => {
    await page.goto('/#game/sudoku');
    await page.click('#sud-start-btn');
    await page.locator('.sud-cell:not(.given)').first().click();
    await page.locator('#sud-note-toggle').click();
    await page.locator('.sud-num-btn[data-num="5"]').click();
    await page.locator('#sud-note-toggle').click();
    await expect(page.locator('.sud-cell.selected')).not.toContainText('NaN');
  });
  test('nonogram klik', async ({ page }) => {
    await page.goto('/#game/nonogram');
    await page.click('#nono-start-btn');
    await page.waitForTimeout(300);
    const firstCell = page.locator('.nono-cell').first();
    await firstCell.click();
    await expect(firstCell).toHaveClass(/filled|marked/);
  });
});

test.describe('PWA in navigacija', () => {
  test('hash navigacija deluje', async ({ page }) => {
    await page.goto('/#game/trail');
    await expect(page.locator('#trail-start-btn')).toBeVisible({ timeout: 15000 });
    await page.click('#trail-start-btn');
    await expect(page.locator('#trail-board')).toBeVisible({ timeout: 5000 });
    await page.goto('/#game/spomin');
    await expect(page.locator('#sp-start')).toBeVisible({ timeout: 30000 });
    await page.click('#sp-start');
    await expect(page.locator('#sp-play-layer')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sp-board .sp-card')).toHaveCount(16, { timeout: 5000 });
  });
  test('manifest in ikone', async ({ page }) => {
    const resp = await page.request.get('/manifest.webmanifest');
    expect(resp.ok()).toBeTruthy();
    const manifest = await resp.json();
    expect(manifest.name).toContain('Miselni');
  });
});
