<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';
  import { app, SPEED_PRESETS } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';

  let {
    inline = false,
    zone = 'full',
  }: { inline?: boolean; zone?: 'full' | 'actions' | 'settings' } = $props();

  const performanceFps = [4, 6, 10, 15, 20, 24, 45];

  const modeButton =
    'min-h-7 cursor-pointer rounded-[4px] border-0 px-2.5 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-45';
  const modeIdle = 'bg-transparent text-muted enabled:hover:text-text';
  const modeActive = 'bg-accent/15 text-accent';

  let speedIndex = $derived(
    Math.max(0, SPEED_PRESETS.indexOf(app.speed as (typeof SPEED_PRESETS)[number])),
  );

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

  let primaryIcon = $derived((app.status === 'running' ? 'pause' : 'play') as IconName);

  let primaryDisabled = $derived(
    !app.hasImage || (app.status !== 'running' && app.status !== 'paused' && !app.canStart),
  );

  let stepDisabled = $derived(
    !app.hasImage || app.mode === 'performance' || (!app.isPaused && !app.canStart),
  );
  let modeDisabled = $derived(app.isRunning || app.isPaused);

  let warning = $derived(app.workload?.blockers[0] ?? app.workload?.warnings[0] ?? null);
  let warningIsBlocker = $derived((app.workload?.blockers.length ?? 0) > 0);

  let speedText = $derived(
    app.mode === 'performance' ? `${app.speedLabel} · ${app.sampleFps} fps` : app.speedLabel,
  );

  let speedCaption = $derived(
    app.mode === 'performance' ? i18n.t('playback.sampleRate') : i18n.t('playback.speed'),
  );

  let showActions = $derived(zone === 'full' || zone === 'actions');
  let showSettings = $derived(zone === 'full' || zone === 'settings');

  function primaryAction(): void {
    if (app.status === 'running') {
      app.pause();
    } else if (app.status === 'paused') {
      app.resume();
    } else {
      app.startRun();
    }
  }

  function handleSpeed(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const index = Number(input.value);
    const preset = SPEED_PRESETS[index];
    if (preset !== undefined) app.setSpeed(preset);
  }
</script>

<svelte:element
  this={inline ? 'div' : 'section'}
  class={inline ? 'grid content-start gap-3' : 'grid gap-3 panel p-3'}
  role={inline ? 'group' : undefined}
  aria-label={i18n.t('playback.title')}
>
  {#if showActions}
    {#if app.error}
      <div class="alert" role="alert">
        <Icon name="alert" size={16} />
        <span>{i18n.text(app.error)}</span>
      </div>
    {/if}

    {#if warning}
      <div class="alert {warningIsBlocker ? '' : 'alert-warning'}" role="status">
        <Icon name={warningIsBlocker ? 'alert' : 'info'} size={16} />
        <span>{i18n.text(warning)}</span>
      </div>
    {/if}

    <div class="flex flex-wrap items-center gap-2">
      <button
        class="btn min-w-[142px] btn-primary compact:flex-1"
        type="button"
        onclick={primaryAction}
        disabled={primaryDisabled}
      >
        <Icon name={primaryIcon} size={17} />
        {primaryLabel}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.step()}
        disabled={stepDisabled}
        title={app.mode === 'performance'
          ? i18n.t('playback.performanceStepTitle')
          : i18n.t('playback.stepTitle')}
      >
        <Icon name="step" size={16} />
        {i18n.t('playback.step')}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.shuffle()}
        disabled={!app.hasImage}
        title={i18n.t('playback.shuffleTitle')}
      >
        <Icon name="shuffle" size={16} />
        {i18n.t('playback.shuffle')}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.reset()}
        disabled={!app.hasImage}
        title={i18n.t('playback.resetTitle')}
      >
        <Icon name="reset" size={16} />
        {i18n.t('playback.reset')}
      </button>

      <button
        class="btn btn-ghost"
        type="button"
        onclick={() => app.restoreOriginal()}
        disabled={!app.hasImage}
        title={i18n.t('playback.restoreTitle')}
      >
        <Icon name="image" size={16} />
        {i18n.t('playback.restore')}
      </button>
    </div>
  {/if}

  {#if showSettings}
    <div class="grid gap-3">
      <div class="grid content-start gap-1.5">
        <span class="label">{i18n.t('playback.mode')}</span>
        <div
          class="inline-flex w-fit rounded-[6px] border border-rule bg-inset p-0.5"
          role="group"
          aria-label={i18n.t('playback.mode')}
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
              {app.mode === 'performance' ? performanceFps[index] : `${preset}×`}
            </span>
          {/each}
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2.5 border-t border-rule pt-2.5">
      <span
        class="mono text-[11px] font-semibold tracking-[0.04em] text-muted-2 compact:hidden {inline
          ? 'hidden'
          : ''}"
      >
        {i18n.t('playback.shortcuts')}
      </span>
      <span class="mono text-[11px] font-bold tracking-[0.1em] text-muted">
        {app.modeLabel} · {app.isRunning
          ? i18n.t('playback.live')
          : app.isPaused
            ? i18n.t('playback.paused')
            : app.isComplete
              ? i18n.t('playback.done')
              : i18n.t('playback.ready')}
      </span>
    </div>
  {/if}
</svelte:element>
