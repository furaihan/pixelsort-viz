<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import ImageIcon from '@lucide/svelte/icons/image';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import X from '@lucide/svelte/icons/x';
  import { PRESET_IMAGES } from '../core/image/presets';
  import { app } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';
  import { trapFocus, focusFirst } from '../utils/trapFocus';
  import { untrack } from 'svelte';

  let { compact = false }: { compact?: boolean } = $props();

  // The gallery lives in a modal in both variants: the empty specimen plate
  // shows only a trigger button, which keeps the inline page compact.
  const uid = $props.id();
  let dialog = $state<HTMLDialogElement | null>(null);
  let open = $state(false);
  let pendingPreset = $state<string | null>(null);
  let lastTrigger = $state<HTMLButtonElement | null>(null);

  const titleId = `${uid}-title`;
  const introId = `${uid}-intro`;
  const replaceTitleId = `${uid}-replace-title`;
  const replaceIntroId = `${uid}-replace-intro`;

  function isCurrent(fileName: string): boolean {
    return app.imageInfo?.fileName === fileName;
  }

  function browse(currentTarget: EventTarget & HTMLButtonElement): void {
    pendingPreset = null;
    lastTrigger = currentTarget;
    open = true;
  }

  function load(id: string): void {
    if (app.isLoadingImage) return;
    pendingPreset = null;
    open = false;
    void app.loadPreset(id);
  }

  function requestLoad(id: string): void {
    if (app.isLoadingImage) return;
    // Replacing a loaded specimen is destructive: confirm in place rather
    // than silently discarding the current run.
    if (app.hasImage && !app.isLoadingImage) {
      pendingPreset = id;
      return;
    }
    load(id);
  }

  function close(): void {
    pendingPreset = null;
    open = false;
  }

  function handleDialogClick(event: MouseEvent): void {
    if (event.target === dialog) close();
  }

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      focusFirst(dialog);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  $effect(() => {
    const wasOpen = open;
    if (!wasOpen && lastTrigger && lastTrigger.isConnected) {
      lastTrigger.focus({ preventScroll: true });
    }
    // Untrack the trigger: only the open→closed transition should refocus.
    untrack(() => lastTrigger);
  });
</script>

