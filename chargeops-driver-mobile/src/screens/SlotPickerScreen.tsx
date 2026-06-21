import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { createBooking, getAvailableSlots } from '@/services/bookingService';
import { getChargersByStation, getStationById } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Charger, Slot, Station } from '@/types';
import { formatTime, formatVnd } from '@/utils/format';
import { getUpcomingDates } from '@/utils/slots';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SlotPicker'>;
type Route = RouteProp<RootStackParamList, 'SlotPicker'>;

/**
 * "Chọn khung giờ" — step 3 of the booking flow.
 * Frontend generates the date list + hourly slot grid (see utils/slots); the
 * chosen slot's ISO timestamp is sent to the backend via createBooking().
 */
export function SlotPickerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const dates = useMemo(() => getUpcomingDates(), []);
  const weekdays = t('slotPicker.weekdays', { returnObjects: true }) as string[];

  const [station, setStation] = useState<Station | null>(null);
  const [charger, setCharger] = useState<Charger | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selected, setSelected] = useState<Slot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load station + resolve which charger to book.
  useEffect(() => {
    let active = true;
    Promise.all([getStationById(params.stationId), getChargersByStation(params.stationId)]).then(
      ([s, chargers]) => {
        if (!active) return;
        setStation(s);
        const picked =
          chargers.find((c) => c.id === params.chargerId) ??
          chargers.find((c) => c.status === 'AVAILABLE') ??
          chargers[0] ??
          null;
        setCharger(picked);
      },
    );
    return () => {
      active = false;
    };
  }, [params.stationId, params.chargerId]);

  // Load the slot grid whenever the charger or selected date changes.
  useEffect(() => {
    if (!charger) return;
    let active = true;
    setSlotsLoading(true);
    setSelected([]); // selection is per-day; reset when the date changes
    getAvailableSlots(charger.id, selectedDate.toISOString()).then((data) => {
      if (active) {
        setSlots(data);
        setSlotsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [charger, selectedDate]);

  function toggleSlot(slot: Slot) {
    setSelected((prev) =>
      prev.some((s) => s.id === slot.id) ? prev.filter((s) => s.id !== slot.id) : [...prev, slot],
    );
  }

  const sortedSelected = useMemo(
    () => [...selected].sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [selected],
  );
  const totalPrice = useMemo(() => selected.reduce((sum, s) => sum + s.price, 0), [selected]);

  async function handleContinue() {
    if (selected.length === 0 || !charger) return;
    setSubmitting(true);
    try {
      const booking = await createBooking({
        chargerId: charger.id,
        slots: sortedSelected.map((s) => ({ startAt: s.startAt, endAt: s.endAt, price: s.price })),
        totalPrice,
      });
      navigation.navigate('QRCheckIn', { bookingId: booking.id });
    } finally {
      setSubmitting(false);
    }
  }

  const monthLabel = t('slotPicker.monthYear', {
    month: selectedDate.getMonth() + 1,
    year: selectedDate.getFullYear(),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom header with our own glass back button */}
      <View style={styles.header}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={colors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
        </GlassButton>
        <Text style={styles.headerTitle}>{t('slotPicker.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date picker */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('slotPicker.selectDate')}</Text>
          </View>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {dates.map((d) => {
            const active = d.getTime() === selectedDate.getTime();
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setSelectedDate(d)}
                style={[styles.dateCard, active && styles.dateCardActive]}
              >
                <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                  {weekdays[d.getDay()]}
                </Text>
                <Text style={[styles.dateDay, active && styles.dateTextActive]}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Charger summary */}
        {charger && station && (
          <View style={styles.chargerCard}>
            <View style={styles.chargerIcon}>
              <Ionicons name="flash" size={22} color={colors.primaryDark} />
            </View>
            <View style={styles.chargerBody}>
              <Text style={styles.chargerName}>{charger.name}</Text>
              <Text style={styles.chargerSub} numberOfLines={1}>
                {station.name}
              </Text>
              <View style={styles.chargerMetaRow}>
                <StatusBadge variant="success" label={charger.connectorType} />
                <Text style={styles.chargerMeta}>
                  {charger.powerKw} kW
                  {charger.status === 'AVAILABLE' ? ` · ${t('slotPicker.chargerStatusActive')}` : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Slot grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('slotPicker.availableSlots')}</Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>{t('slotPicker.legendAvailable')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
              <Text style={styles.legendText}>{t('slotPicker.legendMine')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
              <Text style={styles.legendText}>{t('slotPicker.legendBooked')}</Text>
            </View>
          </View>
        </View>

        {slotsLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : slots.length === 0 ? (
          <Text style={styles.empty}>{t('slotPicker.empty')}</Text>
        ) : (
          <View style={styles.grid}>
            {slots.map((slot) => {
              const available = slot.status === 'AVAILABLE';
              const mine = slot.status === 'MINE';
              const dimmed = slot.status === 'OCCUPIED' || slot.status === 'UNAVAILABLE';
              const isSelected = selected.some((s) => s.id === slot.id);
              return (
                <Pressable
                  key={slot.id}
                  disabled={!available}
                  onPress={() => toggleSlot(slot)}
                  style={[
                    styles.slot,
                    isSelected && styles.slotSelected,
                    mine && styles.slotMine,
                    dimmed && styles.slotDisabled,
                  ]}
                >
                  <View style={styles.slotTop}>
                    <View style={styles.slotTimeRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={dimmed ? colors.textMuted : colors.textBody}
                      />
                      <Text style={[styles.slotStart, dimmed && styles.slotMutedText]}>
                        {formatTime(slot.startAt)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.slotEnd, dimmed && styles.slotMutedText]}>
                    {t('slotPicker.until', { time: formatTime(slot.endAt) })}
                  </Text>
                  <Text style={[styles.slotPrice, dimmed && styles.slotMutedText]}>
                    {formatVnd(slot.price)}
                  </Text>
                  {slot.status === 'OCCUPIED' && (
                    <StatusBadge variant="neutral" label={t('slotPicker.status.OCCUPIED')} />
                  )}
                  {slot.status === 'UNAVAILABLE' && (
                    <StatusBadge variant="warning" label={t('slotPicker.status.UNAVAILABLE')} />
                  )}
                  {slot.status === 'MINE' && (
                    <StatusBadge variant="info" label={t('slotPicker.status.MINE')} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Refund policy */}
        <View style={styles.refundCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
          <View style={styles.refundBody}>
            <Text style={styles.refundTitle}>{t('slotPicker.refundTitle')}</Text>
            <Text style={styles.refundText}>{t('slotPicker.refundBody')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer: selection summary + gated CTA */}
      <View style={styles.footer}>
        {selected.length === 0 ? (
          <View style={styles.hint}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.hintText}>{t('slotPicker.selectHint')}</Text>
          </View>
        ) : (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryCount}>
                {t('slotPicker.selectedCount', { count: selected.length })}
              </Text>
              <View style={styles.summaryTotalBlock}>
                <Text style={styles.summaryTotalLabel}>{t('slotPicker.total')}</Text>
                <Text style={styles.summaryTotal}>{formatVnd(totalPrice)}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.summaryChips}
            >
              {sortedSelected.map((s) => (
                <Pressable key={s.id} style={styles.summaryChip} onPress={() => toggleSlot(s)}>
                  <Text style={styles.summaryChipText}>{formatTime(s.startAt)}</Text>
                  <Ionicons name="close" size={14} color={colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        <AppButton
          label={t('slotPicker.cta')}
          disabled={selected.length === 0}
          loading={submitting}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  monthLabel: { fontSize: fontSizes.body, color: colors.textMuted },

  // Date strip
  dateRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  dateCard: {
    width: 64,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateWeekday: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium, color: colors.textMuted },
  dateDay: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  dateTextActive: { color: colors.textInverse },

  // Charger summary
  chargerCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  chargerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargerBody: { flex: 1, gap: spacing.xs },
  chargerName: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  chargerSub: { fontSize: fontSizes.caption, color: colors.textMuted },
  chargerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  chargerMeta: { fontSize: fontSizes.caption, color: colors.textMuted },

  // Legend
  legend: { flexDirection: 'row', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: radius.full },
  legendText: { fontSize: fontSizes.caption, color: colors.textMuted },

  loader: { marginVertical: spacing.xl },
  empty: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },

  // Slot grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  slot: {
    width: '48.5%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  slotSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  slotMine: { borderColor: colors.info, backgroundColor: `${colors.info}1A` },
  slotDisabled: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  slotTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  slotStart: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  slotEnd: { fontSize: fontSizes.caption, color: colors.textMuted },
  slotPrice: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  slotMutedText: { color: colors.textMuted },

  // Refund policy (amber)
  refundCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: `${colors.warning}1A`,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  refundBody: { flex: 1, gap: spacing.xs },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.warning },
  refundText: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hintText: { fontSize: fontSizes.body, color: colors.textMuted },

  // Selection summary
  summary: { gap: spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  summaryCount: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  summaryTotalBlock: { alignItems: 'flex-end' },
  summaryTotalLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  summaryTotal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  summaryChips: { gap: spacing.sm, paddingVertical: spacing.xs },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  summaryChipText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textStrong },
});
