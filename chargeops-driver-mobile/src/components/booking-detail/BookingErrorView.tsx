import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackButton, AppButton } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { BookingApiError } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export interface BookingErrorViewProps {
  bookingId?: string;
  error: BookingApiError | Error | null;
  refreshing: boolean;
  copiedField: string | null;
  onRefresh: () => void;
  onCopy: (text: string, field: string) => void;
  onGoBack: () => void;
  onNavigateMyBookings: () => void;
  onNavigateHome: () => void;
}

export function BookingErrorView({
  bookingId,
  error,
  refreshing,
  copiedField,
  onRefresh,
  onCopy,
  onGoBack,
  onNavigateMyBookings,
  onNavigateHome,
}: BookingErrorViewProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const isForbidden =
    (error instanceof BookingApiError &&
      (error.code === 'BKG_NOT_ACCESS' || error.messageKey === 'error.booking.notAccess')) ||
    (error && typeof error === 'object' && (error as any).code === 'BKG_NOT_ACCESS');

  const isNetworkError =
    (error instanceof BookingApiError && error.code === 'NETWORK_ERROR') ||
    (error && typeof error === 'object' && (error as any).code === 'NETWORK_ERROR');

  const title = isForbidden
    ? t('bookingDetail.notAccessTitle', 'Không có quyền truy cập')
    : isNetworkError
    ? t('bookingDetail.networkErrorTitle', 'Lỗi kết nối mạng')
    : t('bookingDetail.notFoundTitle', 'Không tìm thấy đơn đặt chỗ');

  const desc = isForbidden
    ? t(
        'bookingDetail.notAccessSubtitle',
        'Lượt đặt chỗ này thuộc về tài xế khác hoặc tài khoản của bạn không được phép xem thông tin chi tiết. Vui lòng kiểm tra lại hoặc quay lại danh sách của bạn.',
      )
    : isNetworkError
    ? t(
        'bookingDetail.networkErrorDesc',
        'Không thể tải dữ liệu đặt chỗ. Vui lòng kiểm tra lại kết nối mạng.',
      )
    : t(
        'bookingDetail.notFoundDesc',
        'Đơn đặt chỗ này không tồn tại trên hệ thống hoặc đã bị xóa.',
      );

  const badgeLabel = isForbidden
    ? `${t('bookingDetail.notAccessBadge', 'TRUY CẬP BỊ TỪ CHỐI')} · 403`
    : isNetworkError
    ? 'LỖI KẾT NỐI'
    : '404 · KHÔNG TÌM THẤY';

  const toneColor = isForbidden
    ? themeColors.error
    : isNetworkError
    ? themeColors.warning
    : themeColors.textMuted;

  const iconName: IconName = isForbidden
    ? 'shield-half-outline'
    : isNetworkError
    ? 'cloud-offline-outline'
    : 'search-outline';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <AppBackButton accessibilityLabel={t('common.back')} onPress={onGoBack} />
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.title')}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.errorContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        <View
          style={[
            styles.errorOuterShell,
            {
              backgroundColor: `${toneColor}08`,
              borderColor: `${toneColor}28`,
            },
          ]}
        >
          <View
            style={[
              styles.errorInnerCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: `${toneColor}20`,
              },
            ]}
          >
            {/* Concentric Halo Icon */}
            <View style={[styles.errorConcentricOuter, { backgroundColor: `${toneColor}12` }]}>
              <View style={[styles.errorConcentricInner, { backgroundColor: `${toneColor}22` }]}>
                <Ionicons name={iconName} size={36} color={toneColor} />
              </View>
            </View>

            {/* Status Pill */}
            <View
              style={[
                styles.errorStatusPill,
                {
                  backgroundColor: `${toneColor}15`,
                  borderColor: `${toneColor}35`,
                },
              ]}
            >
              <Ionicons
                name={isForbidden ? 'lock-closed' : isNetworkError ? 'cloud-offline' : 'help-circle'}
                size={12}
                color={toneColor}
              />
              <Text style={[styles.errorStatusPillText, { color: toneColor }]}>{badgeLabel}</Text>
            </View>

            {/* Title & Desc */}
            <Text style={[styles.errorCardTitle, { color: themeColors.textStrong }]}>{title}</Text>
            <Text style={[styles.errorCardDesc, { color: themeColors.textMuted }]}>{desc}</Text>

            {/* Monospace UUID Chip */}
            {bookingId ? (
              <View
                style={[
                  styles.errorParamChip,
                  {
                    backgroundColor: themeColors.surfaceAlt,
                    borderColor: copiedField === 'errorParamId' ? `${themeColors.success}60` : themeColors.border,
                  },
                ]}
              >
                <View style={styles.errorParamChipHeader}>
                  <Text style={[styles.errorParamLabel, { color: themeColors.textMuted }]}>
                    {t('bookingDetail.queryBookingId', { id: '' }).replace(': ', '').trim() || 'MÃ TRUY VẤN'}
                  </Text>
                  {copiedField === 'errorParamId' ? (
                    <Text style={[styles.errorCopiedBadge, { color: themeColors.success }]}>
                      {t('common.copied', 'Đã sao chép')}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.errorParamRow}
                  onPress={() => onCopy(bookingId, 'errorParamId')}
                >
                  <Text
                    style={[
                      styles.errorParamValue,
                      {
                        color: themeColors.textStrong,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {bookingId}
                  </Text>
                  <Ionicons
                    name={copiedField === 'errorParamId' ? 'checkmark-circle' : 'copy-outline'}
                    size={15}
                    color={copiedField === 'errorParamId' ? themeColors.success : themeColors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.errorActionsGroup}>
              {isNetworkError ? (
                <AppButton
                  label={t('bookingDetail.retry', 'Thử lại')}
                  onPress={onRefresh}
                  variant="primary"
                  style={styles.errorActionBtn}
                />
              ) : (
                <AppButton
                  label={t('bookingDetail.backToMyBookings', 'Danh sách đặt chỗ của tôi')}
                  onPress={onNavigateMyBookings}
                  variant="primary"
                  style={styles.errorActionBtn}
                />
              )}
              <AppButton
                label={t('bookingDetail.backToHome', 'Về trang chủ')}
                onPress={onNavigateHome}
                variant="secondary"
                style={styles.errorActionBtn}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  errorContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorOuterShell: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 6,
  },
  errorInnerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorConcentricOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorConcentricInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  errorStatusPillText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  errorCardTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  errorCardDesc: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  errorParamChip: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
    marginTop: spacing.xs,
  },
  errorParamChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorParamLabel: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorCopiedBadge: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  errorParamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorParamValue: {
    flex: 1,
    fontSize: 12,
  },
  errorActionsGroup: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  errorActionBtn: {
    width: '100%',
  },
});
