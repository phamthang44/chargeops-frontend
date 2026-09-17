import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getBookingById } from '@/services/bookingService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatDayMonth, formatTimeRange, formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type Route = RouteProp<RootStackParamList, 'BookingSuccess'>;

interface GuideStepItem {
  step: number;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
}

const GUIDE_STEPS: GuideStepItem[] = [
  {
    step: 1,
    icon: 'time-outline',
    titleKey: 'bookingSuccess.step1Title',
    descKey: 'bookingSuccess.step1',
  },
  {
    step: 2,
    icon: 'qr-code-outline',
    titleKey: 'bookingSuccess.step2Title',
    descKey: 'bookingSuccess.step2',
  },
  {
    step: 3,
    icon: 'flash-outline',
    titleKey: 'bookingSuccess.step3Title',
    descKey: 'bookingSuccess.step3',
  },
];

/**
 * "Đặt chỗ thành công" — high-end post-payment confirmation screen.
 * Features a celebratory hero glow, digital receipt ticket voucher,
 * structured transaction breakdown, and a clean check-in stepper timeline.
 */
export function BookingSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    getBookingById(params.bookingId).then((b) => {
      if (active) setBooking(b);
    });
    return () => {
      active = false;
    };
  }, [params.bookingId]);

  function handleCopyCode() {
    if (!booking?.code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(booking.code).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function goHome() {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
    );
  }

  function viewDetail() {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'BookingDetail', params: { bookingId: params.bookingId } }],
      }),
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Celebration Hero Section */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.checkOuterRing,
              {
                backgroundColor: themeColors.primarySoft,
                borderColor: `${themeColors.primary}33`,
              },
            ]}
          >
            <View
              style={[
                styles.checkInnerCircle,
                {
                  backgroundColor: themeColors.primary,
                  shadowColor: themeColors.primary,
                  ...(Platform.OS === 'web'
                    ? { boxShadow: '0 8px 24px rgba(16, 201, 138, 0.35)' }
                    : {}),
                },
              ]}
            >
              <Ionicons name="checkmark-sharp" size={44} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.title, { color: themeColors.textStrong }]}>{t('bookingSuccess.title')}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('bookingSuccess.subtitle')}</Text>
        </View>

        {/* Booking Code Voucher / Ticket Badge */}
        <View style={[styles.voucherCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.voucherHeader}>
            <View style={styles.voucherLabelRow}>
              <Ionicons name="receipt-outline" size={14} color={themeColors.textMuted} />
              <Text style={[styles.voucherLabel, { color: themeColors.textMuted }]}>
                {t('bookingSuccess.codeLabel')}
              </Text>
            </View>
            {copied && (
              <View style={[styles.copiedPill, { backgroundColor: themeColors.primarySoft }]}>
                <Ionicons name="checkmark-circle" size={13} color={themeColors.primary} />
                <Text style={[styles.copiedText, { color: themeColors.primary }]}>
                  {t('bookingSuccess.codeCopied')}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.voucherCodeBox, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
            <Text
              style={[styles.voucherCodeText, { color: themeColors.primary }]}
              numberOfLines={1}
              ellipsizeMode="middle"
              selectable
            >
              {booking.code}
            </Text>
            <Pressable
              onPress={handleCopyCode}
              style={({ pressed }) => [
                styles.copyButton,
                {
                  backgroundColor: copied ? themeColors.primarySoft : themeColors.surface,
                  borderColor: copied ? themeColors.primary : themeColors.border,
                },
                pressed && styles.copyButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('bookingSuccess.copyCode')}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? themeColors.primary : themeColors.textBody}
              />
              <Text
                style={[
                  styles.copyButtonText,
                  { color: copied ? themeColors.primary : themeColors.textBody },
                ]}
              >
                {t(copied ? 'bookingSuccess.codeCopied' : 'bookingSuccess.copyCode')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Transaction Summary Card */}
        <View style={[styles.txCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.txHeader}>
            <View style={styles.txHeaderLeft}>
              <Ionicons name="document-text-outline" size={17} color={themeColors.primary} />
              <Text style={[styles.txTitle, { color: themeColors.textStrong }]}>{t('bookingSuccess.txTitle')}</Text>
            </View>
            <StatusBadge variant="success" label={t('bookingSuccess.paid')} dot />
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <TxRow
            icon="business-outline"
            label={t('bookingSuccess.station')}
            value={booking.stationName}
          />
          <TxRow
            icon="flash-outline"
            label={t('bookingSuccess.connector')}
            value={`${booking.chargePointName} · ${booking.connectorName} (${booking.connectorType})`}
          />
          <TxRow
            icon="time-outline"
            label={t('bookingSuccess.window')}
            value={`${formatDayMonth(booking.startAt)} · ${formatTimeRange(booking.startAt, booking.endAt)}`}
          />

          <View style={[styles.dashedDivider, { borderColor: themeColors.border }]} />

          <View style={styles.totalRow}>
            <View style={styles.totalLabelWrap}>
              <View style={[styles.totalIconWrap, { backgroundColor: themeColors.primarySoft }]}>
                <Ionicons name="wallet-outline" size={16} color={themeColors.primary} />
              </View>
              <Text style={[styles.totalLabel, { color: themeColors.textStrong }]}>{t('bookingSuccess.total')}</Text>
            </View>
            <Text style={[styles.totalValue, { color: themeColors.primary }]}>
              {formatVnd(booking.totalPrice)}
            </Text>
          </View>
        </View>

        {/* Check-in Guide Stepper Card */}
        <View style={[styles.guideCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.guideHeader}>
            <View style={[styles.guideIconWrap, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={themeColors.primary} />
            </View>
            <View style={styles.guideTitleBlock}>
              <Text style={[styles.guideTitle, { color: themeColors.textStrong }]}>{t('bookingSuccess.guideTitle')}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.guideStepsContainer}>
            {GUIDE_STEPS.map((item, idx) => {
              const isLast = idx === GUIDE_STEPS.length - 1;
              return (
                <View key={item.step} style={styles.stepperRow}>
                  <View style={styles.stepperTrack}>
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: themeColors.surfaceAlt,
                          borderColor: themeColors.primary,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={16} color={themeColors.primary} />
                    </View>
                    {!isLast && (
                      <View style={[styles.stepConnectorLine, { backgroundColor: themeColors.border }]} />
                    )}
                  </View>
                  <View style={[styles.stepContent, !isLast && styles.stepContentSpaced]}>
                    <View style={styles.stepBadgeRow}>
                      <View style={[styles.stepNumPill, { backgroundColor: themeColors.primarySoft }]}>
                        <Text style={[styles.stepNumBadge, { color: themeColors.primary }]}>
                          {t('bookingSuccess.stepNum', { num: item.step })}
                        </Text>
                      </View>
                      <Text style={[styles.stepItemTitle, { color: themeColors.textStrong }]}>
                        {t(item.titleKey)}
                      </Text>
                    </View>
                    <Text style={[styles.stepDesc, { color: themeColors.textBody }]}>
                      {t(item.descKey)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Policy Notice Footer */}
          <View
            style={[
              styles.noticeBanner,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
            ]}
          >
            <Ionicons name="information-circle-outline" size={17} color={themeColors.primary} />
            <Text style={[styles.noticeText, { color: themeColors.textMuted }]}>
              {t('bookingSuccess.refundNote')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTAs */}
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <AppButton label={t('bookingSuccess.viewDetail')} onPress={viewDetail} />
        <AppButton label={t('bookingSuccess.goHome')} variant="secondary" onPress={goHome} />
      </View>
    </SafeAreaView>
  );
}

function TxRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { themeColors } = usePreferences();
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, { backgroundColor: themeColors.surfaceAlt }]}>
        <Ionicons name={icon} size={15} color={themeColors.textMuted} />
      </View>
      <Text style={[styles.txLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text style={[styles.txValue, { color: themeColors.textStrong }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  checkOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  checkInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      default: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: lineHeights.body,
    paddingHorizontal: spacing.md,
  },

  // Voucher / Ticket Card
  voucherCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voucherLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  copiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  copiedText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  voucherCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  voucherCodeText: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  copyButtonPressed: {
    opacity: 0.75,
  },
  copyButtonText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },

  // Transaction Card
  txCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  txTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  divider: {
    height: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txLabel: {
    fontSize: fontSizes.body,
    width: 95,
  },
  txValue: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    textAlign: 'right',
  },
  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  totalLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  totalValue: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },

  // Check-in Guide Card
  guideCard: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guideIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitleBlock: {
    flex: 1,
  },
  guideTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  guideStepsContainer: {
    paddingVertical: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepperTrack: {
    alignItems: 'center',
    width: 36,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnectorLine: {
    width: 2,
    minHeight: 28,
    flex: 1,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    gap: 4,
  },
  stepContentSpaced: {
    paddingBottom: spacing.lg,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  stepNumPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  stepNumBadge: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  stepItemTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  stepDesc: {
    fontSize: fontSizes.body - 1,
    lineHeight: lineHeights.body,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },

  // Footer Actions
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});
