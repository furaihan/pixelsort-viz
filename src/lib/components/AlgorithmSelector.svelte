<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';
  import type { AlgorithmId } from '../core/sorting/types';
  import { i18n } from '../i18n/index.svelte';
  import type { TranslationKey } from '../i18n/messages';

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
  class={inline ? 'grid content-start gap-2.5' : 'panel'}
  role={inline ? 'group' : undefined}
  aria-labelledby="algorithm-title"
>
  <div class={inline ? 'flex items-center justify-between gap-2' : 'panel-head'}>
    <svelte:element
      this={inline ? 'h3' : 'h2'}
      class={inline ? 'label' : 'panel-title'}
      id="algorithm-title"
    >
      {#if !inline}<Icon name="code" size={16} />{/if}
      {i18n.t('conditions.method')}
    </svelte:element>
    <div class="flex flex-wrap items-center justify-end gap-[5px]">
      {#if app.algorithm.metadata.quadratic}
        <span class="chip chip-focal">{i18n.t('algorithm.quadratic')}</span>
      {/if}
      <span class="chip">{i18n.categoryLabel(app.algorithm.metadata.category).toUpperCase()}</span>
    </div>
  </div>

  <div class={inline ? 'grid' : 'panel-body'}>
    <div class="flex items-start gap-2">
      <div class="relative min-w-0 flex-1">
        <label class="sr-only" for="algorithm-select">{i18n.t('algorithm.choose')}</label>
        <select id="algorithm-select" value={app.algorithmId} onchange={handleChange} class="field">
          {#each ALGORITHM_GROUPS as group}
            <optgroup label={i18n.categoryLabel(group.category)}>
              {#each group.algorithms as algorithm}
                <option value={algorithm.metadata.id}>
                  {i18n.algorithmName(algorithm.metadata.id)}{algorithm.metadata.id === 'insertion'
                    ? ` — ${i18n.t('algorithm.recommended')}`
                    : ''}
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
        class="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-[6px] border border-rule-strong bg-inset text-structure transition-colors hover:border-accent hover:text-text"
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
      class="right-auto bottom-auto m-0 max-h-[min(70vh,540px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-[12px] border border-rule-strong bg-panel p-0 text-text shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
      aria-label={i18n.t('algorithm.about')}
      ontoggle={(event) => (infoOpen = event.newState === 'open')}
    >
      <div class="flex items-start justify-between gap-3 border-b border-rule px-3.5 py-3">
        <div class="grid min-w-0 gap-0.5">
          <strong class="text-[14px] font-bold tracking-[-0.02em]">
            {i18n.algorithmName(app.algorithmId)}
          </strong>
          <span class="mono text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
            {i18n.categoryLabel(app.algorithm.metadata.category)}
          </span>
        </div>
        <button
          class="inline-flex size-[24px] flex-none cursor-pointer items-center justify-center rounded-[6px] border border-rule bg-inset text-muted hover:border-rule-strong hover:text-text"
          type="button"
          aria-label={i18n.t('common.dismiss')}
          onclick={closeInfo}
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      <div class="grid gap-3 p-3.5">
        <p class="text-[12px] leading-[1.5] text-muted">
          {i18n.algorithmDescription(app.algorithmId)}
        </p>

        <dl
          class="grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-rule bg-rule"
        >
          {#each [['common.best', app.algorithm.metadata.bestTime], ['common.average', app.algorithm.metadata.averageTime], ['common.worst', app.algorithm.metadata.worstTime], ['common.space', app.algorithm.metadata.spaceComplexity]] as [label, value]}
            <div class="bg-inset px-2.5 py-[9px]">
              <dt class="label">{i18n.t(label as TranslationKey)}</dt>
              <dd class="mt-1 mono text-[11px] leading-[1.35] font-semibold text-text">
                {i18n.complexity(value)}
              </dd>
            </div>
          {/each}
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
                class="flex items-start gap-[7px] text-[12px] leading-[1.45] text-muted [&_svg]:mt-px [&_svg]:flex-none [&_svg]:text-structure"
              >
                <Icon name="info" size={13} />
                <span>{note}</span>
              </li>
            {/each}
          </ul>
        {/if}

        <button
          class="inline-flex cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0 text-[12px] font-semibold text-accent hover:text-text"
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
