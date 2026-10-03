import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import {
  ERROR_FIELD_ORDER,
  withAlpha,
  type TicketFormErrorKey,
  type TicketFormErrors,
} from '@/utils/ticketValidation';

interface TicketValidationSummaryProps {
  errors: TicketFormErrors;
  /** Scrolls to (and focuses) the offending field. */
  onJumpTo: (key: TicketFormErrorKey) => void;
}

/** Upper bound for the collapse animation — the card never grows past this. */
const MAX_HEIGHT = 560;

/**
 * Error summary card pinned above the create-ticket form after a failed submit:
 * counts what is wrong and lets the driver tap straight to each field. Collapses
 * smoothly once every field is valid again, so the form never jumps while typing.
 */
export function TicketValidationSummary({ errors, onJumpTo }: TicketValidationSummaryProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const progress = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  const rows = ERROR_FIELD_ORDER.filter((key) => errors[key]).map((key) => ({
    key,
    message: errors[key] as string,
    label: fieldLabel(t, key),
  }));
  const visible = rows.length > 0;

  // Keeps the last populated list on screen while the card collapses, so the
  // driver never sees a "0 issues" flash mid-animation.
  const lastRows = useRef(rows);
  useEffect(() => {
    if (rows.length > 0) lastRows.current = rows;
  }, [rows]);

  useEffect(() => {
    if (visible) {
      setExpanded(true);
      Animated.timing(progress, { toValue: 1, duration: 240, useNativeDriver: false }).start();
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: false }).start(
      ({ finished }) => {
        if (finished) setExpanded(false);
      },
    );
  }, [visible, progress]);

  const displayRows = visible ? rows : lastRows.current;
  const errorColor = themeColors.error;

  return (
    <Animated.View
      accessibilityRole={visible ? 'alert' : 'none'}
      style={[
        styles.wrap,
        {
          opacity: progress,
          maxHeight: progress.interpolate({ inputRange: [0, 1], outputRange: [0, MAX_HEIGHT] }),
          paddingBottom: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, spacing.sm],
          }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
          ],
        },
      ]}
    >
      {expanded ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: withAlpha(errorColor, isDark ? 0.12 : 0.05),
              borderColor: withAlpha(errorColor, 0.4),
              shadowColor: errorColor,
            },
          ]}
        >
          <View style={styles.headRow}>
            <View style={[styles.badge, { backgroundColor: errorColor }]}>
              <Ionicons name="warning" size={15} color="#FFFFFF" />
            </View>
            <View style={styles.headText}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('ticket.create.errSummaryTitle', {
                  defaultValue: 'Có {{count}} lỗi cần khắc phục',
                  count: displayRows.length,
                })}
              </Text>
              <Text style={[styles.hint, { color: themeColors.textMuted }]}>
                {t('ticket.create.errSummaryHint', {
                  defaultValue: 'Chạm vào lỗi bên dưới để tới trường đó',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.rowsWrap}>
            {displayRows.map((row, index) => (
              <Pressable
                key={row.key}
                onPress={() => onJumpTo(row.key)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: withAlpha(errorColor, 0.2),
                  },
                  pressed && { backgroundColor: withAlpha(errorColor, 0.12) },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${row.label}: ${row.message}`}
              >
                <Ionicons name="arrow-forward-circle" size={18} color={errorColor} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: errorColor }]}>{row.label}</Text>
                  <Text
                    style={[styles.rowMessage, { color: themeColors.textBody }]}
                    numberOfLines={2}
                  >
                    {row.message}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

function fieldLabel(t: any, key: TicketFormErrorKey): string {
  switch (key) {
    case 'session':
      return t('ticket.create.errFieldSession', {
        defaultValue: 'Phiên sạc / trạm liên quan',
      });
    case 'subject':
      return t('ticket.create.errFieldSubject', {
        defaultValue: 'Tóm tắt sự cố',
      });
    case 'description':
      return t('ticket.create.errFieldDescription', {
        defaultValue: 'Mô tả chi tiết',
      });
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.bold,
  },
  hint: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  rowsWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.bold,
  },
  rowMessage: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
});
