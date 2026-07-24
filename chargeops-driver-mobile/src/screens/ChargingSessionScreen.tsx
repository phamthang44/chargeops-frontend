import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { completeBooking, getBookingById } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
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
const FULL_RANGE_KM = 320;
const POWER_KW = 45.2;
const TEMP_C = 38;

/**
 * "Đang sạc" — live charging session screen with Electric Info Blue theme and dynamic Dark/Light mode support.
 */
export function ChargingSessionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

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
  const remainingMin = Math.max(0, Math.round((100 - percent) * 1.2));
  const endTime = new Date(now + remainingMin * 60_000).toISOString();

  /** Stop / Complete charging session */
  function finish() {
    if (params?.bookingId) completeBooking(params.bookingId);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  }

  const progressOffset = CIRCUMFERENCE * (1 - percent / 100);
  const ringCardBg = isDark ? '#0F1E36' : '#EFF6FF';
  const ringTrackColor = isDark ? '#1E2D4A' : '#DBEAFE';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      {/* Header with back button returning to previous screen (BookingsScreen) */}
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
            {t('chargingSession.headerTitle', { station: booking?.stationName ?? '' })}
          </Text>
          <Text style={[styles.headerRole, { color: themeColors.info }]}>{t('chargingSession.role')}</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress ring card themed with Electric Info Blue */}
        <View style={[styles.ringCard, { backgroundColor: ringCardBg, borderColor: themeColors.border }]}>
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={ringTrackColor}
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={themeColors.info}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={progressOffset}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <View style={styles.ringStatusRow}>
                <Ionicons name="flash" size={16} color={themeColors.info} />
                <Text style={[styles.ringStatus, { color: themeColors.info }]}>
                  {full ? t('chargingSession.full') : t('chargingSession.charging')}
                </Text>
              </View>
              <Text style={[styles.ringPercent, { color: themeColors.textStrong }]}>{percent}%</Text>
              <Text style={[styles.ringKm, { color: themeColors.textMuted }]}>
                {t('chargingSession.rangeLeft', { km: kmLeft })}
              </Text>
            </View>
          </View>

          {/* Current status sub-card */}
          <View style={[styles.statusCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Ionicons name="pulse" size={20} color={themeColors.info} />
            <View style={styles.statusBody}>
              <Text style={[styles.statusLabel, { color: themeColors.textMuted }]}>{t('chargingSession.currentStatus')}</Text>
              <Text style={[styles.statusValue, { color: themeColors.textStrong }]}>{t('chargingSession.currentStatusValue')}</Text>
            </View>
            <StatusBadge variant="info" label={t('chargingSession.active')} dot />
          </View>
        </View>

        {/* Stat row */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.statHead}>
              <Ionicons name="power" size={16} color={themeColors.info} />
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t('chargingSession.power')}</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.textStrong }]}>
              {POWER_KW} <Text style={[styles.statUnit, { color: themeColors.textMuted }]}>kW</Text>
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.statHead}>
              <Ionicons name="thermometer-outline" size={16} color={themeColors.warning} />
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t('chargingSession.temperature')}</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.textStrong }]}>
              {TEMP_C} <Text style={[styles.statUnit, { color: themeColors.textMuted }]}>°C</Text>
            </Text>
          </View>
        </View>

        {/* Time info */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="time-outline" size={18} color={themeColors.info} />
            <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>{t('chargingSession.timeTitle')}</Text>
          </View>
          <View style={styles.timeRow}>
            <View style={[styles.timeIcon, { backgroundColor: isDark ? '#152A4A' : '#EFF6FF' }]}>
              <Ionicons name="time-outline" size={18} color={themeColors.info} />
            </View>
            <View style={styles.timeBody}>
              <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>{t('chargingSession.elapsed')}</Text>
              <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>{formatCountdown(elapsedMs)}</Text>
              <Text style={[styles.timeSub, { color: themeColors.textMuted }]}>
                {t('chargingSession.startedAt', { time: formatTime(new Date(startedAt.current).toISOString()) })}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <View style={styles.timeRow}>
            <View style={[styles.timeIcon, { backgroundColor: isDark ? '#152A4A' : '#EFF6FF' }]}>
              <Ionicons name="flash" size={18} color={themeColors.info} />
            </View>
            <View style={styles.timeBody}>
              <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>{t('chargingSession.estEnd')}</Text>
              <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>
                {full
                  ? formatTime(endTime)
                  : t('chargingSession.estEndValue', { time: formatTime(endTime), minutes: remainingMin })}
              </Text>
              <Text style={[styles.timeSub, { color: themeColors.textMuted }]}>{t('chargingSession.estEndNote')}</Text>
            </View>
          </View>
        </View>

        {/* Hardware controls (locked) */}
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>{t('chargingSession.controlTitle')}</Text>
          <StatusBadge variant="neutral" label={t('chargingSession.locked')} />
        </View>
        <View style={[styles.lockedCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Ionicons name="lock-closed-outline" size={22} color={themeColors.textMuted} />
          <Text style={[styles.lockedTitle, { color: themeColors.textBody }]}>{t('chargingSession.controlDisabledTitle')}</Text>
          <Text style={[styles.lockedBody, { color: themeColors.textMuted }]}>{t('chargingSession.controlDisabledBody')}</Text>
          <View style={styles.lockedBtnRow}>
            <View style={[styles.lockedBtn, { backgroundColor: themeColors.border }]}>
              <Text style={[styles.lockedBtnText, { color: themeColors.textMuted }]}>{t('chargingSession.stop')}</Text>
            </View>
            <View style={[styles.lockedBtn, { backgroundColor: themeColors.border }]}>
              <Text style={[styles.lockedBtnText, { color: themeColors.textMuted }]}>{t('chargingSession.unlock')}</Text>
            </View>
          </View>
        </View>

        {/* Auto note */}
        <View style={[styles.autoNote, { backgroundColor: isDark ? '#0F1E36' : `${themeColors.info}14` }]}>
          <Ionicons name="information-circle-outline" size={18} color={themeColors.info} />
          <Text style={[styles.autoNoteText, { color: themeColors.textBody }]}>{t('chargingSession.autoNote')}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
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
  headerBtn: { width: 40, height: 40 },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  // Ring card
  ringCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: 'stretch',
    borderWidth: 1,
  },
  ringWrap: { alignSelf: 'center', width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  ringStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ringStatus: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, letterSpacing: 1 },
  ringPercent: { fontSize: 56, fontWeight: fontWeights.bold },
  ringKm: { fontSize: fontSizes.body },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  statusBody: { flex: 1, gap: 2 },
  statusLabel: { fontSize: fontSizes.caption },
  statusValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },

  // Stat row
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, letterSpacing: 0.5 },
  statValue: { fontSize: fontSizes.title, fontWeight: fontWeights.bold },
  statUnit: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },

  // Generic card
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.xs },
  cardTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  // Time rows
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBody: { flex: 1, gap: 2 },
  timeLabel: { fontSize: fontSizes.caption },
  timeValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  timeSub: { fontSize: fontSizes.caption, fontStyle: 'italic' },
  divider: { height: 1 },

  // Locked control
  lockedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockedTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  lockedBody: { fontSize: fontSizes.caption, textAlign: 'center', lineHeight: lineHeights.body },
  lockedBtnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, alignSelf: 'stretch' },
  lockedBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, opacity: 0.5 },
  lockedBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },

  // Auto note
  autoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  autoNoteText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.body },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
});
