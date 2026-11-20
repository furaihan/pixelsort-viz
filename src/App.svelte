<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import ImageWorkspace from './lib/components/ImageWorkspace.svelte';
  import PlaybackControls from './lib/components/PlaybackControls.svelte';
  import GranularitySelector from './lib/components/GranularitySelector.svelte';
  import AlgorithmSelector from './lib/components/AlgorithmSelector.svelte';
  import StatisticsPanel from './lib/components/StatisticsPanel.svelte';
  import AlgorithmInspector from './lib/components/AlgorithmInspector.svelte';
  import GuideDialog from './lib/components/GuideDialog.svelte';
  import Icon from './lib/components/Icon.svelte';
  import { app } from './lib/stores/appState.svelte';
  import { i18n } from './lib/i18n/index.svelte';

  let guideOpen = $state(false);

  function handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, select, textarea, button, a, [contenteditable="true"]')) return;
    // Never hijack browser/OS chords such as Ctrl/Cmd+R (reload) or Alt+Arrow (history).
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.code === 'Space') {
      event.preventDefault();
      if (app.isRunning) app.pause();
      else if (app.isPaused) app.resume();
      else if (app.canStart) app.startRun();
      return;
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      if (app.mode !== 'performance' && (app.isPaused || app.canStart)) app.step();
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
      app.dispose();
    };
  });

  $effect(() => {
    document.documentElement.lang = i18n.locale;
    document.title = i18n.t('app.title');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', i18n.t('app.description'));
  });

  // The sheet's ruling is the sorting grid: re-rule the page when the block
  // size changes, clamped so the finest grids stay legible as paper rhythm.
  $effect(() => {
    const pitch = Math.min(128, Math.max(8, app.blockSize));
    document.documentElement.style.setProperty('--ruling-pitch', `${pitch}px`);
  });
</script>

<a
  class="fixed top-2 left-2 z-100 -translate-y-[160%] rounded-[6px] bg-accent px-3 py-2 text-[12px] font-bold text-ground no-underline opacity-0 transition-transform duration-150 focus:translate-y-0 focus:opacity-100"
  href="#workspace"
>
  {i18n.t('app.skipToWorkspace')}
</a>
<h1 class="sr-only">{i18n.t('app.title')}</h1>

<div class="flex min-h-screen flex-col">
  <Header onopenGuide={() => (guideOpen = true)} />

  <main
    class="mx-auto grid w-[min(1600px,100%)] min-w-0 flex-1 grid-cols-[minmax(0,1.78fr)_minmax(340px,1fr)] items-start gap-6 px-6 pt-5 pb-7 shell:grid-cols-1 compact:gap-3.5 compact:p-3.5"
    id="workspace"
    tabindex="-1"
  >
    <div class="grid min-w-0 gap-4 shell:contents">
      <section
        class="grid min-w-0 gap-4 shell:order-1"
        aria-label={i18n.t('app.visualizationPlayback')}
      >
        <ImageWorkspace />
      </section>
      <div class="shell:order-5">
        <AlgorithmInspector />
      </div>
    </div>

    <aside
      class="sticky top-5 grid min-w-0 gap-4 shell:static shell:contents short:static"
      aria-label={i18n.t('app.configurationStatistics')}
    >
      <div class="grid min-w-0 gap-4 shell:order-3">
        <StatisticsPanel />
      </div>

      <div class="shell:order-2">
        <PlaybackControls inline zone="actions" />
      </div>

      <section class="panel shell:order-4" aria-labelledby="conditions-title">
        <div class="panel-head">
          <h2 class="panel-title" id="conditions-title">
            <Icon name="layers" size={16} />
            {i18n.t('conditions.title')}
          </h2>
          <span class="chip">{i18n.statusLabel(app.status)}</span>
        </div>
        <div class="grid gap-3 panel-body">
          <GranularitySelector inline />
          <AlgorithmSelector inline onopenGuide={() => (guideOpen = true)} />
          <PlaybackControls inline zone="settings" />
        </div>
      </section>
    </aside>
  </main>

  <footer
    class="flex items-center justify-between gap-3.5 border-t border-rule px-6 py-3 text-[10px] font-bold tracking-[0.1em] text-muted-2 compact:px-3.5"
  >
    <div class="flex items-center gap-2 mono">
      <Icon name="lock" size={12} />
      {i18n.t('app.footerLocal')}
    </div>
    <div class="flex gap-3.5 mono compact:hidden">
      <span>{i18n.t('playback.shortcuts')}</span>
    </div>
  </footer>

  <GuideDialog bind:open={guideOpen} />
</div>
