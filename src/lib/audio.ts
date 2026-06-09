// audio.ts — Cringe Cemetery soundscape (synthesized — no asset files).
// A calm, emotional, magical night: layered wind, a reverb hall, a warm
// pentatonic world (chimes, bells, paper folds, particle shimmer, a distant
// crow). Inspired by Journey / Spiritfarer / Monument Valley. Never horror.
//
// Ported verbatim from the prototype's audio.js into a typed module singleton.

type FilterType = BiquadFilterType;
type OscType = OscillatorType;

interface NoiseOpts {
  dur?: number;
  type?: FilterType;
  freq?: number;
  q?: number;
  gain?: number;
  attack?: number;
  loop?: boolean;
  sweepTo?: number | null;
  rev?: number;
}
interface NoiseVoice {
  src: AudioBufferSourceNode;
  filt: BiquadFilterNode;
  g: GainNode;
}
interface VoiceOpts {
  freq?: number;
  dur?: number;
  type?: OscType;
  gain?: number;
  attack?: number;
  glideTo?: number | null;
  rev?: number;
  when?: number;
}
interface BellOpts {
  gain?: number;
  dur?: number;
  rev?: number;
  when?: number;
}
interface WindNodes {
  body: NoiseVoice | null;
  air: NoiseVoice | null;
  lfo: OscillatorNode | null;
}

type ConvolverWithIn = ConvolverNode & { _in: BiquadFilterNode };

const MASTER_GAIN = 0.9;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let verb: ConvolverWithIn | null = null;
let verbGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let wind: WindNodes | null = null;

let muted = false;
try {
  muted = localStorage.getItem('cc_muted') === '1';
} catch {
  /* localStorage unavailable */
}

// ── A gentle pentatonic world (A-ish minor pentatonic across octaves) ──
// Keeps every random sequence consonant and wistful.
const SCALE = [
  220.0, 261.63, 293.66, 329.63, 392.0, // A3 C4 D4 E4 G4
  440.0, 523.25, 587.33, 659.25, 783.99, // A4 C5 D5 E5 G5
  880.0, 1046.5, 1174.66, // A5 C6 D6
];
const note = (i: number): number => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];

function makeImpulse(seconds: number, decay: number): AudioBuffer {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      // soft, smooth tail — a wide, airy hall
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function ensure(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_GAIN;
  master.connect(ctx.destination);

  // a big soft reverb hall on a parallel send → spaciousness is everything
  verb = ctx.createConvolver() as ConvolverWithIn;
  verb.buffer = makeImpulse(3.2, 2.6);
  verbGain = ctx.createGain();
  verbGain.gain.value = muted ? 0 : MASTER_GAIN;
  verb.connect(verbGain);
  verbGain.connect(ctx.destination);
  // gently tame reverb highs so it stays warm, not hissy
  const vlp = ctx.createBiquadFilter();
  vlp.type = 'lowpass';
  vlp.frequency.value = 4200;
  vlp.connect(verb);
  verb._in = vlp;

  // brown-ish noise bed
  const len = ctx.sampleRate * 2.2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.2;
  }
}

/** Route a node into the reverb hall. */
function send(node: AudioNode, amount: number): void {
  if (!verb || !ctx) return;
  const g = ctx.createGain();
  g.gain.value = amount;
  node.connect(g);
  g.connect(verb._in);
}

// ── a filtered noise voice (wind, paper, air) ──
function noise(opts: NoiseOpts): NoiseVoice | null {
  if (!ctx || !noiseBuf || !master) return null;
  const {
    dur = 0.3,
    type = 'lowpass',
    freq = 800,
    q = 1,
    gain = 0.4,
    attack = 0.01,
    loop = false,
    sweepTo = null,
    rev = 0,
  } = opts;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = freq;
  filt.Q.value = q;
  const g = ctx.createGain();
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + attack);
  if (!loop) g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  if (sweepTo) filt.frequency.exponentialRampToValueAtTime(sweepTo, now + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(master);
  if (rev) send(g, rev);
  src.start(now);
  if (!loop) src.stop(now + dur + 0.05);
  return { src, filt, g };
}

