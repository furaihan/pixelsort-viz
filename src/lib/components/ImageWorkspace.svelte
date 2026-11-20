<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import ImageUploader from './ImageUploader.svelte';
  import { app } from '../stores/appState.svelte';
  import { CanvasRenderer } from '../core/visualization/CanvasRenderer';
  import { formatBytes, formatNumber, formatSeed, formatTime } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';
  import { theme } from '../theme/index.svelte';
  import { getCanvasPalette } from '../theme/palettes';

  let mainCanvas: HTMLCanvasElement;
  let overlayCanvas: HTMLCanvasElement;
  let wrapper: HTMLElement;
  let renderer: CanvasRenderer | null = null;

  let aspect = $derived(app.imageInfo ? app.imageInfo.width / app.imageInfo.height : 1.6);

  let canvasLabel = $derived(
    app.hasImage
      ? i18n.t('workspace.ariaLiveImage', {
          label: i18n.text(app.currentLabel),
          detail: i18n.text(app.currentDetail),
        })
      : i18n.t('workspace.ariaNoImage'),
  );

  // The entry date is fixed when the sheet mounts; only its formatting tracks the locale.
  const entryTimestamp = Date.now();
  let entryDate = $derived(
    new Date(entryTimestamp).toLocaleDateString(i18n.locale === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }),
  );

  let verified = $derived(
    app.isComplete && app.currentEvent?.type === 'complete' ? app.currentEvent.validated : null,
  );

  // Proportional operation ticks: height encodes the relative cost of each
  // recent operation kind (a swap moves two elements; a compare only reads).
  const tickWeight: Record<string, number> = {
    compare: 2,
    swap: 4,
    write: 1,
    read: 1,
    pivot: 2,
    sorted: 1,
    complete: 3,
    pass: 2,
    batch: 3,
  };

  let ticks = $derived(
    app.eventLog
      .slice(0, 8)
      .map((entry) => ({
        id: entry.id,
        height: Math.min(24, 6 + (tickWeight[entry.type] ?? 1) * 4),
        tone:
          entry.type === 'compare' || entry.type === 'swap' || entry.type === 'pivot'
            ? 'focal'
            : entry.type === 'sorted' || entry.type === 'complete'
              ? 'accent'
              : 'structure',
      }))
      .reverse(),
  );

  onMount(() => {
    renderer = new CanvasRenderer();
    renderer.attach(mainCanvas, overlayCanvas, wrapper);
    renderer.setPalette(getCanvasPalette(theme.current));
    app.attachRenderer(renderer);
    return () => {
      app.detachRenderer();
      renderer = null;
    };
  });

  $effect(() => {
    renderer?.setPalette(getCanvasPalette(theme.current));
  });
</script>

