import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BottomSheet, Card, EmptyState, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getNearbyStations } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';
import { formatRate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'dc' | 'open';
type SortKey = 'nearest' | 'cheapest' | 'rating' | 'available';

const FILTERS: FilterKey[] = ['all', 'dc', 'open'];
const SORTS: { key: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'nearest', icon: 'navigate-outline' },
  { key: 'cheapest', icon: 'pricetag-outline' },
  { key: 'rating', icon: 'star-outline' },
  { key: 'available', icon: 'flash-outline' },
];

/** Rough city-driving ETA from distance (~3 min per km). */
function etaMinutes(distanceKm?: number): number {
  return Math.max(1, Math.round((distanceKm ?? 0) * 3));
}

/** Greyed-out placeholder card shown while the list loads. */
function SkeletonCard() {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.thumb, styles.skel]} />
        <View style={styles.cardBody}>
          <View style={[styles.skel, styles.skelLine, { width: '70%' }]} />
          <View style={[styles.skel, styles.skelLine, { width: '90%' }]} />
          <View style={[styles.skel, styles.skelLine, { width: '50%' }]} />
          <View style={[styles.skel, styles.skelBadge]} />
        </View>
      </View>
    </Card>
  );
}

/**
 * "Tìm trạm" tab — home / discovery list.
 * Floating Liquid Glass filter bar over the list, pull-to-refresh, skeleton
 * loading, sort & notifications sheets, and rich station cards.
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('nearest');
  const [sortOpen, setSortOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNearbyStations();
      setStations(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const visible = useMemo(() => {
    let list = stations;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
      );
    }
    if (filter === 'dc') list = list.filter((s) => s.hasFastCharging);
    if (filter === 'open') list = list.filter((s) => s.isOpen);

    const sorted = [...list];
    if (sort === 'nearest') sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    if (sort === 'cheapest') sorted.sort((a, b) => (a.minRatePerKwh ?? Infinity) - (b.minRatePerKwh ?? Infinity));
    if (sort === 'rating') sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === 'available') sorted.sort((a, b) => b.availableChargers - a.availableChargers);
    return sorted;
  }, [stations, query, filter, sort]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top app bar — brand wordmark + driver role + notifications */}
      <AppHeader
        title="Charge"
        accent="Ops"
        trailing={
          <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => setNotifOpen(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.textBody} />
          </Pressable>
        }
      />

      {/* Search bar (filter/tune icon opens the sort sheet) */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('stationList.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          <Pressable style={styles.filterIconBtn} hitSlop={6} onPress={() => setSortOpen(true)}>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {FILTERS.map((key) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t(`stationList.filters.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {error && !loading ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
            <Text style={styles.stateText}>{t('stationList.error')}</Text>
            <Pressable style={styles.retryBtn} onPress={retry}>
              <Ionicons name="refresh" size={16} color={colors.textInverse} />
              <Text style={styles.retryText}>{t('stationList.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('stationList.nearby')}</Text>
                <View style={styles.updatedRow}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.updated}>{t('stationList.updated', { minutes: 2 })}</Text>
                </View>
              </View>

              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : visible.length === 0 ? (
                <View style={styles.stateBox}>
                  <EmptyState variant="search" />
                  <Text style={styles.stateText}>{t('stationList.empty')}</Text>
                </View>
              ) : (
                visible.map((station) => {
                  const full = station.availableChargers === 0;
                  return (
                    <Pressable
                      key={station.id}
                      onPress={() => navigation.navigate('StationDetail', { stationId: station.id })}
                    >
                      <Card style={styles.card}>
                        <View style={styles.cardTop}>
                          <View style={styles.thumb}>
                            <Ionicons name="flash" size={26} color={colors.primaryDark} />
                          </View>
                          <View style={styles.cardBody}>
                            <View style={styles.nameRow}>
                              <Text style={styles.stationName} numberOfLines={1}>
                                {station.name}
                              </Text>
                              {station.rating !== undefined && (
                                <View style={styles.ratingPill}>
                                  <Ionicons name="star" size={12} color={colors.warning} />
                                  <Text style={styles.ratingText}>{station.rating.toFixed(1)}</Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.addressRow}>
                              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                              <Text style={styles.address} numberOfLines={1}>
                                {station.address}
                              </Text>
                            </View>

                            <View style={styles.metaRow}>
                              {station.minRatePerKwh !== undefined && (
                                <Text style={styles.price}>{formatRate(station.minRatePerKwh)}</Text>
                              )}
                              {station.distanceKm !== undefined && (
                                <>
                                  <Text style={styles.metaDot}>·</Text>
                                  <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                                  <Text style={styles.meta}>
                                    {station.distanceKm} km · {t('stationList.eta', { minutes: etaMinutes(station.distanceKm) })}
                                  </Text>
                                </>
                              )}
                            </View>

                            <StatusBadge
                              style={styles.availability}
                              variant={full ? 'error' : 'success'}
                              dot
                              label={
                                full
                                  ? t('stationList.full')
                                  : t('stationList.ports', {
                                      available: station.availableChargers,
                                      total: station.totalChargers,
                                    })
                              }
                            />
                          </View>
                        </View>

                        <View style={styles.cardActions}>
                          <Pressable
                            style={styles.directionsBtn}
                            hitSlop={6}
                            onPress={() => navigation.navigate('Tabs', { screen: 'Map' })}
                          >
                            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                            <Text style={styles.directionsText}>{t('stationList.directions')}</Text>
                          </Pressable>
                          <View style={styles.viewDetail}>
                            <Text style={styles.viewDetailText}>{t('stationList.viewDetail')}</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  );
                })
              )}

              {!loading && (
                <View style={styles.promo}>
                  <View style={styles.promoIcon}>
                    <Ionicons name="pricetag" size={20} color={colors.primaryDark} />
                  </View>
                  <View style={styles.promoBody}>
                    <Text style={styles.promoTitle}>{t('stationList.promoTitle')}</Text>
                    <Text style={styles.promoText}>{t('stationList.promoBody')}</Text>
                  </View>
                </View>
              )}
            </>
          )}
      </ScrollView>

      {/* Sort sheet */}
      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)} title={t('stationList.sortTitle')}>
        {SORTS.map(({ key, icon }) => {
          const active = sort === key;
          return (
            <Pressable
              key={key}
              style={[styles.sortRow, active && styles.sortRowActive]}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
            >
              <View style={[styles.sortIcon, active && styles.sortIconActive]}>
                <Ionicons name={icon} size={18} color={active ? colors.primary : colors.textMuted} />
              </View>
              <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>
                {t(`stationList.sort.${key}`)}
              </Text>
              {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </Pressable>
          );
        })}
      </BottomSheet>

      {/* Notifications sheet (empty for now) */}
      <BottomSheet visible={notifOpen} onClose={() => setNotifOpen(false)} title={t('stationList.notificationsTitle')}>
        <View style={styles.notifEmpty}>
          <EmptyState variant="notifications" />
          <Text style={styles.stateText}>{t('stationList.notificationsEmpty')}</Text>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: fontSizes.body, color: colors.textStrong, padding: 0 },
  filterIconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textBody },
  chipTextActive: { color: colors.textInverse },

  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  updated: { fontSize: fontSizes.caption, color: colors.textMuted },

  // Empty / error / notifications states
  stateBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  stateText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textInverse },
  notifEmpty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },

  // Skeleton
  skel: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  skelLine: { height: 12, borderRadius: radius.sm, marginBottom: spacing.sm },
  skelBadge: { height: 20, width: 110, borderRadius: radius.full, marginTop: spacing.xs },

  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stationName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ratingText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textStrong },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  address: { flex: 1, fontSize: fontSizes.body, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  price: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  metaDot: { color: colors.textMuted },
  meta: { fontSize: fontSizes.caption, color: colors.textMuted },
  availability: { marginTop: spacing.xs },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  directionsText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primary },
  viewDetail: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },

  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBody: { flex: 1, gap: spacing.xs },
  promoTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },
  promoText: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Sort sheet rows
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  sortRowActive: { backgroundColor: colors.primarySoft },
  sortIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconActive: { backgroundColor: colors.surface },
  sortLabel: { flex: 1, fontSize: fontSizes.body, color: colors.textBody },
  sortLabelActive: { color: colors.textStrong, fontWeight: fontWeights.semibold },
});
