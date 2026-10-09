import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';
import { BezelCard } from './BezelCard';

interface RefundStatusCardProps {
  booking: Booking;
}

export function RefundStatusCard({ booking }: RefundStatusCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

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

  const getStatusBadge = () => {
    if (isNeedsRec) {
      return t('bookingDetail.refundBadgeReconciling', 'Đang tra soát');
    }
    if (isPending) {
      return t('bookingDetail.refundBadgeProcessing', 'Đang hoàn tiền');
    }
    return t('bookingDetail.refundBadgeSucceeded', 'Đã hoàn tiền');
  };

  const getStatusDesc = () => {
    if (isNeedsRec) {
      return t(
        'bookingDetail.refundDescReconciling',
        'Khoản tiền đang được bộ phận tài chính đối soát với đối tác thanh toán. Quyền lợi hoàn tiền của bạn vẫn được bảo lưu nguyên vẹn.',
      );
    }
    if (isPending) {
      if (refund?.executionPolicy === 'AUTO_FIRST_ATTEMPT') {
        return t(
          'bookingDetail.refundDescAutoProcessing',
          'Yêu cầu hoàn tiền đã được tạo và đang được hệ thống xử lý tự động về phương thức thanh toán ban đầu của bạn.',
        );
      }
      return t(
        'bookingDetail.refundDescProcessing',
        'Yêu cầu hoàn tiền đã được ghi nhận và đang chờ xử lý hoàn về phương thức thanh toán ban đầu của bạn.',
      );
    }
    return t(
      'bookingDetail.refundDescSucceeded',
      'Số tiền đã được hoàn trả thành công về phương thức thanh toán ban đầu của bạn.',
    );
  };

  return (
    <BezelCard tone={toneColor} coreColor={`${toneColor}12`} contentStyle={styles.card}>
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
            {getStatusBadge()}
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
    </BezelCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
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
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
  },
  description: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
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
