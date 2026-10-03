import React, { useCallback, useRef } from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
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
  TicketValidationSummary,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useCreateTicket } from '@/hooks/useCreateTicket';
import { spacing } from '@/theme';
import type { TicketFormErrorKey } from '@/utils/ticketValidation';

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
    errors,
    submitAttempted,
    errorCount,
  } = useCreateTicket();

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<TicketFormErrorKey, number>>>({});
  const descriptionOffset = useRef(0);
  const subjectInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  const measureSection = useCallback(
    (key: TicketFormErrorKey) => (event: LayoutChangeEvent) => {
      sectionY.current[key] = event.nativeEvent.layout.y;
    },
    [],
  );

  // Subject and description share one card: the card's own y is the anchor for
  // the subject, the description is that anchor plus its offset inside the card.
  const measureFormCard = useCallback((event: LayoutChangeEvent) => {
    sectionY.current.subject = event.nativeEvent.layout.y;
  }, []);

  const scrollToField = useCallback((key: TicketFormErrorKey) => {
    if (key === 'subject') subjectInputRef.current?.focus();
    if (key === 'description') descriptionInputRef.current?.focus();

    // Wait a frame so the (re-laid-out) form has settled before measuring.
    requestAnimationFrame(() => {
      const cardY = sectionY.current.subject;
      const y =
        key === 'description'
          ? cardY != null
            ? cardY + descriptionOffset.current
            : undefined
          : sectionY.current[key];

      if (typeof y === 'number') {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });
      }
    });
  }, []);

  const handleSubmitPress = useCallback(() => {
    handleSubmit(scrollToField);
  }, [handleSubmit, scrollToField]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Header */}
      <TicketHeader onBack={goBack} />

      {/* Error summary — pinned above the form so scroll anchors never shift.
          Always mounted: it animates itself open/closed as errors appear/clear. */}
      <View style={styles.summaryWrap}>
        <TicketValidationSummary errors={errors} onJumpTo={scrollToField} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
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
            <View onLayout={measureSection('session')}>
              <TicketSessionSelector
                category={category}
                loadingCandidates={loadingCandidates}
                candidateBookings={candidateBookings}
                selectedBookingId={selectedBookingId}
                onSelectBooking={handleSelectBooking}
                error={errors.session}
              />
            </View>
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
          <View onLayout={measureFormCard}>
            <TicketFormInputs
              subject={subject}
              onChangeSubject={setSubject}
              description={description}
              onChangeDescription={setDescription}
              subjectError={errors.subject}
              descriptionError={errors.description}
              subjectRef={subjectInputRef}
              descriptionRef={descriptionInputRef}
              onDescriptionLayout={(offsetY) => {
                descriptionOffset.current = offsetY;
              }}
            />
          </View>
        </ScrollView>

        {/* Action Submit Footer */}
        <TicketSubmitFooter
          submitting={submitting}
          errorCount={submitAttempted ? errorCount : 0}
          onSubmit={handleSubmitPress}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboardView: { flex: 1 },
  summaryWrap: {
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
