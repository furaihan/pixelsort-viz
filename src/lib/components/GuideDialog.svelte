<script lang="ts">
  import Icon from './Icon.svelte';
  import { ALGORITHM_GROUPS } from '../core/sorting/registry';
  import { i18n } from '../i18n/index.svelte';
  import type { TranslationKey } from '../i18n/messages';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let dialog = $state<HTMLDialogElement | null>(null);

  const tableClass =
    'w-full min-w-0 table-fixed border-collapse text-[11px] compact:min-w-[680px] [&>tbody>tr:last-child>*]:border-b-0';
  const headTh =
    'border-b border-rule-strong bg-inset px-2.5 py-[9px] text-left mono text-[9px] font-bold tracking-[0.08em] text-muted uppercase';
  const bodyTh = 'border-b border-rule px-2.5 py-[9px] text-left align-top';
  const bodyTd =
    'border-b border-rule px-2.5 py-[9px] text-left align-top whitespace-normal [overflow-wrap:anywhere]';
  const groupTh =
    'border-b border-rule bg-accent/10 px-2.5 py-[7px] text-left mono text-[9px] font-bold tracking-[0.12em] text-muted uppercase';

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

  // Keep Tab focus inside the modal. The native :dialog trap can leak a stop onto
  // <body> once per lap (Chromium + scrollable region), so wrap at the boundaries.
  function handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !dialog) return;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || active === dialog) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || active === dialog) {
      event.preventDefault();
      first.focus();
    }
  }

  function propertyLabel(value: boolean | 'depends'): string {
    return i18n.propertyLabel(value);
  }

  function propertyTone(value: boolean | 'depends'): string {
    if (value === true) return 'text-text';
    if (value === false) return 'text-muted-2';
    return 'text-muted';
  }
</script>

<dialog
  bind:this={dialog}
  class="m-auto max-h-[88vh] w-[min(980px,calc(100vw-28px))] rounded-[12px] border border-rule-strong bg-panel p-0 text-text shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop:bg-black/70 backdrop:backdrop-blur-[4px]"
  aria-labelledby="guide-title"
  aria-describedby="guide-intro"
  onclose={handleClose}
  onclick={handleDialogClick}
  onkeydown={handleDialogKeydown}
