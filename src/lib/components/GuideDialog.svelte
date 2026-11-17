<script lang="ts">
  import Icon from './Icon.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  function close(): void {
    open = false;
  }

  function handleClose(): void {
    open = false;
  }

  function handleDialogClick(event: MouseEvent): void {
    if (event.target === dialog) close();
  }

  function propertyLabel(value: boolean | 'depends'): string {
    return value === 'depends' ? 'Depends' : value ? 'Yes' : 'No';
  }
</script>

<dialog
  bind:this={dialog}
  class="guide-dialog"
  aria-labelledby="guide-title"
  aria-describedby="guide-intro"
  onclose={handleClose}
  onclick={handleDialogClick}
>
  <div class="dialog-inner">
    <header class="dialog-head">
      <div>
        <h2 id="guide-title">How this works</h2>
        <p class="dialog-sub mono">PIXEL SORT / FIELD GUIDE</p>
      </div>
      <button class="close-btn" type="button" aria-label="Close guide" onclick={close}>
        <Icon name="x" size={18} />
      </button>
    </header>

    <div class="dialog-body">
      <p class="intro" id="guide-intro">
        The image is the data structure. The algorithm sorts each element by its
        <strong>original position</strong>, not by color. When the permutation is sorted, the
        original image is reconstructed exactly.
      </p>

      <ol class="steps">
        <li>
          <span class="step-number mono">01</span>
          <div>
            <strong>Load an image and choose a block size.</strong>
            <p>
              The grid uses ceiling division, so the rightmost and bottommost tiles can be smaller.
              Edge tiles keep their natural size and never stretch.
            </p>
          </div>
        </li>
        <li>
          <span class="step-number mono">02</span>
          <div>
            <strong>Shuffle the elements.</strong>
            <p>
              Fisher–Yates creates a uniform permutation. The same shuffled arrangement is kept
              when you switch algorithms, so comparisons are fair.
            </p>
          </div>
        </li>
        <li>
          <span class="step-number mono">03</span>
          <div>
            <strong>Pick an algorithm and watch the proof sheet re-register.</strong>
            <p>
              Compare, swap, write, pivot, and sorted events are highlighted as they happen. The
              inspector names the operation currently on screen.
            </p>
          </div>
        </li>
      </ol>

      <div class="guide-notes">
        <div class="guide-note">
          <Icon name="info" size={15} />
          <p>
            Counters come from the algorithm, not from animation frames. Total tracked operations =
            comparisons + reads + writes. Swaps are reported separately and are not added again.
          </p>
        </div>
        <div class="guide-note">
          <Icon name="lock" size={15} />
          <p>
            Everything runs in this browser. Image bytes, thumbnails, and pixel data are never sent
            to a server.
          </p>
        </div>
      </div>

      <section class="reference" aria-labelledby="reference-title">
        <div class="reference-head">
          <h3 id="reference-title">Algorithm reference</h3>
          <span class="chip">10 ALGORITHMS</span>
        </div>

        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Algorithm</th>
                <th scope="col">Best</th>
                <th scope="col">Average</th>
                <th scope="col">Worst</th>
                <th scope="col">Space</th>
                <th scope="col">Stable</th>
                <th scope="col">In-place</th>
              </tr>
            </thead>
            <tbody>
              {#each ALGORITHM_GROUPS as group}
                <tr class="group-row">
                  <th colspan="7" scope="colgroup">{group.label}</th>
                </tr>
                {#each group.algorithms as algorithm}
                  <tr>
                    <th scope="row">
                      <span class="algo-name">{algorithm.metadata.name}</span>
                      {#if algorithm.metadata.notes?.length}
                        <ul class="algo-notes">
                          {#each algorithm.metadata.notes as note}
                            <li>{note}</li>
                          {/each}
                        </ul>
                      {/if}
                    </th>
                    <td class="mono">{algorithm.metadata.bestTime}</td>
                    <td class="mono">{algorithm.metadata.averageTime}</td>
                    <td class="mono">{algorithm.metadata.worstTime}</td>
                    <td class="mono">{algorithm.metadata.spaceComplexity}</td>
                    <td
                      class:yes={algorithm.metadata.stable === true}
                      class:no={algorithm.metadata.stable === false}
                    >
                      {propertyLabel(algorithm.metadata.stable)}
                    </td>
                    <td
                      class:yes={algorithm.metadata.inPlace === true}
                      class:no={algorithm.metadata.inPlace === false}
                    >
                      {propertyLabel(algorithm.metadata.inPlace)}
                    </td>
                  </tr>
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</dialog>

<style>
  .guide-dialog {
    width: min(980px, calc(100vw - 28px));
    max-height: 88vh;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: 16px;
    background: var(--ink-2);
    color: var(--text);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
  }

  .guide-dialog::backdrop {
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(4px);
  }

  .dialog-inner {
    display: grid;
    max-height: 88vh;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .dialog-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--line);
  }

  .dialog-head h2 {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .dialog-sub {
    margin-top: 4px;
    color: var(--muted);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: none;
    border: 1px solid var(--line-strong);
    border-radius: 7px;
    background: var(--ink-3);
    color: var(--muted);
    cursor: pointer;
  }

  .close-btn:hover {
    border-color: var(--soft-lime);
    color: var(--text);
  }

  .dialog-body {
    overflow: auto;
    padding: 20px 22px 26px;
  }

  .intro {
    max-width: 72ch;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .intro strong {
    color: var(--soft-lime);
  }

  .steps {
    display: grid;
    gap: 14px;
    margin: 20px 0 0;
    padding: 0;
    list-style: none;
  }

  .steps li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: none;
    border: 1px solid var(--line-strong);
    border-radius: 5px;
    color: var(--lime);
    font-size: 9px;
    font-weight: 800;
  }

  .steps strong {
    font-size: 13px;
    font-weight: 700;
  }

  .steps p {
    margin-top: 3px;
    max-width: 70ch;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .guide-notes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 20px;
  }

  .guide-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--ink-3);
  }

  .guide-note :global(svg) {
    flex: none;
    margin-top: 1px;
    color: var(--lime);
  }

  .guide-note p {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.5;
  }

  .reference {
    margin-top: 24px;
  }

  .reference-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .reference-head h3 {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .table-scroll {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 9px;
  }

  table {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 11px;
  }

  thead th:nth-child(1) {
    width: 26%;
  }

  thead th:nth-child(2) {
    width: 14%;
  }

  thead th:nth-child(3) {
    width: 17%;
  }

  thead th:nth-child(4) {
    width: 14%;
  }

  thead th:nth-child(5) {
    width: 12%;
  }

  thead th:nth-child(6),
  thead th:nth-child(7) {
    width: 8.5%;
  }

  thead th {
    padding: 9px 10px;
    border-bottom: 1px solid var(--line-strong);
    background: var(--ink-3);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-align: left;
    text-transform: uppercase;
  }

  tbody th,
  tbody td {
    padding: 9px 10px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody td {
    color: var(--muted);
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .group-row th {
    padding: 7px 10px;
    background: rgba(198, 255, 0, 0.06);
    color: var(--lime);
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .algo-name {
    color: var(--text);
    font-size: 11.5px;
    font-weight: 700;
  }

  .algo-notes {
    display: grid;
    gap: 2px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }

  .algo-notes li {
    max-width: 30ch;
    color: var(--muted-2);
    font-size: 9.5px;
    font-weight: 400;
    line-height: 1.4;
    white-space: normal;
  }

  td.yes {
    color: var(--lime);
  }

  td.no {
    color: var(--bubblegum);
  }

  @media (max-width: 700px) {
    .dialog-head {
      padding: 16px 16px 13px;
    }

    .dialog-head h2 {
      font-size: 23px;
    }

    .dialog-body {
      padding: 16px;
    }

    .guide-notes {
      grid-template-columns: 1fr;
    }

    table {
      min-width: 680px;
    }
  }
</style>
