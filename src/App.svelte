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
    document.documentElement.lang = i18n.locale;
    document.title = i18n.t('app.title');
    app.start();
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      app.stop();
    };
  });

  $effect(() => {
    document.documentElement.lang = i18n.locale;
    document.title = i18n.t('app.title');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', i18n.t('app.description'));
  });
</script>

<a
  class="fixed top-2 left-2 z-100 -translate-y-[160%] rounded-[6px] bg-lime px-3 py-2 text-[12px] font-bold text-ink no-underline transition-transform duration-150 focus:translate-y-0"
  href="#workspace"
>
  {i18n.t('app.skipToWorkspace')}
</a>
<h1 class="sr-only">{i18n.t('app.title')}</h1>

<div class="flex min-h-screen flex-col">
  <Header onopenGuide={() => (guideOpen = true)} />

  <main
    class="mx-auto grid w-[min(1600px,100%)] min-w-0 flex-1 grid-cols-[minmax(0,1.65fr)_minmax(330px,0.85fr)] items-start gap-5 px-6 pt-5 pb-7 shell:grid-cols-1 compact:gap-3.5 compact:p-3.5"
    id="workspace"
  >
    <section class="grid min-w-0 gap-2.5" aria-label={i18n.t('app.visualizationPlayback')}>
      <ImageWorkspace />

      <section class="panel panel-compact" aria-labelledby="controls-title">
        <div class="panel-head">
          <h2 class="panel-title" id="controls-title">
            <Icon name="layers" size={15} />
            {i18n.t('controls.title')}
          </h2>
          <span class="chip">{i18n.statusLabel(app.status)}</span>
        </div>

        <div class="grid gap-3 panel-body">
          <PlaybackControls inline zone="actions" />

          <div
            class="grid grid-cols-3 items-start gap-3 border-t border-line pt-3 narrow:grid-cols-1"
          >
            <div class="min-w-0 pr-3 narrow:pr-0">
              <GranularitySelector inline />
            </div>
            <div
              class="min-w-0 border-l border-line pl-3 narrow:border-t narrow:border-l-0 narrow:pt-3 narrow:pl-0"
            >
              <AlgorithmSelector inline onopenGuide={() => (guideOpen = true)} />
            </div>
            <div
              class="min-w-0 border-l border-line pl-3 narrow:border-t narrow:border-l-0 narrow:pt-3 narrow:pl-0"
            >
              <PlaybackControls inline zone="settings" />
            </div>
          </div>
        </div>
      </section>
    </section>

    <aside
      class="sticky top-5 grid min-w-0 gap-2.5 shell:static short:static"
      aria-label={i18n.t('app.configurationStatistics')}
    >
      <StatisticsPanel />
      <AlgorithmInspector />
    </aside>
  </main>

  <footer
    class="flex items-center justify-between gap-3.5 border-t border-line px-6 py-[13px] text-[8px] font-bold tracking-[0.1em] text-muted-2 compact:px-3.5 compact:py-3"
  >
    <div class="flex items-center gap-[7px]">
      <span class="size-[5px] rounded-full bg-lime" aria-hidden="true"></span>
      <span class="mono">{i18n.t('app.footerLocal')}</span>
    </div>
    <div class="flex gap-3.5 mono compact:hidden">
      <span>SVELTE 5</span>
      <span>{i18n.t('app.footerCanvas')}</span>
      <span>{i18n.t('app.footerWorker')}</span>
    </div>
  </footer>

  <GuideDialog bind:open={guideOpen} />
</div>
