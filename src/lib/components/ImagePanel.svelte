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
      <div class="image-summary">
        <div class="thumb-frame">
          <canvas bind:this={thumbCanvas} class="thumb" width="88" height="88" aria-label="Original image thumbnail"></canvas>
        </div>
        <div class="image-copy">
          <strong class="file-name" title={app.imageInfo.fileName}>{app.imageInfo.fileName}</strong>
          <span class="mono image-dims">
            {app.imageInfo.width} × {app.imageInfo.height} · {app.imageInfo.megapixels.toFixed(1)} MP
          </span>
          <span class="mono image-size">{formatBytes(app.imageInfo.fileSize)}</span>
        </div>
      </div>

      <dl class="image-facts">
        <div>
          <dt class="label">Format</dt>
          <dd class="mono">{app.imageInfo.mimeType.replace('image/', '').toUpperCase()}</dd>
        </div>
        <div>
          <dt class="label">Grid</dt>
          <dd class="mono">
            {app.gridInfo ? `${app.gridInfo.columns} × ${app.gridInfo.rows}` : '—'}
          </dd>
        </div>
        <div>
          <dt class="label">Shuffle</dt>
          <dd class="mono">{app.seed ? formatSeed(app.seed) : '—'}</dd>
        </div>
      </dl>

      <p class="privacy-line">
        <Icon name="lock" size={13} />
        Stays in this browser. No image data is uploaded.
      </p>

      {#if app.notice}
        <div class="alert alert-warning notice" role="status">
          <Icon name="info" size={15} />
          <span>{app.notice}</span>
          <button
            class="dismiss"
            type="button"
            aria-label="Dismiss image notice"
            onclick={() => app.dismissNotice()}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      {/if}

      <div class="image-actions">
        <ImageUploader compact showError={app.hasImage} />
        <button
          class="btn btn-ghost btn-small remove-btn"
          type="button"
          onclick={() => app.clearImage()}
          title="Remove the image and start over"
        >
          <Icon name="trash" size={14} />
          Remove
        </button>
      </div>
    {:else}
      <div class="empty-image">
        <p class="panel-note">Load an image to see its dimensions, grid, and shuffle ID.</p>
        <ImageUploader compact showError={false} />
      </div>
    {/if}
  </div>
</section>

<style>
  .image-summary {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .thumb-frame {
    flex: none;
    width: 88px;
    height: 88px;
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    background-color: #0b0b0b;
    background-image:
      linear-gradient(45deg, #171717 25%, transparent 25%),
      linear-gradient(-45deg, #171717 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #171717 75%),
      linear-gradient(-45deg, transparent 75%, #171717 75%);
    background-size: 12px 12px;
    background-position:
      0 0,
      0 6px,
      6px -6px,
      -6px 0;
  }

  .thumb {
    display: block;
    width: 100%;
    height: 100%;
  }

  .image-copy {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .file-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .image-dims,
  .image-size {
    color: var(--muted);
    font-size: 10px;
  }

  .image-facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }

  .image-facts dd {
    margin-top: 3px;
    color: var(--soft-lime);
    font-size: 11px;
    font-weight: 600;
  }

  .privacy-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    color: var(--muted);
    font-size: 10.5px;
  }

  .privacy-line :global(svg) {
    flex: none;
    color: var(--lime);
  }

  .notice {
    align-items: center;
    margin-top: 12px;
  }

  .notice span {
    flex: 1;
  }

  .dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .dismiss:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .image-actions {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }

  .remove-btn {
    justify-self: start;
    color: var(--muted);
  }

  .remove-btn:hover:not(:disabled) {
    color: var(--danger);
    border-color: rgba(255, 92, 92, 0.5);
  }

  .empty-image {
    display: grid;
    gap: 10px;
  }
</style>
