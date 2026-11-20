// Calm 8-bit background music, made live with the browser's Web Audio (no
// audio files needed). It's a whole little song, about 2 minutes 40 seconds
// long, and it loops forever without a gap. Five "chip" voices play it:
//
//   melody  a soft square wave
//   echo    a quiet copy of the melody, one step behind (in some parts)
//   arp     a thin pulse wave plinking through each chord
//   bass    a mellow triangle wave
//   shaker  soft little noise ticks (in some parts)
//
// Browsers won't make sound until you click or press a key, so the music
// starts on your first click/key press. The On/Off choice (menu -> Music) is
// remembered in this browser.
//
//   import { music } from '../audio/Music.js';
//   music.toggle();      // on <-> off
//   music.enabled        // true/false

const STORAGE_KEY = 'paw-pal-music';
const BPM = 72;
const STEP = 60 / BPM / 2; // one eighth note, in seconds
const LOOK_AHEAD = 0.25; // schedule notes this far in advance (seconds)
const VOLUME = 0.16; // master volume (keep it calm)

// midi note number -> frequency in Hz
const hz = (n) => 440 * 2 ** ((n - 69) / 12);

// ---------- the song ----------
//
// "Lanterns at Dusk", in A minor. Every bar is 8 steps (eighth notes).
// A melody bar is 8 tokens:
//   E5  play that note (letter, # for sharp, octave number)
//   -   keep holding the note before
//   .   silence
// Change any note, then reload the game to hear it.

// Chords: the bass note and three notes for the arp (MIDI numbers).
const CHORDS = {
  Am: { root: 45, notes: [57, 60, 64] },
  F: { root: 41, notes: [53, 57, 60] },
  C: { root: 48, notes: [55, 60, 64] },
  G: { root: 43, notes: [55, 59, 62] },
  E: { root: 40, notes: [56, 59, 64] }, // E major: leads back home to Am
  Em: { root: 40, notes: [55, 59, 64] },
  Dm: { root: 38, notes: [53, 57, 62] },
  Fmaj7: { root: 41, notes: [53, 57, 64] },
};

// Each part: its chords (one per bar), its melody (one line per bar) and how
// the band plays it.
//   arp:    'flow' (up and down every step) or 'slow' (every other step)
//   bass:   'long' (two long notes a bar) or 'walk' (root, fifth, octave)
//   echo:   true = the quiet echo voice joins in
//   shaker: true = soft shaker ticks
//   lead:   melody volume (1 = normal)
const PARTS = {
  intro: {
    arp: 'slow', bass: 'long',
    chords: ['Am', 'F', 'C', 'G'],
    melody: [
      '. . . . . . . .',
      '. . . . . . . .',
      '. . . . . . . .',
      '. . . . . . E4 G4',
    ],
  },
  theme: {
    arp: 'flow', bass: 'long',
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'],
    melody: [
      'E5 - - C5 D5 - E5 -',
      'F5 - E5 - C5 - - -',
      'G5 - E5 - C5 - D5 E5',
      'D5 - - - B4 - - -',
      'E5 - - C5 D5 - E5 -',
      'F5 - A5 - G5 - F5 -',
      'E5 - D5 - B4 - D5 -',
      'C5 - B4 - G#4 - - -',
    ],
  },
  themeAgain: {
    arp: 'flow', bass: 'walk', echo: true, shaker: true,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am'],
    melody: [
      'E5 - - C5 D5 - E5 -',
      'F5 - E5 - C5 - - -',
      'G5 - E5 - C5 - D5 E5',
      'D5 - - - B4 - - -',
      'E5 - - C5 D5 - E5 -',
      'F5 - A5 - G5 - F5 -',
      'E5 - D5 - B4 - G4 -',
      'A4 - - - - - . .',
    ],
  },
  lift: {
    arp: 'flow', bass: 'walk', shaker: true,
    chords: ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'],
    melody: [
      'A4 - C5 - F5 - E5 -',
      'D5 - B4 - G4 - B4 -',
      'E5 - G5 - B5 - A5 -',
      'A5 - - - E5 - - -',
      'F5 - E5 - D5 - C5 -',
      'D5 - E5 - G5 - - -',
      'E5 - D5 - C5 - G4 -',
      'C5 - - - . . . .',
    ],
  },
  dream: {
    arp: 'slow', bass: 'long', lead: 0.75,
    chords: ['Dm', 'Am', 'Fmaj7', 'E', 'Dm', 'Am', 'F', 'E'],
    melody: [
      'F5 - - - - - E5 -',
      'C5 - - - - - . .',
      'A4 - - - C5 - - -',
      'B4 - - - G#4 - - -',
      'D5 - - - F5 - - -',
      'E5 - - - A5 - - -',
      'G5 - F5 - E5 - D5 -',
      'E5 - - - - - . .',
    ],
  },
  themeLast: {
    arp: 'flow', bass: 'walk', echo: true, shaker: true,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'],
    melody: [
      'E5 - - C5 D5 - E5 -',
      'F5 - E5 - C5 - - -',
      'G5 - E5 - C5 - D5 E5',
      'D5 - - - B4 - - -',
      'E5 - - C5 D5 - E5 -',
      'F5 - A5 - G5 - F5 -',
      'E5 - D5 - B4 - D5 -',
      'C5 - B4 - G#4 - - -',
    ],
  },
  outro: {
    arp: 'slow', bass: 'long', lead: 0.8,
    chords: ['Am', 'F', 'G', 'E'],
    melody: [
      'A4 - C5 - E5 - - -',
      'F5 - - - E5 - C5 -',
      'D5 - - - B4 - D5 -',
      'E5 - - - . . . .',
    ],
  },
};

