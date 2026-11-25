<script lang="ts">
  import PlaybackActions from './PlaybackActions.svelte';
  import PlaybackSettings from './PlaybackSettings.svelte';
  import { i18n } from '../i18n/index.svelte';

  let {
    inline = false,
    zone = 'full',
  }: { inline?: boolean; zone?: 'full' | 'actions' | 'settings' } = $props();

  let showActions = $derived(zone === 'full' || zone === 'actions');
  let showSettings = $derived(zone === 'full' || zone === 'settings');
</script>

<svelte:element
  this={inline ? 'div' : 'section'}
  class={inline ? 'grid content-start gap-3' : 'grid gap-3 panel p-3'}
  role={inline ? 'group' : undefined}
  aria-label={i18n.t('playback.title')}
>
  {#if showActions}
    <PlaybackActions />
  {/if}

  {#if showSettings}
    <PlaybackSettings showHotkeys={!inline} />
  {/if}
</svelte:element>
