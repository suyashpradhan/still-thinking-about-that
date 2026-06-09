import { useRitual } from './useRitual';
import { ShareTray } from './ShareTray';
import type { ReleaseStyle } from '../../types';

const ccShell: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif",
  color: 'var(--bone)',
};

interface ReleaseScreenProps {
  text: string;
  style: ReleaseStyle;
  onRestart: () => void;
}

// ════════════════════════════════════════════════════════════════
// BEAT 2 — THE RITUAL (canvas) → relief → share
// ════════════════════════════════════════════════════════════════
export function ReleaseScreen({ text, style, onRestart }: ReleaseScreenProps) {
  const { wrapRef, canvasRef, phase, busy, wink, saveImage, shareImage, canShare } = useRitual(text, style);
  const isRelief = phase === 'relief';

  return (
    <div style={ccShell}>
      <div ref={wrapRef} style={{ position: 'absolute', inset: 0, background: 'var(--sky)' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>

      {isRelief && (
        <ShareTray
          busy={busy}
          wink={wink}
          onSave={saveImage}
          onShare={shareImage}
          canShare={canShare}
          onRestart={onRestart}
        />
      )}
    </div>
  );
}
