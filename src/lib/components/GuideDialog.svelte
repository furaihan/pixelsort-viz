<script lang="ts">
  import Icon from './Icon.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  const tableClass =
    'w-full min-w-0 table-fixed border-collapse text-[11px] compact:min-w-[680px] [&>tbody>tr:last-child>*]:border-b-0';
  const headTh =
    'border-b border-line-strong bg-ink-3 px-2.5 py-[9px] text-left font-mono text-[8px] font-bold tracking-[0.08em] text-muted uppercase';
  const bodyTh = 'border-b border-line px-2.5 py-[9px] text-left align-top';
  const bodyTd = 'border-b border-line px-2.5 py-[9px] text-left align-top whitespace-normal [overflow-wrap:anywhere]';
  const groupTh =
    'border-b border-line bg-lime/6 px-2.5 py-[7px] text-left font-mono text-[8px] font-extrabold tracking-[0.12em] text-lime uppercase';

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

  function propertyTone(value: boolean | 'depends'): string {
    if (value === true) return 'text-lime';
    if (value === false) return 'text-bubblegum';
    return 'text-muted';
  }
</script>

<dialog
  bind:this={dialog}
  class="m-auto w-[min(980px,calc(100vw-28px))] max-h-[88vh] rounded-2xl border border-line-strong bg-ink-2 p-0 text-text shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop:bg-black/72 backdrop:backdrop-blur-[4px]"
  aria-labelledby="guide-title"
  aria-describedby="guide-intro"
  onclose={handleClose}
  onclick={handleDialogClick}
