import { useOverlayLayout } from '@/hooks/useOverlayLayout';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { usePreferences, type AppearanceMode } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getSimConfig,
  setBookingSim,
  setPaymentSim,
  type BookingSimOutcome,
  type PaymentSimOutcome,
} from '@/services/simulation';
import type { AppNotification } from '@/services/notificationService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { navigateFromNotification } from '@/utils/notificationNavigation';
import { LegalDocumentSheet } from './LegalDocumentSheet';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationSheet } from './NotificationSheet';
import { Reveal } from './common/Reveal';
import type { LegalDocType } from '@/content/legal';

const PAYMENT_OUTCOMES: PaymentSimOutcome[] = ['SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT', 'RANDOM'];
const BOOKING_OUTCOMES: BookingSimOutcome[] = ['SUCCESS', 'RANGE_TAKEN', 'NETWORK_ERROR', 'RANDOM'];

// Keep the simulation implementation available for development without exposing
// it in the customer-facing settings sheet.
const SHOW_DEMO_CONTROLS = false;

/** Mass-carrying curve — never `linear` / `ease-in-out`. */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Circular trailing chevron ("island" button-in-button). */
function ChevronIsland({ muted = true }: { muted?: boolean }) {
  const { themeColors } = usePreferences();
  return (
    <View
      style={[
        styles.chevronIsland,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <Ionicons name="chevron-forward" size={13} color={muted ? themeColors.textMuted : themeColors.primary} />
    </View>
  );
}

interface SectionHeadingProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent?: string;
}

/** Eyebrow section tag: icon chip + uppercase label + hairline rule. */
function SectionHeading({ icon, label, accent }: SectionHeadingProps) {
  const { themeColors } = usePreferences();
  const tint = accent ?? themeColors.primary;
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.eyebrowChip, { backgroundColor: `${tint}1A`, borderColor: `${tint}33` }]}>
        <Ionicons name={icon} size={12} color={tint} />
      </View>
      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <View style={[styles.hairline, { backgroundColor: themeColors.border }]} />
    </View>
  );
}

interface SettingsActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  desc?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  accessibilityLabel?: string;
}

/**
 * Machined action row: press physics (interpolated scale + opacity), tinted icon
 * tile and an island trailing control. Becomes non-interactive when onPress is
 * omitted (static info rows).
 */
