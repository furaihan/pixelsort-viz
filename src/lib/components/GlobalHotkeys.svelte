<script lang="ts">
  import { createHotkeys, getAppHotkeys } from '@tanstack/svelte-hotkeys';
  import { app } from '../stores/appState.svelte';

  let { onopenGuide }: { onopenGuide: () => void } = $props();

  const registeredHotkeys = getAppHotkeys();

  function togglePlayback(): void {
    if (app.isRunning) app.pause();
    else if (app.isPaused) app.resume();
    else if (app.canStart) app.startRun();
  }

  function stepPlayback(): void {
    if (app.mode !== 'performance' && (app.isPaused || app.canStart)) app.step();
  }

  function resetPlayback(): void {
    app.reset();
  }

  // App hotkeys are read through a getter so custom rebinding immediately
  // updates the live registrations without recreating this component.
  createHotkeys(() => [
    {
      hotkey: registeredHotkeys.current['playback.toggle'],
      callback: togglePlayback,
    },
    {
      hotkey: registeredHotkeys.current['playback.step'],
      callback: stepPlayback,
    },
    {
      hotkey: registeredHotkeys.current['playback.reset'],
      callback: resetPlayback,
    },
    {
      hotkey: registeredHotkeys.current['guide.open'],
      callback: onopenGuide,
    },
    {
      hotkey: registeredHotkeys.current['guide.openSequence'],
      callback: onopenGuide,
    },
  ]);
</script>
