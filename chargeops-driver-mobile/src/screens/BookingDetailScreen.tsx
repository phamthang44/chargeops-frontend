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
import { usePreferences } from '@/context/PreferencesContext';
import { useBookingDetail } from '@/hooks/useBookingDetail';
import type { RootStackParamList } from '@/navigation/types';
import { fontSizes, fontWeights, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingDetail'>;
type Route = RouteProp<RootStackParamList, 'BookingDetail'>;

export function BookingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

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
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
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
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
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
        {/* 1. Hero Status & Timing Card */}
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

        {/* 2. Timeline Stepper */}
        <SectionHeading
          icon="git-commit-outline"
          title={t('bookingDetail.timelineTitle', 'Tiến trình đặt chỗ')}
          color={themeColors.primary}
          textColor={themeColors.textStrong}
        />
        <BookingTimelineStepper booking={booking} />

        {/* 3. Checkout QR for Pending payment */}
        {isPending && (
          <CheckoutQRCard
            booking={booking}
            onPayNow={() => navigation.navigate('PaymentProcessing', { bookingId: booking.id })}
          />
        )}

        {/* 4. Station & Connector Specifications Card */}
        <BookingStationCard
          booking={booking}
          copiedField={copiedField}
          onCopy={handleCopy}
        />

        {/* 5. Pricing Breakdown & Accounting Card */}
        <BookingPaymentCard
          booking={booking}
          hasAccountingDiscrepancy={hasAccountingDiscrepancy}
          durationText={durationText}
        />

        {/* 6. Refund Status Card (if cancelled or refund issued) */}
        {(isCancelled || (booking.refunds && booking.refunds.length > 0)) && (
          <RefundStatusCard booking={booking} />
        )}

        {/* 7. Refund Policy Guarantee Card (if active) */}
        {!isCancelled && (
          <BookingRefundPolicyCard
            isConfirmed={isConfirmed}
            refundableAmount={refundableAmount}
          />
        )}
      </ScrollView>

      {/* Sticky Action Footer */}
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
});
