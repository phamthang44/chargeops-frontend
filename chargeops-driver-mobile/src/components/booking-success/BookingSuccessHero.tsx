import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, spacing } from '@/theme';

export function BookingSuccessHero() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={styles.heroSection}>
      <View
        style={[
          styles.checkOuterRing,
          {
            backgroundColor: themeColors.primarySoft,
            borderColor: `${themeColors.primary}33`,
          },
        ]}
      >
        <View
          style={[
            styles.checkInnerCircle,
            {
              backgroundColor: themeColors.primary,
              shadowColor: themeColors.primary,
              ...(Platform.OS === 'web'
                ? { boxShadow: '0 8px 24px rgba(16, 201, 138, 0.35)' }
                : {}),
            },
          ]}
        >
          <Ionicons name="checkmark-sharp" size={44} color="#FFFFFF" />
        </View>
      </View>
      <Text style={[styles.title, { color: themeColors.textStrong }]}>{t('bookingSuccess.title')}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('bookingSuccess.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  checkOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  checkInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      default: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: lineHeights.body,
    paddingHorizontal: spacing.md,
  },
});
