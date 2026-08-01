import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ",
  description: "Điều khoản dịch vụ bản nháp cho ChargeOps theo SRS v4.7.",
};

export default function TermsPage() {
  return <LegalPage content={getLegalPage("terms")} />;
}
