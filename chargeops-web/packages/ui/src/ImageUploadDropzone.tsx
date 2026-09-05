import React, { useState, useRef } from 'react';
import { Button } from './Button';

export interface ImageUploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
}

export interface ImageUploadDropzoneProps {
  onSuccess: (result: ImageUploadResult) => void;
  onError?: (error: Error) => void;
  getAuthParams: () => Promise<{
    token: string;
    expire: number;
    signature: string;
    publicKey?: string;
    urlEndpoint?: string;
  }>;
  folder?: string;
  tags?: string[];
  maxSizeMb?: number;
  className?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onSuccess,
  onError,
  getAuthParams,
  folder = '/chargeops/stations',
  tags = ['station'],
  maxSizeMb = 5,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      const err = 'Chỉ chấp nhận các tệp hình ảnh (JPG, PNG, WebP).';
      setErrorMessage(err);
      onError?.(new Error(err));
      return;
    }

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      const err = `Dung lượng tệp vượt quá ${maxSizeMb}MB.`;
      setErrorMessage(err);
      onError?.(new Error(err));
      return;
    }

    // Create local preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Fetch signature from Backend
      const auth = await getAuthParams();

      // Step 2: Upload directly to ImageKit API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name.replace(/\s+/g, '_'));
      formData.append('publicKey', auth.publicKey || '');
      formData.append('signature', auth.signature);
      formData.append('expire', String(auth.expire));
      formData.append('token', auth.token);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');
      if (tags.length > 0) {
        formData.append('tags', tags.join(','));
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              onSuccess({
                url: res.url,
                fileId: res.fileId,
                name: res.name,
                size: res.size,
              });
              setIsUploading(false);
              setPreviewUrl(null);
              resolve();
            } catch (err) {
              reject(new Error('Phản hồi từ ImageKit không hợp lệ.'));
            }
          } else {
            let detail = 'Tải ảnh lên ImageKit thất bại';
            try {
              const errRes = JSON.parse(xhr.responseText);
              detail = errRes.message || detail;
            } catch {}
            reject(new Error(detail));
          }
        };

        xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải ảnh lên.'));
        xhr.send(formData);
      });
    } catch (err: any) {
      const msg = err?.message || 'Tải ảnh thất bại.';
      setErrorMessage(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
    // reset input value so re-uploading same file triggers change
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-owner bg-owner-soft/60'
            : 'border-line hover:border-owner/60 bg-surface-2/60 hover:bg-surface-2'
        } ${isUploading ? 'pointer-events-none opacity-90' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs text-center py-2">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg shadow-sm border border-line"
              />
            )}
            <div className="w-full bg-chip rounded-full h-2 overflow-hidden">
              <div
                className="bg-owner h-2 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-ink">
              Đang tải lên ImageKit... {progress}%
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-owner-soft text-owner flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-ink">
                Kéo thả ảnh vào đây hoặc bấm để chọn ảnh
              </span>
              <p className="text-xs text-muted mt-0.5">
                PNG, JPG hoặc WebP (Tối đa {maxSizeMb}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="text-xs text-bad font-medium px-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {errorMessage}
        </div>
      )}
    </div>
  );
};
