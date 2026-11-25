<script lang="ts">
  import Lock from '@lucide/svelte/icons/lock';
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
  import { app } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';
  import type { TranslationKey } from '../i18n/messages';
  import { theme } from '../theme/index.svelte';
  import { THEME_LIST, type ThemeId } from '../theme/palettes';

  let { onopenGuide }: { onopenGuide: () => void } = $props();

  const statusTone =
    'data-[tone=live]:border-focal/60 data-[tone=live]:text-focal data-[tone=paused]:border-rule-strong data-[tone=paused]:text-muted data-[tone=done]:border-accent/60 data-[tone=done]:text-accent data-[tone=error]:border-danger/60 data-[tone=error]:text-danger';
</script>

<header
  class="flex min-h-[58px] w-full flex-wrap items-center justify-between gap-4 gap-y-1.5 border-b border-rule bg-panel/90 px-6 py-2 backdrop-blur-[8px] narrow:gap-2 narrow:px-3.5 tiny:gap-1.5"
>
  <a
    class="inline-flex min-w-0 items-baseline gap-3 text-text no-underline hover:text-text"
    href="/"
    aria-label={i18n.t('app.homeLabel')}
  >
    <span class="text-[23px] font-bold tracking-[-0.02em] whitespace-nowrap tight:text-[18px]">
      PIXEL SORT
    </span>
    <span class="mono text-[11px] font-bold tracking-[0.14em] text-structure tight:hidden">
      {i18n.t('app.notebookTag')}
    </span>
  </a>

  <div
    class="flex min-w-0 flex-wrap items-center justify-end gap-2.5 gap-y-1.5 narrow:gap-1.5 tight:basis-full tight:justify-between tight:gap-1"
  >
    <span
      class="inline-flex items-center gap-1.5 mono text-[11px] font-bold tracking-[0.1em] text-muted-2 narrow:hidden [&_svg]:text-structure"
    >
      <Lock size={12} aria-hidden="true" focusable="false" />
      {i18n.t('common.local100')}
    </span>
    <span
      class="chip {statusTone} tiny:hidden"
      data-tone={app.statusTone}
      role="status"
      aria-live="polite"
    >
      <span
        class="size-1.5 rounded-full bg-current {app.isRunning ? 'animate-pulse-soft' : ''}"
        aria-hidden="true"
      ></span>
      {i18n.statusLabel(app.status)}
    </span>
    <button
      class="btn btn-small btn-ghost narrow:size-11 narrow:gap-0 narrow:p-0 narrow:text-[0px] tight:size-10 narrow:[&_svg]:size-4"
      type="button"
      onclick={onopenGuide}
    >
      <CircleQuestionMark size={15} aria-hidden="true" focusable="false" />
      {i18n.t('common.howWorks')}
    </button>
    <label class="sr-only" for="theme-select">{i18n.t('theme.label')}</label>
    <select
      id="theme-select"
      class="btn btn-small max-w-[150px] min-w-0 mono text-[11px] narrow:min-h-11 tight:max-w-[112px]"
      value={theme.current}
      onchange={(event) =>
        theme.setTheme((event.currentTarget as HTMLSelectElement).value as ThemeId)}
      aria-label={i18n.t('theme.label')}
    >
      {#each THEME_LIST as option}
        <option value={option.id}>{i18n.t(option.nameKey as TranslationKey)}</option>
      {/each}
    </select>
    <label class="sr-only" for="language-select">{i18n.t('language.label')}</label>
    <select
      id="language-select"
      class="btn btn-small max-w-[150px] min-w-0 mono text-[11px] narrow:min-h-11 tight:max-w-[112px]"
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
