import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { PortSlotIndicator } from '@/components/discovery/PortSlotIndicator';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatVnd } from '@/utils/format';

import { EvPlugIcon, PortMetricSvg, PowerMetricSvg, PriceMetricSvg } from './StationDetailSvgs';

interface StationBentoMetricsProps {
  availableConnectors: number;
  totalConnectors: number;
  maxPowerKw: number;
  minRatePerKwh?: number;
  connectorTypes: string[];
}

export function StationBentoMetrics({
  availableConnectors,
  totalConnectors,
  maxPowerKw,
  minRatePerKwh,
  connectorTypes,
}: StationBentoMetricsProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const isAvail = availableConnectors > 0;
  const portColor = isAvail ? '#059669' : '#DC2626';
  const powerColor = '#0284C7';
  const priceColor = '#D97706';

  return (
    <View
      style={[
        styles.bentoCard,
        {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.bentoMetrics}>
        {/* Metric 1: Ports */}
        <View style={styles.bentoMetricCol}>
          <View
            style={[
              styles.metricIconWrap,
              { backgroundColor: isAvail ? (isDark ? 'rgba(5, 150, 105, 0.18)' : '#ECFDF5') : (isDark ? 'rgba(220, 38, 38, 0.18)' : '#FEF2F2') },
            ]}
          >
            <PortMetricSvg size={24} color={portColor} />
          </View>
          <Text style={[styles.bentoLabel, { color: themeColors.textBody }]} numberOfLines={1}>
            {t('stationDetail.readyPorts')}
          </Text>
          <View style={styles.bentoValueRow}>
            <Text style={[styles.bentoValueBig, { color: portColor }]}>
              {availableConnectors}
            </Text>
            <Text style={[styles.bentoValueTotal, { color: themeColors.textMuted }]}>
              /{totalConnectors}
            </Text>
          </View>
          <Text
            style={[
              styles.bentoSubText,
              { color: portColor },
            ]}
            numberOfLines={1}
          >
            {isAvail ? t('stationDetail.availableStatus') : t('stationDetail.fullStatus')}
          </Text>
        </View>

        <View style={[styles.bentoDivider, { backgroundColor: themeColors.border }]} />

        {/* Metric 2: Max Power */}
        <View style={styles.bentoMetricCol}>
          <View
            style={[
              styles.metricIconWrap,
              { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#F0F9FF' },
            ]}
          >
            <PowerMetricSvg size={24} color={powerColor} />
          </View>
          <Text style={[styles.bentoLabel, { color: themeColors.textBody }]} numberOfLines={1}>
            {t('stationDetail.maxPowerTitle')}
          </Text>
          <View style={styles.bentoValueRow}>
            <Text style={[styles.bentoValueBig, { color: powerColor }]}>
              {maxPowerKw > 0 ? maxPowerKw : '--'}
            </Text>
            <Text style={[styles.bentoValueUnit, { color: powerColor }]}>kW</Text>
          </View>
          <Text
            style={[
              styles.bentoSubText,
              { color: maxPowerKw >= 60 ? powerColor : themeColors.textMuted },
            ]}
            numberOfLines={1}
          >
            {maxPowerKw >= 60 ? t('stationDetail.dcFast') : t('stationDetail.acStandard')}
          </Text>
        </View>

        <View style={[styles.bentoDivider, { backgroundColor: themeColors.border }]} />

        {/* Metric 3: Minimum Price */}
        <View style={styles.bentoMetricCol}>
          <View
            style={[
              styles.metricIconWrap,
              { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.18)' : '#FFFBEB' },
            ]}
          >
            <PriceMetricSvg size={24} color={priceColor} />
          </View>
          <Text style={[styles.bentoLabel, { color: themeColors.textBody }]} numberOfLines={1}>
            {t('stationDetail.priceFromTitle')}
          </Text>
          <View style={styles.bentoValueRow}>
            <Text style={[styles.bentoValueBig, { color: priceColor }]} numberOfLines={1}>
              {minRatePerKwh ? formatVnd(minRatePerKwh).replace('₫', '').trim() : '--'}
            </Text>
            <Text style={[styles.bentoValueUnit, { color: priceColor }]}>₫</Text>
          </View>
          <Text style={[styles.bentoSubText, { color: priceColor }]}>
            {t('stationDetail.perKwh')}
          </Text>
        </View>
      </View>

      {/* Segmented slot indicator bar across full width */}
      <View style={styles.bentoIndicatorRow}>
        <PortSlotIndicator
          available={availableConnectors}
          total={totalConnectors}
          showBars={true}
          showLabel={false}
        />
      </View>

      {/* Supported connector chips strip */}
      {connectorTypes.length > 0 && (
        <View style={[styles.bentoFooter, { borderTopColor: themeColors.border }]}>
          <View style={styles.bentoFooterLeft}>
            <EvPlugIcon size={15} color={themeColors.primary} />
            <Text style={[styles.bentoFooterLabel, { color: themeColors.textStrong }]}>
              {t('stationDetail.supportedConnectors')}
            </Text>
          </View>
          <View style={styles.bentoChips}>
            {connectorTypes.map((type) => (
              <View
                key={type}
                style={[
                  styles.bentoChip,
                  { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                ]}
              >
                <Text style={[styles.bentoChipText, { color: themeColors.textStrong }]}>{type}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bentoCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm + 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  bentoMetricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    gap: 2,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bentoDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  bentoValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 1,
  },
  bentoValueBig: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  bentoValueTotal: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
  },
  bentoValueUnit: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    marginLeft: 1,
  },
  bentoSubText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    marginTop: 2,
    textAlign: 'center',
  },
  bentoIndicatorRow: {
    width: '100%',
    paddingTop: 2,
  },
  bentoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bentoFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoFooterLabel: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  bentoChips: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  bentoChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2.5,
  },
  bentoChipText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
});

