import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface ProfileAppSettingsSectionProps {
  language: string;
  onPressNotifications: () => void;
  onPressLanguage: () => void;
  onPressAppearance: () => void;
  onPressHelpCenter: () => void;
}

export function ProfileAppSettingsSection({
  language,
  onPressNotifications,
  onPressLanguage,
  onPressAppearance,
  onPressHelpCenter,
}: ProfileAppSettingsSectionProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="settings-outline" size={20} color={themeColors.primary} />
        <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
          {t('profile.appSettings.sectionTitle')}
        </Text>
      </View>

      {/* List Item: Notifications */}
      <Pressable style={styles.menuRow} onPress={onPressNotifications}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#431407' : '#FFF7ED' }]}>
          <Ionicons name="notifications-outline" size={20} color="#F97316" />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.appSettings.notifications')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {t('profile.appSettings.notificationsSub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* List Item: Language */}
      <Pressable style={styles.menuRow} onPress={onPressLanguage}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#2E1065' : '#F5F3FF' }]}>
          <Ionicons name="language-outline" size={20} color="#8B5CF6" />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.appSettings.language')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {language === 'en' ? 'English' : 'Tiếng Việt'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Appearance */}
      <Pressable style={styles.menuRow} onPress={onPressAppearance}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
          <Ionicons name="contrast-outline" size={20} color="#6366F1" />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.appSettings.appearance')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {t('profile.appSettings.appearanceSub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* List Item: Help Center */}
      <Pressable style={styles.menuRow} onPress={onPressHelpCenter}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
          <Ionicons name="help-buoy-outline" size={20} color="#3B82F6" />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.appSettings.helpCenter')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {t('profile.appSettings.helpCenterSub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.semibold,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  menuSub: {
    fontSize: fontSizes.caption,
  },
});
