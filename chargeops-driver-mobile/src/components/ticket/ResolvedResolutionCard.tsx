import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

export interface ResolvedResolutionCardProps {
  /** Mở hộp thoại xác nhận đóng phiếu (RESOLVED → CLOSED). */
  onConfirm: () => void;
  /** Mở modal "Vấn đề vẫn còn" (RESOLVED → IN_PROGRESS). */
  onContinue: () => void;
  /** Đang gọi API xác nhận — khoá cả hai nút. */
  confirming?: boolean;
}

/** Mass-carrying curve (Section 5 — never `linear` / `ease-in-out`). */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * "Sự cố đã được xử lý" — RESOLVED banner.
 *
 * Double-Bezel (Section 4.A): success-tinted outer shell -> surface inner core
 * with concentric radii (radius.xl - spacing.sm = radius.lg). Eyebrow tag,
 * island pill CTAs with nested icon chips, staggered reveal on mount.
 */
export function ResolvedResolutionCard({
  onConfirm,
  onContinue,
  confirming = false,
}: ResolvedResolutionCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(reveal, {
      toValue: 1,
      duration: 560,
      easing: EASE,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [reveal]);

  /** Staggered mask reveal — transform + opacity only (Section 6). */
  const stagger = (start: number, end: number) => ({
    opacity: reveal.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [start, end],
          outputRange: [16, 0],
          extrapolate: 'clamp',
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        styles.shell,
        {
          backgroundColor: themeColors.successSoft,
          borderColor: themeColors.successBorder,
          shadowColor: themeColors.success,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.3 : 0.14,
          shadowRadius: 22,
          elevation: 3,
        },
      ]}
    >
      <View style={[styles.core, { backgroundColor: themeColors.surface }]}>
        <Animated.View style={stagger(0, 0.55)}>
          <View style={styles.headRow}>
            <View style={[styles.iconTile, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="shield-checkmark" size={20} color={themeColors.success} />
            </View>

            <View style={styles.headText}>
              <View
                style={[
                  styles.eyebrow,
                  { backgroundColor: themeColors.successSoft, borderColor: themeColors.successBorder },
                ]}
              >
                <View style={[styles.eyebrowDot, { backgroundColor: themeColors.success }]} />
                <Text style={[styles.eyebrowText, { color: themeColors.primaryDark }]}>
                  {t('ticket.resolved.eyebrow', 'ĐÃ XỬ LÝ')}
                </Text>
              </View>

              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('ticket.resolved.bannerTitle', 'Sự cố đã được xử lý')}
              </Text>
            </View>
          </View>

          <Text style={[styles.body, { color: themeColors.textMuted }]}>
            {t(
              'ticket.resolved.bannerBody',
              'Nhân viên kỹ thuật đã báo cáo xử lý xong. Vui lòng xác nhận để đóng phiếu, hoặc phiếu sẽ tự đóng sau khi hết hạn phản hồi.'
            )}
          </Text>
        </Animated.View>

        <Animated.View style={stagger(0.2, 0.78)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ticket.confirm.confirmBtn', 'Đồng ý, đã giải quyết')}
            onPress={onConfirm}
            disabled={confirming}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: themeColors.primary,
                shadowColor: themeColors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.5 : 0.34,
                shadowRadius: 16,
                elevation: 4,
                transform: [{ scale: pressed && !confirming ? 0.97 : 1 }],
                opacity: confirming ? 0.65 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={[styles.ctaIconChip, { backgroundColor: themeColors.surface }]}>
              <Ionicons name="checkmark" size={16} color={themeColors.primary} />
            </View>
            <Text style={styles.ctaLabel}>
              {confirming
                ? t('ticket.confirm.confirming', 'Đang xác nhận...')
                : t('ticket.confirm.confirmBtn', 'Đồng ý, đã giải quyết')}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={stagger(0.34, 0.92)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ticket.continue.action', 'Vấn đề vẫn còn')}
            onPress={onContinue}
            disabled={confirming}
            style={({ pressed }) => [
              styles.cta,
              styles.ctaGhost,
              {
                backgroundColor: themeColors.surfaceAlt,
                borderColor: themeColors.border,
                transform: [{ scale: pressed && !confirming ? 0.97 : 1 }],
                opacity: confirming ? 0.65 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={[styles.ctaIconChip, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="refresh" size={15} color={themeColors.primaryDark} />
            </View>
            <Text style={[styles.ctaLabel, { color: themeColors.textStrong }]}>
              {t('ticket.continue.action', 'Vấn đề vẫn còn')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Outer shell of the Double-Bezel.
  shell: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  // Inner core — concentric radius (radius.xl - spacing.sm).
  core: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  eyebrowText: {
    fontSize: fontSizes.micro,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSizes.heading,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: fontSizes.body,
    lineHeight: 20,
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
