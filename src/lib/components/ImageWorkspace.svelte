<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import ImageUploader from './ImageUploader.svelte';
  import { app } from '../stores/appState.svelte';
  import { CanvasRenderer } from '../core/visualization/CanvasRenderer';
  import type { SortEvent } from '../core/sorting/types';
  import { formatNumber } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';

  let mainCanvas: HTMLCanvasElement;
  let overlayCanvas: HTMLCanvasElement;
  let wrapper: HTMLElement;

  let aspect = $derived(app.imageInfo ? app.imageInfo.width / app.imageInfo.height : 1.6);

  let canvasLabel = $derived(
    app.hasImage
      ? i18n.t('workspace.ariaLiveImage', {
          label: i18n.text(app.currentLabel),
          detail: i18n.text(app.currentDetail),
        })
      : i18n.t('workspace.ariaNoImage'),
  );

  function eventTypeLabel(event: SortEvent | null): string {
    if (!event) return i18n.t('event.idle');
    switch (event.type) {
      case 'compare':
      case 'compare-value':
        return i18n.t('event.compare');
      case 'read':
        return i18n.t('event.read');
      case 'swap':
        return i18n.t('event.swap');
      case 'write':
        return i18n.t('event.write');
      case 'mark':
        if (event.role === 'pivot') return i18n.t('event.pivot');
        if (event.role === 'sorted') return i18n.t('event.sorted');
        return event.range ? i18n.t('event.range') : i18n.t('event.active');
      case 'pass':
        return i18n.t('event.pass');
      case 'delta':
        return i18n.t('event.batch');
      case 'snapshot':
        return i18n.t('event.snapshot');
      case 'complete':
        return i18n.t('event.complete');
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

<section
  class="relative rounded-[14px] border border-line-strong bg-ink-2 p-3 before:pointer-events-none before:absolute before:inset-1.5 before:rounded-[10px] before:border before:border-dashed before:border-soft-lime/16 before:content-[''] compact:p-[9px]"
  aria-label={i18n.t('workspace.aria')}
>
  <div class="relative flex items-center justify-between gap-3 px-1 pt-0.5 pb-3">
    <div class="flex min-w-0 items-center gap-2">
      <svg
        class="flex-none text-lime"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" stroke-width="1" />
        <path d="M8 0v5M8 11v5M0 8h5M11 8h5" stroke="currentColor" stroke-width="1" />
      </svg>
      <span class="truncate mono text-[9px] font-bold tracking-[0.12em] text-muted tiny:text-[8px]">
        {i18n.t('workspace.proofLabel')}
      </span>
      {#if app.isRunning}
        <span class="size-1.5 flex-none animate-pulse-soft rounded-full bg-lime" aria-hidden="true"
        ></span>
      {/if}
    </div>
    <div
      class="mono text-[9px] font-bold tracking-[0.08em] whitespace-nowrap text-muted-2 tiny:hidden"
    >
      {#if app.imageInfo}
        {app.imageInfo.width} × {app.imageInfo.height} / {app.blockSize === 1
          ? `1 ${i18n.t('workspace.px')}`
          : `${app.blockSize} ${i18n.t('workspace.px')}`}
      {:else}
        {i18n.t('workspace.awaitingImage')}
      {/if}
    </div>
  </div>

  <div class={app.hasImage ? 'grid gap-2' : 'hidden'}>
    <div
      class="relative mx-auto w-[min(100%,calc(48vh*var(--aspect)))] overflow-hidden rounded-lg border border-line-strong checkerboard [--checker-fg:#151515] [--checker-size:16px] compact:w-[min(100%,calc(52vh*var(--aspect)))]"
      bind:this={wrapper}
      role="img"
      aria-label={canvasLabel}
      style:--aspect={aspect}
      style:aspect-ratio="{app.imageInfo?.width ?? 16} / {app.imageInfo?.height ?? 10}"
    >
      <canvas
        bind:this={mainCanvas}
        class="absolute inset-0 block size-full [image-rendering:pixelated]"
        aria-hidden="true"
      ></canvas>
      <canvas
        bind:this={overlayCanvas}
        class="pointer-events-none absolute inset-0 block size-full"
        aria-hidden="true"
      ></canvas>
    </div>

    <div class="flex items-center justify-between gap-2.5 px-0.5">
      <button
        class="btn btn-small btn-ghost"
        type="button"
        onclick={() => app.toggleGhost()}
        aria-pressed={app.ghostOriginal}
      >
        <Icon name={app.ghostOriginal ? 'eye-off' : 'eye'} size={15} />
        {app.ghostOriginal
          ? i18n.t('workspace.hideOriginalGhost')
          : i18n.t('workspace.showOriginalGhost')}
      </button>
      <span
        class="text-right mono text-[8px] font-bold tracking-[0.1em] text-muted-2 compact:hidden"
      >
        {i18n.t('workspace.sourceResolution')}
      </span>
    </div>
  </div>

  {#if !app.hasImage}
    <ImageUploader />
  {/if}

  <div
    class="mt-2.5 flex items-center gap-3 rounded-[10px] border border-line bg-ink px-3 py-2.5"
    aria-live={app.isRunning ? 'off' : 'polite'}
  >
    <span
      class="flex-none -rotate-[1.5deg] rounded-[4px] bg-soft-lime px-2 py-1 mono text-[9px] font-extrabold tracking-[0.08em] text-ink data-[tone=lime]:bg-lime data-[tone=pink]:bg-pink"
      data-tone={stampTone(app.currentEvent)}
    >
      {eventTypeLabel(app.currentEvent)}
    </span>
    <div class="grid min-w-0 flex-1 gap-px">
      <strong class="truncate text-[12.5px] font-bold">{i18n.text(app.currentLabel)}</strong>
      <span class="line-clamp-2 text-[11.5px] text-muted">{i18n.text(app.currentDetail)}</span>
    </div>
    {#if app.gridInfo}
      <span
        class="grid flex-none justify-items-end mono text-[12px] leading-[1.1] font-bold text-soft-lime compact:hidden"
      >
        {formatNumber(app.gridInfo.elementCount)}
        <small class="text-[7px] font-bold tracking-[0.12em] text-muted-2">
          {i18n.t('workspace.elementsInPlace', { percent: app.alignedPercent })}
        </small>
      </span>
    {/if}
  </div>
</section>
