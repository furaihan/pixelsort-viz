<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import type { SortEvent } from '../core/sorting/types';
  import { formatNumber } from '../utils/format';

  function eventTypeLabel(event: SortEvent | null): string {
    if (!event) return 'IDLE';
    switch (event.type) {
      case 'compare':
      case 'compare-value':
        return 'COMPARE';
      case 'read':
        return 'READ';
      case 'swap':
        return 'SWAP';
      case 'write':
        return 'WRITE';
      case 'mark':
        return event.role === 'pivot' ? 'PIVOT' : event.role === 'sorted' ? 'SORTED' : 'RANGE';
      case 'pass':
        return 'PASS';
      case 'delta':
        return 'BATCH';
      case 'snapshot':
        return 'SNAPSHOT';
      case 'complete':
        return 'COMPLETE';
    }
  }

  function eventTone(event: SortEvent | null): string {
    if (!event) return 'soft';
    if (
      event.type === 'compare' ||
      event.type === 'compare-value' ||
      event.type === 'swap' ||
      (event.type === 'mark' && event.role === 'pivot')
    ) {
      return 'pink';
    }
    if (event.type === 'complete') {
      return event.validated ? 'lime' : 'pink';
    }
    if (event.type === 'mark' && event.role === 'sorted') {
      return 'lime';
    }
    return 'soft';
  }

  function eventIndex(event: SortEvent | null): string {
    if (!event) return '';
    switch (event.type) {
      case 'compare':
        return `${formatNumber(event.i)} ↔ ${formatNumber(event.j)}`;
      case 'compare-value':
        return `#${formatNumber(event.index)} vs key`;
      case 'read':
        return `#${formatNumber(event.index)}`;
      case 'swap':
        return `${formatNumber(event.i)} ↔ ${formatNumber(event.j)}`;
      case 'write':
        return `#${formatNumber(event.index)}`;
      case 'mark':
        return event.range
          ? `${formatNumber(event.range[0])}–${formatNumber(event.range[1] - 1)}`
          : `#${formatNumber(event.indices[0] ?? 0)}`;
      case 'pass':
        return '';
      case 'delta':
        return `${formatNumber(event.indices.length)} positions`;
      case 'snapshot':
        return `${formatNumber(event.data.length)} elements`;
      case 'complete':
        return event.validated ? 'VALID' : 'INVALID';
    }
  }
</script>

<section class="panel" aria-labelledby="inspector-title">
  <div class="panel-head">
    <h2 class="panel-title" id="inspector-title">
      <Icon name="compare" size={15} />
      Operation inspector
    </h2>
    <span class="chip">{app.statusLabel}</span>
  </div>

  <div class="panel-body">
    <div
      class="current"
      data-tone={eventTone(app.currentEvent)}
      aria-live={app.isRunning ? 'off' : 'polite'}
    >
      <div class="current-head">
        <span class="event-stamp mono">{eventTypeLabel(app.currentEvent)}</span>
        <span class="event-index mono">{eventIndex(app.currentEvent)}</span>
      </div>
      <strong>{app.currentLabel}</strong>
      <p>{app.currentDetail}</p>
    </div>

    <div class="legend" aria-label="Operation legend">
      <div class="legend-item">
        <span class="swatch swatch-compare" aria-hidden="true"></span>
        <span>Compare</span>
      </div>
      <div class="legend-item">
        <span class="swatch swatch-swap" aria-hidden="true"></span>
        <span>Swap</span>
      </div>
      <div class="legend-item">
        <span class="swatch swatch-write" aria-hidden="true"></span>
        <span>Write</span>
      </div>
      <div class="legend-item">
        <span class="swatch swatch-pivot" aria-hidden="true">P</span>
        <span>Pivot</span>
      </div>
      <div class="legend-item">
        <span class="swatch swatch-sorted" aria-hidden="true">
          <Icon name="check" size={10} />
        </span>
        <span>Sorted</span>
      </div>
      <div class="legend-item">
        <span class="swatch swatch-read" aria-hidden="true"></span>
        <span>Read</span>
      </div>
    </div>

    <div class="log-block">
      <span class="label">Recent operations</span>
      {#if app.eventLog.length > 0}
        <ol class="log">
          {#each app.eventLog as entry (entry.id)}
            <li>
              <span class="log-type mono" data-type={entry.type}>{entry.type}</span>
              <span class="log-text">{entry.text}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="log-empty">No operations yet. Start or step to inspect the algorithm.</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .current {
    display: grid;
    gap: 5px;
    padding: 11px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: var(--ink-3);
  }

  .current[data-tone='pink'] {
    border-color: rgba(255, 20, 147, 0.45);
  }

  .current[data-tone='lime'] {
    border-color: rgba(198, 255, 0, 0.45);
  }

  .current-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .event-stamp {
    display: inline-flex;
    align-items: center;
    min-height: 20px;
    padding: 0 6px;
    border-radius: 3px;
    background: var(--soft-lime);
    color: var(--ink);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .current[data-tone='pink'] .event-stamp {
    background: var(--pink);
  }

  .current[data-tone='lime'] .event-stamp {
    background: var(--lime);
  }

  .event-index {
    color: var(--muted);
    font-size: 9px;
    font-weight: 600;
  }

  .current strong {
    font-size: 12.5px;
    font-weight: 700;
  }

  .current p {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .legend {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px 10px;
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--line);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    font-size: 9.5px;
  }

  .swatch {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 12px;
    flex: none;
    border: 1px solid var(--line-strong);
    border-radius: 2px;
    font-family: var(--font-mono);
    font-size: 7px;
    font-weight: 800;
  }

  .swatch-compare {
    border-color: var(--lime);
    border-style: solid;
  }

  .swatch-compare::after {
    content: '';
    position: absolute;
    inset: 2px -2px -2px 2px;
    border: 1px dashed var(--pink);
    border-radius: 2px;
  }

  .swatch-swap {
    border-color: var(--lime);
    box-shadow: 2px 2px 0 -1px var(--pink);
  }

  .swatch-write {
    border-color: var(--soft-lime);
    border-style: dotted;
  }

  .swatch-pivot {
    border-color: var(--pink);
    border-style: dashed;
    color: var(--pink);
  }

  .swatch-sorted {
    border-color: var(--lime);
    color: var(--lime);
  }

  .swatch-read {
    border-color: transparent;
  }

  .swatch-read::after {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--soft-lime);
  }

  .log-block {
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--line);
  }

  .log {
    display: grid;
    gap: 5px;
    margin: 7px 0 0;
    padding: 0;
    list-style: none;
  }

  .log li {
    display: flex;
    align-items: baseline;
    gap: 7px;
    min-width: 0;
  }

  .log-type {
    flex: none;
    width: 48px;
    color: var(--muted-2);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .log-type[data-type='compare'] {
    color: var(--bubblegum);
  }

  .log-type[data-type='swap'] {
    color: var(--pink);
  }

  .log-type[data-type='write'] {
    color: var(--soft-lime);
  }

  .log-type[data-type='pivot'] {
    color: var(--bubblegum);
  }

  .log-type[data-type='sorted'],
  .log-type[data-type='complete'] {
    color: var(--lime);
  }

  .log-text {
    overflow: hidden;
    color: var(--muted);
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .log-empty {
    margin-top: 7px;
    color: var(--muted-2);
    font-size: 10.5px;
    line-height: 1.45;
  }
</style>
