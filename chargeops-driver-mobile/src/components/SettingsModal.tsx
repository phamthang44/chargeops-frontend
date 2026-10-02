import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences, type AppearanceMode } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getSimConfig,
  setBookingSim,
  setPaymentSim,
  type BookingSimOutcome,
  type PaymentSimOutcome,
} from '@/services/simulation';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { LanguageSwitcher } from './LanguageSwitcher';
import { StatusBadge } from './StatusBadge';

const PAYMENT_OUTCOMES: PaymentSimOutcome[] = ['SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT', 'RANDOM'];
const BOOKING_OUTCOMES: BookingSimOutcome[] = ['SUCCESS', 'RANGE_TAKEN', 'NETWORK_ERROR', 'RANDOM'];

// Keep the simulation implementation available for development without exposing
// it in the customer-facing settings sheet.
const SHOW_DEMO_CONTROLS = false;

const APPEARANCE: {
  mode: AppearanceMode;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  lightBackground: string;
  darkBackground: string;
}[] = [
  { mode: 'light', icon: 'sunny', accent: '#F59E0B', lightBackground: '#FEF3C7', darkBackground: '#451A03' },
  { mode: 'dark', icon: 'moon', accent: '#8B5CF6', lightBackground: '#EDE9FE', darkBackground: '#2E1065' },
  { mode: 'system', icon: 'phone-portrait', accent: '#3B82F6', lightBackground: '#DBEAFE', darkBackground: '#172554' },
];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  section?: 'all' | 'language' | 'appearance' | 'support';
  onOpenTickets?: () => void;
  onOpenNotifications?: () => void;
}

/**
 * Modernized bottom-sheet settings menu with blur backdrop, dynamic theme switcher,
 * color palette customizer, and integrated Support & Ticket Center.
 */
