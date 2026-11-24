<script lang="ts">
  import {
    createHotkeyRecorder,
    getAppHotkeys,
    getCustomHotkeys,
    getFormatForDisplay,
  } from '@tanstack/svelte-hotkeys';
  import type { AppHotkeyId } from '@tanstack/svelte-hotkeys';
  import { i18n } from '../i18n/index.svelte';

  let { id, label }: { id: AppHotkeyId; label: string } = $props();

  const formatForDisplay = getFormatForDisplay();
  const appHotkeys = getAppHotkeys();
  const customHotkeys = getCustomHotkeys();
  let rejection = $state('');
  let current = $derived(appHotkeys.current[id]);
  let isCustom = $derived(customHotkeys.current[id] !== undefined);

  const recorder = createHotkeyRecorder(() => ({
    maxSteps: Infinity,
    idleTimeoutMs: 900,
    detectConflicts: true,
    validate: (hotkey, context) => {
      const conflict = customHotkeys.findConflicts(id, hotkey, context)[0];
      return conflict ? `Used by ${conflict.meta?.name ?? conflict.id}` : true;
    },
    onRecord: (hotkey, context) => {
      const conflicts = customHotkeys.setCustomHotkey(id, hotkey, context);
      if (conflicts.length > 0) {
        rejection = `Used by ${conflicts[0]?.meta?.name ?? conflicts[0]?.id}`;
      } else {
        rejection = '';
      }
    },
    onReject: (result) => {
      rejection = result.message ?? i18n.t('hotkeys.recordingRejected');
    },
    onCancel: () => {
      rejection = '';
    },
  }));

  function displayHotkey(): string {
    if (recorder.isRecording) {
      return recorder.steps.length > 0
        ? formatForDisplay(recorder.steps)
        : i18n.t('hotkeys.pressKeys');
    }
    return current.hotkey ? formatForDisplay(current.hotkey) : i18n.t('hotkeys.unassigned');
  }
</script>

<div
  class="flex flex-wrap items-center justify-between gap-2 border-b border-rule py-2.5 last:border-b-0"
>
  <div class="grid min-w-0 gap-0.5">
    <span class="text-[12px] font-semibold text-text">{label}</span>
    {#if rejection}
      <span class="text-[11px] text-danger" role="alert">{rejection}</span>
    {/if}
  </div>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <kbd class="chip min-w-[72px] justify-center text-center">{displayHotkey()}</kbd>
    {#if recorder.isRecording}
      <button class="btn btn-small btn-ghost" type="button" onclick={recorder.cancelRecording}>
        {i18n.t('common.dismiss')}
      </button>
    {:else}
      <button class="btn btn-small btn-ghost" type="button" onclick={recorder.startRecording}>
        {i18n.t('hotkeys.change')}
      </button>
    {/if}
    <button
      class="btn btn-small btn-ghost"
      type="button"
      onclick={() => customHotkeys.resetCustomHotkey(id)}
      disabled={!isCustom}
    >
      {i18n.t('hotkeys.reset')}
    </button>
  </div>
</div>
