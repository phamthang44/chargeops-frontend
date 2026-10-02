import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface ProfileFooterProps {
  onSignOut: () => void;
}

export function ProfileFooter({ onSignOut }: ProfileFooterProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View style={styles.footerContainer}>
      {/* Logout Action */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.logout')}
        style={({ pressed }) => [
          styles.logoutBtn,
          {
            backgroundColor: isDark ? '#3B1111' : '#FEF2F2',
            borderColor: themeColors.error,
          },
          pressed && styles.logoutBtnPressed,
        ]}
        onPress={onSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
        <Text style={[styles.logoutText, { color: themeColors.error }]}>{t('profile.logout')}</Text>
      </Pressable>

      {/* Version Indicator Footer */}
      <Text style={[styles.versionText, { color: themeColors.textMuted }]}>{t('profile.version')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    gap: spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  logoutBtnPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  logoutText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  versionText: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
});
