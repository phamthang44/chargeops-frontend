import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

const LABELS: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
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
    <View style={[styles.row, { backgroundColor: themeColors.surfaceAlt }]}>
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        return (
          <Pressable
            key={lng}
            style={[
              styles.segment,
              active && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => {
              if (!active) setLanguage(lng);
            }}
          >
            <Text
              style={[
                styles.label,
                { color: active ? themeColors.textInverse : themeColors.textMuted },
                active && styles.labelActive,
              ]}
            >
              {LABELS[lng]}
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
    borderRadius: radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  labelActive: {
    fontWeight: fontWeights.semibold,
  },
});
