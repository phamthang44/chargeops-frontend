import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { EvPlugIcon } from '@/components/station-detail/StationDetailSvgs';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, Station } from '@/types';
import { formatEquipmentName, formatVnd } from '@/utils/format';

interface TimePickerStationBriefProps {
  station: Station;
  chargePoint: ChargePoint | null;
  connector: Connector;
  themeColors: any;
  t: (key: string, options?: any) => string;
}

export const TimePickerStationBrief = React.memo(function TimePickerStationBrief({
  station,
  chargePoint,
  connector,
  themeColors,
  t,
}: TimePickerStationBriefProps) {
  const { i18n } = useTranslation();
  return (
    <View style={[styles.container, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
      {/* Top row: Station name & location */}
      <View style={styles.topRow}>
        <View style={[styles.stationIconBox, { backgroundColor: themeColors.primarySoft }]}>
          <Ionicons name="business" size={19} color={themeColors.primaryDark} />
        </View>
        <View style={styles.stationInfo}>
          <Text style={[styles.stationName, { color: themeColors.textStrong }]} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={[styles.stationAddress, { color: themeColors.textMuted }]} numberOfLines={1}>
            {station.address || `${station.wardName ?? ''}, ${station.provinceName ?? ''}`}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Bottom row: Connector specs & Rate */}
      <View style={styles.bottomRow}>
        <View style={styles.connectorInfo}>
          <View style={[styles.plugBadge, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <EvPlugIcon size={17} color={themeColors.primaryDark} />
            <Text style={[styles.connectorTypeName, { color: themeColors.textStrong }]}>
              {connector.connectorType}
            </Text>
          </View>

          <View style={styles.specItem}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={[styles.specText, { color: themeColors.textStrong }]}>
              {connector.powerKw} kW DC
            </Text>
          </View>

          {chargePoint?.name ? (
            <Text style={[styles.cpName, { color: themeColors.textMuted }]} numberOfLines={1}>
              {formatEquipmentName(chargePoint.name, i18n.language)} · {formatEquipmentName(connector.name, i18n.language)}
            </Text>
          ) : null}
        </View>

        {connector.ratePerKwh !== undefined && (
          <View style={styles.rateBlock}>
            <Text style={[styles.rateLabel, { color: themeColors.textMuted }]}>
              {t('stationDetail.priceFromTitle')}
            </Text>
            <Text style={[styles.rateValue, { color: themeColors.textStrong }]}>
              {formatVnd(connector.ratePerKwh)}
              <Text style={[styles.kwhUnit, { color: themeColors.textMuted }]}>/kWh</Text>
            </Text>
          </View>
        )}
      </View>

      {/* 48h Booking Policy line with comfortable typography */}
      <View style={[styles.policyLine, { backgroundColor: `${themeColors.primary}0D` }]}>
        <Ionicons name="information-circle-outline" size={15} color={themeColors.primary} />
        <Text style={[styles.policyLineText, { color: themeColors.primary }]}>
          {t('timeRangePicker.bookingNoticeDesc')}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.md + 2,
    borderWidth: 1.2,
    gap: spacing.sm + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  stationIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationInfo: {
    flex: 1,
    gap: 3,
  },
  stationName: {
    fontSize: 16,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },
  stationAddress: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  connectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs + 4,
    flex: 1,
  },
  plugBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  connectorTypeName: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specText: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
  },
  cpName: {
    fontSize: 12,
  },
  rateBlock: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },
  rateValue: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  kwhUnit: {
    fontSize: 11.5,
    fontWeight: fontWeights.regular,
  },
  policyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 2,
  },
  policyLineText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: fontWeights.medium,
  },
});
