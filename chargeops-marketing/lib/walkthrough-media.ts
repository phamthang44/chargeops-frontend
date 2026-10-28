import { mediaAsset } from "@/lib/media";

/** Public walkthrough URLs used by both landing-page video players. */
export const WALKTHROUGH_VIDEO_URLS = {
  en: "https://media.chargeops.online/videos/chargeops-launch-v7-hyperframes-en.mp4",
  vi: "https://media.chargeops.online/videos/chargeops-launch-v7-hyperframes-vi.mp4",
} as const;

export function getWalkthroughVideoUrl(locale: string): string {
  return locale === "en" ? WALKTHROUGH_VIDEO_URLS.en : WALKTHROUGH_VIDEO_URLS.vi;
}
