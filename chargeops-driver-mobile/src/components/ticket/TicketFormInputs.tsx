import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { TicketFieldError } from '@/components/ticket/TicketFieldError';
import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights, radius, spacing } from '@/theme';
import {
  DESCRIPTION_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
  withAlpha,
} from '@/utils/ticketValidation';

interface TicketFormInputsProps {
  subject: string;
  onChangeSubject: (text: string) => void;
  description: string;
  onChangeDescription: (text: string) => void;
  /** Inline validation messages (set after a submit attempt). */
  subjectError?: string;
  descriptionError?: string;
  /** Allows the screen to focus a field when jumping to it from an error. */
  subjectRef?: React.Ref<TextInput>;
  descriptionRef?: React.Ref<TextInput>;
  /** Reports the description block offset inside this card (for scroll-to-error). */
  onDescriptionLayout?: (offsetY: number) => void;
}

export function TicketFormInputs({
  subject,
  onChangeSubject,
  description,
  onChangeDescription,
  subjectError,
  descriptionError,
  subjectRef,
  descriptionRef,
  onDescriptionLayout,
}: TicketFormInputsProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const labelColor = (error?: string) => (error ? themeColors.error : themeColors.textStrong);
  const fieldTheme = (error?: string) => ({
    backgroundColor: error ? withAlpha(themeColors.error, 0.05) : themeColors.surfaceAlt,
    borderColor: error ? themeColors.error : themeColors.border,
    color: themeColors.textStrong,
  });

  return (
    <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.inputLabel, { color: labelColor(subjectError) }]}>
          {t('ticket.create.subjectLabel', 'Tóm tắt sự cố *')}
        </Text>
        <Text
          style={[
            styles.charCount,
            { color: counterColor(themeColors, subject.length, SUBJECT_MAX_LENGTH, subjectError) },
          ]}
        >
          {t('ticket.create.subjectCharCount', {
            defaultValue: '{{count}}/{{max}} ký tự',
            count: subject.length,
            max: SUBJECT_MAX_LENGTH,
          })}
        </Text>
      </View>
      <FieldShell error={subjectError}>
        <TextInput
          ref={subjectRef}
          style={[styles.textInput, fieldTheme(subjectError)]}
          placeholder={t('ticket.create.subjectPlaceholder', 'Ví dụ: Súng sạc trụ 02 tự ngắt khi mới sạc...')}
          placeholderTextColor={themeColors.textMuted}
          value={subject}
          onChangeText={onChangeSubject}
          maxLength={SUBJECT_MAX_LENGTH}
          accessibilityLabel={t('ticket.create.subjectLabel', 'Tóm tắt sự cố')}
        />
      </FieldShell>
      <TicketFieldError message={subjectError} />

      <View
        style={styles.headerRow}
        onLayout={(event) => onDescriptionLayout?.(event.nativeEvent.layout.y)}
      >
        <Text style={[styles.inputLabel, { color: labelColor(descriptionError) }]}>
          {t('ticket.create.descLabel', 'Mô tả chi tiết sự cố *')}
        </Text>
        <Text
          style={[
            styles.charCount,
            {
              color: counterColor(
                themeColors,
                description.length,
                DESCRIPTION_MAX_LENGTH,
                descriptionError,
              ),
            },
          ]}
        >
          {t('ticket.create.charCount', {
            defaultValue: '{{count}}/{{max}} ký tự',
            count: description.length,
            max: DESCRIPTION_MAX_LENGTH,
          })}
        </Text>
      </View>
      <FieldShell error={descriptionError}>
        <TextInput
          ref={descriptionRef}
          style={[styles.textArea, fieldTheme(descriptionError)]}
          placeholder={t(
            'ticket.create.descPlaceholder',
            'Mô tả cụ thể thời điểm, mã trụ/súng, thông báo lỗi trên màn hình trụ sạc...',
          )}
          placeholderTextColor={themeColors.textMuted}
          value={description}
          onChangeText={onChangeDescription}
          multiline
          numberOfLines={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          textAlignVertical="top"
          accessibilityLabel={t('ticket.create.descLabel', 'Mô tả chi tiết sự cố')}
        />
      </FieldShell>
      <TicketFieldError message={descriptionError} />
    </Card>
  );
}

/** Warns at 90% of the budget, turns red as soon as the field is invalid. */
function counterColor(
  themeColors: { textMuted: string; warning: string; error: string },
  length: number,
  max: number,
  error?: string,
): string {
  if (error) return themeColors.error;
  if (length >= max * 0.9) return themeColors.warning;
  return themeColors.textMuted;
}

interface FieldShellProps {
  error?: string;
  children: React.ReactNode;
}

/**
 * Wraps an input with the error affordances: a short shake the moment the
 * field becomes invalid plus a soft error-colored glow that fades in/out.
 */
function FieldShell({ error, children }: FieldShellProps) {
  const { themeColors } = usePreferences();
  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const hadError = useRef(false);

  useEffect(() => {
    const hasError = Boolean(error);
    if (hasError && !hadError.current) {
      Animated.sequence([
        Animated.timing(shake, { toValue: -5, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 5, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -3, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 3, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
    hadError.current = hasError;
    Animated.timing(glow, {
      toValue: hasError ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [error, glow, shake]);

  return (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <Animated.View
        style={[
          styles.shell,
          {
            shadowColor: themeColors.error,
            shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
            shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
            elevation: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  inputLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: fontWeights.bold,
  },
  charCount: {
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
  },
  shell: {
    borderRadius: radius.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15.5,
    lineHeight: 22,
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
