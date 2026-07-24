import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { cancelBooking, confirmPayment, getBookingById } from '@/services/bookingService';
import type { PaymentResultStatus } from '@/services/simulation';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';
import { PAYMENT_META } from '@/utils/payments';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PaymentProcessing'>;
type Route = RouteProp<RootStackParamList, 'PaymentProcessing'>;

type FailPhase = Exclude<PaymentResultStatus, 'SUCCESS'>;
type Phase = 'processing' | FailPhase;

/**
 * "Đang xử lý thanh toán" — processing / loading screen with dynamic Dark and Light mode theme support.
 */
export function PaymentProcessingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [phase, setPhase] = useState<Phase>('processing');

  const FAILURE_META: Record<
    FailPhase,
    { icon: keyof typeof Ionicons.glyphMap; color: string; retry: boolean }
  > = {
    FAILED: { icon: 'close-circle', color: themeColors.error, retry: true },
    TIMEOUT: { icon: 'time-outline', color: themeColors.warning, retry: true },
    CANCELLED: { icon: 'ban-outline', color: themeColors.textMuted, retry: false },
  };

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
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={[styles.resultIcon, { backgroundColor: `${f.color}1A` }]}>
            <Ionicons name={f.icon} size={44} color={f.color} />
          </View>
          <Text style={[styles.title, { color: themeColors.textStrong }]}>{t(`paymentProcessing.${phase}.title`)}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t(`paymentProcessing.${phase}.body`)}</Text>

          {booking && (
            <View style={[styles.infoCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>{t('paymentProcessing.code')}</Text>
                <Text style={[styles.infoVal, { color: themeColors.textStrong }]}>{booking.code}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>{t('paymentProcessing.amount')}</Text>
                <Text style={[styles.infoVal, { color: themeColors.textStrong }]}>{formatVnd(booking.totalPrice)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>{t('paymentProcessing.method')}</Text>
                <Text style={[styles.infoVal, { color: themeColors.textStrong }]}>{methodLabel}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {f.retry ? (
            <>
              <AppButton label={t('paymentProcessing.retry')} onPress={attempt} />
              <AppButton
                label={t('paymentProcessing.cancel')}
                variant="secondary"
                onPress={cancelAndExit}
              />
            </>
          ) : (
            <AppButton label={t('paymentProcessing.backHome')} onPress={goHome} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ---- Processing spinner state ----
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.spinnerOuter, { backgroundColor: isDark ? '#152A4A' : '#EFF6FF' }]}>
          <ActivityIndicator color={themeColors.primary} size="large" />
        </View>

        <Text style={[styles.title, { color: themeColors.textStrong }]}>{t('paymentProcessing.processingTitle')}</Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('paymentProcessing.processingBody')}</Text>

        {booking && meta && (
          <View style={[styles.brandCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.brandIcon, { backgroundColor: `${meta.color}1A` }]}>
              <Ionicons name={meta.icon} size={24} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandName, { color: themeColors.textStrong }]}>{methodLabel}</Text>
              <Text style={[styles.brandAmount, { color: themeColors.primary }]}>{formatVnd(booking.totalPrice)}</Text>
            </View>
          </View>
        )}
      </View>

      <Text style={[styles.lockHint, { color: themeColors.textMuted }]}>{t('paymentProcessing.doNotClose')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  spinnerOuter: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, textAlign: 'center' },
  subtitle: {
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: lineHeights.body,
  },

  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  brandIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  brandAmount: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  infoCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: fontSizes.caption },
  infoVal: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },

  lockHint: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
