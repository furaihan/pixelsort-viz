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

<a class="skip-link" href="#workspace">Skip to workspace</a>
<h1 class="sr-only">Pixel Sort Visualizer</h1>

<div class="app-shell">
  <Header onopenGuide={() => (guideOpen = true)} />

  <main class="workspace" id="workspace">
    <section class="stage" aria-label="Visualization and playback">
      <ImageWorkspace />
      <PlaybackControls />
    </section>

    <aside class="rail" aria-label="Configuration and statistics">
      <ImagePanel />
      <GranularitySelector />
      <AlgorithmSelector onopenGuide={() => (guideOpen = true)} />
      <StatisticsPanel />
      <AlgorithmInspector />
    </aside>
  </main>

  <footer class="footer">
    <div class="footer-left">
      <span class="footer-dot" aria-hidden="true"></span>
      <span class="mono">100% LOCAL · NO UPLOADS</span>
    </div>
    <div class="footer-right mono">
      <span>SVELTE 5</span>
      <span>CANVAS 2D</span>
      <span>WEB WORKER</span>
    </div>
  </footer>

  <GuideDialog bind:open={guideOpen} />
</div>

<style>
  .app-shell {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
  }

  .skip-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 100;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--lime);
    color: var(--ink);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transform: translateY(-160%);
    transition: transform 150ms ease;
  }

  .skip-link:focus {
    transform: translateY(0);
  }

  .workspace {
    display: grid;
    width: min(1600px, 100%);
    min-width: 0;
    flex: 1;
    grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.9fr);
    gap: 20px;
    align-items: start;
    margin: 0 auto;
    padding: 20px 24px 28px;
  }

  .stage {
    position: sticky;
    top: 20px;
    display: grid;
    min-width: 0;
    gap: 14px;
  }

  .rail {
    display: grid;
    min-width: 0;
    gap: 14px;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 13px 24px;
    border-top: 1px solid var(--line);
    color: var(--muted-2);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .footer-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--lime);
  }

  .footer-right {
    display: flex;
    gap: 14px;
  }

  @media (max-width: 1100px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .stage {
      position: static;
    }
  }

  @media (max-height: 820px) {
    .stage {
      position: static;
    }
  }

  @media (max-width: 700px) {
    .workspace {
      gap: 14px;
      padding: 14px;
    }

    .footer {
      padding: 12px 14px;
    }

    .footer-right {
      display: none;
    }
  }
</style>
