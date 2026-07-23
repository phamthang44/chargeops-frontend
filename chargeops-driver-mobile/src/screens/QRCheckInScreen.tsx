import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import {
  confirmCheckIn,
  getBookingById,
  resolveCheckIn,
  type CheckInResolution,
} from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime, formatTimeRange } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QRCheckIn'>;
type Route = RouteProp<RootStackParamList, 'QRCheckIn'>;

/**
 * "Quét QR Check-in" — final step of the booking flow (FR07).
 *
 * Uses the real device camera (expo-camera, bundled in Expo Go SDK 54) to scan
 * the QR on the Connector. The QR encodes one Connector id and nothing else, so
 * the scan resolves to exactly one port; the service then looks for a Confirmed
 * booking of this driver's on that port inside the check-in window.
 *
 * Scanning never checks anyone in by itself: a successful scan shows a
 * confirmation screen and the driver taps to commit. A failed scan says *why* —
 * wrong port, too early, or window expired — because the remedy differs.
 *
 * A "simulate" fallback keeps it usable on a simulator or when camera permission
 * is denied.
 */
export function QRCheckInScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [permission, requestPermission] = useCameraPermissions();
  const [expected, setExpected] = useState<Booking | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResolution | null>(null);
  const [committing, setCommitting] = useState(false);
  // Guards against the camera firing onBarcodeScanned many times per second.
  const handled = useRef(false);

  // The booking the driver came here to check into — used to prefill the
  // simulate fallback with the right QR token.
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

  // Ask for camera permission once on mount if still undetermined.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  async function handleScan(payload: string) {
    if (handled.current) return;
    handled.current = true;
    setScanning(true);
    setResult(await resolveCheckIn(payload));
    setScanning(false);
  }

  /** Simulator fallback: pretend we scanned the port this booking is for. */
  function simulateScan() {
    void handleScan(expected?.connectorId ?? '');
  }

  function retry() {
    handled.current = false;
    setResult(null);
  }

  async function commitCheckIn() {
    if (!result?.ok) return;
    setCommitting(true);
    await confirmCheckIn(result.booking.id);
    setCommitting(false);
    navigation.replace('ChargingSession', { bookingId: result.booking.id });
  }

  /** Localized explanation for a rejected scan (FR07 failure cases). */
  function errorBody(r: Extract<CheckInResolution, { ok: false }>): string {
    switch (r.code) {
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Close */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel={t('qrCheckIn.close')}
        >
          <Ionicons name="close" size={28} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.topTitle}>{t('qrCheckIn.title')}</Text>
        <View style={styles.topSpacer} />
      </View>

      {/* Scanner / permission states */}
      <View style={styles.scannerArea}>
        {!permission ? (
          <ActivityIndicator color={colors.primaryLight} size="large" />
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
            {/* Frame overlay */}
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {scanning && <ActivityIndicator color={colors.primaryLight} size="large" />}
            </View>
            <View style={styles.hintBlock}>
              <Text style={styles.scanHint}>
                {scanning ? t('qrCheckIn.scanning') : t('qrCheckIn.scanHint')}
              </Text>
              <Pressable onPress={simulateScan} hitSlop={8}>
                <Text style={styles.simulateLink}>{t('qrCheckIn.simulate')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          // Denied / restricted
          <View style={styles.permissionBlock}>
            <View style={styles.permissionIcon}>
              <Ionicons name="camera-outline" size={40} color={colors.textInverse} />
            </View>
            <Text style={styles.permissionTitle}>{t('qrCheckIn.permissionTitle')}</Text>
            <Text style={styles.permissionBody}>{t('qrCheckIn.permissionBody')}</Text>
            <AppButton
              label={permission.canAskAgain ? t('qrCheckIn.allow') : t('qrCheckIn.openSettings')}
              onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
              style={styles.permissionBtn}
            />
            <Pressable onPress={simulateScan} hitSlop={8}>
              <Text style={styles.simulateLink}>{t('qrCheckIn.simulate')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Confirmation sheet — the driver commits the check-in from here (FR07) */}
      {result?.ok && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.checkRing}>
              <Ionicons name="qr-code-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.sheetTitle}>{t('qrCheckIn.confirmTitle')}</Text>
            {/* The Charger ID the QR resolved to (BR-CHG-02) */}
            <Text style={styles.sheetCode}>
              {t('qrCheckIn.chargerCode', { code: result.connector.id })}
            </Text>

            <View style={styles.sheetCard}>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>{t('qrCheckIn.station')}</Text>
                <Text style={styles.sheetValue} numberOfLines={1}>
                  {result.booking.stationName}
                </Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>{t('qrCheckIn.connector')}</Text>
                <StatusBadge
                  variant="success"
                  label={`${result.connector.connectorType} ${result.connector.powerKw}kW`}
                />
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>{t('qrCheckIn.time')}</Text>
                <Text style={styles.sheetValue}>
                  {formatTimeRange(result.booking.startAt, result.booking.endAt)}
                </Text>
              </View>
            </View>

            <AppButton
              label={t('qrCheckIn.confirmCta')}
              loading={committing}
              onPress={commitCheckIn}
            />
            <View style={styles.autoStopRow}>
              <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
              <Text style={styles.autoStop}>{t('qrCheckIn.autoStop')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rejected scan — say which of the FR07 failure cases it was */}
      {result && !result.ok && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.errorRing}>
              <Ionicons name="alert" size={30} color={colors.error} />
            </View>
            <Text style={styles.sheetTitle}>{t(`qrCheckIn.errorTitles.${result.code}`)}</Text>
            <Text style={styles.errorBody}>{errorBody(result)}</Text>
            {result.connector && (
              <Text style={styles.sheetCode}>
                {t('qrCheckIn.scannedCode', { code: result.connector.id })}
              </Text>
            )}
            <AppButton label={t('qrCheckIn.rescan')} onPress={retry} />
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={styles.dismissLink}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const FRAME = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textStrong },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 2,
  },
  topTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textInverse },
  topSpacer: { width: 28 },

  scannerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: colors.primaryLight },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.lg },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.lg },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.lg },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.lg },

  hintBlock: { position: 'absolute', bottom: spacing.xxl, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  scanHint: {
    fontSize: fontSizes.body,
    color: colors.textInverse,
    textAlign: 'center',
    lineHeight: lineHeights.body,
  },
  simulateLink: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primaryLight },

  // Permission denied state
  permissionBlock: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textInverse, textAlign: 'center' },
  permissionBody: {
    fontSize: fontSizes.body,
    color: colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: lineHeights.body,
  },
  permissionBtn: { alignSelf: 'stretch', marginTop: spacing.sm },

  // Success sheet
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  checkRing: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRing: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBody: {
    fontSize: fontSizes.body,
    color: colors.textBody,
    textAlign: 'center',
    lineHeight: lineHeights.body,
  },
  dismissLink: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sheetTitle: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong, textAlign: 'center' },
  sheetCode: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
  sheetCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sheetLabel: { fontSize: fontSizes.body, color: colors.textMuted },
  sheetValue: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong, textAlign: 'right' },
  autoStopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  autoStop: { fontSize: fontSizes.caption, color: colors.textMuted },
});
