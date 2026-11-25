/**
 * Responsive breakpoints — single source, mirroring the Tailwind custom
 * variants in `app.css` (`shell`/`compact`/`narrow`/…). Components read a
 * reactive boolean via `initialBreakpoint` + `$effect`-less `$derived`, or
 * via the `matchMediaSync` attachment for CSS-driven collapse.
 */
export const BREAKPOINTS = {
  shell: '(max-width: 1100px)',
  narrow: '(max-width: 760px)',
  compact: '(max-width: 700px)',
  tight: '(max-width: 480px)',
  tiny: '(max-width: 380px)',
  short: '(max-height: 820px)',
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/** SSR-safe initial value for a breakpoint. */
export function initialBreakpoint(name: BreakpointName): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(BREAKPOINTS[name]).matches;
}

/**
 * Svelte attachment: mirror a media query onto the element as
 * `data-<name>-matches="true|false"`, so CSS can react without a
 * component-level `$state` + listener round-trip.
 */
export function matchMediaSync(node: HTMLElement, name: BreakpointName): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(BREAKPOINTS[name]);
  const update = () => (node.dataset[`${name}Matches`] = String(mq.matches));
  update();
  mq.addEventListener('change', update);
  return () => mq.removeEventListener('change', update);
}
