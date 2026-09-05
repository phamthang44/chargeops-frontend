import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

interface CallConfirmationModalProps {
  visible: boolean;
  phone?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function CallConfirmationModal({
  visible,
  phone,
  onClose,
  onConfirm,
}: CallConfirmationModalProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.callModalCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          ]}
        >
          <View style={[styles.callModalIconWrap, { backgroundColor: themeColors.primarySoft }]}>
            <Ionicons name="call" size={26} color={themeColors.primary} />
          </View>
          <Text style={[styles.callModalTitle, { color: themeColors.textStrong }]}>
            {t('stationDetail.callConfirmTitle')}
          </Text>
          <Text style={[styles.callModalDesc, { color: themeColors.textBody }]}>
            {t('stationDetail.callConfirmMessage', { phone: phone ?? '' })}
          </Text>
          <View style={styles.callModalActions}>
            <Pressable
              onPress={onClose}
              style={[
                styles.callModalBtnCancel,
                { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
              ]}
            >
              <Text style={[styles.callModalBtnCancelText, { color: themeColors.textBody }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.callModalBtnConfirm, { backgroundColor: themeColors.primary }]}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.callModalBtnConfirmText}>
                {t('stationDetail.callAction')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  callModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  callModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callModalTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  callModalDesc: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    textAlign: 'center',
  },
  callModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.xs,
  },
  callModalBtnCancel: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callModalBtnCancelText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  callModalBtnConfirm: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callModalBtnConfirmText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
});
