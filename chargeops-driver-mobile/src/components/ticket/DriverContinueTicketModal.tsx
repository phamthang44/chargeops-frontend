import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

interface DriverContinueTicketModalProps {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function DriverContinueTicketModal({
  visible,
  submitting,
  onClose,
  onSubmit,
}: DriverContinueTicketModalProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  const explanation = reason.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <View style={styles.heading}>
            <Ionicons name="alert-circle-outline" size={24} color={themeColors.primary} />
            <Text style={[styles.title, { color: themeColors.textStrong }]}>
              {t('ticket.continue.title', 'Vấn đề vẫn còn')}
            </Text>
          </View>
          <Text style={[styles.description, { color: themeColors.textMuted }]}>
            {t('ticket.continue.description', 'Mô tả điều chưa được xử lý. Phiếu sẽ trở lại trạng thái Đang xử lý để các bên tiếp tục theo dõi.')}
          </Text>
          <TextInput
            accessibilityLabel={t('ticket.continue.reasonLabel', 'Mô tả vấn đề vẫn còn')}
            multiline
            maxLength={2000}
            placeholder={t('ticket.continue.placeholder', 'Ví dụ: Tôi đã thử sạc lại nhưng trụ vẫn ngắt kết nối...')}
            placeholderTextColor={themeColors.textMuted}
            value={reason}
            onChangeText={setReason}
            editable={!submitting}
            style={[styles.input, {
              color: themeColors.textStrong,
              borderColor: themeColors.border,
              backgroundColor: themeColors.surfaceAlt,
            }]}
          />
          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={submitting} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: themeColors.textMuted }]}>
                {t('common.cancel', 'Hủy')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!explanation || submitting}
              onPress={() => onSubmit(explanation)}
              style={[styles.submitButton, {
                backgroundColor: themeColors.primary,
                opacity: !explanation || submitting ? 0.5 : 1,
              }]}
            >
              {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                <Text style={styles.submitText}>
                  {t('ticket.continue.submit', 'Báo vấn đề vẫn còn')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.55)' },
  card: { borderRadius: 18, padding: 20, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  description: { fontSize: 13, lineHeight: 20 },
  input: { minHeight: 110, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 12 },
  cancelText: { fontSize: 14, fontWeight: '600' },
  submitButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
