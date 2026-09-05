import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Connector } from '@/types';
import { formatEquipmentName, formatRate } from '@/utils/format';

import { EvPlugIcon } from './StationDetailSvgs';

interface StationBookingBottomBarProps {
  selectedConn?: Connector | null;
  canBook: boolean;
  gateHint?: string | null;
  isClosedBySchedule: boolean;
  bookButtonLabel: string;
  onBook: () => void;
  insetsBottom: number;
}

export function StationBookingBottomBar({
  selectedConn,
  canBook,
  gateHint,
  isClosedBySchedule,
  bookButtonLabel,
  onBook,
  insetsBottom,
}: StationBookingBottomBarProps) {
  const { t, i18n } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const isDc = (selectedConn?.powerKw ?? 0) >= 60;

  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
          paddingBottom: Math.max(spacing.md, insetsBottom + spacing.sm),
        },
      ]}
    >
      <View style={styles.bottomContent}>
        {/* Left Side: Selected Connector Highlight */}
        <View style={styles.bottomMeta}>
          {selectedConn ? (
            <>
              <View style={styles.selectedLabelRow}>
                <EvPlugIcon size={14} color="#059669" />
                <Text style={styles.selectedLabelText}>
                  {t('stationDetail.selectedConnectorLabel', 'CỔNG SẠC ĐÃ CHỌN')}
                </Text>
              </View>
              <Text style={[styles.bottomValueBig, { color: themeColors.textStrong }]} numberOfLines={1}>
                {formatEquipmentName(selectedConn.name, i18n.language)} · {selectedConn.connectorType}
              </Text>

              <View style={styles.bottomChips}>
                <View
                  style={[
                    styles.powerBadge,
                    {
                      backgroundColor: isDc
                        ? (isDark ? 'rgba(2, 132, 199, 0.22)' : '#E0F2FE')
                        : (isDark ? 'rgba(5, 150, 105, 0.22)' : '#ECFDF5'),
                    },
                  ]}
                >
                  <Ionicons name="flash" size={12} color={isDc ? '#0284C7' : '#059669'} />
                  <Text style={[styles.powerBadgeText, { color: isDc ? '#0284C7' : '#059669' }]}>
                    {selectedConn.powerKw} kW {isDc ? 'DC' : 'AC'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.priceBadge,
                    { backgroundColor: isDark ? 'rgba(51, 65, 85, 0.7)' : '#F1F5F9' },
                  ]}
                >
                  <Text style={[styles.priceBadgeText, { color: themeColors.textStrong }]}>
                    {formatRate(selectedConn.ratePerKwh)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.selectedLabelRow}>
                <EvPlugIcon size={14} color={themeColors.textMuted} />
                <Text style={[styles.selectedLabelText, { color: themeColors.textMuted }]}>
                  {t('stationDetail.noConnectorLabel', 'CHƯA CHỌN CỔNG')}
                </Text>
              </View>
              <Text style={[styles.bottomValuePrompt, { color: themeColors.textStrong }]}>
                {t('stationDetail.chooseConnectorPrompt', 'Chọn cổng sạc phía trên')}
              </Text>
              <Text style={[styles.bottomHint, { color: themeColors.textMuted }]} numberOfLines={1}>
                {gateHint || t('stationDetail.touchConnectorHint', 'Chạm vào cổng để xem giá & lịch sạc')}
              </Text>
            </>
          )}

          {selectedConn && gateHint && (
            <Text
              style={[
                styles.bottomHintWarning,
                { color: isClosedBySchedule ? themeColors.warning : themeColors.error },
              ]}
              numberOfLines={2}
            >
              {gateHint}
            </Text>
          )}
        </View>

        {/* Right Side: High-Impact Action Button */}
        <Pressable
          accessibilityRole="button"
          disabled={!canBook}
          onPress={onBook}
          style={({ pressed }) => [
            styles.availabilityCta,
            {
              backgroundColor: canBook ? '#059669' : (isDark ? '#334155' : '#94A3B8'),
              shadowColor: canBook ? '#059669' : '#000000',
            },
            pressed && canBook && styles.availabilityCtaPressed,
            !canBook && styles.availabilityCtaDisabled,
          ]}
        >
          <Ionicons name="calendar" size={17} color="#FFFFFF" />
          <Text style={styles.availabilityCtaText} numberOfLines={2}>
            {bookButtonLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1.5,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 10,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bottomMeta: {
    flex: 1,
    gap: 3,
  },
  selectedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedLabelText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.6,
    color: '#059669',
  },
  bottomValueBig: {
    fontSize: 17,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  bottomValuePrompt: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  bottomChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  powerBadgeText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  bottomHint: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  bottomHintWarning: {
    fontSize: 11.5,
    fontWeight: fontWeights.semibold,
    marginTop: 2,
  },
  availabilityCta: {
    minHeight: 52,
    minWidth: 154,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  availabilityCtaPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  availabilityCtaDisabled: {
    opacity: 0.6,
  },
  availabilityCtaText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
