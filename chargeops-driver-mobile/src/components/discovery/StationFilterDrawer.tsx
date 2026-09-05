import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ConnectorType } from '@/types';

export interface DiscoveryFilterState {
  connectorTypes: ConnectorType[];
  currentType: 'AC' | 'DC' | null;
  minPowerKw?: number;
  availableOnly: boolean;
  openOnly: boolean;
  maxDistanceKm?: number;
}

interface StationFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  filters: DiscoveryFilterState;
  onApply: (filters: DiscoveryFilterState) => void;
  onReset: () => void;
  totalResults?: number;
}

const CONNECTOR_OPTIONS: {
  type: ConnectorType;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: 'CCS2', label: 'CCS 2', sub: 'DC Siêu nhanh', icon: 'flash' },
  { type: 'TYPE2', label: 'Type 2 (Mennekes)', sub: 'AC Tiêu chuẩn', icon: 'battery-charging' },
  { type: 'CHADEMO', label: 'CHAdeMO', sub: 'DC Phổ thông', icon: 'car-sport' },
  { type: 'GBT', label: 'GB/T', sub: 'DC/AC Chuẩn TQ', icon: 'hardware-chip' },
];

const POWER_TIERS: { key: string; label: string; minPowerKw?: number; currentType?: 'AC' | 'DC' }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ac', label: 'AC (<22kW)', currentType: 'AC' },
  { key: 'dcFast', label: 'DC Nhanh (≥50kW)', minPowerKw: 50, currentType: 'DC' },
  { key: 'dcSuperFast', label: 'DC Siêu nhanh (≥120kW)', minPowerKw: 120, currentType: 'DC' },
];

const DISTANCE_OPTIONS: { label: string; value?: number }[] = [
  { label: 'Tất cả' },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
];

/**
 * Modern Compact Station Filter Drawer (FR02 discovery filter).
 * Dynamic theme aware for both Light and Dark modes.
 */
