import { Platform } from 'react-native';
import { apiBaseUrl } from './profileService';

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export class MediaUploadError extends Error {
  constructor(public readonly code: string, public readonly status?: number, public readonly traceId?: string) {
    super(code);
    this.name = 'MediaUploadError';
  }
}

interface ApiResult<T> {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  size?: number;
}

export interface UploadAvatarOptions {
  /** Can be a File/Blob (Web), or a base64 data string ("data:image/jpeg;base64,..."), or remote URL */
  file: any;
  fileName?: string;
  accessToken: string;
  onProgress?: (progressPercent: number) => void;
}

/**
 * Fetches authentication parameters for ImageKit upload from ChargeOps backend.
 * Endpoint: GET /api/v1/media/imagekit-auth
 */
export async function getImageKitAuth(accessToken: string): Promise<ImageKitAuthParams> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/v1/media/imagekit-auth`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
  } catch (error) {
    throw new MediaUploadError(error instanceof Error && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new MediaUploadError(payload?.error?.code ?? payload?.code ?? 'SIGNATURE_UNAVAILABLE', response.status, payload?.error?.traceId ?? payload?.traceId ?? response.headers.get('X-Trace-Id') ?? undefined);
  }

  const payload = (await response.json().catch(() => null)) as ApiResult<ImageKitAuthParams> | null;
  if (payload?.error || !payload?.data) {
    throw new MediaUploadError(payload?.error?.code ?? 'INVALID_RESPONSE', response.status, response.headers.get('X-Trace-Id') ?? undefined);
  }

  return payload.data;
}

/**
 * Direct client-side upload to ImageKit CDN with progress tracking.
 */
export async function uploadAvatarToImageKit({
  file,
  fileName,
  accessToken,
  onProgress,
}: UploadAvatarOptions): Promise<ImageKitUploadResult> {
  // Step 1: Get auth credentials
  const auth = await getImageKitAuth(accessToken);

  // Step 2: Build FormData payload
  const resolvedFileName =
    fileName || `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

  const formData = new FormData();
  if (
    Platform.OS !== 'web' &&
    typeof file === 'string' &&
    (file.startsWith('file://') || file.startsWith('content://') || file.startsWith('/'))
  ) {
    formData.append('file', {
      uri: file,
      name: resolvedFileName,
      type: 'image/jpeg',
    } as any);
  } else {
    formData.append('file', file);
  }
  formData.append('fileName', resolvedFileName);
  formData.append('publicKey', auth.publicKey || '');
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('token', auth.token);
  formData.append('folder', '/chargeops/avatars');
  formData.append('useUniqueFileName', 'true');
  formData.append('tags', 'avatar,driver');

  // Step 3: Send XMLHttpRequest to track upload progress
  return new Promise<ImageKitUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
    xhr.timeout = 30_000;

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.url,
            fileId: res.fileId,
            name: res.name,
            size: res.size,
          });
        } catch {
          reject(new MediaUploadError('INVALID_RESPONSE', xhr.status));
        }
      } else {
        let code = 'PROVIDER_REJECTED';
        try {
          const errRes = JSON.parse(xhr.responseText);
          code = errRes.code ?? code;
        } catch {}
        reject(new MediaUploadError(code, xhr.status));
      }
    };

    xhr.onerror = () => {
      reject(new MediaUploadError('NETWORK_ERROR'));
    };
    xhr.ontimeout = () => reject(new MediaUploadError('TIMEOUT'));
    xhr.onabort = () => reject(new MediaUploadError('CANCELLED'));

    xhr.send(formData);
  });
}
