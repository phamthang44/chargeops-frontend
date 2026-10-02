import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '@/components/GlassButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, spacing } from '@/theme';

export interface BookingConfirmationHeaderProps {
  onBack: () => void;
}

export function BookingConfirmationHeader({ onBack }: BookingConfirmationHeaderProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
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
      <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>
        {t('bookingConfirmation.title')}
      </Text>
      <View style={styles.headerBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
});
