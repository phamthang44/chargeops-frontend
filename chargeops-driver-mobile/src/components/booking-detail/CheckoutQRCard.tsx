import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppButton } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';

interface CheckoutQRCardProps {
  booking: Booking;
  onPayNow?: () => void;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CheckoutQRCard({ booking, onPayNow }: CheckoutQRCardProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { themeColors, isDark } = usePreferences();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isSimulator = booking.paymentMethod === 'SIMULATOR';
  const isBankTransfer = booking.paymentMethod === 'BANK_TRANSFER';
  const transferCode = booking.checkout?.checkoutReference ?? booking.code;
  const transferAmount = booking.totalPrice;

  // Real bank info from server only (NEVER hardcode fake accounts)
  const bankName = (booking.checkout as any)?.bankName ?? null;
  const bankAccount =
    (booking.checkout as any)?.bankAccount ??
    (booking.paymentDetail as any)?.vaNumber ??
    null;
  const qrUrl = booking.checkout?.checkoutUrl ?? null;

  const copyToClipboard = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handlePay = () => {
    if (onPayNow) {
      onPayNow();
    } else {
      navigation.navigate('PaymentProcessing', { bookingId: booking.id });
    }
  };

  // Case 1: Sandbox Simulator Payment
  if (isSimulator) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.surface,
            borderColor: `${themeColors.warning}40`,
            shadowColor: isDark ? '#000000' : themeColors.textStrong,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.headerIconWrap, { backgroundColor: `${themeColors.warning}18` }]}>
            <Ionicons name="flash-outline" size={18} color={themeColors.warning} />
          </View>
          <View style={styles.headerTitleWrap}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('payment.simulatorTitle', 'Thanh toán qua Demo Sandbox')}
              </Text>
              <View style={[styles.sandboxBadge, { backgroundColor: `${themeColors.warning}20` }]}>
                <Text style={[styles.sandboxBadgeText, { color: themeColors.warning }]}>SANDBOX</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              {t('payment.simulatorSubtitle', 'Mô phỏng thanh toán tức thì phục vụ đồ án')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.infoContainer,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoLabelCol}>
              <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                {t('payment.methodLabel', 'Phương thức')}
              </Text>
              <Text style={[styles.infoValue, { color: themeColors.textStrong }]}>
                {t('payment.SIMULATOR', 'Thanh toán giả lập (Demo Sandbox)')}
              </Text>
            </View>
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelCol}>
              <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                {t('bookingDetail.bookingCodeLabel', 'Mã đơn')}
              </Text>
              <Text style={[styles.infoValueHigh, { color: themeColors.primaryDark }]}>{booking.code}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              onPress={() => copyToClipboard(booking.code, 'code')}
            >
              <Ionicons
                name={copiedField === 'code' ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copiedField === 'code' ? themeColors.success : themeColors.primary}
              />
              <Text
                style={[
                  styles.copyBtnText,
                  { color: copiedField === 'code' ? themeColors.success : themeColors.primary },
                ]}
              >
                {copiedField === 'code' ? t('common.copied', 'Đã chép') : t('common.copy', 'Sao chép')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelCol}>
              <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                {t('bookingDetail.totalAmount', 'Số tiền thanh toán')}
              </Text>
              <Text style={[styles.infoValueHigh, { color: themeColors.warning }]}>
                {formatVnd(transferAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.noticeBox, { backgroundColor: `${themeColors.warning}14` }]}>
          <Ionicons name="information-circle-outline" size={16} color={themeColors.warning} />
          <Text style={[styles.noticeText, { color: themeColors.textStrong }]}>
            {t(
              'payment.simulatorNote',
              'Đây là môi trường thử nghiệm. Bạn không cần chuyển khoản hay quét mã ngân hàng thật. Nhấn nút bên dưới để hoàn tất giao dịch mô phỏng.',
            )}
          </Text>
        </View>

        <AppButton
          label={t('payment.simulatorCta', 'Xác nhận thanh toán mô phỏng')}
          onPress={handlePay}
        />
      </View>
    );
  }

  // Case 2: Bank Transfer (with or without real QR / Account Number)
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: `${themeColors.warning}40`,
          shadowColor: isDark ? '#000000' : themeColors.textStrong,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: `${themeColors.warning}18` }]}>
          <Ionicons name="qr-code-outline" size={18} color={themeColors.warning} />
        </View>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, { color: themeColors.textStrong }]}>
            {t('bookingDetail.transferInfoTitle', 'Thanh toán chuyển khoản')}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            {qrUrl
              ? t('bookingDetail.transferInfoSubtitle', 'Quét mã VietQR hoặc chuyển khoản theo thông tin dưới')
              : t('bookingDetail.transferPendingSubtitle', 'Thông tin chuyển khoản cho đơn đặt chỗ')}
          </Text>
        </View>
      </View>

      {/* QR Display - ONLY if real qrUrl is provided */}
      {qrUrl ? (
        <View style={styles.qrSection}>
          <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF', borderColor: themeColors.border }]}>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
          </View>
        </View>
      ) : null}

      {/* Transfer Information Fields */}
      <View
        style={[
          styles.infoContainer,
          { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
        ]}
      >
        {/* Bank Name: Render only if provided */}
        {bankName ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.bankName', 'Ngân hàng')}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.textStrong }]}>{bankName}</Text>
              </View>
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />
          </>
        ) : null}

        {/* Account Number: Render only if real account exists, otherwise DISABLED */}
        {bankAccount ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>
                  {t('bookingDetail.accountNumber', 'Số tài khoản')}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.textStrong }]}>{bankAccount}</Text>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => copyToClipboard(bankAccount, 'account')}
              >
                <Ionicons
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
            <Ionicons
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
            <Ionicons
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
                'Hệ thống đang tích hợp cổng thanh toán trực tuyến. Nhấn "Thanh toán ngay" để tiếp tục.',
              )}
        </Text>
      </View>

      <AppButton
        label={t('bookingDetail.payNow', 'Thanh toán ngay')}
        onPress={handlePay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    fontSize: fontSizes.caption - 1,
    marginTop: 2,
  },
  sandboxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sandboxBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  qrWrapper: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabelCol: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: fontSizes.caption - 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: fontWeights.semibold,
  },
  infoValue: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  infoValueHigh: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  copyBtnText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  fieldDivider: {
    height: 1,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.caption - 1,
    lineHeight: 18,
  },
});
