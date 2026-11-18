import { describe, expect, it } from 'vitest';
import { speedLabel, speedToEventsPerSecond } from '../../src/lib/stores/appState.svelte';

describe('playback speed presets', () => {
  it('exposes 32× as a real fastest playback preset', () => {
    expect(speedLabel(32)).toBe('32×');
    expect(speedToEventsPerSecond(32)).toBeGreaterThan(speedToEventsPerSecond(16));
  });
});
