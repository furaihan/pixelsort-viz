<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';
  import type { AlgorithmId } from '../core/sorting/types';
  import { i18n } from '../i18n/index.svelte';

  let { onopenGuide, inline = false }: { onopenGuide: () => void; inline?: boolean } = $props();

  let infoPopover = $state<HTMLDivElement | null>(null);
  let infoOpen = $state(false);

  function propertyLabel(value: boolean | 'depends'): string {
    return i18n.propertyLabel(value);
  }

  function handleChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    app.setAlgorithm(select.value as AlgorithmId);
  }

  function toggleInfo(event: MouseEvent): void {
    const popover = infoPopover;
    if (!popover) return;
    if (popover.matches(':popover-open')) {
      popover.hidePopover();
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    popover.style.top = `${rect.bottom + 6}px`;
    popover.style.left = `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`;
    popover.showPopover();

    // Flip above the button when the popover would run past the viewport bottom.
    const box = popover.getBoundingClientRect();
    if (box.bottom > window.innerHeight - 8 && rect.top - box.height - 6 >= 8) {
      popover.style.top = `${rect.top - box.height - 6}px`;
    }
  }

  function closeInfo(): void {
    infoPopover?.hidePopover();
  }

  function openReference(): void {
    closeInfo();
    onopenGuide();
  }
</script>

<svelte:element
  this={inline ? 'div' : 'section'}
  class={inline ? 'grid content-start gap-2.5' : 'panel panel-compact'}
  role={inline ? 'group' : undefined}
  aria-labelledby="algorithm-title"
>
  <div class={inline ? 'flex items-center justify-between gap-2' : 'panel-head'}>
    <svelte:element this={inline ? 'h3' : 'h2'} class="panel-title" id="algorithm-title">
      <Icon name="code" size={15} />
      {i18n.t('algorithm.title')}
    </svelte:element>
    <div class="flex flex-wrap items-center justify-end gap-[5px]">
      {#if app.algorithm.metadata.quadratic}
        <span class="chip chip-pink">{i18n.t('algorithm.quadratic')}</span>
      {/if}
      <span class="chip">{i18n.categoryLabel(app.algorithm.metadata.category).toUpperCase()}</span>
    </div>
  </div>

  <div class={inline ? 'grid' : 'panel-body'}>
    <label
      class="mb-1.5 block font-mono text-[9px] font-bold tracking-[0.1em] text-muted uppercase"
      for="algorithm-select"
    >
      {i18n.t('algorithm.choose')}
    </label>

    <div class="flex items-start gap-2">
      <div class="relative min-w-0 flex-1">
        <select
          id="algorithm-select"
          value={app.algorithmId}
          onchange={handleChange}
          class="min-h-[40px] w-full cursor-pointer appearance-none rounded-lg border border-line-strong bg-ink-3 py-0 pr-[36px] pl-3 text-[13px] font-[650] text-text hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          {#each ALGORITHM_GROUPS as group}
            <optgroup label={i18n.categoryLabel(group.category)}>
              {#each group.algorithms as algorithm}
                <option value={algorithm.metadata.id}>
                  {i18n.algorithmName(algorithm.metadata.id)}
                </option>
              {/each}
            </optgroup>
          {/each}
        </select>
        <span
          class="pointer-events-none absolute top-1/2 right-3 inline-flex -translate-y-1/2 text-muted"
        >
          <Icon name="chevron-down" size={16} />
        </span>
      </div>

      <button
        class="inline-flex size-[40px] flex-none cursor-pointer items-center justify-center rounded-[9px] border border-line-strong bg-ink-3 text-bubblegum transition-colors hover:border-line hover:text-text"
        type="button"
        aria-label={i18n.t('algorithm.about')}
        aria-expanded={infoOpen}
        onclick={toggleInfo}
      >
        <Icon name="help" size={18} />
      </button>
    </div>

    <div
      bind:this={infoPopover}
      popover="auto"
      class="right-auto bottom-auto m-0 max-h-[min(70vh,540px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-[12px] border border-line-strong bg-ink-2 p-0 text-text shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
      aria-label={i18n.t('algorithm.about')}
      ontoggle={(event) => (infoOpen = event.newState === 'open')}
    >
      <div class="flex items-start justify-between gap-3 border-b border-line px-3.5 py-3">
        <div class="grid min-w-0 gap-0.5">
          <strong class="text-[13px] font-extrabold tracking-[-0.02em]">
            {i18n.algorithmName(app.algorithmId)}
          </strong>
          <span class="mono text-[9px] font-bold tracking-[0.1em] text-muted uppercase">
            {i18n.categoryLabel(app.algorithm.metadata.category)}
          </span>
        </div>
        <button
          class="inline-flex size-[24px] flex-none cursor-pointer items-center justify-center rounded-[6px] border border-line-strong bg-ink-3 text-muted hover:border-line hover:text-text"
          type="button"
          aria-label={i18n.t('common.dismiss')}
          onclick={closeInfo}
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div class="grid gap-3 p-3.5">
        <p class="text-[11.5px] leading-[1.5] text-muted">
          {i18n.algorithmDescription(app.algorithmId)}
        </p>

        <dl class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
          <div class="bg-ink-3 px-2.5 py-[9px]">
            <dt class="label">{i18n.t('common.best')}</dt>
            <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-text">
              {i18n.complexity(app.algorithm.metadata.bestTime)}
            </dd>
          </div>
          <div class="bg-ink-3 px-2.5 py-[9px]">
            <dt class="label">{i18n.t('common.average')}</dt>
            <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-text">
              {i18n.complexity(app.algorithm.metadata.averageTime)}
            </dd>
          </div>
          <div class="bg-ink-3 px-2.5 py-[9px]">
            <dt class="label">{i18n.t('common.worst')}</dt>
            <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-text">
              {i18n.complexity(app.algorithm.metadata.worstTime)}
            </dd>
          </div>
          <div class="bg-ink-3 px-2.5 py-[9px]">
            <dt class="label">{i18n.t('common.space')}</dt>
            <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-text">
              {i18n.complexity(app.algorithm.metadata.spaceComplexity)}
            </dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-1.5">
          <span class="chip">
            {i18n.t('algorithm.stable', { value: propertyLabel(app.algorithm.metadata.stable) })}
          </span>
          <span class="chip">
            {i18n.t('algorithm.inPlace', { value: propertyLabel(app.algorithm.metadata.inPlace) })}
          </span>
        </div>

        {#if app.algorithm.metadata.notes?.length}
          <ul class="m-0 grid list-none gap-[7px] p-0">
            {#each i18n.algorithmNotes(app.algorithmId) as note}
              <li
                class="flex items-start gap-[7px] text-[11.5px] leading-[1.45] text-muted [&_svg]:mt-px [&_svg]:flex-none [&_svg]:text-bubblegum"
              >
                <Icon name="info" size={13} />
                <span>{note}</span>
              </li>
            {/each}
          </ul>
        {/if}

        <button
          class="inline-flex cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0 text-[11.5px] font-[650] text-lime hover:text-text"
          type="button"
          onclick={openReference}
        >
          {i18n.t('algorithm.reference')}
          <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  </div>
</svelte:element>
