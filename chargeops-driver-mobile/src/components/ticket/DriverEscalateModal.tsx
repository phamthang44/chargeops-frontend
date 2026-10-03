import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Ticket } from '@/types';

export interface DriverEscalateModalProps {
  visible: boolean;
  ticket: Ticket;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting: boolean;
}

type ReasonPreset = 'UNRESPONSIVE_24H' | 'DISPUTED_FINDING' | 'OTHER';

export function DriverEscalateModal({
  visible,
  ticket,
  onClose,
  onSubmit,
  isSubmitting,
}: DriverEscalateModalProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const [preset, setPreset] = useState<ReasonPreset>('UNRESPONSIVE_24H');
  const [details, setDetails] = useState('');

  const PRESETS: { key: ReasonPreset; label: string }[] = [
    {
      key: 'UNRESPONSIVE_24H',
      label: t('ticket.escalation.modal.reasonUnresponsive', 'Trạm sạc không phản hồi quá 24h'),
    },
    {
      key: 'DISPUTED_FINDING',
      label: t('ticket.escalation.modal.reasonDisputedFinding', 'Không đồng thuận với kết luận của trạm'),
    },
    {
      key: 'OTHER',
      label: t('ticket.escalation.modal.reasonOther', 'Lý do khác'),
    },
  ];

  const handleConfirm = async () => {
    const presetLabel = PRESETS.find((p) => p.key === preset)?.label || preset;
    const combinedReason = details.trim()
      ? `${presetLabel}: ${details.trim()}`
      : presetLabel;

    if (combinedReason.length < 10 || isSubmitting) return;

    await onSubmit(combinedReason);
    setDetails('');
  };

  const isDetailsValid = details.trim().length >= 10;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? '#3B0764' : '#EDE9FE' }]}>
                <Ionicons name="shield-half" size={18} color="#8B5CF6" />
              </View>
              <View>
                <Text style={[styles.title, { color: themeColors.textStrong }]}>
                  {t('ticket.escalation.modal.title', 'Yêu cầu Admin Phân xử Tranh chấp')}
                </Text>
                <Text style={[styles.ticketCode, { color: themeColors.textMuted }]}>
                  {ticket.ticketCode} · {ticket.subject}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={themeColors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Arbiter Role Guidance */}
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: isDark ? '#2E1065' : '#F5F3FF',
                  borderColor: isDark ? '#6B21A8' : '#DDD6FE',
                },
              ]}
            >
              <Ionicons name="information-circle-outline" size={17} color="#8B5CF6" />
              <Text style={[styles.noticeText, { color: isDark ? '#DDD6FE' : '#5B21B6' }]}>
                {t(
                  'ticket.escalation.modal.roleNotice',
                  'Admin sẽ vào vai trò Trọng tài độc lập, kiểm tra telemetry log và đưa ra quyết định xử lý khách quan.',
                )}
              </Text>
            </View>

            {/* Reason Presets */}
            <Text style={[styles.sectionLabel, { color: themeColors.textStrong }]}>
              {t('ticket.escalation.modal.reasonLabel', 'Lý do khiếu nại lên Admin')}
            </Text>

            <View style={styles.presetsList}>
              {PRESETS.map((p) => {
                const active = preset === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPreset(p.key)}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: active
                          ? isDark
                            ? '#2E1065'
                            : '#F5F3FF'
                          : themeColors.surfaceAlt,
                        borderColor: active ? '#8B5CF6' : themeColors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={active ? '#8B5CF6' : themeColors.textMuted}
                    />
                    <Text
                      style={[
                        styles.presetText,
                        {
                          color: active ? (isDark ? '#E9D5FF' : '#6B21A8') : themeColors.textBody,
                          fontWeight: active ? fontWeights.semibold : fontWeights.regular,
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Details Input */}
            <Text style={[styles.sectionLabel, { color: themeColors.textStrong, marginTop: spacing.md }]}>
              {t('ticket.escalation.modal.detailsLabel', 'Mô tả chi tiết khiếu nại (tối thiểu 10 ký tự)')}
            </Text>

            <TextInput
              style={[
                styles.detailsInput,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  color: themeColors.textStrong,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder={t(
                'ticket.escalation.modal.detailsPlaceholder',
                'Nêu rõ nguyên nhân bạn yêu cầu Admin xem xét hỗ trợ...',
              )}
              placeholderTextColor={themeColors.textMuted}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />

            <Text style={[styles.charCount, { color: themeColors.textMuted }]}>
              {details.length}/1000
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={[styles.btn, styles.cancelBtn, { borderColor: themeColors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: themeColors.textBody }]}>
                {t('ticket.escalation.modal.cancelBtn', 'Hủy')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={!isDetailsValid || isSubmitting}
              style={[
                styles.btn,
                styles.submitBtn,
                {
                  backgroundColor: isDetailsValid ? '#7C3AED' : themeColors.surfaceAlt,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.submitBtnText,
                    { color: isDetailsValid ? '#FFFFFF' : themeColors.textMuted },
                  ]}
                >
                  {t('ticket.escalation.modal.submitBtn', 'Gửi yêu cầu xem xét')}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: fontWeights.bold,
  },
  ticketCode: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: spacing.lg,
    gap: 8,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    marginBottom: 4,
  },
  presetsList: {
    gap: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    flex: 1,
  },
  detailsInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
  },
  submitBtn: {
    backgroundColor: '#7C3AED',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: fontWeights.bold,
  },
});
