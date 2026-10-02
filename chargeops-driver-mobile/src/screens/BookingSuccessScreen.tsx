import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BookingSuccessFooter,
  BookingSuccessGuideCard,
  BookingSuccessHero,
  BookingSuccessTransactionCard,
  BookingSuccessVoucher,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useBookingSuccess } from '@/hooks/useBookingSuccess';
import { spacing } from '@/theme';

/**
 * "Đặt chỗ thành công" — high-end post-payment confirmation screen.
 * Features a celebratory hero glow, digital receipt ticket voucher,
 * structured transaction breakdown, and a clean check-in stepper timeline.
 */
export function BookingSuccessScreen() {
  const { themeColors } = usePreferences();
  const { booking, copied, handleCopyCode, goHome, viewDetail } = useBookingSuccess();

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Celebration Hero Section */}
        <BookingSuccessHero />

        {/* Booking Code Voucher / Ticket Badge */}
        <BookingSuccessVoucher
          bookingCode={booking.code}
          copied={copied}
          onCopy={handleCopyCode}
        />

        {/* Transaction Summary Card */}
        <BookingSuccessTransactionCard booking={booking} />

        {/* Check-in Guide Stepper Card */}
        <BookingSuccessGuideCard />
      </ScrollView>

      {/* Footer CTAs */}
      <BookingSuccessFooter
        onViewDetail={viewDetail}
        onGoHome={goHome}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
});
