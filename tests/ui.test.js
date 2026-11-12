import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, renderGameList } from '../js/ui.js';

describe('ui (real module)', () => {
  it('escapeHtml nevtralizira HTML', () => {
    assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapeHtml obravnava null/undefined', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });

  it('escapeHtml ohranja navadno besedilo', () => {
    assert.equal(escapeHtml('Hello world 123'), 'Hello world 123');
  });

  it('escapeHtml ubeži narekovaje', () => {
    assert.equal(escapeHtml('"test"'), '&quot;test&quot;');
  });

  it('prikaže možgane z obrisom v velikosti drugih ikon na kartici', () => {
    const html = renderGameList([
      { id: 'memory', tag: 'Spomin', title: 'Preizkus spomina', description: 'Vadba spomina.' },
    ]);

    assert.match(
      html,
      /<div class="w-14 h-14 bg-brutal-pink border-3 border-black flex items-center justify-center text-2xl font-black shadow-brutal-sm">\s*<img src="\.\/icons\/brain-symbol\.png" alt="" aria-hidden="true" class="h-7 w-7 object-contain" width="28" height="28" \/>/
    );
  });

  it('ohrani hero oznako v naravni širini in doda jasnejši razmik', () => {
    const html = renderGameList([
      { id: 'memory', tag: 'Spomin', title: 'Preizkus spomina', description: 'Vadba spomina.' },
    ]);

    assert.match(html, /max-w-3xl mx-auto text-center stack stack--lg/);
    assert.match(html, /inline-block self-center bg-brutal-orange/);
  });
});
