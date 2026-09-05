import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Connector } from '@/types';
import { formatEquipmentName, formatRate } from '@/utils/format';

import { EvPlugIcon } from './StationDetailSvgs';

interface ConnectorPortCardProps {
  connector: Connector;
  isSelected: boolean;
  onSelect: () => void;
}

export function ConnectorPortCard({
  connector,
  isSelected,
  onSelect,
}: ConnectorPortCardProps) {
  const { t, i18n } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const isAvail = connector.runtimeStatus === 'AVAILABLE';
  const isDc = (connector.powerKw ?? 0) >= 60;
  const typeColor = isDc ? '#0284C7' : '#059669';
  const typeBg = isDc
    ? (isDark ? 'rgba(2, 132, 199, 0.22)' : '#E0F2FE')
    : (isDark ? 'rgba(5, 150, 105, 0.22)' : '#ECFDF5');

  return (
    <Pressable
      disabled={!isAvail}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.portCard,
        {
          backgroundColor: isSelected
            ? (isDark ? 'rgba(5, 150, 105, 0.18)' : '#F0FDF4')
            : (isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF'),
          borderColor: isSelected
            ? '#059669'
            : (isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0'),
          borderWidth: isSelected ? 2 : 1.5,
        },
        !isAvail && styles.portCardDisabled,
        pressed && isAvail && { opacity: 0.9, transform: [{ scale: 0.985 }] },
      ]}
    >
      {/* Card Header: Type Badge (with EV Plug Icon) & Status Indicator */}
      <View style={styles.portCardHeader}>
        <View style={[styles.portTypeBadge, { backgroundColor: typeBg }]}>
          <EvPlugIcon size={13} color={typeColor} />
          <Text style={[styles.portTypeBadgeText, { color: typeColor }]}>
            {connector.connectorType}
          </Text>
        </View>

        <View
          style={[
            styles.portStatusBadge,
            {
              backgroundColor: isAvail
                ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5')
                : (isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2'),
            },
          ]}
        >
          <LiveDot
            color={isAvail ? '#10B981' : connector.runtimeStatus === 'IN_USE' ? '#F59E0B' : '#EF4444'}
            size={5}
          />
          <Text
            style={[
              styles.portStatusText,
              { color: isAvail ? '#059669' : themeColors.textMuted },
            ]}
          >
            {t(`stationDetail.status.${connector.runtimeStatus}`)}
          </Text>
        </View>
      </View>

      {/* Port Name & Power Tag (with Lightning / Flash Icon for kW) */}
      <View style={styles.portCardBody}>
        <Text style={[styles.portCardName, { color: themeColors.textStrong }]} numberOfLines={1}>
          {formatEquipmentName(connector.name, i18n.language)}
        </Text>
        <View
          style={[
            styles.powerPill,
            { backgroundColor: isDc ? (isDark ? 'rgba(2, 132, 199, 0.18)' : '#F0F9FF') : (isDark ? 'rgba(5, 150, 105, 0.18)' : '#F0FDF4') },
          ]}
        >
          <Ionicons name="flash" size={13} color={isDc ? '#0284C7' : '#059669'} />
          <Text style={[styles.powerPillText, { color: isDc ? '#0284C7' : '#059669' }]}>
            {connector.powerKw} kW
          </Text>
          <View style={[styles.dcAcBadge, { backgroundColor: isDc ? '#0284C7' : '#059669' }]}>
            <Text style={styles.dcAcText}>{isDc ? 'DC' : 'AC'}</Text>
          </View>
        </View>
      </View>

      {/* Pricing Footer & Selection Checkmark */}
      <View style={[styles.portCardFooter, { borderTopColor: isDark ? 'rgba(51, 65, 85, 0.7)' : '#F1F5F9' }]}>
        <Text style={[styles.portRateText, { color: themeColors.textStrong }]} numberOfLines={1}>
          {connector.ratePerKwh !== undefined ? formatRate(connector.ratePerKwh) : '--'}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color="#059669" />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  portCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: spacing.sm + 3,
    gap: spacing.xs + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  portCardDisabled: {
    opacity: 0.45,
  },
  portCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  portTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  portTypeBadgeText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
  },
  portStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  portStatusText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  portCardBody: {
    gap: 5,
    marginVertical: 2,
  },
  portCardName: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  powerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  powerPillText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
  },
  dcAcBadge: {
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 3,
    marginLeft: 2,
  },
  dcAcText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  portCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  portRateText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    flex: 1,
  },
});

