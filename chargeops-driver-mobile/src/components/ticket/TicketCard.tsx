import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Ticket, TicketCategory, TicketStatus } from '@/types';
import { formatDate } from '@/utils/format';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
}

const CATEGORY_CONFIG: Record<
  TicketCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  CHARGING_ISSUE: { label: 'Sự cố sạc trạm', icon: 'flash-outline', color: '#EF4444' },
  BOOKING: { label: 'Vấn đề đặt chỗ', icon: 'calendar-outline', color: '#3B82F6' },
  PAYMENT: { label: 'Thanh toán & Phí', icon: 'wallet-outline', color: '#F59E0B' },
  ACCOUNT: { label: 'Tài khoản tài xế', icon: 'person-outline', color: '#8B5CF6' },
  OTHER: { label: 'Yêu cầu khác', icon: 'help-circle-outline', color: '#6B7280' },
};

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }
> = {
  OPEN: { label: 'Mới mở', variant: 'info' },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'warning' },
  RESOLVED: { label: 'Đã giải quyết', variant: 'success' },
  CLOSED: { label: 'Đã đóng', variant: 'neutral' },
};

export function TicketCard({ ticket, onPress }: TicketCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const categoryMeta = CATEGORY_CONFIG[ticket.category] ?? CATEGORY_CONFIG.OTHER;
  const statusMeta = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;

  const categoryLabel = t(`ticket.category.${ticket.category}`, categoryMeta.label);
  const statusLabel = t(`ticket.status.${ticket.status}`, statusMeta.label);

  const latestMessage = ticket.messages?.length > 0 ? ticket.messages[ticket.messages.length - 1] : null;
  const hasRefund = ticket.refundIds && ticket.refundIds.length > 0;
  const hasFinding = ticket.findings && ticket.findings.length > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {/* Header: Code & Status */}
      <View style={styles.headerRow}>
        <View style={styles.codeBadge}>
          <Ionicons name="pricetag-outline" size={14} color={themeColors.primary} />
          <Text style={[styles.codeText, { color: themeColors.textStrong }]}>{ticket.ticketCode}</Text>
        </View>
        {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && ticket.isEscalated ? (
          <StatusBadge variant="info" label={t('ticket.escalation.escalatedBadge', 'Đang được Admin xem xét')} dot />
        ) : (
          <StatusBadge variant={statusMeta.variant} label={statusLabel} dot />
        )}
      </View>

      {/* Category & Subject */}
      <View style={styles.subjectRow}>
        <View style={[styles.categoryTag, { backgroundColor: `${categoryMeta.color}15` }]}>
          <Ionicons name={categoryMeta.icon} size={14} color={categoryMeta.color} />
          <Text style={[styles.categoryText, { color: categoryMeta.color }]}>{categoryLabel}</Text>
        </View>
      </View>

      <Text style={[styles.subjectText, { color: themeColors.textStrong }]} numberOfLines={2}>
        {ticket.subject}
      </Text>

      {/* Latest message preview */}
      {latestMessage && (
        <View style={[styles.previewBox, { backgroundColor: themeColors.surfaceAlt }]}>
          <Text style={[styles.previewSender, { color: themeColors.textMuted }]} numberOfLines={1}>
            {latestMessage.authorDisplayName}:
          </Text>
          <Text style={[styles.previewBody, { color: themeColors.textBody }]} numberOfLines={2}>
            {latestMessage.body}
          </Text>
        </View>
      )}

      {/* Refund applied to booking — neutral label, NOT tied to station fault */}
      {hasRefund && (
        <View style={[styles.refundBadge, { backgroundColor: isDark ? '#113322' : '#ECFDF5' }]}>
          <Ionicons name="cash-outline" size={15} color="#10B981" />
          <Text style={[styles.refundText, { color: '#10B981' }]}>
            {t('ticket.card.refundApplied', 'Đã hoàn tiền đơn sạc liên quan')}
          </Text>
        </View>
      )}

      {/* Footer Info */}
      <View style={[styles.footerRow, { borderTopColor: themeColors.border }]}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={13} color={themeColors.textMuted} />
          <Text style={[styles.footerText, { color: themeColors.textMuted }]}>
            {formatDate(ticket.createdAt)}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="chatbubbles-outline" size={13} color={themeColors.textMuted} />
          <Text style={[styles.footerText, { color: themeColors.textMuted }]}>
            {t('ticket.card.repliesCount', { count: ticket.messages?.length || 0 })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  categoryText: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.medium,
  },
  subjectText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.body,
  },
  previewBox: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: 2,
  },
  previewSender: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.bold,
  },
  previewBody: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  refundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  refundText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: fontSizes.caption - 1,
  },
});
