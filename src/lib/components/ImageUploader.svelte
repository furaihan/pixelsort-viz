<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';

  let { compact = false, showError = true }: { compact?: boolean; showError?: boolean } = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let dragging = $state(false);

  function openPicker(): void {
    if (app.isLoadingImage) return;
    fileInput?.click();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  }

  function handleFiles(files: FileList | null): void {
    const file = files?.[0];
    if (file) void app.loadImage(file);
  }

  function handleChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    handleFiles(input.files);
    input.value = '';
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!app.isLoadingImage) dragging = true;
  }

  function handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    dragging = false;
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    dragging = false;
    if (app.isLoadingImage) return;
    handleFiles(event.dataTransfer?.files ?? null);
  }
</script>

<div class="uploader" class:compact>
  <input
    bind:this={fileInput}
    class="sr-only"
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onchange={handleChange}
    tabindex="-1"
    aria-hidden="true"
  />

  <div
    class="dropzone"
    class:dragging
    class:loading={app.isLoadingImage}
    role="button"
    tabindex="0"
    aria-label="Upload an image. PNG, JPEG, or WebP."
    onclick={openPicker}
    onkeydown={handleKeydown}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if compact}
      <div class="compact-row">
        <span class="compact-icon"><Icon name="upload" size={16} /></span>
        <span class="compact-copy">
          <strong>
            {app.isLoadingImage
              ? 'Decoding image…'
              : app.hasImage
                ? 'Replace image'
                : 'Choose image'}
          </strong>
          <span>PNG, JPEG, or WebP · stays local</span>
        </span>
        <Icon name="arrow-right" size={16} />
      </div>
    {:else}
      <div class="pixel-demo" aria-hidden="true">
        {#each Array(16) as _, index}
          <span
            class:lime={index === 2 || index === 7 || index === 13}
            class:pink={index === 5 || index === 10 || index === 15}
            class:soft={index === 0 || index === 9}
          ></span>
        {/each}
      </div>

      <div class="drop-copy">
        <h2>Drop an image.<br />Watch it sort itself back.</h2>
        <p>
          PNG, JPEG, or WebP. Your image is decoded, shuffled, and sorted in this tab — it never
          leaves the browser.
        </p>
      </div>

      <div class="drop-actions">
        <span class="fake-button">
          <Icon name="upload" size={17} />
          {app.isLoadingImage ? 'Decoding image…' : 'Choose image'}
        </span>
        <span class="drop-meta mono">MAX 20 MP / 40 MB</span>
      </div>
    {/if}
  </div>

  {#if !compact}
    <div class="sample-row">
      <button
        class="btn btn-ghost btn-small"
        type="button"
        onclick={() => void app.loadSample()}
        disabled={app.isLoadingImage}
      >
        <Icon name="sparkles" size={15} />
        Try a sample
      </button>
      <span class="sample-note">A locally generated Electric Pop poster.</span>
    </div>
  {/if}

  {#if showError && app.uploadError}
    <div class="alert upload-error" role="alert">
      <Icon name="alert" size={16} />
      <span>{app.uploadError}</span>
      <button
        class="dismiss"
        type="button"
        aria-label="Dismiss upload error"
        onclick={() => app.dismissUploadError()}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  {/if}
</div>

<style>
  .uploader {
    display: grid;
    gap: 10px;
  }

  .dropzone {
    position: relative;
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 22px;
    min-height: 390px;
    padding: 34px;
    border: 1px dashed rgba(198, 255, 0, 0.42);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(198, 255, 0, 0.035), transparent 45%), var(--ink);
    cursor: pointer;
    transition:
      border-color 180ms ease,
      background 180ms ease,
      transform 180ms ease;
  }

  .dropzone:hover,
  .dropzone.dragging {
    border-color: var(--lime);
    background: linear-gradient(135deg, rgba(198, 255, 0, 0.08), transparent 55%), var(--ink);
  }

  .dropzone.dragging {
    transform: scale(0.995);
  }

  .dropzone.loading {
    cursor: progress;
  }

  .pixel-demo {
    display: grid;
    grid-template-columns: repeat(4, 18px);
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--line-strong);
    border-radius: 6px;
    background: var(--ink-2);
  }

  .pixel-demo span {
    width: 18px;
    height: 18px;
    border-radius: 2px;
    background: var(--ink-4);
  }

  .pixel-demo span.lime {
    background: var(--lime);
  }

  .pixel-demo span.pink {
    background: var(--pink);
  }

  .pixel-demo span.soft {
    background: var(--soft-lime);
  }

  .drop-copy {
    display: grid;
    gap: 12px;
    max-width: 560px;
  }

  .drop-copy h2 {
    font-size: clamp(28px, 3.2vw, 42px);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 0.98;
    text-wrap: balance;
  }

  .drop-copy p {
    max-width: 48ch;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.55;
  }

  .drop-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .fake-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 16px;
    border: 1px solid var(--lime);
    border-radius: 9px;
    background: var(--lime);
    color: var(--ink);
    font-size: 13px;
    font-weight: 750;
    box-shadow: 3px 3px 0 var(--pink);
  }

  .drop-meta {
    color: var(--muted-2);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .sample-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .sample-note {
    color: var(--muted-2);
    font-size: 11px;
  }

  .upload-error {
    align-items: center;
  }

  .upload-error span {
    flex: 1;
  }

  .dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
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

  .compact .dropzone {
    min-height: 0;
    padding: 10px 12px;
    border-style: solid;
    border-color: var(--line-strong);
    background: var(--ink-3);
  }

  .compact .dropzone:hover {
    border-color: var(--soft-lime);
  }

  .compact-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .compact-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 6px;
    background: rgba(198, 255, 0, 0.1);
    color: var(--lime);
  }

  .compact-copy {
    display: grid;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }

  .compact-copy strong {
    font-size: 12px;
    font-weight: 700;
  }

  .compact-copy span {
    color: var(--muted);
    font-size: 10px;
  }

  .compact-row > :global(svg:last-child) {
    color: var(--muted);
  }

  @media (max-width: 700px) {
    .dropzone {
      min-height: 320px;
      padding: 24px;
    }

    .drop-copy h2 {
      font-size: 30px;
    }
  }
</style>
