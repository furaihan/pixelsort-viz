<script lang="ts">
  export type IconName =
    | 'upload'
    | 'play'
    | 'pause'
    | 'step'
    | 'reset'
    | 'shuffle'
    | 'image'
    | 'lock'
    | 'info'
    | 'x'
    | 'check'
    | 'alert'
    | 'chevron-down'
    | 'arrow-right'
    | 'grid'
    | 'layers'
    | 'sparkles'
    | 'eye'
    | 'eye-off'
    | 'help'
    | 'trash'
    | 'clock'
    | 'swap'
    | 'compare'
    | 'write'
    | 'pivot'
    | 'sorted'
    | 'read'
    | 'pass'
    | 'range'
    | 'key'
    | 'barcode'
    | 'code';

  let {
    name,
    size = 18,
    strokeWidth = 1.8,
    className = '',
  }: {
    name: IconName;
    size?: number;
    strokeWidth?: number;
    className?: string;
  } = $props();
</script>

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'upload'}
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M5 20h14" />
  {:else if name === 'play'}
    <path d="M8 5v14l11-7z" />
  {:else if name === 'pause'}
    <path d="M9 5v14" />
    <path d="M15 5v14" />
  {:else if name === 'step'}
    <path d="M5 5v14l9-7z" />
    <path d="M19 5v14" />
  {:else if name === 'reset'}
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v6h6" />
  {:else if name === 'shuffle'}
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="m4 4 5 5" />
  {:else if name === 'image'}
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 15-5-5L5 21" />
  {:else if name === 'lock'}
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  {:else if name === 'info'}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  {:else if name === 'x'}
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  {:else if name === 'check'}
    <path d="m5 12 4 4L19 6" />
  {:else if name === 'alert'}
    <path d="M12 3 2 21h20L12 3z" />
    <path d="M12 9v5" />
    <path d="M12 17h.01" />
  {:else if name === 'chevron-down'}
    <path d="m6 9 6 6 6-6" />
  {:else if name === 'arrow-right'}
    <path d="M4 12h16" />
    <path d="m14 6 6 6-6 6" />
  {:else if name === 'grid'}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  {:else if name === 'layers'}
    <path d="m12 3 9 5-9 5-9-5 9-5z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  {:else if name === 'sparkles'}
    <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
  {:else if name === 'eye'}
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  {:else if name === 'eye-off'}
    <path d="m3 3 18 18" />
    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
    <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2" />
    <path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.1-.8" />
  {:else if name === 'help'}
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.7 1.2-1.7 2.7" />
    <path d="M12 17h.01" />
  {:else if name === 'trash'}
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  {:else if name === 'swap'}
    <path d="M7 4 3 8l4 4" />
    <path d="M3 8h14" />
    <path d="m17 20 4-4-4-4" />
    <path d="M21 16H7" />
  {:else if name === 'compare'}
    <path d="M8 4v16" />
    <path d="M16 4v16" />
    <path d="M4 8h8" />
    <path d="M12 16h8" />
  {:else if name === 'write'}
    <path d="M4 20h4l10-10-4-4L4 16v4z" />
    <path d="m13 5 4 4" />
  {:else if name === 'pivot'}
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
  {:else if name === 'sorted'}
    <path d="m4 12 5 5L20 6" />
  {:else if name === 'read'}
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  {:else if name === 'pass'}
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  {:else if name === 'range'}
    <path d="M4 7v10" />
    <path d="M20 7v10" />
    <path d="M8 12h8" />
  {:else if name === 'key'}
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9" />
    <path d="m17 6 3 3" />
  {:else if name === 'barcode'}
    <path d="M4 5v14" />
    <path d="M8 5v14" />
    <path d="M11 5v14" />
    <path d="M15 5v14" />
    <path d="M18 5v14" />
    <path d="M21 5v14" />
  {:else if name === 'code'}
    <path d="m8 6-6 6 6 6" />
    <path d="m16 6 6 6-6 6" />
  {/if}
</svg>
