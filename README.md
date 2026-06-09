# Still Thinking About That?

A quiet place to write down the thing you keep replaying at 2 a.m. — then watch
it turn to light and float away.

Two beats:

1. **Write** what you're still carrying.
2. **Release** it — the words are sampled into a field of glowing particles and
   carried off on a closed-form canvas animation, settling into a line of relief
   you can save and share.

Built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion. The whole
soundscape is synthesized with the Web Audio API and the imagery is drawn on a
single `<canvas>` — there are **no asset files** to ship.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Scripts

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                      |
| `npm run build`     | Type-check and build for production into `dist`|
| `npm run preview`   | Preview the production build locally           |
| `npm run typecheck` | Run the TypeScript compiler with no emit       |

## Project structure

```
src/
  app/                App shell + state machine, baked config
    App.tsx           write ⇄ release state machine
    config.ts         fixed design config (palette, release style, fog…)
  components/         shared UI (GlowButton, MuteToggle, Wordmark)
  data/
    copy.ts           the prompts, reassurances, relief and wink lines
  features/
    scene/            night-sky layers (Moon, Stars, Fog, Fireflies, Night)
    write/            beat 1 — WriteScreen
    release/          beat 2 — ReleaseScreen, ShareTray, useRitual hook
  lib/
    audio.ts          Web Audio soundscape singleton
    ritual.ts         CCRitual — the canvas particle engine + still export
    pick.ts           deterministic / random array pick
  styles/
    globals.css       palettes (CSS variables) + keyframe animations
  types.ts            shared domain types
  main.tsx            entry point
```

## How it works

### The ritual (`src/lib/ritual.ts`)

`CCRitual` renders the entire scene — sky gradient, stars, moon, fog and the
memory-as-particles — to one canvas. Particle motion is **closed-form**
(`position = f(t)`), so the same renderer powers the live animation, the
reduced-motion still, and the exported share image at any aspect ratio
(`post` 4:5, `story` 9:16, `x` 16:9). The `useRitual` hook owns its lifecycle
within React.

### The sound (`src/lib/audio.ts`)

A small Web Audio engine: a pentatonic voice set, a convolver reverb hall, a
layered wind bed, and named cues (`ink`, `tick`, `pop`, `chime`, `bell`,
`paper`, `gust`, `shimmer`, `relief`, `crow`). It unlocks on the first pointer
interaction (per browser autoplay policy) and remembers the mute setting in
`localStorage`.

### Visual direction (`src/styles/globals.css`)

Palettes are CSS custom properties on `.cc-stage`, switched via the
`data-palette` attribute, so every layer re-tints together. Entrance and ambient
animations are CSS keyframes (`cc-rise`, `cc-fog`, `cc-firefly`, `cc-twinkle`,
`cc-moondrift`, `cc-btnglow`), all of which respect
`prefers-reduced-motion`. Screen transitions use Framer Motion.

## Configuration

Open `src/app/config.ts` to retune the shipped experience:

```ts
export const CONFIG = {
  releaseStyle: 'stars', // 'wind' | 'stars' | 'fog'
  palette: 'indigo',     // 'twilight' | 'indigo' | 'predawn'
  reliefLine: 'random',  // 'random' or a fixed line
  fireflies: true,
  fogDensity: 0.45,
} as const;
```

## Accessibility

The experience honours `prefers-reduced-motion`: ambient CSS animations are
disabled and the ritual jumps straight to its settled final frame instead of
playing the particle flight.
