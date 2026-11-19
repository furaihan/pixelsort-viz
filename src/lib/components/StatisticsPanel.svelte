<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { formatNumber, formatTime } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';

  const metricCell = 'grid gap-[3px] bg-ink-3 px-[11px] py-2.5';
  const metricValue = 'mono text-data';
</script>

<section class="panel" aria-labelledby="stats-title">
  <div class="panel-head">
    <h2 class="panel-title" id="stats-title">
      <Icon name="clock" size={15} />
      {i18n.t('stats.title')}
    </h2>
    {#if app.isRunning}
      <span class="chip gap-[5px] chip-lime">
        <span class="size-[5px] animate-pulse-soft rounded-full bg-lime" aria-hidden="true"></span>
        {i18n.t('stats.live')}
      </span>
    {:else}
      <span class="chip">{i18n.statusLabel(app.status)}</span>
    {/if}
  </div>

  <div class="panel-body">
    <div class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
      <div class={metricCell}>
        <span class="label">{i18n.t('stats.comparisons')}</span>
        <strong class="{metricValue} text-muted">{formatNumber(app.counters.comparisons)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">{i18n.t('stats.swaps')}</span>
        <strong class="{metricValue} text-muted">{formatNumber(app.counters.swaps)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">{i18n.t('stats.writes')}</span>
        <strong class="{metricValue} text-muted">{formatNumber(app.counters.writes)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">{i18n.t('stats.reads')}</span>
        <strong class="{metricValue} text-muted">{formatNumber(app.counters.reads)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">{i18n.t('stats.totalOps')}</span>
        <strong class="{metricValue} {app.isRunning || app.isComplete ? 'text-lime' : 'text-text'}">
          {formatNumber(app.totalOps)}
        </strong>
      </div>
      <div class={metricCell}>
        <span class="label">{i18n.t('stats.activeCompute')}</span>
        <strong class="{metricValue} {app.isRunning || app.isComplete ? 'text-lime' : 'text-text'}">
          {formatTime(app.activeMs)}
        </strong>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2.5 border-t border-line pt-[11px]">
      <div>
        <span class="label">{i18n.t('stats.auxWrites')}</span>
        <strong class="mt-[3px] block mono text-[12px] font-semibold text-text">
          {app.counters.auxWrites > 0 ? formatNumber(app.counters.auxWrites) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">{i18n.t('stats.passes')}</span>
        <strong class="mt-[3px] block mono text-[12px] font-semibold text-text">
          {app.counters.passes > 0 ? formatNumber(app.counters.passes) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">{i18n.t('stats.maxDepth')}</span>
        <strong class="mt-[3px] block mono text-[12px] font-semibold text-text">
          {app.counters.maxDepth > 0 ? formatNumber(app.counters.maxDepth) : '—'}
        </strong>
      </div>
    </div>

    <p class="mt-3 mono text-[8px] font-bold tracking-[0.08em] text-muted-2">
      {i18n.t('stats.totalFormula')}
    </p>

    <details class="group mt-2.5 border-t border-line">
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-2 px-0 pt-2.5 pb-0 text-[11px] font-[650] text-muted [&_svg]:text-bubblegum [&::-webkit-details-marker]:hidden"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon name="info" size={13} />
          {i18n.t('stats.howCounters')}
        </span>
        <span class="inline-flex transition-transform duration-[160ms] group-open:rotate-180">
          <Icon name="chevron-down" size={14} />
        </span>
      </summary>
      <dl class="mt-2.5 grid gap-2">
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.comparisons')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionComparisons')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.swaps')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionSwaps')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.writes')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionWrites')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.reads')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionReads')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.totalOps')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionTotalOps')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.activeCompute')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionActiveCompute')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.auxWrites')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionAuxWrites')}
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-muted">
            {i18n.t('stats.passes')} / {i18n.t('stats.maxDepth')}
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            {i18n.t('stats.definitionPasses')}
          </dd>
        </div>
      </dl>
    </details>
  </div>
</section>
