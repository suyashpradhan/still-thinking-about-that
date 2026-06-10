import type { ReleaseStyle, ShareAspect } from "../types";

const easeOut = (x: number): number => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

interface RitualColors {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  glow: string;
  accent: string;
  bone: string;
  muted: string;
  faint: string;
}
interface RitualFonts {
  serif: string;
  sans: string;
}
interface SceneConfig {
  memory?: string;
  relief?: string;
  kicker?: string;
  style?: ReleaseStyle;
}
type ParticleMode = ReleaseStyle;
interface Particle {
  ox: number;
  oy: number;
  seed: number;
  warm: boolean;
  size: number;
  scat: number;
  ph: number;
  dly: number;
  vy: number;
  vx: number;
  sway: number;
  life: number;
  mode: ParticleMode;
}
interface Star {
  x: number;
  y: number;
  r: number;
  ph: number;
  sp: number;
}
interface ParticleState {
  x: number;
  y: number;
  a: number;
  sz: number;
  warm: boolean;
}
interface RenderOpts {
  withText?: boolean;
  particles?: boolean;
  brand?: boolean;
}
type PhaseName = "assemble" | "anticipate" | "flight" | "relief" | "done";
interface PlayOpts {
  onPhase?: (name: PhaseName) => void;
  from?: number;
  brand?: boolean;
}

