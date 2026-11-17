<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { BLOCK_SIZES } from '../core/image/imageTypes';
  import { formatNumber } from '../utils/format';
</script>

<section class="panel" aria-labelledby="granularity-title">
  <div class="panel-head">
    <h2 class="panel-title" id="granularity-title">
      <Icon name="grid" size={15} />
      Granularity
    </h2>
    <span class="chip chip-soft">
      {app.blockSize === 1 ? '1 PX' : `${app.blockSize} PX`}
    </span>
  </div>

  <div class="panel-body">
    <fieldset class="granularity-fieldset">
      <legend class="sr-only">Element size</legend>
      <div class="segmented">
        {#each BLOCK_SIZES as size}
          <label class="segment" class:active={app.blockSize === size}>
            <input
              type="radio"
              name="block-size"
              value={size}
              checked={app.blockSize === size}
              onchange={() => app.setBlockSize(size)}
            />
            <span class="segment-value mono">{size}</span>
            <span class="segment-unit">PX</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div class="readout">
      <div class="readout-grid">
        <span class="label">Grid</span>
        <strong class="mono">
          {app.gridInfo ? `${app.gridInfo.columns} × ${app.gridInfo.rows}` : '—'}
        </strong>
      </div>
      <div class="readout-count">
        <span class="label">Sortable elements</span>
        <strong class="mono">
          {app.gridInfo ? formatNumber(app.gridInfo.elementCount) : '—'}
        </strong>
      </div>
    </div>

    <p class="panel-note">
      {#if app.gridInfo}
        Larger blocks mean fewer elements and a faster run. Edge tiles may be smaller; they keep
        their natural size and never stretch.
      {:else}
        Load an image to calculate the exact grid and element count.
      {/if}
    </p>
  </div>
</section>

<style>
  .granularity-fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .segmented {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .segment {
    position: relative;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 3px;
    min-height: 44px;
    padding: 8px 6px;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    background: var(--ink-3);
    color: var(--muted);
    cursor: pointer;
    transition:
      background 150ms ease,
      border-color 150ms ease,
      color 150ms ease;
  }

  .segment:hover {
    border-color: var(--soft-lime);
    color: var(--text);
  }

  .segment.active {
    border-color: var(--lime);
    background: var(--lime);
    color: var(--ink);
  }

  .segment:has(input:focus-visible) {
    outline: 2px solid var(--lime);
    outline-offset: 2px;
  }

  .segment input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .segment-value {
    font-size: 16px;
    font-weight: 800;
    line-height: 1;
  }

  .segment-unit {
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .readout {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 10px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }

  .readout-grid,
  .readout-count {
    display: grid;
    gap: 3px;
  }

  .readout-grid strong {
    color: var(--text);
    font-size: 15px;
    font-weight: 700;
  }

  .readout-count strong {
    color: var(--lime);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .panel-note {
    margin-top: 12px;
  }
</style>
