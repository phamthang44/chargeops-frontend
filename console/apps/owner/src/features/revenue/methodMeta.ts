import type { PaymentMethod } from '@chargeops/api';

/** Vietnamese label + chart colour per payment method. */
export const METHOD_META: Record<PaymentMethod, { label: string; color: string }> = {
  VNPAY: { label: 'VNPay', color: '#5b54e8' },
  MOMO: { label: 'Momo', color: '#d63384' },
  ATM: { label: 'Thẻ ATM', color: '#0d8a5a' },
};
