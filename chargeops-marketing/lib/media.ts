const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL?.trim().replace(/\/+$/, "") ?? "";

/** Resolve a public media key to the configured R2 custom domain. */
export function mediaAsset(key: string): string {
  if (/^(https?:|data:|blob:)/i.test(key)) return key;
  const normalizedKey = key.replace(/^\/+/, "");
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}/${normalizedKey}` : "";
}
