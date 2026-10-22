import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { getAvatarPreviewSize } from '@/utils/overlayLayout';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { buildImageKitUrl } from '@/utils/imagekit';

interface AvatarViewerModalProps {
  visible: boolean;
  onClose: () => void;
  avatarUrl?: string | null;
  displayName?: string | null;
  onEdit?: () => void;
}


export function AvatarViewerModal({
  visible,
  onClose,
  avatarUrl,
  displayName,
  onEdit,
}: AvatarViewerModalProps) {
  const { availableWidth, availableHeight } = useAdaptiveLayout();
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const previewSize = Math.max(0, Math.min(
    getAvatarPreviewSize(availableWidth, availableHeight),
    stageSize.width - spacing.md * 2,
    stageSize.height,
  ));
  const previewStyle = { width: previewSize, height: previewSize };
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'circle' | 'full'>('circle');

  if (!visible) return null;

  const displayInitials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .slice(-2)
        .join('')
    : 'EV';

  // High-res image URL (1000px for crystal clear quality)
  const highResUrl = avatarUrl
    ? buildImageKitUrl(avatarUrl, {
        width: 1000,
        height: 1000,
        quality: 92,
        crop: 'maintain_ratio',
        format: 'auto',
      })
    : null;

  // Uncropped original image URL
  const rawUrl = avatarUrl || '';

  const handleOpenOriginalInTab = () => {
    if (rawUrl) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(rawUrl, '_blank');
      } else {
        Linking.openURL(rawUrl).catch(() => {});
      }
    }
  };

  const handleEditPress = () => {
    onClose();
    if (onEdit) {
      setTimeout(() => {
        onEdit();
      }, 150);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Dark blurred background */}
        <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Top Navigation Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.titleColumn}>
            <Text style={styles.displayNameText} numberOfLines={1}>
              {displayName || t('profile.avatarViewer.defaultTitle', 'Ảnh đại diện')}
            </Text>
            <Text style={styles.subtitleText}>
              {avatarUrl
                ? t('profile.avatarViewer.hiResSubtitle', 'Chế độ xem độ phân giải cao')
                : t('profile.avatarViewer.noAvatarSubtitle', 'Chưa có ảnh đại diện')}
            </Text>
          </View>

          <View style={styles.topActions}>
            {Boolean(avatarUrl) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.avatarViewer.openOriginal', 'Mở ảnh gốc')}
                hitSlop={8}
                onPress={handleOpenOriginalInTab}
                style={styles.iconCircleBtn}
              >
                <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Đóng')}
              hitSlop={8}
              onPress={onClose}
              style={styles.iconCircleBtn}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Mode Switch Pills (Circle Avatar vs Full Photo) */}
        {Boolean(avatarUrl) && (
          <View style={styles.modePillRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: viewMode === 'circle' }}
              style={[
                styles.modePill,
                viewMode === 'circle' && styles.modePillActive,
              ]}
              onPress={() => setViewMode('circle')}
            >
              <Ionicons
                name="ellipse-outline"
                size={14}
                color={viewMode === 'circle' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
              <Text
                style={[
                  styles.modePillText,
                  viewMode === 'circle' && styles.modePillTextActive,
                ]}
              >
                {t('profile.avatarViewer.circleMode', 'Vòng tròn Avatar')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: viewMode === 'full' }}
              style={[
                styles.modePill,
                viewMode === 'full' && styles.modePillActive,
              ]}
              onPress={() => setViewMode('full')}
            >
              <Ionicons
                name="scan-outline"
                size={14}
                color={viewMode === 'full' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
              <Text
                style={[
                  styles.modePillText,
                  viewMode === 'full' && styles.modePillTextActive,
                ]}
              >
                {t('profile.avatarViewer.fullMode', 'Ảnh gốc đầy đủ')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Center Stage: The Avatar */}
        <View style={styles.centerStage} onLayout={({ nativeEvent: { layout } }) => {
          setStageSize(previous => previous.width === layout.width && previous.height === layout.height
            ? previous : { width: layout.width, height: layout.height });
        }}>
          {avatarUrl ? (
            <View
              style={[
                styles.avatarFrame,
                previewStyle,
                viewMode === 'circle' ? { borderRadius: previewSize / 2 } : styles.avatarFullFrame,
              ]}
            >
              <Image
                source={{ uri: (viewMode === 'circle' ? highResUrl : avatarUrl) || avatarUrl || '' }}
                style={styles.avatarImage}
                resizeMode={viewMode === 'circle' ? 'cover' : 'contain'}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />

              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.avatarFrame, previewStyle, { borderRadius: previewSize / 2 }, styles.initialsFrame]}>
              <Text style={styles.initialsText}>{displayInitials}</Text>
            </View>
          )}
        </View>

        {/* Bottom Actions Bar */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          {onEdit && (
            <Pressable
              accessibilityRole="button"
              style={[styles.actionBtn, { backgroundColor: themeColors.primary }]}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>
                {avatarUrl
                  ? t('profile.avatarViewer.changePhoto', 'Thay đổi & Căn chỉnh ảnh')
                  : t('profile.avatarViewer.uploadNewPhoto', 'Tải lên ảnh mới')}
              </Text>
            </Pressable>
          )}

          <Pressable accessibilityRole="button" style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('common.close', 'Đóng')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.92)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  titleColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  displayNameText: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  subtitleText: {
    fontSize: fontSizes.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    zIndex: 10,
  },
  modePill: {
    minHeight: 48,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modePillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: '#FFFFFF',
  },
  modePillText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: fontWeights.medium,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeights.semibold,
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  avatarFrame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#090D16',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
    }),
    elevation: 10,
  },
  avatarFullFrame: {
    borderRadius: 20,
  },
  initialsFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderColor: 'rgba(22, 163, 74, 0.4)',
  },
  initialsText: {
    fontSize: 72,
    fontWeight: fontWeights.bold,
    color: '#22C55E',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    zIndex: 10,
  },
  actionBtn: {
    minHeight: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  actionBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  closeBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  closeBtnText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
});
