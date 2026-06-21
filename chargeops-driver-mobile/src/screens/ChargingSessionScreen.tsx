import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { completeBooking, getBookingById } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown, formatTime } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ChargingSession'>;
type Route = RouteProp<RootStackParamList, 'ChargingSession'>;

const RING_SIZE = 220;
const STROKE = 16;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Demo session params: starts ~32 min ago at 84%, climbs ~1%/3s to 100%.
const SESSION_START_OFFSET_MS = 32 * 60_000 + 15_000;
const START_PERCENT = 84;
const FULL_RANGE_KM = 320; // range at 100% (for the "km left" estimate)
const POWER_KW = 45.2;
const TEMP_C = 38;

/**
 * "Đang sạc" — live charging session after check-in. The hardware controls are
 * intentionally locked (safety: physical buttons only). Values here are a
 * frontend simulation; the backend will stream real telemetry later.
 */
export function ChargingSessionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [booking, setBooking] = useState<Booking | null>(null);
  const startedAt = useRef(Date.now() - SESSION_START_OFFSET_MS);
  const [now, setNow] = useState(Date.now());
  const [percent, setPercent] = useState(START_PERCENT);

  useEffect(() => {
    if (!params?.bookingId) return;
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) setBooking(b);
    });
    return () => {
      active = false;
    };
  }, [params?.bookingId]);

  // Tick the elapsed clock once a second.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Climb the battery percentage until full.
  useEffect(() => {
    if (percent >= 100) return;
    const id = setInterval(() => setPercent((p) => Math.min(100, p + 1)), 3000);
    return () => clearInterval(id);
  }, [percent]);

  const full = percent >= 100;
  const elapsedMs = now - startedAt.current;
  const kmLeft = Math.round((FULL_RANGE_KM * percent) / 100);
  // Rough remaining estimate: ~1.2 min per remaining percent.
  const remainingMin = Math.max(0, Math.round((100 - percent) * 1.2));
  const endTime = new Date(now + remainingMin * 60_000).toISOString();

  function finish() {
    if (params?.bookingId) completeBooking(params.bookingId);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  }

  const progressOffset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={colors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={finish}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
        </GlassButton>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('chargingSession.headerTitle', { station: booking?.stationName ?? '' })}
          </Text>
          <Text style={styles.headerRole}>{t('chargingSession.role')}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress ring card */}
        <View style={styles.ringCard}>
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={colors.border}
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={colors.primary}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={progressOffset}
                // Start the arc at 12 o'clock.
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <View style={styles.ringStatusRow}>
                <Ionicons name="flash" size={16} color={colors.primaryDark} />
                <Text style={styles.ringStatus}>
                  {full ? t('chargingSession.full') : t('chargingSession.charging')}
                </Text>
              </View>
              <Text style={styles.ringPercent}>{percent}%</Text>
              <Text style={styles.ringKm}>{t('chargingSession.rangeLeft', { km: kmLeft })}</Text>
            </View>
          </View>

          {/* Current status sub-card */}
          <View style={styles.statusCard}>
            <Ionicons name="pulse" size={20} color={colors.primaryDark} />
            <View style={styles.statusBody}>
              <Text style={styles.statusLabel}>{t('chargingSession.currentStatus')}</Text>
              <Text style={styles.statusValue}>{t('chargingSession.currentStatusValue')}</Text>
            </View>
            <StatusBadge variant="success" label={t('chargingSession.active')} dot />
          </View>
        </View>

        {/* Stat row */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={styles.statHead}>
              <Ionicons name="power" size={16} color={colors.info} />
              <Text style={styles.statLabel}>{t('chargingSession.power')}</Text>
            </View>
            <Text style={styles.statValue}>
              {POWER_KW} <Text style={styles.statUnit}>kW</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHead}>
              <Ionicons name="thermometer-outline" size={16} color={colors.warning} />
              <Text style={styles.statLabel}>{t('chargingSession.temperature')}</Text>
            </View>
            <Text style={styles.statValue}>
              {TEMP_C} <Text style={styles.statUnit}>°C</Text>
            </Text>
          </View>
        </View>

        {/* Time info */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('chargingSession.timeTitle')}</Text>
          </View>
          <View style={styles.timeRow}>
            <View style={styles.timeIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.timeBody}>
              <Text style={styles.timeLabel}>{t('chargingSession.elapsed')}</Text>
              <Text style={styles.timeValue}>{formatCountdown(elapsedMs)}</Text>
              <Text style={styles.timeSub}>
                {t('chargingSession.startedAt', { time: formatTime(new Date(startedAt.current).toISOString()) })}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.timeRow}>
            <View style={styles.timeIcon}>
              <Ionicons name="flash" size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.timeBody}>
              <Text style={styles.timeLabel}>{t('chargingSession.estEnd')}</Text>
              <Text style={styles.timeValue}>
                {full
                  ? formatTime(endTime)
                  : t('chargingSession.estEndValue', { time: formatTime(endTime), minutes: remainingMin })}
              </Text>
              <Text style={styles.timeSub}>{t('chargingSession.estEndNote')}</Text>
            </View>
          </View>
        </View>

        {/* Hardware controls (locked) */}
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{t('chargingSession.controlTitle')}</Text>
          <StatusBadge variant="neutral" label={t('chargingSession.locked')} />
        </View>
        <View style={styles.lockedCard}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.textMuted} />
          <Text style={styles.lockedTitle}>{t('chargingSession.controlDisabledTitle')}</Text>
          <Text style={styles.lockedBody}>{t('chargingSession.controlDisabledBody')}</Text>
          <View style={styles.lockedBtnRow}>
            <View style={[styles.lockedBtn, styles.lockedBtnDisabled]}>
              <Text style={styles.lockedBtnText}>{t('chargingSession.stop')}</Text>
            </View>
            <View style={[styles.lockedBtn, styles.lockedBtnDisabled]}>
              <Text style={styles.lockedBtnText}>{t('chargingSession.unlock')}</Text>
            </View>
          </View>
        </View>

        {/* Auto note */}
        <View style={styles.autoNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.autoNoteText}>{t('chargingSession.autoNote')}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <AppButton
          label={full ? t('chargingSession.finishFull') : t('chargingSession.finish')}
          variant={full ? 'primary' : 'secondary'}
          onPress={finish}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.primary, letterSpacing: 1 },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  // Ring card
  ringCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  ringWrap: { alignSelf: 'center', width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  ringStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ringStatus: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark, letterSpacing: 1 },
  ringPercent: { fontSize: 56, fontWeight: fontWeights.bold, color: colors.textStrong },
  ringKm: { fontSize: fontSizes.body, color: colors.textMuted },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statusBody: { flex: 1, gap: 2 },
  statusLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  statusValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },

  // Stat row
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },
  statUnit: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },

  // Generic card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.xs },
  cardTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },

  // Time rows
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBody: { flex: 1, gap: 2 },
  timeLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  timeValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  timeSub: { fontSize: fontSizes.caption, color: colors.textMuted, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: colors.border },

  // Locked control
  lockedCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockedTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textBody },
  lockedBody: { fontSize: fontSizes.caption, color: colors.textMuted, textAlign: 'center', lineHeight: lineHeights.body },
  lockedBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, alignSelf: 'stretch' },
  lockedBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.border },
  lockedBtnDisabled: { opacity: 0.5 },
  lockedBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textMuted },

  // Auto note
  autoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.info}14`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  autoNoteText: { flex: 1, fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
