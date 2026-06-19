import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getNearbyStations } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';
import { formatRate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'all' | 'dc' | 'open' | 'cheap';
const FILTERS: FilterKey[] = ['all', 'dc', 'open', 'cheap'];

/** Rough city-driving ETA from distance (~3 min per km). */
function etaMinutes(distanceKm?: number): number {
  return Math.max(1, Math.round((distanceKm ?? 0) * 3));
}

/**
 * "Tìm trạm" tab — home / discovery list.
 * Visily list layout enriched with map-app patterns: live availability,
 * distance + ETA, and a per-card "Chỉ đường" quick action.
 * Loads stations via the service layer (getNearbyStations()).
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    let active = true;
    getNearbyStations().then((data) => {
      if (active) {
        setStations(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

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
    if (filter === 'cheap') {
      list = [...list].sort((a, b) => (a.minRatePerKwh ?? Infinity) - (b.minRatePerKwh ?? Infinity));
    }
    return list;
  }, [stations, query, filter]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top app bar: brand + role label */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="flash" size={20} color={colors.textInverse} />
          </View>
          <View>
            <Text style={styles.brand}>ChargeOps</Text>
            <Text style={styles.role}>{t('stationList.role')}</Text>
          </View>
        </View>
        <Pressable style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.textBody} />
        </Pressable>
      </View>

      {/* Search bar */}
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
          <View style={styles.filterIconBtn}>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
          </View>
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

      <ScrollView style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stationList.nearby')}</Text>
          <View style={styles.updatedRow}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.updated}>{t('stationList.updated', { minutes: 2 })}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : visible.length === 0 ? (
          <Text style={styles.empty}>{t('stationList.empty')}</Text>
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

                  {/* Card actions */}
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

        {/* Promo card */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    color: colors.textStrong,
    lineHeight: lineHeights.heading,
  },
  role: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textMuted, letterSpacing: 1 },
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
  loader: { marginTop: spacing.xl },
  empty: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

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
  price: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primaryDark },
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
});
