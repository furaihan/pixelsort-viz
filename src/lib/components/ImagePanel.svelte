<script lang="ts">
  import Icon from './Icon.svelte';
  import ImageUploader from './ImageUploader.svelte';
  import { app } from '../stores/appState.svelte';
  import { formatBytes, formatSeed } from '../utils/format';

  let thumbCanvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    const info = app.imageInfo;
    const image = app.image;
    if (!thumbCanvas || !info || !image) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = image.width;
    offscreen.height = image.height;
    const offscreenContext = offscreen.getContext('2d');
    if (!offscreenContext) return;
    offscreenContext.putImageData(
      new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
      0,
      0,
    );

    const context = thumbCanvas.getContext('2d');
    if (!context) return;
    const size = 88;
    thumbCanvas.width = size;
    thumbCanvas.height = size;
    context.clearRect(0, 0, size, size);
    const scale = Math.max(size / image.width, size / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.imageSmoothingEnabled = true;
    context.drawImage(offscreen, (size - width) / 2, (size - height) / 2, width, height);
  });
</script>

<section class="panel" aria-labelledby="image-panel-title">
  <div class="panel-head">
    <h2 class="panel-title" id="image-panel-title">
      <Icon name="image" size={15} />
      Image
    </h2>
    {#if app.imageInfo}
      <span class="chip chip-lime">LOCAL</span>
    {/if}
  </div>

  <div class="panel-body">
    {#if app.imageInfo}
      <div class="flex items-center gap-3">
        <div
          class="checkerboard size-[88px] flex-none overflow-hidden rounded-[7px] border border-line-strong"
        >
          <canvas
            bind:this={thumbCanvas}
            class="block h-full w-full"
            width="88"
            height="88"
            aria-label="Original image thumbnail"
          ></canvas>
        </div>
        <div class="grid min-w-0 gap-[3px]">
          <strong class="truncate text-[13px] font-bold" title={app.imageInfo.fileName}
            >{app.imageInfo.fileName}</strong
          >
          <span class="mono text-[10px] text-muted">
            {app.imageInfo.width} × {app.imageInfo.height} · {app.imageInfo.megapixels.toFixed(1)} MP
          </span>
          <span class="mono text-[10px] text-muted">{formatBytes(app.imageInfo.fileSize)}</span>
        </div>
      </div>

      <dl class="mt-3.5 grid grid-cols-3 gap-2.5 border-t border-line pt-3">
        <div>
          <dt class="label">Format</dt>
          <dd class="mono mt-[3px] text-[11px] font-semibold text-soft-lime">
            {app.imageInfo.mimeType.replace('image/', '').toUpperCase()}
          </dd>
        </div>
        <div>
          <dt class="label">Grid</dt>
          <dd class="mono mt-[3px] text-[11px] font-semibold text-soft-lime">
            {app.gridInfo ? `${app.gridInfo.columns} × ${app.gridInfo.rows}` : '—'}
          </dd>
        </div>
        <div>
          <dt class="label">Shuffle</dt>
          <dd class="mono mt-[3px] text-[11px] font-semibold text-soft-lime">
            {app.seed ? formatSeed(app.seed) : '—'}
          </dd>
        </div>
      </dl>

      <p
        class="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted [&_svg]:flex-none [&_svg]:text-lime"
      >
        <Icon name="lock" size={13} />
        Stays in this browser. No image data is uploaded.
      </p>

      {#if app.notice}
        <div
          class="alert alert-warning mt-3 items-center [&>span]:flex-1"
          role="status"
        >
          <Icon name="info" size={15} />
          <span>{app.notice}</span>
          <button
            class="inline-flex size-[22px] flex-none cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-inherit hover:bg-white/8"
            type="button"
            aria-label="Dismiss image notice"
            onclick={() => app.dismissNotice()}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      {/if}

      <div class="mt-3 grid gap-2">
        <ImageUploader compact showError={app.hasImage} />
        <button
          class="btn btn-ghost btn-small justify-self-start text-muted hover:border-danger/50 hover:text-danger"
          type="button"
          onclick={() => app.clearImage()}
          title="Remove the image and start over"
        >
          <Icon name="trash" size={14} />
          Remove
        </button>
      </div>
    {:else}
      <div class="grid gap-2.5">
        <p class="panel-note">Load an image to see its dimensions, grid, and shuffle ID.</p>
        <ImageUploader compact showError={false} />
      </div>
    {/if}
  </div>
</section>