export function StationFilterDrawer({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  totalResults,
}: StationFilterDrawerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();
  const rise = useRef(new Animated.Value(0)).current;

  // Local draft state while drawer is open
  const [draftConnectors, setDraftConnectors] = useState<ConnectorType[]>(filters.connectorTypes);
  const [draftCurrentType, setDraftCurrentType] = useState<'AC' | 'DC' | null>(filters.currentType);
  const [draftMinPower, setDraftMinPower] = useState<number | undefined>(filters.minPowerKw);
  const [draftAvailableOnly, setDraftAvailableOnly] = useState(filters.availableOnly);
  const [draftOpenOnly, setDraftOpenOnly] = useState(filters.openOnly);
  const [draftMaxDistance, setDraftMaxDistance] = useState<number | undefined>(filters.maxDistanceKm);

  useEffect(() => {
    if (visible) {
      setDraftConnectors(filters.connectorTypes);
      setDraftCurrentType(filters.currentType);
      setDraftMinPower(filters.minPowerKw);
      setDraftAvailableOnly(filters.availableOnly);
      setDraftOpenOnly(filters.openOnly);
      setDraftMaxDistance(filters.maxDistanceKm);

      rise.setValue(32);
      Animated.timing(rise, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [visible, filters, rise]);

  const toggleConnector = (type: ConnectorType) => {
    setDraftConnectors((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type],
    );
  };

  const handleApply = () => {
    onApply({
      connectorTypes: draftConnectors,
      currentType: draftCurrentType,
      minPowerKw: draftMinPower,
      availableOnly: draftAvailableOnly,
      openOnly: draftOpenOnly,
      maxDistanceKm: draftMaxDistance,
    });
    onClose();
  };

  const handleResetLocal = () => {
    setDraftConnectors([]);
    setDraftCurrentType(null);
    setDraftMinPower(undefined);
    setDraftAvailableOnly(false);
    setDraftOpenOnly(false);
    setDraftMaxDistance(undefined);
    onReset();
  };

  const activeCount =
    draftConnectors.length +
    (draftCurrentType ? 1 : 0) +
    (draftMinPower ? 1 : 0) +
    (draftAvailableOnly ? 1 : 0) +
    (draftOpenOnly ? 1 : 0) +
    (draftMaxDistance ? 1 : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <BlurView
          intensity={30}
          tint={isDark ? 'dark' : 'regular'}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
              borderColor: isDark ? '#2A312F' : '#E5E7EB',
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY: rise }],
            },
          ]}
        >
          {/* Handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: isDark ? '#2A312F' : '#E5E7EB' },
            ]}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('stationList.filterTitle', 'Bộ lọc trạm sạc')}
              </Text>
              {activeCount > 0 && (
                <View style={[styles.activeBadge, { backgroundColor: themeColors.primarySoft }]}>
                  <Text style={[styles.activeBadgeText, { color: themeColors.primaryDark }]}>
                    {t('stationList.activeCount', { count: activeCount, defaultValue: `${activeCount} đang chọn` })}
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1F2625' : '#F3F4F6',
                },
              ]}
              hitSlop={8}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={themeColors.textBody} />
            </Pressable>
          </View>

          {/* Body Scroll */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Chuẩn Cổng Sạc */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                {t('stationList.drawer.connectorTypes', 'Chuẩn cổng sạc khả dụng')}
              </Text>
              <View style={styles.socketsGrid}>
                {CONNECTOR_OPTIONS.map((item) => {
                  const active = draftConnectors.includes(item.type);
                  return (
                    <Pressable
                      key={item.type}
                      style={[
                        styles.socketCard,
                        {
                          backgroundColor: active
                            ? isDark
                              ? '#113322'
                              : '#ECFDF5'
                            : isDark
                              ? '#1F2625'
                              : '#F9FAFB',
                          borderColor: active
                            ? themeColors.primary
                            : isDark
                              ? '#2A312F'
                              : '#E5E7EB',
                        },
                      ]}
                      onPress={() => toggleConnector(item.type)}
                    >
                      <View style={styles.socketTop}>
                        <View
                          style={[
                            styles.socketIconWrap,
                            {
                              backgroundColor: active
                                ? themeColors.primary
                                : isDark
                                  ? '#161B1A'
                                  : '#FFFFFF',
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={16}
                            color={active ? '#FFFFFF' : themeColors.textMuted}
                          />
                        </View>
                        {active && (
                          <Ionicons name="checkmark-circle" size={18} color={themeColors.primary} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.socketLabel,
                          {
                            color: active
                              ? isDark
                                ? '#6EE6A0'
                                : themeColors.primaryDark
                              : themeColors.textStrong,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={[styles.socketSub, { color: themeColors.textMuted }]}>
                        {t(`stationList.drawer.connectorSubs.${item.type}`, item.sub)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Công Suất Sạc */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                {t('stationList.drawer.minPower', 'Công suất sạc tối thiểu')}
              </Text>
              <View style={styles.powerPills}>
                {POWER_TIERS.map((tier, idx) => {
                  const active =
                    draftMinPower === tier.minPowerKw &&
                    draftCurrentType === (tier.currentType ?? null);
                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.powerPill,
                        {
                          backgroundColor: active
                            ? isDark
                              ? '#113322'
                              : '#ECFDF5'
                            : isDark
                              ? '#1F2625'
                              : '#F9FAFB',
                          borderColor: active
                            ? themeColors.primary
                            : isDark
                              ? '#2A312F'
                              : '#E5E7EB',
                        },
                      ]}
                      onPress={() => {
                        setDraftMinPower(tier.minPowerKw);
                        setDraftCurrentType(tier.currentType ?? null);
                      }}
                    >
                      <Text
                        style={[
                          styles.powerPillText,
                          {
                            color: active
                              ? isDark
                                ? '#6EE6A0'
                                : themeColors.primaryDark
                              : themeColors.textBody,
                          },
                          active && styles.powerPillTextActive,
                        ]}
                      >
                        {t(`stationList.drawer.${tier.key}`, tier.label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Trạng Thái Hoạt Động */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                {t('stationList.drawer.stationStatus', 'Trạng thái trạm')}
              </Text>
              <View style={styles.togglesRow}>
                <Pressable
                  style={[
                    styles.toggleChip,
                    {
                      backgroundColor: draftAvailableOnly
                        ? isDark
                          ? '#113322'
                          : '#ECFDF5'
                        : isDark
                          ? '#1F2625'
                          : '#F9FAFB',
                      borderColor: draftAvailableOnly
                        ? themeColors.primary
                        : isDark
                          ? '#2A312F'
                          : '#E5E7EB',
                    },
                  ]}
                  onPress={() => setDraftAvailableOnly((v) => !v)}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={draftAvailableOnly ? themeColors.primary : themeColors.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      {
                        color: draftAvailableOnly
                          ? isDark
                            ? '#6EE6A0'
                            : themeColors.primaryDark
                          : themeColors.textBody,
                      },
                      draftAvailableOnly && styles.toggleTextActive,
                    ]}
                  >
                    {t('stationList.drawer.availableOnly', 'Chỉ trạm còn cổng trống')}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.toggleChip,
                    {
                      backgroundColor: draftOpenOnly
                        ? isDark
                          ? '#113322'
                          : '#ECFDF5'
                        : isDark
                          ? '#1F2625'
                          : '#F9FAFB',
                      borderColor: draftOpenOnly
                        ? themeColors.primary
                        : isDark
                          ? '#2A312F'
                          : '#E5E7EB',
                    },
                  ]}
                  onPress={() => setDraftOpenOnly((v) => !v)}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={draftOpenOnly ? themeColors.primary : themeColors.textMuted}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      {
                        color: draftOpenOnly
                          ? isDark
                            ? '#6EE6A0'
                            : themeColors.primaryDark
                          : themeColors.textBody,
                      },
                      draftOpenOnly && styles.toggleTextActive,
                    ]}
                  >
                    {t('stationList.drawer.openOnly', 'Đang mở cửa')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Section 4: Bán Kính Tìm Kiếm */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                {t('stationList.drawer.maxDistance', 'Khoảng cách tối đa')}
              </Text>
              <View style={styles.distanceRow}>
                {DISTANCE_OPTIONS.map((item, idx) => {
                  const active = draftMaxDistance === item.value;
                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.distancePill,
                        {
                          backgroundColor: active
                            ? isDark
                              ? '#113322'
                              : '#ECFDF5'
                            : isDark
                              ? '#1F2625'
                              : '#F9FAFB',
                          borderColor: active
                            ? themeColors.primary
                            : isDark
                              ? '#2A312F'
                              : '#E5E7EB',
                        },
                      ]}
                      onPress={() => setDraftMaxDistance(item.value)}
                    >
                      <Text
                        style={[
                          styles.distanceText,
                          {
                            color: active
                              ? isDark
                                ? '#6EE6A0'
                                : themeColors.primaryDark
                              : themeColors.textBody,
                          },
                          active && styles.distanceTextActive,
                        ]}
                      >
                        {item.value ? `${item.value} km` : t('stationList.drawer.all', 'Tất cả')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Sticky Actions Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? '#2A312F' : '#F3F4F6',
              },
            ]}
          >
            <Pressable
              style={[
                styles.resetBtn,
                {
                  backgroundColor: isDark ? '#1F2625' : '#F3F4F6',
                },
              ]}
              onPress={handleResetLocal}
            >
              <Ionicons name="refresh" size={16} color={themeColors.textBody} />
              <Text style={[styles.resetText, { color: themeColors.textBody }]}>
                {t('stationList.drawer.reset', 'Đặt lại')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.applyBtn,
                {
                  backgroundColor: themeColors.primary,
                },
              ]}
              onPress={handleApply}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.applyText}>
                {t('stationList.drawer.apply', 'Áp dụng')} {totalResults !== undefined ? `(${totalResults})` : ''}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%' as const,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitleBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, lineHeight: 24, includeFontPadding: false },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: { fontSize: 11, fontWeight: fontWeights.bold, lineHeight: 12, includeFontPadding: false },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { maxHeight: 460 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, lineHeight: 20, includeFontPadding: false },

  // Sockets Grid
  socketsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socketCard: {
    width: '48%' as const,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 4,
  },
  socketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  socketIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socketLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, lineHeight: 20, includeFontPadding: false, marginTop: 4 },
  socketSub: { fontSize: 11, lineHeight: 14, includeFontPadding: false },

  // Power Pills
  powerPills: { gap: spacing.xs + 2 },
  powerPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  powerPillText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, lineHeight: 20, includeFontPadding: false },
  powerPillTextActive: { fontWeight: fontWeights.bold },

  // Toggles
  togglesRow: { gap: spacing.xs + 2 },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toggleText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, lineHeight: 20, includeFontPadding: false },
  toggleTextActive: { fontWeight: fontWeights.bold },

  // Distance
  distanceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  distancePill: {
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceText: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium, lineHeight: 16, includeFontPadding: false },
  distanceTextActive: { fontWeight: fontWeights.bold },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderRadius: radius.full,
  },
  resetText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, lineHeight: 20, includeFontPadding: false },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.full,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: '#FFFFFF', lineHeight: 20, includeFontPadding: false },
});
