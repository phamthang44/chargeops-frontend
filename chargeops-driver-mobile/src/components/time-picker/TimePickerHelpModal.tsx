import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface TimePickerHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TimePickerHelpModal({ visible, onClose }: TimePickerHelpModalProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHead}>
            <View style={[styles.modalIconBox, { backgroundColor: `${themeColors.primary}18` }]}>
              <Ionicons name="information-circle" size={24} color={themeColors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: themeColors.textStrong }]}>
              {t('timeRangePicker.helpModalTitle')}
            </Text>
          </View>

          <Text style={[styles.modalDesc, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.helpModalDesc')}
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Ionicons name="calendar-outline" size={17} color={themeColors.primary} />
              <Text style={[styles.stepItemText, { color: themeColors.textStrong }]}>
                {t('timeRangePicker.guideStep1')}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons name="timer-outline" size={17} color={themeColors.primary} />
              <Text style={[styles.stepItemText, { color: themeColors.textStrong }]}>
                {t('timeRangePicker.guideStep2')}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons name="flash-outline" size={17} color={themeColors.primary} />
              <Text style={[styles.stepItemText, { color: themeColors.textStrong }]}>
                {t('timeRangePicker.guideStep3')}
              </Text>
            </View>
          </View>

          <AppButton
            label={t('timeRangePicker.understood')}
            onPress={onClose}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  modalIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: fontWeights.bold,
  },
  modalDesc: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  stepsList: {
    gap: spacing.sm + 2,
    paddingVertical: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepItemText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
