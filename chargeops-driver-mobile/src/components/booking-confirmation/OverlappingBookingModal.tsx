import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, BottomSheet } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime } from '@/utils/format';

export interface OverlappingBookingModalProps {
  visible: boolean;
  overlappingBooking: Booking | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OverlappingBookingModal({
  visible,
  overlappingBooking,
  onConfirm,
  onCancel,
}: OverlappingBookingModalProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  if (!overlappingBooking) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onConfirm}
      title={t('bookingConfirm.overlapTitle')}
    >
      <View style={styles.modalContent}>
        <View style={[styles.modalIconRing, { backgroundColor: `${themeColors.warning}1A` }]}>
          <Ionicons name="warning-outline" size={32} color={themeColors.warning} />
        </View>
        <Text style={[styles.modalBodyText, { color: themeColors.textBody }]}>
          {t('bookingConfirm.overlapBody', {
            start: formatTime(overlappingBooking.startAt),
            end: formatTime(overlappingBooking.endAt),
            station: overlappingBooking.stationName,
          })}
        </Text>
        <View style={styles.modalActions}>
          <AppButton
            label={t('bookingConfirm.overlapConfirm')}
            onPress={onConfirm}
          />
          <AppButton
            label={t('common.cancel')}
            variant="secondary"
            onPress={onCancel}
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
});
