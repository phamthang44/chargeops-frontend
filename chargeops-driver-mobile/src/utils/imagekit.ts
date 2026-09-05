export interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  blur?: number;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'auto' | 'face' | 'center' | 'top' | 'bottom' | string;
}

/**
 * Builds an optimized ImageKit transformation URL.
 * Appends or updates `tr=w-...,h-...,q-...` query parameters for ImageKit-served images.
 * If the URL is external or not an ImageKit URL, returns the original URL safely.
 */
export function buildImageKitUrl(
  rawUrl?: string | null,
  options: ImageKitTransformOptions = {},
): string {
  if (!rawUrl) return '';

  const trParts: string[] = [];
  if (options.width) trParts.push(`w-${Math.round(options.width)}`);
  if (options.height) trParts.push(`h-${Math.round(options.height)}`);
  if (options.quality) trParts.push(`q-${options.quality}`);
  if (options.format) trParts.push(`f-${options.format}`);
  if (options.blur) trParts.push(`bl-${options.blur}`);
  if (options.crop) trParts.push(`c-${options.crop}`);
  if (options.focus) trParts.push(`fo-${options.focus}`);

  if (trParts.length === 0) return rawUrl;

  const trParam = `tr=${trParts.join(',')}`;

  if (rawUrl.includes('ik.imagekit.io')) {
    const [baseUrl, query] = rawUrl.split('?');
    if (!query) {
      return `${baseUrl}?${trParam}`;
    }
    const params = query.split('&').filter((p) => !p.startsWith('tr='));
    params.push(trParam);
    return `${baseUrl}?${params.join('&')}`;
  }

  return rawUrl;
}

/**
 * Convenience helper for thumbnails (e.g. Station list card)
 */
export function getStationThumbUrl(url?: string | null, size = 160): string {
  return buildImageKitUrl(url, {
    width: size,
    height: size,
    quality: 80,
    crop: 'maintain_ratio',
    format: 'auto',
  });
}

/**
 * Convenience helper for hero images (e.g. Station detail screen)
 */
export function getStationHeroUrl(url?: string | null, width = 750): string {
  return buildImageKitUrl(url, {
    width,
    quality: 85,
    crop: 'maintain_ratio',
    format: 'auto',
  });
}

/**
 * Convenience helper for user / driver avatars with automatic face-detection crop.
 * Uses ImageKit's `fo-face` smart crop to focus on the person's face regardless
 * of the original photo's aspect ratio or subject position.
 */
export function getAvatarUrl(url?: string | null, size = 160): string {
  return buildImageKitUrl(url, {
    width: size,
    height: size,
    quality: 85,
    crop: 'maintain_ratio',
    focus: 'face',
    format: 'auto',
  });
}
