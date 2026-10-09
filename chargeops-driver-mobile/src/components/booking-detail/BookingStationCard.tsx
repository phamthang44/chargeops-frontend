import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { PopIcon } from '@/components/common/PopIcon';
import { BezelCard } from './BezelCard';
import { DetailCell } from './DetailCell';
import { SectionHeading } from './SectionHeading';

export interface BookingStationCardProps {
  booking: Booking;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export function BookingStationCard({
  booking,
  copiedField,
  onCopy,
}: BookingStationCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <>
      <SectionHeading
        icon="business-outline"
        title={t('bookingDetail.stationTitle')}
        color={themeColors.primary}
        textColor={themeColors.textStrong}
      />

      <BezelCard tone={themeColors.primary} contentStyle={styles.card}>
        {booking.stationImageUrl ? (
          <Image source={{ uri: booking.stationImageUrl }} style={styles.stationImage} resizeMode="cover" />
        ) : (
          <View style={[styles.stationImageFallback, { backgroundColor: themeColors.surfaceAlt }]}>
            <Ionicons name="flash" size={30} color={themeColors.primary} />
          </View>
        )}

        <View style={styles.stationCopy}>
          <Text style={[styles.stationName, { color: themeColors.textStrong }]}>{booking.stationName}</Text>
          <View style={styles.addrRow}>
            <Ionicons name="location-outline" size={15} color={themeColors.textMuted} />
            <Text style={[styles.addr, { color: themeColors.textMuted }]}>{booking.stationAddress}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        <View style={styles.detailGrid}>
          <DetailCell
            label={t('bookingDetail.chargePoint')}
            value={booking.chargePointName}
            subValue={booking.zoneLabel ?? undefined}
            mutedColor={themeColors.textMuted}
            textColor={themeColors.textStrong}
          />
          <DetailCell
            label={t('bookingDetail.connector')}
            value={`${booking.connectorName}`}
            subValue={`${booking.connectorType} - ${booking.powerKw}kW`}
            alignRight
            mutedColor={themeColors.textMuted}
            textColor={themeColors.textStrong}
          />
        </View>

        <View
          style={[
            styles.connectorRibbon,
            {
              backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : themeColors.surfaceAlt,
              borderColor: `${themeColors.primary}25`,
            },
          ]}
        >
          <View style={[styles.ribbonIcon, { backgroundColor: `${themeColors.primary}18` }]}>
            <Ionicons name="hardware-chip-outline" size={18} color={themeColors.primaryDark} />
          </View>
          <View style={styles.ribbonCopy}>
            <Text style={[styles.ribbonLabel, { color: themeColors.textMuted }]}>
              {t('bookingDetail.connectorCodeLabel', 'Mã cổng sạc trên trụ')}
            </Text>
            <Text style={[styles.ribbonValue, { color: themeColors.textStrong }]}>
              {booking.connectorCode || booking.connectorName}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.copyIconBtn,
              {
                backgroundColor: themeColors.surface,
                borderColor: copiedField === 'connector' ? themeColors.success : themeColors.border,
              },
            ]}
            onPress={() => onCopy(booking.connectorCode || booking.connectorName, 'connector')}
          >
            <PopIcon
              name={copiedField === 'connector' ? 'checkmark-circle' : 'copy-outline'}
              size={15}
              color={copiedField === 'connector' ? themeColors.success : themeColors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </BezelCard>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  stationImage: { width: '100%', height: 156, borderRadius: radius.md },
  stationImageFallback: {
    width: '100%',
    height: 132,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationCopy: { gap: spacing.xs },
  stationName: { fontSize: fontSizes.heading, lineHeight: lineHeights.heading, fontWeight: fontWeights.bold },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  addr: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  divider: { height: 1 },
  detailGrid: { flexDirection: 'row', gap: spacing.md },
  connectorRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  ribbonIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonCopy: { flex: 1, minWidth: 0 },
  ribbonLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  ribbonValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, marginTop: 1 },
  copyIconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
