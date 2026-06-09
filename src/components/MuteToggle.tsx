import { useState } from 'react';
import { audio } from '../lib/audio';

// A fixed mute / unmute toggle. Plays a tiny chime when unmuting.

export function MuteToggle() {
  const [muted, setMuted] = useState(() => audio.isMuted());

  const toggle = () => {
    const m = audio.toggleMute();
    setMuted(m);
    if (!m) audio.play('chime');
  };

  return (
    <button
      onClick={toggle}
      title={muted ? 'Unmute' : 'Mute'}
      aria-label={muted ? 'Unmute' : 'Mute'}
      style={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top))',
        right: 'calc(16px + env(safe-area-inset-right))',
        zIndex: 90,
        width: 44,
        height: 44,
        borderRadius: 999,
        cursor: 'pointer',
        background: 'rgba(20,26,48,0.6)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(10px)',
        color: '#eef0f8',
        fontSize: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {muted ? '🔈' : '🔊'}
    </button>
  );
}
