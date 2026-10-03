import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

export type ConfirmSheetTone = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  tone?: ConfirmSheetTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /**
   * `confirm` — 2 nút (Xác nhận / Hủy). Dùng cho thay thế `Alert.alert`.
   * `notice` — 1 nút Đóng. Dùng cho thông báo lỗi/thành công.
   */
  mode?: 'confirm' | 'notice';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Đang xử lý — nút xác nhận hiện spinner, backdrop không đóng được. */
  loading?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

/** Mass-carrying curve (Section 5 — never `linear` / `ease-in-out`). */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

const EYEBROW_KEY: Record<ConfirmSheetTone, string> = {
  success: 'common.eyebrow.success',
  error: 'common.eyebrow.error',
  warning: 'common.eyebrow.warning',
  info: 'common.eyebrow.info',
  neutral: 'common.eyebrow.confirm',
};

const DEFAULT_ICON: Record<ConfirmSheetTone, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
  neutral: 'help-circle',
};

/**
 * Cross-platform confirmation / notice dialog (replaces `Alert.alert`, which is
 * a no-op stub on react-native-web).
 *
 * Double-Bezel card (outer shell -> inner core), island pill CTAs with nested
 * icon chips, enter/exit choreography on `transform` + `opacity` only.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  tone = 'neutral',
  icon,
  mode = 'confirm',
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backdrop = useRef(new Animated.Value(0)).current;
  // 1 = parked off-stage, 0 = settled in place.
  const lift = useRef(new Animated.Value(1)).current;

  const unmount = () => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    if (!mountedRef.current) return;
    mountedRef.current = false;
    setMounted(false);
  };

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          easing: EASE,
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration: 360,
          easing: EASE,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mountedRef.current) return;
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 160,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 1,
        duration: 240,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) unmount();
    });
    // Safety net: animation callback có thể không bao giờ chạy trên web
    // (hoặc bị interrupted) — vẫn phải tháo modal để không nuốt sự kiện chạm.
    exitTimer.current = setTimeout(unmount, 320);

    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
        exitTimer.current = null;
      }
    };
  }, [visible, backdrop, lift]);

  if (!mounted) return null;

  const accent =
    tone === 'success'
      ? themeColors.success
      : tone === 'error'
        ? themeColors.error
        : tone === 'warning'
          ? themeColors.warning
          : tone === 'info'
            ? themeColors.info
            : themeColors.primary;

  const accentSoft = tone === 'success' ? themeColors.successSoft : themeColors.surfaceAlt;
  const accentHairline = tone === 'success' ? themeColors.successBorder : themeColors.border;
  const dismissLabel = cancelLabel ?? t('common.cancel', 'Hủy');

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.backdrop, { backgroundColor: themeColors.overlay, opacity: backdrop }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', 'Đóng')}
          onPress={loading ? undefined : onClose}
          disabled={loading}
        />

        <Animated.View
          style={[
            styles.dock,
            {
              opacity: backdrop,
              transform: [
                {
                  translateY: lift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: lift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.96],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {/* Outer shell */}
          <View
            style={[
              styles.shell,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
            ]}
          >
            {/* Inner core */}
            <View
              style={[
                styles.core,
                {
                  backgroundColor: themeColors.surface,
                  shadowColor: accent,
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.22,
                  shadowRadius: 32,
                  elevation: 8,
                },
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: accentSoft, borderColor: accentHairline }]}>
                <Ionicons name={icon ?? DEFAULT_ICON[tone]} size={26} color={accent} />
              </View>

              <View style={[styles.eyebrow, { backgroundColor: accentSoft, borderColor: accentHairline }]}>
                <Text style={[styles.eyebrowText, { color: accent }]}>
                  {t(EYEBROW_KEY[tone], 'XÁC NHẬN')}
                </Text>
              </View>

              <Text style={[styles.title, { color: themeColors.textStrong }]}>{title}</Text>

              {message ? (
                <Text style={[styles.message, { color: themeColors.textMuted }]}>{message}</Text>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={confirmLabel ?? title}
                  onPress={mode === 'confirm' ? onConfirm : onClose}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.cta,
                    {
                      backgroundColor: accent,
                      shadowColor: accent,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.34,
                      shadowRadius: 16,
                      elevation: 4,
                      transform: [{ scale: pressed && !loading ? 0.97 : 1 }],
                      opacity: loading ? 0.75 : pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      {mode === 'confirm' ? (
                        <View style={[styles.ctaIconChip, { backgroundColor: themeColors.surface }]}>
                          <Ionicons name="checkmark" size={16} color={accent} />
                        </View>
                      ) : null}
                      <Text style={styles.ctaLabel}>
                        {confirmLabel ?? t('common.close', 'Đóng')}
                      </Text>
                    </>
                  )}
                </Pressable>

                {mode === 'confirm' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={dismissLabel}
                    onPress={onClose}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.cta,
                      styles.ctaGhost,
                      {
                        backgroundColor: themeColors.surfaceAlt,
                        borderColor: themeColors.border,
                        transform: [{ scale: pressed && !loading ? 0.97 : 1 }],
                        opacity: loading ? 0.5 : pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.ctaLabel, { color: themeColors.textStrong }]}>
                      {dismissLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  dock: {
    width: '100%',
    maxWidth: 420,
  },
  // Outer shell of the Double-Bezel.
  shell: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  // Inner core — concentric radius (radius.xl - spacing.sm).
  core: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  eyebrow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowText: {
    fontSize: fontSizes.micro,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSizes.heading,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: fontSizes.body,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  ctaGhost: {
    borderWidth: 1,
  },
  ctaIconChip: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});
