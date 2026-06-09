import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { audio, type SoundName } from '../lib/audio';

// A soft primary / ghost button with press feedback, sound, and optional glow.

const ccS = "'Satoshi', system-ui, -apple-system, sans-serif";

interface GlowButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  glow?: boolean;
  variant?: 'primary' | 'ghost';
  style?: CSSProperties;
  sound?: SoundName;
}

const base: CSSProperties = {
  fontFamily: ccS,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: 0.1,
  border: 'none',
  borderRadius: 16,
  padding: '16px 22px',
  width: '100%',
  transition: 'transform .14s cubic-bezier(.34,1.56,.64,1), opacity .3s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  whiteSpace: 'nowrap',
};

const variants: Record<'primary' | 'ghost', CSSProperties> = {
  primary: {
    background: 'linear-gradient(180deg, #fbf3df, var(--accent))',
    color: '#2a2412',
    boxShadow: '0 10px 30px rgba(150,170,230,.16), inset 0 1px 0 rgba(255,255,255,.4)',
  },
  ghost: {
    background: 'rgba(255,255,255,0.07)',
    color: 'var(--bone)',
    border: '1px solid var(--line)',
    backdropFilter: 'blur(8px)',
  },
};

export function GlowButton({
  children,
  onClick,
  disabled,
  glow,
  variant = 'primary',
  style,
  sound = 'pop',
}: GlowButtonProps) {
  const click = (e: MouseEvent<HTMLButtonElement>) => {
    audio.play(sound);
    onClick?.(e);
  };
  return (
    <button
      onClick={click}
      className={glow && !disabled && variant === 'primary' ? 'cc-btnglow' : ''}
      style={{
        ...base,
        ...variants[variant],
        ...style,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}
