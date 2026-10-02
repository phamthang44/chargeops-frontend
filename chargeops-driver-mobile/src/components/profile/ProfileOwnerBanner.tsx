import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface ProfileOwnerBannerProps {
  hasOwnerAccess: boolean;
  openingOwnerPortal: boolean;
  onPress: () => void;
}

export function ProfileOwnerBanner({
  hasOwnerAccess,
  openingOwnerPortal,
  onPress,
}: ProfileOwnerBannerProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View
      style={[
        styles.ownerBanner,
        {
          backgroundColor: isDark ? '#113322' : '#D1FAE5',
          borderColor: isDark ? '#1F5C3B' : '#A7F3D0',
        },
      ]}
    >
      <View style={styles.ownerHeader}>
        <Text style={[styles.ownerTitle, { color: themeColors.textStrong }]}>
          {t(
            hasOwnerAccess
              ? 'profile.ownerBanner.portalTitle'
              : 'profile.ownerBanner.title',
          )}
        </Text>
        <View style={[styles.ownerIconBadge, { backgroundColor: themeColors.primary }]}>
          <Ionicons
            name={hasOwnerAccess ? 'business-outline' : 'repeat-outline'}
            size={18}
            color={themeColors.textInverse}
          />
        </View>
      </View>

      <Text style={[styles.ownerSubtitle, { color: themeColors.textBody }]}>
        {t(
          hasOwnerAccess
            ? 'profile.ownerBanner.portalSubtitle'
            : 'profile.ownerBanner.subtitle',
        )}
      </Text>

      <Pressable
        style={[
          styles.ownerCtaBtn,
          { backgroundColor: themeColors.primary },
          openingOwnerPortal && styles.ownerCtaBtnDisabled,
        ]}
        disabled={openingOwnerPortal}
        onPress={onPress}
      >
        {openingOwnerPortal ? (
          <ActivityIndicator size="small" color={themeColors.textInverse} />
        ) : (
          <Text style={[styles.ownerCtaText, { color: themeColors.textInverse }]}>
            {t(
              hasOwnerAccess
                ? 'profile.ownerBanner.portalCta'
                : 'profile.ownerBanner.cta',
            )}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ownerBanner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  ownerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerSubtitle: {
    fontSize: fontSizes.body,
    lineHeight: 20,
  },
  ownerCtaBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  ownerCtaText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  ownerCtaBtnDisabled: {
    opacity: 0.7,
  },
});
