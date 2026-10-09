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

        {/* 2. Timeline Stepper */}
        <Reveal delay={70} style={styles.revealGroup}>
          <SectionHeading
            icon="git-commit-outline"
            title={t('bookingDetail.timelineTitle', 'Tiến trình đặt chỗ')}
            color={themeColors.primary}
            textColor={themeColors.textStrong}
          />
          <BookingTimelineStepper booking={booking} />
        </Reveal>

        {/* 3. Checkout QR for Pending payment */}
        {isPending && (
          <Reveal delay={140} style={styles.revealGroup}>
            <CheckoutQRCard booking={booking} />
          </Reveal>
        )}

        {/* 4. Station & Connector Specifications Card */}
        <Reveal delay={210} style={styles.revealGroup}>
          <BookingStationCard
            booking={booking}
            copiedField={copiedField}
            onCopy={handleCopy}
          />
        </Reveal>

        {/* 5. Pricing Breakdown & Accounting Card */}
        <Reveal delay={280} style={styles.revealGroup}>
          <BookingPaymentCard
            booking={booking}
            hasAccountingDiscrepancy={hasAccountingDiscrepancy}
            durationText={durationText}
          />
        </Reveal>

        {/* 6. Refund Status Card (if cancelled or refund issued) */}
        {(isCancelled || (booking.refunds && booking.refunds.length > 0)) && (
          <Reveal delay={350} style={styles.revealGroup}>
            <RefundStatusCard booking={booking} />
          </Reveal>
        )}

        {/* 7. Refund Policy Guarantee Card (if active) */}
        {!isCancelled && (
          <Reveal delay={350} style={styles.revealGroup}>
            <BookingRefundPolicyCard
              isConfirmed={isConfirmed}
              refundableAmount={refundableAmount}
            />
          </Reveal>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  revealGroup: { gap: spacing.lg },
});
