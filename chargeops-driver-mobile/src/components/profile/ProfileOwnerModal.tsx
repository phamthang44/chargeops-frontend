import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface ProfileOwnerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileOwnerModal({ visible, onClose }: ProfileOwnerModalProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.modalIconBox, { backgroundColor: themeColors.primarySoft }]}>
            <Ionicons name="flash-outline" size={28} color={themeColors.primary} />
          </View>
          <Text style={[styles.modalTitle, { color: themeColors.textStrong }]}>
            {t('profile.ownerModal.title')}
          </Text>
          <Text style={[styles.modalBody, { color: themeColors.textBody }]}>
            {t('profile.ownerModal.desc')}
          </Text>

          <AppButton
            label={t('profile.ownerModal.understood')}
            onPress={onClose}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 10,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
