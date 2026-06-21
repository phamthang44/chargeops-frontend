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
import { checkInBooking, getBookingById } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTimeRange } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QRCheckIn'>;
type Route = RouteProp<RootStackParamList, 'QRCheckIn'>;

/**
 * "Quét QR Check-in" — final step of the booking flow.
 * Uses the real device camera (expo-camera, bundled in Expo Go SDK 54) to scan
 * the QR code on the charger. A "simulate" fallback keeps it usable on a
 * simulator or when camera permission is denied.
 */
export function QRCheckInScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [permission, requestPermission] = useCameraPermissions();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  // Guards against the camera firing onBarcodeScanned many times per second.
  const handled = useRef(false);

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

  // Ask for camera permission once on mount if still undetermined.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  async function runCheckIn() {
    if (handled.current) return;
    handled.current = true;
    setScanning(true);
    if (params?.bookingId) await checkInBooking(params.bookingId);
    setScanning(false);
    setScanned(true);
  }

  function startCharging() {
    navigation.replace('ChargingSession', { bookingId: params?.bookingId });
  }

  const chargerCode = booking
    ? `EV-${booking.connectorType}-${booking.chargerId.replace('ch-', '')}`
    : 'EV-VN-0000';

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
              onBarcodeScanned={scanned || scanning ? undefined : runCheckIn}
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
              <Pressable onPress={runCheckIn} hitSlop={8}>
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
            <Pressable onPress={runCheckIn} hitSlop={8}>
              <Text style={styles.simulateLink}>{t('qrCheckIn.simulate')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Success sheet */}
      {scanned && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.checkRing}>
              <Ionicons name="checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.sheetTitle}>{t('qrCheckIn.successTitle')}</Text>
            <Text style={styles.sheetCode}>{t('qrCheckIn.chargerCode', { code: chargerCode })}</Text>

            <View style={styles.sheetCard}>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>{t('qrCheckIn.station')}</Text>
                <Text style={styles.sheetValue} numberOfLines={1}>
                  {booking?.stationName ?? '—'}
                </Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>{t('qrCheckIn.connector')}</Text>
                {booking ? (
                  <StatusBadge
                    variant="success"
                    label={`${booking.connectorType} ${booking.powerKw}kW`}
                  />
                ) : (
                  <Text style={styles.sheetValue}>—</Text>
                )}
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>{t('qrCheckIn.time')}</Text>
                <Text style={styles.sheetValue}>
                  {booking ? formatTimeRange(booking.startAt, booking.endAt) : '—'}
                </Text>
              </View>
            </View>

            <AppButton label={t('qrCheckIn.startCharging')} onPress={startCharging} />
            <View style={styles.autoStopRow}>
              <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
              <Text style={styles.autoStop}>{t('qrCheckIn.autoStop')}</Text>
            </View>
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
