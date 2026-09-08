import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

import { RefundShieldSvg } from './StationDetailSvgs';

interface StationPolicyCardProps {
  cancellationPolicy?: Station['cancellationPolicy'];
}

/**
 * Card hiển thị chính sách hủy đặt chỗ & hoàn tiền theo chuẩn Booking v4.9 (FR02/FR03).
 *
 * Quy tắc:
 * 1. Hủy hoàn withinGraceRefundPercent% trong gracePeriodMinutes phút từ lúc xác nhận thanh toán (trước start và chưa check-in).
 * 2. Sau hạn ân hạn hoặc không đến trạm: hoàn afterGraceRefundPercent% do đổi ý.
 * 3. Trạm gặp sự cố được xác nhận: hoàn verifiedStationFailureRefundPercent% theo quy trình hỗ trợ.
 *
 * Tuyệt đối không chạy countdown giả lập trước khi đặt. Không fallback về mốc 60/15 phút cũ.
 */
export function StationPolicyCard({ cancellationPolicy }: StationPolicyCardProps) {
  const { t } = useTranslation();
  const { isDark, themeColors } = usePreferences();

  const cardBg = isDark ? '#1C1917' : '#FBFBFB';
  const cardBorder = isDark ? '#292524' : '#E7E5E4';
  const titleColor = themeColors.textStrong;
  const textColor = themeColors.textBody;
  const mutedTextColor = themeColors.textMuted;

  // Badge / Accent colors
  const successColor = themeColors.primaryDark ?? '#059669';
  const warningColor = '#D97706';
  const infoColor = '#2563EB';

  const hasValidPolicy = Boolean(
    cancellationPolicy && typeof cancellationPolicy.gracePeriodMinutes === 'number',
  );

  return (
    <View style={[styles.policyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Header: Shield Icon + Title */}
      <View style={styles.policyHeader}>
        <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
          <RefundShieldSvg size={20} color={themeColors.primary} />
        </View>
        <View style={styles.titleCol}>
          <Text style={[styles.policyTitle, { color: titleColor }]}>
            {t('stationDetail.refundTitle')}
          </Text>
        </View>
      </View>

      {/* Policy Content */}
      {hasValidPolicy && cancellationPolicy ? (
        <View style={styles.contentContainer}>
          {/* Rule 1: Ân hạn hoàn 100% */}
          <View style={styles.ruleRow}>
            <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: successColor }]}>
                {cancellationPolicy.withinGraceRefundPercent}%
              </Text>
            </View>
            <Text style={[styles.ruleText, { color: textColor }]}>
              {t('stationDetail.policy.withinGrace', {
                percent: cancellationPolicy.withinGraceRefundPercent,
                minutes: cancellationPolicy.gracePeriodMinutes,
              })}
            </Text>
          </View>

          {/* Rule 2: Sau ân hạn / Vắng mặt (0%) */}
          <View style={styles.ruleRow}>
            <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: warningColor }]}>
                {cancellationPolicy.afterGraceRefundPercent}%
              </Text>
            </View>
            <Text style={[styles.ruleText, { color: textColor }]}>
              {t('stationDetail.policy.afterGrace', {
                percent: cancellationPolicy.afterGraceRefundPercent,
              })}
            </Text>
          </View>

          {/* Rule 3: Trạm gặp sự cố (100%) */}
          <View style={styles.ruleRow}>
            <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(59, 130, 246, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: infoColor }]}>
                {cancellationPolicy.verifiedStationFailureRefundPercent}%
              </Text>
            </View>
            <Text style={[styles.ruleText, { color: textColor }]}>
              {t('stationDetail.policy.stationFailure', {
                percent: cancellationPolicy.verifiedStationFailureRefundPercent,
              })}
            </Text>
          </View>

          {/* Disclaimer Note: Đồng hồ tính khi thanh toán, không giả lập countdown */}
          <View style={[styles.noteRow, { backgroundColor: isDark ? '#262626' : '#F5F5F4' }]}>
            <Ionicons name="information-circle-outline" size={16} color={mutedTextColor} style={styles.noteIcon} />
            <Text style={[styles.noteText, { color: mutedTextColor }]}>
              {t('stationDetail.policy.note')}
            </Text>
          </View>
        </View>
      ) : (
        /* Trạng thái chưa tải được hoặc không có policy mới: Không fallback sang policy cũ */
        <View style={styles.unavailableRow}>
          <Ionicons name="time-outline" size={18} color={warningColor} />
          <Text style={[styles.unavailableText, { color: mutedTextColor }]}>
            {t('stationDetail.policy.unavailable')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  policyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  policyTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  contentContainer: {
    gap: spacing.sm + 2,
    marginTop: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  ruleText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.medium,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    marginTop: 2,
  },
  noteIcon: {
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  },
  unavailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  unavailableText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontStyle: 'italic',
  },
});
