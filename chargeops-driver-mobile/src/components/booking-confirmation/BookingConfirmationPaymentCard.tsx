import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { PaymentMethod } from '@/types';
import {
  PAYMENT_FEATURE_FLAGS,
  PAYMENT_META,
  SELECTABLE_PAYMENT_METHODS,
} from '@/utils/payments';

export interface BookingConfirmationPaymentCardProps {
  method: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function BookingConfirmationPaymentCard({
  method,
  onSelectMethod,
}: BookingConfirmationPaymentCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="wallet-outline" size={18} color={themeColors.primary} />
        <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>
          {t('bookingConfirmation.paymentTitle')}
        </Text>
      </View>

      {SELECTABLE_PAYMENT_METHODS.filter(
        (pm) => pm !== 'SIMULATOR' || PAYMENT_FEATURE_FLAGS.ENABLE_SIMULATOR_PAYMENT,
      ).map((pm) => {
        const meta = PAYMENT_META[pm];
        const isSel = method === pm;
        const isSepayDisabled = pm === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT;
        const isOtherDisabled = pm !== 'SIMULATOR' && pm !== 'BANK_TRANSFER';
        const isDisabled = isSepayDisabled || isOtherDisabled;
        const badgeLabel = isSepayDisabled
          ? t('payment.updateLater', 'Sẽ cập nhật sau')
          : t('payment.comingSoon', 'Sắp ra mắt');

        return (
          <Pressable
            key={pm}
            disabled={isDisabled}
            style={[
              styles.paymentRow,
              {
                backgroundColor: isSel ? themeColors.primarySoft : themeColors.surfaceAlt,
                borderColor: isSel ? themeColors.primary : themeColors.border,
                opacity: isDisabled ? 0.45 : 1,
              },
            ]}
            onPress={() => {
              if (!isDisabled) {
                onSelectMethod(pm);
              }
            }}
          >
            <View style={[styles.paymentIcon, { backgroundColor: `${meta.color}1A` }]}>
              <Ionicons name={meta.icon} size={20} color={meta.color} />
            </View>
            <View style={styles.paymentInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.paymentName, { color: themeColors.textStrong }]}>
                  {t(`payment.${pm}`)}
                </Text>
                {isDisabled && (
                  <View
                    style={[
                      styles.disabledBadge,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
                    ]}
                  >
                    <Text style={{ fontSize: 10, color: themeColors.textMuted, fontWeight: '600' }}>
                      {badgeLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.paymentDesc, { color: themeColors.textMuted }]}>
                {t(`payment.${pm}_desc`)}
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                { borderColor: isSel ? themeColors.primary : themeColors.border },
              ]}
            >
              {isSel && <View style={[styles.radioDot, { backgroundColor: themeColors.primary }]} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  cardTitle: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  paymentIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  paymentName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  disabledBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentDesc: { fontSize: fontSizes.caption },
  radio: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: radius.full },
});
