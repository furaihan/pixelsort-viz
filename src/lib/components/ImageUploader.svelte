<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';

  let { compact = false, showError = true }: { compact?: boolean; showError?: boolean } = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let dragging = $state(false);

  const dropzoneShell =
    'relative grid cursor-pointer content-center justify-items-start gap-[22px] rounded-xl transition-[border-color,background,transform] duration-[180ms]';
  const dropzoneFullIdle =
    'min-h-[390px] border border-dashed border-lime/42 p-[34px] bg-[linear-gradient(135deg,rgba(198,255,0,0.035),transparent_45%),var(--ink)] hover:border-lime hover:bg-[linear-gradient(135deg,rgba(198,255,0,0.08),transparent_55%),var(--ink)] compact:min-h-[320px] compact:p-6';
  const dropzoneFullDragging =
    'min-h-[390px] border border-dashed border-lime p-[34px] bg-[linear-gradient(135deg,rgba(198,255,0,0.08),transparent_55%),var(--ink)] compact:min-h-[320px] compact:p-6';
  const dropzoneCompact =
    'min-h-0 border border-solid border-line-strong bg-ink-3 px-3 py-2.5 hover:border-soft-lime';

  let dropzoneClass = $derived(
    [
      dropzoneShell,
      compact ? dropzoneCompact : dragging ? dropzoneFullDragging : dropzoneFullIdle,
      dragging ? 'scale-[0.995]' : '',
      app.isLoadingImage ? 'cursor-progress' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

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

<div class="grid gap-2.5">
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
    class={dropzoneClass}
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
      <div class="flex w-full items-center gap-2.5 [&>svg:last-child]:text-muted">
        <span
          class="inline-flex size-[30px] flex-none items-center justify-center rounded-[6px] bg-lime/10 text-lime"
        >
          <Icon name="upload" size={16} />
        </span>
        <span class="grid min-w-0 flex-1 gap-px">
          <strong class="text-[12px] font-bold">
            {app.isLoadingImage
              ? 'Decoding image…'
              : app.hasImage
                ? 'Replace image'
                : 'Choose image'}
          </strong>
          <span class="text-[10px] text-muted">PNG, JPEG, or WebP · stays local</span>
        </span>
        <Icon name="arrow-right" size={16} />
      </div>
    {:else}
      <div
        class="grid grid-cols-[repeat(4,18px)] gap-1 rounded-[6px] border border-line-strong bg-ink-2 p-2"
        aria-hidden="true"
      >
        {#each Array(16) as _, index}
          <span
            class="size-[18px] rounded-[2px] {index === 2 || index === 7 || index === 13
              ? 'bg-lime'
              : index === 5 || index === 10 || index === 15
                ? 'bg-pink'
                : index === 0 || index === 9
                  ? 'bg-soft-lime'
                  : 'bg-ink-4'}"
          ></span>
        {/each}
      </div>

      <div class="grid max-w-[560px] gap-3">
        <h2 class="text-display text-balance compact:text-[30px]">
          Drop an image.<br />Watch it sort itself back.
        </h2>
        <p class="max-w-[48ch] text-[14px] leading-[1.55] text-muted">
          PNG, JPEG, or WebP. Your image is decoded, shuffled, and sorted in this tab — it never
          leaves the browser.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3.5">
        <span
          class="inline-flex min-h-[42px] items-center gap-2 rounded-[9px] border border-lime bg-lime px-4 text-[13px] font-[750] text-ink shadow-[3px_3px_0_var(--pink)]"
        >
          <Icon name="upload" size={17} />
          {app.isLoadingImage ? 'Decoding image…' : 'Choose image'}
        </span>
        <span class="mono text-[9px] font-bold tracking-[0.1em] text-muted-2">
          MAX 20 MP / 40 MB
        </span>
      </div>
    {/if}
  </div>

  {#if !compact}
    <div class="flex flex-wrap items-center gap-2.5">
      <button
        class="btn btn-small btn-ghost"
        type="button"
        onclick={() => void app.loadSample()}
        disabled={app.isLoadingImage}
      >
        <Icon name="sparkles" size={15} />
        Try a sample
      </button>
      <span class="text-[11px] text-muted-2">A locally generated Electric Pop poster.</span>
    </div>
  {/if}

  {#if showError && app.uploadError}
    <div class="alert items-center [&>span]:flex-1" role="alert">
      <Icon name="alert" size={16} />
      <span>{app.uploadError}</span>
      <button
        class="inline-flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-inherit hover:bg-white/8"
        type="button"
        aria-label="Dismiss upload error"
        onclick={() => app.dismissUploadError()}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  {/if}
</div>
