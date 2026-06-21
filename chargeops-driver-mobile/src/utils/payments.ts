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
  MOMO: { icon: 'wallet', color: colors.error },
  VISA: { icon: 'card', color: colors.info },
  ZALOPAY: { icon: 'wallet-outline', color: colors.info },
  ATM: { icon: 'card-outline', color: colors.primaryDark },
  WALLET: { icon: 'wallet', color: colors.primary },
};

/** Methods offered for selection on the confirmation screen (in display order). */
export const SELECTABLE_PAYMENT_METHODS: PaymentMethod[] = ['MOMO', 'VISA', 'ZALOPAY', 'ATM'];
