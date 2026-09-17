import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';

interface RefundStatusCardProps {
  booking: Booking;
}

export function RefundStatusCard({ booking }: RefundStatusCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const refund = booking.refunds?.[0];
  const refundAmount = refund?.amount ?? booking.refundAmount ?? 0;
  const refundStatus = refund?.status ?? (refundAmount > 0 ? 'SUCCEEDED' : 'NONE');
  const needsReconciliation = refund?.needsReconciliation ?? false;

  if (refundAmount <= 0 && refundStatus === 'NONE') {
    return null;
  }

  const isSuccess = refundStatus === 'SUCCEEDED';
  const isPending = refundStatus === 'PENDING' || refundStatus === 'PROCESSING';
  const isNeedsRec = needsReconciliation || refundStatus === 'FAILED';

  const toneColor = isSuccess
    ? themeColors.success
    : isPending
    ? themeColors.warning
    : themeColors.error;

  const getReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'VOLUNTARY_GRACE':
        return t('bookingDetail.refundReasonGrace', 'Hoàn 100% (Ân hạn hủy tự nguyện)');
      case 'STATION_FAILURE':
        return t('bookingDetail.refundReasonStationFailure', 'Hoàn tiền do sự cố trạm sạc');
      case 'EXCESS_PAYMENT':
        return t('bookingDetail.refundReasonExcess', 'Hoàn số tiền thanh toán thừa');
      case 'UNAPPLIED_PAYMENT':
        return t('bookingDetail.refundReasonUnapplied', 'Hoàn tiền giao dịch chưa phân bổ');
      default:
        return t('bookingDetail.refundReasonDefault', 'Hoàn tiền theo chính sách quy định');
    }
  };

  const getStatusTitle = () => {
    if (isNeedsRec) {
      return t('bookingDetail.refundStatusReconciling', 'Đang tra soát hoàn tiền');
    }
    if (isPending) {
      return t('bookingDetail.refundStatusProcessing', 'Đang xử lý hoàn tiền');
    }
    return t('bookingDetail.refundStatusSucceeded', 'Đã hoàn tiền thành công');
  };

  const getStatusDesc = () => {
    if (isNeedsRec) {
      return t(
        'bookingDetail.refundDescReconciling',
        'Khoản tiền đang được bộ phận tài chính đối soát với đối tác thanh toán. Bạn không cần nộp thêm hay thực hiện thao tác nào.',
      );
    }
    if (isPending) {
      return t(
        'bookingDetail.refundDescProcessing',
        'Yêu cầu hoàn tiền đã được ghi nhận và đang chuyển về Ví ChargeOps / Tài khoản nguồn (2-5 phút).',
      );
    }
    return t(
      'bookingDetail.refundDescSucceeded',
      'Số tiền đã được hoàn trả thành công về Ví ChargeOps của bạn.',
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `${toneColor}0A`,
          borderColor: `${toneColor}36`,
          shadowColor: isDark ? '#000000' : themeColors.textStrong,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${toneColor}1A` }]}>
          <Ionicons
            name={
              isSuccess
                ? 'shield-checkmark-outline'
                : isPending
                ? 'hourglass-outline'
                : 'alert-circle-outline'
            }
            size={18}
            color={toneColor}
          />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={[styles.title, { color: themeColors.textStrong }]}>{getStatusTitle()}</Text>
          <Text style={[styles.reasonLabel, { color: toneColor }]}>
            {getReasonLabel(refund?.reason)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${toneColor}1A` }]}>
          <Text style={[styles.statusBadgeText, { color: toneColor }]}>
            {refundStatus}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: themeColors.textBody }]}>
        {getStatusDesc()}
      </Text>

      <View style={[styles.amountRow, { borderTopColor: `${toneColor}24` }]}>
        <Text style={[styles.amountLabel, { color: themeColors.textMuted }]}>
          {t('bookingDetail.refundedTotal', 'Số tiền hoàn trả')}
        </Text>
        <Text style={[styles.amountValue, { color: toneColor }]}>
          {formatVnd(refundAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  reasonLabel: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: fontSizes.caption - 2,
    fontWeight: fontWeights.bold,
  },
  description: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  amountLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  amountValue: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
});
