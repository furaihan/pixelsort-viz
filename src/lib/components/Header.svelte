<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';

  let { onopenGuide }: { onopenGuide: () => void } = $props();

  const statusTone =
    'data-[tone=live]:border-lime/50 data-[tone=live]:text-lime data-[tone=paused]:border-bubblegum/60 data-[tone=paused]:text-muted data-[tone=done]:border-lime/50 data-[tone=done]:text-lime data-[tone=error]:border-danger/50 data-[tone=error]:text-danger';
</script>

<header
  class="flex min-h-16 w-full items-center justify-between gap-[18px] border-b border-line bg-ink/92 px-6 py-2.5 backdrop-blur-[12px] narrow:px-3.5"
>
  <a
    class="inline-flex items-center gap-[11px] text-text no-underline hover:text-text"
    href="/"
    aria-label={i18n.t('app.homeLabel')}
  >
    <span class="relative block size-[30px] flex-none" aria-hidden="true">
      <span class="absolute top-0 left-0 size-5 border-2 border-ink bg-lime"></span>
      <span class="absolute right-0 bottom-0 size-5 border-2 border-ink bg-pink mix-blend-screen"
      ></span>
    </span>
    <span class="grid gap-px leading-none">
      <span class="text-[17px] font-black tracking-[-0.025em]">PIXEL SORT</span>
      <span class="font-mono text-[8px] font-bold tracking-[0.24em] text-muted tight:hidden">
        VISUALIZER
      </span>
    </span>
  </a>

  <div class="flex items-center gap-2.5 tight:gap-1.5">
    <span
      class="inline-flex items-center gap-[5px] mono text-[9px] font-bold tracking-[0.1em] text-muted narrow:hidden [&_svg]:text-muted-2"
    >
      <Icon name="lock" size={12} />
      {i18n.t('common.local100')}
    </span>
    <span
      class="group inline-flex min-h-[26px] items-center gap-1.5 rounded-full border border-line-strong px-[9px] mono text-[9px] font-bold tracking-[0.1em] text-muted tight:gap-1 tight:px-[5px] tight:text-[8px] {statusTone}"
      data-tone={app.statusTone}
      role="status"
      aria-live="polite"
    >
      <span
        class="size-1.5 rounded-full bg-current group-data-[tone=live]:animate-pulse-soft"
        aria-hidden="true"
      ></span>
      {i18n.statusLabel(app.status)}
    </span>
    <button
      class="btn btn-small btn-ghost narrow:w-[34px] narrow:gap-0 narrow:p-0 narrow:text-[0px] narrow:[&_svg]:size-4"
      type="button"
      onclick={onopenGuide}
    >
      <Icon name="help" size={15} />
      {i18n.t('common.howWorks')}
    </button>
    <label class="sr-only" for="language-select">{i18n.t('language.label')}</label>
    <select
      id="language-select"
      class="min-h-[34px] max-w-[145px] rounded-[7px] border border-line-strong bg-ink-3 px-2 text-[10px] font-bold text-muted hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime tight:max-w-[78px] tight:px-1.5 tight:text-[9px]"
      value={i18n.locale}
      onchange={(event) =>
        i18n.setLocale((event.currentTarget as HTMLSelectElement).value as 'en' | 'id')}
      aria-label={i18n.t('language.label')}
    >
      <option value="en">{i18n.t('language.english')}</option>
      <option value="id">{i18n.t('language.indonesian')}</option>
    </select>
  </div>
</header>
