import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Ticket, TicketEscalation } from '@/types';
import { parseSafeDate } from '@/utils/format';

export interface TicketDisputeEscalationCardProps {
  ticket: Ticket;
  escalation?: TicketEscalation | null;
  /**
   * Chỉ người báo cáo (Reporter) mới được khởi tạo khiếu nại phân xử.
   * Khi không truyền vào, ẩn nút — card vẫn hiển thị trạng thái/đếm ngược.
   */
  onOpenEscalate?: () => void;
}

export function TicketDisputeEscalationCard({
  ticket,
  escalation,
  onOpenEscalate,
}: TicketDisputeEscalationCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  // Tick for remaining time countdown
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isStationTicket =
    Boolean(ticket.stationId) ||
    ticket.category === 'CHARGING_ISSUE' ||
    ticket.category === 'BOOKING';

  if (!isStationTicket) return null;

  const validEscalation =
    escalation?.ticketId ? escalation : (ticket.escalation?.ticketId ? ticket.escalation : null);
  const isEscalated = Boolean(validEscalation ? !validEscalation.resolvedAt : ticket.isEscalated);
  const isClosed = ticket.status === 'CLOSED';

  // If ticket is closed, incident is finished - hide active escalation cards
  if (isClosed) return null;

  // State 1: Already Escalated
  if (isEscalated) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1635' : '#F5F3FF',
            borderColor: isDark ? '#6B21A8' : '#DDD6FE',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? '#3B0764' : '#EDE9FE' }]}>
            <Ionicons name="shield-checkmark" size={18} color="#8B5CF6" />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.cardTitle, { color: isDark ? '#D8B4FE' : '#6D28D9' }]}>
              {t('ticket.escalation.escalatedTitle', 'Admin đang xem xét yêu cầu hỗ trợ')}
            </Text>
            <Text style={[styles.cardSubtitle, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>
              {t('ticket.escalation.arbiterRole', 'Admin điều phối hỗ trợ vận hành')}
            </Text>
          </View>
        </View>

        <Text style={[styles.bodyText, { color: themeColors.textBody }]}>
          {t(
            'ticket.escalation.escalatedDesc',
            'Admin sẽ xem xét và trả lại trạm xử lý hoặc kết thúc quy trình hỗ trợ với lý do rõ ràng.',
          )}
        </Text>

        {validEscalation?.reason && (
          <View
            style={[
              styles.reasonBox,
              {
                backgroundColor: isDark ? '#2E1065' : '#EDE9FE',
                borderColor: isDark ? '#581C87' : '#C4B5FD',
              },
            ]}
          >
            <Text style={[styles.reasonLabel, { color: isDark ? '#E9D5FF' : '#5B21B6' }]}>
              {t('ticket.escalation.reasonLabel', 'Nội dung yêu cầu xem xét:')}
            </Text>
            <Text style={[styles.reasonText, { color: isDark ? '#F5F3FF' : '#4C1D95' }]}>
              “{validEscalation.reason}”
            </Text>
          </View>
        )}
      </View>
    );
  }

  // If closed without escalation, don't show active cards
  if (isClosed) return null;

  // Calculate elapsed time from ticket creation safely
  const parsedDate = parseSafeDate(ticket.createdAt);
  const createdAtMs = parsedDate ? parsedDate.getTime() : Date.now();
  const elapsedMs = Math.max(0, Date.now() - createdAtMs);
  const isPast24h = elapsedMs >= 24 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsedMs);

  const nonStationFaultFinding = ticket.findings?.find(
    (f) =>
      f.conclusion === 'USER_ERROR' ||
      (f as any).conclusion === 'NO_ISSUE' ||
      (f as any).conclusion === 'POWER_OUTAGE' ||
      (f as any).conclusion === 'NOT_STATION_FAILURE' ||
      (f as any).conclusion === 'NO_FAULT_FOUND',
  );

  const canEscalate = ticket.status !== 'RESOLVED' && (
    ticket.escalationAvailability?.canRequest ?? (isPast24h || Boolean(nonStationFaultFinding))
  );

  // State 2: Eligible for Escalation
  if (canEscalate) {
    const triggerText = nonStationFaultFinding
      ? t('ticket.escalation.triggerDisputedFinding', 'Trạm đã kết luận không lỗi thiết bị — Bạn có thể khiếu nại')
      : t('ticket.escalation.triggerUnresponsive', 'Trạm sạc đã quá thời hạn 24 giờ chưa xử lý sự cố');

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1635' : '#FAF5FF',
            borderColor: isDark ? '#7E22CE' : '#E9D5FF',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? '#3B0764' : '#EDE9FE' }]}>
            <Ionicons name="scale-outline" size={18} color="#9333EA" />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.cardTitle, { color: isDark ? '#E9D5FF' : '#6B21A8' }]}>
              {t('ticket.escalation.eligibleTitle', 'Quyền Yêu cầu Quản trị viên Phân xử')}
            </Text>
            <View style={styles.triggerBadge}>
              <Text style={styles.triggerBadgeText}>{triggerText}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.bodyText, { color: themeColors.textBody }]}>
          {t(
            'ticket.escalation.eligibleDesc',
            'Bạn có thể yêu cầu Admin xem xét hỗ trợ khi trạm không phản hồi hoặc cần thêm điều phối.',
          )}
        </Text>

        {onOpenEscalate && (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenEscalate}
            style={({ pressed }) => [
              styles.escalateButton,
              {
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
            <Text style={styles.escalateButtonText}>
              {t('ticket.escalation.escalateBtn', 'Yêu cầu Admin xem xét')}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // State 3: Countdown Active (< 24h & no rejecting findings)
  const remainingHours = Math.floor(remainingMs / (3600 * 1000));
  const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
  const countdownText = `${remainingHours} giờ ${remainingMins} phút`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#2D2010' : '#FFFBEB',
          borderColor: isDark ? '#78350F' : '#FDE68A',
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
          <Ionicons name="timer-outline" size={18} color="#D97706" />
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
            {t('ticket.escalation.countdownTitle', 'Thời hạn xử lý trực tiếp của trạm sạc')}
          </Text>
          <Text style={[styles.countdownBadgeText, { color: '#D97706' }]}>
            ⏱️ {t('ticket.escalation.countdownRemaining', { time: countdownText, defaultValue: `Còn lại: ${countdownText}` })}
          </Text>
        </View>
      </View>

      <Text style={[styles.bodyText, { color: themeColors.textBody }]}>
        {t(
          'ticket.escalation.countdownDesc',
          'Khi đủ điều kiện, bạn có thể gửi yêu cầu Admin xem xét hỗ trợ.',
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
  },
  triggerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  triggerBadgeText: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: '#7C3AED',
  },
  countdownBadgeText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  reasonBox: {
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 3,
  },
  reasonLabel: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  reasonText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  escalateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: 2,
  },
  escalateButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
  },
});
