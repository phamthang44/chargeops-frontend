import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { cancelBooking, computeRefund } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown, formatMmSs, formatVnd } from '@/utils/format';
import { BottomSheet } from './BottomSheet';

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
      <Text style={styles.subtitle}>{t('cancelBooking.subtitle')}</Text>

      {/* Current-policy banner — green while the grace window still applies */}
      <View style={[styles.policyCard, refund.tier === 'GRACE' && styles.policyCardGrace]}>
        <View style={styles.policyHeader}>
          <Ionicons
            name={refund.tier === 'GRACE' ? 'arrow-undo-outline' : 'alert-circle-outline'}
            size={18}
            color={refund.tier === 'GRACE' ? colors.primaryDark : colors.error}
          />
          <Text style={[styles.policyTitle, refund.tier === 'GRACE' && styles.policyTitleGrace]}>
            {t('cancelBooking.policyTitle', { percent: refund.percent })}
          </Text>
        </View>
        <Text style={styles.policyBody}>{t(`cancelBooking.${TIER_KEY[refund.tier]}`)}</Text>
        {refund.tier === 'GRACE' && (
          <Text style={styles.policyTimer}>
            {t('cancelBooking.graceLeft', { time: formatMmSs(refund.graceRemainingMs) })}
          </Text>
        )}
      </View>

      {/* Refund summary */}
      <View style={styles.summaryHeader}>
        <Ionicons name="wallet-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.summaryTitle}>{t('cancelBooking.summaryTitle')}</Text>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('cancelBooking.totalPaid')}</Text>
          <Text style={styles.rowValue}>{formatVnd(booking.totalPrice)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('cancelBooking.refundRate')}</Text>
          <Text style={styles.rowValue}>{refund.percent}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('cancelBooking.fee')}</Text>
          <Text style={styles.rowValue}>- {formatVnd(refund.feeAmount)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.netLabel}>{t('cancelBooking.netRefund')}</Text>
          <Text style={styles.netValue}>{formatVnd(refund.refundAmount)}</Text>
        </View>
      </View>

      {refund.refundAmount > 0 && (
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={15} color={colors.info} />
          <Text style={styles.noteText}>{t('cancelBooking.walletNote')}</Text>
        </View>
      )}

      {msToStart > 0 && (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={15} color={colors.textMuted} />
          <Text style={styles.timeText}>
            {t('cancelBooking.timeLeft')}{' '}
            <Text style={styles.timeStrong}>{formatCountdown(msToStart)}</Text>
          </Text>
        </View>
      )}

      {/* Actions */}
      <Pressable
        style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
        disabled={cancelling}
        onPress={handleConfirm}
      >
        {cancelling ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.confirmText}>{t('cancelBooking.confirm')}</Text>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
        disabled={cancelling}
        onPress={onClose}
      >
        <Text style={styles.dismissText}>{t('cancelBooking.dismiss')}</Text>
      </Pressable>

      {/* Reputation warning */}
      <View style={styles.warnRow}>
        <Ionicons name="warning-outline" size={15} color={colors.warning} />
        <Text style={styles.warnText}>{t('cancelBooking.warning')}</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted, lineHeight: lineHeights.body },

  // Policy banner
  policyCard: {
    backgroundColor: `${colors.error}14`,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  policyCardGrace: { backgroundColor: colors.primarySoft },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  policyTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.error },
  policyTitleGrace: { color: colors.primaryDark },
  policyBody: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },
  policyTimer: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.primaryDark },

  // Summary
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  summaryTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: fontSizes.body, color: colors.textBody },
  rowValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  divider: { height: 1, backgroundColor: colors.border },
  netLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  netValue: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.error },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteText: { flex: 1, fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: lineHeights.caption },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  timeText: { fontSize: fontSizes.body, color: colors.textBody },
  timeStrong: { fontWeight: fontWeights.bold, color: colors.textStrong },

  // Buttons
  confirmBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  confirmText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textInverse },
  dismissBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textBody },
  pressed: { opacity: 0.85 },

  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  warnText: { flex: 1, fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: lineHeights.caption },
});
