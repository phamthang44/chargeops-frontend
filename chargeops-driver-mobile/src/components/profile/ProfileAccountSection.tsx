import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatPhoneForDisplay } from '@/utils/profile';

interface ProfileAccountSectionProps {
  userAvatar: string | null;
  userPhone: string;
  userEmail: string;
  openingSecurityAction: 'password' | 'twoFactor' | null;
  onPressAvatar: () => void;
  onPressPhone: () => void;
  onPressSecurity: (action: 'password' | 'twoFactor') => void;
}

export function ProfileAccountSection({
  userAvatar,
  userPhone,
  userEmail,
  openingSecurityAction,
  onPressAvatar,
  onPressPhone,
  onPressSecurity,
}: ProfileAccountSectionProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <Card style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person-outline" size={20} color={themeColors.primary} />
        <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
          {t('profile.account.sectionTitle')}
        </Text>
      </View>

      {/* Avatar Settings Row */}
      <Pressable style={styles.menuRow} onPress={onPressAvatar}>
        <View style={[styles.menuIconTile, { backgroundColor: themeColors.primarySoft }]}>
          <Ionicons name="image-outline" size={20} color={themeColors.primary} />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.account.avatar', 'Ảnh đại diện')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {userAvatar
              ? t('profile.account.hasAvatar', 'Nhấn để thay đổi hoặc gỡ ảnh')
              : t('profile.account.noAvatar', 'Chưa có ảnh đại diện')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Phone Row */}
      <Pressable style={styles.menuRow} onPress={onPressPhone}>
        <View style={[styles.menuIconTile, { backgroundColor: themeColors.primarySoft }]}>
          <Ionicons name="call-outline" size={20} color={themeColors.primary} />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.account.phone')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {formatPhoneForDisplay(userPhone) || t('profile.account.notProvided')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Email Row */}
      <View style={styles.menuRow}>
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
          <Ionicons name="mail-outline" size={20} color={themeColors.info} />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.account.signInEmail')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]} numberOfLines={1}>
            {userEmail}
          </Text>
        </View>
        <Ionicons name="shield-checkmark-outline" size={18} color={themeColors.success} />
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Change Password Row */}
      <Pressable
        style={[styles.menuRow, openingSecurityAction && styles.menuRowDisabled]}
        disabled={openingSecurityAction !== null}
        onPress={() => onPressSecurity('password')}
      >
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#3B1D0B' : '#FFF7ED' }]}>
          <Ionicons name="key-outline" size={20} color="#F97316" />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
            {t('profile.security.passwordTitle')}
          </Text>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {t('profile.security.passwordSubtitle')}
          </Text>
        </View>
        {openingSecurityAction === 'password' ? (
          <ActivityIndicator size="small" color={themeColors.primary} />
        ) : (
          <Ionicons name="open-outline" size={18} color={themeColors.textMuted} />
        )}
      </Pressable>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Two Factor Authentication Row */}
      <Pressable
        style={[styles.menuRow, openingSecurityAction && styles.menuRowDisabled]}
        disabled={openingSecurityAction !== null}
        onPress={() => onPressSecurity('twoFactor')}
      >
        <View style={[styles.menuIconTile, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
        </View>
        <View style={styles.menuTextContent}>
          <View style={styles.menuTitleRow}>
            <Text style={[styles.menuTitle, { color: themeColors.textStrong }]}>
              {t('profile.security.twoFactorTitle')}
            </Text>
            <View style={[styles.providerBadge, { backgroundColor: themeColors.surfaceAlt }]}>
              <Text style={[styles.providerBadgeText, { color: themeColors.textMuted }]}>Keycloak</Text>
            </View>
          </View>
          <Text style={[styles.menuSub, { color: themeColors.textMuted }]}>
            {t('profile.security.twoFactorSubtitle')}
          </Text>
        </View>
        {openingSecurityAction === 'twoFactor' ? (
          <ActivityIndicator size="small" color={themeColors.primary} />
        ) : (
          <Ionicons name="open-outline" size={18} color={themeColors.textMuted} />
        )}
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
  menuRowDisabled: { opacity: 0.65 },
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
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  providerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  providerBadgeText: { fontSize: 10, fontWeight: fontWeights.semibold },
  menuSub: {
    fontSize: fontSizes.caption,
  },
});
