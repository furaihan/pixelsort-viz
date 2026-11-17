<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';
  import type { AlgorithmId } from '../core/sorting/types';

  let { onopenGuide }: { onopenGuide: () => void } = $props();

  function propertyLabel(value: boolean | 'depends'): string {
    return value === 'depends' ? 'DEPENDS' : value ? 'YES' : 'NO';
  }

  function handleChange(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    app.setAlgorithm(select.value as AlgorithmId);
  }
</script>

<section class="panel" aria-labelledby="algorithm-title">
  <div class="panel-head">
    <h2 class="panel-title" id="algorithm-title">
      <Icon name="code" size={15} />
      Algorithm
    </h2>
    <div class="head-chips">
      {#if app.algorithm.metadata.quadratic}
        <span class="chip chip-pink">QUADRATIC</span>
      {/if}
      <span class="chip">{app.algorithm.metadata.category.toUpperCase()}</span>
    </div>
  </div>

  <div class="panel-body">
    <label class="select-label" for="algorithm-select">Choose an algorithm</label>
    <div class="select-wrap">
      <select id="algorithm-select" value={app.algorithmId} onchange={handleChange}>
        {#each ALGORITHM_GROUPS as group}
          <optgroup label={group.label}>
            {#each group.algorithms as algorithm}
              <option value={algorithm.metadata.id}>{algorithm.metadata.name}</option>
            {/each}
          </optgroup>
        {/each}
      </select>
      <span class="select-chevron"><Icon name="chevron-down" size={16} /></span>
    </div>

    <p class="algorithm-description">{app.algorithm.metadata.description}</p>

    <dl class="complexity">
      <div>
        <dt class="label">Best</dt>
        <dd class="mono">{app.algorithm.metadata.bestTime}</dd>
      </div>
      <div>
        <dt class="label">Average</dt>
        <dd class="mono">{app.algorithm.metadata.averageTime}</dd>
      </div>
      <div>
        <dt class="label">Worst</dt>
        <dd class="mono">{app.algorithm.metadata.worstTime}</dd>
      </div>
      <div>
        <dt class="label">Space</dt>
        <dd class="mono">{app.algorithm.metadata.spaceComplexity}</dd>
      </div>
    </dl>

    <div class="properties">
      <span
        class="chip"
        class:chip-lime={app.algorithm.metadata.stable === true}
        class:chip-pink={app.algorithm.metadata.stable === false}
      >
        STABLE: {propertyLabel(app.algorithm.metadata.stable)}
      </span>
      <span
        class="chip"
        class:chip-lime={app.algorithm.metadata.inPlace === true}
        class:chip-pink={app.algorithm.metadata.inPlace === false}
      >
        IN-PLACE: {propertyLabel(app.algorithm.metadata.inPlace)}
      </span>
    </div>

    {#if app.algorithm.metadata.notes?.length}
      <ul class="notes">
        {#each app.algorithm.metadata.notes as note}
          <li>
            <Icon name="info" size={13} />
            <span>{note}</span>
          </li>
        {/each}
      </ul>
    {/if}

    <button class="reference-link" type="button" onclick={onopenGuide}>
      Full algorithm reference
      <Icon name="arrow-right" size={14} />
    </button>
  </div>
</section>

<style>
  .head-chips {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .select-label {
    display: block;
    margin-bottom: 6px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .select-wrap {
    position: relative;
  }

  .select-wrap select {
    width: 100%;
    min-height: 42px;
    appearance: none;
    padding: 0 38px 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: var(--ink-3);
    color: var(--text);
    font-size: 13px;
    font-weight: 650;
    cursor: pointer;
  }

  .select-wrap select:hover {
    border-color: var(--soft-lime);
  }

  .select-wrap select:focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: 2px;
  }

  .select-chevron {
    position: absolute;
    top: 50%;
    right: 12px;
    display: inline-flex;
    color: var(--muted);
    pointer-events: none;
    transform: translateY(-50%);
  }

  .algorithm-description {
    margin-top: 12px;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.55;
  }

  .complexity {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--line);
  }

  .complexity > div {
    padding: 9px 10px;
    background: var(--ink-3);
  }

  .complexity dd {
    margin-top: 3px;
    color: var(--soft-lime);
    font-size: 10.5px;
    font-weight: 600;
    line-height: 1.35;
  }

  .properties {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .notes {
    display: grid;
    gap: 7px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  .notes li {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.45;
  }

  .notes :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--bubblegum);
  }

  .reference-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 13px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--soft-lime);
    font-size: 11.5px;
    font-weight: 650;
    cursor: pointer;
  }

  .reference-link:hover {
    color: var(--lime);
  }
</style>
