/**
 * A locally generated sample poster. It gives first-time visitors something to
 * sort without uploading a file, and it is clearly labelled as a sample.
 */
export async function createSampleImage(): Promise<File> {
  const width = 1280;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable in this browser.');

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // A fallback face is fine for the sample.
    }
  }

  context.fillStyle = '#252729';
  context.fillRect(0, 0, width, height);

  // A faint print grid gives the sample a proof-sheet character.
  context.strokeStyle = 'rgba(156, 183, 197, 0.15)';
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 80) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 80) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
    context.stroke();
  }

  context.save();
  context.globalCompositeOperation = 'screen';

  // Coral field.
  context.fillStyle = '#E99588';
  context.beginPath();
  context.arc(930, 300, 270, 0, Math.PI * 2);
  context.fill();

  // Misty blue overprint.
  context.fillStyle = '#9CBBC5';
  context.save();
  context.translate(300, 300);
  context.rotate(-0.18);
  context.fillRect(-190, -190, 380, 380);
  context.restore();

  // Halftone dots.
  context.fillStyle = '#EAE2D8';
  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 14; column += 1) {
      const radius = 2 + ((row + column) % 4);
      context.beginPath();
      context.arc(760 + column * 30, 560 + row * 24, radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  // Registration bars.
  context.fillStyle = '#9CBBC5';
  context.fillRect(80, 650, 420, 10);
  context.fillRect(80, 676, 260, 10);
  context.restore();

  // Display type with a deliberate misregistration.
  context.font = '900 210px "Archivo Variable", Archivo, sans-serif';
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#9CBBC5';
  context.fillText('SORT', 78, 560);
  context.fillStyle = '#E99588';
  context.fillText('SORT', 70, 552);

  context.font = '700 26px "JetBrains Mono Variable", monospace';
  context.fillStyle = '#EAE2D8';
  context.fillText('WARM / MINIMAL', 82, 96);
  context.fillStyle = '#9CBBC5';
  context.fillText('WARM MINIMALIST — 01', 82, 132);

  context.font = '500 18px "JetBrains Mono Variable", monospace';
  context.fillStyle = '#EAE2D8';
  context.fillText('1280 × 800 / LOCAL SAMPLE', 82, 748);

  // A barcode-like block, drawn as geometry rather than a picture.
  context.fillStyle = '#9CBBC5';
  let x = 980;
  for (let i = 0; i < 34; i += 1) {
    const bar = 2 + ((i * 7) % 9);
    context.fillRect(x, 690, bar, 58);
    x += bar + 5;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The sample image could not be created.');
  return new File([blob], 'warm-minimalist-sample.png', { type: 'image/png' });
}
