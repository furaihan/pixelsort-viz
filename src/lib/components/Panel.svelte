<script lang="ts">
  // Shared panel shell for GranularitySelector and AlgorithmSelector.
  // Snippet-based: both renderers supply `title`/`chip` as slot content,
  // so there is no `inline` prop branching — the caller picks the variant.
  import type { Snippet } from 'svelte';

  let {
    title,
    chip,
    children,
    inline = false,
    labelledBy,
  }: {
    title: Snippet;
    chip?: Snippet;
    children: Snippet;
    inline?: boolean;
    labelledBy: string;
  } = $props();
</script>

<svelte:element
  this={inline ? 'div' : 'section'}
  class={inline ? 'grid content-start gap-2.5' : 'panel'}
  role={inline ? 'group' : undefined}
  aria-labelledby={labelledBy}
>
  <div class={inline ? 'flex items-center justify-between gap-2' : 'panel-head'}>
    {@render title()}
    {@render chip?.()}
  </div>

  <div class={inline ? 'grid' : 'panel-body'}>
    {@render children()}
  </div>
</svelte:element>
