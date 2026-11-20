<script lang="ts">
  import Icon from './Icon.svelte';
  import { app } from '../stores/appState.svelte';
  import { i18n } from '../i18n/index.svelte';

  const swatch =
    'relative inline-flex h-3 w-[18px] flex-none items-center justify-center rounded-[2px] border mono text-[10px] font-bold';

  const logTypeTone =
    'data-[type=compare]:text-focal data-[type=swap]:text-focal data-[type=write]:text-muted data-[type=pivot]:text-focal data-[type=sorted]:text-accent data-[type=complete]:text-accent';
</script>

<section class="panel" aria-labelledby="inspector-title">
  <div class="panel-head">
    <h2 class="panel-title" id="inspector-title">
      <Icon name="compare" size={16} />
      {i18n.t('inspector.marginTitle')}
    </h2>
    <span class="chip">{i18n.statusLabel(app.status)}</span>
  </div>

  <div class="panel-body">
    <p class="m-0 text-[11px] leading-[1.45] text-muted">
      {i18n.t('inspector.keyNote')}
    </p>

    <div
      class="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-2 border-t border-rule pt-3 tight:grid-cols-2"
      aria-label={i18n.t('inspector.legend')}
    >
      <div class="flex items-center gap-1.5 text-[11px] text-muted">
        <span
          class="{swatch} border-accent after:absolute after:inset-[2px_-2px_-2px_2px] after:rounded-[2px] after:border after:border-dashed after:border-focal after:content-['']"
          aria-hidden="true"
        ></span>
        <span>{i18n.t('inspector.compare')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-muted">
        <span
          class="{swatch} border-accent after:absolute after:-right-[3px] after:-bottom-[3px] after:size-[6px] after:rounded-[1px] after:bg-focal after:content-['']"
          aria-hidden="true"
        ></span>
        <span>{i18n.t('inspector.swap')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-muted">
        <span class="{swatch} border-dotted border-structure" aria-hidden="true"></span>
        <span>{i18n.t('inspector.write')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-muted">
        <span class="{swatch} border-dashed border-focal text-focal" aria-hidden="true">P</span>
        <span>{i18n.t('inspector.pivot')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-muted">
        <span class="{swatch} border-accent text-accent" aria-hidden="true">
          <Icon name="check" size={10} />
        </span>
        <span>{i18n.t('inspector.sorted')}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[11px] text-muted">
        <span
          class="{swatch} border-transparent after:size-[5px] after:rounded-full after:bg-structure after:content-['']"
          aria-hidden="true"
        ></span>
        <span>{i18n.t('inspector.read')}</span>
      </div>
    </div>

    <div class="mt-3 border-t border-rule pt-3">
      <span class="label">{i18n.t('inspector.recent')}</span>
      {#if app.eventLog.length > 0}
        <ol class="mt-2 mb-0 grid list-none gap-[5px] p-0">
          {#each app.eventLog as entry (entry.id)}
            <li class="flex min-w-0 items-baseline gap-[7px]">
              <span
                class="w-14 flex-none mono text-[10px] font-bold tracking-[0.04em] text-muted-2 uppercase {logTypeTone}"
                data-type={entry.type}
              >
                {i18n.logToken(entry.type)}
              </span>
              <span class="truncate text-[11px] text-muted">{i18n.text(entry.text)}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="mt-2 text-[11px] leading-[1.45] text-muted-2">
          {i18n.t('inspector.empty')}
        </p>
      {/if}
    </div>
  </div>
</section>
