import type { Palette, ReleaseStyle } from '../types';

/**
 * Baked design configuration.
 *
 * In the prototype these were live "tweaks" driven by an external editor host.
 * In production they are fixed product decisions — edit them here to retune the
 * shipped look and feel. Values match the prototype's defaults.
 */
export const CONFIG = {
  /** How the words leave: 'wind' | 'stars' | 'fog'. */
  releaseStyle: 'stars' satisfies ReleaseStyle as ReleaseStyle,

  /** Night-sky palette. */
  palette: 'indigo' satisfies Palette as Palette,

  /**
   * Words of relief shown at the end. `'random'` picks a line deterministically
   * from the written text; any other string is used verbatim.
   */
  reliefLine: 'random',

  /** Show drifting fireflies in the scene layers. */
  fireflies: true,

  /** Fog opacity, 0–1. */
  fogDensity: 0.45,
} as const;
