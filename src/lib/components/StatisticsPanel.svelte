<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { formatNumber, formatTime } from '../utils/format';

  const metricCell = 'grid gap-[3px] bg-ink-3 px-[11px] py-2.5';
  const metricValue = 'mono text-data';
</script>

<section class="panel" aria-labelledby="stats-title">
  <div class="panel-head">
    <h2 class="panel-title" id="stats-title">
      <Icon name="clock" size={15} />
      Live statistics
    </h2>
    {#if app.isRunning}
      <span class="chip chip-lime gap-[5px]">
        <span class="animate-pulse-soft size-[5px] rounded-full bg-lime" aria-hidden="true"></span>
        LIVE
      </span>
    {:else}
      <span class="chip">{app.statusLabel}</span>
    {/if}
  </div>

  <div class="panel-body">
    <div class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
      <div class={metricCell}>
        <span class="label">Comparisons</span>
        <strong class="{metricValue} text-text">{formatNumber(app.counters.comparisons)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">Swaps</span>
        <strong class="{metricValue} text-text">{formatNumber(app.counters.swaps)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">Writes</span>
        <strong class="{metricValue} text-text">{formatNumber(app.counters.writes)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">Reads</span>
        <strong class="{metricValue} text-text">{formatNumber(app.counters.reads)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">Total ops</span>
        <strong class="{metricValue} text-lime">{formatNumber(app.totalOps)}</strong>
      </div>
      <div class={metricCell}>
        <span class="label">Active compute</span>
        <strong class="{metricValue} text-lime">{formatTime(app.activeMs)}</strong>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2.5 border-t border-line pt-[11px]">
      <div>
        <span class="label">Aux writes</span>
        <strong class="mono mt-[3px] block text-[12px] font-semibold text-soft-lime">
          {app.counters.auxWrites > 0 ? formatNumber(app.counters.auxWrites) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">Passes</span>
        <strong class="mono mt-[3px] block text-[12px] font-semibold text-soft-lime">
          {app.counters.passes > 0 ? formatNumber(app.counters.passes) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">Max depth</span>
        <strong class="mono mt-[3px] block text-[12px] font-semibold text-soft-lime">
          {app.counters.maxDepth > 0 ? formatNumber(app.counters.maxDepth) : '—'}
        </strong>
      </div>
    </div>

    <p class="mono mt-3 text-[8px] font-bold tracking-[0.08em] text-muted-2">
      TOTAL = COMPARISONS + READS + WRITES
    </p>

    <details class="group mt-2.5 border-t border-line">
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-2 px-0 pt-2.5 pb-0 text-[11px] font-[650] text-muted [&::-webkit-details-marker]:hidden [&_svg]:text-bubblegum"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon name="info" size={13} />
          How counters work
        </span>
        <span class="inline-flex transition-transform duration-[160ms] group-open:rotate-180">
          <Icon name="chevron-down" size={14} />
        </span>
      </summary>
      <dl class="mt-2.5 grid gap-2">
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">Comparisons</dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Every key comparison made by the algorithm.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">Swaps</dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Every exchange of two positions. A swap counts as two reads and two writes.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">Writes</dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Every array-position write, including auxiliary-buffer writes.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">Reads</dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Every algorithmic array access, including auxiliary reads. Rendering reads are excluded.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">Total ops</dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Comparisons + reads + writes. Swaps are not added again because their reads and writes
            are already counted.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">
            Active compute
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Time the worker spent computing. Paused time and playback time are excluded.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">Aux writes</dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Writes into an auxiliary buffer, such as merge sort's temporary array.
          </dd>
        </div>
        <div class="grid grid-cols-[82px_minmax(0,1fr)] gap-2">
          <dt class="font-mono text-[9px] font-bold tracking-[0.04em] text-soft-lime">
            Passes / depth
          </dt>
          <dd class="text-[10.5px] leading-[1.45] text-muted">
            Algorithm-specific passes, partitions, or merge operations, and maximum recursion depth.
          </dd>
        </div>
      </dl>
    </details>
  </div>
</section>
