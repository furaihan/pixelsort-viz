<script lang="ts">
  import { createHotkey } from '@tanstack/svelte-hotkeys';

  let { onclose }: { onclose: () => void } = $props();

  // This component is mounted inside GuideDialog's exclusive provider, so
  // Escape belongs to the guide scope and cannot leak to page-level hotkeys.
  createHotkey('Escape', () => onclose());
</script>
