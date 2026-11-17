<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';
  import { app, SPEED_PRESETS } from '../stores/appState.svelte';

  const performanceFps = [4, 6, 10, 15, 20, 24, 30];

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
    !app.hasImage ||
      (app.status !== 'running' && app.status !== 'paused' && !app.canStart),
  );

  let stepDisabled = $derived(!app.hasImage || app.mode === 'performance');
  let modeDisabled = $derived(app.isRunning || app.isPaused);

  let warning = $derived(app.workload?.blockers[0] ?? app.workload?.warnings[0] ?? null);
  let warningIsBlocker = $derived((app.workload?.blockers.length ?? 0) > 0);

  let speedText = $derived(
    app.mode === 'performance' ? `${app.sampleFps} fps` : app.speedLabel,
  );

  let speedCaption = $derived(
    app.mode === 'performance' ? 'Sample rate' : 'Playback speed',
  );

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

<section class="playback panel" aria-label="Playback controls">
  {#if app.error}
    <div class="alert" role="alert">
      <Icon name="alert" size={16} />
      <span>{app.error}</span>
    </div>
  {/if}

  {#if warning}
    <div class="alert" class:alert-warning={!warningIsBlocker} role="status">
      <Icon name={warningIsBlocker ? 'alert' : 'info'} size={16} />
      <span>{warning}</span>
    </div>
  {/if}

  <div class="transport">
    <button
      class="btn btn-primary primary"
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
      title={app.mode === 'performance' ? 'Step is available in educational mode' : 'Advance one event'}
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

  <div class="playback-lower">
    <div class="mode-block">
      <span class="label">Playback mode</span>
      <div class="mode-toggle" role="group" aria-label="Playback mode">
        <button
          type="button"
          class:active={app.mode === 'educational'}
          aria-pressed={app.mode === 'educational'}
          disabled={modeDisabled}
          onclick={() => app.setMode('educational')}
        >
          Educational
        </button>
        <button
          type="button"
          class:active={app.mode === 'performance'}
          aria-pressed={app.mode === 'performance'}
          disabled={modeDisabled}
          onclick={() => app.setMode('performance')}
        >
          Performance
        </button>
      </div>
      <span class="mode-note">
        {app.mode === 'educational'
          ? 'One event at a time. Best for stepping and inspection.'
          : 'Batched updates. Best for large element counts.'}
      </span>
    </div>

    <div class="speed-block">
      <div class="speed-head">
        <span class="label">{speedCaption}</span>
        <span class="mono speed-value">{speedText}</span>
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
      <div class="speed-ticks mono" aria-hidden="true">
        {#each SPEED_PRESETS as preset, index}
          <span class:active={index === speedIndex}>
            {app.mode === 'performance' ? performanceFps[index] : preset >= 32 ? 'TURBO' : `${preset}×`}
          </span>
        {/each}
      </div>
    </div>
  </div>

  <div class="playback-foot">
    <span class="mono shortcut-hint">SPACE play/pause · → step · R reset</span>
    <span class="mono run-state">
      {app.modeLabel} · {app.isRunning ? 'LIVE' : app.isPaused ? 'PAUSED' : app.isComplete ? 'DONE' : 'READY'}
    </span>
  </div>
</section>

<style>
  .playback {
    display: grid;
    gap: 12px;
    padding: 12px;
  }

  .transport {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  .primary {
    min-width: 142px;
  }

  .playback-lower {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }

  .mode-block,
  .speed-block {
    display: grid;
    gap: 6px;
    align-content: start;
  }

  .mode-toggle {
    display: inline-flex;
    width: fit-content;
    padding: 2px;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    background: var(--ink);
  }

  .mode-toggle button {
    min-height: 28px;
    padding: 0 9px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--muted);
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
  }

  .mode-toggle button:hover:not(:disabled) {
    color: var(--text);
  }

  .mode-toggle button.active {
    background: var(--lime);
    color: var(--ink);
  }

  .mode-toggle button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .mode-note {
    color: var(--muted-2);
    font-size: 10px;
    line-height: 1.4;
  }

  .speed-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .speed-value {
    color: var(--lime);
    font-size: 11px;
    font-weight: 700;
  }

  .speed-range {
    width: 100%;
    height: 4px;
    margin: 5px 0 2px;
    appearance: none;
    border-radius: 999px;
    background: var(--line-strong);
    cursor: pointer;
  }

  .speed-range::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
    appearance: none;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--pink);
    box-shadow: 0 0 0 1px var(--pink);
  }

  .speed-range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--pink);
    box-shadow: 0 0 0 1px var(--pink);
  }

  .speed-range:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: 4px;
  }

  .speed-ticks {
    display: flex;
    justify-content: space-between;
    gap: 2px;
    color: var(--muted-2);
    font-size: 8px;
    font-weight: 700;
  }

  .speed-ticks span.active {
    color: var(--soft-lime);
  }

  .playback-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 9px;
    border-top: 1px solid var(--line);
  }

  .shortcut-hint {
    color: var(--muted-2);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .run-state {
    color: var(--muted);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  @media (max-width: 700px) {
    .playback-lower {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .shortcut-hint {
      display: none;
    }

    .primary {
      flex: 1;
    }
  }
</style>