function SettingsActionRow({
  icon,
  iconColor,
  iconBg,
  title,
  desc,
  onPress,
  trailing,
  accessibilityLabel,
}: SettingsActionRowProps) {
  const { themeColors } = usePreferences();
  const press = useRef(new Animated.Value(0)).current;
  const useNative = Platform.OS !== 'web';
  const interactive = Boolean(onPress);

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] });
  const opacity = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });

  return (
    <Animated.View
      style={[
        styles.actionCard,
        {
          backgroundColor: themeColors.surfaceAlt,
          borderColor: themeColors.border,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        disabled={!interactive}
        onPress={onPress}
        onPressIn={() =>
          Animated.timing(press, { toValue: 1, duration: 110, easing: EASE, useNativeDriver: useNative }).start()
        }
        onPressOut={() =>
          Animated.timing(press, { toValue: 0, duration: 200, easing: EASE, useNativeDriver: useNative }).start()
        }
        style={styles.actionRowInner}
        accessibilityRole={interactive ? 'button' : 'text'}
        accessibilityLabel={accessibilityLabel ?? title}
      >
        <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={19} color={iconColor} />
        </View>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionTitle, { color: themeColors.textStrong }]}>{title}</Text>
          {desc ? (
            <Text style={[styles.actionDesc, { color: themeColors.textMuted }]} numberOfLines={1}>
              {desc}
            </Text>
          ) : null}
        </View>
        {trailing ?? (interactive ? <ChevronIsland /> : null)}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main sheet                                                         */
/* ------------------------------------------------------------------ */

/**
 * Modernized bottom-sheet settings menu with blur backdrop, dynamic theme switcher,
 * color palette customizer, integrated Support & Ticket Center, in-app notifications
 * and legal documents — every visible row is actionable in every auth state.
 */
export function SettingsModal({
  visible,
  onClose,
  section = 'all',
  onOpenTickets,
  onOpenNotifications,
}: SettingsModalProps) {
  const overlay = useOverlayLayout();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const { appearance, setAppearance, palette, setPalette, themeColors, isDark } = usePreferences();
  const [sim, setSim] = useState(getSimConfig);
  const [notifOpen, setNotifOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  const authenticated = Boolean(session);

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

  const handleSignIn = () => {
    onClose();
    try {
      navigation.navigate('Login');
    } catch (err) {
      console.warn('Cannot navigate to Login', err);
    }
  };

  /**
   * Always actionable: callers may provide their own sheet (map / station list),
   * otherwise the modal opens a built-in NotificationSheet so the row is never dead.
   */
  const handleOpenNotifications = () => {
    if (onOpenNotifications) {
      onClose();
      onOpenNotifications();
      return;
    }
    onClose();
    setNotifOpen(true);
  };

  const handleNotificationNavigate = (n: AppNotification) => {
    navigateFromNotification(n, navigation);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        <View style={[styles.root, overlay.rootStyle]}>
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
            testID="settings-sheet"
            style={[
              styles.sheet,
              overlay.sheetStyle,
              {
                backgroundColor: themeColors.surface,
                paddingBottom: insets.bottom + spacing.lg,
                borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.9)',
              },
            ]}
          >
            {/* Grabber Handle */}
            <View style={[styles.handle, { backgroundColor: isDark ? '#334155' : '#D1D5DB' }]} />

            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                {section === 'all' && (
                  <View style={[styles.eyebrowTag, { backgroundColor: `${themeColors.primary}14` }]}>
                    <Text style={[styles.eyebrowTagText, { color: themeColors.primaryDark }]}>
                      ChargeOps Driver
                    </Text>
                  </View>
                )}
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
                <Reveal delay={40} duration={560} style={styles.sectionWrap}>
                  <SectionHeading icon="globe-outline" label={t('settings.language')} accent="#8B5CF6" />
                  {/* Single bezel — LanguageSwitcher already draws its own border. */}
                  <LanguageSwitcher />
                </Reveal>
              ) : null}

              {/* Section 2: Appearance & Palette */}
              {showAppearance ? (
                <Reveal delay={110} duration={560} style={styles.sectionWrap}>
                  <SectionHeading icon="contrast-outline" label={t('settings.appearance')} accent="#6366F1" />

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
                              transform: [{ scale: pressed ? 0.97 : 1 }],
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
                  <View style={[styles.sectionHeaderRow, { marginTop: spacing.sm }]}>
                    <View style={[styles.eyebrowChip, { backgroundColor: `${themeColors.primary}1A`, borderColor: `${themeColors.primary}33` }]}>
                      <Ionicons name="brush-outline" size={12} color={themeColors.primary} />
                    </View>
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                      {t('settings.palette')}
                    </Text>
                    <View style={[styles.hairline, { backgroundColor: themeColors.border }]} />
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
                          transform: [{ scale: pressed ? 0.97 : 1 }],
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
                          transform: [{ scale: pressed ? 0.97 : 1 }],
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
                </Reveal>
              ) : null}

              {/* Section 3: Integrated Support & Ticket Center */}
              {showSupport ? (
                <Reveal delay={180} duration={560} style={styles.sectionWrap}>
                  <SectionHeading
                    icon="headset-outline"
                    label={t('settings.supportSection', 'Hỗ trợ & Báo sự cố')}
                    accent="#3B82F6"
                  />

                  <View style={styles.actionGroup}>
                    {authenticated ? (
                      <>
                        {/* Action 1: My Support Tickets */}
                        <SettingsActionRow
                          icon="help-buoy"
                          iconColor={themeColors.primary}
                          iconBg={isDark ? 'rgba(16, 201, 138, 0.15)' : '#ECFDF5'}
                          title={t('settings.myTickets', 'Phiếu hỗ trợ của tôi')}
                          desc={t('settings.myTicketsDesc', 'Theo dõi tiến độ, trao đổi kỹ thuật & hoàn phí')}
                          onPress={handleOpenTickets}
                          accessibilityLabel={t('settings.myTickets', 'Phiếu hỗ trợ của tôi')}
                        />

                        {/* Action 2: Submit New Ticket */}
                        <SettingsActionRow
                          icon="add-circle"
                          iconColor="#3B82F6"
                          iconBg={isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'}
                          title={t('settings.newTicket', 'Gửi yêu cầu hỗ trợ mới')}
                          desc={t('settings.newTicketDesc', 'Báo lỗi trạm sạc, sự cố thanh toán hoặc tài khoản')}
                          onPress={handleCreateTicket}
                          accessibilityLabel={t('settings.newTicket', 'Gửi yêu cầu hỗ trợ mới')}
                        />
                      </>
                    ) : (
                      /* Signed-out (Welcome): tickets need a session — offer sign-in instead of a dead row. */
                      <SettingsActionRow
                        icon="log-in-outline"
                        iconColor={themeColors.primary}
                        iconBg={isDark ? 'rgba(16, 201, 138, 0.15)' : '#ECFDF5'}
                        title={t('settings.signInCta', 'Đăng nhập để dùng hỗ trợ')}
                        desc={t('settings.signInCtaDesc', 'Phiếu hỗ trợ & trợ giúp tài khoản cần đăng nhập')}
                        onPress={handleSignIn}
                        accessibilityLabel={t('settings.signInCta', 'Đăng nhập để dùng hỗ trợ')}
                      />
                    )}
                  </View>
                </Reveal>
              ) : null}

              {/* Section 4: Notifications & App Information */}
              {showMore ? (
                <Reveal delay={250} duration={560} style={styles.sectionWrap}>
                  <SectionHeading
                    icon="information-circle-outline"
                    label={t('settings.more', 'Khác & Thông tin')}
                    accent="#F97316"
                  />

                  <View style={styles.actionGroup}>
                    {/* Notifications Row — always actionable (built-in sheet when no callback) */}
                    <SettingsActionRow
                      icon="notifications-outline"
                      iconColor="#F97316"
                      iconBg={isDark ? '#431407' : '#FFF7ED'}
                      title={t('settings.notifications', 'Thông báo')}
                      desc={t('settings.notificationsDesc', 'Xem thông báo sạc pin, đặt chỗ và số dư')}
                      onPress={handleOpenNotifications}
                      accessibilityLabel={t('settings.notifications', 'Thông báo')}
                      trailing={
                        unreadCount > 0 ? (
                          <View style={[styles.unreadPill, { backgroundColor: themeColors.primary }]}>
                            <Text style={[styles.unreadPillText, { color: themeColors.surface }]}>
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                          </View>
                        ) : (
                          <ChevronIsland />
                        )
                      }
                    />

                    {/* Terms of Service */}
                    <SettingsActionRow
                      icon="document-text-outline"
                      iconColor="#8B5CF6"
                      iconBg={isDark ? '#2E1065' : '#F5F3FF'}
                      title={t('common.terms', 'Điều khoản dịch vụ')}
                      desc={t('settings.termsDesc', 'Điều khoản sử dụng dành cho tài xế ChargeOps')}
                      onPress={() => setLegalDoc('terms')}
                      accessibilityLabel={t('common.terms', 'Điều khoản dịch vụ')}
                    />

                    {/* Privacy Policy */}
                    <SettingsActionRow
                      icon="shield-checkmark-outline"
                      iconColor="#10B981"
                      iconBg={isDark ? '#113322' : '#ECFDF5'}
                      title={t('common.privacy', 'Chính sách bảo mật')}
                      desc={t('settings.privacyDesc', 'Cách ChargeOps thu thập & bảo vệ dữ liệu của bạn')}
                      onPress={() => setLegalDoc('privacy')}
                      accessibilityLabel={t('common.privacy', 'Chính sách bảo mật')}
                    />

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
                      <View style={styles.actionRowInner}>
                        <View
                          style={[
                            styles.actionIconWrap,
                            { backgroundColor: isDark ? '#312E81' : '#EEF2FF' },
                          ]}
                        >
                          <Ionicons name="flash-outline" size={19} color="#6366F1" />
                        </View>
                        <View style={styles.actionCopy}>
                          <Text style={[styles.actionTitle, { color: themeColors.textStrong }]}>
                            ChargeOps Driver EV
                          </Text>
                          <Text style={[styles.actionDesc, { color: themeColors.textMuted }]}>
                            {t('settings.appVersion', 'v1.2.0 • Build 2026.1')}
                          </Text>
                        </View>
                        <View style={[styles.readyChip, { backgroundColor: `${themeColors.primary}1A` }]}>
                          <View style={[styles.readyDot, { backgroundColor: themeColors.primary }]} />
                          <Text style={[styles.readyChipText, { color: themeColors.primaryDark }]}>
                            {t('settings.ready', 'Sẵn sàng')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Reveal>
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

      {/* Built-in notification sheet (used when the host screen provides no callback) */}
      <NotificationSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={handleNotificationNavigate}
      />

      {/* Legal documents — sibling modals so Android never nests native modals */}
      <LegalDocumentSheet
        visible={legalDoc !== null}
        type={legalDoc ?? 'terms'}
        onClose={() => setLegalDoc(null)}
      />
    </>
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
    gap: spacing.xl,
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
    gap: 3,
    flex: 1,
  },
  eyebrowTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  eyebrowTagText: {
    fontSize: 9.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
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
    gap: spacing.sm,
  },
  eyebrowChip: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  hairline: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
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
  chevronIsland: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  unreadPill: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  readyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  readyChipText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
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
