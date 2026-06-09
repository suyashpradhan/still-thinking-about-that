import { useEffect, useRef, useState } from 'react';
import { CCRitual } from '../../lib/ritual';
import { audio } from '../../lib/audio';
import { pick } from '../../lib/pick';
import { RELIEF, WINK } from '../../data/copy';
import { CONFIG } from '../../app/config';
import type { RitualPhase, ReleaseStyle, ShareAspect } from '../../types';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Read the live palette colours from the .cc-stage CSS variables so the canvas
// re-tints with whatever palette is active.
function paletteColors() {
  const stage = document.querySelector('.cc-stage');
  if (!stage) return undefined;
  const cs = getComputedStyle(stage);
  const v = (k: string) => cs.getPropertyValue(k).trim();
  return {
    skyTop: v('--sky-top'),
    skyMid: v('--sky-mid'),
    skyLow: v('--sky-low'),
    glow: v('--glow'),
    accent: v('--accent'),
    bone: v('--bone'),
    muted: v('--muted'),
    faint: v('--faint'),
  };
}

interface UseRitualResult {
  wrapRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  phase: RitualPhase;
  busy: string | null;
  relief: string;
  wink: string;
  saveImage: (aspect: ShareAspect) => Promise<void>;
  shareImage: (aspect: ShareAspect) => Promise<void>;
  canShare: boolean;
}

// Native file-share support (iOS Safari, Android Chrome). Lets the user push the
// PNG straight into Instagram Stories / X / Messages without a manual download.
const canShareFiles = (): boolean => {
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare && !!navigator.share;
  } catch {
    return false;
  }
};

/**
 * Owns the canvas ritual lifecycle: builds the renderer once on mount, plays it,
 * maps its phases onto sound cues and React state, and exposes a still exporter.
 */
export function useRitual(text: string, style: ReleaseStyle): UseRitualResult {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ritualRef = useRef<CCRitual | null>(null);
  const [phase, setPhase] = useState<RitualPhase>('run');
  const [busy, setBusy] = useState<string | null>(null);

  const [relief] = useState(() =>
    CONFIG.reliefLine && CONFIG.reliefLine !== 'random' ? CONFIG.reliefLine : pick(RELIEF, text),
  );
  const [wink] = useState(() => pick(WINK, text + 'x'));

  useEffect(() => {
    let alive = true;

    const soundFor = (name: string) => {
      if (name === 'anticipate') audio.play('paper');
      else if (name === 'flight') {
        audio.play('gust');
        audio.play('shimmer');
      } else if (name === 'relief') audio.play('relief');
    };

    const init = () => {
      if (!alive || !canvasRef.current || !wrapRef.current) return;
      const r = new CCRitual(canvasRef.current);
      ritualRef.current = r;
      const colors = paletteColors();
      if (colors) r.configure({ colors });
      // Reduced motion (incl. iOS Low Power Mode, which forces it) still gets the
      // hero release — just a calmer one. Previously the whole flight was skipped
      // and the animation never appeared on those devices.
      r.setCalm(prefersReducedMotion());
      r.setScene({ memory: text, relief, style });
      const rect = wrapRef.current.getBoundingClientRect();
      r.layout(rect.width, rect.height);
      r.prepare();
      audio.startWind();
      r.play({
        onPhase: (name) => {
          if (!alive) return;
          soundFor(name);
          if (name === 'relief') setPhase('relief');
        },
      });
    };

    if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(init, 20));
    else setTimeout(init, 30);

    return () => {
      alive = false;
      ritualRef.current?.stop();
    };
    // Built once per release run (the screen is keyed by run id upstream).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadBlob = (blob: Blob, aspect: ShareAspect) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cringe-cemetery-${aspect}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const saveImage = async (aspect: ShareAspect) => {
    const r = ritualRef.current;
    if (!r) return;
    audio.play('tick');
    setBusy('Saving…');
    try {
      const blob = await r.exportStill(aspect);
      downloadBlob(blob, aspect);
      setBusy('Saved ✓');
    } catch {
      setBusy('Couldn’t save');
    }
    setTimeout(() => setBusy(null), 1400);
  };

  // Open the OS share sheet with the rendered PNG; fall back to a download if
  // the device/file-share isn't available.
  const shareImage = async (aspect: ShareAspect) => {
    const r = ritualRef.current;
    if (!r) return;
    audio.play('tick');
    setBusy('Preparing…');
    try {
      const blob = await r.exportStill(aspect);
      const file = new File([blob], `still-thinking-about-that.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: 'Still thinking about that? Not anymore.' });
        setBusy(null);
        return;
      }
      downloadBlob(blob, aspect);
      setBusy('Saved ✓');
    } catch (err) {
      // User dismissing the share sheet is not an error.
      if (err instanceof Error && err.name === 'AbortError') {
        setBusy(null);
        return;
      }
      setBusy('Couldn’t share');
    }
    setTimeout(() => setBusy(null), 1400);
  };

  return { wrapRef, canvasRef, phase, busy, relief, wink, saveImage, shareImage, canShare: canShareFiles() };
}
