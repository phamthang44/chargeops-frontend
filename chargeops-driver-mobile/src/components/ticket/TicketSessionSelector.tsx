import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { TicketFieldError } from '@/components/ticket/TicketFieldError';
import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights, radius, spacing } from '@/theme';
import type { Booking, TicketCategory } from '@/types';
import { formatDateTime } from '@/utils/format';

interface TicketSessionSelectorProps {
  category: TicketCategory;
  loadingCandidates: boolean;
  candidateBookings: Booking[];
  selectedBookingId: string | null;
  onSelectBooking: (booking: Booking) => void;
  /** Scope validation error (BR-TKT-SCOPE) — turns the card border red. */
  error?: string;
}

export function TicketSessionSelector({
  category,
  loadingCandidates,
  candidateBookings,
  selectedBookingId,
  onSelectBooking,
  error,
}: TicketSessionSelectorProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: error ? themeColors.error : themeColors.border,
          shadowColor: themeColors.error,
          shadowOpacity: error ? 0.22 : 0,
          shadowRadius: error ? 10 : 0,
          elevation: error ? 3 : 0,
        },
      ]}
    >
      <View style={styles.sessionHeaderRow}>
        <View style={styles.headerCol}>
          <Text style={[styles.sectionTitle, { color: error ? themeColors.error : themeColors.textStrong }]}>
            {category === 'CHARGING_ISSUE'
              ? t('ticket.create.selectSessionTitle', 'Chọn phiên sạc gặp sự cố *')
              : t('ticket.create.selectStationTitle', 'Chọn trạm hoặc phiên đặt chỗ *')}
          </Text>
          <Text style={[styles.sessionHelpText, { color: themeColors.textMuted }]}>
            {category === 'CHARGING_ISSUE'
              ? t('ticket.create.selectSessionHelp', 'Sự cố sạc pin yêu cầu liên kết với phiên sạc để kỹ thuật viên kiểm tra trụ sạc và kích hoạt bồi hoàn cọc 100%.')
              : t('ticket.create.selectStationHelp', 'Lỗi đặt chỗ yêu cầu liên kết với trạm sạc hoặc phiên đặt chỗ liên quan.')}
          </Text>
        </View>
      </View>

      {loadingCandidates ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={themeColors.primary} />
          <Text style={[styles.loadingBoxText, { color: themeColors.textMuted }]}>
            {t('common.loading', 'Đang tải danh sách phiên sạc...')}
          </Text>
        </View>
      ) : candidateBookings.length === 0 ? (
        <View
          style={[
            styles.warningBox,
            {
              backgroundColor: isDark ? '#2E1A0A' : '#FFFBEB',
              borderColor: isDark ? '#78350F' : '#FDE68A',
            },
          ]}
        >
          <Ionicons name="warning-outline" size={20} color="#D97706" />
          <View style={styles.headerCol}>
            <Text style={styles.warningTitle}>
              {t('ticket.create.noSessionsFound', 'Không tìm thấy phiên sạc nào trên tài khoản')}
            </Text>
            <Text style={[styles.warningBody, { color: themeColors.textMuted }]}>
              {t('ticket.create.noSessionsWarning', 'Để báo "Sự cố sạc pin", bạn cần chọn một phiên sạc đã thực hiện. Nếu gặp sự cố chung, vui lòng chọn loại "Thanh toán & Phí" hoặc "Vấn đề khác".')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.candidateList}>
          {candidateBookings.map((b) => {
            const isSelected = selectedBookingId === b.id;
            const startTimeStr = formatDateTime(b.startAt, '—');

            return (
              <Pressable
                key={b.id}
                style={[
                  styles.candidateItem,
                  {
                    backgroundColor: isSelected ? (isDark ? '#0D3827' : '#ECFDF5') : themeColors.surfaceAlt,
                    borderColor: isSelected ? '#10B981' : themeColors.border,
                  },
                ]}
                onPress={() => onSelectBooking(b)}
              >
                <View style={styles.candidateLeft}>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? '#10B981' : themeColors.border,
                        backgroundColor: isSelected ? '#10B981' : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                  <View style={styles.candidateBody}>
                    <View style={styles.candidateRow}>
                      <Text style={[styles.candidateStation, { color: themeColors.textStrong }]} numberOfLines={1}>
                        {b.stationName || t('common.station', 'Trạm sạc')}
                      </Text>
                      <Text style={styles.candidateCode}>
                        #{String(b.id).slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.candidateSubRow}>
                      <Ionicons name="time-outline" size={13} color={themeColors.textMuted} />
                      <Text style={[styles.candidateTime, { color: themeColors.textMuted }]}>
                        {startTimeStr}
                      </Text>
                      <Text style={[styles.candidateStatus, { color: themeColors.textMuted }]}>
                        · {b.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <TicketFieldError message={error} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  sessionHeaderRow: {
    marginBottom: 4,
  },
  headerCol: {
    flex: 1,
  },
  sessionHelpText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingBoxText: {
    fontSize: 13,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
    color: '#B45309',
  },
  warningBody: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  candidateList: {
    gap: 8,
    marginTop: 4,
  },
  candidateItem: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  candidateBody: {
    flex: 1,
    gap: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  candidateStation: {
    fontSize: 14.5,
    fontWeight: fontWeights.bold,
    flex: 1,
  },
  candidateCode: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    fontFamily: 'monospace',
    color: '#3B82F6',
  },
  candidateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  candidateTime: {
    fontSize: 12.5,
  },
  candidateStatus: {
    fontSize: 12.5,
  },
});
