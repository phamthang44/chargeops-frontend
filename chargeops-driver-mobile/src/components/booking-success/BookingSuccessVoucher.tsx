import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface BookingSuccessVoucherProps {
  bookingCode: string;
  copied: boolean;
  onCopy: () => void;
}

export function BookingSuccessVoucher({
  bookingCode,
  copied,
  onCopy,
}: BookingSuccessVoucherProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.voucherCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.voucherHeader}>
        <View style={styles.voucherLabelRow}>
          <Ionicons name="receipt-outline" size={14} color={themeColors.textMuted} />
          <Text style={[styles.voucherLabel, { color: themeColors.textMuted }]}>
            {t('bookingSuccess.codeLabel')}
          </Text>
        </View>
        {copied && (
          <View style={[styles.copiedPill, { backgroundColor: themeColors.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={13} color={themeColors.primary} />
            <Text style={[styles.copiedText, { color: themeColors.primary }]}>
              {t('bookingSuccess.codeCopied')}
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.voucherCodeBox, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <Text
          style={[styles.voucherCodeText, { color: themeColors.primary }]}
          numberOfLines={1}
          ellipsizeMode="middle"
          selectable
        >
          {bookingCode}
        </Text>
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.copyButton,
            {
              backgroundColor: copied ? themeColors.primarySoft : themeColors.surface,
              borderColor: copied ? themeColors.primary : themeColors.border,
            },
            pressed && styles.copyButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('bookingSuccess.copyCode')}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? themeColors.primary : themeColors.textBody}
          />
          <Text
            style={[
              styles.copyButtonText,
              { color: copied ? themeColors.primary : themeColors.textBody },
            ]}
          >
            {t(copied ? 'bookingSuccess.codeCopied' : 'bookingSuccess.copyCode')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  voucherCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voucherLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  copiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  copiedText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  voucherCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  voucherCodeText: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  copyButtonPressed: {
    opacity: 0.75,
  },
  copyButtonText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
});
