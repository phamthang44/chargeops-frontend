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
        return t('bookingDetail.refundReasonGrace', 'Nghĩa vụ hoàn 100% giá gói (hủy trong hạn đã lưu)');
      case 'STATION_FAILURE':
        return t('bookingDetail.refundReasonStationFailure', 'Nghĩa vụ hoàn do sự cố trạm sạc');
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
      return t('bookingDetail.refundStatusProcessing', 'Hồ sơ hoàn đang chờ xử lý');
    }
      return t('bookingDetail.refundStatusSucceeded', 'Hồ sơ hoàn được ghi nhận thành công');
  };

  const getStatusBadge = () => {
    if (isNeedsRec) {
      return t('bookingDetail.refundBadgeReconciling', 'Đang tra soát');
    }
    if (isPending) {
      return t('bookingDetail.refundBadgeProcessing', 'Chờ xử lý');
    }
    return t('bookingDetail.refundBadgeSucceeded', 'Đã ghi nhận');
  };

  const getStatusDesc = () => {
    if (isNeedsRec) {
      return t(
        'bookingDetail.refundDescReconciling',
        'Hồ sơ hoàn đang được đối soát; trạng thái này chưa xác nhận giao dịch hoàn thành công.',
      );
    }
    if (isPending) {
      if (refund?.executionPolicy === 'AUTO_FIRST_ATTEMPT') {
        return t(
          'bookingDetail.refundDescAutoProcessing',
          'Simulator đang xử lý yêu cầu hoàn trong bản demo; chưa có kết quả thành công.',
        );
      }
      return t(
        'bookingDetail.refundDescProcessing',
        'Hồ sơ hoàn đang chờ xử lý; trạng thái này chưa xác nhận tiền đã về tài khoản.',
      );
    }
    return t(
      'bookingDetail.refundDescSucceeded',
      'ChargeOps ghi nhận hồ sơ hoàn ở trạng thái thành công; ứng dụng không tự xác minh giao dịch ngân hàng.',
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
          {t('bookingDetail.refundedTotal', 'Số tiền trong hồ sơ hoàn')}
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
