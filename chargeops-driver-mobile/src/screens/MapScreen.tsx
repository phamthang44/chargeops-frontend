import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, StationPin, StationThumb, type PinStatus } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getNearbyStations } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Faux pin coordinates on the preview canvas (real lat/long → screen later).
const PIN_SPOTS: { top: DimensionValue; left: DimensionValue }[] = [
  { top: '22%', left: '24%' },
  { top: '38%', left: '60%' },
  { top: '30%', left: '80%' },
  { top: '60%', left: '34%' },
  { top: '68%', left: '70%' },
];

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - spacing.lg * 2 - 28; // leave a peek of the next card
const SNAP = CARD_W + spacing.md;

/** Derive a pin color/status from a station's live availability. */
function pinStatus(s: Station): PinStatus {
  if (s.isOpen === false) return 'closed';
  if (s.availableConnectors <= 0) return 'full';
  if (s.availableConnectors <= 1) return 'busy';
  return 'available';
}

/** Decorative city blocks — grey "buildings" on a white ground. */
const MAP_BLOCKS: { top: DimensionValue; left: DimensionValue; w: number; h: number }[] = [
  { top: '9%', left: '7%', w: 74, h: 52 },
  { top: '12%', left: '46%', w: 58, h: 66 },
  { top: '8%', left: '74%', w: 66, h: 44 },
  { top: '44%', left: '10%', w: 60, h: 72 },
  { top: '52%', left: '52%', w: 84, h: 58 },
  { top: '46%', left: '80%', w: 44, h: 80 },
  { top: '76%', left: '20%', w: 70, h: 46 },
  { top: '78%', left: '58%', w: 56, h: 50 },
];

/**
 * Stylized placeholder for the interactive map (real Google Maps is out of
 * scope). Abstract grey blocks + a couple of streets + one green "park" read as
 * a minimalist map rather than graph paper — swapped for a real <MapView> later
 * without touching the pins/carousel logic layered above it.
 */
function FauxMap() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Streets */}
      <View style={[styles.street, styles.streetH, { top: '37%' }]} />
      <View style={[styles.street, styles.streetH, { top: '70%' }]} />
      <View style={[styles.street, styles.streetV, { left: '36%' }]} />
      {/* Park (subtle brand hint) */}
      <View style={[styles.park, { top: '30%', left: '60%' }]} />
      {/* Blocks */}
      {MAP_BLOCKS.map((b, i) => (
        <View key={i} style={[styles.block, { top: b.top, left: b.left, width: b.w, height: b.h }]} />
      ))}
    </View>
  );
}

/**
 * "Bản đồ" tab. The real interactive map (Google Maps) is out of scope, so this
 * shows a faux map canvas with station pins synced to a swipeable card carousel,
 * a floating search bar, and a recenter control. Swapping in a real <MapView>
 * later only replaces the faux-map View — the carousel/search logic stays.
 */
