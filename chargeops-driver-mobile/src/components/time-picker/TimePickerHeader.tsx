import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { GlassButton } from '@/components/GlassButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface TimePickerHeaderProps {
  onBack: () => void;
  onOpenHelp: () => void;
}

export function TimePickerHeader({ onBack, onOpenHelp }: TimePickerHeaderProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
        </GlassButton>

        {/* Center: Step indicator badge + Screen Title */}
        <View style={styles.headerCenterCol}>
          <View style={[styles.stepBadge, { backgroundColor: `${themeColors.primary}18` }]}>
            <Text style={[styles.stepBadgeText, { color: themeColors.primaryDark }]}>
              {t('timeRangePicker.stepBadge')} · {t('timeRangePicker.stepSubtitle')}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>
            {t('timeRangePicker.title')}
          </Text>
        </View>

        {/* Right Action: Help Modal Guide button */}
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('timeRangePicker.helpTooltip')}
          onPress={onOpenHelp}
        >
          <Ionicons name="help-circle-outline" size={22} color={themeColors.textStrong} />
        </GlassButton>
      </View>

      {/* Progress Track Line (Step 2 of 3 = 66%) */}
      <View style={[styles.progressBarTrack, { backgroundColor: themeColors.border }]}>
        <View style={[styles.progressBarFill, { backgroundColor: themeColors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.sm,
  },
  headerCenterCol: {
    alignItems: 'center',
    gap: 3,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  headerTitle: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  progressBarTrack: {
    height: 2.5,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    width: '66%',
    borderRadius: radius.full,
  },
});
