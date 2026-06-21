import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { cancelBooking, confirmPayment, getBookingById } from '@/services/bookingService';
import type { PaymentResultStatus } from '@/services/simulation';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';
import { PAYMENT_META } from '@/utils/payments';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PaymentProcessing'>;
type Route = RouteProp<RootStackParamList, 'PaymentProcessing'>;

// SUCCESS is never stored as a phase — it navigates away immediately.
type FailPhase = Exclude<PaymentResultStatus, 'SUCCESS'>;
type Phase = 'processing' | FailPhase;

// Failure presentation per gateway outcome.
const FAILURE_META: Record<
  FailPhase,
  { icon: keyof typeof Ionicons.glyphMap; color: string; retry: boolean }
> = {
  FAILED: { icon: 'close-circle', color: colors.error, retry: true },
  TIMEOUT: { icon: 'time-outline', color: colors.warning, retry: true },
  CANCELLED: { icon: 'ban-outline', color: colors.textMuted, retry: false },
};

/**
 * "Đang xử lý thanh toán" — the booking is PENDING and we're waiting for the
 * payment gateway. Handles every outcome: SUCCESS hands off to BookingSuccess;
 * FAILED/TIMEOUT offer a retry; CANCELLED ends the transaction. Back/swipe are
 * disabled (route opts) so a transaction can't be interrupted mid-flight.
 */
export function PaymentProcessingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [phase, setPhase] = useState<Phase>('processing');

  useEffect(() => {
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) setBooking(b);
    });
    return () => {
      active = false;
    };
  }, [params.bookingId]);

  const attempt = useCallback(() => {
    let active = true;
    setPhase('processing');
    confirmPayment(params.bookingId).then((res) => {
      if (!active) return;
      if (res.status === 'SUCCESS') {
        navigation.replace('BookingSuccess', { bookingId: params.bookingId });
      } else {
        if (res.booking) setBooking(res.booking);
        setPhase(res.status);
      }
    });
    return () => {
      active = false;
    };
  }, [params.bookingId, navigation]);

  // Kick off the first attempt on mount.
  useEffect(() => attempt(), [attempt]);

  function goHome() {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  }

  async function cancelAndExit() {
    await cancelBooking(params.bookingId);
    goHome();
  }

  const meta = booking ? PAYMENT_META[booking.paymentMethod] : null;
  const methodLabel = booking ? t(`payment.${booking.paymentMethod}`) : '';

  // ---- Failure / cancelled state ----
  if (phase !== 'processing') {
    const f = FAILURE_META[phase];
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={[styles.resultIcon, { backgroundColor: `${f.color}1A` }]}>
            <Ionicons name={f.icon} size={44} color={f.color} />
          </View>
          <Text style={styles.title}>{t(`paymentProcessing.${phase}.title`)}</Text>
          <Text style={styles.subtitle}>{t(`paymentProcessing.${phase}.body`)}</Text>

          {booking && (
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>{t('paymentProcessing.amount')}</Text>
              <Text style={styles.amount}>{formatVnd(booking.totalPrice)}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {f.retry && <AppButton label={t('paymentProcessing.retry')} onPress={attempt} />}
          <AppButton
            label={f.retry ? t('paymentProcessing.cancel') : t('paymentProcessing.home')}
            variant={f.retry ? 'secondary' : 'primary'}
            onPress={f.retry ? cancelAndExit : goHome}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Processing state ----
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.ring}>
          <ActivityIndicator size="large" color={colors.primary} style={StyleSheet.absoluteFill} />
          <View style={[styles.methodIcon, meta && { backgroundColor: `${meta.color}1A` }]}>
            <Ionicons name={meta?.icon ?? 'card'} size={28} color={meta?.color ?? colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>{t('paymentProcessing.title')}</Text>
        <Text style={styles.subtitle}>{t('paymentProcessing.subtitle', { method: methodLabel })}</Text>

        {booking && (
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>{t('paymentProcessing.amount')}</Text>
            <Text style={styles.amount}>{formatVnd(booking.totalPrice)}</Text>
          </View>
        )}

        <View style={styles.stepRow}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text style={styles.stepText}>{t('paymentProcessing.step')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="lock-closed" size={14} color={colors.primary} />
        <Text style={styles.secure}>{t('paymentProcessing.secure')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },

  ring: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  methodIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong, textAlign: 'center' },
  subtitle: {
    fontSize: fontSizes.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.body,
    paddingHorizontal: spacing.lg,
  },

  amountBlock: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  amountLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  amount: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textStrong },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  stepText: { fontSize: fontSizes.caption, color: colors.textMuted },

  actions: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingBottom: spacing.lg },
  secure: { fontSize: fontSizes.caption, color: colors.primary, fontWeight: fontWeights.medium },
});
