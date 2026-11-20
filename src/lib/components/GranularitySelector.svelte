<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { BLOCK_SIZES } from '../core/image/imageTypes';
  import { formatNumber } from '../utils/format';
  import { i18n } from '../i18n/index.svelte';

  let { inline = false }: { inline?: boolean } = $props();

  const segmentBase =
    'relative flex cursor-pointer items-baseline justify-center gap-[3px] min-h-10 rounded-[6px] border px-1.5 py-2 transition-colors duration-150';
  const segmentIdle = 'border-rule bg-inset text-muted hover:border-rule-strong hover:text-text';
  const segmentActive = 'border-accent bg-accent text-ground';
  const segmentFocus =
    'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent';
</script>

<svelte:element
  this={inline ? 'div' : 'section'}
  class={inline ? 'grid content-start gap-2.5' : 'panel'}
  role={inline ? 'group' : undefined}
  aria-labelledby="granularity-title"
>
  <div class={inline ? 'flex items-center justify-between gap-2' : 'panel-head'}>
    <svelte:element
      this={inline ? 'h3' : 'h2'}
      class={inline ? 'label' : 'panel-title'}
      id="granularity-title"
    >
      {#if !inline}<Icon name="grid" size={16} />{/if}
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
      <div class="grid grid-cols-6 gap-1.5 narrow:grid-cols-3">
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
            <span class="mono text-[16px] leading-none font-bold">{size}</span>
            <span class="mono text-[10px] font-bold tracking-[0.08em]">
              {i18n.t('workspace.px')}
            </span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div
      class="mt-3 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2.5 border-t border-rule pt-2.5"
    >
      <div class="grid gap-1">
        <span class="label">{i18n.t('common.grid')}</span>
        <strong class="mono text-[15px] font-bold text-text">
          {app.gridInfo ? `${app.gridInfo.columns} × ${app.gridInfo.rows}` : '—'}
        </strong>
      </div>
      <div class="grid gap-1">
        <span class="label">{i18n.t('granularity.sortableElements')}</span>
        <strong class="mono text-data leading-none text-text">
          {app.gridInfo ? formatNumber(app.gridInfo.elementCount) : '—'}
        </strong>
      </div>
    </div>

    <p class="mt-2.5 panel-note">
      {#if app.gridInfo}
        {i18n.t('granularity.largeBlocks')}
      {:else}
        {i18n.t('granularity.emptyNote')}
      {/if}
    </p>
  </div>
</svelte:element>
