<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { formatNumber, formatTime } from '../utils/format';
</script>

<section class="panel" aria-labelledby="stats-title">
  <div class="panel-head">
    <h2 class="panel-title" id="stats-title">
      <Icon name="clock" size={15} />
      Live statistics
    </h2>
    {#if app.isRunning}
      <span class="chip chip-lime live-chip">
        <span class="live-dot" aria-hidden="true"></span>
        LIVE
      </span>
    {:else}
      <span class="chip">{app.statusLabel}</span>
    {/if}
  </div>

  <div class="panel-body">
    <div class="metrics">
      <div class="metric">
        <span class="label">Comparisons</span>
        <strong class="mono">{formatNumber(app.counters.comparisons)}</strong>
      </div>
      <div class="metric">
        <span class="label">Swaps</span>
        <strong class="mono">{formatNumber(app.counters.swaps)}</strong>
      </div>
      <div class="metric">
        <span class="label">Writes</span>
        <strong class="mono">{formatNumber(app.counters.writes)}</strong>
      </div>
      <div class="metric">
        <span class="label">Reads</span>
        <strong class="mono">{formatNumber(app.counters.reads)}</strong>
      </div>
      <div class="metric metric-emphasis">
        <span class="label">Total ops</span>
        <strong class="mono">{formatNumber(app.totalOps)}</strong>
      </div>
      <div class="metric metric-emphasis">
        <span class="label">Active compute</span>
        <strong class="mono">{formatTime(app.activeMs)}</strong>
      </div>
    </div>

    <div class="secondary-metrics">
      <div>
        <span class="label">Aux writes</span>
        <strong class="mono">
          {app.counters.auxWrites > 0 ? formatNumber(app.counters.auxWrites) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">Passes</span>
        <strong class="mono">
          {app.counters.passes > 0 ? formatNumber(app.counters.passes) : '—'}
        </strong>
      </div>
      <div>
        <span class="label">Max depth</span>
        <strong class="mono">
          {app.counters.maxDepth > 0 ? formatNumber(app.counters.maxDepth) : '—'}
        </strong>
      </div>
    </div>

    <p class="formula mono">TOTAL = COMPARISONS + READS + WRITES</p>

    <details class="definitions">
      <summary>
        <span>
          <Icon name="info" size={13} />
          How counters work
        </span>
        <span class="summary-chevron"><Icon name="chevron-down" size={14} /></span>
      </summary>
      <dl>
        <div>
          <dt>Comparisons</dt>
          <dd>Every key comparison made by the algorithm.</dd>
        </div>
        <div>
          <dt>Swaps</dt>
          <dd>Every exchange of two positions. A swap counts as two reads and two writes.</dd>
        </div>
        <div>
          <dt>Writes</dt>
          <dd>Every array-position write, including auxiliary-buffer writes.</dd>
        </div>
        <div>
          <dt>Reads</dt>
          <dd>
            Every algorithmic array access, including auxiliary reads. Rendering reads are
            excluded.
          </dd>
        </div>
        <div>
          <dt>Total ops</dt>
          <dd>
            Comparisons + reads + writes. Swaps are not added again because their reads and
            writes are already counted.
          </dd>
        </div>
        <div>
          <dt>Active compute</dt>
          <dd>
            Time the worker spent computing. Paused time and playback time are excluded.
          </dd>
        </div>
        <div>
          <dt>Aux writes</dt>
          <dd>Writes into an auxiliary buffer, such as merge sort's temporary array.</dd>
        </div>
        <div>
          <dt>Passes / depth</dt>
          <dd>Algorithm-specific passes, partitions, or merge operations, and maximum recursion depth.</dd>
        </div>
      </dl>
    </details>
  </div>
</section>

<style>
  .live-chip {
    gap: 5px;
  }

  .live-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--lime);
    animation: pulse 1.4s ease-in-out infinite;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--line);
  }

  .metric {
    display: grid;
    gap: 3px;
    padding: 10px 11px;
    background: var(--ink-3);
  }

  .metric strong {
    color: var(--text);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .metric-emphasis strong {
    color: var(--lime);
  }

  .secondary-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--line);
  }

  .secondary-metrics strong {
    display: block;
    margin-top: 3px;
    color: var(--soft-lime);
    font-size: 12px;
    font-weight: 600;
  }

  .formula {
    margin-top: 12px;
    color: var(--muted-2);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .definitions {
    margin-top: 10px;
    border-top: 1px solid var(--line);
  }

  .definitions summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 0 0;
    color: var(--muted);
    font-size: 11px;
    font-weight: 650;
    cursor: pointer;
    list-style: none;
  }

  .definitions summary::-webkit-details-marker {
    display: none;
  }

  .definitions summary span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .definitions summary :global(svg) {
    color: var(--bubblegum);
  }

  .definitions[open] .summary-chevron {
    transform: rotate(180deg);
  }

  .summary-chevron {
    display: inline-flex;
    transition: transform 160ms ease;
  }

  .definitions dl {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  .definitions dl > div {
    display: grid;
    grid-template-columns: 82px minmax(0, 1fr);
    gap: 8px;
  }

  .definitions dt {
    color: var(--soft-lime);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .definitions dd {
    color: var(--muted);
    font-size: 10.5px;
    line-height: 1.45;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.35;
      transform: scale(0.7);
    }
  }
</style>
