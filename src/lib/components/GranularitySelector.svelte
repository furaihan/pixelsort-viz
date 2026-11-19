<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { BLOCK_SIZES } from '../core/image/imageTypes';
  import { formatNumber } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';

  let { inline = false }: { inline?: boolean } = $props();

  const segmentBase =
    'relative flex cursor-pointer items-baseline justify-center gap-[3px] min-h-11 rounded-[7px] border px-1.5 py-2 transition-colors duration-150';
  const segmentIdle =
    'border-line-strong bg-ink-3 text-muted hover:border-soft-lime hover:text-text';
  const segmentActive = 'border-lime bg-lime text-ink';
  const segmentFocus =
    'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-lime';
</script>

<svelte:element
  this={inline ? 'div' : 'section'}
  class={inline ? 'grid content-start gap-2.5' : 'panel panel-compact'}
  role={inline ? 'group' : undefined}
  aria-labelledby="granularity-title"
>
  <div class={inline ? 'flex items-center justify-between gap-2' : 'panel-head'}>
    <svelte:element this={inline ? 'h3' : 'h2'} class="panel-title" id="granularity-title">
      <Icon name="grid" size={15} />
      {i18n.t('granularity.title')}
    </svelte:element>
    <span class="chip chip-soft">
      {app.blockSize === 1
        ? `1 ${i18n.t('workspace.px')}`
        : `${app.blockSize} ${i18n.t('workspace.px')}`}
    </span>
  </div>

  <div class={inline ? 'grid' : 'panel-body'}>
    <fieldset class="m-0 min-w-0 border-0 p-0">
      <legend class="sr-only">{i18n.t('granularity.elementSize')}</legend>
      <div class="grid grid-cols-3 gap-1.5">
        {#each BLOCK_SIZES as size}
          <label
            class="{segmentBase} {segmentFocus} {app.blockSize === size
              ? segmentActive
              : segmentIdle}"
          >
            <input
              type="radio"
              name="block-size"
              value={size}
              checked={app.blockSize === size}
              onchange={() => app.setBlockSize(size)}
              class="pointer-events-none absolute h-px w-px opacity-0"
            />
            <span class="mono text-[16px] leading-none font-extrabold">{size}</span>
            <span class="font-mono text-[8px] font-bold tracking-[0.08em]">
              {i18n.t('workspace.px')}
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div
      class="mt-3.5 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2.5 border-t border-line pt-3"
    >
      <div class="grid gap-[3px]">
        <span class="label">{i18n.t('common.grid')}</span>
        <strong class="mono text-[15px] font-bold text-text">
          {app.gridInfo ? `${app.gridInfo.columns} × ${app.gridInfo.rows}` : '—'}
        </strong>
      </div>
      <div class="grid gap-[3px]">
        <span class="label">{i18n.t('granularity.sortableElements')}</span>
        <strong class="mono text-2xl leading-none font-extrabold tracking-[-0.04em] text-lime">
          {app.gridInfo ? formatNumber(app.gridInfo.elementCount) : '—'}
        </strong>
      </div>
    </div>

    <p class="mt-3 panel-note">
      {#if app.gridInfo}
        {i18n.t('granularity.largeBlocks')}
      {:else}
        {i18n.t('granularity.emptyNote')}
      {/if}
    </p>
  </div>
</svelte:element>
