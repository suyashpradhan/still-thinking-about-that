// Fog — low, slow, breathing band. Density is configurable (was a global FX hook).

interface FogProps {
  bottom?: number;
  /** Opacity of the fog bands, 0–1. */
  density?: number;
  rising?: boolean;
}

export function Fog({ bottom = 0, density = 0.4, rising = false }: FogProps) {
  const op = density;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        height: rising ? 320 : 220,
        overflow: 'hidden',
        pointerEvents: 'none',
        transition: 'height 1s ease, opacity 1s ease',
        opacity: rising ? Math.min(1, op + 0.35) : 1,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="cc-fog"
          style={{
            position: 'absolute',
            bottom: i * 30,
            left: '-50%',
            width: '200%',
            height: 150,
            background: `radial-gradient(ellipse 60% 100% at 30% 100%, rgba(180,196,228,${
              i === 1 ? 0.22 : 0.16
            }) 0%, transparent 70%), radial-gradient(ellipse 52% 100% at 72% 100%, rgba(170,188,224,0.18) 0%, transparent 72%)`,
            opacity: op,
            animationDuration: `${28 + i * 11}s`,
            animationDelay: `${-i * 7}s`,
            filter: 'blur(8px)',
          }}
        />
      ))}
    </div>
  );
}
