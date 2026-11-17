import type { Metadata } from "next";
import { SubpageShell } from "@/components/home/SubpageShell";
import { LegalDoc } from "@/components/home/LegalDoc";
import { getLegalPage } from "@/lib/legal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | ChargeOps",
  description: "Điều khoản dịch vụ chính thức của nền tảng đặt chỗ và quản trị trạm sạc xe điện ChargeOps theo quy chuẩn Booking v4.9.",
};

export default async function TermsPage() {
  const content = await getLegalPage("terms");
  return (
    <SubpageShell>
      <LegalDoc content={content} />
    </SubpageShell>
  );
}
