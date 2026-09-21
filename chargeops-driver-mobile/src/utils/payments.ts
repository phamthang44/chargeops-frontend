import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';
import type { PaymentMethod } from '@/types';

/**
 * Payment-method presentation metadata (icon + tint).
 * Labels are NOT here — they go through i18n (`payment.<METHOD>`).
 */
export const PAYMENT_META: Record<
  PaymentMethod,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  SIMULATOR: { icon: 'flash', color: colors.warning },
  VNPAY: { icon: 'card', color: colors.info },
  MOMO: { icon: 'wallet', color: colors.error },
  ZALOPAY: { icon: 'wallet-outline', color: colors.info },
  BANK_TRANSFER: { icon: 'business', color: colors.primaryDark },
  VISA: { icon: 'card', color: colors.info },
  ATM: { icon: 'card-outline', color: colors.primaryDark },
  WALLET: { icon: 'wallet', color: colors.primary },
};

/** Methods offered for selection on the confirmation screen (in display order). */
export const SELECTABLE_PAYMENT_METHODS: PaymentMethod[] = [
  'SIMULATOR',
  'VNPAY',
  'MOMO',
  'ZALOPAY',
  'BANK_TRANSFER',
];

/**
 * Feature flags điều khiển phương thức thanh toán và quản lý thẻ/tài khoản.
 * Có thể bật (true) hoặc tắt (false) trực tiếp tại đây để phục vụ demo hoặc khóa tính năng chưa hỗ trợ.
 */
export const PAYMENT_FEATURE_FLAGS = {
  /**
   * Bật/tắt phương thức chuyển khoản ngân hàng VietQR / SePay:
   * - false: Đánh dấu "Sẽ cập nhật sau", khóa không cho chọn thanh toán hoặc đặt làm mặc định.
   * - true: Cho phép chọn và thanh toán qua SePay VietQR.
   */
  ENABLE_SEPAY_PAYMENT: false,

  /**
   * Bật/tắt phương thức demo Simulator:
   * - true: Cho phép chọn và thanh toán qua Demo Sandbox.
   * - false: Ẩn phương thức Demo Sandbox phía Frontend.
   */
  ENABLE_SIMULATOR_PAYMENT: true,

  /**
   * Bật/tắt tính năng CRUD (Thêm / Xóa / Tùy biến) phương thức thanh toán trong hồ sơ:
   * - false: Đánh dấu nút thêm phương thức là "Sẽ cập nhật sau" và khóa tính năng thêm/xóa.
   * - true: Cho phép tài xế tự do thêm tài khoản ngân hàng, thẻ Visa và xóa phương thức.
   */
  ENABLE_PAYMENT_METHODS_CRUD: false,
};

/**
 * Biến cờ tương thích cũ: chỉ cho phép SIMULATOR khi SePay bị tắt
 */
export const ONLY_SIMULATOR_PAYMENT = !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT;

