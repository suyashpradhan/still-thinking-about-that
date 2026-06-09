// Shared domain types for the Cringe Cemetery experience.

/** How the written memory leaves the screen during the release ritual. */
export type ReleaseStyle = 'wind' | 'stars' | 'fog';

/** Night-sky colour theme. `twilight` is the base palette in globals.css. */
export type Palette = 'twilight' | 'indigo' | 'predawn';

/** The two beats of the experience. */
export type View = 'write' | 'release';

/** Phase of the canvas ritual, surfaced to React for UI timing. */
export type RitualPhase = 'run' | 'relief';

/** Export aspect ratios offered in the share tray. */
export type ShareAspect = 'post' | 'story' | 'x';
