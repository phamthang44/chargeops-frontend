import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, BottomSheet } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { BackendPricePreviewResponse } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { formatVnd } from '@/utils/format';

export interface PriceChangedModalProps {
  visible: boolean;
  oldPrice: number;
  pendingPricePreview: BackendPricePreviewResponse | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function PriceChangedModal({
  visible,
  oldPrice,
  pendingPricePreview,
  onAccept,
  onDecline,
}: PriceChangedModalProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  if (!pendingPricePreview) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onDecline}
      title={t('bookingConfirmation.priceChangedTitle')}
    >
      <View style={styles.modalContent}>
        <View style={[styles.modalIconRing, { backgroundColor: `${themeColors.info}1A` }]}>
          <Ionicons name="pricetag-outline" size={32} color={themeColors.info} />
        </View>
        <Text style={[styles.modalBodyText, { color: themeColors.textBody }]}>
          {t('bookingConfirmation.priceChangedMessage')}
        </Text>
        <View style={[styles.priceChangeComparison, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <View style={styles.priceChangeRow}>
            <Text style={[styles.priceChangeLabel, { color: themeColors.textMuted }]}>
              {t('bookingConfirmation.oldPrice')}:
            </Text>
            <Text style={[styles.priceChangeOldValue, { color: themeColors.textMuted }]}>
              {formatVnd(oldPrice)}
            </Text>
          </View>
          <View style={styles.priceChangeRow}>
            <Text style={[styles.priceChangeLabel, { color: themeColors.textStrong, fontWeight: fontWeights.semibold }]}>
              {t('bookingConfirmation.newPrice')}:
            </Text>
            <Text style={[styles.priceChangeNewValue, { color: themeColors.primary, fontWeight: fontWeights.bold }]}>
              {formatVnd(pendingPricePreview.totalAmount)}
            </Text>
          </View>
        </View>
        <View style={styles.modalActions}>
          <AppButton
            label={t('bookingConfirmation.acceptNewPrice')}
            onPress={onAccept}
          />
          <AppButton
            label={t('bookingConfirmation.reviewBooking')}
            variant="secondary"
            onPress={onDecline}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modalContent: { gap: spacing.md, alignItems: 'center', paddingTop: spacing.xs },
  modalIconRing: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  modalBodyText: { fontSize: fontSizes.body, textAlign: 'center', lineHeight: lineHeights.body },
  modalActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
  priceChangeComparison: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  priceChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceChangeLabel: {
    fontSize: fontSizes.body,
  },
  priceChangeOldValue: {
    fontSize: fontSizes.body,
    textDecorationLine: 'line-through',
  },
  priceChangeNewValue: {
    fontSize: fontSizes.body,
  },
});
