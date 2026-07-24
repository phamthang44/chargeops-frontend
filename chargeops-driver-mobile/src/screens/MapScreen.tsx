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

import { AppHeader, StationPin, StationThumb, useTabBarInset, type PinStatus } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getNearbyStations } from '@/services/stationService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PIN_SPOTS: { top: DimensionValue; left: DimensionValue }[] = [
  { top: '22%', left: '24%' },
  { top: '38%', left: '60%' },
  { top: '30%', left: '80%' },
  { top: '60%', left: '34%' },
  { top: '68%', left: '70%' },
];

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - spacing.lg * 2 - 28;
const SNAP = CARD_W + spacing.md;

function pinStatus(s: Station): PinStatus {
  if (s.isOpen === false) return 'closed';
  if (s.availableConnectors <= 0) return 'full';
  if (s.availableConnectors <= 1) return 'busy';
  return 'available';
}

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
 * Faux map canvas backdrop — uses real map-colored ground (#F8FAFC) as requested.
 */
function FauxMap() {
  return (
    <View style={[styles.mapCanvas, { backgroundColor: '#F8FAFC' }]}>
      {MAP_BLOCKS.map((b, i) => (
        <View
          key={i}
          style={[
            styles.block,
            {
              top: b.top,
              left: b.left,
              width: b.w,
              height: b.h,
              backgroundColor: '#E2E8F0',
            },
          ]}
        />
      ))}
      <View style={[styles.street, styles.streetH, { top: '34%', backgroundColor: '#E2E8F0' }]} />
      <View style={[styles.street, styles.streetH, { top: '72%', backgroundColor: '#E2E8F0' }]} />
      <View style={[styles.street, styles.streetV, { left: '38%', backgroundColor: '#E2E8F0' }]} />
      <View style={[styles.street, styles.streetV, { left: '76%', backgroundColor: '#E2E8F0' }]} />
      <View style={[styles.park, { top: '24%', left: '44%', backgroundColor: '#DCFCE7' }]} />
    </View>
  );
}

/**
 * "Bản đồ" tab — map discovery view with neutral map canvas and floating theme-aware controls.
 */
export function MapScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  // The carousel is anchored to the bottom edge, so it has to sit above the bar.
  const tabInset = useTabBarInset();

  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    getNearbyStations({}, { limit: 40 }).then((page) => {
      if (active) setStations(page.items);
    });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    if (!query.trim()) return stations;
    const q = query.toLowerCase();
    return stations.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
    );
  }, [stations, query]);

  const selectStation = (index: number) => {
    const idx = Math.max(0, Math.min(index, visible.length - 1));
    setSelected(idx);
    scrollRef.current?.scrollTo({ x: idx * SNAP, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    setSelected(Math.max(0, Math.min(index, visible.length - 1)));
  };

  const recenter = () => selectStation(0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <AppHeader title={t('map.title')} />

      <View style={styles.mapWrap}>
        {/* Faux map canvas */}
        <View style={styles.map}>
          <FauxMap />

          {/* Current-location dot */}
          <View style={styles.meDot} pointerEvents="none">
            <View style={[styles.meRing, { backgroundColor: themeColors.info }]} />
            <View style={[styles.meCore, { backgroundColor: themeColors.info, borderColor: '#FFFFFF' }]} />
          </View>

          {/* Station pins */}
          {visible.slice(0, PIN_SPOTS.length).map((s, i) => {
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
        <View style={[styles.searchFloat, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textStrong }]}
            placeholder={t('map.searchPlaceholder')}
            placeholderTextColor={themeColors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Recenter control */}
        <Pressable
          style={[styles.recenter, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          hitSlop={8}
          onPress={recenter}
        >
          <Ionicons name="locate" size={20} color={themeColors.primary} />
        </Pressable>

        {/* Station carousel */}
        {visible.length === 0 ? (
          <View
            style={[
              styles.noResults,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border, bottom: tabInset },
            ]}
          >
            <Text style={[styles.noResultsText, { color: themeColors.textMuted }]}>{t('map.noResults')}</Text>
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
            style={[styles.carouselWrap, { bottom: tabInset }]}
          >
            {visible.map((s, i) => {
              const full = s.availableConnectors === 0;
              const isSelected = i === selected;
              return (
                <Pressable
                  key={s.id}
                  style={[
                    styles.card,
                    {
                      width: CARD_W,
                      backgroundColor: themeColors.surface,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                    },
                    isSelected && styles.cardActive,
                  ]}
                  onPress={() => selectStation(i)}
                >
                  <View style={styles.cardHead}>
                    <StationThumb size={44} />
                    <View style={styles.cardHeadBody}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardName, { color: themeColors.textStrong }]} numberOfLines={1}>
                          {s.name}
                        </Text>
                        {!!s.rating && (
                          <View style={styles.rating}>
                            <Ionicons name="star" size={12} color={themeColors.warning} />
                            <Text style={[styles.ratingText, { color: themeColors.textStrong }]}>{s.rating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.cardAddr, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {s.address}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={[styles.availPill, { backgroundColor: themeColors.surfaceAlt }]}>
                      <View
                        style={[styles.availDot, { backgroundColor: full ? themeColors.error : themeColors.primary }]}
                      />
                      <Text style={[styles.availText, { color: full ? themeColors.error : themeColors.primaryDark }]}>
                        {full ? t('map.full') : t('map.portsFree', { count: s.availableConnectors })}
                      </Text>
                    </View>
                    {s.distanceKm != null && (
                      <Text style={[styles.cardDistance, { color: themeColors.textMuted }]}>{s.distanceKm.toFixed(1)} km</Text>
                    )}
                    <Pressable
                      style={[styles.detailBtn, { backgroundColor: themeColors.primary }]}
                      onPress={() => navigation.navigate('StationDetail', { stationId: s.id })}
                    >
                      <Text style={[styles.detailBtnText, { color: '#FFFFFF' }]}>{t('map.viewDetail')}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
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
  container: { flex: 1 },
  mapWrap: { flex: 1, position: 'relative' },

  map: { flex: 1, overflow: 'hidden' },
  mapCanvas: { flex: 1, position: 'relative' },
  block: { position: 'absolute', borderRadius: radius.sm },
  street: { position: 'absolute', opacity: 0.7 },
  streetH: { left: 0, right: 0, height: 10 },
  streetV: { top: 0, bottom: 0, width: 10 },
  park: { position: 'absolute', width: 78, height: 62, borderRadius: radius.md, opacity: 0.7 },
  pin: { position: 'absolute', transform: [{ translateX: -20 }, { translateY: -40 }] },

  meDot: { position: 'absolute', top: '50%', left: '46%', alignItems: 'center', justifyContent: 'center' },
  meRing: { position: 'absolute', width: 28, height: 28, borderRadius: radius.full, opacity: 0.18 },
  meCore: { width: 14, height: 14, borderRadius: radius.full, borderWidth: 2.5 },

  searchFloat: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: fontSizes.body, padding: 0 },

  recenter: {
    position: 'absolute',
    top: 76,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  noResults: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: { fontSize: fontSizes.body },

  // `bottom` is applied inline — it clears the floating tab bar.
  carouselWrap: { position: 'absolute', left: 0, right: 0, flexGrow: 0 },
  carousel: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardActive: { borderWidth: 2 },
  cardHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  cardHeadBody: { flex: 1, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardName: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  cardAddr: { fontSize: fontSizes.caption },

  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  availDot: { width: 6, height: 6, borderRadius: radius.full },
  availText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  cardDistance: { fontSize: fontSizes.caption },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailBtnText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
});
