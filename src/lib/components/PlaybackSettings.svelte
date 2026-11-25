<script lang="ts">
  // Snippet library for PlaybackControls: the settings fragment.
  import HotkeySummary from './HotkeySummary.svelte';
  import { app, SPEED_PRESETS, speedToSampleFps } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';

  let {
    showHotkeys = false,
  }: {
    showHotkeys?: boolean;
  } = $props();

  let speedIndex = $derived(
    Math.max(0, SPEED_PRESETS.indexOf(app.speed as (typeof SPEED_PRESETS)[number])),
  );

  let modeDisabled = $derived(app.isRunning || app.isPaused);

  let speedText = $derived(
    app.mode === 'performance' ? `${app.speedLabel} · ${app.sampleFps} fps` : app.speedLabel,
  );

  let speedCaption = $derived(
    app.mode === 'performance' ? i18n.t('playback.sampleRate') : i18n.t('playback.speed'),
  );

  const modeButton =
    'min-h-7 cursor-pointer rounded-[4px] border-0 px-2.5 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-45';
  const modeIdle = 'bg-transparent text-muted enabled:hover:text-text';
  const modeActive = 'bg-accent/15 text-accent';

  function handleSpeed(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const index = Number(input.value);
    const preset = SPEED_PRESETS[index];
    if (preset !== undefined) app.setSpeed(preset);
  }
</script>

<div class="grid gap-3">
  <div class="grid content-start gap-1.5">
    <span class="label">{i18n.t('playback.mode')}</span>
    <div
      class="inline-flex w-fit rounded-[6px] border border-rule bg-inset p-0.5"
      role="group"
      aria-label={i18n.t('playback.mode')}
      title={modeDisabled ? i18n.t('playback.modeLockedTitle') : undefined}
    >
      <button
        type="button"
        class="{modeButton} {app.mode === 'educational' ? modeActive : modeIdle}"
        aria-pressed={app.mode === 'educational'}
        disabled={modeDisabled}
        onclick={() => app.setMode('educational')}
      >
        {i18n.t('playback.educational')}
      </button>
      <button
        type="button"
        class="{modeButton} {app.mode === 'performance' ? modeActive : modeIdle}"
        aria-pressed={app.mode === 'performance'}
        disabled={modeDisabled}
        onclick={() => app.setMode('performance')}
      >
        {i18n.t('playback.performance')}
      </button>
    </div>
    <span class="text-[11px] leading-[1.4] text-muted-2">
      {app.mode === 'educational'
        ? i18n.t('playback.educationalNote')
        : i18n.t('playback.performanceNote')}
    </span>
  </div>

  <div class="grid content-start gap-1.5">
    <div class="flex items-center justify-between gap-2">
      <span class="label">{speedCaption}</span>
      <span class="mono text-[13px] font-bold text-text">{speedText}</span>
    </div>
    <input
      class="speed-range"
      type="range"
      min="0"
      max={SPEED_PRESETS.length - 1}
      step="1"
      value={speedIndex}
      oninput={handleSpeed}
      aria-label={speedCaption}
      aria-valuetext={speedText}
    />
    <div
      class="flex justify-between gap-0.5 mono text-[11px] font-bold text-muted-2"
      aria-hidden="true"
    >
      {#each SPEED_PRESETS as preset, index}
        <span class={index === speedIndex ? 'text-text' : ''}>
          {app.mode === 'performance' ? speedToSampleFps(preset) : `${preset}×`}
        </span>
      {/each}
    </div>
  </div>
</div>

<div class="flex items-center justify-between gap-2.5 border-t border-rule pt-2.5">
  {#if showHotkeys}
    <div class="mono text-[11px] font-semibold tracking-[0.04em] text-muted-2">
      <HotkeySummary />
    </div>
  {/if}
  <span class="mono text-[11px] font-bold tracking-[0.1em] text-muted">
    {app.modeLabel}
  </span>
</div>
