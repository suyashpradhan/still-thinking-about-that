// Stars — a gentle, fixed-size, deterministic twinkling starfield.

interface StarsProps {
  count?: number;
  seed?: number;
  spread?: number;
}

export function Stars({ count = 54, seed = 11, spread = 70 }: StarsProps) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const stars = Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * spread,
    r: 0.7 + rnd() * 1.5,
    d: rnd() * 5,
    dur: 2.8 + rnd() * 3.6,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map((st, i) => (
        <span
          key={i}
          className="cc-twinkle"
          style={{
            position: 'absolute',
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.r * 2,
            height: st.r * 2,
            borderRadius: '50%',
            background: '#f7f4ea',
            boxShadow: '0 0 4px #f7f4eaaa',
            animationDelay: `${st.d}s`,
            animationDuration: `${st.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
