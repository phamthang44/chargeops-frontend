import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  confirmCheckIn,
  getActiveBookings,
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
  const handled = useRef(false);

  useEffect(() => {
    let active = true;
    if (params?.bookingId) {
      getBookingById(params.bookingId).then((b) => {
        if (active && b) setExpected(b);
      });
    } else {
      getActiveBookings().then((list) => {
        const found = list.find((b) => b.status === 'CONFIRMED');
        if (active && found) setExpected(found);
      });
    }
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
          connector: r.booking?.connectorCode || r.booking?.connectorName || 'Cổng sạc',
          chargePoint: r.booking?.chargePointCode || r.booking?.chargePointName || 'Trụ sạc',
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

      {/* Target Booking Info Banner — Displays exact Station, Charge Point, and Connector */}
      {expected && (
        <View style={[styles.targetBanner, { backgroundColor: '#131917', borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
          <View style={styles.targetBannerTop}>
            <View style={styles.targetDot} />
            <Text style={styles.targetStation} numberOfLines={1}>
              {expected.stationName}
            </Text>
          </View>
          <View style={styles.targetPillRow}>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeLabel}>Trụ:</Text>
              <Text style={styles.targetBadgeVal}>
                {expected.chargePointCode || expected.chargePointName || 'N/A'}
              </Text>
            </View>
            <View style={[styles.targetBadge, styles.targetBadgeHighlight]}>
              <Text style={styles.targetBadgeLabel}>Cổng:</Text>
              <Text style={styles.targetBadgeValHighlight}>
                {expected.connectorCode || expected.connectorName}
              </Text>
            </View>
            <Text style={styles.targetType}>
              {expected.connectorType} · {expected.powerKw}kW
            </Text>
          </View>
        </View>
      )}

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
          </View>
        )}
      </View>

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
            {result.code === 'WRONG_CONNECTOR' && result.booking && (
              <View style={[styles.targetBox, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
                <Text style={[styles.targetBoxTitle, { color: themeColors.primary }]}>
                  Vị trí sạc trong lượt đặt của bạn:
                </Text>
                <View style={styles.targetBoxRow}>
                  <Text style={[styles.targetBoxLabel, { color: themeColors.textMuted }]}>Trụ sạc:</Text>
                  <Text style={[styles.targetBoxValCode, { color: '#FFFFFF', backgroundColor: '#1E293B' }]}>
                    {result.booking.chargePointCode || result.booking.chargePointName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.targetBoxRow}>
                  <Text style={[styles.targetBoxLabel, { color: themeColors.textMuted }]}>Cổng sạc:</Text>
                  <Text style={[styles.targetBoxValHighlight, { color: themeColors.primary }]}>
                    {result.booking.connectorCode || result.booking.connectorName}
                  </Text>
                </View>
                <View style={styles.targetBoxRow}>
                  <Text style={[styles.targetBoxLabel, { color: themeColors.textMuted }]}>Trạm sạc:</Text>
                  <Text style={[styles.targetBoxVal, { color: themeColors.textStrong }]} numberOfLines={1}>
                    {result.booking.stationName}
                  </Text>
                </View>
              </View>
            )}
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

  targetBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  targetBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  targetStation: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: '#E2E8F0',
    flex: 1,
  },
  targetPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 4,
  },
  targetBadgeHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  targetBadgeLabel: {
    fontSize: fontSizes.caption - 1,
    color: '#94A3B8',
  },
  targetBadgeVal: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  targetBadgeValHighlight: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: '#10B981',
    fontFamily: 'monospace',
  },
  targetType: {
    fontSize: fontSizes.caption - 1,
    color: '#94A3B8',
    marginLeft: 'auto',
  },

  targetBox: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  targetBoxTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  targetBoxLabel: {
    fontSize: fontSizes.caption,
  },
  targetBoxVal: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  targetBoxValCode: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    fontFamily: 'monospace',
  },
  targetBoxValHighlight: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    fontFamily: 'monospace',
  },
});
