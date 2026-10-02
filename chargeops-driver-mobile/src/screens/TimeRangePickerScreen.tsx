import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StationPolicyCard,
  TimePickerDateSelector,
  TimePickerDurationChips,
  TimePickerHeader,
  TimePickerHelpModal,
  TimePickerQuoteCard,
  TimePickerSlotGrid,
  TimePickerStationBrief,
  TimePickerStickyBar,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useTimeRangePicker } from '@/hooks/useTimeRangePicker';
import { spacing } from '@/theme';

/**
 * "Chọn khung giờ" — Step 2/3 of the booking flow.
 * Redesigned for rich, friendly, ergonomic mobile EV charging experience.
 */
export function TimeRangePickerScreen() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const {
    dates,
    weekdays,
    selectedDate,
    setSelectedDate,
    station,
    chargePoint,
    connector,
    availability,
    loading,
    durationChoices,
    durationTargetMin,
    minDurationMin,
    maxDurationMin,
    durationStepMin,
    selectDurationChoice,
    timeFilter,
    setTimeFilter,
    periodCounts,
    slots,
    visibleSlots,
    canFitFrom,
    tapSlot,
    hasSel,
    selStart,
    selEnd,
    startAt,
    endMin,
    durationMin,
    slotCount,
    isCrossDay,
    quote,
    meetsMinDuration,
    hasValidPolicy,
    canContinue,
    handleContinue,
    handleResetSelection,
    handleBack,
    helpModalVisible,
    setHelpModalVisible,
    durationLabel,
  } = useTimeRangePicker();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      {/* Upgraded Navigation Header with Flow Indicator & Progress Track */}
      <TimePickerHeader
        onBack={handleBack}
        onOpenHelp={() => setHelpModalVisible(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Station & Connector Quick Summary */}
        {connector && station && (
          <TimePickerStationBrief
            station={station}
            chargePoint={chargePoint}
            connector={connector}
            themeColors={themeColors}
            t={t}
          />
        )}

        {/* Section 2: Modern Date Scroller */}
        <TimePickerDateSelector
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          weekdays={weekdays}
          themeColors={themeColors}
          t={t}
        />

        {/* Section 3: Duration Selector Chips */}
        <TimePickerDurationChips
          durationChoices={durationChoices}
          durationTargetMin={durationTargetMin}
          onSelectDuration={selectDurationChoice}
          minDurationMin={minDurationMin}
          maxDurationMin={maxDurationMin}
          themeColors={themeColors}
          t={t}
          durationLabel={durationLabel}
        />

        {/* Section 4: Available Time Slots Matrix */}
        <TimePickerSlotGrid
          loading={loading}
          generatedAt={availability?.generatedAt}
          slots={slots}
          visibleSlots={visibleSlots}
          timeFilter={timeFilter}
          onSelectFilter={setTimeFilter}
          periodCounts={periodCounts}
          durationTargetMin={durationTargetMin}
          hasSel={hasSel}
          selStart={selStart}
          selEnd={selEnd}
          canFitFrom={canFitFrom}
          onTapSlot={tapSlot}
        />

        {/* Section 5: Price & Energy Quote Card */}
        {quote && startAt && (
          <TimePickerQuoteCard
            quote={quote}
            startAt={startAt}
            themeColors={themeColors}
            t={t}
          />
        )}

        {/* Section 6: Cancellation / Refund Policy Card */}
        <StationPolicyCard cancellationPolicy={station?.cancellationPolicy} />
      </ScrollView>

      {/* Section 7: Sticky Floating Bottom Action Bar */}
      <TimePickerStickyBar
        hasSel={hasSel}
        meetsMinDuration={meetsMinDuration}
        minDurationMin={minDurationMin}
        durationStepMin={durationStepMin}
        startMin={selStart !== null ? slots[selStart].startMin : null}
        endMin={hasSel ? endMin : null}
        durationMin={durationMin}
        slotCount={slotCount}
        isCrossDay={isCrossDay}
        totalPrice={quote?.totalPrice ?? 0}
        canContinue={canContinue}
        hasValidPolicy={hasValidPolicy}
        onContinue={handleContinue}
        onReset={hasSel ? handleResetSelection : undefined}
        themeColors={themeColors}
        t={t}
        durationLabel={durationLabel}
      />

      {/* Interactive Booking Help Guide Modal */}
      <TimePickerHelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl + 4,
    paddingBottom: spacing.xxl + 24,
  },
});
