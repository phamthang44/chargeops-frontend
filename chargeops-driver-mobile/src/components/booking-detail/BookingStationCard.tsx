import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleOpenDirections = () => {
    const destination = encodeURIComponent(
      `${booking.stationName}, ${booking.stationAddress || ''}`
    );
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url).catch(() => {});
  };

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
          <View style={styles.imageWrap}>
            <Image source={{ uri: booking.stationImageUrl }} style={styles.stationImage} resizeMode="cover" />
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.directionsOverlayBtn, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]}
              onPress={handleOpenDirections}
            >
              <Ionicons name="navigate" size={13} color="#34D399" />
              <Text style={styles.directionsBtnText}>{t('stationDetail.directions', 'Chỉ đường')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.stationBanner,
              {
                backgroundColor: isDark ? '#0D1E18' : '#F0FDF4',
                borderColor: isDark ? '#1F3B30' : '#BBF7D0',
              },
            ]}
          >
            <View style={styles.bannerDecorRow}>
              <View style={[styles.bannerBadge, { backgroundColor: isDark ? '#164E3A' : '#DCFCE7' }]}>
                <Ionicons name="flash" size={13} color={isDark ? '#6EE7B7' : '#059669'} />
                <Text style={[styles.bannerBadgeText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                  {booking.powerKw ? `${booking.powerKw} kW • ` : ''}{booking.connectorType || 'DC Sạc nhanh'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.bannerActionBtn,
                  { backgroundColor: isDark ? '#1A382C' : '#FFFFFF', borderColor: isDark ? '#2E5846' : '#86EFAC' },
                ]}
                onPress={handleOpenDirections}
              >
                <Ionicons name="navigate" size={13} color={isDark ? '#34D399' : '#059669'} />
                <Text style={[styles.bannerActionBtnText, { color: isDark ? '#34D399' : '#059669' }]}>
                  {t('stationDetail.directions', 'Chỉ đường')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerVisualCenter}>
              <View style={[styles.visualIconCircle, { backgroundColor: isDark ? '#133526' : '#BBF7D0' }]}>
                <Ionicons name="car-sport" size={24} color={isDark ? '#34D399' : '#059669'} />
              </View>
              <Text style={[styles.bannerHintText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                {t('bookingDetail.stationReadyHint', 'Trạm sạc thông minh ChargeOps Hub')}
              </Text>
            </View>
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
  imageWrap: {
    width: '100%',
    height: 156,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  stationImage: { width: '100%', height: '100%' },
  directionsOverlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  directionsBtnText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  stationBanner: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  bannerDecorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  bannerBadgeText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
  bannerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  bannerActionBtnText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  bannerVisualCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 2,
  },
  visualIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerHintText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
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
