import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getBookingById } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatDayMonth, formatTimeRange, formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type Route = RouteProp<RootStackParamList, 'BookingSuccess'>;

const STEP_ICONS: (keyof typeof Ionicons.glyphMap)[] = ['time-outline', 'qr-code-outline', 'flash'];

/**
 * "Đặt chỗ thành công" — post-payment confirmation. Shows the booking code, a
 * transaction summary, and the check-in guide. "View details" replaces this
 * screen with BookingDetail; "Home" resets the stack to the tabs.
 */
export function BookingSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) setBooking(b);
    });
    return () => {
      active = false;
    };
  }, [params.bookingId]);

  function goHome() {
    // Drop the whole booking flow; land back on the tabs.
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
    );
  }

  function viewDetail() {
    // Clear the whole booking flow; land on detail with the tabs underneath so
    // back from detail returns home (not the confirmation/success screens).
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'BookingDetail', params: { bookingId: params.bookingId } }],
      }),
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success mark */}
        <View style={styles.checkOuter}>
          <View style={styles.checkInner}>
            <Ionicons name="checkmark-sharp" size={48} color={colors.textInverse} />
          </View>
        </View>
        <Text style={styles.title}>{t('bookingSuccess.title')}</Text>
        <Text style={styles.code}>{t('bookingSuccess.code', { code: booking.code })}</Text>

        {/* Transaction summary */}
        <View style={styles.txCard}>
          <View style={styles.txHeader}>
            <Text style={styles.txTitle}>{t('bookingSuccess.txTitle')}</Text>
            <StatusBadge variant="success" label={t('bookingSuccess.paid')} />
          </View>
          <View style={styles.divider} />
          <TxRow
            icon="location-outline"
            label={t('bookingSuccess.station')}
            value={booking.stationName}
          />
          <TxRow
            icon="flash-outline"
            label={t('bookingSuccess.charger')}
            value={`${booking.chargerName} (${booking.connectorType})`}
          />
          <View style={styles.txSplit}>
            <View style={styles.txSplitItem}>
              <TxRow
                icon="time-outline"
                label={t('bookingSuccess.time')}
                value={`${formatTimeRange(booking.startAt, booking.endAt)}, ${formatDayMonth(booking.startAt)}`}
              />
            </View>
            <View style={styles.txSplitItem}>
              <TxRow
                icon="card-outline"
                label={t('bookingSuccess.total')}
                value={formatVnd(booking.totalPrice)}
                valueStrong
              />
            </View>
          </View>
        </View>

        {/* Check-in guide */}
        <View style={styles.guideHeader}>
          <Ionicons name="information-circle" size={18} color={colors.info} />
          <Text style={styles.guideTitle}>{t('bookingSuccess.checkInTitle')}</Text>
        </View>
        {[t('bookingSuccess.step1'), t('bookingSuccess.step2'), t('bookingSuccess.step3')].map(
          (step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={STEP_ICONS[i]} size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ),
        )}

        <View style={styles.actions}>
          <AppButton label={t('bookingSuccess.viewDetail')} onPress={viewDetail} />
          <Pressable onPress={goHome} style={styles.homeBtn}>
            <Text style={styles.homeText}>{t('bookingSuccess.home')}</Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          <Text style={styles.noteText}>{t('bookingSuccess.refundNote')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TxRow({
  icon,
  label,
  value,
  valueStrong,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueStrong?: boolean;
}) {
  return (
    <View style={styles.txRow}>
      <Ionicons name={icon} size={18} color={colors.primary} style={styles.txRowIcon} />
      <View style={styles.txRowBody}>
        <Text style={styles.txRowLabel}>{label}</Text>
        <Text style={[styles.txRowValue, valueStrong && styles.txRowValueStrong]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, alignItems: 'stretch' },

  // Success mark
  checkOuter: {
    alignSelf: 'center',
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  checkInner: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    color: colors.textStrong,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  code: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },

  // Transaction card
  txCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  txHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txTitle: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.textMuted, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border },
  txRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  txRowIcon: { marginTop: 2 },
  txRowBody: { flex: 1, gap: 2 },
  txRowLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  txRowValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  txRowValueStrong: { color: colors.primary },
  txSplit: { flexDirection: 'row', gap: spacing.md },
  txSplitItem: { flex: 1 },

  // Check-in guide
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  guideTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body },

  // Actions
  actions: { gap: spacing.sm, marginTop: spacing.md },
  homeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  homeText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noteText: { flex: 1, fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: lineHeights.caption },
});
