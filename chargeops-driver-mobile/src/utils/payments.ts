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
 * Biến cờ điều khiển phạm vi thanh toán:
 * - Khi true: Chỉ cho phép chọn SIMULATOR (khớp với phạm vi Backend M1 / BKG-020 hiện tại).
 *   Các phương thức khác sẽ hiển thị ở trạng thái disabled và không thể chọn.
 * - Khi false: Bật toàn bộ các phương thức thanh toán để người dùng tự do lựa chọn.
 */
export const ONLY_SIMULATOR_PAYMENT = true;
