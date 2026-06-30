/**
 * Sample station data for the public, read-only "Trạm sạc" bridge.
 * Mirrors the shape of the driver app's mock stations — this is the discovery
 * layer that answers "do you have a station near me?" without any login.
 * Replace with a fetch from a real public read-only API later; the page code
 * (directory + per-station detail) consumes these helpers and won't change.
 */
export type Connector = "CCS2" | "CHAdeMO" | "Type 2 (AC)" | "GB/T";

export type CoverageStation = {
  id: string;
  slug: string;
  name: string;
  district: string;
  city: string;
  address: string;
  available: number;
  total: number;
  fast: boolean;
  pricePerKwh: string;
  connectors: Connector[];
  amenities: string[];
  hours: string;
  rating: number;
  reviewCount: number;
  description: string;
};

export const CITIES = ["Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"] as const;

export const STATIONS: CoverageStation[] = [
  {
    id: "s1",
    slug: "vincom-dong-khoi",
    name: "ChargeOps Vincom Đồng Khởi",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    address: "72 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh",
    available: 4,
    total: 6,
    fast: true,
    pricePerKwh: "3.850đ",
    connectors: ["CCS2", "CHAdeMO"],
    amenities: ["Mái che", "Cafe", "Nhà vệ sinh", "Wifi"],
    hours: "06:00 – 22:00",
    rating: 4.8,
    reviewCount: 126,
    description:
      "Trạm sạc nhanh DC ngay trung tâm Quận 1, trong khu mua sắm Vincom Đồng Khởi. Thuận tiện vừa sạc vừa nghỉ ngơi, mua sắm.",
  },
  {
    id: "s2",
    slug: "landmark-81",
    name: "ChargeOps Landmark 81",
    district: "Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    address: "720A Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh",
    available: 2,
    total: 8,
    fast: true,
    pricePerKwh: "4.100đ",
    connectors: ["CCS2", "Type 2 (AC)"],
    amenities: ["Mái che", "Bãi đỗ rộng", "Cafe", "Mở 24/7"],
    hours: "Mở cửa 24/7",
    rating: 4.7,
    reviewCount: 203,
    description:
      "Cụm trụ sạc lớn dưới tầng hầm Landmark 81, hoạt động 24/7. Phù hợp cho cả tài xế cá nhân và dịch vụ.",
  },
  {
    id: "s3",
    slug: "crescent-mall-q7",
    name: "ChargeOps Crescent Mall",
    district: "Quận 7",
    city: "TP. Hồ Chí Minh",
    address: "101 Tôn Dật Tiên, Quận 7, TP. Hồ Chí Minh",
    available: 5,
    total: 6,
    fast: false,
    pricePerKwh: "3.500đ",
    connectors: ["Type 2 (AC)", "GB/T"],
    amenities: ["Mái che", "Nhà vệ sinh", "Bãi đỗ rộng"],
    hours: "08:00 – 22:00",
    rating: 4.6,
    reviewCount: 88,
    description:
      "Trạm sạc AC giá tốt tại khu Phú Mỹ Hưng, gần trung tâm thương mại Crescent Mall. Lý tưởng khi đỗ xe lâu.",
  },
  {
    id: "s4",
    slug: "vincom-ba-trieu",
    name: "ChargeOps Vincom Bà Triệu",
    district: "Hai Bà Trưng",
    city: "Hà Nội",
    address: "191 Bà Triệu, Hai Bà Trưng, Hà Nội",
    available: 3,
    total: 6,
    fast: true,
    pricePerKwh: "3.950đ",
    connectors: ["CCS2", "CHAdeMO"],
    amenities: ["Mái che", "Cafe", "Wifi"],
    hours: "07:00 – 22:00",
    rating: 4.7,
    reviewCount: 142,
    description:
      "Trạm sạc nhanh trung tâm Hà Nội, trong tòa Vincom Bà Triệu. Sạc nhanh DC, vị trí dễ tiếp cận.",
  },
  {
    id: "s5",
    slug: "lotte-center-ba-dinh",
    name: "ChargeOps Lotte Center",
    district: "Ba Đình",
    city: "Hà Nội",
    address: "54 Liễu Giai, Ba Đình, Hà Nội",
    available: 0,
    total: 4,
    fast: true,
    pricePerKwh: "4.200đ",
    connectors: ["CCS2"],
    amenities: ["Mái che", "Bãi đỗ rộng"],
    hours: "06:00 – 23:00",
    rating: 4.5,
    reviewCount: 67,
    description:
      "Trạm sạc nhanh tại Lotte Center Hà Nội. Hiện đang đầy chỗ — đặt trước trong ứng dụng để giữ khung giờ.",
  },
  {
    id: "s6",
    slug: "vincom-ngo-quyen-dn",
    name: "ChargeOps Vincom Ngô Quyền",
    district: "Sơn Trà",
    city: "Đà Nẵng",
    address: "910A Ngô Quyền, Sơn Trà, Đà Nẵng",
    available: 6,
    total: 8,
    fast: false,
    pricePerKwh: "3.400đ",
    connectors: ["Type 2 (AC)", "GB/T"],
    amenities: ["Mái che", "Cafe", "Nhà vệ sinh", "Bãi đỗ rộng"],
    hours: "07:00 – 22:00",
    rating: 4.8,
    reviewCount: 54,
    description:
      "Trạm sạc giá tốt bên bờ Đông sông Hàn, Đà Nẵng. Nhiều trụ trống, phù hợp cho khách du lịch và người dân.",
  },
];

/** All station slugs — used by the directory links and SSG params. */
export const STATION_SLUGS = STATIONS.map((s) => s.slug);

/** Look up a single station for its detail page. */
export function getStationBySlug(slug: string): CoverageStation | undefined {
  return STATIONS.find((s) => s.slug === slug);
}
