import { Platform } from 'react-native';

import type { UpdateUserProfileRequest, UserProfile } from '@/types';

interface ApiValidationFailure {
  messageKey?: string;
  message?: string;
}

interface ApiErrorDetail {
  code?: string;
  messageKey?: string;
  message?: string;
  traceId?: string;
  details?: Record<string, ApiValidationFailure | string>;
}

interface ApiResult<T> {
  data?: T;
  error?: ApiErrorDetail;
}

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export const apiBaseUrl =
  configuredBaseUrl ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8081' : 'http://localhost:8081');

export class ProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly messageKey?: string,
    readonly details?: Record<string, ApiValidationFailure | string>,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ProfileApiError';
  }

  fieldMessage(field: string): string | undefined {
    const failure = this.details?.[field];
    if (typeof failure === 'string') return failure;
    return failure?.message;
  }
}

async function profileRequest(
  accessToken: string,
  init?: RequestInit,
): Promise<UserProfile> {
  const response = await fetch(`${apiBaseUrl}/api/v1/me/profile`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const rawBody = await response.text();
  let payload: ApiResult<UserProfile> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as ApiResult<UserProfile>;
    } catch {
      throw new ProfileApiError(
        `Profile API returned an invalid response (${response.status}).`,
        response.status,
      );
    }
  }

  if (!response.ok || payload.error) {
    const error = payload.error;
    throw new ProfileApiError(
      error?.message ?? `Profile request failed (${response.status}).`,
      response.status,
      error?.code,
      error?.messageKey,
      error?.details,
      error?.traceId,
    );
  }

  if (!payload.data) {
    throw new ProfileApiError('Profile response did not contain data.', response.status);
  }

  return payload.data;
}

export function getCurrentProfile(accessToken: string): Promise<UserProfile> {
  return profileRequest(accessToken);
}

export function updateCurrentProfile(
  accessToken: string,
  request: UpdateUserProfileRequest,
): Promise<UserProfile> {
  return profileRequest(accessToken, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function updateProfileAvatar(
  accessToken: string,
  avatarUrl: string | null,
  avatarStorageKey?: string | null,
  currentProfile?: UserProfile | null,
): Promise<UserProfile> {
  return updateCurrentProfile(accessToken, {
    displayName: currentProfile?.displayName || 'ChargeOps Driver',
    phone: currentProfile?.phone || '',
    avatarUrl: avatarUrl ?? '',
    avatarStorageKey: avatarStorageKey ?? '',
  });
}

