import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/AppButton';
import { QrCodeView } from '@/components/common/QrCodeView';
import { generateSimulatorChallenge } from '@/services/bookingService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';

export interface ChargerKioskModalProps {
  visible: boolean;
  onClose: () => void;
  booking?: Booking | null;
  connectorId?: string;
  onSimulateScan: (token: string) => void;
}

/**
 * "Kiosk Trụ Sạc Ngoài Đời Thực" — Physical LCD Kiosk Simulator for Driver Mobile.
 * Generates dynamic 60s check-in challenge tokens (BKG-040 / BKG-042) and allows
 * either instant 1-tap automated check-in or real camera scan from another device.
 */
export function ChargerKioskModal({
  visible,
  onClose,
  booking,
  connectorId,
  onSimulateScan,
}: ChargerKioskModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const effectiveConnectorId =
    connectorId || booking?.connectorId || 'mock-conn-01';

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const res = await generateSimulatorChallenge(effectiveConnectorId);
      setToken(res.challengeToken);
      setSecondsRemaining(res.expiresInSeconds || 60);
    } catch {
      const fallback = `chk_sim_${Date.now()}`;
      setToken(fallback);
      setSecondsRemaining(60);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token on open
  useEffect(() => {
    if (visible) {
      loadChallenge();
    } else {
      setToken(null);
      setSecondsRemaining(60);
    }
  }, [visible, effectiveConnectorId]);

  // Countdown timer with auto-refresh on expire
  useEffect(() => {
    if (!visible || !token) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          loadChallenge();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, token]);

  const handleInstantScan = () => {
    if (!token) return;
    onClose();
    onSimulateScan(token);
  };

  const handleCopy = () => {
    if (!token) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.kioskTerminal}>
          {/* Top Bar / Hardware bezel */}
          <View style={styles.kioskHeader}>
            <View style={styles.statusIndicatorRow}>
              <View style={styles.ledDot} />
              <Text style={styles.kioskBrand}>CHARGEOPS TERMINAL OS</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Charger Info */}
          <View style={styles.chargerBanner}>
            <Text style={styles.stationTitle} numberOfLines={1}>
              {booking?.stationName || 'Trạm Sạc ChargeOps Demo'}
            </Text>
            <Text style={styles.connectorSubtitle} numberOfLines={1}>
              {booking
                ? `${booking.chargePointName || 'Trụ sạc'} · ${booking.connectorName} (${booking.connectorType} ${booking.powerKw}kW)`
                : `Cổng sạc: ${effectiveConnectorId} · DC 120kW`}
            </Text>
          </View>

          {/* QR Screen Display */}
          <View style={styles.qrDisplayContainer}>
            <Text style={styles.qrInstruction}>
              Đưa ứng dụng tài xế quét mã QR bên dưới
            </Text>

            <View style={styles.qrCard}>
              {loading || !token ? (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text style={styles.loadingText}>Đang sinh mã Challenge...</Text>
                </View>
              ) : (
                <QrCodeView
                  value={token}
                  size={190}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                />
              )}
            </View>

            {/* Countdown progress bar */}
            <View style={styles.countdownSection}>
              <View style={styles.countdownRow}>
                <View style={styles.timerBadge}>
                  <Ionicons name="timer-outline" size={14} color="#10B981" />
                  <Text style={styles.timerText}>
                    Hiệu lực: <Text style={styles.timerBold}>{secondsRemaining}s</Text>
                  </Text>
                </View>
                <Pressable onPress={loadChallenge} hitSlop={8} style={styles.refreshLink}>
                  <Ionicons name="refresh-outline" size={13} color="#60A5FA" />
                  <Text style={styles.refreshText}>Làm mới</Text>
                </Pressable>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor:
                        secondsRemaining <= 10 ? '#EF4444' : '#10B981',
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionGroup}>
            <AppButton
              label="⚡ Tự động quét & Check-in ngay"
              onPress={handleInstantScan}
              disabled={!token || loading}
              style={styles.primaryBtn}
            />

            <View style={styles.secondaryRow}>
              <Pressable
                onPress={handleCopy}
                disabled={!token}
                style={styles.secondaryActionBtn}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color={copied ? '#10B981' : '#CBD5E1'}
                />
                <Text style={styles.secondaryActionText}>
                  {copied ? 'Đã sao chép token' : 'Sao chép token'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.footerHint}>
            * Mô phỏng màn hình LCD trụ sạc thực tế (TTL 60s, bảo mật atomic CAD).
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  kioskTerminal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  kioskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ledDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  kioskBrand: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 2,
  },
  chargerBanner: {
    alignItems: 'center',
    gap: 3,
  },
  stationTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  connectorSubtitle: {
    fontSize: fontSizes.caption,
    color: '#38BDF8',
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  qrDisplayContainer: {
    backgroundColor: '#020617',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrInstruction: {
    fontSize: fontSizes.caption,
    color: '#94A3B8',
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrPlaceholder: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: fontSizes.caption,
    color: '#64748B',
  },
  countdownSection: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    marginTop: 4,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: fontSizes.caption,
    color: '#CBD5E1',
  },
  timerBold: {
    fontWeight: fontWeights.bold,
    color: '#10B981',
  },
  refreshLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  refreshText: {
    fontSize: fontSizes.caption,
    color: '#60A5FA',
    fontWeight: fontWeights.semibold,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  actionGroup: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  primaryBtn: {
    alignSelf: 'stretch',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  secondaryActionText: {
    fontSize: fontSizes.caption,
    color: '#CBD5E1',
    fontWeight: fontWeights.semibold,
  },
  footerHint: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
});
