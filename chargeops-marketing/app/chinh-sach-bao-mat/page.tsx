import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Chính sách bảo mật bản nháp cho ChargeOps theo SRS v4.7.",
};

export default function PrivacyPage() {
  return <LegalPage content={getLegalPage("privacy")} />;
}
