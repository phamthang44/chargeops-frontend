import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, StatusBadge, type BadgeVariant } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getChargersByStation, getStationById } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Amenity, Charger, ChargerStatus, Station } from '@/types';
import { formatRate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StationDetail'>;
type Route = RouteProp<RootStackParamList, 'StationDetail'>;

const AMENITY_ICON: Record<Amenity, keyof typeof Ionicons.glyphMap> = {
  wifi: 'wifi',
  food: 'cafe-outline',
  parking: 'car-outline',
  security: 'shield-checkmark-outline',
  restroom: 'sparkles-outline',
};

const STATUS_VARIANT: Record<ChargerStatus, BadgeVariant> = {
  AVAILABLE: 'success',
  IN_USE: 'info',
  DISABLED: 'neutral',
  MAINTENANCE: 'warning',
};

const HERO_HEIGHT = 240;

/**
 * Station detail — step 2 of the booking flow.
 * Visily content (rating, amenities, refund policy, charger list, price summary)
 * wrapped in a hero-overlap layout with a floating glass back button.
 */
export function StationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      getStationById(params.stationId),
      getChargersByStation(params.stationId),
    ]).then(([s, c]) => {
      if (active) {
        setStation(s);
        setChargers(c);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.stationId]);

  // Floating glass buttons (over the hero) — shared by loading & loaded states.
  const floatingHeader = (
    <View style={[styles.floatingHeader, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <Pressable style={styles.glassBtn} hitSlop={8} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
      </Pressable>
      <Pressable style={styles.glassBtn} hitSlop={8}>
        <Ionicons name="heart-outline" size={22} color={colors.textInverse} />
      </Pressable>
    </View>
  );

  if (loading || !station) {
    return (
      <View style={styles.container}>
        <View style={styles.hero} />
        {floatingHeader}
        <ActivityIndicator color={colors.primary} style={styles.centerLoader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero banner (branded; image gallery comes later) */}
        <View style={styles.hero}>
          <Ionicons name="flash" size={72} color={colors.textInverse} style={styles.heroIcon} />
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Content sheet overlapping the hero */}
        <View style={styles.sheet}>
          <Text style={styles.name}>{station.name}</Text>

          <View style={styles.metaRow}>
            {station.rating !== undefined && (
              <View style={styles.inlineMeta}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={styles.metaStrong}>{station.rating.toFixed(1)}</Text>
              </View>
            )}
            {station.reviewCount !== undefined && (
              <Text style={styles.metaMuted}>{t('stationDetail.reviews', { count: station.reviewCount })}</Text>
            )}
            {station.distanceKm !== undefined && (
              <>
                <Text style={styles.metaMuted}>·</Text>
                <Text style={styles.metaMuted}>{station.distanceKm} km</Text>
              </>
            )}
            <Text style={styles.metaMuted}>·</Text>
            <Text style={[styles.metaStrong, { color: station.isOpen ? colors.primary : colors.error }]}>
              {station.isOpen ? t('stationDetail.open') : t('stationDetail.closed')}
            </Text>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.address}>{station.address}</Text>
          </View>

          {/* Amenities */}
          {station.amenities && station.amenities.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.amenityRow}
              style={styles.amenityScroll}
            >
              {station.amenities.map((a) => (
                <View key={a} style={styles.amenity}>
                  <View style={styles.amenityIcon}>
                    <Ionicons name={AMENITY_ICON[a]} size={20} color={colors.textBody} />
                  </View>
                  <Text style={styles.amenityLabel}>{t(`stationDetail.amenities.${a}`)}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Refund policy */}
          <View style={styles.refundCard}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primaryDark} />
            <View style={styles.refundBody}>
              <Text style={styles.refundTitle}>{t('stationDetail.refundTitle')}</Text>
              <Text style={styles.refundLine}>• {t('stationDetail.refundLine1')}</Text>
              <Text style={styles.refundLine}>• {t('stationDetail.refundLine2')}</Text>
              <Text style={styles.refundLine}>• {t('stationDetail.refundLine3')}</Text>
            </View>
          </View>

          {/* Charger list */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('stationDetail.chargerList')}</Text>
            <Text style={styles.sectionMeta}>
              {t('stationDetail.chargerCount', {
                available: station.availableChargers,
                total: station.totalChargers,
              })}
            </Text>
          </View>
          <View style={styles.chargerList}>
            {chargers.map((c) => (
              <View key={c.id} style={styles.chargerRow}>
                <View style={styles.chargerIcon}>
                  <Ionicons name="flash" size={22} color={colors.textMuted} />
                </View>
                <View style={styles.chargerBody}>
                  <Text style={styles.chargerName}>{c.name}</Text>
                  <Text style={styles.chargerMeta}>
                    {c.connectorType} · {c.powerKw} kW
                  </Text>
                </View>
                <View style={styles.chargerRight}>
                  <StatusBadge variant={STATUS_VARIANT[c.status]} label={t(`stationDetail.status.${c.status}`)} />
                  {c.ratePerKwh !== undefined && (
                    <Text style={styles.chargerRate}>{formatRate(c.ratePerKwh)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Description */}
          {station.description && (
            <View style={styles.descBlock}>
              <Text style={styles.sectionTitle}>{t('stationDetail.descriptionTitle')}</Text>
              <Text style={styles.desc}>{station.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {floatingHeader}

      {/* Sticky bottom CTA with price summary */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {station.minRatePerKwh !== undefined && (
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>{t('stationDetail.priceFrom')}</Text>
            <Text style={styles.priceValue}>{formatRate(station.minRatePerKwh)}</Text>
          </View>
        )}
        <AppButton
          style={styles.cta}
          label={t('stationDetail.cta')}
          onPress={() => navigation.navigate('SlotPicker', { stationId: params.stationId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: { opacity: 0.9 },
  dots: { position: 'absolute', bottom: spacing.xl, flexDirection: 'row', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.surface, opacity: 0.5 },
  dotActive: { opacity: 1 },

  centerLoader: { position: 'absolute', top: '60%', alignSelf: 'center' },

  floatingHeader: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheet: {
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  name: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong, lineHeight: lineHeights.title },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: -spacing.sm },
  inlineMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaStrong: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  metaMuted: { fontSize: fontSizes.body, color: colors.textMuted },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: -spacing.sm },
  address: { flex: 1, fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body },

  amenityScroll: { flexGrow: 0 },
  amenityRow: { gap: spacing.lg, paddingVertical: spacing.xs },
  amenity: { alignItems: 'center', width: 64, gap: spacing.xs },
  amenityIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: { fontSize: fontSizes.caption, color: colors.textMuted, textAlign: 'center' },

  refundCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  refundBody: { flex: 1, gap: spacing.xs },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },
  refundLine: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  sectionMeta: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },

  chargerList: { gap: spacing.sm, marginTop: -spacing.sm },
  chargerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  chargerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargerBody: { flex: 1, gap: 2 },
  chargerName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  chargerMeta: { fontSize: fontSizes.caption, color: colors.textMuted },
  chargerRight: { alignItems: 'flex-end', gap: spacing.xs },
  chargerRate: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.primaryDark },

  descBlock: { gap: spacing.sm },
  desc: { fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  priceBlock: { gap: 2 },
  priceLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  priceValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.primaryDark },
  cta: { flex: 1 },
});
