import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

import { RefundShieldSvg } from './StationDetailSvgs';

interface StationPolicyCardProps {
  cancellationPolicy?: Station['cancellationPolicy'];
}

export function StationPolicyCard({ cancellationPolicy }: StationPolicyCardProps) {
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  // Fresh, vibrant warm orange palette matching the user's reference image
  const cardBg = isDark ? '#271A12' : '#FFF9F2';
  const cardBorder = isDark ? 'rgba(251, 146, 60, 0.35)' : '#FED7AA';
  const titleColor = isDark ? '#FDBA74' : '#7C2D12';
  const textColor = isDark ? '#FED7AA' : '#431407';
  const dotColor = '#F97316';

  const renderRefundRule = (
    rule: NonNullable<Station['cancellationPolicy']>['refundRules'][number],
  ) => {
    if (rule.appliesToNoShow) {
      return t('stationDetail.policy.noShow', { percent: rule.refundPercent });
    }
    if (
      rule.minMinutesBeforeStartInclusive !== null &&
      rule.maxMinutesBeforeStartExclusive !== null
    ) {
      return t('stationDetail.policy.between', {
        percent: rule.refundPercent,
        min: rule.minMinutesBeforeStartInclusive,
        max: rule.maxMinutesBeforeStartExclusive,
      });
    }
    if (rule.minMinutesBeforeStartInclusive !== null) {
      return t('stationDetail.policy.from', {
        percent: rule.refundPercent,
        min: rule.minMinutesBeforeStartInclusive,
      });
    }
    if (rule.maxMinutesBeforeStartExclusive !== null) {
      return t('stationDetail.policy.before', {
        percent: rule.refundPercent,
        max: rule.maxMinutesBeforeStartExclusive,
      });
    }
    return t('stationDetail.policy.generic', { percent: rule.refundPercent });
  };

  const renderBullet = (text: string, key: string | number) => (
    <View key={key} style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.policyLine, { color: textColor }]}>{text}</Text>
    </View>
  );

  return (
    <View style={[styles.policyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Header: Shield Checkmark SVG + Title */}
      <View style={styles.policyHeader}>
        <RefundShieldSvg size={24} color="#EA580C" />
        <Text style={[styles.policyTitle, { color: titleColor }]}>
          {t('stationDetail.refundTitle')}
        </Text>
      </View>

      {/* Bullet Lines */}
      <View style={styles.bulletList}>
        {cancellationPolicy ? (
          <>
            {renderBullet(
              t('stationDetail.policy.grace', {
                minutes: cancellationPolicy.gracePeriodMinutes,
              }),
              'grace',
            )}
            {cancellationPolicy.refundRules.slice(0, 4).map((rule, idx) =>
              renderBullet(renderRefundRule(rule), `${rule.tier}-${rule.refundPercent}-${idx}`),
            )}
          </>
        ) : (
          <>
            {renderBullet(t('stationDetail.refundLine0'), '0')}
            {renderBullet(t('stationDetail.refundLine1'), '1')}
            {renderBullet(t('stationDetail.refundLine2'), '2')}
            {renderBullet(t('stationDetail.refundLine3'), '3')}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  policyCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  bulletList: {
    gap: 7,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  policyLine: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19.5,
    fontWeight: fontWeights.medium,
  },
});