// a reusable soft round glow sprite (fast: drawImage instead of per-particle gradients)
function glowSprite(rgb: string): HTMLCanvasElement {
  const S = 48;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, `rgba(${rgb},1)`);
  grd.addColorStop(0.18, `rgba(${rgb},0.7)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  return c;
}

export class CCRitual {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private dpr: number;
  private baseW = 430;
  private baseH = 900;
  private colors: RitualColors = {
    skyTop: "#202a49",
    skyMid: "#324269",
    skyLow: "#516695",
    glow: "#f4e3bd",
    accent: "#f3deb0",
    bone: "#f4f2ec",
    muted: "#aeb6d0",
    faint: "#828bab",
  };
  private fonts: RitualFonts = {
    serif: "'Instrument Serif', Georgia, serif",
    sans: "'Satoshi', system-ui, sans-serif",
  };
  private memory = "";
  private relief = "";
  private kicker = "tonight I let go of";
  private style: ReleaseStyle = "wind";
  private particles: Particle[] = [];
  private stars: Star[] = [];
  private spriteWarm: HTMLCanvasElement;
  private spriteCool: HTMLCanvasElement;
  private _raf: number | null = null;
  private _t0 = 0;
  private _running = false;
  private _onPhase: ((name: PhaseName) => void) | null = null;
  private _phaseSent: Record<string, number> = {};
  private _timers: ReturnType<typeof setTimeout>[] = [];
  private _brand = false;
  // Calm mode: a gentler version of the same release for users who prefer
  // reduced motion (and for iOS Low Power Mode, which forces that preference).
  // The words still gather, lift and float away — we only soften the jitter and
  // high-frequency twinkle so nothing flickers.
  private _calm = false;
  // timeline (seconds)
  private TL = {
    assemble: 0.5,
    anticipate: 0.95,
    flight: 1.35,
    spread: 0.55,
    textIn: 3.35,
    end: 4.7,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d")!;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.spriteWarm = glowSprite("247,231,193");
    this.spriteCool = glowSprite("238,231,214");
  }

  configure({
    colors,
    fonts,
  }: {
    colors?: Partial<RitualColors>;
    fonts?: Partial<RitualFonts>;
  } = {}): this {
    if (colors) Object.assign(this.colors, colors);
    if (fonts) Object.assign(this.fonts, fonts);
    return this;
  }

  /** Toggle the gentler reduced-motion variant. Same timeline, less jitter. */
  setCalm(v: boolean): this {
    this._calm = v;
    return this;
  }

  setScene({ memory, relief, kicker, style }: SceneConfig = {}): this {
    if (memory != null) this.memory = memory;
    if (relief != null) this.relief = relief;
    if (kicker != null) this.kicker = kicker;
    if (style != null) this.style = style;
    return this;
  }

  layout(cssW: number, cssH: number): this {
    this.baseW = cssW;
    this.baseH = cssH;
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    return this;
  }

  prepare(): this {
    this._genStars();
    this._sampleText();
    return this;
  }

  private _genStars(): void {
    let s = 11;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    this.stars = Array.from({ length: 70 }, () => ({
      x: rnd(),
      y: rnd() * 0.72,
      r: 0.6 + rnd() * 1.5,
      ph: rnd() * 6.28,
      sp: 0.5 + rnd() * 0.9,
    }));
  }

  private _sampleText(): void {
    // Round to integers: getBoundingClientRect() can hand us fractional CSS
    // pixels (common on high-DPR Android with dvh viewports). A fractional W
    // would desync the flat pixel-index stride below from the real bitmap.
    const W = Math.round(this.baseW);
    const H = Math.round(this.baseH);
    const oc = document.createElement("canvas");
    oc.width = W;
    oc.height = H;
    // `willReadFrequently` keeps this canvas CPU-backed. Without it, Android
    // Chrome GPU-accelerates the offscreen canvas and getImageData() below can
    // read back all-zero pixels (the draw isn't synced to CPU before the read),
    // so NO particles get sampled and the memory never dissolves into stars.
    // iOS Safari / desktop Chrome sync correctly, which is why they worked.
    const o = oc.getContext("2d", { willReadFrequently: true })!;
    // draw the memory the same way it reads on screen: italic serif, wrapped, centered
    let size = 27;
    if (this.memory.length > 90) size = 22;
    else if (this.memory.length > 50) size = 24;
    o.font = `italic ${size}px ${this.fonts.serif}`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#fff";
    const maxW = W * 0.78;
    const lh = size * 1.34;
    const words = (this.memory || "").trim().split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (o.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    const cy = H * 0.46;
    const startY = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => o.fillText(ln, W / 2, startY + i * lh));

    const img = o.getImageData(0, 0, W, H).data;
    let step = 3;
    const approx = lines.join("").length;
    if (approx <= 38) step = 2;
    else if (approx > 70) step = 4;
    let seed = 99;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const parts: Particle[] = [];
    const windDir = rnd() > 0.5 ? 1 : -1;

    // Build one particle (origin + per-style motion). Shared by the pixel-sampled
    // path and the synthesized fallback path below.
    const mk = (
      ox: number,
      oy: number,
      r: number,
      r2: number,
      r3: number,
    ): Particle => {
      const dx = ox / W - 0.5;
      const base = {
        ox,
        oy,
        seed: r3,
        warm: r3 > 0.16,
        size: 0.7 + r * 1.0,
        scat: 6 + r2 * 16,
        ph: r3 * 6.28,
      };
      if (this.style === "stars")
        return {
          ...base,
          dly: r * this.TL.spread,
          vy: 150 + r2 * 150,
          vx: (r - 0.5) * 60,
          sway: 8 + r * 14,
          life: 1.9 + r * 0.5,
          mode: "stars",
        };
      if (this.style === "fog")
        return {
          ...base,
          dly: r * this.TL.spread,
          vy: -(90 + r2 * 90),
          vx: (r - 0.5) * 50,
          sway: 10 + r * 16,
          life: 1.7 + r * 0.5,
          mode: "fog",
        };
      return {
        ...base,
        dly: clamp01(ox / W + r * 0.4) * this.TL.spread,
        vy: 88 + r2 * 82,
        vx: windDir * (14 + r * 52) + dx * 18,
        sway: 8 + r * 14,
        life: 1.95 + r * 0.55,
        mode: "wind",
      };
    };

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const a = img[(y * W + x) * 4 + 3];
        if (a > 90) {
          const r = rnd();
          const r2 = rnd();
          const r3 = rnd();
          parts.push(
            mk(x + (r - 0.5) * step, y + (r2 - 0.5) * step, r, r2, r3),
          );
        }
      }
    }

    // Fallback: some mobile GPUs (notably Android Chrome) hand back an empty
    // buffer from getImageData() on a hardware-accelerated canvas even with
    // willReadFrequently, so the sampling above finds no text pixels and nothing
    // would ever fly. If we came back sparse, synthesize a soft particle field
    // across the text region so the release ALWAYS animates into stars.
    if (parts.length < 24) {
      const bandTop = startY - lh * 0.7;
      const bandH = (lines.length - 1) * lh + lh * 1.4;
      const halfW = Math.max(maxW, W * 0.4) / 2;
      for (let i = 0; i < 440; i++) {
        const r = rnd();
        const r2 = rnd();
        const r3 = rnd();
        const ox = W / 2 + (rnd() - 0.5) * 2 * halfW;
        const oy = bandTop + r2 * bandH;
        parts.push(mk(ox, oy, r, r2, r3));
      }
    }
    // cap for perf
    if (parts.length > 2400) {
      const keep: Particle[] = [];
      const stepK = parts.length / 2400;
      for (let i = 0; i < 2400; i++) keep.push(parts[Math.floor(i * stepK)]);
      this.particles = keep;
    } else this.particles = parts;
  }

  // ── particle state at absolute time t ────────────────────────
  private _pstate(p: Particle, t: number): ParticleState {
    // In calm mode the particles still gather, lift and drift away — we just
    // scale down the per-particle wobble and kill the fast flicker.
    const jit = this._calm ? 0.25 : 1;
    const fStart = this.TL.flight + p.dly;
    // assemble: converge from a small scatter to origin over [0, assemble]
    if (t < this.TL.assemble) {
      const e = easeOut(clamp01(t / this.TL.assemble));
      return {
        x: p.ox + (1 - e) * Math.cos(p.ph) * p.scat,
        y: p.oy + (1 - e) * Math.sin(p.ph) * p.scat,
        a: e,
        sz: p.size,
        warm: p.warm,
      };
    }
    // hold + anticipation: gentle shimmer, a small inhale (pull up) near the end
    if (t < fStart) {
      const ant = clamp01(
        (t - this.TL.anticipate) / (this.TL.flight - this.TL.anticipate),
      );
      const jx = Math.sin(t * 2.0 + p.ph) * 0.8 * jit;
      const jy =
        Math.cos(t * 2.2 + p.ph) * 0.8 * jit -
        easeInOut(ant) * 6 * (p.mode === "fog" ? -0.4 : 1);
      return {
        x: p.ox + jx,
        y: p.oy + jy,
        a: 1,
        sz: p.size * (1 + ant * 0.15),
        warm: p.warm,
      };
    }
    // flight: closed-form drift
    const tau = t - fStart;
    const k = clamp01(tau / p.life);
    const e = easeOut(k);
    const sway = Math.sin(tau * 1.6 + p.ph) * p.sway * jit;
    const x =
      p.ox +
      p.vx * tau * (p.mode === "stars" ? 0.5 : 0.8) +
      sway * (1 - k * 0.3);
    const y = p.oy - p.vy * tau * (0.7 + 0.3 * e);
    let sz: number;
    let a: number;
    if (p.mode === "stars") {
      sz = p.size * (1 - 0.78 * e);
      // steady fade in calm mode; a soft twinkle otherwise
      a = (1 - k) * (this._calm ? 0.8 : 0.55 + 0.4 * Math.sin(t * 9 + p.ph));
    } else if (p.mode === "fog") {
      sz = p.size * (1 + 1.6 * e);
      a = (1 - k) * 0.7;
    } else {
      sz = p.size * (1 + 0.5 * e);
      a = (1 - k * k) * 0.7;
    }
    return { x, y, a: clamp01(a), sz, warm: p.warm };
  }

  // ── the single renderer: scene at time t into ctx of size W×H ─
  render(
    g: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    opts: RenderOpts = {},
  ): void {
    const { withText = false, particles = true, brand = true } = opts;
    const C = this.colors;
    const S = Math.min(W, H);
    const kx = W / this.baseW;
    const ky = H / this.baseH;
    g.clearRect(0, 0, W, H);

    // sky — light pooled near the top, deepening to the edges
    const sky = g.createRadialGradient(
      W * 0.5,
      H * 0.06,
      0,
      W * 0.5,
      H * 0.06,
      Math.max(W, H) * 1.15,
    );
    sky.addColorStop(0, C.skyLow);
    sky.addColorStop(0.42, C.skyMid);
    sky.addColorStop(1, C.skyTop);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // stars
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const st of this.stars) {
      const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * st.sp + st.ph));
      const sz = st.r * 2.4 * Math.min(kx, ky) + 1.4;
      g.globalAlpha = a * 0.9;
      g.drawImage(
        this.spriteCool,
        st.x * W - sz,
        st.y * H - sz,
        sz * 2,
        sz * 2,
      );
    }
    g.restore();

    // moon — swells through anticipation, settles with a soft bloom at relief
    const swell = (() => {
      if (t < this.TL.anticipate) return 1;
      if (t < this.TL.textIn)
        return lerp(
          1,
          1.22,
          easeInOut(
            clamp01(
              (t - this.TL.anticipate) / (this.TL.textIn - this.TL.anticipate),
            ),
          ),
        );
      return lerp(1.22, 1.12, easeOut(clamp01((t - this.TL.textIn) / 0.9)));
    })();
    const mr = S * 0.1 * swell;
    const mx = W * 0.5;
    const my = H * 0.16;
    // bloom flash around the moment of relief
    const bloom =
      Math.max(0, Math.sin(clamp01((t - this.TL.textIn) / 0.7) * Math.PI)) *
      0.28;
    g.save();
    g.globalCompositeOperation = "lighter";
    const halo = g.createRadialGradient(
      mx,
      my,
      0,
      mx,
      my,
      mr * (5 + bloom * 4),
    );
    halo.addColorStop(0, this._rgba(C.glow, 0.42 + bloom * 0.4));
    halo.addColorStop(0.5, this._rgba(C.glow, 0.1));
    halo.addColorStop(1, this._rgba(C.glow, 0));
    g.fillStyle = halo;
    g.fillRect(0, 0, W, H);
    g.restore();
    const disc = g.createRadialGradient(
      mx - mr * 0.28,
      my - mr * 0.3,
      mr * 0.1,
      mx,
      my,
      mr,
    );
    disc.addColorStop(0, "#fffdf6");
    disc.addColorStop(0.6, "#f6efdc");
    disc.addColorStop(1, "#e6dcc2");
    g.fillStyle = disc;
    g.beginPath();
    g.arc(mx, my, mr, 0, 6.2832);
    g.fill();
    g.fillStyle = "rgba(221,211,186,0.4)";
    g.beginPath();
    g.arc(mx + mr * 0.26, my - mr * 0.2, mr * 0.14, 0, 6.2832);
    g.fill();
    g.beginPath();
    g.arc(mx - mr * 0.2, my + mr * 0.24, mr * 0.18, 0, 6.2832);
    g.fill();

    // fog (fog style) — rises during flight
    if (this.style === "fog") {
      const rise = clamp01((t - this.TL.flight) / 1.6);
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.1 + rise * 0.22;
      const fg = g.createLinearGradient(0, H, 0, H * (0.62 - rise * 0.16));
      fg.addColorStop(0, "rgba(180,196,228,0.5)");
      fg.addColorStop(1, "rgba(180,196,228,0)");
      g.fillStyle = fg;
      g.fillRect(0, H * 0.5, W, H * 0.5);
      g.restore();
    }

    // particles
    if (particles && this.particles.length) {
      g.save();
      g.globalCompositeOperation = "lighter";
      for (const p of this.particles) {
        const st = this._pstate(p, t);
        if (st.a <= 0.01) continue;
        const sz = st.sz * Math.min(kx, ky) * 1.7;
        g.globalAlpha = st.a;
        g.drawImage(
          st.warm ? this.spriteWarm : this.spriteCool,
          st.x * kx - sz,
          st.y * ky - sz,
          sz * 2,
          sz * 2,
        );
      }
      g.restore();
    }

    if (withText) this._drawText(g, W, H, t, brand);
  }

  private _drawText(
    g: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number,
    brand = true,
  ): void {
    const a = easeOut(clamp01((t - this.TL.textIn) / 0.8));
    if (a <= 0) return;
    const C = this.colors;
    const S = Math.min(W, H);
    g.save();
    g.globalAlpha = a;
    g.textAlign = "center";
    const cx = W / 2;
    const moonBottom = H * 0.16 + S * 0.1 * 1.12;
    const regionTop = moonBottom + H * 0.04;
    const regionBottom = H * 0.8;

    // sizes scale with the smaller dimension
    const kS = S / 430;
    const kSize = 10 * kS;
    const mSize = Math.min(26, 23 * (W / 430));
    const rSize = 40 * kS;
    // wrap helper
    const wrap = (text: string, font: string, maxW: number): string[] => {
      g.font = font;
      const ws = text.trim().split(/\s+/);
      const ls: string[] = [];
      let l = "";
      for (const w of ws) {
        const tst = l ? l + " " + w : w;
        if (g.measureText(tst).width > maxW && l) {
          ls.push(l);
          l = w;
        } else l = tst;
      }
      if (l) ls.push(l);
      return ls;
    };
    const memFont = `italic ${mSize}px ${this.fonts.serif}`;
    const relFont = `${rSize}px ${this.fonts.serif}`;
    const memLines = wrap(this.memory, memFont, W * 0.82);
    const relLines = wrap(this.relief, relFont, W * 0.84);
    const memLH = mSize * 1.3;
    const relLH = rSize * 1.06;
    const gap1 = 14 * kS;
    const divGap = 20 * kS;
    const blockH =
      kSize + gap1 + memLines.length * memLH + divGap + relLines.length * relLH;
    let y =
      Math.max(regionTop, (regionTop + regionBottom) / 2 - blockH / 2) + kSize;

    // kicker
    g.font = `600 ${kSize}px ${this.fonts.sans}`;
    g.fillStyle = C.accent;
    g.save();
    g.translate(cx, y);
    g.scale(1, 1);
    this._tracked(g, (this.kicker || "").toUpperCase(), 0, 0, 2.5 * kS);
    g.restore();
    y += gap1 + memLH * 0.4;
    // memory
    g.font = memFont;
    g.fillStyle = C.bone;
    memLines.forEach((ln) => {
      g.fillText(ln, cx, y);
      y += memLH;
    });
    // divider
    y += divGap * 0.2;
    g.strokeStyle = this._rgba(C.bone, 0.22);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx - 22 * kS, y);
    g.lineTo(cx + 22 * kS, y);
    g.stroke();
    y += divGap + relLH * 0.5;
    // relief
    g.font = relFont;
    g.fillStyle = C.bone;
    relLines.forEach((ln) => {
      g.fillText(ln, cx, y);
      y += relLH;
    });

    // wordmark (export asset only)
    if (brand) {
      const wy = H * 0.9;
      g.globalAlpha = a;
      g.beginPath();
      g.fillStyle = C.glow;
      g.arc(cx - 64 * kS, wy - 4 * kS, 3.4 * kS, 0, 6.2832);
      g.fill();
      g.font = `${15 * kS}px ${this.fonts.serif}`;
      g.fillStyle = C.muted;
      g.textAlign = "left";
      g.fillText("Cringe Cemetery", cx - 54 * kS, wy);
    }
    g.restore();
  }

  // letter-spaced centered text
  private _tracked(
    g: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    ls: number,
  ): void {
    const widths = [...text].map((c) => g.measureText(c).width + ls);
    const total = widths.reduce((s, w) => s + w, 0) - ls;
    let cur = x - total / 2;
    g.textAlign = "left";
    [...text].forEach((c, i) => {
      g.fillText(c, cur, y);
      cur += widths[i];
    });
    g.textAlign = "center";
  }

  private _rgba(hex: string, a: number): string {
    const h = hex.replace("#", "");
    const n = parseInt(
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h,
      16,
    );
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ── live playback ────────────────────────────────────────────
  play({ onPhase, from = 0, brand = false }: PlayOpts = {}): this {
    this.stop();
    this._onPhase = onPhase || null;
    this._phaseSent = {};
    this._brand = brand;
    const g = this.g;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._t0 = performance.now() / 1000 - from;
    this._running = true;
    this._timers = [];
    // phases are TIMER-driven so sound + relief fire reliably even if frames are throttled
    const at = (sec: number, fn: () => void) => {
      const id = setTimeout(fn, Math.max(0, (sec - from) * 1000));
      this._timers.push(id);
    };
    this._fire("assemble");
    at(this.TL.anticipate, () => this._fire("anticipate"));
    at(this.TL.flight, () => this._fire("flight"));
    at(this.TL.textIn, () => this._fire("relief"));
    at(this.TL.end + 0.05, () => {
      this.drawFinal();
      this._fire("done");
    });
    // visuals via rAF
    const loop = () => {
      if (!this._running) return;
      const t = performance.now() / 1000 - this._t0;
      this.render(g, this.baseW, this.baseH, Math.min(t, this.TL.end), {
        withText: true,
        brand,
      });
      if (t < this.TL.end + 0.2) this._raf = requestAnimationFrame(loop);
      else this._running = false;
    };
    this._raf = requestAnimationFrame(loop);
    this.render(g, this.baseW, this.baseH, Math.max(0, from), {
      withText: true,
      brand,
    }); // first frame now
    return this;
  }

  private _fire(name: PhaseName): void {
    if (this._phaseSent[name]) return;
    this._phaseSent[name] = 1;
    this._onPhase?.(name);
  }

  stop(): void {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._running = false;
    if (this._timers) {
      this._timers.forEach(clearTimeout);
      this._timers = [];
    }
  }

  // render the settled final frame (for reduced-motion + as the still source)
  drawFinal(): void {
    const g = this.g;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.render(g, this.baseW, this.baseH, this.TL.end, {
      withText: true,
      particles: false,
      brand: this._brand || false,
    });
  }

  // ── export ───────────────────────────────────────────────────
  private _aspectSize(aspect: ShareAspect): [number, number] {
    if (aspect === "story") return [1080, 1920];
    if (aspect === "x") return [1600, 900];
    return [1080, 1350]; // post 4:5
  }

  async exportStill(aspect: ShareAspect = "post"): Promise<Blob> {
    const [w, h] = this._aspectSize(aspect);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    this.render(g, w, h, this.TL.end, { withText: true, particles: false });
    return await new Promise<Blob>((res, rej) =>
      c.toBlob(
        (blob) => (blob ? res(blob) : rej(new Error("toBlob failed"))),
        "image/png",
      ),
    );
  }
}
