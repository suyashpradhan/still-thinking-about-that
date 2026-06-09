import { motion } from 'framer-motion';
import { GlowButton } from '../../components/GlowButton';
import type { ShareAspect } from '../../types';

const ccS = "'Satoshi', system-ui, -apple-system, sans-serif";

interface ShareTrayProps {
  busy: string | null;
  wink: string;
  onSave: (aspect: ShareAspect) => void;
  onRestart: () => void;
}

const FORMATS: Array<{ label: string; aspect: ShareAspect; hero: boolean }> = [
  { label: 'Image', aspect: 'post', hero: true },
  { label: 'Story', aspect: 'story', hero: false },
  { label: 'X post', aspect: 'x', hero: false },
];

/** The share tray — fades up as the scene settles into relief. */
export function ShareTray({ busy, wink, onSave, onRestart }: ShareTrayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.2, 0.7, 0.3, 1] }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 8,
        padding: '60px 22px 30px',
        background: 'linear-gradient(to top, rgba(8,12,28,.82) 30%, rgba(8,12,28,.45) 70%, transparent)',
      }}
    >
      <div style={{ textAlign: 'center', fontFamily: ccS, fontSize: 13.5, color: 'var(--muted)', marginBottom: 14, minHeight: 18 }}>
        {busy || wink}
      </div>
      <div
        style={{
          fontFamily: ccS,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--faint)',
          textAlign: 'center',
          marginBottom: 9,
        }}
      >
        Take it with you
      </div>
      <div
        className="cc-noscroll"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', justifyContent: 'center', padding: '0 4px 4px', marginBottom: 14 }}
      >
        {FORMATS.map(({ label, aspect, hero }) => (
          <button
            key={label}
            onClick={() => onSave(aspect)}
            disabled={!!busy}
            style={{
              flex: '0 0 auto',
              fontFamily: ccS,
              fontSize: 13.5,
              fontWeight: 600,
              padding: '11px 16px',
              borderRadius: 13,
              cursor: busy ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: busy ? 0.5 : 1,
              background: hero ? 'linear-gradient(180deg,#fbf3df,var(--accent))' : 'rgba(255,255,255,0.08)',
              color: hero ? '#2a2412' : 'var(--bone)',
              border: hero ? 'none' : '1px solid var(--line)',
              boxShadow: hero ? '0 8px 22px rgba(150,170,230,.18)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <GlowButton variant="ghost" onClick={onRestart}>
        Let go of another
      </GlowButton>
    </motion.div>
  );
}
