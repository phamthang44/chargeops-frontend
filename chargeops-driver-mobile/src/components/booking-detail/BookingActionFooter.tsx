import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime } from '@/utils/format';

export interface BookingActionFooterProps {
  booking: Booking;
  isConfirmed: boolean;
  isPending: boolean;
  isCharging: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  canCheckIn: boolean;
  checkInReason: string;
  canCancel: boolean;
  canReportIssue: boolean;
  onCheckIn: () => void;
  onOpenCancel: () => void;
  onPayNow: () => void;
  onViewChargingSession: () => void;
  onReportIssue: () => void;
  onRebook?: () => void;
  isTabletOrSplit?: boolean;
}

export function BookingActionFooter({
  booking,
  isConfirmed,
  isPending,
  isCharging,
  isCompleted,
  isCancelled,
  isExpired,
  canCheckIn,
  checkInReason,
  canCancel,
  canReportIssue,
  onCheckIn,
  onOpenCancel,
  onPayNow,
  onViewChargingSession,
  onReportIssue,
  onRebook,
  isTabletOrSplit = false,
}: BookingActionFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  if (isConfirmed) {
    return (
      <View style={[styles.footerWrapper, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={[styles.footerContent, isTabletOrSplit && styles.footerContentSplit]}>
          {isTabletOrSplit && (
            <View style={styles.tabletHintRow}>
              <View style={[styles.hintIconBox, { backgroundColor: `${themeColors.primary}18` }]}>
                <Ionicons name="shield-checkmark" size={20} color={themeColors.primaryDark} />
              </View>
              <View style={styles.hintCopy}>
                <Text style={[styles.hintTitle, { color: themeColors.textStrong }]}>
                  {t('bookingDetail.confirmedHeading', 'Đặt chỗ đã được xác nhận')}
                </Text>
                <Text style={[styles.hintSubtitle, { color: themeColors.textMuted }]}>
                  {canCheckIn
                    ? t('bookingDetail.checkInReadyHint', 'Cổng sạc sẵn sàng. Vui lòng check-in khi bạn đến trạm.')
                    : t('bookingDetail.checkInPendingHint', 'Vui lòng di chuyển đến trạm đúng giờ để check-in.')}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.actionsRow, isTabletOrSplit && styles.actionsRowSplit]}>
            <AppButton
              label={t('bookingDetail.cancel')}
              variant="secondary"
              disabled={!canCancel}
              onPress={onOpenCancel}
              style={isTabletOrSplit ? styles.actionBtnSplit : undefined}
            />
            <AppButton
              label={
                canCheckIn
                  ? t('bookingDetail.cta')
                  : checkInReason === 'TOO_EARLY'
                  ? t('bookingDetail.checkInOpensIn', { time: formatTime(booking.checkInOpensAt ?? booking.startAt) })
                  : checkInReason === 'WINDOW_CLOSED'
                  ? t('bookingDetail.checkInClosed')
                  : t('bookingDetail.cta')
              }
              disabled={!canCheckIn}
              icon={canCheckIn ? 'qr-code-outline' : undefined}
              onPress={onCheckIn}
              style={isTabletOrSplit ? styles.actionBtnSplit : undefined}
            />
          </View>
        </View>
      </View>
    );
  }

  if (isPending) {
    const isSimulator = booking.checkout?.method
      ? booking.checkout.method === 'SIMULATOR'
      : booking.paymentMethod === 'SIMULATOR';

    return (
      <View style={[styles.footerWrapper, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={[styles.footerContent, isTabletOrSplit && styles.footerContentSplit]}>
          {isTabletOrSplit && (
            <View style={styles.tabletHintRow}>
              <View style={[styles.hintIconBox, { backgroundColor: `${themeColors.warning}18` }]}>
                <Ionicons name="time" size={20} color={themeColors.warning} />
              </View>
              <View style={styles.hintCopy}>
                <Text style={[styles.hintTitle, { color: themeColors.textStrong }]}>
                  {t('bookingDetail.pendingPaymentTitle', 'Đang chờ thanh toán')}
                </Text>
                <Text style={[styles.hintSubtitle, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.pendingPaymentHint', 'Vui lòng hoàn tất thanh toán để giữ chỗ trước khi hết hạn.')}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.actionsRow, isTabletOrSplit && styles.actionsRowSplit]}>
            <AppButton
              label={t('bookingDetail.cancel', 'Hủy đặt chỗ')}
              variant="secondary"
              disabled={!canCancel}
              onPress={onOpenCancel}
              style={isTabletOrSplit ? styles.actionBtnSplit : undefined}
            />
            <AppButton
              label={
                isSimulator
                  ? t('payment.simulatorCta', 'Xác nhận đã thanh toán')
                  : t('payment.iHaveTransferred', 'Tôi đã chuyển khoản')
              }
              onPress={onPayNow}
              style={isTabletOrSplit ? styles.actionBtnSplit : undefined}
            />
          </View>
        </View>
      </View>
    );
  }

  if (isCharging) {
    return (
      <View style={[styles.footerWrapper, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={[styles.footerContent, isTabletOrSplit && styles.footerContentSplit]}>
          {isTabletOrSplit && (
            <View style={styles.tabletHintRow}>
              <View style={[styles.hintIconBox, { backgroundColor: `${themeColors.success}18` }]}>
                <Ionicons name="flash" size={20} color={themeColors.success} />
              </View>
              <View style={styles.hintCopy}>
                <Text style={[styles.hintTitle, { color: themeColors.textStrong }]}>
                  {t('bookingDetail.chargingLiveTitle', 'Phiên sạc đang diễn ra')}
                </Text>
                <Text style={[styles.hintSubtitle, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.chargingLiveHint', 'Theo dõi công suất và thời gian sạc trực tiếp trên xe.')}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.actionsRow, isTabletOrSplit && styles.actionsRowSplit]}>
            <AppButton
              label={t('chargingSession.title', 'Xem phiên sạc trực tiếp')}
              icon="flash-outline"
              onPress={onViewChargingSession}
              style={isTabletOrSplit ? styles.actionBtnSplit : undefined}
            />
          </View>
        </View>
      </View>
    );
  }

  if (isCompleted || isCancelled || isExpired) {
    return (
      <View style={[styles.footerWrapper, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={[styles.footerContent, isTabletOrSplit && styles.footerContentSplit]}>
          {isTabletOrSplit && (
            <View style={styles.tabletHintRow}>
              <View
                style={[
                  styles.hintIconBox,
                  {
                    backgroundColor: isCancelled || isExpired
                      ? `${themeColors.error}14`
                      : `${themeColors.success}14`,
                  },
                ]}
              >
                <Ionicons
                  name={isCancelled || isExpired ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={isCancelled || isExpired ? themeColors.error : themeColors.success}
                />
              </View>
              <View style={styles.hintCopy}>
                <Text style={[styles.hintTitle, { color: themeColors.textStrong }]}>
                  {isCancelled
                    ? t('bookingDetail.cancelledTitle', 'Đặt chỗ đã được hủy')
                    : isExpired
                    ? t('bookingDetail.expiredTitle', 'Đã quá hạn check-in')
                    : t('bookingDetail.completedTitle', 'Phiên sạc hoàn tất')}
                </Text>
                <Text style={[styles.hintSubtitle, { color: themeColors.textMuted }]}>
                  {isCancelled || isExpired
                    ? t('bookingDetail.slotFreedHint', 'Slot sạc đã được tự động giải phóng. Bạn có thể đặt lại phiên sạc mới bất cứ lúc nào.')
                    : t('bookingDetail.thankYouHint', 'Cảm ơn bạn đã lựa chọn mạng lưới trạm sạc ChargeOps.')}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.actionsRow, isTabletOrSplit && styles.actionsRowSplit]}>
            {canReportIssue && (
              <Pressable
                style={[
                  styles.reportIssueBtn,
                  isTabletOrSplit && styles.reportIssueBtnSplit,
                  {
                    backgroundColor: `${themeColors.warning}14`,
                    borderColor: `${themeColors.warning}44`,
                  },
                ]}
                onPress={onReportIssue}
              >
                <Ionicons name="alert-circle-outline" size={18} color={themeColors.warning} />
                <Text style={[styles.reportIssueBtnText, { color: themeColors.warning }]}>
                  {t('bookingDetail.reportIssueShort', 'Báo cáo sự cố')}
                </Text>
              </Pressable>
            )}

            {onRebook && (
              <Pressable
                style={[
                  styles.rebookBtn,
                  isTabletOrSplit && styles.rebookBtnSplit,
                  { backgroundColor: themeColors.primary },
                ]}
                onPress={onRebook}
              >
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.rebookBtnText}>
                  {t('bookingDetail.rebookCta', 'Đặt lại trạm này')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  footerWrapper: {
    width: '100%',
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 12,
  },
  footerContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  footerContentSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  tabletHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  hintIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCopy: {
    flex: 1,
    gap: 2,
  },
  hintTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  hintSubtitle: {
    fontSize: fontSizes.caption,
  },
  actionsRow: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  actionsRowSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    flexShrink: 0,
  },
  actionBtnSplit: {
    minWidth: 160,
  },
  reportIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.2,
    minHeight: 48,
  },
  reportIssueBtnSplit: {
    minWidth: 150,
  },
  reportIssueBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 4,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    minHeight: 48,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rebookBtnSplit: {
    minWidth: 180,
  },
  rebookBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});

