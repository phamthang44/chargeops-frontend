import { mediaAsset } from "@/lib/media";

/** Public walkthrough URLs used by both landing-page video players (80s HD Master). */
export const WALKTHROUGH_VIDEO_URLS = {
  en: "https://media.chargeops.online/videos/chargeops-master-walkthrough-80s-v2-en.mp4",
  vi: "https://media.chargeops.online/videos/chargeops-master-walkthrough-80s-v2-vi.mp4",
} as const;

export function getWalkthroughVideoUrl(locale: string): string {
  const isEn = locale === "en";
  const envUrl = isEn
    ? process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_VIDEO_EN_URL
    : process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_VIDEO_VI_URL;
  if (envUrl) return envUrl;

  const key = isEn
    ? "videos/chargeops-master-walkthrough-80s-v2-en.mp4"
    : "videos/chargeops-master-walkthrough-80s-v2-vi.mp4";

  return mediaAsset(key) || `/${key}`;
}

