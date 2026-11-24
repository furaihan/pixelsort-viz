<script lang="ts">
  import { getAppHotkeyList, getFormatForDisplay } from '@tanstack/svelte-hotkeys';
  import { i18n } from '../i18n/index.svelte';
  import type { TranslationKey } from '../i18n/messages';

  const formatForDisplay = getFormatForDisplay();
  const appHotkeyList = getAppHotkeyList();

  const labels: Record<string, TranslationKey> = {
    'playback.toggle': 'hotkeys.playPause',
    'playback.step': 'hotkeys.nextOperation',
    'playback.reset': 'hotkeys.resetShuffle',
    'guide.open': 'hotkeys.openGuide',
    'guide.openSequence': 'hotkeys.openGuideSequence',
  };
</script>

<div class="flex flex-wrap gap-x-3.5 gap-y-1 mono">
  {#each appHotkeyList.current as item}
    {#if item.appHotkey.hotkey}
      <span>
        {i18n.t(labels[item.appHotkey.id] ?? 'hotkeys.keyboardShortcuts')}
        <kbd class="ml-1 text-text">{formatForDisplay(item.appHotkey.hotkey)}</kbd>
      </span>
    {/if}
  {/each}
</div>