>
  <div class="grid max-h-[88vh] grid-rows-[auto_minmax(0,1fr)]">
    <header
      class="flex items-start justify-between gap-4 border-b border-rule px-[22px] pt-5 pb-4 compact:px-4 compact:pt-4 compact:pb-[13px]"
    >
      <div>
        <h2 class="text-display" id="guide-title">
          {i18n.t('guide.title')}
        </h2>
        <p class="mt-1.5 mono text-[10px] font-bold tracking-[0.14em] text-muted">
          {i18n.t('guide.subtitle')}
        </p>
      </div>
      <button
        class="inline-flex size-[34px] flex-none cursor-pointer items-center justify-center rounded-[6px] border border-rule bg-inset text-muted hover:border-rule-strong hover:text-text"
        type="button"
        aria-label={i18n.t('guide.close')}
        onclick={close}
      >
        <Icon name="x" size={18} />
      </button>
    </header>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="overflow-auto px-[22px] pt-5 pb-[26px] compact:p-4"
      tabindex="0"
      role="region"
      aria-labelledby="guide-title"
    >
      <p
        class="max-w-[72ch] text-[14px] leading-[1.6] text-muted [&_strong]:text-text"
        id="guide-intro"
      >
        {@html i18n.t('guide.intro')}
      </p>

      <ol class="mt-5 mb-0 grid list-none gap-3.5 p-0">
        {#each [1, 2, 3] as step}
          <li class="flex items-start gap-3">
            <span
              class="inline-flex size-7 flex-none items-center justify-center rounded-[5px] border border-rule-strong mono text-[10px] font-bold text-muted"
            >
              {String(step).padStart(2, '0')}
            </span>
            <div>
              <strong class="text-[13px] font-bold">
                {i18n.t(`guide.step${step}Title` as TranslationKey)}
              </strong>
              <p class="mt-[3px] max-w-[70ch] text-[12px] leading-[1.5] text-muted">
                {i18n.t(`guide.step${step}Body` as TranslationKey)}
              </p>
            </div>
          </li>
        {/each}
      </ol>

      <div class="mt-5 grid grid-cols-2 gap-2.5 compact:grid-cols-1">
        <div
          class="flex items-start gap-2 rounded-[8px] border border-rule bg-inset px-3 py-[11px] [&_svg]:mt-px [&_svg]:flex-none [&_svg]:text-structure"
        >
          <Icon name="info" size={15} />
          <p class="text-[11px] leading-[1.5] text-muted">
            {i18n.t('guide.counterNote')}
          </p>
        </div>
        <div
          class="flex items-start gap-2 rounded-[8px] border border-rule bg-inset px-3 py-[11px] [&_svg]:mt-px [&_svg]:flex-none [&_svg]:text-structure"
        >
          <Icon name="lock" size={15} />
          <p class="text-[11px] leading-[1.5] text-muted">
            {i18n.t('guide.localNote')}
          </p>
        </div>
      </div>

      <section class="mt-6" aria-labelledby="reference-title">
        <div class="mb-2.5 flex items-center justify-between gap-3">
          <h3 class="text-[18px] font-bold tracking-[-0.02em]" id="reference-title">
            {i18n.t('guide.reference')}
          </h3>
          <span class="chip">{i18n.t('guide.algorithmCount')}</span>
        </div>

        <div class="overflow-x-auto rounded-[8px] border border-rule">
          <table class={tableClass}>
            <thead>
              <tr>
                <th class="{headTh} w-[26%]" scope="col">{i18n.t('guide.algorithm')}</th>
                <th class="{headTh} w-[14%]" scope="col">{i18n.t('common.best')}</th>
                <th class="{headTh} w-[17%]" scope="col">{i18n.t('common.average')}</th>
                <th class="{headTh} w-[14%]" scope="col">{i18n.t('common.worst')}</th>
                <th class="{headTh} w-[12%]" scope="col">{i18n.t('common.space')}</th>
                <th class="{headTh} w-[8.5%]" scope="col">{i18n.t('guide.stable')}</th>
                <th class="{headTh} w-[8.5%]" scope="col">{i18n.t('guide.inPlace')}</th>
              </tr>
            </thead>
            <tbody>
              {#each ALGORITHM_GROUPS as group}
                <tr>
                  <th class={groupTh} colspan="7" scope="colgroup">
                    {i18n.categoryLabel(group.category)}
                  </th>
                </tr>
                {#each group.algorithms as algorithm}
                  <tr>
                    <th class={bodyTh} scope="row">
                      <span class="text-[11.5px] font-bold text-text">
                        {i18n.algorithmName(algorithm.metadata.id)}
                      </span>
                      {#if algorithm.metadata.notes?.length}
                        <ul class="mt-1 mb-0 grid list-none gap-0.5 p-0">
                          {#each i18n.algorithmNotes(algorithm.metadata.id) as note}
                            <li
                              class="max-w-[30ch] text-[10px] leading-[1.4] font-normal whitespace-normal text-muted-2"
                            >
                              {note}
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    </th>
                    <td class="{bodyTd} mono text-muted">
                      {i18n.complexity(algorithm.metadata.bestTime)}
                    </td>
                    <td class="{bodyTd} mono text-muted">
                      {i18n.complexity(algorithm.metadata.averageTime)}
                    </td>
                    <td class="{bodyTd} mono text-muted">
                      {i18n.complexity(algorithm.metadata.worstTime)}
                    </td>
                    <td class="{bodyTd} mono text-muted">
                      {i18n.complexity(algorithm.metadata.spaceComplexity)}
                    </td>
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