>
  <div class="grid max-h-[88vh] grid-rows-[auto_minmax(0,1fr)]">
    <header
      class="flex items-start justify-between gap-4 border-b border-line px-[22px] pt-5 pb-4 compact:px-4 compact:pt-4 compact:pb-[13px]"
    >
      <div>
        <h2 class="text-[28px] font-black tracking-[-0.04em] compact:text-[23px]">How this works</h2>
        <p class="mono mt-1 text-[9px] font-bold tracking-[0.14em] text-muted">
          PIXEL SORT / FIELD GUIDE
        </p>
      </div>
      <button
        class="inline-flex size-[34px] flex-none cursor-pointer items-center justify-center rounded-[7px] border border-line-strong bg-ink-3 text-muted hover:border-soft-lime hover:text-text"
        type="button"
        aria-label="Close guide"
        onclick={close}
      >
        <Icon name="x" size={18} />
      </button>
    </header>

    <div class="overflow-auto px-[22px] pt-5 pb-[26px] compact:p-4">
      <p class="max-w-[72ch] text-[14px] leading-[1.6] text-muted [&_strong]:text-soft-lime" id="guide-intro">
        The image is the data structure. The algorithm sorts each element by its
        <strong>original position</strong>, not by color. When the permutation is sorted, the
        original image is reconstructed exactly.
      </p>

      <ol class="mt-5 mb-0 grid list-none gap-3.5 p-0">
        <li class="flex items-start gap-3">
          <span
            class="mono inline-flex size-7 flex-none items-center justify-center rounded-[5px] border border-line-strong text-[9px] font-extrabold text-lime"
            >01</span
          >
          <div>
            <strong class="text-[13px] font-bold">Load an image and choose a block size.</strong>
            <p class="mt-[3px] max-w-[70ch] text-[12px] leading-[1.5] text-muted">
              The grid uses ceiling division, so the rightmost and bottommost tiles can be smaller.
              Edge tiles keep their natural size and never stretch.
            </p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span
            class="mono inline-flex size-7 flex-none items-center justify-center rounded-[5px] border border-line-strong text-[9px] font-extrabold text-lime"
            >02</span
          >
          <div>
            <strong class="text-[13px] font-bold">Shuffle the elements.</strong>
            <p class="mt-[3px] max-w-[70ch] text-[12px] leading-[1.5] text-muted">
              Fisher–Yates creates a uniform permutation. The same shuffled arrangement is kept when
              you switch algorithms, so comparisons are fair.
            </p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <span
            class="mono inline-flex size-7 flex-none items-center justify-center rounded-[5px] border border-line-strong text-[9px] font-extrabold text-lime"
            >03</span
          >
          <div>
            <strong class="text-[13px] font-bold"
              >Pick an algorithm and watch the proof sheet re-register.</strong
            >
            <p class="mt-[3px] max-w-[70ch] text-[12px] leading-[1.5] text-muted">
              Compare, swap, write, pivot, and sorted events are highlighted as they happen. The
              inspector names the operation currently on screen.
            </p>
          </div>
        </li>
      </ol>

      <div class="mt-5 grid grid-cols-2 gap-2.5 compact:grid-cols-1">
        <div
          class="flex items-start gap-2 rounded-lg border border-line bg-ink-3 px-3 py-[11px] [&_svg]:mt-px [&_svg]:flex-none [&_svg]:text-lime"
        >
          <Icon name="info" size={15} />
          <p class="text-[11px] leading-[1.5] text-muted">
            Counters come from the algorithm, not from animation frames. Total tracked operations =
            comparisons + reads + writes. Swaps are reported separately and are not added again.
          </p>
        </div>
        <div
          class="flex items-start gap-2 rounded-lg border border-line bg-ink-3 px-3 py-[11px] [&_svg]:mt-px [&_svg]:flex-none [&_svg]:text-lime"
        >
          <Icon name="lock" size={15} />
          <p class="text-[11px] leading-[1.5] text-muted">
            Everything runs in this browser. Image bytes, thumbnails, and pixel data are never sent
            to a server.
          </p>
        </div>
      </div>

      <section class="mt-6" aria-labelledby="reference-title">
        <div class="mb-2.5 flex items-center justify-between gap-3">
          <h3 class="text-[18px] font-extrabold tracking-[-0.03em]" id="reference-title">
            Algorithm reference
          </h3>
          <span class="chip">10 ALGORITHMS</span>
        </div>

        <div class="overflow-x-auto rounded-[9px] border border-line">
          <table class={tableClass}>
            <thead>
              <tr>
                <th class="{headTh} w-[26%]" scope="col">Algorithm</th>
                <th class="{headTh} w-[14%]" scope="col">Best</th>
                <th class="{headTh} w-[17%]" scope="col">Average</th>
                <th class="{headTh} w-[14%]" scope="col">Worst</th>
                <th class="{headTh} w-[12%]" scope="col">Space</th>
                <th class="{headTh} w-[8.5%]" scope="col">Stable</th>
                <th class="{headTh} w-[8.5%]" scope="col">In-place</th>
              </tr>
            </thead>
            <tbody>
              {#each ALGORITHM_GROUPS as group}
                <tr>
                  <th class={groupTh} colspan="7" scope="colgroup">{group.label}</th>
                </tr>
                {#each group.algorithms as algorithm}
                  <tr>
                    <th class={bodyTh} scope="row">
                      <span class="text-[11.5px] font-bold text-text">{algorithm.metadata.name}</span>
                      {#if algorithm.metadata.notes?.length}
                        <ul class="mt-1 mb-0 grid list-none gap-0.5 p-0">
                          {#each algorithm.metadata.notes as note}
                            <li
                              class="max-w-[30ch] text-[9.5px] leading-[1.4] font-normal whitespace-normal text-muted-2"
                            >
                              {note}
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    </th>
                    <td class="{bodyTd} mono text-muted">{algorithm.metadata.bestTime}</td>
                    <td class="{bodyTd} mono text-muted">{algorithm.metadata.averageTime}</td>
                    <td class="{bodyTd} mono text-muted">{algorithm.metadata.worstTime}</td>
                    <td class="{bodyTd} mono text-muted">{algorithm.metadata.spaceComplexity}</td>
                    <td class="{bodyTd} {propertyTone(algorithm.metadata.stable)}">
                      {propertyLabel(algorithm.metadata.stable)}
                    </td>
                    <td class="{bodyTd} {propertyTone(algorithm.metadata.inPlace)}">
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
