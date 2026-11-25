<script lang="ts">
  import { onMount } from 'svelte';
  import { HotkeysProvider } from '@tanstack/svelte-hotkeys';
  import type { CustomHotkeys } from '@tanstack/svelte-hotkeys';
  import Header from './lib/components/Header.svelte';
  import GlobalHotkeys from './lib/components/GlobalHotkeys.svelte';
  import HotkeySummary from './lib/components/HotkeySummary.svelte';
  import ImageWorkspace from './lib/components/ImageWorkspace.svelte';
  import PlaybackControls from './lib/components/PlaybackControls.svelte';
  import GranularitySelector from './lib/components/GranularitySelector.svelte';
  import AlgorithmSelector from './lib/components/AlgorithmSelector.svelte';
  import StatisticsPanel from './lib/components/StatisticsPanel.svelte';
  import AlgorithmInspector from './lib/components/AlgorithmInspector.svelte';
  import GuideDialog from './lib/components/GuideDialog.svelte';
  import Layers from '@lucide/svelte/icons/layers';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Lock from '@lucide/svelte/icons/lock';
  import { app } from './lib/stores/appState.svelte';
  import { i18n } from './lib/i18n/index.svelte';
  import { appHotkeys } from './lib/hotkeys/appHotkeys';

  let guideOpen = $state(false);
  let compactLayout = $state(false);

  function readSavedHotkeys(): CustomHotkeys {
    try {
      const saved = window.localStorage.getItem('pixel-sort-hotkeys');
      return saved ? (JSON.parse(saved) as CustomHotkeys) : {};
    } catch {
      return {};
    }
  }

  const savedHotkeys = readSavedHotkeys();

  function saveHotkeys(custom: CustomHotkeys): void {
    window.localStorage.setItem('pixel-sort-hotkeys', JSON.stringify(custom));
  }

  onMount(() => {
    app.start();
    const compactQuery = window.matchMedia('(max-width: 700px)');
    const updateCompactLayout = () => (compactLayout = compactQuery.matches);
    updateCompactLayout();
    compactQuery.addEventListener('change', updateCompactLayout);
    return () => {
      compactQuery.removeEventListener('change', updateCompactLayout);
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

<HotkeysProvider {appHotkeys} customHotkeys={savedHotkeys} onCustomHotkeysChange={saveHotkeys}>
  <GlobalHotkeys onopenGuide={() => (guideOpen = true)} />

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
      class="mx-auto grid w-[min(1600px,100%)] min-w-0 flex-1 grid-cols-[minmax(0,1.78fr)_minmax(340px,1fr)] items-start gap-6 px-6 pt-5 pb-7 shell:grid-cols-1 compact:gap-3.5 compact:px-3.5 compact:pt-2.5 compact:pb-3.5"
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
        <div class="hidden shell:order-2 shell:grid compact:grid compact:hidden">
          <PlaybackControls inline zone="actions" />
        </div>
        <div class="shell:order-5">
          <AlgorithmInspector />
        </div>
      </div>

      <aside
        class="sticky top-5 grid min-w-0 gap-4 shell:static shell:contents short:static"
        aria-label={i18n.t('app.configurationStatistics')}
      >
        <div class="grid min-w-0 gap-4 shell:order-4">
          <StatisticsPanel />
        </div>

        <div class="shell:hidden">
          <PlaybackControls inline zone="actions" />
        </div>

        <section class="panel shell:order-3" aria-labelledby="conditions-title">
          <div class="panel-head">
            <h2 class="panel-title" id="conditions-title">
              <Layers size={16} aria-hidden="true" focusable="false" />
              {i18n.t('conditions.title')}
            </h2>
          </div>
          <details class="group" open={!compactLayout}>
            <summary
              class="hidden cursor-pointer list-none items-center justify-between gap-3 border-b border-rule px-4 py-3 compact:flex compact:min-h-11 [&::-webkit-details-marker]:hidden"
            >
              <span class="text-[13px] font-semibold text-text">
                {i18n.t('conditions.configure')}
              </span>
              <span class="truncate mono text-[11px] font-bold text-muted">
                {i18n.algorithmName(app.algorithmId)} · {app.blockSize}
                {i18n.t('workspace.px')} · {app.modeLabel}
              </span>
              <ChevronDown
                size={15}
                class="flex-none text-structure transition-transform group-open:rotate-180"
                aria-hidden="true"
                focusable="false"
              />
            </summary>
            <div class="grid gap-3 p-4 compact:pt-3.5">
              <GranularitySelector inline />
              <AlgorithmSelector inline onopenGuide={() => (guideOpen = true)} />
              <PlaybackControls inline zone="settings" />
            </div>
          </details>
        </section>
      </aside>
    </main>

    <footer
      class="flex items-center justify-between gap-3.5 border-t border-rule px-6 py-3 text-[10px] font-bold tracking-[0.1em] text-muted-2 compact:px-3.5"
    >
      <div class="flex items-center gap-2 mono">
        <Lock size={12} aria-hidden="true" focusable="false" />
        {i18n.t('app.footerLocal')}
      </div>
      <div class="flex gap-3.5 mono compact:hidden">
        <HotkeySummary />
      </div>
    </footer>

    <GuideDialog bind:open={guideOpen} />
  </div>
</HotkeysProvider>
