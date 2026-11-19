<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import type { SortEvent } from '../core/sorting/types';
  import { formatNumber } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';

  const swatch =
    'relative inline-flex h-3 w-[18px] flex-none items-center justify-center rounded-[2px] border font-mono text-[7px] font-extrabold';

  const logTypeTone =
    'data-[type=compare]:text-bubblegum data-[type=swap]:text-pink data-[type=write]:text-soft-lime data-[type=pivot]:text-bubblegum data-[type=sorted]:text-lime data-[type=complete]:text-lime';

  function eventTypeLabel(event: SortEvent | null): string {
    if (!event) return i18n.t('event.idle');
    switch (event.type) {
      case 'compare':
      case 'compare-value':
        return i18n.t('event.compare');
      case 'read':
        return i18n.t('event.read');
      case 'swap':
        return i18n.t('event.swap');
      case 'write':
        return i18n.t('event.write');
      case 'mark':
        if (event.role === 'pivot') return i18n.t('event.pivot');
        if (event.role === 'sorted') return i18n.t('event.sorted');
        return event.range ? i18n.t('event.range') : i18n.t('event.active');
      case 'pass':
        return i18n.t('event.pass');
      case 'delta':
        return i18n.t('event.batch');
      case 'snapshot':
        return i18n.t('event.snapshot');
      case 'complete':
        return i18n.t('event.complete');
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
        return `#${formatNumber(event.index)} vs ${i18n.t('inspector.key')}`;
      case 'read':
        return event.auxKind === 'counts'
          ? `${i18n.t('inspector.count')}[${formatNumber(event.index)}]`
          : `#${formatNumber(event.index)}`;
      case 'swap':
        return `${formatNumber(event.i)} ↔ ${formatNumber(event.j)}`;
      case 'write':
        return event.auxKind === 'counts'
          ? `${i18n.t('inspector.count')}[${formatNumber(event.index)}]`
          : `#${formatNumber(event.index)}`;
      case 'mark':
        return event.range
          ? `${formatNumber(event.range[0])}–${formatNumber(event.range[1] - 1)}`
          : `#${formatNumber(event.indices[0] ?? 0)}`;
      case 'pass':
        return '';
      case 'delta':
        return `${formatNumber(event.indices.length)} ${i18n.t('inspector.positions')}`;
      case 'snapshot':
        return `${formatNumber(event.data.length)} ${i18n.t('inspector.elements')}`;
      case 'complete':
        return event.validated ? i18n.t('inspector.valid') : i18n.t('inspector.invalid');
    }
  }
</script>

<section class="panel panel-compact" aria-labelledby="inspector-title">
  <div class="panel-head">
    <h2 class="panel-title" id="inspector-title">
      <Icon name="compare" size={15} />
      {i18n.t('inspector.title')}
    </h2>
    <span class="chip">{i18n.statusLabel(app.status)}</span>
  </div>

  <div class="panel-body">
    <div
      class="group grid gap-[5px] rounded-lg border border-line-strong bg-ink-3 px-3 py-[11px] data-[tone=lime]:border-lime/45 data-[tone=pink]:border-pink/45"
      data-tone={eventTone(app.currentEvent)}
      aria-live={app.isRunning ? 'off' : 'polite'}
    >
      <div class="flex items-center justify-between gap-2">
        <span
          class="inline-flex min-h-5 items-center rounded-[3px] bg-soft-lime px-1.5 mono text-[8px] font-extrabold tracking-[0.08em] text-ink group-data-[tone=lime]:bg-lime group-data-[tone=pink]:bg-pink"
        >
          {eventTypeLabel(app.currentEvent)}
        </span>
        <span class="mono text-[9px] font-semibold text-muted">{eventIndex(app.currentEvent)}</span>
      </div>
      <strong class="text-[12.5px] font-bold">{i18n.text(app.currentLabel)}</strong>
      <p class="text-[11px] leading-[1.45] text-muted">{i18n.text(app.currentDetail)}</p>
    </div>

    <div class="mt-2.5 grid gap-2.5">
      <p class="m-0 text-[10.5px] leading-[1.45] text-muted">
        {i18n.t('inspector.keyNote')}
      </p>
    </div>

    <div
      class="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-[7px] border-t border-line pt-[11px] tight:grid-cols-2"
      aria-label={i18n.t('inspector.legend')}
    >
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span
          class="{swatch} border-lime after:absolute after:inset-[2px_-2px_-2px_2px] after:rounded-[2px] after:border after:border-dashed after:border-pink after:content-['']"
          aria-hidden="true"
        ></span>
        <span>{i18n.t('inspector.compare')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-lime shadow-[2px_2px_0_-1px_var(--pink)]" aria-hidden="true"
        ></span>
        <span>{i18n.t('inspector.swap')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-dotted border-bubblegum" aria-hidden="true"></span>
        <span>{i18n.t('inspector.write')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-dashed border-pink text-pink" aria-hidden="true">P</span>
        <span>{i18n.t('inspector.pivot')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span class="{swatch} border-lime text-lime" aria-hidden="true">
          <Icon name="check" size={10} />
        </span>
        <span>{i18n.t('inspector.sorted')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[9.5px] text-muted">
        <span
          class="{swatch} border-transparent after:size-[5px] after:rounded-full after:bg-bubblegum after:content-['']"
          aria-hidden="true"
        ></span>
        <span>{i18n.t('inspector.read')}</span>
      </div>
    </div>

    <div class="mt-3 border-t border-line pt-[11px]">
      <span class="label">{i18n.t('inspector.recent')}</span>
      {#if app.eventLog.length > 0}
        <ol class="mt-[7px] mb-0 grid list-none gap-[5px] p-0">
          {#each app.eventLog as entry (entry.id)}
            <li class="flex min-w-0 items-baseline gap-[7px]">
              <span
                class="w-12 flex-none mono text-[8px] font-bold tracking-[0.04em] text-muted-2 uppercase {logTypeTone}"
                data-type={entry.type}
              >
                {entry.type}
              </span>
              <span class="truncate text-[10px] text-muted">{i18n.text(entry.text)}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="mt-[7px] text-[10.5px] leading-[1.45] text-muted-2">
          {i18n.t('inspector.empty')}
        </p>
      {/if}
    </div>
  </div>
</section>
