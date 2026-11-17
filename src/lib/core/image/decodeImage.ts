import type { ImageSource } from './imageTypes';

export const MAX_IMAGE_PIXELS = 20_000_000;
export const WARN_IMAGE_PIXELS = 8_000_000;
export const MAX_IMAGE_BYTES = 40 * 1024 * 1024;

const SUPPORTED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const SUPPORTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

export class ImageLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageLoadError';
  }
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

function validateFile(file: File): void {
  if (file.size === 0) {
    throw new ImageLoadError('That file is empty. Choose a PNG, JPEG, or WebP image.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageLoadError(
      `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 40 MB.`,
    );
  }
  const mime = file.type.toLowerCase();
  if (!SUPPORTED_MIME.has(mime) && !SUPPORTED_EXTENSIONS.has(extensionOf(file.name))) {
    throw new ImageLoadError('That file is not a PNG, JPEG, or WebP image. Try another file.');
  }
}

/**
 * Decode locally with the browser's own image pipeline. The decoded RGBA
 * buffer is the source of truth for every tile and every render.
 */
export async function decodeImageFile(file: File): Promise<ImageSource> {
  validateFile(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageLoadError(
      'The image could not be decoded. It may be corrupted or use an unsupported encoding.',
    );
  }

  try {
    const { width, height } = bitmap;
    if (width <= 0 || height <= 0) {
      throw new ImageLoadError('The image has no usable dimensions.');
    }
    if (width * height > MAX_IMAGE_PIXELS) {
      throw new ImageLoadError(
        `That image is ${((width * height) / 1_000_000).toFixed(1)} MP. The limit is 20 MP. Try a smaller image.`,
      );
    }

    let context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(width, height);
      context = canvas.getContext('2d', { alpha: true });
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      context = canvas.getContext('2d', { alpha: true });
    }
    if (!context) {
      throw new ImageLoadError('This browser could not create a canvas for the image.');
    }
    context.drawImage(bitmap, 0, 0);
    const imageData = context.getImageData(0, 0, width, height);

    return {
      width,
      height,
      data: imageData.data,
      fileName: file.name || 'untitled image',
      fileSize: file.size,
      mimeType: file.type || 'image/*',
    };
  } finally {
    bitmap.close();
  }
}
