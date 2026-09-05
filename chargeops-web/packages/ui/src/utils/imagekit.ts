/**
 * ImageKit transformation options according to official ImageKit URL transformation documentation.
 */
export interface ImageKitTransformOptions {
  width?: number | string;
  height?: number | string;
  quality?: number | string;
  cropMode?: 'maintain_ratio' | 'at_least' | 'pad_resize' | 'extract' | 'force';
  focus?: 'auto' | 'face' | 'center' | 'top' | 'left' | 'bottom' | 'right';
  blur?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  rawTransform?: string;
}

/**
 * Builds an optimized ImageKit URL with real-time transformation parameters.
 * Uses query parameter `?tr=` syntax which works universally on all ImageKit URLs.
 */
export function buildImageKitUrl(
  url: string | undefined | null,
  options?: ImageKitTransformOptions
): string {
  if (!url || typeof url !== 'string') return '';
  if (!options) return url;

  // If not an ImageKit URL, return original
  if (!url.includes('ik.imagekit.io')) {
    return url;
  }

  const parts: string[] = [];

  if (options.width) parts.push(`w-${options.width}`);
  if (options.height) parts.push(`h-${options.height}`);
  if (options.quality) parts.push(`q-${options.quality}`);
  if (options.blur) parts.push(`bl-${options.blur}`);
  if (options.focus) parts.push(`fo-${options.focus}`);
  if (options.format) parts.push(`f-${options.format}`);

  if (options.cropMode) {
    const cropMap: Record<string, string> = {
      maintain_ratio: 'c-maintain_ratio',
      at_least: 'c-at_least',
      pad_resize: 'c-pad_resize',
      extract: 'cm-extract',
      force: 'c-force',
    };
    parts.push(cropMap[options.cropMode] || 'c-maintain_ratio');
  }

  if (options.rawTransform) {
    parts.push(options.rawTransform);
  }

  if (parts.length === 0) return url;

  const trString = parts.join(',');
  const [base, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');
  params.set('tr', trString);

  return `${base}?${params.toString()}`;
}

/**
 * Generates an ultra-lightweight Low Quality Image Placeholder (LQIP) URL for progressive blur-up loading.
 */
export function buildImageKitLqipUrl(url: string | undefined | null): string {
  return buildImageKitUrl(url, {
    width: 30,
    quality: 20,
    blur: 6,
    format: 'webp',
  });
}
