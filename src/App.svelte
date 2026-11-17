<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import ImageWorkspace from './lib/components/ImageWorkspace.svelte';
  import PlaybackControls from './lib/components/PlaybackControls.svelte';
  import ImagePanel from './lib/components/ImagePanel.svelte';
  import GranularitySelector from './lib/components/GranularitySelector.svelte';
  import AlgorithmSelector from './lib/components/AlgorithmSelector.svelte';
  import StatisticsPanel from './lib/components/StatisticsPanel.svelte';
  import AlgorithmInspector from './lib/components/AlgorithmInspector.svelte';
  import GuideDialog from './lib/components/GuideDialog.svelte';
  import { app } from './lib/stores/appState.svelte';

  let guideOpen = $state(false);

  function handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, select, textarea, button, a, [contenteditable="true"]')) return;

    if (event.code === 'Space') {
      event.preventDefault();
      if (app.isRunning) app.pause();
      else if (app.isPaused) app.resume();
      else app.startRun();
      return;
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      app.step();
      return;
    }

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      app.reset();
    }
  }

  onMount(() => {
    app.start();
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      app.stop();
    };
  });
</script>

<a
  class="fixed top-2 left-2 z-100 -translate-y-[160%] rounded-[6px] bg-lime px-3 py-2 text-[12px] font-bold text-ink no-underline transition-transform duration-150 focus:translate-y-0"
  href="#workspace">Skip to workspace</a
>
<h1 class="sr-only">Pixel Sort Visualizer</h1>

<div class="flex min-h-screen flex-col">
  <Header onopenGuide={() => (guideOpen = true)} />

  <main
    class="mx-auto grid w-[min(1600px,100%)] min-w-0 flex-1 grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)] items-start gap-5 px-6 pt-5 pb-7 shell:grid-cols-1 compact:gap-3.5 compact:p-3.5"
    id="workspace"
  >
    <section class="sticky top-5 grid min-w-0 gap-3.5 shell:static short:static" aria-label="Visualization and playback">
      <ImageWorkspace />
      <PlaybackControls />
    </section>

    <aside class="grid min-w-0 gap-3.5" aria-label="Configuration and statistics">
      <ImagePanel />
      <GranularitySelector />
      <AlgorithmSelector onopenGuide={() => (guideOpen = true)} />
      <StatisticsPanel />
      <AlgorithmInspector />
    </aside>
  </main>

  <footer
    class="flex items-center justify-between gap-3.5 border-t border-line px-6 py-[13px] text-[8px] font-bold tracking-[0.1em] text-muted-2 compact:px-3.5 compact:py-3"
  >
    <div class="flex items-center gap-[7px]">
      <span class="size-[5px] rounded-full bg-lime" aria-hidden="true"></span>
      <span class="mono">100% LOCAL · NO UPLOADS</span>
    </div>
    <div class="mono flex gap-3.5 compact:hidden">
      <span>SVELTE 5</span>
      <span>CANVAS 2D</span>
      <span>WEB WORKER</span>
    </div>
  </footer>

  <GuideDialog bind:open={guideOpen} />
</div>