{#snippet tiles(columns: string)}
  <div class="grid gap-2.5 {columns}">
    {#each PRESET_IMAGES as preset (preset.id)}
      {@const current = isCurrent(preset.file)}
      <button
        class="group relative grid gap-1.5 rounded-[6px] border p-1.5 text-left transition-[border-color,background] duration-150 hover:border-rule-strong hover:bg-inset focus-visible:border-accent disabled:cursor-progress disabled:opacity-60 {current
          ? 'border-accent bg-accent/10'
          : 'border-rule bg-panel'}"
        type="button"
        onclick={() => requestLoad(preset.id)}
        disabled={app.isLoadingImage}
        aria-current={current ? 'true' : undefined}
        aria-label={i18n.t('presets.load', { name: i18n.t(preset.nameKey) })}
      >
        <span class="relative block">
          <img
            class="aspect-[4/3] w-full rounded-[3px] object-cover transition-transform duration-200 group-hover:scale-[1.02] group-focus-visible:scale-[1.02]"
            src={preset.thumbUrl}
            alt=""
            width="240"
            height="180"
            loading="lazy"
          />
          <span
            class="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-[3px] bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          ></span>
          {#if current}
            <span
              class="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-[3px] border border-accent/60 bg-ground/90 px-1 py-0.5 mono text-[10px] font-bold tracking-[0.08em] text-accent"
            >
              <Check size={11} aria-hidden="true" focusable="false" />
              {i18n.t('presets.current')}
            </span>
          {/if}
        </span>
        <span class="flex items-center justify-between gap-2 px-0.5">
          <span class="truncate text-[11px] font-semibold text-text">
            {i18n.t(preset.nameKey)}
          </span>
          <span class="mono text-[10px] font-bold tracking-[0.08em] text-muted-2 uppercase">
            {app.isLoadingImage
              ? i18n.t('upload.decoding')
              : current
                ? i18n.t('presets.current')
                : '›'}
          </span>
        </span>
      </button>
    {/each}
  </div>
{/snippet}

{#if compact}
  <button
    class="btn flex min-h-10 cursor-pointer btn-ghost disabled:cursor-progress compact:min-h-11"
    type="button"
    onclick={(event) => browse(event.currentTarget)}
    disabled={app.isLoadingImage}
    aria-haspopup="dialog"
    aria-controls={titleId}
    title={i18n.t('presets.openTitle')}
  >
    <ImageIcon size={15} aria-hidden="true" focusable="false" />
    {i18n.t('presets.open')}
    <ChevronDown size={13} class="text-muted" aria-hidden="true" focusable="false" />
  </button>
{:else}
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-rule bg-inset/40 px-4 py-3"
  >
    <span class="panel-title">
      <ImageIcon size={16} aria-hidden="true" focusable="false" />
      {i18n.t('presets.title')}
    </span>
    <span class="max-w-[44ch] flex-1 text-[11px] leading-[1.4] text-muted">
      {i18n.t('presets.subtitle')}
    </span>
    <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="text-[11px] text-muted">{i18n.t('presets.emptyAction')}</span>
      <button
        class="btn flex min-h-10 cursor-pointer disabled:cursor-progress"
        type="button"
        onclick={(event) => browse(event.currentTarget)}
        disabled={app.isLoadingImage}
        aria-haspopup="dialog"
        aria-controls={titleId}
        title={i18n.t('presets.openTitle')}
      >
        <ImageIcon size={15} aria-hidden="true" focusable="false" />
        {i18n.t('presets.open')}
        <ChevronDown size={13} class="text-muted" aria-hidden="true" focusable="false" />
      </button>
    </span>
  </div>
{/if}

<dialog
  bind:this={dialog}
  {@attach trapFocus}
  class="m-auto max-h-[88vh] w-[min(480px,calc(100vw-28px))] rounded-[12px] border border-rule-strong bg-panel p-0 text-text shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop:bg-black/70 backdrop:backdrop-blur-[4px]"
  aria-labelledby={pendingPreset ? replaceTitleId : titleId}
  aria-describedby={pendingPreset ? replaceIntroId : introId}
  onclose={close}
  onclick={handleDialogClick}
>
  <div class="grid max-h-[88vh] grid-rows-[auto_minmax(0,1fr)]">
    <header
      class="flex items-start justify-between gap-4 border-b border-rule px-4 pt-4 pb-3.5 compact:px-4 compact:pt-4 compact:pb-[13px]"
    >
      <div class="min-w-0">
        <h3 id={pendingPreset ? replaceTitleId : titleId}>
          {#if pendingPreset}
            {@const pending = PRESET_IMAGES.find((preset) => preset.id === pendingPreset)}
            {@const name = pending ? i18n.t(pending.nameKey) : pendingPreset}
            <span class="panel-title">
              <TriangleAlert size={16} aria-hidden="true" focusable="false" />
              {i18n.t('presets.replaceAction')}
            </span>
          {:else}
            <span class="panel-title">
              <ImageIcon size={16} aria-hidden="true" focusable="false" />
              {i18n.t('presets.title')}
            </span>
            <span class="mt-1.5 block max-w-[40ch] text-[11px] leading-[1.4] text-muted">
              {i18n.t('presets.dialogNote')}
            </span>
          {/if}
        </h3>
        {#if pendingPreset}
          {@const pending = PRESET_IMAGES.find((preset) => preset.id === pendingPreset)}
          {@const name = pending ? i18n.t(pending.nameKey) : pendingPreset}
          <p class="mt-1.5 max-w-[48ch] text-[12px] leading-[1.5] text-muted" id={replaceIntroId}>
            {i18n.t('presets.replace', { name })}
          </p>
          <div class="mt-2.5 flex flex-wrap gap-2">
            <button
              class="btn btn-small min-h-10 btn-primary cursor-pointer"
              type="button"
              onclick={() => pendingPreset && load(pendingPreset)}
            >
              <ImageIcon size={15} aria-hidden="true" focusable="false" />
              {i18n.t('presets.replaceAction')}
            </button>
            <button
              class="btn btn-small min-h-10 cursor-pointer"
              type="button"
              onclick={() => (pendingPreset = null)}
            >
              {i18n.t('presets.cancelAction')}
            </button>
          </div>
        {/if}
      </div>
      <button
        class="inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-[6px] border border-rule bg-inset text-muted hover:border-rule-strong hover:text-text"
        type="button"
        aria-label={i18n.t('presets.close')}
        onclick={close}
      >
        <X size={15} aria-hidden="true" focusable="false" />
      </button>
    </header>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="overflow-auto px-4 pt-3.5 pb-4"
      tabindex="0"
      role="region"
      aria-labelledby={pendingPreset ? replaceTitleId : titleId}
    >
      {@render tiles('grid-cols-3 compact:grid-cols-2')}
    </div>
  </div>
</dialog>
