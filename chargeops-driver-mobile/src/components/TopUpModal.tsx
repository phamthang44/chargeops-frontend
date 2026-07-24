import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface TopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amountVnd: number) => void;
}

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000];

const PAYMENT_METHODS = [
  { id: 'MOMO', label: 'Ví MoMo', icon: 'wallet-outline' as const },
  { id: 'VISA', label: 'Visa / Mastercard', icon: 'card-outline' as const },
  { id: 'ZALOPAY', label: 'Ví ZaloPay', icon: 'qr-code-outline' as const },
];

/** Bottom-sheet wallet top-up modal with notification-style blur backdrop and dynamic theme support. */
export function TopUpModal({ visible, onClose, onSuccess }: TopUpModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();

  const [selectedAmount, setSelectedAmount] = useState(200000);
  const [selectedMethod, setSelectedMethod] = useState('MOMO');

  function handleConfirm() {
    const formatted = `${selectedAmount.toLocaleString('vi-VN')}đ`;
    onSuccess(selectedAmount);
    onClose();
    Alert.alert(t('profile.topUpModal.title'), t('profile.topUpModal.success', { amount: formatted }));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Notification-style blur backdrop */}
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.textStrong }]}>
              {t('profile.topUpModal.title')}
            </Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: themeColors.surfaceAlt }]}
              hitSlop={8}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={themeColors.textBody} />
            </Pressable>
          </View>

          {/* Amount Selection */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
            {t('profile.topUpModal.amountLabel')}
          </Text>
          <View style={styles.presetGrid}>
            {PRESET_AMOUNTS.map((amt) => {
              const active = selectedAmount === amt;
              return (
                <Pressable
                  key={amt}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: active ? themeColors.primary : themeColors.border,
                      backgroundColor: active ? themeColors.primarySoft : themeColors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setSelectedAmount(amt)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: active ? themeColors.primaryDark : themeColors.textBody },
                    ]}
                  >
                    {amt.toLocaleString('vi-VN')}đ
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Method Selection */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
            {t('profile.topUpModal.methodLabel')}
          </Text>
          <View style={styles.methodList}>
            {PAYMENT_METHODS.map((m) => {
              const active = selectedMethod === m.id;
              return (
                <Pressable
                  key={m.id}
                  style={[
                    styles.methodRow,
                    {
                      borderColor: active ? themeColors.primary : themeColors.border,
                      backgroundColor: active ? themeColors.surface : themeColors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setSelectedMethod(m.id)}
                >
                  <View style={[styles.methodIconBox, { backgroundColor: themeColors.surfaceAlt }]}>
                    <Ionicons
                      name={m.icon}
                      size={20}
                      color={active ? themeColors.primary : themeColors.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.methodLabel,
                      { color: active ? themeColors.textStrong : themeColors.textBody },
                      active && styles.methodLabelActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: active ? themeColors.primary : themeColors.border },
                    ]}
                  >
                    {active ? (
                      <View style={[styles.radioInner, { backgroundColor: themeColors.primary }]} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <AppButton
            label={t('profile.topUpModal.confirm')}
            onPress={handleConfirm}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetChip: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  presetText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },

  methodList: { gap: spacing.xs },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { flex: 1, fontSize: fontSizes.body },
  methodLabelActive: { fontWeight: fontWeights.semibold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: radius.full },
  confirmBtn: { marginTop: spacing.sm },
});
