import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, GlassButton, GlassSurface, StarRating, StatusBadge, type BadgeVariant } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getChargersByStation, getReviewsByStation, getStationById } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Amenity, Charger, ChargerStatus, Review, Station } from '@/types';
import { formatDate, formatRate } from '@/utils/format';

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

// Decorative gallery slides (real photo gallery comes later).
const GALLERY: (keyof typeof Ionicons.glyphMap)[] = ['flash', 'business-outline', 'car-outline'];

const HERO_HEIGHT = 240;

/**
 * Station detail — step 2 of the booking flow.
 * Swipeable hero gallery + glass back/favorite, amenities, refund policy,
 * charger list, location map snippet, reviews, and a gated booking CTA.
 */
export function StationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isFavorite, toggleFavorite } = usePreferences();

  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      getStationById(params.stationId),
      getChargersByStation(params.stationId),
      getReviewsByStation(params.stationId),
    ]).then(([s, c, r]) => {
      if (active) {
        setStation(s);
        setChargers(c);
        setReviews(r);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.stationId]);

  const fav = isFavorite(params.stationId);

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  // Floating glass buttons (over the hero) — shared by loading & loaded states.
  const floatingHeader = (
    <View style={[styles.floatingHeader, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <GlassButton accessibilityLabel={t('common.back')} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
      </GlassButton>
      <GlassButton
        accessibilityLabel={t(fav ? 'stationDetail.saved' : 'stationDetail.save')}
        onPress={() => toggleFavorite(params.stationId)}
      >
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? colors.error : colors.textInverse} />
      </GlassButton>
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

  const unavailable = !station.isOpen || station.availableChargers === 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Swipeable hero gallery */}
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {GALLERY.map((icon, i) => (
              <View key={i} style={[styles.slide, { width }]}>
                <Ionicons name={icon} size={72} color={colors.textInverse} style={styles.heroIcon} />
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {GALLERY.map((_, i) => (
              <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
            ))}
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

          {/* Location / map snippet */}
          <Text style={styles.sectionTitle}>{t('stationDetail.locationTitle')}</Text>
          <Pressable style={styles.mapCard} onPress={() => navigation.navigate('Tabs', { screen: 'Map' })}>
            <View style={styles.mapCanvas}>
              <Ionicons name="location" size={28} color={colors.primary} />
            </View>
            <View style={styles.mapFooter}>
              <Ionicons name="map-outline" size={16} color={colors.primary} />
              <Text style={styles.mapFooterText}>{t('stationDetail.openMap')}</Text>
              <View style={styles.flex1} />
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Pressable>

          {/* Reviews */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('stationDetail.reviewsTitle')}</Text>
            {reviews.length > 0 && (
              <Pressable hitSlop={6}>
                <Text style={styles.viewAll}>{t('stationDetail.viewAll')}</Text>
              </Pressable>
            )}
          </View>
          {reviews.length === 0 ? (
            <Text style={styles.metaMuted}>{t('stationDetail.noReviews')}</Text>
          ) : (
            <View style={styles.reviewList}>
              {station.rating !== undefined && (
                <View style={styles.ratingSummary}>
                  <Text style={styles.ratingBig}>{station.rating.toFixed(1)}</Text>
                  <View style={styles.flex1}>
                    <StarRating rating={station.rating} size={16} />
                    {station.reviewCount !== undefined && (
                      <Text style={styles.metaMuted}>{t('stationDetail.reviews', { count: station.reviewCount })}</Text>
                    )}
                  </View>
                </View>
              )}
              {reviews.slice(0, 2).map((r) => (
                <View key={r.id} style={styles.reviewRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{r.authorName.charAt(0)}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <View style={styles.reviewHead}>
                      <Text style={styles.reviewName}>{r.authorName}</Text>
                      <Text style={styles.metaMuted}>{formatDate(r.createdAt)}</Text>
                    </View>
                    <StarRating rating={r.rating} size={12} />
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

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

      {/* Sticky bottom CTA with price summary; gated when unavailable */}
      <GlassSurface
        glassEffectStyle="regular"
        style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}
      >
        {unavailable && (
          <Text style={styles.gateHint}>
            {station.isOpen ? t('stationDetail.fullHint') : t('stationDetail.closedHint')}
          </Text>
        )}
        <View style={styles.bottomRow}>
          {station.minRatePerKwh !== undefined && (
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>{t('stationDetail.priceFrom')}</Text>
              <Text style={styles.priceValue}>{formatRate(station.minRatePerKwh)}</Text>
            </View>
          )}
          <AppButton
            style={styles.cta}
            label={t('stationDetail.cta')}
            disabled={unavailable}
            onPress={() => navigation.navigate('SlotPicker', { stationId: params.stationId })}
          />
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },

  hero: { height: HERO_HEIGHT, backgroundColor: colors.primary },
  slide: { height: HERO_HEIGHT, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { opacity: 0.9 },
  dots: { position: 'absolute', bottom: spacing.xl, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.surface, opacity: 0.5 },
  dotActive: { opacity: 1, width: 18 },

  centerLoader: { position: 'absolute', top: '60%', alignSelf: 'center' },

  floatingHeader: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  sectionMeta: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },
  viewAll: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primary },

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
  chargerRate: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textStrong },

  // Map snippet
  mapCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: -spacing.sm,
  },
  mapCanvas: { height: 120, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  mapFooterText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primary },

  // Reviews
  reviewList: { gap: spacing.md, marginTop: -spacing.sm },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ratingBig: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textStrong },
  reviewRow: { flexDirection: 'row', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  reviewComment: { fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body, marginTop: spacing.xs },

  descBlock: { gap: spacing.sm },
  desc: { fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  gateHint: { fontSize: fontSizes.caption, color: colors.error, textAlign: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  priceBlock: { gap: 2 },
  priceLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  priceValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  cta: { flex: 1 },
});
