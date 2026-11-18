<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';
  import type { AlgorithmId } from '../core/sorting/types';
  import { i18n } from '../i18n/index.svelte';

  let { onopenGuide }: { onopenGuide: () => void } = $props();

  function propertyLabel(value: boolean | 'depends'): string {
    return i18n.propertyLabel(value);
  }

  function chipTone(value: boolean | 'depends'): string {
    if (value === true) return 'chip-lime';
    if (value === false) return 'chip-pink';
    return '';
  }

  function handleChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    app.setAlgorithm(select.value as AlgorithmId);
  }
</script>

<section class="panel" aria-labelledby="algorithm-title">
  <div class="panel-head">
    <h2 class="panel-title" id="algorithm-title">
      <Icon name="code" size={15} />
      {i18n.t('algorithm.title')}
    </h2>
    <div class="flex flex-wrap items-center justify-end gap-[5px]">
      {#if app.algorithm.metadata.quadratic}
        <span class="chip chip-pink">{i18n.t('algorithm.quadratic')}</span>
      {/if}
      <span class="chip">{i18n.categoryLabel(app.algorithm.metadata.category).toUpperCase()}</span>
    </div>
  </div>

  <div class="panel-body">
    <label
      class="mb-1.5 block font-mono text-[9px] font-bold tracking-[0.1em] text-muted uppercase"
      for="algorithm-select"
    >
      {i18n.t('algorithm.choose')}
    </label>
    <div class="relative">
      <select
        id="algorithm-select"
        value={app.algorithmId}
        onchange={handleChange}
        class="min-h-[42px] w-full cursor-pointer appearance-none rounded-lg border border-line-strong bg-ink-3 py-0 pr-[38px] pl-3 text-[13px] font-[650] text-text hover:border-soft-lime focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
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

    <p class="mt-3 text-[12.5px] leading-[1.55] text-muted">
      {i18n.algorithmDescription(app.algorithmId)}
    </p>

    <dl
      class="mt-3.5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line"
    >
      <div class="bg-ink-3 px-2.5 py-[9px]">
        <dt class="label">{i18n.t('common.best')}</dt>
        <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-soft-lime">
          {i18n.complexity(app.algorithm.metadata.bestTime)}
        </dd>
      </div>
      <div class="bg-ink-3 px-2.5 py-[9px]">
        <dt class="label">{i18n.t('common.average')}</dt>
        <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-soft-lime">
          {i18n.complexity(app.algorithm.metadata.averageTime)}
        </dd>
      </div>
      <div class="bg-ink-3 px-2.5 py-[9px]">
        <dt class="label">{i18n.t('common.worst')}</dt>
        <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-soft-lime">
          {i18n.complexity(app.algorithm.metadata.worstTime)}
        </dd>
      </div>
      <div class="bg-ink-3 px-2.5 py-[9px]">
        <dt class="label">{i18n.t('common.space')}</dt>
        <dd class="mt-[3px] mono text-[10.5px] leading-[1.35] font-semibold text-soft-lime">
          {i18n.complexity(app.algorithm.metadata.spaceComplexity)}
        </dd>
      </div>
    </dl>

    <div class="mt-2.5 flex flex-wrap gap-1.5">
      <span class="chip {chipTone(app.algorithm.metadata.stable)}">
        {i18n.t('algorithm.stable', { value: propertyLabel(app.algorithm.metadata.stable) })}
      </span>
      <span class="chip {chipTone(app.algorithm.metadata.inPlace)}">
        {i18n.t('algorithm.inPlace', { value: propertyLabel(app.algorithm.metadata.inPlace) })}
      </span>
    </div>

    {#if app.algorithm.metadata.notes?.length}
      <ul class="mt-3 mb-0 grid list-none gap-[7px] p-0">
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
      class="mt-[13px] inline-flex cursor-pointer items-center gap-[5px] border-0 bg-transparent p-0 text-[11.5px] font-[650] text-soft-lime hover:text-lime"
      type="button"
      onclick={onopenGuide}
    >
      {i18n.t('algorithm.reference')}
      <Icon name="arrow-right" size={14} />
    </button>
  </div>
</section>
