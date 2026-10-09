import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { completeBooking, getBookingById } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatDate, formatTime } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ChargingSession'>;
type Route = RouteProp<RootStackParamList, 'ChargingSession'>;

/**
 * ChargingSessionScreen — Clean, realistic charging session overview.
 * Eliminates artificial telemetry simulation in favor of real booking metadata,
 * direct session termination (complete booking API), and 1-tap navigation back to Home.
 */
export function ChargingSessionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!params?.bookingId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    getBookingById(params.bookingId)
      .then((b) => {
        if (active) {
          setBooking(b);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching booking for session:', err);
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params?.bookingId]);

  /** 1-tap reset to Home dashboard */
  const handleGoHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    );
  }, [navigation]);

  /** End / Complete the booking session */
  const handleFinishSession = useCallback(() => {
    if (!booking) return;

    Alert.alert(
      t('chargingSession.confirmFinishTitle'),
      t('chargingSession.confirmFinishMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chargingSession.finish'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const updated = await completeBooking(booking.id, {
                expectedVersion: booking.version,
              });
              if (updated) {
                setBooking(updated);
              } else {
                setBooking((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
              }
              Alert.alert(
                t('chargingSession.finishSuccessTitle'),
                t('chargingSession.finishSuccessMessage'),
                [
                  {
                    text: t('common.ok', 'OK'),
                    onPress: handleGoHome,
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || t('chargingSession.finishError'));
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }, [booking, handleGoHome, t]);

  const isCompleted = booking?.status === 'COMPLETED';
  const chargerCode =
    booking?.chargePointCode || booking?.chargePointName || t('chargingSession.chargerLabelFallback', 'Trụ sạc');
  const connectorCode =
    booking?.connectorCode || booking?.connectorName || t('chargingSession.connectorLabelFallback', 'Cổng sạc');

  const heroCardBg = isDark ? '#0F1E36' : '#EFF6FF';
  const heroRingBg = isDark ? '#1E2D4A' : '#DBEAFE';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      {/* Header with Back and Direct Home Button */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
        </GlassButton>

        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]} numberOfLines={1}>
            {t('chargingSession.headerTitle')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
            {booking?.stationName || t('chargingSession.title')}
          </Text>
        </View>

        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('chargingSession.goHome')}
          onPress={handleGoHome}
        >
          <Ionicons name="home-outline" size={20} color={themeColors.textStrong} />
        </GlassButton>
      </View>

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            {t('chargingSession.loading')}
          </Text>
        </View>
      ) : !booking ? (
        <View style={styles.centerLoading}>
          <Ionicons name="alert-circle-outline" size={48} color={themeColors.textMuted} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            {t('chargingSession.notFound')}
          </Text>
          <View style={styles.emptyHomeBtn}>
            <AppButton label={t('chargingSession.goHome')} onPress={handleGoHome} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: heroCardBg, borderColor: themeColors.border }]}>
            <View style={styles.heroBadgeRow}>
              <StatusBadge
                variant={isCompleted ? 'success' : 'info'}
                label={isCompleted ? t('chargingSession.full') : t('chargingSession.charging')}
                dot
              />
            </View>

            <View style={[styles.heroIconOuter, { backgroundColor: heroRingBg }]}>
              <View style={[styles.heroIconInner, { backgroundColor: isDark ? '#152A4A' : '#BFDBFE' }]}>
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : 'flash'}
                  size={42}
                  color={isCompleted ? themeColors.success : themeColors.info}
                />
              </View>
            </View>

            <Text style={[styles.heroStatusText, { color: themeColors.textStrong }]}>
              {isCompleted ? t('chargingSession.finishSuccessTitle') : t('chargingSession.currentStatusValue')}
            </Text>

            <View style={[styles.hardwarePill, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Ionicons name="hardware-chip-outline" size={16} color={themeColors.primary} />
              <Text style={[styles.hardwarePillText, { color: themeColors.textStrong }]}>
                {t('chargingSession.chargerLabel')}: <Text style={styles.hardwareBold}>{chargerCode}</Text> · {t('chargingSession.connectorLabel')}: <Text style={styles.hardwareBold}>{connectorCode}</Text>
              </Text>
            </View>
          </View>

          {/* Station & Hardware Specs Card */}
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="location-outline" size={20} color={themeColors.primary} />
              <Text style={[styles.cardHeaderTitle, { color: themeColors.textStrong }]}>
                {t('chargingSession.stationInfo')}
              </Text>
            </View>

            <View style={styles.stationBlock}>
              <Text style={[styles.stationName, { color: themeColors.textStrong }]}>
                {booking.stationName}
              </Text>
              <Text style={[styles.stationAddress, { color: themeColors.textMuted }]}>
                {booking.stationAddress}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: themeColors.surfaceAlt }]}>
                <Text style={[styles.statBoxLabel, { color: themeColors.textMuted }]}>
                  {t('chargingSession.connectorType')}
                </Text>
                <Text style={[styles.statBoxValue, { color: themeColors.textStrong }]}>
                  {booking.connectorType || 'CCS2'}
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: themeColors.surfaceAlt }]}>
                <Text style={[styles.statBoxLabel, { color: themeColors.textMuted }]}>
                  {t('chargingSession.power')}
                </Text>
                <Text style={[styles.statBoxValue, { color: themeColors.textStrong }]}>
                  {booking.powerKw ? `${booking.powerKw} kW` : '--'}
                </Text>
              </View>
            </View>
          </View>

          {/* Booking Time Window Card */}
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="calendar-outline" size={20} color={themeColors.info} />
              <Text style={[styles.cardHeaderTitle, { color: themeColors.textStrong }]}>
                {t('chargingSession.timeTitle')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                {t('chargingSession.bookingCode')}
              </Text>
              <View style={[styles.codeBadge, { backgroundColor: themeColors.surfaceAlt }]}>
                <Text style={[styles.codeText, { color: themeColors.primary }]}>
                  {booking.code}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                {t('chargingSession.timeTitle')}
              </Text>
              <View style={styles.infoRight}>
                <Text style={[styles.timeWindowText, { color: themeColors.textStrong }]}>
                  {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                </Text>
                <Text style={[styles.timeDateSub, { color: themeColors.textMuted }]}>
                  {formatDate(booking.startAt)} · {booking.durationMin} {t('chargingSession.minutesUnit')}
                </Text>
              </View>
            </View>
          </View>

          {/* Realistic Note */}
          <View style={[styles.noticeCard, { backgroundColor: isDark ? '#0F1E36' : '#EFF6FF', borderColor: themeColors.border }]}>
            <Ionicons name="information-circle-outline" size={20} color={themeColors.info} />
            <Text style={[styles.noticeText, { color: themeColors.textBody }]}>
              {t('chargingSession.autoNote')}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Actions */}
      {!isLoading && booking && (
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          {isCompleted ? (
            <AppButton
              label={t('chargingSession.goHome')}
              variant="primary"
              onPress={handleGoHome}
            />
          ) : (
            <>
              <AppButton
                label={t('chargingSession.finish')}
                variant="danger"
                onPress={handleFinishSession}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
              <AppButton
                label={t('chargingSession.goHome')}
                variant="secondary"
                onPress={handleGoHome}
                disabled={isSubmitting}
              />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleBlock: { flex: 1, alignItems: 'center', marginHorizontal: spacing.sm },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  headerSubtitle: { fontSize: fontSizes.caption, marginTop: 2 },

  // Loading & Empty
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { fontSize: fontSizes.body },
  emptyHomeBtn: { width: 200, marginTop: spacing.md },

  // Content
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Hero Card
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.md,
  },
  heroBadgeRow: { alignSelf: 'center' },
  heroIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  heroIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatusText: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  hardwarePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  hardwarePillText: {
    fontSize: fontSizes.body,
  },
  hardwareBold: {
    fontWeight: fontWeights.bold,
  },

  // Card
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardHeaderTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  stationBlock: { gap: spacing.xs },
  stationName: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  stationAddress: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  divider: { height: 1 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  statBoxLabel: { fontSize: fontSizes.caption },
  statBoxValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  // Booking details
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: { fontSize: fontSizes.body },
  infoRight: { alignItems: 'flex-end', gap: 2 },
  codeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  codeText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  timeWindowText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  timeDateSub: { fontSize: fontSizes.caption },

  // Notice
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});
