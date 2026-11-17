<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import type { SortEvent } from '../core/sorting/types';
  import { formatNumber } from '../utils/format';

  const swatch =
    'relative inline-flex h-3 w-[18px] flex-none items-center justify-center rounded-[2px] border font-mono text-[7px] font-extrabold';

  const logTypeTone =
    'data-[type=compare]:text-bubblegum data-[type=swap]:text-pink data-[type=write]:text-soft-lime data-[type=pivot]:text-bubblegum data-[type=sorted]:text-lime data-[type=complete]:text-lime';

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
      class="group grid gap-[5px] rounded-lg border border-line-strong bg-ink-3 px-3 py-[11px] data-[tone=pink]:border-pink/45 data-[tone=lime]:border-lime/45"
      data-tone={eventTone(app.currentEvent)}
      aria-live={app.isRunning ? 'off' : 'polite'}
    >
      <div class="flex items-center justify-between gap-2">
        <span
          class="mono inline-flex min-h-5 items-center rounded-[3px] bg-soft-lime px-1.5 text-[8px] font-extrabold tracking-[0.08em] text-ink group-data-[tone=pink]:bg-pink group-data-[tone=lime]:bg-lime"
          >{eventTypeLabel(app.currentEvent)}</span
        >
        <span class="mono text-[9px] font-semibold text-muted"
          >{eventIndex(app.currentEvent)}</span
        >
      </div>
      <strong class="text-[12.5px] font-bold">{app.currentLabel}</strong>
      <p class="text-[11px] leading-[1.45] text-muted">{app.currentDetail}</p>
    </div>

    <div
      class="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-[7px] border-t border-line pt-[11px]"
      aria-label="Operation legend"
    >
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span
          class="{swatch} border-lime after:absolute after:inset-[2px_-2px_-2px_2px] after:rounded-[2px] after:border after:border-dashed after:border-pink after:content-['']"
          aria-hidden="true"
        ></span>
        <span>Compare</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-lime shadow-[2px_2px_0_-1px_var(--pink)]" aria-hidden="true"
        ></span>
        <span>Swap</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-dotted border-soft-lime" aria-hidden="true"></span>
        <span>Write</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-dashed border-pink text-pink" aria-hidden="true">P</span>
        <span>Pivot</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-lime text-lime" aria-hidden="true">
          <Icon name="check" size={10} />
        </span>
        <span>Sorted</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span
          class="{swatch} border-transparent after:size-[5px] after:rounded-full after:bg-soft-lime after:content-['']"
          aria-hidden="true"
        ></span>
        <span>Read</span>
      </div>
    </div>

    <div class="mt-3 border-t border-line pt-[11px]">
      <span class="label">Recent operations</span>
      {#if app.eventLog.length > 0}
        <ol class="mt-[7px] mb-0 grid list-none gap-[5px] p-0">
          {#each app.eventLog as entry (entry.id)}
            <li class="flex min-w-0 items-baseline gap-[7px]">
              <span
                class="mono w-12 flex-none text-[8px] font-bold tracking-[0.04em] text-muted-2 uppercase {logTypeTone}"
                data-type={entry.type}>{entry.type}</span
              >
              <span class="truncate text-[10px] text-muted">{entry.text}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="mt-[7px] text-[10.5px] leading-[1.45] text-muted-2">
          No operations yet. Start or step to inspect the algorithm.
        </p>
      {/if}
    </div>
  </div>
</section>
