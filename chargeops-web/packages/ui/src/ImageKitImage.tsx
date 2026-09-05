import React, { useState } from 'react';
import { buildImageKitUrl, buildImageKitLqipUrl, type ImageKitTransformOptions } from './utils/imagekit';

export interface ImageKitImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  transformation?: ImageKitTransformOptions;
  lqip?: boolean;
  fallbackIcon?: React.ReactNode;
}

export const ImageKitImage: React.FC<ImageKitImageProps> = ({
  src,
  alt = 'Image',
  transformation,
  lqip = true,
  className = '',
  style,
  fallbackIcon,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 rounded-lg ${className}`}
        style={style}
      >
        {fallbackIcon || (
          <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            <svg
              className="w-8 h-8 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[11px] font-medium opacity-60">Không có ảnh</span>
          </div>
        )}
      </div>
    );
  }

  const optimizedUrl = buildImageKitUrl(src, transformation);
  const lqipUrl = lqip ? buildImageKitLqipUrl(src) : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Progressive blurred placeholder */}
      {lqipUrl && !loaded && (
        <img
          src={lqipUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105 pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main high-quality transformed image */}
      <img
        src={optimizedUrl}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...rest}
      />
    </div>
  );
};
