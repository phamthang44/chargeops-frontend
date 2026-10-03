import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, spacing } from '@/theme';

interface TicketSubmitFooterProps {
  submitting: boolean;
  /** Number of fields still failing validation (0 hides the hint). */
  errorCount?: number;
  onSubmit: () => void;
}

export function TicketSubmitFooter({ submitting, errorCount = 0, onSubmit }: TicketSubmitFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const hint = useRef(new Animated.Value(0)).current;
  const hasErrors = errorCount > 0;

  // Keeps the last non-zero count on screen while the hint collapses, so the
  // driver never sees a "0 fields" flash mid-animation.
  const lastCount = useRef(errorCount);
  if (errorCount > 0) lastCount.current = errorCount;
  const [contentVisible, setContentVisible] = useState(hasErrors);

  useEffect(() => {
    if (hasErrors) {
      setContentVisible(true);
      Animated.timing(hint, { toValue: 1, duration: 220, useNativeDriver: false }).start();
      return;
    }
    Animated.timing(hint, { toValue: 0, duration: 220, useNativeDriver: false }).start(
      ({ finished }) => {
        if (finished) setContentVisible(false);
      },
    );
  }, [hasErrors, hint]);

  return (
    <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
      <Animated.View
        accessibilityRole={contentVisible ? 'alert' : 'none'}
        style={[
          styles.hintRow,
          {
            opacity: hint,
            transform: [
              { translateY: hint.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
            ],
            height: hint.interpolate({
              inputRange: [0, 1],
              outputRange: [0, lineHeights.body + spacing.sm],
            }),
          },
        ]}
      >
        {contentVisible ? (
          <>
            <Ionicons name="alert-circle" size={14} color={themeColors.error} />
            <Text style={[styles.hintText, { color: themeColors.error }]}>
              {t('ticket.create.errFooterCount', {
                defaultValue: 'Còn {{count}} trường bắt buộc chưa hợp lệ',
                count: lastCount.current,
              })}
            </Text>
          </>
        ) : null}
      </Animated.View>

      <AppButton
        label={
          submitting
            ? t('ticket.create.submitting', 'Đang gửi phiếu...')
            : t('ticket.create.submitBtn', 'Gửi phiếu hỗ trợ sự cố')
        }
        disabled={submitting}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  hintText: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.semibold,
  },
});