// ── a sine/triangle voice (bells, chimes, tones) ──
function voice(opts: VoiceOpts): void {
  if (!ctx || !master) return;
  const { freq = 440, dur = 0.5, type = 'sine', gain = 0.16, attack = 0.008, glideTo = null, rev = 0.5, when = 0 } = opts;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = ctx.currentTime + when;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  o.connect(g);
  g.connect(master);
  if (rev) send(g, rev);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// ── a struck bell: inharmonic partials, long warm decay ──
function bell(freq: number, opts: BellOpts = {}): void {
  const { gain = 0.12, dur = 3.0, rev = 0.8, when = 0 } = opts;
  const parts: Array<[number, number]> = [
    [1, 1],
    [2.0, 0.5],
    [2.76, 0.34],
    [3.95, 0.2],
    [5.4, 0.12],
  ];
  parts.forEach(([r, a]) =>
    voice({ freq: freq * r, dur: dur * (1 - (r - 1) * 0.08), type: 'sine', gain: gain * a, attack: 0.004, rev, when }),
  );
  noise({ dur: 0.04, type: 'highpass', freq: 3200, gain: gain * 0.4, rev: 0.3 }); // soft mallet click
}

const sounds = {
  // soft typing — a barely-there breath, not a click
  ink() {
    noise({ dur: 0.05, type: 'highpass', freq: 3000, gain: 0.03, attack: 0.002 });
  },
  tick() {
    voice({ freq: note(7), dur: 0.5, type: 'sine', gain: 0.05, rev: 0.6 });
  },
  pop() {
    voice({ freq: note(6), glideTo: note(9), dur: 0.18, type: 'triangle', gain: 0.08, rev: 0.5 });
  },

  // a single chime — a wind-bell touched
  chime() {
    voice({ freq: note(9), dur: 1.6, type: 'sine', gain: 0.1, rev: 0.9 });
    voice({ freq: note(11), dur: 1.3, gain: 0.05, attack: 0.05, rev: 0.9 });
  },

  // a warm bell — the moment of relief
  bell() {
    bell(note(2), { gain: 0.13, dur: 3.4, rev: 0.9 });
  },

  // paper fold — a soft, dry crease
  paper() {
    noise({ dur: 0.14, type: 'bandpass', freq: 1400, q: 1.2, gain: 0.12, sweepTo: 600, rev: 0.2 });
    noise({ dur: 0.08, type: 'highpass', freq: 2600, gain: 0.05 });
  },

  // a gust — wind catches it and lifts (the release swell)
  gust(dur = 2.4) {
    const n = noise({ dur, type: 'bandpass', freq: 360, q: 0.5, gain: 0.0001, attack: 0.4, rev: 0.5 });
    if (!n || !ctx) return;
    const now = ctx.currentTime;
    n.g.gain.cancelScheduledValues(now);
    n.g.gain.setValueAtTime(0.0001, now);
    n.g.gain.exponentialRampToValueAtTime(0.26, now + dur * 0.42);
    n.g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    n.filt.frequency.setValueAtTime(300, now);
    n.filt.frequency.exponentialRampToValueAtTime(1500, now + dur * 0.5);
    n.filt.frequency.exponentialRampToValueAtTime(500, now + dur);
  },

  // particle shimmer — a sprinkle of tiny pentatonic stars over the flight
  shimmer(dur = 2.2, count = 14) {
    if (!ctx) return;
    for (let i = 0; i < count; i++) {
      const when = (i / count) * dur + Math.random() * 0.12;
      const idx = 7 + Math.floor(Math.random() * 6);
      voice({ freq: note(idx), dur: 1.1 + Math.random() * 0.8, type: 'sine', gain: 0.035 + Math.random() * 0.02, attack: 0.01, rev: 0.95, when });
    }
  },

  // the relief bloom — a gentle rising arpeggio settling into a warm bell
  relief() {
    const steps = [4, 6, 8, 9];
    steps.forEach((s, i) => voice({ freq: note(s), dur: 1.8, type: 'sine', gain: 0.08, attack: 0.02, rev: 0.95, when: i * 0.16 }));
    bell(note(4), { gain: 0.1, dur: 3.6, rev: 0.95, when: 0.5 });
    // a far, soft crow — distance and peace, never a fright
    sounds.crow(1.4);
  },

  // a distant crow — heavily reverbed, low, far away
  crow(when = 0) {
    voice({ freq: 360, glideTo: 250, dur: 0.18, type: 'sawtooth', gain: 0.02, rev: 1.1, when });
    voice({ freq: 330, glideTo: 240, dur: 0.16, type: 'sawtooth', gain: 0.016, rev: 1.1, when: when + 0.26 });
  },

  // legacy aliases kept so older calls don't break
  whoosh() {
    sounds.gust(1.2);
  },
  moon() {
    sounds.chime();
  },
  stone() {
    sounds.paper();
  },
};

export type SoundName = keyof typeof sounds;

export const audio = {
  play(name: SoundName, ...args: number[]): void {
    if (muted) return;
    ensure();
    const fn = sounds[name] as ((...a: number[]) => void) | undefined;
    if (fn) {
      try {
        fn(...args);
      } catch {
        /* a single failed cue should never break the experience */
      }
    }
  },

  note,

  startWind(): void {
    if (muted) return;
    ensure();
    if (!ctx || wind) return;
    // layered bed: a low body + a faint high "air" + slow breathing LFO
    const body = noise({ dur: 9999, type: 'lowpass', freq: 360, q: 0.5, gain: 0.045, attack: 3, loop: true, rev: 0.3 });
    const air = noise({ dur: 9999, type: 'bandpass', freq: 1800, q: 0.6, gain: 0.012, attack: 4, loop: true, rev: 0.5 });
    let lfo: OscillatorNode | null = null;
    try {
      lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.06;
      lg.gain.value = 140;
      lfo.connect(lg);
      if (body) lg.connect(body.filt.frequency);
      lfo.start();
    } catch {
      /* LFO unsupported */
    }
    wind = { body, air, lfo };
  },

  stopWind(): void {
    if (!wind) return;
    try {
      wind.body?.src.stop();
      wind.air?.src.stop();
      wind.lfo?.stop();
    } catch {
      /* already stopped */
    }
    wind = null;
  },

  toggleMute(): boolean {
    return this.setMuted(!muted);
  },

  setMuted(v: boolean): boolean {
    muted = !!v;
    try {
      localStorage.setItem('cc_muted', muted ? '1' : '0');
    } catch {
      /* localStorage unavailable */
    }
    if (ctx) {
      master?.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime, 0.05);
      verbGain?.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime, 0.05);
    }
    if (muted) this.stopWind();
    return muted;
  },

  isMuted(): boolean {
    return muted;
  },

  resume(): void {
    ensure();
  },
};

// Unlock the AudioContext on the first user gesture (browser autoplay policy).
if (typeof window !== 'undefined') {
  const kick = () => {
    ensure();
    window.removeEventListener('pointerdown', kick);
  };
  window.addEventListener('pointerdown', kick, { once: true });
}
