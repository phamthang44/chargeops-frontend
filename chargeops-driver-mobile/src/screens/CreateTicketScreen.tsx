import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  TicketCategorySelector,
  TicketFormInputs,
  TicketHeader,
  TicketPlatformScopeBanner,
  TicketPreLinkedBanner,
  TicketPrioritySelector,
  TicketQuickChips,
  TicketSessionSelector,
  TicketSubmitFooter,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useCreateTicket } from '@/hooks/useCreateTicket';
import { spacing } from '@/theme';

export function CreateTicketScreen() {
  const { themeColors } = usePreferences();

  const {
    bookingId,
    stationName,
    categories,
    priorities,
    quickChips,
    category,
    setCategory,
    priority,
    setPriority,
    subject,
    setSubject,
    description,
    setDescription,
    submitting,
    candidateBookings,
    loadingCandidates,
    selectedBookingId,
    handleSelectBooking,
    isStationCategory,
    isPlatformCategory,
    handleSubmit,
    applyQuickChip,
    goBack,
  } = useCreateTicket();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Header */}
      <TicketHeader onBack={goBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pre-linked Booking Banner (when navigating from active session) */}
          {bookingId && (
            <TicketPreLinkedBanner
              bookingId={bookingId}
              stationName={stationName}
            />
          )}

          {/* Category selection */}
          <TicketCategorySelector
            categories={categories}
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          {/* Scope Selector: Booking Session Selection for Station Incidents */}
          {!bookingId && isStationCategory && (
            <TicketSessionSelector
              category={category}
              loadingCandidates={loadingCandidates}
              candidateBookings={candidateBookings}
              selectedBookingId={selectedBookingId}
              onSelectBooking={handleSelectBooking}
            />
          )}

          {/* Platform Scope Information Box */}
          {isPlatformCategory && <TicketPlatformScopeBanner />}

          {/* Priority selection */}
          <TicketPrioritySelector
            priorities={priorities}
            selectedPriority={priority}
            onSelectPriority={setPriority}
          />

          {/* Quick chips */}
          <TicketQuickChips
            quickChips={quickChips}
            onSelectChip={applyQuickChip}
          />

          {/* Subject & Description Inputs */}
          <TicketFormInputs
            subject={subject}
            onChangeSubject={setSubject}
            description={description}
            onChangeDescription={setDescription}
          />
        </ScrollView>

        {/* Action Submit Footer */}
        <TicketSubmitFooter
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
