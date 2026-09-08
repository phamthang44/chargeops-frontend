import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalPage } from "@/lib/legal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Chính sách bảo mật | ChargeOps",
  description: "Chính sách bảo mật và an toàn thông tin của nền tảng ChargeOps theo quy chuẩn an toàn dữ liệu.",
};

export default async function PrivacyPage() {
  const content = await getLegalPage("privacy");
  return <LegalPage content={content} />;
}
