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
  getBookingById,
  resolveCheckIn,
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

  async function handleScan(payload: string) {
    if (handled.current) return;
    handled.current = true;
    setScanning(true);
    setResult(await resolveCheckIn(payload));
    setScanning(false);
  }

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
              <Pressable onPress={simulateScan} hitSlop={8}>
                <Text style={[styles.simulateLink, { color: themeColors.primary }]}>{t('qrCheckIn.simulate')}</Text>
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
            <Pressable onPress={simulateScan} hitSlop={8}>
              <Text style={[styles.simulateLink, { color: themeColors.primary }]}>{t('qrCheckIn.simulate')}</Text>
            </Pressable>
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
            <Text style={[styles.sheetTitle, { color: themeColors.textStrong }]}>{t(`qrCheckIn.errorTitles.${result.code}`)}</Text>
            <Text style={[styles.errorBody, { color: themeColors.textBody }]}>{errorBody(result)}</Text>
            {result.connector && (
              <Text style={[styles.sheetCode, { color: themeColors.textMuted }]}>
                {t('qrCheckIn.scannedCode', { code: result.connector.id })}
              </Text>
            )}
            <AppButton label={t('qrCheckIn.rescan')} onPress={retry} />
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
    ...StyleSheet.absoluteFillObject,
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
});
