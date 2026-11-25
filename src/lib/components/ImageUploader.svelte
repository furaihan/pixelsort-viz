<script lang="ts">
  import Upload from '@lucide/svelte/icons/upload';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import X from '@lucide/svelte/icons/x';
  import { app } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';

  let { compact = false, showError = true }: { compact?: boolean; showError?: boolean } = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let dragging = $state(false);

  const dropzoneShell =
    'relative grid cursor-pointer content-center justify-items-start gap-3 rounded-[12px] transition-[border-color,background,transform] duration-[180ms]';
  const dropzoneFullIdle =
    'min-h-[126px] border border-dashed border-rule-strong p-4 bg-inset/40 hover:border-accent hover:bg-accent/[0.06]';
  const dropzoneFullDragging =
    'min-h-[126px] border border-dashed border-accent p-4 bg-accent/[0.1]';
  const dropzoneCompact =
    'min-h-11 border border-solid border-rule bg-inset px-3 py-2.5 hover:border-rule-strong';

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

  function loadStarterRun(): void {
    app.setBlockSize(64);
    app.setAlgorithm('insertion');
    app.setMode('educational');
    void app.loadSample();
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
    const zone = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    // Moving onto a child still fires dragleave; keep the highlight until we truly exit.
    if (next && zone.contains(next)) return;
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
    aria-label={i18n.t('upload.aria')}
    onclick={openPicker}
    onkeydown={handleKeydown}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if compact}
      <div class="flex w-full items-center gap-2.5 [&>svg:last-child]:text-muted">
        <span
          class="inline-flex size-[30px] flex-none items-center justify-center rounded-[6px] bg-accent/10 text-accent"
        >
          <Upload size={16} aria-hidden="true" focusable="false" />
        </span>
        <span class="grid min-w-0 flex-1 gap-px">
          <strong class="text-[12px] font-bold">
            {app.isLoadingImage
              ? i18n.t('upload.decoding')
              : app.hasImage
                ? i18n.t('upload.replace')
                : i18n.t('upload.choose')}
          </strong>
          <span class="text-[11px] text-muted">{i18n.t('upload.formatsLocal')}</span>
        </span>
        <ArrowRight size={16} aria-hidden="true" focusable="false" />
      </div>
    {:else}
      <div class="flex flex-wrap items-center gap-3">
        <span
          class="inline-flex min-h-[38px] items-center gap-2 rounded-[6px] border border-focal bg-focal px-3.5 text-[12.5px] font-bold text-ground"
        >
          <Upload size={16} aria-hidden="true" focusable="false" />
          {app.isLoadingImage ? i18n.t('upload.decoding') : i18n.t('upload.choose')}
        </span>
        <span class="text-[12.5px] font-semibold text-text">
          {i18n.t('upload.dropPrompt')}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span class="text-[11px] text-muted">{i18n.t('upload.formatsLocal')}</span>
        <span class="mono text-[9px] font-bold tracking-[0.1em] text-muted">
          {i18n.t('upload.limit')}
        </span>
      </div>
    {/if}
  </div>

  {#if !compact}
    <div class="flex flex-wrap items-center gap-2.5">
      <button
        class="btn btn-small btn-ghost compact:min-h-11"
        id="load-sample"
        type="button"
        onclick={loadStarterRun}
        disabled={app.isLoadingImage}
      >
        <Sparkles size={15} aria-hidden="true" focusable="false" />
        {i18n.t('upload.trySample')}
      </button>
      <span class="max-w-[42ch] text-[11px] leading-[1.4] text-muted">
        {i18n.t('upload.sampleDescription')}
      </span>
    </div>
  {/if}

  {#if showError && app.uploadError}
    <div class="alert items-center [&>span]:flex-1" role="alert">
      <TriangleAlert size={16} aria-hidden="true" focusable="false" />
      <span>{i18n.text(app.uploadError)}</span>
      <button
        class="inline-flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-inherit hover:bg-text/10"
        type="button"
        aria-label={i18n.t('upload.dismissError')}
        onclick={() => app.dismissUploadError()}
      >
        <X size={14} aria-hidden="true" focusable="false" />
      </button>
    </div>
  {/if}
</div>