export function SettingsModal({
  visible,
  onClose,
  section = 'all',
  onOpenTickets,
  onOpenNotifications,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { appearance, setAppearance, palette, setPalette, themeColors, isDark } = usePreferences();
  const [sim, setSim] = useState(getSimConfig);

  const showLanguage = section === 'all' || section === 'language';
  const showAppearance = section === 'all' || section === 'appearance';
  const showSupport = section === 'all' || section === 'support';
  const showMore = section === 'all';
  const titleKey = section === 'all' ? 'settings.title' : `settings.${section}`;

  function pickPayment(outcome: PaymentSimOutcome) {
    setPaymentSim(outcome);
    setSim((s) => ({ ...s, payment: outcome }));
  }

  function pickBooking(outcome: BookingSimOutcome) {
    setBookingSim(outcome);
    setSim((s) => ({ ...s, booking: outcome }));
  }

  const handleOpenTickets = () => {
    onClose();
    if (onOpenTickets) {
      onOpenTickets();
    } else {
      try {
        navigation.navigate('MyTickets');
      } catch (err) {
        console.warn('Cannot navigate to MyTickets', err);
      }
    }
  };

  const handleCreateTicket = () => {
    onClose();
    try {
      navigation.navigate('CreateTicket', {});
    } catch (err) {
      console.warn('Cannot navigate to CreateTicket', err);
    }
  };

  const handleOpenNotifications = () => {
    if (onOpenNotifications) {
      onClose();
      onOpenNotifications();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Modern blur backdrop with interactive dismiss */}
        <BlurView intensity={32} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.25)' },
          ]}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: insets.bottom + spacing.lg,
              borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {/* Grabber Handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: isDark ? '#334155' : '#D1D5DB' },
            ]}
          />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>{t(titleKey)}</Text>
              {section === 'all' && (
                <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
                  {t('stationList.slogan1', 'Sạc xanh hơn')} • {t('stationList.slogan2', 'Hành trình xa hơn')}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  borderColor: themeColors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              hitSlop={8}
              onPress={onClose}
              accessibilityLabel={t('common.close', 'Đóng')}
            >
              <Ionicons name="close" size={20} color={themeColors.textBody} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Section 1: Language */}
            {showLanguage ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="globe-outline" size={15} color={themeColors.primary} />
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.language')}
                  </Text>
                </View>
                <LanguageSwitcher />
              </View>
            ) : null}

            {/* Section 2: Appearance & Palette */}
            {showAppearance ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="contrast-outline" size={15} color={themeColors.primary} />
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.appearance')}
                  </Text>
                </View>

                {/* Light / Dark / System Mode Cards */}
                <View style={styles.appearanceRow}>
                  {APPEARANCE.map(({ mode, icon, accent, lightBackground, darkBackground }) => {
                    const active = appearance === mode;
                    return (
                      <Pressable
                        key={mode}
                        style={({ pressed }) => [
                          styles.appearanceOption,
                          {
                            borderColor: active ? themeColors.primary : themeColors.border,
                            backgroundColor: active
                              ? (isDark ? 'rgba(16, 201, 138, 0.08)' : 'rgba(16, 185, 129, 0.07)')
                              : themeColors.surfaceAlt,
                            borderWidth: active ? 2 : 1,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                        onPress={() => setAppearance(mode)}
                      >
                        <View
                          style={[
                            styles.appearanceIconWrap,
                            { backgroundColor: isDark ? darkBackground : lightBackground },
                          ]}
                        >
                          <Ionicons name={icon} size={22} color={accent} />
                        </View>
                        <Text
                          style={[
                            styles.appearanceLabel,
                            { color: active ? themeColors.primaryDark : themeColors.textStrong },
                            active && styles.appearanceLabelActive,
                          ]}
                        >
                          {t(`settings.appearanceOptions.${mode}`)}
                        </Text>
                        {active ? (
                          <View style={[styles.activeCheck, { backgroundColor: themeColors.primary }]}>
                            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Color Palette Variant Switcher */}
                <View style={[styles.sectionHeaderRow, { marginTop: spacing.xs }]}>
                  <Ionicons name="brush-outline" size={15} color={themeColors.primary} />
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.palette')}
                  </Text>
                </View>
                <Text style={[styles.sectionHint, { color: themeColors.textMuted }]}>
                  {t('settings.paletteDesc')}
                </Text>

                <View style={styles.paletteRow}>
                  {/* Balanced (Emerald-Zen) */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.paletteCard,
                      {
                        borderColor: palette === 'balanced' ? themeColors.primary : themeColors.border,
                        backgroundColor: palette === 'balanced'
                          ? (isDark ? 'rgba(16, 201, 138, 0.08)' : 'rgba(16, 185, 129, 0.07)')
                          : themeColors.surfaceAlt,
                        borderWidth: palette === 'balanced' ? 2 : 1,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => setPalette('balanced')}
                  >
                    <View style={styles.palettePreviewRow}>
                      <View style={[styles.colorDot, { backgroundColor: '#10C98A' }]} />
                      <View style={[styles.colorDot, { backgroundColor: '#121917', borderColor: '#27312E', borderWidth: 1 }]} />
                      <View style={[styles.colorDot, { backgroundColor: '#0B0F0E', borderColor: '#27312E', borderWidth: 1 }]} />
                      <View style={[styles.recommendedTag, { backgroundColor: isDark ? 'rgba(16,201,138,0.2)' : '#D1FAE5' }]}>
                        <Text style={[styles.recommendedText, { color: themeColors.primaryDark }]}>
                          {t('settings.recommended', 'Đề xuất')}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.paletteTitle,
                        { color: palette === 'balanced' ? themeColors.primaryDark : themeColors.textStrong },
                      ]}
                    >
                      {t('settings.paletteOptions.balanced')}
                    </Text>
                    {palette === 'balanced' && (
                      <View style={[styles.activeCheck, { backgroundColor: themeColors.primary }]}>
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>

                  {/* Classic (High Contrast) */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.paletteCard,
                      {
                        borderColor: palette === 'classic' ? themeColors.primary : themeColors.border,
                        backgroundColor: palette === 'classic'
                          ? (isDark ? 'rgba(16, 201, 138, 0.08)' : 'rgba(16, 185, 129, 0.07)')
                          : themeColors.surfaceAlt,
                        borderWidth: palette === 'classic' ? 2 : 1,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => setPalette('classic')}
                  >
                    <View style={styles.palettePreviewRow}>
                      <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
                      <View style={[styles.colorDot, { backgroundColor: '#161B1A', borderColor: '#2A312F', borderWidth: 1 }]} />
                      <View style={[styles.colorDot, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }]} />
                    </View>
                    <Text
                      style={[
                        styles.paletteTitle,
                        { color: palette === 'classic' ? themeColors.primaryDark : themeColors.textStrong },
                      ]}
                    >
                      {t('settings.paletteOptions.classic')}
                    </Text>
                    {palette === 'classic' && (
                      <View style={[styles.activeCheck, { backgroundColor: themeColors.primary }]}>
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Section 3: Integrated Support & Ticket Center (Moved from Header) */}
            {showSupport ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="headset-outline" size={15} color={themeColors.primary} />
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.supportSection', 'Hỗ trợ & Báo sự cố')}
                  </Text>
                </View>

                <View style={styles.actionGroup}>
                  {/* Action 1: My Support Tickets */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionCard,
                      {
                        backgroundColor: themeColors.surfaceAlt,
                        borderColor: themeColors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    onPress={handleOpenTickets}
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.myTickets', 'Phiếu hỗ trợ của tôi')}
                  >
                    <View
                      style={[
                        styles.actionIconWrap,
                        { backgroundColor: isDark ? 'rgba(16, 201, 138, 0.15)' : '#ECFDF5' },
                      ]}
                    >
                      <Ionicons name="help-buoy" size={20} color={themeColors.primary} />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={[styles.actionTitle, { color: themeColors.textStrong }]}>
                        {t('settings.myTickets', 'Phiếu hỗ trợ của tôi')}
                      </Text>
                      <Text style={[styles.actionDesc, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {t('settings.myTicketsDesc', 'Theo dõi tiến độ, trao đổi kỹ thuật & hoàn phí')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
                  </Pressable>

                  {/* Action 2: Submit New Ticket */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionCard,
                      {
                        backgroundColor: themeColors.surfaceAlt,
                        borderColor: themeColors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    onPress={handleCreateTicket}
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.newTicket', 'Gửi yêu cầu hỗ trợ mới')}
                  >
                    <View
                      style={[
                        styles.actionIconWrap,
                        { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' },
                      ]}
                    >
                      <Ionicons name="add-circle" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={[styles.actionTitle, { color: themeColors.textStrong }]}>
                        {t('settings.newTicket', 'Gửi yêu cầu hỗ trợ mới')}
                      </Text>
                      <Text style={[styles.actionDesc, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {t('settings.newTicketDesc', 'Báo lỗi trạm sạc, sự cố thanh toán hoặc tài khoản')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Section 4: Notifications & App Information */}
            {showMore ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="information-circle-outline" size={15} color={themeColors.primary} />
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.more', 'Khác & Thông tin')}
                  </Text>
                </View>

                <View style={styles.actionGroup}>
                  {/* Notifications Row */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionCard,
                      {
                        backgroundColor: themeColors.surfaceAlt,
                        borderColor: themeColors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    onPress={handleOpenNotifications}
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.notifications', 'Thông báo')}
                  >
                    <View
                      style={[
                        styles.actionIconWrap,
                        { backgroundColor: isDark ? '#431407' : '#FFF7ED' },
                      ]}
                    >
                      <Ionicons name="notifications-outline" size={19} color="#F97316" />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={[styles.actionTitle, { color: themeColors.textStrong }]}>
                        {t('settings.notifications', 'Thông báo')}
                      </Text>
                      <Text style={[styles.actionDesc, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {t('settings.notificationsDesc', 'Xem thông báo sạc pin, đặt chỗ và số dư')}
                      </Text>
                    </View>
                    {onOpenNotifications ? (
                      <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
                    ) : (
                      <StatusBadge variant="info" label="Hoạt động" />
                    )}
                  </Pressable>

                  {/* App Version Info Row */}
                  <View
                    style={[
                      styles.actionCard,
                      {
                        backgroundColor: themeColors.surfaceAlt,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.actionIconWrap,
                        { backgroundColor: isDark ? '#2E1065' : '#F5F3FF' },
                      ]}
                    >
                      <Ionicons name="flash-outline" size={19} color="#8B5CF6" />
                    </View>
                    <View style={styles.actionCopy}>
                      <Text style={[styles.actionTitle, { color: themeColors.textStrong }]}>
                        ChargeOps Driver EV
                      </Text>
                      <Text style={[styles.actionDesc, { color: themeColors.textMuted }]}>
                        {t('settings.appVersion', 'v1.2.0 • Build 2026.1')}
                      </Text>
                    </View>
                    <StatusBadge variant="success" dot label="Sẵn sàng" />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Development / Demo Simulation (if enabled) */}
            {section === 'all' && SHOW_DEMO_CONTROLS ? (
              <View style={styles.sectionWrap}>
                <View style={styles.demoHeader}>
                  <Ionicons name="flask-outline" size={16} color={themeColors.textMuted} />
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.demo')}
                  </Text>
                </View>
                <Text style={[styles.demoHint, { color: themeColors.textMuted }]}>{t('settings.demoHint')}</Text>

                <Text style={[styles.demoSubLabel, { color: themeColors.textBody }]}>
                  {t('settings.demoPayment')}
                </Text>
                <View style={styles.chipRow}>
                  {PAYMENT_OUTCOMES.map((o) => {
                    const active = sim.payment === o;
                    return (
                      <Pressable
                        key={o}
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? themeColors.primary : themeColors.border,
                            backgroundColor: active ? themeColors.primarySoft : themeColors.surfaceAlt,
                          },
                        ]}
                        onPress={() => pickPayment(o)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? themeColors.primaryDark : themeColors.textMuted },
                            active && styles.chipTextActive,
                          ]}
                        >
                          {t(`settings.simPayment.${o}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.demoSubLabel, { color: themeColors.textBody }]}>
                  {t('settings.demoBooking')}
                </Text>
                <View style={styles.chipRow}>
                  {BOOKING_OUTCOMES.map((o) => {
                    const active = sim.booking === o;
                    return (
                      <Pressable
                        key={o}
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? themeColors.primary : themeColors.border,
                            backgroundColor: active ? themeColors.primarySoft : themeColors.surfaceAlt,
                          },
                        ]}
                        onPress={() => pickBooking(o)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? themeColors.primaryDark : themeColors.textMuted },
                            active && styles.chipTextActive,
                          ]}
                        >
                          {t(`settings.simBooking.${o}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.xs,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  headerTitleWrap: {
    gap: 2,
    flex: 1,
  },
  title: {
    fontSize: 21,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  sectionWrap: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHint: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: -2,
  },

  appearanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: radius.lg,
    position: 'relative',
  },
  appearanceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceLabel: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  appearanceLabelActive: {
    fontWeight: fontWeights.bold,
  },
  activeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paletteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paletteCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  palettePreviewRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    marginBottom: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  recommendedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: 'auto',
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  paletteTitle: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },

  actionGroup: {
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  actionDesc: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
  },

  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  demoHint: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
  },
  demoSubLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  chipTextActive: {
    fontWeight: fontWeights.semibold,
  },
});
