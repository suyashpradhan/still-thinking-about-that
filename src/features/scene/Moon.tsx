// Moon — soft disc + breathing halo. Palette comes from CSS vars on .cc-stage.

interface MoonProps {
  size?: number;
  x?: number | string;
  y?: number;
  bright?: boolean;
}

export function Moon({ size = 120, x = '50%', y = 70, bright = false }: MoonProps) {
  return (
    <div
      className="cc-moondrift"
      style={{ position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', pointerEvents: 'none' }}
    >
      <div
        className="cc-moonbreath"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * (bright ? 4.6 : 3.6),
          height: size * (bright ? 4.6 : 3.6),
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--glow-soft) 0%, rgba(255,255,255,0) 64%)',
          transition: 'width .9s ease, height .9s ease',
        }}
      />
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'relative', display: 'block' }}>
        <defs>
          <radialGradient id="ccMoonG" cx="40%" cy="36%" r="74%">
            <stop offset="0%" stopColor="#fffdf6" />
            <stop offset="60%" stopColor="#f6efdc" />
            <stop offset="100%" stopColor="#e6dcc2" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#ccMoonG)" />
        <circle cx="62" cy="40" r="6.5" fill="#ddd3ba" opacity="0.45" />
        <circle cx="40" cy="61" r="8.5" fill="#ddd3ba" opacity="0.34" />
        <circle cx="56" cy="64" r="4" fill="#ddd3ba" opacity="0.4" />
      </svg>
    </div>
  );
}
