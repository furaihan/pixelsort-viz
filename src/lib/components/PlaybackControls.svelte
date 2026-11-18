<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';
  import { app, SPEED_PRESETS } from '../stores/appState.svelte';

  const performanceFps = [4, 6, 10, 15, 20, 24, 30];

  const modeButton =
    'min-h-7 cursor-pointer rounded-[5px] border-0 px-[9px] text-[10.5px] font-bold disabled:cursor-not-allowed disabled:opacity-45';
  const modeIdle = 'bg-transparent text-muted enabled:hover:text-text';
  const modeActive = 'bg-lime text-ink';

  let speedIndex = $derived(
    Math.max(0, SPEED_PRESETS.indexOf(app.speed as (typeof SPEED_PRESETS)[number])),
  );

  let primaryLabel = $derived(
    app.status === 'running'
      ? 'Pause'
      : app.status === 'paused'
        ? 'Resume'
        : app.status === 'completed'
          ? 'Replay'
          : app.status === 'error'
            ? 'Retry'
            : 'Start sorting',
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

  let speedText = $derived(app.mode === 'performance' ? `${app.sampleFps} fps` : app.speedLabel);

  let speedCaption = $derived(app.mode === 'performance' ? 'Sample rate' : 'Playback speed');

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

<section class="grid gap-3 panel p-3" aria-label="Playback controls">
  {#if app.error}
    <div class="alert" role="alert">
      <Icon name="alert" size={16} />
      <span>{app.error}</span>
    </div>
  {/if}

  {#if warning}
    <div class="alert {warningIsBlocker ? '' : 'alert-warning'}" role="status">
      <Icon name={warningIsBlocker ? 'alert' : 'info'} size={16} />
      <span>{warning}</span>
    </div>
  {/if}

  <div class="flex flex-wrap items-center gap-[7px]">
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
        ? 'Step is available in educational mode'
        : 'Advance one event'}
    >
      <Icon name="step" size={16} />
      Step
    </button>

    <button
      class="btn btn-ghost"
      type="button"
      onclick={() => app.shuffle()}
      disabled={!app.hasImage}
      title="Stop the current run and create a new shuffle"
    >
      <Icon name="shuffle" size={16} />
      Shuffle
    </button>

    <button
      class="btn btn-ghost"
      type="button"
      onclick={() => app.reset()}
      disabled={!app.hasImage}
      title="Restore the initial shuffled arrangement and clear the counters"
    >
      <Icon name="reset" size={16} />
      Reset
    </button>

    <button
      class="btn btn-ghost"
      type="button"
      onclick={() => app.restoreOriginal()}
      disabled={!app.hasImage}
      title="Show the original image arrangement without sorting"
    >
      <Icon name="image" size={16} />
      Restore original
    </button>
  </div>

  <div
    class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 border-t border-line pt-3 compact:grid-cols-1 compact:gap-3"
  >
    <div class="grid content-start gap-1.5">
      <span class="label">Playback mode</span>
      <div
        class="inline-flex w-fit rounded-[7px] border border-line-strong bg-ink p-0.5"
        role="group"
        aria-label="Playback mode"
      >
        <button
          type="button"
          class="{modeButton} {app.mode === 'educational' ? modeActive : modeIdle}"
          aria-pressed={app.mode === 'educational'}
          disabled={modeDisabled}
          onclick={() => app.setMode('educational')}
        >
          Educational
        </button>
        <button
          type="button"
          class="{modeButton} {app.mode === 'performance' ? modeActive : modeIdle}"
          aria-pressed={app.mode === 'performance'}
          disabled={modeDisabled}
          onclick={() => app.setMode('performance')}
        >
          Performance
        </button>
      </div>
      <span class="text-[10px] leading-[1.4] text-muted-2">
        {app.mode === 'educational'
          ? 'One event at a time. Best for stepping and inspection.'
          : 'Batched updates. Best for large element counts.'}
      </span>
    </div>

    <div class="grid content-start gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="label">{speedCaption}</span>
        <span class="mono text-[11px] font-bold text-lime">{speedText}</span>
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
        class="flex justify-between gap-0.5 mono text-[8px] font-bold text-muted-2"
        aria-hidden="true"
      >
        {#each SPEED_PRESETS as preset, index}
          <span class={index === speedIndex ? 'text-soft-lime' : ''}>
            {app.mode === 'performance'
              ? performanceFps[index]
              : preset >= 32
                ? 'TURBO'
                : `${preset}×`}
          </span>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex items-center justify-between gap-2.5 border-t border-line pt-[9px]">
    <span class="mono text-[8px] font-semibold tracking-[0.04em] text-muted-2 compact:hidden">
      SPACE play/pause · → step · R reset
    </span>
    <span class="mono text-[8px] font-bold tracking-[0.1em] text-muted">
      {app.modeLabel} · {app.isRunning
        ? 'LIVE'
        : app.isPaused
          ? 'PAUSED'
          : app.isComplete
            ? 'DONE'
            : 'READY'}
    </span>
  </div>
</section>
