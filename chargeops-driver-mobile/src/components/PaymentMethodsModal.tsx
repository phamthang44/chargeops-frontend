import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Checkbox } from '@/components/Checkbox';
import {
  usePreferences,
  type SavedPaymentMethod,
} from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { PaymentMethod } from '@/types';
import { PAYMENT_FEATURE_FLAGS, PAYMENT_META } from '@/utils/payments';

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

const COMMON_BANKS = [
  'MBBank',
  'Vietcombank',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'ACB',
  'VPBank',
  'TPBank',
];

export function PaymentMethodsModal({ visible, onClose }: PaymentMethodsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    themeColors,
    isDark,
    savedPaymentMethods,
    setDefaultPaymentMethod,
    addSavedPaymentMethod,
    removeSavedPaymentMethod,
  } = usePreferences();

  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<PaymentMethod>('BANK_TRANSFER');
  const [bankName, setBankName] = useState('MBBank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);

  const resetForm = () => {
    setIsAdding(false);
    setNewType('BANK_TRANSFER');
    setBankName('MBBank');
    setAccountNumber('');
    setAccountHolder('');
    setSetAsDefault(true);
  };

  const handleSaveMethod = () => {
    if (newType === 'BANK_TRANSFER') {
      if (!accountNumber.trim()) {
        Alert.alert(t('common.error', 'Lỗi'), t('profile.paymentMethodsModal.enterAccountNumber', 'Vui lòng nhập số tài khoản ngân hàng'));
        return;
      }
      addSavedPaymentMethod({
        type: 'BANK_TRANSFER',
        title: `${bankName} (VietQR SePay)`,
        subtitle: `${accountHolder ? accountHolder.toUpperCase() + ' · ' : ''}STK: ${accountNumber.trim()}`,
        bankName,
        accountNumber: accountNumber.trim(),
        isDefault: setAsDefault,
      });
    } else {
      if (!accountNumber.trim()) {
        Alert.alert(t('common.error', 'Lỗi'), t('profile.paymentMethodsModal.enterCardNumber', 'Vui lòng nhập số thẻ'));
        return;
      }
      const masked = accountNumber.length >= 4 ? `•••• •••• •••• ${accountNumber.slice(-4)}` : accountNumber;
      addSavedPaymentMethod({
        type: 'VISA',
        title: `Thẻ quốc tế Visa/Mastercard`,
        subtitle: `${accountHolder ? accountHolder.toUpperCase() + ' · ' : ''}${masked}`,
        accountNumber: masked,
        isDefault: setAsDefault,
      });
    }

    resetForm();
    Alert.alert(
      t('common.success', 'Thành công'),
      t('profile.paymentMethodsModal.addSuccess', 'Đã thêm phương thức thanh toán mới'),
    );
  };

  const handleDelete = (method: SavedPaymentMethod) => {
    if (savedPaymentMethods.length <= 1) {
      Alert.alert(
        t('common.notice', 'Thông báo'),
        t('profile.paymentMethodsModal.cannotDeleteLast', 'Bạn cần giữ lại ít nhất một phương thức thanh toán.'),
      );
      return;
    }

    Alert.alert(
      t('profile.paymentMethodsModal.deleteConfirmTitle', 'Xóa phương thức'),
      t(
        'profile.paymentMethodsModal.deleteConfirmBody',
        'Bạn có chắc muốn xóa "{{title}}"?',
        { title: method.title },
      ),
      [
        { text: t('common.cancel', 'Hủy'), style: 'cancel' },
        {
          text: t('common.delete', 'Xóa'),
          style: 'destructive',
          onPress: () => removeSavedPaymentMethod(method.id),
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={28}
          tint={isDark ? 'dark' : 'regular'}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: Math.max(insets.bottom + spacing.md, spacing.lg),
            },
          ]}
        >
          {/* Top Handle */}
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('profile.paymentMethodsModal.title', 'Phương thức thanh toán')}
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                {t('profile.paymentMethodsModal.subtitle', 'Quản lý tài khoản & phương thức ưu tiên khi đặt sạc')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: themeColors.surfaceAlt }]}
            >
              <Ionicons name="close" size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Direct Settlement / Non-Custodial Notice */}
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              <Text style={[styles.noticeText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                {t(
                  'profile.paymentMethodsModal.notice',
                  'ChargeOps thanh toán trực tiếp theo từng lượt sạc qua cổng giao dịch (VietQR SePay / Sandbox). Hệ thống không lưu giữ tiền số dư của tài xế.',
                )}
              </Text>
            </View>

            {/* List of Saved Methods */}
            <View style={styles.methodsList}>
              {savedPaymentMethods.map((method) => {
                const meta = PAYMENT_META[method.type] || {
                  icon: 'wallet-outline',
                  color: themeColors.primary,
                };
                const isSelected = method.isDefault;
                const isSepay = method.type === 'BANK_TRANSFER';
                const isMethodDisabled = isSepay && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT;

                const handleMethodPress = () => {
                  if (isMethodDisabled) {
                    Alert.alert(
                      t('common.notice', 'Thông báo'),
                      t(
                        'profile.paymentMethodsModal.sepayDisabledNotice',
                        'Cổng chuyển khoản VietQR SePay đang được bảo trì tích hợp và sẽ cập nhật ở phiên bản tiếp theo. Vui lòng sử dụng Demo Sandbox để tiếp tục thử nghiệm.',
                      ),
                    );
                    return;
                  }
                  setDefaultPaymentMethod(method.id);
                };

                return (
                  <TouchableOpacity
                    key={method.id}
                    activeOpacity={isMethodDisabled ? 0.7 : 0.85}
                    onPress={handleMethodPress}
                    style={[
                      styles.methodCard,
                      {
                        backgroundColor:
                          isSelected && !isMethodDisabled
                            ? themeColors.primarySoft
                            : themeColors.surfaceAlt,
                        borderColor:
                          isSelected && !isMethodDisabled
                            ? themeColors.primary
                            : themeColors.border,
                        opacity: isMethodDisabled ? 0.6 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.methodIconBox, { backgroundColor: `${meta.color}18` }]}>
                      <Ionicons name={meta.icon} size={22} color={meta.color} />
                    </View>

                    <View style={styles.methodInfo}>
                      <View style={styles.methodTitleRow}>
                        <Text
                          style={[
                            styles.methodTitle,
                            {
                              color: isMethodDisabled
                                ? themeColors.textMuted
                                : themeColors.textStrong,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {method.title}
                        </Text>
                        {isSelected && !isMethodDisabled && (
                          <View style={[styles.defaultBadge, { backgroundColor: themeColors.primary }]}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                            <Text style={styles.defaultBadgeText}>
                              {t('profile.paymentMethodsModal.defaultBadge', 'Mặc định')}
                            </Text>
                          </View>
                        )}
                        {isMethodDisabled && (
                          <View
                            style={[
                              styles.disabledBadge,
                              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
                            ]}
                          >
                            <Text style={[styles.disabledBadgeText, { color: themeColors.textMuted }]}>
                              {t('payment.updateLater', 'Sẽ cập nhật sau')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.methodSub, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {method.subtitle}
                      </Text>
                    </View>

                    <View style={styles.methodActions}>
                      {/* Radio Indicator or Coming Soon icon */}
                      {!isMethodDisabled ? (
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isSelected ? themeColors.primary : themeColors.border,
                            },
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={[
                                styles.radioDot,
                                { backgroundColor: themeColors.primary },
                              ]}
                            />
                          )}
                        </View>
                      ) : (
                        <Ionicons name="time-outline" size={18} color={themeColors.textMuted} />
                      )}

                      {/* Delete Button (only if CRUD enabled, > 1 method and not Simulator) */}
                      {PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD &&
                        savedPaymentMethods.length > 1 &&
                        method.type !== 'SIMULATOR' && (
                          <TouchableOpacity
                            hitSlop={8}
                            onPress={() => handleDelete(method)}
                            style={[styles.deleteBtn, { backgroundColor: `${themeColors.error}14` }]}
                          >
                            <Ionicons name="trash-outline" size={15} color={themeColors.error} />
                          </TouchableOpacity>
                        )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add New Method Form Toggle */}
            {!isAdding ? (
              <TouchableOpacity
                activeOpacity={PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD ? 0.7 : 0.85}
                style={[
                  styles.addBtn,
                  PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD
                    ? {
                        borderColor: themeColors.primary,
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                      }
                    : {
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.surfaceAlt,
                        opacity: 0.85,
                      },
                ]}
                onPress={() => {
                  if (!PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD) {
                    Alert.alert(
                      t('common.notice', 'Thông báo'),
                      t(
                        'profile.paymentMethodsModal.crudDisabledNotice',
                        'Tính năng thêm/sửa/xóa phương thức thanh toán đang được phát triển và sẽ ra mắt ở phiên bản tiếp theo. Hiện tại hệ thống hỗ trợ phương thức mặc định.',
                      ),
                    );
                    return;
                  }
                  setIsAdding(true);
                }}
              >
                <View style={styles.addBtnContent}>
                  <View style={styles.addBtnLeft}>
                    <Ionicons
                      name={
                        PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD
                          ? 'add-circle-outline'
                          : 'time-outline'
                      }
                      size={18}
                      color={
                        PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD
                          ? themeColors.primary
                          : themeColors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.addBtnText,
                        {
                          color: PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD
                            ? themeColors.primary
                            : themeColors.textMuted,
                        },
                      ]}
                    >
                      {t('profile.paymentMethodsModal.addMethod', 'Thêm tài khoản / phương thức thanh toán')}
                    </Text>
                  </View>
                  {!PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD && (
                    <View
                      style={[
                        styles.disabledBadge,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' },
                      ]}
                    >
                      <Text style={[styles.disabledBadgeText, { color: themeColors.textMuted }]}>
                        {t('payment.updateLater', 'Sẽ cập nhật sau')}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.addForm,
                  {
                    backgroundColor: themeColors.surfaceAlt,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text style={[styles.formTitle, { color: themeColors.textStrong }]}>
                  {t('profile.paymentMethodsModal.addNewTitle', 'Thêm phương thức mới')}
                </Text>

                {/* Type Selection */}
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newType === 'BANK_TRANSFER' && {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.primary,
                      },
                    ]}
                    onPress={() => setNewType('BANK_TRANSFER')}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={newType === 'BANK_TRANSFER' ? themeColors.primary : themeColors.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        {
                          color: newType === 'BANK_TRANSFER' ? themeColors.primary : themeColors.textBody,
                          fontWeight: newType === 'BANK_TRANSFER' ? '700' : '500',
                        },
                      ]}
                    >
                      VietQR / SePay
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newType === 'VISA' && {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.primary,
                      },
                    ]}
                    onPress={() => setNewType('VISA')}
                  >
                    <Ionicons
                      name="card-outline"
                      size={16}
                      color={newType === 'VISA' ? themeColors.primary : themeColors.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        {
                          color: newType === 'VISA' ? themeColors.primary : themeColors.textBody,
                          fontWeight: newType === 'VISA' ? '700' : '500',
                        },
                      ]}
                    >
                      Thẻ Visa / Master
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields for BANK_TRANSFER */}
                {newType === 'BANK_TRANSFER' ? (
                  <>
                    <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>
                      {t('profile.paymentMethodsModal.bankLabel', 'Ngân hàng thụ hưởng')}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankPills}>
                      {COMMON_BANKS.map((b) => (
                        <TouchableOpacity
                          key={b}
                          style={[
                            styles.bankPill,
                            {
                              backgroundColor: bankName === b ? themeColors.primary : themeColors.surface,
                              borderColor: bankName === b ? themeColors.primary : themeColors.border,
                            },
                          ]}
                          onPress={() => setBankName(b)}
                        >
                          <Text
                            style={[
                              styles.bankPillText,
                              { color: bankName === b ? '#FFFFFF' : themeColors.textBody },
                            ]}
                          >
                            {b}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>
                      {t('profile.paymentMethodsModal.accountNumberLabel', 'Số tài khoản ngân hàng')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.textStrong,
                        },
                      ]}
                      placeholder={t('profile.paymentMethodsModal.accountNumberPlaceholder', 'Nhập số tài khoản')}
                      placeholderTextColor={themeColors.textMuted}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="numeric"
                    />

                    <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>
                      {t('profile.paymentMethodsModal.accountHolderLabel', 'Tên chủ tài khoản')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.textStrong,
                        },
                      ]}
                      placeholder="VD: NGUYEN VAN A"
                      placeholderTextColor={themeColors.textMuted}
                      value={accountHolder}
                      onChangeText={setAccountHolder}
                      autoCapitalize="characters"
                    />
                  </>
                ) : (
                  <>
                    <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>
                      {t('profile.paymentMethodsModal.cardNumberLabel', 'Số thẻ (16 chữ số)')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.textStrong,
                        },
                      ]}
                      placeholder="4242 4242 4242 4242"
                      placeholderTextColor={themeColors.textMuted}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="numeric"
                      maxLength={19}
                    />

                    <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>
                      {t('profile.paymentMethodsModal.cardHolderLabel', 'Tên in trên thẻ')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themeColors.surface,
                          borderColor: themeColors.border,
                          color: themeColors.textStrong,
                        },
                      ]}
                      placeholder="VD: NGUYEN VAN A"
                      placeholderTextColor={themeColors.textMuted}
                      value={accountHolder}
                      onChangeText={setAccountHolder}
                      autoCapitalize="characters"
                    />
                  </>
                )}

                {/* Default Checkbox */}
                <View style={styles.checkboxRow}>
                  <Checkbox checked={setAsDefault} onChange={setSetAsDefault}>
                    <Text style={[styles.checkboxText, { color: themeColors.textStrong }]}>
                      {t('profile.paymentMethodsModal.setAsDefault', 'Đặt làm phương thức thanh toán mặc định')}
                    </Text>
                  </Checkbox>
                </View>

                {/* Action Buttons */}
                <View style={styles.formActions}>
                  <AppButton
                    label={t('common.save', 'Lưu phương thức')}
                    onPress={handleSaveMethod}
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    label={t('common.cancel', 'Hủy')}
                    variant="secondary"
                    onPress={resetForm}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
    flex: 1,
    fontWeight: fontWeights.medium,
  },
  methodsList: {
    gap: spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  methodIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 3,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  methodTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    flexShrink: 1,
  },
  methodSub: {
    fontSize: fontSizes.caption,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: fontWeights.bold,
  },
  disabledBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  disabledBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.semibold,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  addBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  addBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  addForm: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    borderColor: 'transparent',
  },
  typeText: {
    fontSize: fontSizes.caption,
  },
  fieldLabel: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bankPills: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  bankPill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  bankPillText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSizes.body,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  checkboxText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