// The order the parts play in. After the last one the song goes back to
// LOOP_FROM (the intro only plays once).
const ORDER = ['intro', 'theme', 'themeAgain', 'lift', 'dream', 'themeLast', 'outro'];
const LOOP_FROM = 1;

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = (name) => {
  const [, letter, sharp, octave] = name.match(/^([A-G])(#?)(\d)$/);
  return 12 * (Number(octave) + 1) + NOTE[letter] + (sharp ? 1 : 0);
};

// Turn the parts into one long list of steps: what plays on each eighth note.
function buildSong() {
  const steps = [];
  let loopStart = 0;
  ORDER.forEach((name, n) => {
    if (n === LOOP_FROM) loopStart = steps.length;
    const part = PARTS[name];
    part.chords.forEach((chordName, bar) => {
      const tokens = part.melody[bar].trim().split(/\s+/);
      if (tokens.length !== 8) throw new Error(`Music: bar ${bar + 1} of "${name}" needs 8 steps, it has ${tokens.length}`);
      tokens.forEach((token, inBar) => {
        let note = null;
        if (token !== '-' && token !== '.') {
          let hold = 1; // count the "-" after this note (they can run into the next bar)
          for (let k = inBar + 1; ; k++) {
            const next = k < 8 ? tokens[k] : part.melody[bar + 1]?.trim().split(/\s+/)[k - 8];
            if (next !== '-') break;
            hold++;
          }
          note = { midi: midi(token), hold };
        }
        steps.push({ part, chord: CHORDS[chordName], inBar, note });
      });
    });
  });
  return { steps, loopStart };
}
const SONG = buildSong();

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

    // Half a second of white noise, for the shaker.
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate / 2, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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
      this.playStep(SONG.steps[this.step], this.nextTime);
      this.step++;
      if (this.step >= SONG.steps.length) this.step = SONG.loopStart; // round again, without the intro
      this.nextTime += STEP;
    }
  }

  playStep({ part, chord, inBar, note }, time) {
    // bass
    if (part.bass === 'walk') {
      const walk = { 0: 0, 3: 7, 4: 12, 6: 7 }; // root, fifth, octave, fifth
      if (inBar in walk) this.note('triangle', hz(chord.root + walk[inBar]), time, STEP * (inBar === 0 ? 2.6 : 1.6), 0.85);
    } else if (inBar === 0 || inBar === 4) {
      this.note('triangle', hz(chord.root), time, STEP * 3.6, 0.9);
    }

    // arp
    const ARP = [0, 1, 2, 1, 0, 1, 2, 1];
    if (part.arp === 'flow' || inBar % 2 === 0) {
      this.note(null, hz(chord.notes[ARP[inBar]] + 12), time, STEP * (part.arp === 'flow' ? 0.9 : 1.6), 0.2);
    }

    // melody (and its echo one step later)
    if (note) {
      const length = STEP * (note.hold * 0.95 + 0.4);
      const lead = part.lead ?? 1;
      this.note('square', hz(note.midi), time, length, 0.3 * lead);
      if (part.echo) this.note(null, hz(note.midi), time + STEP, length, 0.1 * lead);
    }

    // shaker: soft on the off-beats, a little stronger on beats 2 and 4
    if (part.shaker && inBar % 2 === 1) this.tick(time, inBar === 3 || inBar === 7 ? 0.09 : 0.05);
  }

  // A soft noise tick, like a tiny shaker.
  tick(time, volume) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(time, Math.random() * 0.5, 0.08);
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
