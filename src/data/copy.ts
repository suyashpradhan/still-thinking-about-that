// copy.ts — the warm, plain, lightly-winking voice of Cringe Cemetery.
// Verbatim from the prototype's copy library (ritual.jsx).

/** Rotating placeholder prompts in the writing field. */
export const PROMPTS = [
  'the thing I said in the meeting…',
  'a text I wish I could unsend…',
  'the moment I replay at 2 a.m.…',
  'something only my brain remembers…',
  'the time I called them the wrong name…',
] as const;

/** One-tap relatable cringes, to kill the blank-page friction. */
export const QUICK = [
  'Called my teacher “Mom.”',
  'Waved at someone who wasn’t waving at me.',
  'Said “you too” to the waiter.',
  'Thought I was on mute. I wasn’t.',
  'Sent it to the wrong person.',
] as const;

/** Reassurance shown beneath the memory as you type. */
export const REASSURE = [
  'Nobody remembers this but you.',
  'The other person forgot by lunch.',
  'It felt huge. It wasn’t.',
  'You survived it. That’s the whole story.',
  'No one was looking as closely as you think.',
] as const;

/** The line of relief that settles in at the end of the ritual. */
export const RELIEF = [
  'It’s okay.',
  'Nobody remembers.',
  'You can stop carrying this.',
  'You survived.',
  'It mattered less than you think.',
  'That was a long time ago.',
] as const;

/** A tiny closing wink in the share tray. */
export const WINK = [
  'Witnesses: none.',
  'Your brain can stop bringing this up now.',
  'The other person forgot by lunch.',
  'Filed under: nobody’s problem.',
  'One less thing at 2 a.m.',
] as const;
