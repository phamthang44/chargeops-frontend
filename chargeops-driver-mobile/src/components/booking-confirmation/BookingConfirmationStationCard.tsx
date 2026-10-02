import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, Station } from '@/types';
import { formatEquipmentName } from '@/utils/format';

export interface BookingConfirmationStationCardProps {
  station: Station;
  connector: Connector;
  chargePoint: ChargePoint | null;
  onChangeConnector: () => void;
}

export function BookingConfirmationStationCard({
  station,
  connector,
  chargePoint,
  onChangeConnector,
}: BookingConfirmationStationCardProps) {
  const { t, i18n } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.stationName, { color: themeColors.textStrong }]}>{station.name}</Text>
        <Pressable
          onPress={onChangeConnector}
          hitSlop={6}
          style={[
            styles.changeBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
          ]}
        >
          <Text style={{ color: themeColors.primary, fontSize: 12, fontWeight: '600' }}>
            {t('bookingConfirmation.changeConnector', 'Đổi cổng')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={14} color={themeColors.textMuted} />
        <Text style={[styles.metaText, { color: themeColors.textMuted }]} numberOfLines={1}>
          {station.address}
        </Text>
      </View>

      <View style={[styles.connectorPill, { backgroundColor: themeColors.surfaceAlt }]}>
        <Ionicons name="flash-outline" size={14} color={themeColors.primary} />
        <Text style={[styles.connectorText, { color: themeColors.textStrong }]}>
          {chargePoint?.name ? `${formatEquipmentName(chargePoint.name, i18n.language)} · ` : ''}
          {formatEquipmentName(connector.name, i18n.language)} ({connector.connectorType}) · {connector.powerKw} kW
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stationName: {
    flex: 1,
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  changeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSizes.caption,
  },
  connectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  connectorText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
});