export function MapScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    getNearbyStations().then((data) => {
      if (active) setStations(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? stations.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
      : stations;
    return list.slice(0, PIN_SPOTS.length);
  }, [stations, query]);

  // Keep the selection valid as the filtered set changes.
  useEffect(() => {
    setSelected((i) => Math.min(i, Math.max(0, visible.length - 1)));
  }, [visible.length]);

  const selectStation = (index: number) => {
    setSelected(index);
    scrollRef.current?.scrollTo({ x: index * SNAP, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    setSelected(Math.max(0, Math.min(index, visible.length - 1)));
  };

  const recenter = () => selectStation(0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title={t('map.title')} />

      <View style={styles.mapWrap}>
        {/* Faux map canvas */}
        <View style={styles.map}>
          <FauxMap />

          {/* Current-location dot */}
          <View style={styles.meDot} pointerEvents="none">
            <View style={styles.meRing} />
            <View style={styles.meCore} />
          </View>

          {/* Station pins */}
          {visible.map((s, i) => {
            const isSel = i === selected;
            return (
              <Pressable
                key={s.id}
                style={[styles.pin, { top: PIN_SPOTS[i].top, left: PIN_SPOTS[i].left }]}
                onPress={() => selectStation(i)}
              >
                <StationPin status={pinStatus(s)} selected={isSel} size={isSel ? 54 : 40} />
              </Pressable>
            );
          })}
        </View>

        {/* Floating search bar */}
        <View style={styles.searchFloat}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('map.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Recenter control */}
        <Pressable style={styles.recenter} hitSlop={8} onPress={recenter}>
          <Ionicons name="locate" size={20} color={colors.primary} />
        </Pressable>

        {/* Station carousel synced with the selected pin */}
        {visible.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>{t('map.noResults')}</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP}
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumEnd}
            contentContainerStyle={styles.carousel}
            style={styles.carouselWrap}
          >
            {visible.map((s, i) => {
              const full = s.availableConnectors === 0;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.card, { width: CARD_W }, i === selected && styles.cardActive]}
                  onPress={() => selectStation(i)}
                >
                  <View style={styles.cardHead}>
                    <StationThumb size={44} />
                    <View style={styles.cardHeadBody}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        {!!s.rating && (
                          <View style={styles.rating}>
                            <Ionicons name="star" size={12} color={colors.warning} />
                            <Text style={styles.ratingText}>{s.rating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardAddr} numberOfLines={1}>
                        {s.address}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.availPill}>
                      <View
                        style={[styles.availDot, { backgroundColor: full ? colors.error : colors.primary }]}
                      />
                      <Text style={[styles.availText, { color: full ? colors.error : colors.primaryDark }]}>
                        {full ? t('map.full') : t('map.portsFree', { count: s.availableConnectors })}
                      </Text>
                    </View>
                    {s.distanceKm != null && (
                      <Text style={styles.cardDistance}>{s.distanceKm.toFixed(1)} km</Text>
                    )}
                    <Pressable
                      style={styles.detailBtn}
                      onPress={() => navigation.navigate('StationDetail', { stationId: s.id })}
                    >
                      <Text style={styles.detailBtnText}>{t('map.viewDetail')}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textInverse} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1, position: 'relative' },

  map: { flex: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  // Stylized map decor
  block: { position: 'absolute', borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  street: { position: 'absolute', backgroundColor: colors.surfaceAlt, opacity: 0.7 },
  streetH: { left: 0, right: 0, height: 10 },
  streetV: { top: 0, bottom: 0, width: 10 },
  park: { position: 'absolute', width: 78, height: 62, borderRadius: radius.md, backgroundColor: colors.primarySoft, opacity: 0.7 },
  pin: { position: 'absolute', transform: [{ translateX: -20 }, { translateY: -40 }] },

  // Current-location dot
  meDot: { position: 'absolute', top: '50%', left: '46%', alignItems: 'center', justifyContent: 'center' },
  meRing: { position: 'absolute', width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.info, opacity: 0.18 },
  meCore: { width: 14, height: 14, borderRadius: radius.full, backgroundColor: colors.info, borderWidth: 2.5, borderColor: colors.surface },

  // Floating search
  searchFloat: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: fontSizes.body, color: colors.textStrong, padding: 0 },

  // Recenter FAB (sits just above the carousel)
  recenter: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 168,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // Carousel
  carouselWrap: { position: 'absolute', left: 0, right: 0, bottom: spacing.lg },
  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardActive: { borderColor: colors.primary, borderWidth: 2 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardHeadBody: { flex: 1, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textBody },
  cardAddr: { fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: lineHeights.caption },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  availDot: { width: 7, height: 7, borderRadius: radius.full },
  availText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  cardDistance: { fontSize: fontSizes.caption, color: colors.textMuted },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailBtnText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textInverse },

  noResults: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  noResultsText: { fontSize: fontSizes.body, color: colors.textMuted },
});
