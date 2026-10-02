import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

const LABELS: Record<SupportedLanguage, { label: string; flag: string }> = {
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  en: { label: 'English', flag: '🇬🇧' },
};

/**
 * Segmented control to switch the app language at runtime.
 * Subscribed to active theme colors for Dark and Light mode support.
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { themeColors, setLanguage } = usePreferences();
  const current = (i18n.resolvedLanguage ?? i18n.language) as SupportedLanguage;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: themeColors.surfaceAlt,
          borderColor: themeColors.border,
        },
      ]}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        const item = LABELS[lng];
        return (
          <Pressable
            key={lng}
            style={[
              styles.segment,
              active && [
                styles.segmentActive,
                { backgroundColor: themeColors.primary },
              ],
            ]}
            onPress={() => {
              if (!active) setLanguage(lng);
            }}
          >
            <Text style={styles.flag}>{item.flag}</Text>
            <Text
              style={[
                styles.label,
                { color: active ? themeColors.textInverse : themeColors.textMuted },
                active && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  flag: {
    fontSize: 16,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  labelActive: {
    fontWeight: fontWeights.bold,
  },
});
