import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';

const LABELS: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

/**
 * Segmented control to switch the app language at runtime.
 * Reads/sets the active language via i18next; subscribed components re-render.
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language) as SupportedLanguage;

  return (
    <View style={styles.row}>
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        return (
          <Pressable
            key={lng}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => {
              if (!active) i18n.changeLanguage(lng);
            }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{LABELS[lng]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
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
  segmentActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.textInverse,
    fontWeight: fontWeights.semibold,
  },
});
