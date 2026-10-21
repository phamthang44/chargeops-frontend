import { Ionicons } from '@expo/vector-icons';
import { TaskColumns } from '@/components/common/TaskColumns';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppBackButton,
  BookingActionFooter,
  BookingErrorView,
  BookingHeroCard,
  BookingPaymentCard,
  BookingRefundPolicyCard,
  BookingStationCard,
  BookingTimelineStepper,
  CancelBookingSheet,
  CheckoutQRCard,
  RefundStatusCard,
  SectionHeading,
} from '@/components';
import { Reveal } from '@/components/common/Reveal';
import { usePreferences } from '@/context/PreferencesContext';
import { useBookingDetail } from '@/hooks/useBookingDetail';
import { useTaskLayout } from '@/hooks/useTaskLayout';
import type { RootStackParamList } from '@/navigation/types';
import { fontSizes, fontWeights, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingDetail'>;
type Route = RouteProp<RootStackParamList, 'BookingDetail'>;

export function BookingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const { split } = useTaskLayout();

  const {
    booking,
    setBooking,
    loading,
    error,
    refreshing,
    showCancel,
    setShowCancel,
    copiedField,
    handleCopy,
    handleRefresh,
    isConfirmed,
    isPending,
    isCancelled,
    isCompleted,
    isCharging,
    isExpired,
    windowStarted,
    canCheckIn,
    checkInReason,
    graceRemainingMs,
    isWithinGrace,
    canCancel,
    refundableAmount,
    canReportIssue,
    durationText,
    tone,
    accent,
    statusNote,
    hasAccountingDiscrepancy,
    msToCheckInClose,
  } = useBookingDetail(params.bookingId);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <AppBackButton accessibilityLabel={t('common.back')} onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleBlock}>
            <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.title')}</Text>
          </View>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <BookingErrorView
        bookingId={params.bookingId}
        error={error}
        refreshing={refreshing}
        copiedField={copiedField}
        onRefresh={handleRefresh}
        onCopy={handleCopy}
        onGoBack={() => navigation.goBack()}
        onNavigateMyBookings={() => navigation.navigate('Tabs', { screen: 'Bookings' })}
        onNavigateHome={() => navigation.navigate('Tabs', { screen: 'Map' })}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <AppBackButton accessibilityLabel={t('common.back')} onPress={() => navigation.goBack()} />
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingDetail.title')}</Text>
          <Text style={[styles.headerRole, { color: themeColors.primary }]}>{t('bookingDetail.role')}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        <TaskColumns
          main={
            <>
              {/* 1. Hero Status & Timing Card */}
              <Reveal delay={0} style={styles.revealGroup}>
                <BookingHeroCard
                  booking={booking}
                  tone={tone}
                  accent={accent}
                  statusNote={statusNote}
                  copiedField={copiedField}
                  onCopy={handleCopy}
                  isConfirmed={isConfirmed}
                  windowStarted={windowStarted}
                  msToCheckInClose={msToCheckInClose}
                  isWithinGrace={isWithinGrace}
                  graceRemainingMs={graceRemainingMs}
                  isCharging={isCharging}
                />
              </Reveal>

              {/* On phone: Timeline Stepper sits directly beneath Hero card */}
              {!split && (
                <Reveal delay={70} style={styles.revealGroup}>
                  <SectionHeading
                    icon="git-commit-outline"
                    title={t('bookingDetail.timelineTitle', 'Tiến trình đặt chỗ')}
                    color={themeColors.primary}
                    textColor={themeColors.textStrong}
                  />
                  <BookingTimelineStepper booking={booking} />
                </Reveal>
              )}

              {/* Checkout QR for Pending payment */}
              {isPending && (
                <Reveal delay={140} style={styles.revealGroup}>
                  <CheckoutQRCard booking={booking} />
                </Reveal>
              )}

              {/* Station & Connector Specifications Card */}
              <Reveal delay={split ? 70 : 210} style={styles.revealGroup}>
                <BookingStationCard
                  booking={booking}
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
              </Reveal>
            </>
          }
          aside={
            <>
              {/* On Tablet / In-Car screen: Timeline Stepper sits prominently at the top of the right column */}
              {split && (
                <Reveal delay={70} style={styles.revealGroup}>
                  <SectionHeading
                    icon="git-commit-outline"
                    title={t('bookingDetail.timelineTitle', 'Tiến trình đặt chỗ')}
                    color={themeColors.primary}
                    textColor={themeColors.textStrong}
                  />
                  <BookingTimelineStepper booking={booking} />
                </Reveal>
              )}

              {/* Pricing Breakdown & Accounting Card */}
              <Reveal delay={split ? 140 : 280} style={styles.revealGroup}>
                <BookingPaymentCard
                  booking={booking}
                  hasAccountingDiscrepancy={hasAccountingDiscrepancy}
                  durationText={durationText}
                />
              </Reveal>

              {/* Refund Status Card (if cancelled or refund issued) */}
              {(isCancelled || (booking.refunds && booking.refunds.length > 0)) && (
                <Reveal delay={350} style={styles.revealGroup}>
                  <RefundStatusCard booking={booking} />
                </Reveal>
              )}

              {/* Refund Policy Guarantee Card (if active) */}
              {!isCancelled && (
                <Reveal delay={350} style={styles.revealGroup}>
                  <BookingRefundPolicyCard
                    isConfirmed={isConfirmed}
                    refundableAmount={refundableAmount}
                  />
                </Reveal>
              )}

              {/* Information & Guidance Card when booking is terminal (cancelled/expired) with no refund */}
              {(isCancelled || isExpired) && (!booking.refunds || booking.refunds.length === 0) && (
                <Reveal delay={350} style={styles.revealGroup}>
                  <View
                    style={[
                      styles.terminalSupportCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <View style={styles.terminalSupportHeader}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={isExpired ? themeColors.error : themeColors.textMuted}
                      />
                      <Text style={[styles.terminalSupportTitle, { color: themeColors.textStrong }]}>
                        {t('bookingDetail.supportInfoTitle', 'Thông tin phiên đặt chỗ')}
                      </Text>
                    </View>
                    <Text style={[styles.terminalSupportBody, { color: themeColors.textMuted }]}>
                      {isExpired
                        ? t(
                            'bookingDetail.expiredExplanation',
                            'Phiên đặt chỗ đã kết thúc do xe không đến trạm check-in trước thời hạn. Cổng sạc đã được tự động mở lại cho các tài xế khác trên hệ thống.',
                          )
                        : t(
                            'bookingDetail.cancelledExplanation',
                            'Phiên đặt chỗ đã được hủy theo yêu cầu. Bạn có thể chọn đặt lại trạm này hoặc tìm kiếm trạm khác trên bản đồ.',
                          )}
                    </Text>
                  </View>
                </Reveal>
              )}
            </>
          }
        />
      </ScrollView>

      {/* Sticky Action Footer (Docked edge-to-edge with matched tablet max-width) */}
      <BookingActionFooter
        booking={booking}
        isConfirmed={isConfirmed}
        isPending={isPending}
        isCharging={isCharging}
        isCompleted={isCompleted}
        isCancelled={isCancelled}
        isExpired={isExpired}
        canCheckIn={canCheckIn}
        checkInReason={checkInReason}
        canCancel={canCancel}
        canReportIssue={canReportIssue}
        isTabletOrSplit={split}
        onCheckIn={() => navigation.navigate('QRCheckIn', { bookingId: booking.id })}
        onOpenCancel={() => setShowCancel(true)}
        onPayNow={() => navigation.navigate('PaymentProcessing', { bookingId: booking.id })}
        onViewChargingSession={() => navigation.navigate('ChargingSession', { bookingId: booking.id })}
        onReportIssue={() => {
          navigation.navigate('CreateTicket', {
            bookingId: booking.id,
            stationId: booking.stationId,
            stationName: booking.stationName,
            defaultCategory: 'CHARGING_ISSUE',
          });
        }}
        onRebook={() => {
          navigation.navigate('StationDetail', { stationId: booking.stationId });
        }}
      />

      {/* Cancellation Bottom Sheet */}
      <CancelBookingSheet
        visible={showCancel}
        booking={booking}
        onClose={() => setShowCancel(false)}
        onConfirmed={(updated) => {
          setBooking(updated);
          setShowCancel(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  revealGroup: { gap: spacing.lg },
  terminalSupportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  terminalSupportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
  },
  terminalSupportTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  terminalSupportBody: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
});

