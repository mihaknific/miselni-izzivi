// js/sounds.js — Zvočni učinki (Web Audio API), ES6 modul
// Preneseno iz shared-game.js starega projekta

import { Settings } from './store.js';

class SoundEffects {
  constructor() {
    this.ctx = null;
    this._soundEnabled = false;
    this._settingsLoaded = false;
    this._settingsRevision = 0;
    this._scheduledSounds = new Set();
    this._loadEnabled();
  }

  async _loadEnabled() {
    const value = await Settings.get('soundEnabled', false);
    if (this._settingsRevision === 0) this._soundEnabled = value !== false;
    this._settingsLoaded = true;
  }

  syncEnabled(value) {
    this._settingsRevision++;
    this._soundEnabled = value === true;
    if (!this._soundEnabled) this._clearScheduledSounds();
  }

  async setEnabled(value) {
    const enabled = value === true;
    await Settings.set('soundEnabled', enabled);
    this.syncEnabled(enabled);
    return enabled;
  }

  _clearScheduledSounds() {
    for (const timer of this._scheduledSounds) window.clearTimeout(timer);
    this._scheduledSounds.clear();
  }

  _schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      this._scheduledSounds.delete(timer);
      callback();
    }, delay);
    this._scheduledSounds.add(timer);
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, volume = 0.1) {
    try {
      if (!this._settingsLoaded || this._soundEnabled === false) return;

      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  playSuccess() {
    this.playTone(880, 'sine', 0.15, 0.08);
  }

  playMatch() {
    this.playTone(523.25, 'sine', 0.1, 0.08);
    this._schedule(() => this.playTone(659.25, 'sine', 0.15, 0.08), 80);
  }

  playError() {
    this.playTone(180, 'triangle', 0.25, 0.12);
    if (navigator.vibrate) navigator.vibrate(60);
  }

  playVictory() {
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, i) => {
      this._schedule(() => this.playTone(freq, 'sine', 0.3, 0.08), i * 120);
    });
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }

  play(name) {
    switch (name) {
      case 'click':
        this.playTone(440, 'sine', 0.08, 0.06);
        break;
      case 'correct':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
      case 'match':
        this.playMatch();
        break;
      case 'victory':
        this.playVictory();
        break;
      default:
        this.playTone(440, 'sine', 0.1, 0.05);
        break;
    }
  }

  dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}

export const sounds = new SoundEffects();

export function isSoundEnabled() {
  return sounds._soundEnabled !== false;
}

export function toggleSound() {
  const enabled = isSoundEnabled();
  return sounds.setEnabled(!enabled);
}
