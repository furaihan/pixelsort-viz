<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { formatNumber, formatTime } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';
  import type { TranslationKey } from '../i18n/messages';

  const rowLabel =
    'mono py-[5px] pr-3 text-left align-middle text-[11px] font-bold uppercase tracking-[0.12em] text-muted';
  const rowValue = 'mono py-[5px] text-right align-middle text-[20px]';
  const rowLine = 'border-b border-rule/60';

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
    {#if app.isRunning}
      <span class="chip chip-focal">
        <span class="size-[5px] animate-pulse-soft rounded-full bg-focal" aria-hidden="true"></span>
        {i18n.t('stats.live')}
      </span>
    {:else}
      <span class="chip">{i18n.statusLabel(app.status)}</span>
    {/if}
  </div>

  <div class="panel-body">
    <table class="w-full border-collapse">
      <caption class="sr-only">{i18n.t('stats.title')}</caption>
      <tbody>
        <tr class={rowLine}>
          <th class={rowLabel} scope="row">{i18n.t('stats.comparisons')}</th>
          <td class="{rowValue} text-text">{formatNumber(app.counters.comparisons)}</td>
        </tr>
        <tr class={rowLine}>
          <th class={rowLabel} scope="row">{i18n.t('stats.swaps')}</th>
          <td class="{rowValue} text-text">{formatNumber(app.counters.swaps)}</td>
        </tr>
        <tr class={rowLine}>
          <th class={rowLabel} scope="row">{i18n.t('stats.writes')}</th>
          <td class="{rowValue} text-text">{formatNumber(app.counters.writes)}</td>
        </tr>
        <tr class={rowLine}>
          <th class={rowLabel} scope="row">{i18n.t('stats.reads')}</th>
          <td class="{rowValue} text-text">{formatNumber(app.counters.reads)}</td>
        </tr>
        <tr class={rowLine}>
          <th class={rowLabel} scope="row">{i18n.t('stats.totalOps')}</th>
          <td class="{rowValue} {app.isRunning || app.isComplete ? 'text-focal' : 'text-text'}">
            {formatNumber(app.totalOps)}
          </td>
        </tr>
        <tr>
          <th class={rowLabel} scope="row">{i18n.t('stats.activeCompute')}</th>
          <td class="{rowValue} {app.isRunning || app.isComplete ? 'text-focal' : 'text-text'}">
            {formatTime(app.activeMs)}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="mt-2.5 grid grid-cols-3 gap-2.5 border-t border-rule pt-2.5">
      <div>
        <span class="label">{i18n.t('stats.auxWrites')}</span>
        <strong class="mt-1 block mono text-data-sm text-text">
          {app.counters.auxWrites > 0 ? formatNumber(app.counters.auxWrites) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">{i18n.t('stats.passes')}</span>
        <strong class="mt-1 block mono text-data-sm text-text">
          {app.counters.passes > 0 ? formatNumber(app.counters.passes) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">{i18n.t('stats.maxDepth')}</span>
        <strong class="mt-1 block mono text-data-sm text-text">
          {app.counters.maxDepth > 0 ? formatNumber(app.counters.maxDepth) : '—'}
        </strong>
      </div>
    </div>

    <p class="mt-2.5 mono text-[11px] font-bold tracking-[0.08em] text-muted-2">
      {i18n.t('stats.totalFormula')}
    </p>

    <details class="group mt-2.5 border-t border-rule">
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-2 pt-2.5 text-[12px] font-semibold text-muted [&_svg]:text-structure [&::-webkit-details-marker]:hidden"
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
</section>
