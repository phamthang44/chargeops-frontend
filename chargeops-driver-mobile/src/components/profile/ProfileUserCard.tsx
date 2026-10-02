import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { getAvatarUrl } from '@/utils/imagekit';
import { initialsOf } from '@/utils/profile';

interface ProfileUserCardProps {
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  onPressAvatar: () => void;
  onPressCamera: () => void;
  onPressEdit: () => void;
}

export function ProfileUserCard({
  userName,
  userEmail,
  userAvatar,
  onPressAvatar,
  onPressCamera,
  onPressEdit,
}: ProfileUserCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Card style={[styles.userCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.userRow}>
        {/* Initials or Real Photo avatar */}
        <View style={styles.avatarWrapper}>
          <Pressable
            onPress={onPressAvatar}
            accessibilityRole="button"
            accessibilityLabel={userAvatar ? 'Xem ảnh đại diện' : t('profile.changeAvatar', 'Thay đổi ảnh đại diện')}
          >
            <View style={[styles.avatar, { backgroundColor: themeColors.primarySoft }]}>
              {userAvatar ? (
                <Image
                  source={{
                    uri: getAvatarUrl(userAvatar, 160),
                  }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarText, { color: themeColors.primaryDark }]}>
                  {initialsOf(userName)}
                </Text>
              )}
            </View>
          </Pressable>
          <Pressable
            style={[
              styles.cameraBadge,
              { backgroundColor: themeColors.primary, borderColor: themeColors.surface },
            ]}
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation?.();
              onPressCamera();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('profile.changeAvatar', 'Thay đổi ảnh đại diện')}
          >
            <Ionicons name="camera" size={11} color="#FFFFFF" />
          </Pressable>
          <View style={[styles.onlineBadge, { borderColor: themeColors.surface }]} />
        </View>

        {/* Name, Email & Member Tier */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: themeColors.textStrong }]}>{userName}</Text>
            <Ionicons name="checkmark-circle-sharp" size={18} color={themeColors.primary} />
          </View>
          <Text style={[styles.userEmail, { color: themeColors.textMuted }]}>{userEmail}</Text>

          <View
            style={[
              styles.goldBadge,
              { borderColor: themeColors.primary, backgroundColor: themeColors.primarySoft },
            ]}
          >
            <Text style={[styles.goldBadgeText, { color: themeColors.primaryDark }]}>
              {t('profile.goldMember')}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.edit.open')}
          hitSlop={8}
          onPress={onPressEdit}
          style={[styles.editButton, { backgroundColor: themeColors.surfaceAlt }]}
        >
          <Ionicons name="create-outline" size={19} color={themeColors.primary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  userCard: {
    padding: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  userEmail: {
    fontSize: fontSizes.body,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  goldBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
});
