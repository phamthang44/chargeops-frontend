/**
 * Sample station coverage data for the public, read-only "Trạm sạc" section.
 * Mirrors the shape of the driver app's mock stations — this is the discovery
 * layer that answers "do you have a station near me?" without any login.
 * Replace with a fetch from the real API later (read-only, public endpoint).
 */
export type CoverageStation = {
  id: string;
  name: string;
  district: string;
  city: string;
  available: number;
  total: number;
  fast: boolean;
  pricePerKwh: string;
};

export const CITIES = ["Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"] as const;

export const STATIONS: CoverageStation[] = [
  {
    id: "s1",
    name: "ChargeOps Vincom Đồng Khởi",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    available: 4,
    total: 6,
    fast: true,
    pricePerKwh: "3.850đ",
  },
  {
    id: "s2",
    name: "ChargeOps Landmark 81",
    district: "Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    available: 2,
    total: 8,
    fast: true,
    pricePerKwh: "4.100đ",
  },
  {
    id: "s3",
    name: "ChargeOps Crescent Mall",
    district: "Quận 7",
    city: "TP. Hồ Chí Minh",
    available: 5,
    total: 6,
    fast: false,
    pricePerKwh: "3.500đ",
  },
  {
    id: "s4",
    name: "ChargeOps Vincom Bà Triệu",
    district: "Hai Bà Trưng",
    city: "Hà Nội",
    available: 3,
    total: 6,
    fast: true,
    pricePerKwh: "3.950đ",
  },
  {
    id: "s5",
    name: "ChargeOps Lotte Center",
    district: "Ba Đình",
    city: "Hà Nội",
    available: 0,
    total: 4,
    fast: true,
    pricePerKwh: "4.200đ",
  },
  {
    id: "s6",
    name: "ChargeOps Vincom Ngô Quyền",
    district: "Sơn Trà",
    city: "Đà Nẵng",
    available: 6,
    total: 8,
    fast: false,
    pricePerKwh: "3.400đ",
  },
];
