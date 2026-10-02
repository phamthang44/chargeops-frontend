import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights, radius, spacing } from '@/theme';

interface TicketFormInputsProps {
  subject: string;
  onChangeSubject: (text: string) => void;
  description: string;
  onChangeDescription: (text: string) => void;
}

export function TicketFormInputs({
  subject,
  onChangeSubject,
  description,
  onChangeDescription,
}: TicketFormInputsProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.inputLabel, { color: themeColors.textStrong }]}>
        {t('ticket.create.subjectLabel', 'Tóm tắt sự cố *')}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: themeColors.surfaceAlt,
            color: themeColors.textStrong,
            borderColor: themeColors.border,
          },
        ]}
        placeholder={t('ticket.create.subjectPlaceholder', 'Ví dụ: Súng sạc trụ 02 tự ngắt khi mới sạc...')}
        placeholderTextColor={themeColors.textMuted}
        value={subject}
        onChangeText={onChangeSubject}
        maxLength={100}
      />

      <View style={styles.descHeader}>
        <Text style={[styles.inputLabel, { color: themeColors.textStrong }]}>
          {t('ticket.create.descLabel', 'Mô tả chi tiết sự cố *')}
        </Text>
        <Text style={[styles.charCount, { color: themeColors.textMuted }]}>
          {t('ticket.create.charCount', { count: description.length })}
        </Text>
      </View>
      <TextInput
        style={[
          styles.textArea,
          {
            backgroundColor: themeColors.surfaceAlt,
            color: themeColors.textStrong,
            borderColor: themeColors.border,
          },
        ]}
        placeholder={t(
          'ticket.create.descPlaceholder',
          'Mô tả cụ thể thời điểm, mã trụ/súng, thông báo lỗi trên màn hình trụ sạc...',
        )}
        placeholderTextColor={themeColors.textMuted}
        value={description}
        onChangeText={onChangeDescription}
        multiline
        numberOfLines={4}
        maxLength={2000}
        textAlignVertical="top"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: 14.5,
    fontWeight: fontWeights.bold,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15.5,
    lineHeight: 22,
  },
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12.5,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15.5,
    lineHeight: 22,
    minHeight: 120,
  },
});
