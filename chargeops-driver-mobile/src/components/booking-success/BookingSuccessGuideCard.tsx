import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

interface GuideStepItem {
  step: number;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
}

const GUIDE_STEPS: GuideStepItem[] = [
  {
    step: 1,
    icon: 'time-outline',
    titleKey: 'bookingSuccess.step1Title',
    descKey: 'bookingSuccess.step1',
  },
  {
    step: 2,
    icon: 'qr-code-outline',
    titleKey: 'bookingSuccess.step2Title',
    descKey: 'bookingSuccess.step2',
  },
  {
    step: 3,
    icon: 'flash-outline',
    titleKey: 'bookingSuccess.step3Title',
    descKey: 'bookingSuccess.step3',
  },
];

export function BookingSuccessGuideCard() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.guideCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.guideHeader}>
        <View style={[styles.guideIconWrap, { backgroundColor: themeColors.primarySoft }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={themeColors.primary} />
        </View>
        <View style={styles.guideTitleBlock}>
          <Text style={[styles.guideTitle, { color: themeColors.textStrong }]}>{t('bookingSuccess.guideTitle')}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      <View style={styles.guideStepsContainer}>
        {GUIDE_STEPS.map((item, idx) => {
          const isLast = idx === GUIDE_STEPS.length - 1;
          return (
            <View key={item.step} style={styles.stepperRow}>
              <View style={styles.stepperTrack}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: themeColors.surfaceAlt,
                      borderColor: themeColors.primary,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={16} color={themeColors.primary} />
                </View>
                {!isLast && (
                  <View style={[styles.stepConnectorLine, { backgroundColor: themeColors.border }]} />
                )}
              </View>
              <View style={[styles.stepContent, !isLast && styles.stepContentSpaced]}>
                <View style={styles.stepBadgeRow}>
                  <View style={[styles.stepNumPill, { backgroundColor: themeColors.primarySoft }]}>
                    <Text style={[styles.stepNumBadge, { color: themeColors.primary }]}>
                      {t('bookingSuccess.stepNum', { num: item.step })}
                    </Text>
                  </View>
                  <Text style={[styles.stepItemTitle, { color: themeColors.textStrong }]}>
                    {t(item.titleKey)}
                  </Text>
                </View>
                <Text style={[styles.stepDesc, { color: themeColors.textBody }]}>
                  {t(item.descKey)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Policy Notice Footer */}
      <View
        style={[
          styles.noticeBanner,
          { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
        ]}
      >
        <Ionicons name="information-circle-outline" size={17} color={themeColors.primary} />
        <Text style={[styles.noticeText, { color: themeColors.textMuted }]}>
          {t('bookingSuccess.refundNote')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guideCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guideIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitleBlock: {
    flex: 1,
  },
  guideTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  divider: {
    height: 1,
  },
  guideStepsContainer: {
    paddingVertical: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepperTrack: {
    alignItems: 'center',
    width: 36,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnectorLine: {
    width: 2,
    minHeight: 28,
    flex: 1,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    gap: 4,
  },
  stepContentSpaced: {
    paddingBottom: spacing.lg,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  stepNumPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  stepNumBadge: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  stepItemTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  stepDesc: {
    fontSize: fontSizes.body - 1,
    lineHeight: lineHeights.body,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
});
