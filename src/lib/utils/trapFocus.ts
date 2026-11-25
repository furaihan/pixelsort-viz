import type { Attachment } from 'svelte/attachments';

/**
 * Keeps Tab focus inside a `<dialog>`-like container. The native `:dialog`
 * trap can leak a stop onto `<body>` once per lap (Chromium + scrollable
 * region), so wrap at the boundaries instead.
 */
export function trapFocus(node: HTMLElement): () => void {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      node.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || active === node) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || active === node) {
      event.preventDefault();
      first.focus();
    }
  };
  node.addEventListener('keydown', onKeydown);
  return () => node.removeEventListener('keydown', onKeydown);
}

/** Attachment shorthand for `<div {@attach trapFocus}>`. */
export const trapFocusAttachment: Attachment<HTMLElement> = trapFocus;

/**
 * Focus the first focusable descendant, if any. Used by the dialog `onkeydown`
 * comments in Guide/Preset after the attachment replaces the copied trap.
 */
export function focusFirst(root: HTMLElement): void {
  root.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )?.focus();
}