<section class="grid min-w-0 gap-3" id="specimen" aria-label={i18n.t('workspace.aria')}>
  <!-- Run entry header: the notebook's stamped record of this experiment. -->
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <span class="stamp text-[17px]">
      {app.runNumber > 0
        ? i18n.t('workspace.runStamp', { n: String(app.runNumber).padStart(3, '0') })
        : i18n.t('workspace.runPending')}
    </span>
    {#if verified !== null}
      <span
        class="stamp animate-stamp-press text-[13px]"
        data-tone={verified ? 'accent' : 'danger'}
        role="status"
      >
        <Icon name={verified ? 'check' : 'alert'} size={14} />
        {verified ? i18n.t('workspace.verified') : i18n.t('workspace.notVerified')}
      </span>
    {/if}
    <span class="mono text-[12px] font-bold tracking-[0.06em] text-muted">
      {entryDate} ·
      <span class="text-text">{i18n.algorithmName(app.algorithmId).toUpperCase()}</span>
      · {app.blockSize}
      {i18n.t('workspace.px')} · {i18n.t('common.shuffle')}
      <span class="text-text">{app.seed ? formatSeed(app.seed) : '—'}</span>
    </span>
    <span class="ml-auto mono text-[20px] font-bold text-text">
      {app.runNumber > 0 ? formatTime(app.activeMs) : '—'}
    </span>
  </div>

  <div class={app.hasImage ? 'grid gap-2' : 'hidden'}>
    <div class="flex items-center justify-between gap-3 px-0.5">
      <span
        class="inline-flex items-center gap-2 mono text-[11px] font-bold tracking-[0.12em] text-muted-2"
      >
        <Icon name="pivot" size={13} className="text-structure" />
        {i18n.t('workspace.ruling', { size: app.blockSize })}
        {#if app.isRunning}
          <span class="size-1.5 animate-pulse-soft rounded-full bg-focal" aria-hidden="true"></span>
        {/if}
      </span>
      <span
        class="mono text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-muted-2 tiny:hidden"
      >
        {app.imageInfo?.width} × {app.imageInfo?.height} / {app.blockSize}
        {i18n.t('workspace.px')}
      </span>
    </div>

    <!-- The specimen plate, taped to the ruled sheet. -->
    <div
      class="relative mx-auto w-[min(100%,calc(48vh*var(--aspect)))] compact:w-[min(100%,calc(52vh*var(--aspect)))]"
      style:--aspect={aspect}
      style:aspect-ratio="{app.imageInfo?.width ?? 16} / {app.imageInfo?.height ?? 10}"
    >
      <span
        class="absolute -top-3 left-8 z-10 h-6 w-24 -rotate-3 border border-text/10 bg-text/15"
        aria-hidden="true"
      ></span>
      <span
        class="absolute -top-3 right-8 z-10 h-6 w-24 rotate-2 border border-text/10 bg-text/15"
        aria-hidden="true"
      ></span>

      <div
        bind:this={wrapper}
        class="relative size-full overflow-hidden border border-rule-strong checkerboard [--checker-size:16px]"
        role="img"
        aria-label={canvasLabel}
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

      <svg
        class="absolute -top-[9px] -left-[9px] size-[18px] text-structure"
        viewBox="0 0 18 18"
        aria-hidden="true"
      >
        <path d="M9 0v18M0 9h18" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg
        class="absolute -top-[9px] -right-[9px] size-[18px] text-structure"
        viewBox="0 0 18 18"
        aria-hidden="true"
      >
        <path d="M9 0v18M0 9h18" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg
        class="absolute -bottom-[9px] -left-[9px] size-[18px] text-structure"
        viewBox="0 0 18 18"
        aria-hidden="true"
      >
        <path d="M9 0v18M0 9h18" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg
        class="absolute -right-[9px] -bottom-[9px] size-[18px] text-structure"
        viewBox="0 0 18 18"
        aria-hidden="true"
      >
        <path d="M9 0v18M0 9h18" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </div>

    <div class="flex flex-wrap items-center gap-2 px-0.5">
      <div class="min-w-[210px] flex-1">
        <ImageUploader compact />
      </div>
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
      <button
        class="btn btn-small btn-ghost hover:border-danger/50 hover:text-danger"
        type="button"
        onclick={() => app.clearImage()}
        title={i18n.t('image.removeTitle')}
      >
        <Icon name="trash" size={14} />
        {i18n.t('common.remove')}
      </button>
      <span
        class="ml-auto text-right mono text-[11px] font-bold tracking-[0.1em] text-muted-2 compact:hidden"
      >
        {i18n.t('workspace.sourceResolution')}
      </span>
    </div>

    {#if app.imageInfo}
      <div
        class="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 mono text-[11px] font-semibold text-muted-2"
      >
        <span class="max-w-full truncate text-muted">{app.imageInfo.fileName}</span>
        <span>
          {app.imageInfo.width} × {app.imageInfo.height} · {i18n.decimal(
            app.imageInfo.megapixels,
            1,
          )} MP · {formatBytes(app.imageInfo.fileSize)}
        </span>
        <span>
          {i18n.t('common.shuffle')}
          {app.seed ? formatSeed(app.seed) : '—'}
        </span>
      </div>
    {/if}

    {#if app.notice}
      <div class="alert items-center alert-warning [&>span]:flex-1" role="status">
        <Icon name="info" size={15} />
        <span>{i18n.text(app.notice)}</span>
        <button
          class="inline-flex size-[22px] flex-none cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-inherit hover:bg-text/10"
          type="button"
          aria-label={i18n.t('image.dismissNotice')}
          onclick={() => app.dismissNotice()}
        >
          <Icon name="x" size={13} />
        </button>
      </div>
    {/if}
  </div>
  {#if !app.hasImage}
    <!-- Unmounted specimen: the blank plate waits for an image. -->
    <div
      class="grid min-h-[440px] content-center gap-4 rounded-[12px] border border-dashed border-rule-strong bg-panel/60 p-5 compact:p-4"
    >
      <div class="flex flex-wrap items-start gap-4">
        <div
          class="grid grid-cols-[repeat(4,14px)] gap-1 rounded-[6px] border border-rule bg-inset p-2"
          aria-hidden="true"
        >
          {#each Array(16) as _, index}
            <span
              class="size-[14px] rounded-[2px] {index === 2 || index === 7 || index === 13
                ? 'bg-accent'
                : index === 5 || index === 10 || index === 15
                  ? 'bg-focal'
                  : index === 0 || index === 9
                    ? 'bg-structure'
                    : 'bg-raised'}"
            ></span>
          {/each}
        </div>
        <div class="grid min-w-[220px] flex-1 gap-1.5">
          <h2 class="text-[20px] font-bold tracking-[-0.02em] text-text">
            {i18n.t('workspace.emptyHeadline')}
          </h2>
          <p class="max-w-[54ch] text-[13px] leading-[1.5] text-muted">
            {i18n.t('workspace.emptyDescription')}
          </p>
        </div>
      </div>
      <ImageUploader />
    </div>
  {/if}

  <!-- Observation strip: the margin note narrating the current operation. -->
  <div
    class="flex items-center gap-4 rounded-[12px] border border-rule bg-panel/70 px-4 py-3"
    aria-live={app.isRunning ? 'off' : 'polite'}
  >
    <span class="label flex-none">{i18n.t('workspace.observation')}</span>
    <div class="grid min-w-0 flex-1 gap-px">
      <strong class="truncate text-[13px] font-bold">{i18n.text(app.currentLabel)}</strong>
      <span class="line-clamp-2 text-[12px] text-muted">{i18n.text(app.currentDetail)}</span>
    </div>
    {#if ticks.length > 0}
      <span class="flex h-6 flex-none items-end gap-[3px]" aria-hidden="true">
        {#each ticks as tick (tick.id)}
          <i
            class="w-[5px] rounded-[1px]"
            style:height="{tick.height}px"
            style:background="var(--color-{tick.tone})"
          ></i>
        {/each}
      </span>
    {/if}
    {#if app.gridInfo}
      <span
        class="grid flex-none justify-items-end mono text-[15px] leading-[1.1] font-bold text-text compact:hidden"
      >
        {formatNumber(app.gridInfo.elementCount)}
        <small class="text-[10px] font-bold tracking-[0.12em] text-muted-2">
          {i18n.t('workspace.elementsInPlace', { percent: app.alignedPercent })}
        </small>
      </span>
    {/if}
  </div>
</section>
