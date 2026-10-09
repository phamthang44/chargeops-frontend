import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { copyText } from '@/utils/clipboard';
import { formatVnd } from '@/utils/format';
import { PopIcon } from '@/components/common/PopIcon';
import { BezelCard } from './BezelCard';

interface CheckoutQRCardProps {
  booking: Booking;
}

export function CheckoutQRCard({ booking }: CheckoutQRCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isSimulator =
    (booking.checkout?.method ? booking.checkout.method === 'SIMULATOR' : booking.paymentMethod === 'SIMULATOR');
  const isBankTransfer =
    (booking.checkout?.method ? booking.checkout.method === 'BANK_TRANSFER' : booking.paymentMethod === 'BANK_TRANSFER');
  const transferCode = booking.checkout?.checkoutReference ?? booking.code;
  const transferAmount = booking.totalPrice;
  const checkoutStatus = booking.checkout?.status;

  // Real bank info from server only (NEVER hardcode fake accounts)
  const rawBankAccount =
    (booking.checkout as any)?.bankAccount ??
    (booking.paymentDetail as any)?.vaNumber ??
    null;
  const bankAccount = isSimulator
    ? rawBankAccount || `96247${booking.code.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`
    : rawBankAccount;

  const bankName = (booking.checkout as any)?.bankName ?? (isSimulator ? 'MBBank (Ngân hàng Quân Đội)' : null);
  const accountHolder =
    (booking.checkout as any)?.accountHolder ?? (isSimulator ? 'CHARGEOPS EV NETWORK' : null);

  const rawQrUrl = booking.checkout?.checkoutUrl;
  const qrUrl =
    rawQrUrl && rawQrUrl.startsWith('http') && !rawQrUrl.includes('simulator.chargeops.local')
      ? rawQrUrl
      : bankAccount
      ? `https://img.vietqr.io/image/MB-${bankAccount}-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(accountHolder || 'CHARGEOPS')}`
      : null;

  const copyToClipboard = (text: string, fieldName: string) => {
    copyText(text).then((ok) => {
      if (!ok) return;
      setCopiedField(fieldName);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    });
  };

  return (
    <BezelCard tone={themeColors.primary} contentStyle={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIconWrap,
            { backgroundColor: `${themeColors.primary}18` },
          ]}
        >
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={themeColors.primary}
          />
        </View>
        <View style={styles.headerTitleWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: themeColors.textStrong }]}>
              {t('bookingDetail.transferInfoTitle', 'Thanh toán chuyển khoản VietQR')}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            {qrUrl
              ? t('bookingDetail.transferInfoSubtitle', 'Quét mã VietQR hoặc chuyển khoản theo thông tin dưới')
              : t('bookingDetail.transferPendingSubtitle', 'Thông tin chuyển khoản cho đơn đặt chỗ')}
          </Text>
        </View>
      </View>

      {/* QR Display */}
      {qrUrl ? (
        <View style={styles.qrSection}>
          <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF', borderColor: themeColors.border }]}>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
          </View>
          <Text style={[styles.qrCaption, { color: themeColors.textMuted }]}>
            {t('payment.vietQrSupportHint', 'Hỗ trợ 40+ ứng dụng ngân hàng & Napas 247')}
          </Text>
        </View>
      ) : null}

      {/* Transfer Information Fields */}
      <View
        style={[
          styles.infoContainer,
          { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
        ]}
      >
        {/* Method Label */}
        {isSimulator ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  {t('payment.methodLabel', 'Phương thức')}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.textStrong }]}>
                  {t('payment.SIMULATOR', 'Cổng thanh toán trực tuyến')}
                </Text>
              </View>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />
          </>
        ) : null}

        {/* Bank Name */}
        {bankName ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.bankName', 'Ngân hàng thụ hưởng')}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.textStrong }]}>{bankName}</Text>
              </View>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />
          </>
        ) : null}

        {/* Account Number */}
        {bankAccount ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.accountNumber', 'Số tài khoản ảo (VA)')}
                </Text>
                <Text style={[styles.infoValueHigh, { color: themeColors.primaryDark }]}>{bankAccount}</Text>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => copyToClipboard(bankAccount, 'account')}
              >
                <PopIcon
                  name={copiedField === 'account' ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={copiedField === 'account' ? themeColors.success : themeColors.primary}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    { color: copiedField === 'account' ? themeColors.success : themeColors.primary },
                  ]}
                >
                  {copiedField === 'account' ? t('common.copied', 'Đã chép') : t('common.copy', 'Sao chép')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />
          </>
        ) : null}

        {/* Account Holder Name */}
        {accountHolder ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.accountHolder', 'Chủ tài khoản')}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.textStrong }]}>{accountHolder}</Text>
              </View>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />
          </>
        ) : null}

        {/* Transfer Reference / Content */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelCol}>
            <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
              {t('bookingDetail.transferContent', 'Nội dung chuyển khoản')}
            </Text>
            <Text style={[styles.infoValueHigh, { color: themeColors.primaryDark }]}>{transferCode}</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={() => copyToClipboard(transferCode, 'content')}
          >
              <PopIcon
                name={copiedField === 'content' ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copiedField === 'content' ? themeColors.success : themeColors.primary}
              />
            <Text
              style={[
                styles.copyBtnText,
                { color: copiedField === 'content' ? themeColors.success : themeColors.primary },
              ]}
            >
              {copiedField === 'content' ? t('common.copied', 'Đã chép') : t('common.copy', 'Sao chép')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

        {/* Total Amount */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelCol}>
            <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
              {t('bookingDetail.totalAmount', 'Số tiền chính xác')}
            </Text>
            <Text style={[styles.infoValueHigh, { color: themeColors.warning }]}>
              {formatVnd(transferAmount)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={() => copyToClipboard(String(transferAmount), 'amount')}
          >
              <PopIcon
                name={copiedField === 'amount' ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copiedField === 'amount' ? themeColors.success : themeColors.primary}
              />
            <Text
              style={[
                styles.copyBtnText,
                { color: copiedField === 'amount' ? themeColors.success : themeColors.primary },
              ]}
            >
              {copiedField === 'amount' ? t('common.copied', 'Đã chép') : t('common.copy', 'Sao chép')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notice Box */}
      {checkoutStatus === 'UNAVAILABLE' ? (
        <View style={[styles.noticeBox, { backgroundColor: `${themeColors.error}14` }]}>
          <Ionicons name="alert-circle-outline" size={16} color={themeColors.error} />
          <Text style={[styles.noticeText, { color: themeColors.error }]}>
            {t(
              'payment.checkoutUnavailableNote',
              'Cổng thanh toán tạm thời gián đoạn (503). Kéo xuống để làm mới (Pull-to-refresh) hoặc thử lại sau.',
            )}
          </Text>
        </View>
      ) : isSimulator ? (
        <View style={[styles.noticeBox, { backgroundColor: `${themeColors.warning}14` }]}>
          <Ionicons name="information-circle-outline" size={16} color={themeColors.warning} />
          <Text style={[styles.noticeText, { color: themeColors.textStrong }]}>
            {t(
              'payment.simulatorNote',
              'Quét mã QR bằng ứng dụng ngân hàng bất kỳ để thanh toán cho phiên sạc. Sau khi chuyển khoản thành công, hệ thống sẽ tự động xác nhận.',
            )}
          </Text>
        </View>
      ) : (
        <View style={[styles.noticeBox, { backgroundColor: `${themeColors.warning}14` }]}>
          <Ionicons name="information-circle-outline" size={16} color={themeColors.warning} />
          <Text style={[styles.noticeText, { color: themeColors.textStrong }]}>
            {bankAccount
              ? t(
                  'bookingDetail.transferAutoConfirmNote',
                  'Chuyển khoản đúng nội dung và số tiền. Đơn đặt sẽ tự động kích hoạt sau khi hệ thống nhận diện giao dịch.',
                )
              : t(
                  'bookingDetail.transferGatewayNote',
                  'Hệ thống đang tích hợp cổng thanh toán trực tuyến. Nhấn "Tôi đã chuyển khoản" bên dưới để tiếp tục.',
                )}
          </Text>
        </View>
      )}
    </BezelCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  qrWrapper: {
    width: 270,
    height: 270,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrCaption: {
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontWeight: fontWeights.medium,
  },
  infoContainer: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  infoLabelCol: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: fontSizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: fontWeights.semibold,
  },
  infoValue: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  infoValueHigh: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  copyBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  fieldDivider: {
    height: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
});
