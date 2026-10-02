import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components';
import { ChargerKioskModal } from '@/components/kiosk/ChargerKioskModal';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  confirmCheckIn,
  getBookingById,
  resolveCheckIn,
  type CheckInErrorCode,
  type CheckInResolution,
} from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime, formatTimeRange } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QRCheckIn'>;
type Route = RouteProp<RootStackParamList, 'QRCheckIn'>;

/**
 * "Quét QR Check-in" — final step of the booking flow (FR07) with dynamic Light/Dark mode theme support.
 */
export function QRCheckInScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const [permission, requestPermission] = useCameraPermissions();
  const [expected, setExpected] = useState<Booking | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResolution | null>(null);
  const [committing, setCommitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [kioskVisible, setKioskVisible] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (!params?.bookingId) return;
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) setExpected(b);
    });
    return () => {
      active = false;
    };
  }, [params?.bookingId]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Challenge expiry countdown timer (BKG-040 / BKG-042)
  useEffect(() => {
    if (!result?.ok || !result.challengeExpiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const expiresTime = new Date(result.challengeExpiresAt).getTime();

    const checkExpiry = () => {
      const diff = Math.max(0, Math.ceil((expiresTime - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        setResult({
          ok: false,
          code: 'CHALLENGE_EXPIRED',
          connector: result.connector,
          booking: result.booking,
        });
      }
    };

    checkExpiry();
    const timer = setInterval(checkExpiry, 1000);
    return () => clearInterval(timer);
  }, [result?.ok, (result as any)?.challengeExpiresAt]);

  async function handleScan(payload: string) {
    if (handled.current) return;
    handled.current = true;
    setScanning(true);
    const bookingId = params?.bookingId ?? expected?.id;
    const res = await resolveCheckIn(payload, bookingId);
    setResult(res);
    setScanning(false);
  }

  function simulateScan() {
    const simToken = expected?.connectorId
      ? `chk_demo_${expected.connectorId}_${Date.now()}`
      : `chk_demo_simulation_token_${Date.now()}`;
    void handleScan(simToken);
  }

  function retry() {
    handled.current = false;
    setResult(null);
    setSecondsRemaining(null);
  }

  async function commitCheckIn() {
    if (!result?.ok) return;
    setCommitting(true);
    try {
      await confirmCheckIn(result.booking.id, {
        expectedVersion: result.expectedVersion,
        challengeToken: result.challengeToken,
      });
      setCommitting(false);
      navigation.replace('ChargingSession', { bookingId: result.booking.id });
    } catch (err: any) {
      setCommitting(false);
      setResult({
        ok: false,
        code: 'STATE_CONFLICT',
        connector: result.connector,
        booking: result.booking,
        message: err?.message || 'Check-in không thành công. Vui lòng thử lại.',
      });
    }
  }

  async function forceDemoCheckIn() {
    if (!result || result.ok || !result.booking) return;
    setCommitting(true);
    await confirmCheckIn(result.booking.id);
    setCommitting(false);
    navigation.replace('ChargingSession', { bookingId: result.booking.id });
  }

  function errorTitle(code: CheckInErrorCode): string {
    switch (code) {
      case 'CHALLENGE_EXPIRED':
        return t('qrCheckIn.errorTitles.CHALLENGE_EXPIRED');
      case 'NOT_ACCESS':
        return t('qrCheckIn.errorTitles.NOT_ACCESS');
      case 'STATE_CONFLICT':
        return t('qrCheckIn.errorTitles.STATE_CONFLICT');
      case 'STATION_UNAVAILABLE':
        return t('qrCheckIn.errorTitles.STATION_UNAVAILABLE');
      case 'TOO_EARLY':
        return t('qrCheckIn.errorTitles.TOO_EARLY');
      case 'WINDOW_EXPIRED':
        return t('qrCheckIn.errorTitles.WINDOW_EXPIRED');
      case 'WRONG_CONNECTOR':
        return t('qrCheckIn.errorTitles.WRONG_CONNECTOR');
      case 'UNKNOWN_QR':
        return t('qrCheckIn.errorTitles.UNKNOWN_QR');
      default:
        return t('qrCheckIn.errorTitles.NO_BOOKING');
    }
  }

  function errorBody(r: Extract<CheckInResolution, { ok: false }>): string {
    if (r.message && (r.code === 'STATE_CONFLICT' || r.code === 'STATION_UNAVAILABLE')) {
      return r.message;
    }
    switch (r.code) {
      case 'CHALLENGE_EXPIRED':
        return t('qrCheckIn.errors.CHALLENGE_EXPIRED');
      case 'NOT_ACCESS':
        return t('qrCheckIn.errors.NOT_ACCESS');
      case 'STATE_CONFLICT':
        return t('qrCheckIn.errors.STATE_CONFLICT');
      case 'STATION_UNAVAILABLE':
        return t('qrCheckIn.errors.STATION_UNAVAILABLE');
      case 'TOO_EARLY':
        return t('qrCheckIn.errors.TOO_EARLY', {
          time: r.booking ? formatTime(r.booking.startAt) : '',
          minutes: r.minutesUntilOpen ?? 0,
        });
      case 'WINDOW_EXPIRED':
        return t('qrCheckIn.errors.WINDOW_EXPIRED');
      case 'WRONG_CONNECTOR':
        return t('qrCheckIn.errors.WRONG_CONNECTOR', {
          connector: r.booking?.connectorName ?? '',
          chargePoint: r.booking?.chargePointName ?? '',
          zone: r.booking?.zoneLabel ?? '',
        });
      case 'UNKNOWN_QR':
        return t('qrCheckIn.errors.UNKNOWN_QR');
      default:
        return t('qrCheckIn.errors.NO_BOOKING');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F0E' }]} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel={t('qrCheckIn.close')}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.topTitle, { color: '#FFFFFF' }]}>{t('qrCheckIn.title')}</Text>
        <View style={styles.topSpacer} />
      </View>

      {/* Camera / Scanner area */}
      <View style={styles.scannerArea}>
        {!permission ? (
          <ActivityIndicator color={themeColors.primary} size="large" />
        ) : permission.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={
                result || scanning ? undefined : ({ data }) => void handleScan(data)
              }
            />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: themeColors.primary }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: themeColors.primary }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: themeColors.primary }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: themeColors.primary }]} />
              {scanning && <ActivityIndicator color={themeColors.primary} size="large" />}
            </View>
            <View style={styles.hintBlock}>
              <Text style={styles.scanHint}>
                {scanning ? t('qrCheckIn.scanning') : t('qrCheckIn.scanHint')}
              </Text>
              <Pressable
                onPress={() => setKioskVisible(true)}
                hitSlop={8}
                style={styles.kioskLauncherBtn}
              >
                <Ionicons name="hardware-chip-outline" size={15} color={themeColors.primary} />
                <Text style={[styles.simulateLink, { color: themeColors.primary }]}>
                  {t('qrCheckIn.kioskModalBtn', 'Màn hình Trụ Sạc (Demo Kiosk)')}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.permissionBlock}>
            <View style={[styles.permissionIcon, { backgroundColor: themeColors.surfaceAlt }]}>
              <Ionicons name="camera-outline" size={40} color={themeColors.textStrong} />
            </View>
            <Text style={[styles.permissionTitle, { color: '#FFFFFF' }]}>{t('qrCheckIn.permissionTitle')}</Text>
            <Text style={[styles.permissionBody, { color: '#94A3B8' }]}>{t('qrCheckIn.permissionBody')}</Text>
            <AppButton
              label={permission.canAskAgain ? t('qrCheckIn.allow') : t('qrCheckIn.openSettings')}
              onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
              style={styles.permissionBtn}
            />
            <Pressable
              onPress={() => setKioskVisible(true)}
              hitSlop={8}
              style={[styles.kioskLauncherBtn, { marginTop: spacing.xs }]}
            >
              <Ionicons name="hardware-chip-outline" size={15} color={themeColors.primary} />
              <Text style={[styles.simulateLink, { color: themeColors.primary }]}>
                {t('qrCheckIn.kioskModalBtn', 'Màn hình Trụ Sạc (Demo Kiosk)')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Charger Kiosk Simulator Modal */}
      <ChargerKioskModal
        visible={kioskVisible}
        onClose={() => setKioskVisible(false)}
        booking={expected}
        connectorId={expected?.connectorId}
        onSimulateScan={(simToken) => {
          setKioskVisible(false);
          void handleScan(simToken);
        }}
      />

      {/* Confirmation bottom sheet */}
      {result?.ok && (
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.checkRing, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="qr-code-outline" size={30} color={themeColors.primary} />
            </View>
            <Text style={[styles.sheetTitle, { color: themeColors.textStrong }]}>{t('qrCheckIn.confirmTitle')}</Text>
            <Text style={[styles.sheetCode, { color: themeColors.textMuted }]}>
              {t('qrCheckIn.chargerCode', { code: result.connector.id })}
            </Text>

            <View style={[styles.sheetCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
              <View style={styles.sheetRow}>
                <Text style={[styles.sheetLabel, { color: themeColors.textMuted }]}>{t('qrCheckIn.station')}</Text>
                <Text style={[styles.sheetValue, { color: themeColors.textStrong }]} numberOfLines={1}>
                  {result.booking.stationName}
                </Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={[styles.sheetLabel, { color: themeColors.textMuted }]}>{t('qrCheckIn.connector')}</Text>
                <StatusBadge
                  variant="success"
                  label={`${result.connector.connectorType} ${result.connector.powerKw}kW`}
                />
              </View>
              <View style={styles.sheetRow}>
                <Text style={[styles.sheetLabel, { color: themeColors.textMuted }]}>{t('qrCheckIn.time')}</Text>
                <Text style={[styles.sheetValue, { color: themeColors.textStrong }]}>
                  {formatTimeRange(result.booking.startAt, result.booking.endAt)}
                </Text>
              </View>
              {secondsRemaining !== null && (
                <View style={styles.sheetRow}>
                  <Text style={[styles.sheetLabel, { color: themeColors.textMuted }]}>
                    {t('qrCheckIn.challengeCountdown')}
                  </Text>
                  <View
                    style={[
                      styles.countdownPill,
                      {
                        backgroundColor:
                          secondsRemaining <= 10 ? `${themeColors.error}20` : `${themeColors.primary}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={secondsRemaining <= 10 ? themeColors.error : themeColors.primary}
                    />
                    <Text
                      style={[
                        styles.countdownText,
                        { color: secondsRemaining <= 10 ? themeColors.error : themeColors.primary },
                      ]}
                    >
                      {t('qrCheckIn.secondsLeft', { count: secondsRemaining })}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <AppButton
              label={t('qrCheckIn.confirmCta')}
              loading={committing}
              onPress={commitCheckIn}
            />
            <View style={styles.autoStopRow}>
              <Ionicons name="information-circle-outline" size={15} color={themeColors.textMuted} />
              <Text style={[styles.autoStop, { color: themeColors.textMuted }]}>{t('qrCheckIn.autoStop')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rejected scan bottom sheet */}
      {result && !result.ok && (
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.errorRing, { backgroundColor: `${themeColors.error}1A` }]}>
              <Ionicons name="alert" size={30} color={themeColors.error} />
            </View>
            <Text style={[styles.sheetTitle, { color: themeColors.textStrong }]}>{errorTitle(result.code)}</Text>
            <Text style={[styles.errorBody, { color: themeColors.textBody }]}>{errorBody(result)}</Text>
            {result.connector && (
              <Text style={[styles.sheetCode, { color: themeColors.textMuted }]}>
                {t('qrCheckIn.scannedCode', { code: result.connector.id })}
              </Text>
            )}
            {result.code === 'TOO_EARLY' && result.booking && (
              <AppButton
                label="⚡ Kích hoạt check-in ngay"
                loading={committing}
                onPress={forceDemoCheckIn}
                style={{ alignSelf: 'stretch' }}
              />
            )}
            <AppButton
              label={t('qrCheckIn.rescan')}
              variant={result.code === 'TOO_EARLY' ? 'secondary' : 'primary'}
              onPress={retry}
            />
          </View>
        </View>

      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  topSpacer: { width: 28 },

  scannerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  frame: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { width: 32, height: 32, position: 'absolute', borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radius.md },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radius.md },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radius.md },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radius.md },

  hintBlock: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  scanHint: { fontSize: fontSizes.body, color: '#FFFFFF', textAlign: 'center' },
  simulateLink: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
  kioskLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },

  permissionBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { fontSize: fontSizes.title, fontWeight: fontWeights.bold },
  permissionBody: { fontSize: fontSizes.body, textAlign: 'center', lineHeight: lineHeights.body },
  permissionBtn: { alignSelf: 'stretch', marginTop: spacing.sm },

  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },

  checkRing: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  errorRing: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, textAlign: 'center' },
  sheetCode: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, letterSpacing: 0.5 },

  sheetCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sheetLabel: { fontSize: fontSizes.caption },
  sheetValue: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.bold, textAlign: 'right' },

  autoStopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  autoStop: { fontSize: fontSizes.caption },
  errorBody: { fontSize: fontSizes.body, textAlign: 'center', lineHeight: lineHeights.body },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countdownText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
});
