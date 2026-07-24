import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { usePreferences } from '@/context/PreferencesContext';
import { cancelBooking, computeRefund } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown, formatMmSs, formatVnd } from '@/utils/format';

interface CancelBookingSheetProps {
  visible: boolean;
  booking: Booking;
  onClose: () => void;
  /** Called with the updated (CANCELLED) booking after a successful cancel. */
  onConfirmed: (booking: Booking) => void;
}

// Map the refund tier to the policy-banner body copy. GRACE is the FR05
// reconsideration window — a full refund that overrides the time-based tiers.
const TIER_KEY = {
  GRACE: 'policyGrace',
  FULL: 'policyFull',
  PARTIAL: 'policyPartial',
  NONE: 'policyNone',
} as const;

/**
 * "Xác nhận hủy đặt chỗ" — refund-aware cancellation confirmation sheet
 * (visily-cancellation-confirmation). Shows the live FR08 refund breakdown
 * (recomputed each second as the slot start approaches) before the driver
 * confirms. Cancelling persists the refund amount on the booking.
 */
export function CancelBookingSheet({ visible, booking, onClose, onConfirmed }: CancelBookingSheetProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const [now, setNow] = useState(Date.now());
  const [cancelling, setCancelling] = useState(false);

  // Tick once a second while open so the breakdown + countdown stay live.
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const refund = useMemo(() => computeRefund(booking, now), [booking, now]);
  const msToStart = new Date(booking.startAt).getTime() - now;

  async function handleConfirm() {
    setCancelling(true);
    try {
      const updated = await cancelBooking(booking.id);
      if (updated) onConfirmed(updated);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('cancelBooking.title')}>
      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('cancelBooking.subtitle')}</Text>

      {/* Current policy banner */}
      <View style={[styles.policyCard, { backgroundColor: `${themeColors.error}14` }, refund.tier === 'GRACE' && { backgroundColor: themeColors.primarySoft }]}>
        <View style={styles.policyHeader}>
          <Ionicons
            name={refund.tier === 'GRACE' ? 'arrow-undo-outline' : 'alert-circle-outline'}
            size={18}
            color={refund.tier === 'GRACE' ? themeColors.primaryDark : themeColors.error}
          />
          <Text style={[styles.policyTitle, { color: themeColors.error }, refund.tier === 'GRACE' && { color: themeColors.primaryDark }]}>
            {t('cancelBooking.policyTitle', { percent: refund.percent })}
          </Text>
        </View>
        <Text style={[styles.policyBody, { color: themeColors.textBody }]}>{t(`cancelBooking.${TIER_KEY[refund.tier]}`)}</Text>
        {refund.tier === 'GRACE' && (
          <Text style={[styles.policyTimer, { color: themeColors.primaryDark }]}>
            {t('cancelBooking.graceLeft', { time: formatMmSs(refund.graceRemainingMs) })}
          </Text>
        )}
      </View>

      {/* Refund summary */}
      <View style={styles.summaryHeader}>
        <Ionicons name="wallet-outline" size={16} color={themeColors.primaryDark} />
        <Text style={[styles.summaryTitle, { color: themeColors.textMuted }]}>{t('cancelBooking.summaryTitle')}</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: themeColors.textBody }]}>{t('cancelBooking.totalPaid')}</Text>
          <Text style={[styles.rowValue, { color: themeColors.textStrong }]}>{formatVnd(booking.totalPrice)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: themeColors.textBody }]}>{t('cancelBooking.refundRate')}</Text>
          <Text style={[styles.rowValue, { color: themeColors.textStrong }]}>{refund.percent}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: themeColors.textBody }]}>{t('cancelBooking.fee')}</Text>
          <Text style={[styles.rowValue, { color: themeColors.textStrong }]}>- {formatVnd(refund.feeAmount)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        <View style={styles.row}>
          <Text style={[styles.netLabel, { color: themeColors.textStrong }]}>{t('cancelBooking.netRefund')}</Text>
          <Text style={[styles.netValue, { color: themeColors.error }]}>{formatVnd(refund.refundAmount)}</Text>
        </View>
      </View>

      {refund.refundAmount > 0 && (
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={15} color={themeColors.info} />
          <Text style={[styles.noteText, { color: themeColors.textMuted }]}>{t('cancelBooking.walletNote')}</Text>
        </View>
      )}

      {msToStart > 0 && (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={15} color={themeColors.textMuted} />
          <Text style={[styles.timeText, { color: themeColors.textBody }]}>
            {t('cancelBooking.timeLeft')}{' '}
            <Text style={[styles.timeStrong, { color: themeColors.textStrong }]}>{formatCountdown(msToStart)}</Text>
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <Pressable
        style={({ pressed }) => [
          styles.confirmBtn,
          { backgroundColor: themeColors.error },
          pressed && styles.pressed,
        ]}
        disabled={cancelling}
        onPress={handleConfirm}
      >
        {cancelling ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.confirmText, { color: '#FFFFFF' }]}>{t('cancelBooking.confirm')}</Text>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.dismissBtn,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          pressed && styles.pressed,
        ]}
        disabled={cancelling}
        onPress={onClose}
      >
        <Text style={[styles.dismissText, { color: themeColors.textStrong }]}>{t('cancelBooking.dismiss')}</Text>
      </Pressable>

      <View style={styles.warnRow}>
        <Ionicons name="warning-outline" size={15} color={themeColors.warning} />
        <Text style={[styles.warnText, { color: themeColors.textMuted }]}>{t('cancelBooking.warning')}</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: fontSizes.body, lineHeight: lineHeights.body },

  policyCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  policyTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  policyBody: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },
  policyTimer: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold },

  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  summaryTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: fontSizes.body },
  rowValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  divider: { height: 1 },
  netLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  netValue: { fontSize: fontSizes.title, fontWeight: fontWeights.bold },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  timeText: { fontSize: fontSizes.body },
  timeStrong: { fontWeight: fontWeights.bold },

  confirmBtn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  confirmText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  dismissBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  pressed: { opacity: 0.85 },

  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  warnText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
});
