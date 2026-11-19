// Calm 8-bit background music, made live with the browser's Web Audio (no
// audio files needed). Three little "chip" voices play a slow, gentle loop:
//
//   melody  a soft square wave
//   arp     a thin pulse wave plinking through each chord
//   bass    a mellow triangle wave
//
// Browsers won't make sound until you click or press a key, so the music
// starts on your first click/key press. The On/Off choice (menu -> Music) is
// remembered in this browser.
//
//   import { music } from '../audio/Music.js';
//   music.toggle();      // on <-> off
//   music.enabled        // true/false

const STORAGE_KEY = 'paw-pal-music';
const BPM = 70;
const STEP = 60 / BPM / 2; // one eighth note, in seconds
const LOOK_AHEAD = 0.25; // schedule notes this far in advance (seconds)
const VOLUME = 0.16; // master volume (keep it calm)

// midi note number -> frequency in Hz
const hz = (n) => 440 * 2 ** ((n - 69) / 12);

// The loop is 8 bars of 8 eighth-notes (about 27 seconds), in A minor:
// Am - F - C - G, twice. Numbers are MIDI notes, 0 = rest.
const CHORDS = [
  { root: 45, notes: [57, 60, 64] }, // Am
  { root: 41, notes: [53, 57, 60] }, // F
  { root: 36, notes: [60, 64, 67] }, // C (bass an octave lower)
  { root: 43, notes: [55, 59, 62] }, // G
];
const PROGRESSION = [0, 1, 2, 3, 0, 1, 2, 3];
const ARP = [0, 1, 2, 1, 0, 1, 2, 1]; // which chord note, each step
const MELODY = [
  76, 0, 72, 0, 69, 0, 72, 0, //
  77, 0, 72, 0, 69, 0, 0, 0,
  76, 0, 74, 0, 72, 0, 67, 0,
  74, 0, 71, 0, 67, 0, 0, 0,
  69, 0, 72, 0, 76, 0, 74, 0,
  72, 0, 69, 0, 65, 0, 69, 0,
  67, 0, 72, 0, 76, 0, 72, 0,
  71, 0, 74, 0, 0, 0, 0, 0,
];

class Music {
  constructor() {
    this.ctx = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // private mode: just don't remember it
    }
    this.enabled = saved !== 'off';

    // Start (or resume) on the first click or key press.
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (this.enabled) this.start();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  // Build the audio graph the first time it's needed.
  setup() {
    if (this.ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    this.ctx = new AudioCtx();

    // master volume -> soft low-pass (takes the buzz off) -> speakers
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    const soften = this.ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 2600;
    this.master.connect(soften).connect(this.ctx.destination);

    // A pulse wave with a thin (25%) duty cycle, for the little arpeggio.
    const harmonics = 32;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    const duty = 0.25;
    for (let n = 1; n < harmonics; n++) {
      real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
      imag[n] = (2 / (n * Math.PI)) * (1 - Math.cos(n * Math.PI * duty));
    }
    this.pulse = this.ctx.createPeriodicWave(real, imag);
    return true;
  }

  start() {
    if (!this.enabled || !this.setup()) return;
    this.ctx.resume?.();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(VOLUME, this.ctx.currentTime, 0.4); // fade in
    if (this.timer) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 50);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15); // fade out
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(STORAGE_KEY, this.enabled ? 'on' : 'off');
    } catch {
      // not remembered, that's fine
    }
    if (this.enabled) this.start();
    else this.stop();
    return this.enabled;
  }

  // Queue every note that falls inside the next LOOK_AHEAD seconds.
  schedule() {
    while (this.nextTime < this.ctx.currentTime + LOOK_AHEAD) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % MELODY.length;
      this.nextTime += STEP;
    }
  }

  playStep(step, time) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const chord = CHORDS[PROGRESSION[bar]];

    if (inBar === 0 || inBar === 4) this.note('triangle', hz(chord.root), time, STEP * 3.6, 0.9); // bass
    this.note(null, hz(chord.notes[ARP[inBar]] + 12), time, STEP * 0.9, 0.22); // arp
    const m = MELODY[step];
    if (m) this.note('square', hz(m), time, STEP * 1.8, 0.3); // melody
  }

  // One note: `type` is an oscillator type, or null for the thin pulse wave.
  // It fades in quickly and glides out so it never clicks.
  note(type, freq, time, length, volume) {
    const osc = this.ctx.createOscillator();
    if (type) osc.type = type;
    else osc.setPeriodicWave(this.pulse);
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }
}

export const music = new Music();
