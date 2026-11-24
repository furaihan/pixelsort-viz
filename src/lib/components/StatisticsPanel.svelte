<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { formatNumber, formatTime } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';
  import type { TranslationKey } from '../i18n/messages';

  const rowLabel = 'stats-row-label py-[5px] pr-3 text-left align-middle';
  const rowValue = 'mono py-[5px] text-right align-middle text-[20px]';
  const rowLine = 'border-b border-rule/60';
  const totalLabel =
    'stats-row-label border-t border-rule-strong px-2.5 py-[7px] pr-3 text-left align-middle text-text';
  const totalValue =
    'mono border-t border-rule-strong px-2.5 py-[7px] text-right align-middle text-[20px] font-bold';

  let compactLayout = $state(false);
  let hasRunData = $derived(
    app.currentEvent !== null ||
      app.isRunning ||
      app.isPaused ||
      app.isComplete ||
      app.status === 'error',
  );
  let resultTone = $derived(
    app.isRunning || app.isComplete ? 'text-focal' : hasRunData ? 'text-text' : 'text-muted-2',
  );

  function statValue(value: number): string {
    return hasRunData ? formatNumber(value) : '—';
  }

  onMount(() => {
    const compactQuery = window.matchMedia('(max-width: 700px)');
    const updateCompactLayout = () => (compactLayout = compactQuery.matches);
    updateCompactLayout();
    compactQuery.addEventListener('change', updateCompactLayout);
    return () => compactQuery.removeEventListener('change', updateCompactLayout);
  });

  const definitions: [TranslationKey, TranslationKey][] = [
    ['stats.comparisons', 'stats.definitionComparisons'],
    ['stats.swaps', 'stats.definitionSwaps'],
    ['stats.writes', 'stats.definitionWrites'],
    ['stats.reads', 'stats.definitionReads'],
    ['stats.totalOps', 'stats.definitionTotalOps'],
    ['stats.activeCompute', 'stats.definitionActiveCompute'],
    ['stats.auxWrites', 'stats.definitionAuxWrites'],
    ['stats.passes', 'stats.definitionPasses'],
    ['stats.maxDepth', 'stats.definitionMaxDepth'],
  ];
</script>

<section class="panel" aria-labelledby="stats-title">
  <div class="panel-head">
    <h2 class="panel-title" id="stats-title">
      {i18n.t('stats.tableTitle')}
      {#if app.runNumber > 0}
        <small class="mono text-[11px] font-bold tracking-[0.1em] text-muted-2">
          {i18n.t('workspace.runStamp', { n: String(app.runNumber).padStart(3, '0') })}
        </small>
      {/if}
    </h2>
    <span class="mono text-[12px] font-bold text-muted">
      {#if hasRunData}
        {formatNumber(app.totalOps)}
        <span class="text-[11px] font-normal">{i18n.t('stats.operationsUnit')}</span>
      {:else}
        —
      {/if}
    </span>
  </div>

  <details class="group" open={!compactLayout}>
    <summary
      class="hidden min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-b border-rule px-4 py-3 text-[12px] font-semibold text-muted compact:flex [&::-webkit-details-marker]:hidden"
    >
      <span>{i18n.t('stats.breakdown')}</span>
      <Icon
        name="chevron-down"
        size={15}
        className="text-structure transition-transform group-open:rotate-180"
      />
    </summary>
    <div class="panel-body">
      <table class="w-full border-collapse">
        <caption class="sr-only">{i18n.t('stats.title')}</caption>
        <tbody>
          <tr class={rowLine}>
            <th class={rowLabel} scope="row">{i18n.t('stats.comparisons')}</th>
            <td class="{rowValue} {hasRunData ? 'text-text' : 'text-muted-2'}">
              {statValue(app.counters.comparisons)}
            </td>
          </tr>
          <tr class={rowLine}>
            <th class={rowLabel} scope="row">{i18n.t('stats.swaps')}</th>
            <td class="{rowValue} {hasRunData ? 'text-text' : 'text-muted-2'}">
              {statValue(app.counters.swaps)}
            </td>
          </tr>
          <tr class={rowLine}>
            <th class={rowLabel} scope="row">{i18n.t('stats.writes')}</th>
            <td class="{rowValue} {hasRunData ? 'text-text' : 'text-muted-2'}">
              {statValue(app.counters.writes)}
            </td>
          </tr>
          <tr class={rowLine}>
            <th class={rowLabel} scope="row">{i18n.t('stats.reads')}</th>
            <td class="{rowValue} {hasRunData ? 'text-text' : 'text-muted-2'}">
              {statValue(app.counters.reads)}
            </td>
          </tr>
          <tr class="bg-inset/50">
            <th class={totalLabel} scope="row">{i18n.t('stats.totalOps')}</th>
            <td class="{totalValue} {resultTone}">
              {statValue(app.totalOps)}
            </td>
          </tr>
          <tr>
            <th class={rowLabel} scope="row">{i18n.t('stats.activeCompute')}</th>
            <td class="{rowValue} {resultTone}">
              {hasRunData ? formatTime(app.activeMs) : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-2.5 grid grid-cols-3 gap-2.5 border-t border-rule pt-2.5 tight:grid-cols-2">
        <div class="min-w-0">
          <span class="label">{i18n.t('stats.auxWrites')}</span>
          <strong
            class="mt-1 block mono text-data-sm {app.counters.auxWrites > 0
              ? 'text-text'
              : 'text-muted-2'}"
          >
            {app.counters.auxWrites > 0 ? formatNumber(app.counters.auxWrites) : '—'}
          </strong>
        </div>
        <div class="min-w-0">
          <span class="label">{i18n.t('stats.passes')}</span>
          <strong
            class="mt-1 block mono text-data-sm {app.counters.passes > 0
              ? 'text-text'
              : 'text-muted-2'}"
          >
            {app.counters.passes > 0 ? formatNumber(app.counters.passes) : '—'}
          </strong>
        </div>
        <div class="min-w-0">
          <span class="label">{i18n.t('stats.maxDepth')}</span>
          <strong
            class="mt-1 block mono text-data-sm {app.counters.maxDepth > 0
              ? 'text-text'
              : 'text-muted-2'}"
          >
            {app.counters.maxDepth > 0 ? formatNumber(app.counters.maxDepth) : '—'}
          </strong>
        </div>
      </div>

      <p class="mt-2.5 mono text-[11px] font-bold tracking-[0.08em] text-muted-2">
        {i18n.t('stats.totalFormula')}
      </p>

      <details class="group mt-2.5 border-t border-rule">
        <summary
          class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-2 text-[12px] font-semibold text-muted [&_svg]:text-structure [&::-webkit-details-marker]:hidden"
        >
          <span class="inline-flex items-center gap-1.5">
            <Icon name="info" size={13} />
            {i18n.t('stats.howCounters')}
          </span>
          <span class="inline-flex transition-transform duration-[160ms] group-open:rotate-180">
            <Icon name="chevron-down" size={14} />
          </span>
        </summary>
        <dl class="mt-3 grid gap-2">
          {#each definitions as [term, definition]}
            <div class="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
              <dt class="mono text-[11px] font-bold tracking-[0.04em] text-muted">
                {i18n.t(term)}
              </dt>
              <dd class="text-[11px] leading-[1.45] text-muted">{i18n.t(definition)}</dd>
            </div>
          {/each}
        </dl>
      </details>
    </div>
  </details>
</section>
