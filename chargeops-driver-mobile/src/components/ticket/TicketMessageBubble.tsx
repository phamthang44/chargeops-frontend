import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { TicketActorKind, TicketMessage } from '@/types';

interface TicketMessageBubbleProps {
  message: TicketMessage;
  isSelf: boolean;
}

const ACTOR_STYLE: Record<
  TicketActorKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgLight: string; bgDark: string }
> = {
  REPORTER: {
    icon: 'person-outline',
    color: '#059669',
    bgLight: '#D1FAE5',
    bgDark: '#0D3827',
  },
  STAFF: {
    icon: 'construct-outline',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    bgDark: '#172554',
  },
  OWNER: {
    icon: 'business-outline',
    color: '#D97706',
    bgLight: '#FEF3C7',
    bgDark: '#451A03',
  },
  ADMIN: {
    icon: 'shield-checkmark',
    color: '#7C3AED',
    bgLight: '#F3E8FF',
    bgDark: '#3B0764',
  },
};

export function TicketMessageBubble({ message, isSelf }: TicketMessageBubbleProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const actor = ACTOR_STYLE[message.authorKind] ?? ACTOR_STYLE.STAFF;
  const roleLabel = t(`ticket.role.${message.authorKind}`, message.authorKind);

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSelf || message.authorKind === 'REPORTER') {
    return (
      <View style={[styles.bubbleContainer, styles.selfContainer]}>
        <View
          style={[
            styles.bubble,
            styles.selfBubble,
            {
              backgroundColor: isDark ? '#0E3827' : '#ECFDF5',
              borderColor: isDark ? '#155E3E' : '#A7F3D0',
            },
          ]}
        >
          <Text style={[styles.messageBody, { color: themeColors.textStrong }]}>{message.body}</Text>
          <Text style={[styles.timestamp, styles.selfTimestamp, { color: isDark ? '#6EE7B7' : '#059669' }]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleContainer, styles.incomingContainer]}>
      {/* Sender Header with Role Badge & Display Name */}
      <View style={styles.senderHeader}>
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: isDark ? actor.bgDark : actor.bgLight,
            },
          ]}
        >
          <Ionicons name={actor.icon} size={13} color={actor.color} />
          <Text style={[styles.roleText, { color: actor.color }]}>{roleLabel}</Text>
        </View>
        <Text style={[styles.senderName, { color: themeColors.textStrong }]} numberOfLines={1}>
          {message.authorDisplayName || t('ticket.detail.senderFallback', 'Chuyên viên hỗ trợ')}
        </Text>
      </View>

      {/* Message Content Bubble */}
      <View
        style={[
          styles.bubble,
          styles.incomingBubble,
          {
            backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
            borderColor: isDark ? '#2E2E38' : '#E5E7EB',
          },
        ]}
      >
        <Text style={[styles.messageBody, { color: themeColors.textStrong }]}>{message.body}</Text>
        <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>{formattedTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    marginVertical: 6,
    maxWidth: '86%',
  },
  selfContainer: {
    alignSelf: 'flex-end',
  },
  incomingContainer: {
    alignSelf: 'flex-start',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    paddingLeft: spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  senderName: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  bubble: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 11,
    gap: 5,
  },
  selfBubble: {
    borderBottomRightRadius: 4,
  },
  incomingBubble: {
    borderBottomLeftRadius: 4,
  },
  messageBody: {
    fontSize: 15.5,
    lineHeight: 22.5,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    fontWeight: fontWeights.medium,
  },
  selfTimestamp: {
    marginTop: 2,
  },
});
