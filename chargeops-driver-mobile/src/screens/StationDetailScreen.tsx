import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StarRating, StatusBadge } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getReviewsByStation,
  getStationDetail,
} from '@/services/stationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Amenity, ChargePoint, Connector, Review, Station } from '@/types';
import { formatDate, formatRate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StationDetail'>;
type Route = RouteProp<RootStackParamList, 'StationDetail'>;

const { width } = Dimensions.get('window');

const GALLERY: (keyof typeof Ionicons.glyphMap)[] = ['flash', 'map', 'business'];

const AMENITY_ICON: Record<Amenity, keyof typeof Ionicons.glyphMap> = {
  RESTROOM: 'man-outline',
  CAFE: 'cafe-outline',
  WIFI: 'wifi-outline',
  PARKING: 'car-outline',
  CONVENIENCE_STORE: 'basket-outline',
  SHOPPING: 'cart-outline',
  restroom: 'man-outline',
  food: 'cafe-outline',
  wifi: 'wifi-outline',
  parking: 'car-outline',
  security: 'shield-checkmark-outline',
};

interface GroupedPoint {
  cp: ChargePoint;
  connectors: Connector[];
}

/**
 * "Chi tiết trạm sạc" screen — dynamic theme aware for light & dark modes.
 */
export function StationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, themeColors, isDark } = usePreferences();
  const { getAccessToken } = useAuth();

  const [station, setStation] = useState<Station | null>(null);
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    let active = true;
    setLoading(true);

    const token = getAccessToken();

    Promise.all([
      getStationDetail(params.stationId, { accessToken: token }),
      getReviewsByStation(params.stationId),
    ])
      .then(([detail, revs]) => {
        if (!active) return;
        if (detail) {
          setStation(detail.station);
          setChargePoints(detail.chargePoints);
          setConnectors(detail.connectors);
          setReviews(revs);

          const firstAvail = detail.connectors.find((c) => c.runtimeStatus === 'AVAILABLE');
          if (firstAvail) setSelectedConnectorId(firstAvail.id);
          else if (detail.connectors[0]) setSelectedConnectorId(detail.connectors[0].id);
        } else {
          setStation(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setStation(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.stationId, getAccessToken]);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  const fav = isFavorite(params.stationId);

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const groups = useMemo<GroupedPoint[]>(() => {
    return chargePoints.map((cp) => ({
      cp,
      connectors: connectors.filter((c) => c.chargePointId === cp.id),
    }));
  }, [chargePoints, connectors]);

  const selectedConn = useMemo(
    () => connectors.find((c) => c.id === selectedConnectorId),
    [connectors, selectedConnectorId],
  );

  const floatingHeader = (
    <View style={[styles.floatingHeader, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <GlassButton accessibilityLabel={t('common.back')} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
      </GlassButton>
      <GlassButton
        accessibilityLabel={t(fav ? 'stationDetail.saved' : 'stationDetail.save')}
        onPress={() => toggleFavorite(params.stationId)}
      >
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? themeColors.error : '#FFFFFF'} />
      </GlassButton>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.hero, { backgroundColor: themeColors.surfaceAlt }]} />
        {floatingHeader}
        <ActivityIndicator color={themeColors.primary} style={styles.centerLoader} />
      </View>
    );
  }

  if (!station) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
          },
        ]}
      >
        {floatingHeader}
        <Ionicons name="alert-circle-outline" size={54} color={themeColors.error} />
        <Text
          style={{
            marginTop: spacing.md,
            fontSize: fontSizes.body,
            color: themeColors.textStrong,
            textAlign: 'center',
            fontWeight: fontWeights.semibold,
          }}
        >
          Không thể tải thông tin trạm sạc
        </Text>
        <Text
          style={{
            marginTop: spacing.xs,
            fontSize: fontSizes.caption,
            color: themeColors.textMuted,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          Trạm sạc không tồn tại hoặc phiên đăng nhập của bạn đã hết hạn. Vui lòng thử lại.
        </Text>
        <Pressable
          onPress={() => loadData()}
          style={{
            marginTop: spacing.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.xl,
            backgroundColor: themeColors.primary,
            borderRadius: radius.md,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: fontWeights.semibold }}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const opState = station.operatingState || (station.isOpen ? 'OPEN' : 'CLOSED_BY_SCHEDULE');
  const isNoSchedule = opState === 'SCHEDULE_NOT_CONFIGURED';
  const isClosedBySchedule = opState === 'CLOSED_BY_SCHEDULE';

  // Future bookings are allowed when CLOSED_BY_SCHEDULE as long as connectors exist!
  // Only locked out if no schedule configured or no connector selected.
  const canBook = !isNoSchedule && station.totalConnectors > 0 && !!selectedConnectorId;
  const bookButtonLabel = isClosedBySchedule
    ? 'Đặt lịch trước'
    : t('stationDetail.bookNow', 'Đặt chỗ ngay');

  const gateHint = isNoSchedule
    ? 'Trạm chưa cấu hình giờ hoạt động nên tạm thời chưa thể đặt lịch'
    : isClosedBySchedule
      ? 'Trạm đang đóng cửa lúc này. Bạn có thể chọn khung giờ mở cửa kế tiếp để đặt trước.'
      : station.availableConnectors === 0
        ? t('stationDetail.fullHint')
        : !selectedConnectorId
          ? t('stationDetail.selectConnectorHint')
          : null;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Swipeable hero gallery */}
        <View style={[styles.hero, { backgroundColor: isDark ? '#121615' : '#E2E8F0' }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {GALLERY.map((icon, i) => (
              <View key={i} style={[styles.slide, { width }]}>
                <Ionicons name={icon} size={64} color={themeColors.textMuted} />
                <Text style={[styles.heroHint, { color: themeColors.textMuted }]}>{t('stationDetail.photoPending')}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {GALLERY.map((_, i) => (
              <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Content sheet overlapping hero */}
        <View style={[styles.sheet, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.name, { color: themeColors.textStrong }]}>{station.name}</Text>

          <View style={styles.metaRow}>
            {station.rating !== undefined && (
              <View style={[styles.inlineMeta, { backgroundColor: themeColors.surfaceAlt }]}>
                <Ionicons name="star" size={14} color={themeColors.warning} />
                <Text style={[styles.metaStrong, { color: themeColors.textStrong }]}>{station.rating.toFixed(1)}</Text>
              </View>
            )}
            {station.reviewCount !== undefined && (
              <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>
                ({station.reviewCount})
              </Text>
            )}
            {station.distanceKm !== undefined && (
              <>
                <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>·</Text>
                <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>{station.distanceKm} km</Text>
              </>
            )}
            <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>·</Text>
            <Text
              style={[
                styles.metaStrong,
                {
                  color:
                    opState === 'OPEN'
                      ? themeColors.primary
                      : isClosedBySchedule
                        ? themeColors.warning
                        : themeColors.textMuted,
                },
              ]}
            >
              {opState === 'OPEN'
                ? t('stationDetail.open', 'Đang mở cửa')
                : isClosedBySchedule
                  ? 'Đóng cửa theo lịch'
                  : 'Chưa cấu hình giờ hoạt động'}
            </Text>
            {station.operatingHours && (
              <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>
                ({station.operatingHours})
              </Text>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={themeColors.primary} />
            <Text style={[styles.address, { color: themeColors.textBody }]}>{station.address}</Text>
          </View>

          {station.description && <Text style={[styles.desc, { color: themeColors.textBody }]}>{station.description}</Text>}

          {/* Amenities */}
          {station.amenities && station.amenities.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.amenityRow}
              style={styles.amenityScroll}
            >
              {station.amenities.map((a) => (
                <View key={a} style={[styles.amenity, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
                  <View style={styles.amenityIcon}>
                    <Ionicons name={AMENITY_ICON[a]} size={20} color={themeColors.primary} />
                  </View>
                  <Text style={[styles.amenityLabel, { color: themeColors.textStrong }]}>{t(`stationDetail.amenities.${a}`)}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Connector selection */}
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('stationDetail.selectConnector')}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: themeColors.textMuted }]}>{t('stationDetail.connectorHint')}</Text>

          {groups.map(({ cp, connectors: conns }) => (
            <View key={cp.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupIcon, { backgroundColor: themeColors.surfaceAlt }]}>
                  <Ionicons name="hardware-chip-outline" size={18} color={themeColors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupName, { color: themeColors.textStrong }]}>{cp.name}</Text>
                  {cp.zoneLabel ? (
                    <View style={styles.zoneRow}>
                      <Ionicons name="location-outline" size={13} color={themeColors.textMuted} />
                      <Text style={[styles.zoneLabel, { color: themeColors.textMuted }]}>{cp.zoneLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {conns.map((c) => {
                const isSelected = selectedConnectorId === c.id;
                const isAvail = c.runtimeStatus === 'AVAILABLE';

                return (
                  <Pressable
                    key={c.id}
                    disabled={!isAvail}
                    onPress={() => setSelectedConnectorId(c.id)}
                    style={[
                      styles.connectorRow,
                      {
                        backgroundColor: isSelected
                          ? themeColors.primarySoft
                          : themeColors.surfaceAlt,
                        borderColor: isSelected ? themeColors.primary : themeColors.border,
                      },
                      !isAvail && styles.connectorRowDisabled,
                    ]}
                  >
                    <View style={[styles.connectorIcon, { backgroundColor: themeColors.surface }]}>
                      <Ionicons name="flash" size={20} color={isSelected ? themeColors.primary : themeColors.textMuted} />
                    </View>

                    <View style={styles.connectorBody}>
                      <Text style={[styles.connectorName, { color: themeColors.textStrong }]}>{c.name}</Text>
                      <Text style={[styles.connectorMeta, { color: themeColors.textMuted }]}>
                        {c.connectorType} · {c.powerKw} kW
                      </Text>
                    </View>

                    <View style={styles.connectorRight}>
                      <StatusBadge
                        variant={c.runtimeStatus === 'AVAILABLE' ? 'success' : 'neutral'}
                        label={t(`stationDetail.status.${c.runtimeStatus}`)}
                      />
                      {c.ratePerKwh !== undefined && (
                        <Text style={[styles.connectorRate, { color: themeColors.textStrong }]}>{formatRate(c.ratePerKwh)}</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Map snippet */}
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('stationDetail.locationTitle')}</Text>
          </View>
          <View style={[styles.mapCard, { borderColor: themeColors.border }]}>
            <View style={[styles.mapCanvas, { backgroundColor: isDark ? '#121615' : '#F1F5F9' }]}>
              <Ionicons name="location-sharp" size={32} color={themeColors.primary} />
            </View>
            <View style={[styles.mapFooter, { backgroundColor: themeColors.surfaceAlt }]}>
              <Ionicons name="navigate-outline" size={16} color={themeColors.primary} />
              <Text style={[styles.mapFooterText, { color: themeColors.primary }]}>{t('stationDetail.getDirections')}</Text>
            </View>
          </View>

          {/* Driver reviews (FR04) — rating summary then the latest comments */}
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
              {t('stationDetail.reviewsTitle')}
            </Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={[styles.metaMuted, { color: themeColors.textMuted }]}>
              {t('stationDetail.noReviews')}
            </Text>
          ) : (
            <View style={styles.reviewList}>
              {station.rating !== undefined && (
                <View style={[styles.ratingSummary, { backgroundColor: themeColors.surfaceAlt }]}>
                  <View style={styles.ratingScoreBlock}>
                    <Text style={[styles.ratingBig, { color: themeColors.textStrong }]}>
                      {station.rating.toFixed(1)}
                    </Text>
                    <Text style={[styles.ratingOutOf, { color: themeColors.textMuted }]}>/5</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <StarRating rating={station.rating} size={16} />
                    {station.reviewCount !== undefined && (
                      <Text style={[styles.ratingCount, { color: themeColors.textMuted }]}>
                        {t('stationDetail.reviews', { count: station.reviewCount })}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {reviews.slice(0, 3).map((r) => (
                <View key={r.id} style={[styles.reviewCard, { borderColor: themeColors.border }]}>
                  <View style={styles.reviewHead}>
                    <View style={styles.reviewWho}>
                      <View style={[styles.avatar, { backgroundColor: themeColors.surfaceAlt }]}>
                        <Text style={[styles.avatarText, { color: themeColors.textStrong }]}>
                          {r.authorName.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.reviewName, { color: themeColors.textStrong }]}>
                          {r.authorName}
                        </Text>
                        <Text style={[styles.reviewDate, { color: themeColors.textMuted }]}>
                          {formatDate(r.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <StarRating rating={r.rating} size={12} />
                  </View>
                  <Text style={[styles.reviewComment, { color: themeColors.textBody }]}>{r.comment}</Text>
                </View>
              ))}

              {reviews.length > 3 && (
                <Pressable style={[styles.viewAllBtn, { borderColor: themeColors.border }]}>
                  <Text style={[styles.viewAllText, { color: themeColors.primary }]}>
                    {t('stationDetail.viewAll')}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={themeColors.primary} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {floatingHeader}

      {/* Floating Bottom Booking Bar */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <View style={styles.bottomMeta}>
          <Text style={[styles.bottomLabel, { color: themeColors.textMuted }]}>{t('stationDetail.selectedConn')}</Text>
          <Text style={[styles.bottomValue, { color: themeColors.textStrong }]} numberOfLines={1}>
            {selectedConn ? `${selectedConn.name} (${selectedConn.connectorType})` : t('stationDetail.none')}
          </Text>
          {gateHint && (
            <Text
              style={[
                styles.bottomHint,
                { color: isClosedBySchedule ? themeColors.warning : themeColors.error },
              ]}
            >
              {gateHint}
            </Text>
          )}
        </View>

        <AppButton
          label={bookButtonLabel}
          disabled={!canBook}
          onPress={() =>
            navigation.navigate('TimeRangePicker', {
              stationId: params.stationId,
              connectorId: selectedConnectorId!,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoader: { flex: 1 },

  floatingHeader: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },

  hero: { height: 260, position: 'relative' },
  slide: { height: 260, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  heroHint: { fontSize: fontSizes.caption },
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  dotActive: { width: 16, backgroundColor: '#FFFFFF' },

  sheet: {
    marginTop: -radius.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  name: { fontSize: fontSizes.title, fontWeight: fontWeights.bold },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  inlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  metaStrong: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
  metaMuted: { fontSize: fontSizes.caption },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  address: { flex: 1, fontSize: fontSizes.body },
  desc: { fontSize: fontSizes.body, lineHeight: lineHeights.body },

  amenityScroll: { marginHorizontal: -spacing.lg },
  amenityRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  amenityIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  amenityLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  sectionSubtitle: { fontSize: fontSizes.caption, marginTop: -spacing.xs },

  groupCard: { gap: spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  zoneLabel: { fontSize: fontSizes.caption },

  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  connectorRowDisabled: { opacity: 0.5 },
  connectorIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorBody: { flex: 1, gap: 2 },
  connectorName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  connectorMeta: { fontSize: fontSizes.caption },
  connectorRight: { alignItems: 'flex-end', gap: spacing.xs },
  connectorRate: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },

  mapCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: -spacing.sm,
  },
  mapCanvas: { height: 120, alignItems: 'center', justifyContent: 'center' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  mapFooterText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },

  // Reviews
  reviewList: { gap: spacing.md },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  ratingScoreBlock: { flexDirection: 'row', alignItems: 'baseline' },
  ratingBig: { fontSize: fontSizes.display, fontWeight: fontWeights.bold },
  ratingOutOf: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  ratingCount: { fontSize: fontSizes.caption, marginTop: 2 },
  reviewCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewWho: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  reviewName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  reviewDate: { fontSize: fontSizes.caption, marginTop: 1 },
  reviewComment: { fontSize: fontSizes.body, lineHeight: lineHeights.body },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  viewAllText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bottomMeta: { flex: 1 },
  bottomLabel: { fontSize: fontSizes.caption },
  bottomValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  bottomHint: { fontSize: fontSizes.caption, marginTop: 2 },
});
