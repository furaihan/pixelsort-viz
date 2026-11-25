import type { Attachment } from 'svelte/attachments';
import { app } from '../stores/appState.svelte';
import { CanvasRenderer } from '../core/visualization/CanvasRenderer';
import { theme } from '../theme/index.svelte';
import { getCanvasPalette } from '../theme/palettes';

/**
 * Attaches the imperative `CanvasRenderer` to the specimen wrapper.
 * The renderer needs the two canvases + wrapper from the DOM, so an
 * `{@attach}` (lifecycle follows the element) replaces the old
 * `onMount(() => { new CanvasRenderer(); ... })` block exactly.
 */
export function canvasRenderer(node: HTMLElement): () => void {
  const mainCanvas = node.querySelector<HTMLCanvasElement>('canvas[data-canvas-main]');
  const overlayCanvas = node.querySelector<HTMLCanvasElement>('canvas[data-canvas-overlay]');
  if (!mainCanvas || !overlayCanvas) return () => {};

  const renderer = new CanvasRenderer();
  renderer.attach(mainCanvas, overlayCanvas, node);
  renderer.setPalette(getCanvasPalette(theme.current));
  app.attachRenderer(renderer);

  return () => {
    app.detachRenderer();
  };
}

/** Attachment shorthand for `<div {@attach canvasRenderer}>`. */
export const canvasRendererAttachment: Attachment<HTMLElement> = canvasRenderer;
