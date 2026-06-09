import { Stars } from './Stars';
import { Moon } from './Moon';
import { Fireflies } from './Fireflies';
import { Fog } from './Fog';

// Composed night — the background layer for any screen.

interface NightProps {
  moonX?: number | string;
  moonY?: number;
  moonSize?: number;
  bright?: boolean;
  fireflies?: boolean;
  fog?: boolean;
  fogRising?: boolean;
  /** Fog band opacity, 0–1. */
  fogDensity?: number;
  stars?: number;
}

export function Night({
  moonX = '50%',
  moonY = 66,
  moonSize = 124,
  bright = false,
  fireflies = true,
  fog = true,
  fogRising = false,
  fogDensity = 0.4,
  stars = 54,
}: NightProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', background: 'var(--sky)' }}>
      <Stars count={stars} />
      <Moon x={moonX} y={moonY} size={moonSize} bright={bright} />
      <Fireflies count={9} enabled={fireflies} />
      {fog && <Fog bottom={0} density={fogDensity} rising={fogRising} />}
      {/* faint horizon lift for "air" */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '32%',
          background: 'linear-gradient(to top, rgba(180,196,228,.10), transparent)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
