<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import ImageUploader from './ImageUploader.svelte';
  import { app } from '../stores/appState.svelte';
  import { CanvasRenderer } from '../core/visualization/CanvasRenderer';
  import type { SortEvent } from '../core/sorting/types';
  import { formatNumber } from '../utils/format';

  let mainCanvas: HTMLCanvasElement;
  let overlayCanvas: HTMLCanvasElement;
  let wrapper: HTMLElement;

  let aspect = $derived(app.imageInfo ? app.imageInfo.width / app.imageInfo.height : 1.6);

  let canvasLabel = $derived(
    app.hasImage
      ? `Live image visualization. ${app.currentLabel} ${app.currentDetail}`
      : 'No image loaded. Drop an image to begin.',
  );

  function eventTypeLabel(event: SortEvent | null): string {
    if (!event) return 'IDLE';
    switch (event.type) {
      case 'compare':
      case 'compare-value':
        return 'COMPARE';
      case 'read':
        return 'READ';
      case 'swap':
        return 'SWAP';
      case 'write':
        return 'WRITE';
      case 'mark':
        return event.role === 'pivot' ? 'PIVOT' : event.role === 'sorted' ? 'SORTED' : 'RANGE';
      case 'pass':
        return 'PASS';
      case 'delta':
        return 'BATCH';
      case 'snapshot':
        return 'SNAPSHOT';
      case 'complete':
        return 'COMPLETE';
    }
  }

  function stampTone(event: SortEvent | null): string {
    if (!event) return 'soft';
    if (
      event.type === 'compare' ||
      event.type === 'compare-value' ||
      event.type === 'swap' ||
      (event.type === 'mark' && event.role === 'pivot')
    ) {
      return 'pink';
    }
    if (event.type === 'complete') {
      return event.validated ? 'lime' : 'pink';
    }
    if (event.type === 'mark' && event.role === 'sorted') {
      return 'lime';
    }
    return 'soft';
  }

  onMount(() => {
    const renderer = new CanvasRenderer();
    renderer.attach(mainCanvas, overlayCanvas, wrapper);
    app.attachRenderer(renderer);
    return () => {
      app.detachRenderer();
    };
  });
</script>

<section class="proof-frame" aria-label="Image workspace">
  <div class="proof-head">
    <div class="proof-id">
      <svg class="reg-mark" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" stroke-width="1" />
        <path d="M8 0v5M8 11v5M0 8h5M11 8h5" stroke="currentColor" stroke-width="1" />
      </svg>
      <span class="mono proof-label">PROOF 01 / LIVE IMPRESSION</span>
      {#if app.isRunning}
        <span class="live-dot" aria-hidden="true"></span>
      {/if}
    </div>
    <div class="proof-meta mono">
      {#if app.imageInfo}
        {app.imageInfo.width} × {app.imageInfo.height} / {app.blockSize === 1
          ? '1 PX'
          : `${app.blockSize} PX`}
      {:else}
        AWAITING IMAGE
      {/if}
    </div>
  </div>

  <div class="canvas-shell" class:hidden={!app.hasImage}>
    <div
      class="canvas-wrapper"
      bind:this={wrapper}
      role="img"
      aria-label={canvasLabel}
      style:--aspect={aspect}
      style:aspect-ratio="{app.imageInfo?.width ?? 16} / {app.imageInfo?.height ?? 10}"
    >
      <canvas bind:this={mainCanvas} class="main-canvas" aria-hidden="true"></canvas>
      <canvas bind:this={overlayCanvas} class="overlay-canvas" aria-hidden="true"></canvas>
    </div>

    <div class="canvas-tools">
      <button
        class="btn btn-ghost btn-small"
        type="button"
        onclick={() => app.toggleGhost()}
        aria-pressed={app.ghostOriginal}
      >
        <Icon name={app.ghostOriginal ? 'eye-off' : 'eye'} size={15} />
        {app.ghostOriginal ? 'Hide original ghost' : 'Show original ghost'}
      </button>
      <span class="canvas-note mono">SOURCE RESOLUTION / NEAREST NEIGHBOR</span>
    </div>
  </div>

  {#if !app.hasImage}
    <ImageUploader />
  {/if}

  <div class="now-strip" aria-live={app.isRunning ? 'off' : 'polite'}>
    <span class="now-stamp mono" data-tone={stampTone(app.currentEvent)}>
      {eventTypeLabel(app.currentEvent)}
    </span>
    <div class="now-copy">
      <strong>{app.currentLabel}</strong>
      <span>{app.currentDetail}</span>
    </div>
    {#if app.gridInfo}
      <span class="now-count mono">
        {formatNumber(app.gridInfo.elementCount)}
        <small>ELEMENTS</small>
      </span>
    {/if}
  </div>
</section>

<style>
  .proof-frame {
    position: relative;
    padding: 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--ink-2);
  }

  .proof-frame::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px dashed rgba(230, 255, 128, 0.16);
    border-radius: 10px;
    pointer-events: none;
  }

  .proof-head {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 2px 4px 12px;
  }

  .proof-id {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .reg-mark {
    flex: none;
    color: var(--lime);
  }

  .proof-label {
    color: var(--muted);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .proof-meta {
    color: var(--muted-2);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    flex: none;
    border-radius: 50%;
    background: var(--lime);
    animation: pulse 1.4s ease-in-out infinite;
  }

  .canvas-shell {
    display: grid;
    gap: 8px;
  }

  .canvas-shell.hidden {
    display: none;
  }

  .canvas-wrapper {
    position: relative;
    width: min(100%, calc(48vh * var(--aspect)));
    aspect-ratio: var(--aspect);
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background-color: #0b0b0b;
    background-image:
      linear-gradient(45deg, #151515 25%, transparent 25%),
      linear-gradient(-45deg, #151515 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #151515 75%),
      linear-gradient(-45deg, transparent 75%, #151515 75%);
    background-size: 16px 16px;
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
  }

  .main-canvas,
  .overlay-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .main-canvas {
    image-rendering: auto;
  }

  .overlay-canvas {
    pointer-events: none;
  }

  .canvas-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 2px;
  }

  .canvas-note {
    color: var(--muted-2);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-align: right;
  }

  .now-strip {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--ink);
  }

  .now-stamp {
    flex: none;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--soft-lime);
    color: var(--ink);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    transform: rotate(-1.5deg);
  }

  .now-stamp[data-tone='pink'] {
    background: var(--pink);
  }

  .now-stamp[data-tone='lime'] {
    background: var(--lime);
  }

  .now-copy {
    display: grid;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }

  .now-copy strong {
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .now-copy span {
    color: var(--muted);
    font-size: 11.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .now-count {
    display: grid;
    justify-items: end;
    flex: none;
    color: var(--soft-lime);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.1;
  }

  .now-count small {
    color: var(--muted-2);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.35;
      transform: scale(0.7);
    }
  }

  @media (max-width: 700px) {
    .proof-frame {
      padding: 9px;
    }

    .canvas-wrapper {
      width: min(100%, calc(52vh * var(--aspect)));
    }

    .canvas-note {
      display: none;
    }

    .now-count {
      display: none;
    }
  }

  @media (max-width: 380px) {
    .proof-meta {
      display: none;
    }

    .proof-label {
      font-size: 8px;
    }
  }
</style>
