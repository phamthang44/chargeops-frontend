import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getBookingById } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatDayMonth, formatTimeRange, formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type Route = RouteProp<RootStackParamList, 'BookingSuccess'>;

const STEP_ICONS: (keyof typeof Ionicons.glyphMap)[] = ['time-outline', 'qr-code-outline', 'flash'];

/**
 * "Đặt chỗ thành công" — post-payment confirmation screen with dynamic Dark and Light mode theme support.
 */
export function BookingSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

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
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
    );
  }

  function viewDetail() {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'BookingDetail', params: { bookingId: params.bookingId } }],
      }),
    );
  }

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
        {/* Success mark */}
        <View style={[styles.checkOuter, { backgroundColor: themeColors.primarySoft }]}>
          <View style={[styles.checkInner, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.title, { color: themeColors.textStrong }]}>{t('bookingSuccess.title')}</Text>
        <Text style={[styles.code, { color: themeColors.primary }]}>{t('bookingSuccess.code', { code: booking.code })}</Text>

        {/* Transaction summary */}
        <View style={[styles.txCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.txHeader}>
            <Text style={[styles.txTitle, { color: themeColors.textStrong }]}>{t('bookingSuccess.txTitle')}</Text>
            <StatusBadge variant="success" label={t('bookingSuccess.paid')} />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <TxRow
            icon="location-outline"
            label={t('bookingSuccess.station')}
            value={booking.stationName}
          />
          <TxRow
            icon="flash-outline"
            label={t('bookingSuccess.connector')}
            value={`${booking.chargePointName} · ${booking.connectorName} (${booking.connectorType})`}
          />
          <TxRow
            icon="calendar-outline"
            label={t('bookingSuccess.window')}
            value={`${formatDayMonth(booking.startAt)} · ${formatTimeRange(booking.startAt, booking.endAt)}`}
          />
          <TxRow
            icon="card-outline"
            label={t('bookingSuccess.total')}
            value={formatVnd(booking.totalPrice)}
            valueBold
          />
        </View>

        {/* Guide steps */}
        <View style={[styles.guideCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Text style={[styles.guideTitle, { color: themeColors.textStrong }]}>{t('bookingSuccess.guideTitle')}</Text>
          <View style={styles.guideSteps}>
            {([1, 2, 3] as const).map((step, idx) => (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepIcon, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name={STEP_ICONS[idx]} size={18} color={themeColors.primary} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={[styles.stepNum, { color: themeColors.primary }]}>
                    {t('bookingSuccess.stepNum', { num: step })}
                  </Text>
                  <Text style={[styles.stepText, { color: themeColors.textBody }]}>
                    {t(`bookingSuccess.step${step}`)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer CTAs */}
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <AppButton label={t('bookingSuccess.viewDetail')} onPress={viewDetail} />
        <Pressable style={styles.homeBtn} onPress={goHome}>
          <Text style={[styles.homeText, { color: themeColors.textMuted }]}>{t('bookingSuccess.goHome')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function TxRow({
  icon,
  label,
  value,
  valueBold,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueBold?: boolean;
}) {
  const { themeColors } = usePreferences();
  return (
    <View style={styles.txRow}>
      <Ionicons name={icon} size={16} color={themeColors.textMuted} />
      <Text style={[styles.txLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.txValue,
          { color: themeColors.textStrong },
          valueBold && styles.txValueBold,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },

  checkOuter: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, textAlign: 'center' },
  code: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, letterSpacing: 1 },

  txCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  txHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  divider: { height: 1 },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  txLabel: { fontSize: fontSizes.caption, width: 90 },
  txValue: { flex: 1, fontSize: fontSizes.body, textAlign: 'right' },
  txValueBold: { fontWeight: fontWeights.bold, fontSize: fontSizes.heading },

  guideCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  guideTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  guideSteps: { gap: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stepBody: { flex: 1, gap: 2 },
  stepNum: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 0.5 },
  stepText: { fontSize: fontSizes.body, lineHeight: lineHeights.body },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  homeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  homeText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
});
