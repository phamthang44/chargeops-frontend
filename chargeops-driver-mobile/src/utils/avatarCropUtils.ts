/**
 * Constants and utility functions for avatar interactive cropping and offscreen canvas export.
 */

export const CROP_STAGE_SIZE = 300;
export const CROP_CIRCLE_DIAMETER = 220;
export const CROP_RADIUS = CROP_CIRCLE_DIAMETER / 2;
export const CROP_CENTER = CROP_STAGE_SIZE / 2;
export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 2.5;

export interface CropOffset {
  x: number;
  y: number;
}

/**
 * Calculates a sensible initial offset for portrait images
 * so the person's face/eyes (typically in the upper 25-35%) are centered inside the circle.
 */
export function calculateInitialOffset(aspect: number): CropOffset {
  if (aspect < 0.95 && aspect > 0) {
    const baseHeight = CROP_CIRCLE_DIAMETER / aspect;
    const diffH = baseHeight - CROP_CIRCLE_DIAMETER;
    return { x: 0, y: Math.round(diffH * 0.32) };
  }
  return { x: 0, y: 0 };
}

/**
 * Offscreen Canvas Crop for Web:
 * Renders the chosen image onto a square 1:1 canvas applying user zoom and pan offsets,
 * then returns a JPEG Blob ready for ImageKit upload.
 */
export function cropImageToBlob(
  imageSource: string,
  aspect: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
  outputSize = 400,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Canvas not supported in this environment'));
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context is null'));
          return;
        }

        // Fill background with white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outputSize, outputSize);

        // Scale factor between Canvas output (400px) and UI crop circle (220px)
        const scaleFactor = outputSize / CROP_CIRCLE_DIAMETER;

        const baseW = aspect >= 1 ? outputSize * aspect : outputSize;
        const baseH = aspect >= 1 ? outputSize : outputSize / aspect;

        const drawW = baseW * zoom;
        const drawH = baseH * zoom;

        const posX = (outputSize - drawW) / 2 + offsetX * scaleFactor;
        const posY = (outputSize - drawH) / 2 + offsetY * scaleFactor;

        ctx.drawImage(img, posX, posY, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob returned null'));
          },
          'image/jpeg',
          0.92,
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Không thể tải ảnh để cắt'));
    img.src = imageSource;
  });
}
