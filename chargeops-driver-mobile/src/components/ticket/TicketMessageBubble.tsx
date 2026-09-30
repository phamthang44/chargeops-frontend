import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
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
    color: '#10B981',
    bgLight: '#D1FAE5',
    bgDark: '#113322',
  },
  STAFF: {
    icon: 'construct-outline',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    bgDark: '#172554',
  },
  OWNER: {
    icon: 'business-outline',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    bgDark: '#3B1D0B',
  },
  ADMIN: {
    icon: 'shield-checkmark',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    bgDark: '#2E1065',
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
              backgroundColor: isDark ? '#1F3F2E' : themeColors.primarySoft,
              borderColor: isDark ? '#2E6649' : '#A7F3D0',
            },
          ]}
        >
          <Text style={[styles.messageBody, { color: themeColors.textStrong }]}>{message.body}</Text>
          <Text style={[styles.timestamp, styles.selfTimestamp, { color: themeColors.textMuted }]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleContainer, styles.incomingContainer]}>
      {/* Sender Role Badge */}
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
        <Text style={[styles.senderName, { color: themeColors.textMuted }]} numberOfLines={1}>
          {message.authorDisplayName}
        </Text>
      </View>

      {/* Message Content */}
      <View
        style={[
          styles.bubble,
          styles.incomingBubble,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
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
    marginVertical: spacing.xs,
    maxWidth: '85%',
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
    gap: 6,
    marginBottom: 4,
    paddingLeft: spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  senderName: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.medium,
  },
  bubble: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  selfBubble: {
    borderBottomRightRadius: 2,
  },
  incomingBubble: {
    borderBottomLeftRadius: 2,
  },
  messageBody: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  selfTimestamp: {
    marginTop: 2,
  },
});
