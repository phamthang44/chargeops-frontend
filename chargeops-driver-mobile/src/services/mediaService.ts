import { Platform } from 'react-native';
import { apiBaseUrl } from './profileService';

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
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
  const response = await fetch(`${apiBaseUrl}/api/v1/media/imagekit-auth`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể lấy chữ ký tải ảnh (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as ApiResult<ImageKitAuthParams>;
  if (payload.error || !payload.data) {
    throw new Error(payload.error?.message || 'Không thể lấy thông tin xác thực ảnh.');
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
  formData.append('file', file);
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
          reject(new Error('Phản hồi từ máy chủ tải ảnh không hợp lệ.'));
        }
      } else {
        let msg = 'Tải ảnh đại diện lên thất bại.';
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.message) msg = errRes.message;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Lỗi kết nối mạng trong quá trình tải ảnh lên.'));
    };

    xhr.send(formData);
  });
}
