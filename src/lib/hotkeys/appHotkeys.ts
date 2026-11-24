import { defineAppHotkeys } from '@tanstack/svelte-hotkeys';

/**
 * The app-level shortcut contract. Keep ids stable: user customizations are
 * stored by id so changing a default does not erase a user's rebinding.
 */
export const appHotkeys = defineAppHotkeys({
  'playback.toggle': {
    hotkey: 'Mod+Space',
    meta: { name: 'Play or pause', group: 'Playback' },
  },
  'playback.step': {
    // Arrow navigation is position-based, so keep this binding physical.
    hotkey: '[ArrowRight]',
    meta: { name: 'Next operation', group: 'Playback' },
  },
  'playback.reset': {
    hotkey: 'Mod+R',
    meta: { name: 'Reset shuffle', group: 'Playback' },
  },
  'guide.open': {
    hotkey: 'Mod+/',
    meta: { name: 'Open guide', group: 'Navigation' },
  },
  'guide.openSequence': {
    hotkey: ['G', 'G'],
    meta: { name: 'Open guide (sequence)', group: 'Navigation' },
    options: { timeout: 900 },
  },
});

declare module '@tanstack/svelte-hotkeys' {
  interface Register {
    appHotkeys: typeof appHotkeys;
  }
}

export type AppHotkeyId = keyof typeof appHotkeys;
