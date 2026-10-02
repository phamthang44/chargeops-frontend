import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppButton,
  BookingConfirmationErrorBanner,
  BookingConfirmationFooter,
  BookingConfirmationHeader,
  BookingConfirmationInvoiceCard,
  BookingConfirmationPaymentCard,
  BookingConfirmationStationCard,
  BookingConfirmationTimeCard,
  FastTrackBanner,
  GlassButton,
  OverlappingBookingBanner,
  OverlappingBookingModal,
  PriceChangedModal,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { useBookingConfirmation } from '@/hooks/useBookingConfirmation';
import type { RootStackParamList } from '@/navigation/types';
import { getLatestPendingBooking } from '@/services/bookingService';
import { fontSizes, fontWeights, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;

export function BookingConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const {
    params,
    station,
    connector,
    chargePoint,
    loading,
    method,
    selectPaymentMethod,
    submitting,
    error,
    errorCode,
    backendPreview,
    quote,
    previewCode,
    endAt,
    durationLabel,
    submitBooking,
    handleBack,
    showPriceChangedModal,
    pendingPricePreview,
    handleAcceptNewPrice,
    handleDeclineNewPrice,
    showOverlapModal,
    setShowOverlapModal,
    overlappingBooking,
  } = useBookingConfirmation();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!station || !connector || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <GlassButton
            size={40}
            glassEffectStyle="regular"
            fallbackColor={themeColors.surfaceAlt}
            accessibilityLabel={t('common.back')}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
          </GlassButton>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.title')}</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.notFoundContent}>
          <Ionicons name="alert-circle-outline" size={48} color={themeColors.warning} />
          <Text style={[styles.notFoundTitle, { color: themeColors.textStrong }]}>
            {t('bookingConfirmation.notFound', 'Không thể tải thông tin cổng sạc hoặc trạm')}
          </Text>
          <Text style={[styles.notFoundDesc, { color: themeColors.textMuted }]}>
            {t('bookingConfirmation.notFoundDesc', 'Vui lòng kiểm tra lại kết nối hoặc quay lại chọn cổng sạc khác.')}
          </Text>
          <AppButton
            label={t('common.back', 'Quay lại')}
            variant="secondary"
            onPress={handleBack}
            style={styles.backBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      {/* 1. Header with Glass Back button */}
      <BookingConfirmationHeader onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 2. Top Error Banner */}
        {error && (
          <BookingConfirmationErrorBanner
            error={error}
            errorCode={errorCode}
            onViewPendingDetail={() => {
              getLatestPendingBooking().then((pending) => {
                if (pending?.id) {
                  navigation.navigate('BookingDetail', { bookingId: pending.id });
                } else {
                  navigation.navigate('Tabs', { screen: 'Bookings' });
                }
              });
            }}
            onChangeTime={() => {
              navigation.navigate('TimeRangePicker', {
                stationId: params.stationId,
                connectorId: connector?.id ?? params.connectorId,
                isFromFastTrack: params.isFastTrack,
              });
            }}
          />
        )}

        {/* 3. Fast-Track 1-Click Banner */}
        {params.isFastTrack && <FastTrackBanner />}

        {/* 4. Station & Connector Summary */}
        <BookingConfirmationStationCard
          station={station}
          connector={connector}
          chargePoint={chargePoint}
          onChangeConnector={() => {
            navigation.navigate('StationDetail', { stationId: params.stationId });
          }}
        />

        {/* 5. Overlapping Booking Banner (if detected) */}
        {overlappingBooking && (
          <OverlappingBookingBanner
            overlappingBooking={overlappingBooking}
            onPress={() => setShowOverlapModal(true)}
          />
        )}

        {/* 6. Time & Hold Policy Summary */}
        <BookingConfirmationTimeCard
          startAt={params.startAt}
          endAt={endAt}
          durationLabel={durationLabel(params.durationMin)}
          onChangeTime={() => {
            navigation.navigate('TimeRangePicker', {
              stationId: params.stationId,
              connectorId: connector?.id ?? params.connectorId,
              isFromFastTrack: params.isFastTrack,
            });
          }}
        />

        {/* 7. Charging Fee Invoice Breakdown */}
        <BookingConfirmationInvoiceCard
          quote={quote}
          previewCode={previewCode}
          isBackendVerified={Boolean(backendPreview)}
        />

        {/* 8. Selectable Payment Method Card */}
        <BookingConfirmationPaymentCard
          method={method}
          onSelectMethod={selectPaymentMethod}
        />
      </ScrollView>

      {/* 9. Sticky Bottom Action Footer */}
      <BookingConfirmationFooter
        totalPrice={quote.totalPrice}
        submitting={submitting}
        loading={loading}
        backendPreview={backendPreview}
        onSubmit={() => submitBooking()}
      />

      {/* 10. Overlapping Booking Warning BottomSheet (BR-BOK-08) */}
      <OverlappingBookingModal
        visible={showOverlapModal}
        overlappingBooking={overlappingBooking}
        onConfirm={() => setShowOverlapModal(false)}
        onCancel={() => {
          setShowOverlapModal(false);
          navigation.goBack();
        }}
      />

      {/* 11. Price Changed Re-Consent BottomSheet (BKG-020) */}
      <PriceChangedModal
        visible={showPriceChangedModal}
        oldPrice={quote.totalPrice}
        pendingPricePreview={pendingPricePreview}
        onAccept={handleAcceptNewPrice}
        onDecline={handleDeclineNewPrice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  notFoundContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  notFoundTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  notFoundDesc: {
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: spacing.md,
  },
});
