import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector } from '@/types';
import { formatEquipmentName } from '@/utils/format';

import { ConnectorPortCard } from './ConnectorPortCard';
import { EvPlugIcon } from './StationDetailSvgs';

export interface GroupedPoint {
  cp: ChargePoint;
  connectors: Connector[];
}

interface ChargePointGroupListProps {
  groups: GroupedPoint[];
  selectedConnectorId: string | null;
  onSelectConnector: (id: string) => void;
}

export function ChargePointGroupList({
  groups,
  selectedConnectorId,
  onSelectConnector,
}: ChargePointGroupListProps) {
  const { t, i18n } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <EvPlugIcon size={20} color={themeColors.primary} />
        <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
          {t('stationDetail.selectConnector')}
        </Text>
      </View>
      <Text style={[styles.sectionSubtitle, { color: themeColors.textBody }]}>
        {t('stationDetail.connectorHint')}
      </Text>

      {/* Charge Points List */}
      <View style={styles.cpList}>
        {groups.map(({ cp, connectors: cpConns }) => {
          const availableCount = cpConns.filter((c) => c.runtimeStatus === 'AVAILABLE').length;

          return (
            <View
              key={cp.id}
              style={[
                styles.cpCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
                },
              ]}
            >
              {/* ChargePoint Header with Location / Zone Badge */}
              <View style={[styles.cpHeader, { borderBottomColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#F1F5F9' }]}>
                <View style={styles.cpHeaderLeft}>
                  <View
                    style={[
                      styles.cpIconWrap,
                      { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                    ]}
                  >
                    <Ionicons name="hardware-chip-outline" size={18} color="#6366F1" />
                  </View>
                  <View style={styles.cpHeaderInfo}>
                    <View style={styles.cpTitleRow}>
                      <Text style={[styles.cpName, { color: themeColors.textStrong }]} numberOfLines={1}>
                        {formatEquipmentName(cp.name, i18n.language)}
                      </Text>
                      {cp.zoneLabel ? (
                        <View
                          style={[
                            styles.cpZoneBadge,
                            {
                              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F5F3FF',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : '#DDD6FE',
                            },
                          ]}
                        >
                          <Ionicons name="location-sharp" size={11} color="#6366F1" />
                          <Text
                            style={[styles.cpZoneText, { color: isDark ? '#A5B4FC' : '#6366F1' }]}
                            numberOfLines={1}
                          >
                            {cp.zoneLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.cpModelText, { color: themeColors.textMuted }]} numberOfLines={1}>
                      {cp.maxPowerKw > 0 ? `${cp.maxPowerKw} kW · ` : ''}
                      {t('stationDetail.portsCount', { count: cpConns.length })}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.cpAvailPill,
                    {
                      backgroundColor:
                        availableCount > 0
                          ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                          : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                      borderColor:
                        availableCount > 0
                          ? (isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0')
                          : (isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA'),
                    },
                  ]}
                >
                  <LiveDot color={availableCount > 0 ? '#10B981' : '#EF4444'} size={5} />
                  <Text
                    style={[
                      styles.cpAvailText,
                      { color: availableCount > 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {availableCount}/{cpConns.length} {t('stationDetail.availableStatus')}
                  </Text>
                </View>
              </View>

              {/* 2-Column Connector Cards inside this Charge Point */}
              <View style={styles.portGridInsideCp}>
                {cpConns.map((c) => (
                  <ConnectorPortCard
                    key={c.id}
                    connector={c}
                    isSelected={selectedConnectorId === c.id}
                    onSelect={() => onSelectConnector(c.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
  },
  cpList: {
    gap: spacing.md,
  },
  cpCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.xs,
  },
  cpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cpHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  cpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cpName: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  cpZoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  cpZoneText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  cpModelText: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
  },
  cpAvailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  cpAvailText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  portGridInsideCp: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    padding: spacing.md,
  },
});
