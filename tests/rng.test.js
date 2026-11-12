import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mulberry32,
  stringToSeed,
  dateToSeed,
  shuffle,
  weightedChoice,
  randomInt,
  randomFloat,
} from '../js/utils/rng.js';

describe('rng utils (real module)', () => {
  it('mulberry32 je determinističen', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    assert.deepEqual(seqA, seqB);
  });

  it('mulberry32 vrača vrednosti v [0,1)', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      assert.ok(v >= 0 && v < 1, `vrednost ${v} izven [0,1)`);
    }
  });

  it('stringToSeed je determinističen', () => {
    assert.equal(stringToSeed('abc'), stringToSeed('abc'));
  });

  it('dateToSeed = stringToSeed', () => {
    assert.equal(dateToSeed('2026-11-06'), stringToSeed('2026-11-06'));
  });

  it('shuffle ne mutira originala in ohranja dolžino', () => {
    const arr = [1, 2, 3, 4, 5];
    const rng = mulberry32(42);
    const out = shuffle(arr, rng);
    assert.equal(out.length, arr.length);
    assert.deepEqual(arr, [1, 2, 3, 4, 5]);
    assert.deepEqual(
      [...out].sort((a, b) => a - b),
      [1, 2, 3, 4, 5]
    );
  });

  it('randomInt je v [min,max]', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = randomInt(5, 10, rng);
      assert.ok(v >= 5 && v <= 10);
    }
  });

  it('weightedChoice vrne eno izmed vrednosti', () => {
    const items = [
      { weight: 1, value: 'a' },
      { weight: 2, value: 'b' },
    ];
    const rng = mulberry32(99);
    const v = weightedChoice(items, rng);
    assert.ok(v === 'a' || v === 'b');
  });
});
