import type { CSSProperties } from 'react';

// Fireflies — warm wandering motes. Rendered only when enabled.

interface FirefliesProps {
  count?: number;
  seed?: number;
  enabled?: boolean;
}

// The firefly animation reads two custom properties (--dx/--dy) per mote.
type FireflyStyle = CSSProperties & { '--dx': string; '--dy': string };

export function Fireflies({ count = 9, seed = 5, enabled = true }: FirefliesProps) {
  if (!enabled) return null;
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const flies = Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: 28 + rnd() * 62,
    dur: 7 + rnd() * 8,
    d: rnd() * 9,
    dx: (rnd() - 0.5) * 56,
    dy: (rnd() - 0.5) * 46,
    size: 2 + rnd() * 2.4,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {flies.map((f, i) => (
        <span
          key={i}
          className="cc-firefly"
          style={
            {
              position: 'absolute',
              left: `${f.x}%`,
              top: `${f.y}%`,
              width: f.size,
              height: f.size,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: `0 0 ${f.size * 3.2}px ${f.size}px var(--glow-soft)`,
              '--dx': `${f.dx}px`,
              '--dy': `${f.dy}px`,
              animationDuration: `${f.dur}s`,
              animationDelay: `${-f.d}s`,
            } as FireflyStyle
          }
        />
      ))}
    </div>
  );
}
