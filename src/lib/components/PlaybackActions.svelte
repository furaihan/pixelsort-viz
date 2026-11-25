<script lang="ts">
  // Snippet library for PlaybackControls: the actions fragment.
  // Rendered via `{@render snippet}` from PlaybackControls.
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import StepForward from '@lucide/svelte/icons/step-forward';
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import ImageIcon from '@lucide/svelte/icons/image';
  import Layers from '@lucide/svelte/icons/layers';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Info from '@lucide/svelte/icons/info';
  import { getAppHotkeys, getHotkeyHint, getFormatForDisplay } from '@tanstack/svelte-hotkeys';
  import { app } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';

  const appHotkeys = getAppHotkeys();
  const formatForDisplay = getFormatForDisplay();
  const toggleHint = getHotkeyHint(() => appHotkeys.current['playback.toggle']);
  const stepHint = getHotkeyHint(() => appHotkeys.current['playback.step']);

  let primaryLabel = $derived(
    app.status === 'running'
      ? i18n.t('playback.pause')
      : app.status === 'paused'
        ? i18n.t('playback.resume')
        : app.status === 'completed'
          ? i18n.t('playback.replay')
          : app.status === 'error'
            ? i18n.t('playback.retry')
            : i18n.t('playback.start'),
  );

  let primaryDisabled = $derived(
    !app.hasImage || (app.status !== 'running' && app.status !== 'paused' && !app.canStart),
  );

  let stepDisabled = $derived(
    !app.hasImage || app.mode === 'performance' || (!app.isPaused && !app.canStart),
  );

  let warning = $derived(app.workload?.blockers[0] ?? app.workload?.warnings[0] ?? null);
  let warningIsBlocker = $derived((app.workload?.blockers.length ?? 0) > 0);

  let runOptionsOpen = $state(false);

  function primaryAction(): void {
    if (app.status === 'running') app.pause();
    else if (app.status === 'paused') app.resume();
    else app.startRun();
  }

  function closeRunOptions(): void {
    runOptionsOpen = false;
  }

  function shuffleFromOptions(): void {
    app.shuffle();
    closeRunOptions();
  }

  function resetFromOptions(): void {
    app.reset();
    closeRunOptions();
  }

  function restoreFromOptions(): void {
    app.restoreOriginal();
    closeRunOptions();
  }
</script>

  {#if app.error}
    <div class="alert" role="alert">
      <TriangleAlert size={16} aria-hidden="true" focusable="false" />
      <span>{i18n.text(app.error)}</span>
    </div>
  {/if}

  {#if warning}
    <div class="alert {warningIsBlocker ? '' : 'alert-warning'}" role="status">
      {#if warningIsBlocker}
        <TriangleAlert size={16} aria-hidden="true" focusable="false" />
      {:else}
        <Info size={16} aria-hidden="true" focusable="false" />
      {/if}
      <span>{i18n.text(warning)}</span>
    </div>
  {/if}

  <div class="flex flex-wrap items-center gap-2 compact:gap-1.5">
    <button
      class="btn min-w-[142px] btn-primary compact:min-h-11 compact:flex-1"
      type="button"
      onclick={primaryAction}
      disabled={primaryDisabled}
    >
      {#if app.isRunning}
        <Pause size={17} aria-hidden="true" focusable="false" />
      {:else}
        <Play size={17} aria-hidden="true" focusable="false" />
      {/if}
      {primaryLabel}
      {#if toggleHint.visible && appHotkeys.current['playback.toggle'].hotkey}
        <kbd class="ml-1 text-[10px] opacity-80">
          {formatForDisplay(appHotkeys.current['playback.toggle'].hotkey)}
        </kbd>
      {/if}
    </button>

    <button
      class="btn btn-ghost compact:min-h-11"
      type="button"
      onclick={() => app.step()}
      disabled={stepDisabled}
      title={app.mode === 'performance'
        ? i18n.t('playback.performanceStepTitle')
        : i18n.t('playback.stepTitle')}
    >
      <StepForward size={16} aria-hidden="true" focusable="false" />
      {i18n.t('playback.step')}
      {#if stepHint.visible && appHotkeys.current['playback.step'].hotkey}
        <kbd class="ml-1 text-[10px] opacity-80">
          {formatForDisplay(appHotkeys.current['playback.step'].hotkey)}
        </kbd>
      {/if}
    </button>

    <div class="flex flex-wrap items-center gap-2 compact:hidden">
      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.shuffle()}
        disabled={!app.hasImage}
        title={i18n.t('playback.shuffleTitle')}
      >
        <Shuffle size={16} aria-hidden="true" focusable="false" />
        {i18n.t('playback.shuffle')}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.reset()}
        disabled={!app.hasImage}
        title={i18n.t('playback.resetTitle')}
      >
        <RotateCcw size={16} aria-hidden="true" focusable="false" />
        {i18n.t('playback.reset')}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.restoreOriginal()}
        disabled={!app.hasImage}
        title={i18n.t('playback.restoreTitle')}
      >
        <ImageIcon size={16} aria-hidden="true" focusable="false" />
        {i18n.t('playback.restore')}
      </button>
    </div>

    <details bind:open={runOptionsOpen} class="hidden w-full compact:block">
      <summary
        class="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[6px] border border-rule px-3 text-[12px] font-semibold text-muted [&::-webkit-details-marker]:hidden"
      >
        <Layers size={15} aria-hidden="true" focusable="false" />
        {i18n.t('playback.moreRunOptions')}
        <ChevronDown
          size={14}
          class="ml-auto text-structure transition-transform group-open:rotate-180"
          aria-hidden="true"
          focusable="false"
        />
      </summary>
      <div class="mt-2 grid gap-2">
        <button
          class="btn justify-start btn-ghost compact:min-h-11"
          type="button"
          onclick={shuffleFromOptions}
          disabled={!app.hasImage}
          title={i18n.t('playback.shuffleTitle')}
        >
          <Shuffle size={16} aria-hidden="true" focusable="false" />
          {i18n.t('playback.shuffle')}
        </button>
        <button
          class="btn justify-start btn-ghost compact:min-h-11"
          type="button"
          onclick={resetFromOptions}
          disabled={!app.hasImage}
          title={i18n.t('playback.resetTitle')}
        >
          <RotateCcw size={16} aria-hidden="true" focusable="false" />
          {i18n.t('playback.reset')}
        </button>
        <button
          class="btn justify-start btn-ghost compact:min-h-11"
          type="button"
          onclick={restoreFromOptions}
          disabled={!app.hasImage}
          title={i18n.t('playback.restoreTitle')}
        >
          <ImageIcon size={16} aria-hidden="true" focusable="false" />
          {i18n.t('playback.restore')}
        </button>
      </div>
    </details>
  </div>
