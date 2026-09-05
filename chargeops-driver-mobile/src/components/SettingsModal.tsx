import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences, type AppearanceMode } from '@/context/PreferencesContext';
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
  { mode: 'light', icon: 'sunny', accent: '#F59E0B', lightBackground: '#FFFBEB', darkBackground: '#422006' },
  { mode: 'dark', icon: 'moon', accent: '#8B5CF6', lightBackground: '#F5F3FF', darkBackground: '#2E1065' },
  { mode: 'system', icon: 'phone-portrait', accent: '#3B82F6', lightBackground: '#EFF6FF', darkBackground: '#172554' },
];

// Placeholder rows for future settings work.
const FUTURE: {
  key: 'notifications' | 'help' | 'about';
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  lightBackground: string;
  darkBackground: string;
}[] = [
  { key: 'notifications', icon: 'notifications-outline', accent: '#F97316', lightBackground: '#FFF7ED', darkBackground: '#431407' },
  { key: 'help', icon: 'chatbubbles-outline', accent: '#3B82F6', lightBackground: '#EFF6FF', darkBackground: '#172554' },
  { key: 'about', icon: 'sparkles-outline', accent: '#8B5CF6', lightBackground: '#F5F3FF', darkBackground: '#2E1065' },
];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  section?: 'all' | 'language' | 'appearance';
}

/** Bottom-sheet settings menu with notification-style blur backdrop and dynamic theme support. */
export function SettingsModal({ visible, onClose, section = 'all' }: SettingsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { appearance, setAppearance, palette, setPalette, themeColors, isDark } = usePreferences();
  const [sim, setSim] = useState(getSimConfig);
  const showLanguage = section === 'all' || section === 'language';
  const showAppearance = section === 'all' || section === 'appearance';
  const titleKey = section === 'all' ? 'settings.title' : `settings.${section}`;

  function pickPayment(outcome: PaymentSimOutcome) {
    setPaymentSim(outcome);
    setSim((s) => ({ ...s, payment: outcome }));
  }
  function pickBooking(outcome: BookingSimOutcome) {
    setBookingSim(outcome);
    setSim((s) => ({ ...s, booking: outcome }));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Notification-style blur backdrop */}
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.textStrong }]}>{t(titleKey)}</Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: themeColors.surfaceAlt }]}
              hitSlop={8}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={themeColors.textBody} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {showLanguage ? (
              <>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                  {t('settings.language')}
                </Text>
                <LanguageSwitcher />
              </>
            ) : null}

            {showAppearance ? (
              <>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                  {t('settings.appearance')}
                </Text>
                <View style={styles.appearanceRow}>
                  {APPEARANCE.map(({ mode, icon, accent, lightBackground, darkBackground }) => {
                    const active = appearance === mode;
                    return (
                      <Pressable
                        key={mode}
                        style={[
                          styles.appearanceOption,
                          {
                            borderColor: active ? themeColors.primary : themeColors.border,
                            backgroundColor: themeColors.surfaceAlt,
                            borderWidth: active ? 2 : 1,
                          },
                        ]}
                        onPress={() => setAppearance(mode)}
                      >
                        <View
                          style={[
                            styles.appearanceIcon,
                            { backgroundColor: isDark ? darkBackground : lightBackground },
                          ]}
                        >
                          <Ionicons name={icon} size={22} color={accent} />
                        </View>
                        {active ? (
                          <View style={[styles.activeCheck, { backgroundColor: themeColors.primary }]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.appearanceLabel,
                            { color: active ? themeColors.primaryDark : themeColors.textBody },
                            active && styles.appearanceLabelActive,
                          ]}
                        >
                          {t(`settings.appearanceOptions.${mode}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Color Palette Variant Switcher (for visual comparison) */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                    {t('settings.palette')}
                  </Text>
                  <Text style={[styles.sectionHint, { color: themeColors.textMuted }]}>
                    {t('settings.paletteDesc')}
                  </Text>
                </View>
                <View style={styles.paletteRow}>
                  <Pressable
                    style={[
                      styles.paletteCard,
                      {
                        borderColor: palette === 'balanced' ? themeColors.primary : themeColors.border,
                        backgroundColor: themeColors.surfaceAlt,
                        borderWidth: palette === 'balanced' ? 2 : 1,
                      },
                    ]}
                    onPress={() => setPalette('balanced')}
                  >
                    <View style={styles.palettePreviewRow}>
                      <View style={[styles.colorDot, { backgroundColor: '#10C98A' }]} />
                      <View style={[styles.colorDot, { backgroundColor: '#121917', borderColor: '#27312E', borderWidth: 1 }]} />
                      <View style={[styles.colorDot, { backgroundColor: '#0B0F0E', borderColor: '#27312E', borderWidth: 1 }]} />
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
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paletteCard,
                      {
                        borderColor: palette === 'classic' ? themeColors.primary : themeColors.border,
                        backgroundColor: themeColors.surfaceAlt,
                        borderWidth: palette === 'classic' ? 2 : 1,
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
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}

            {section === 'all' ? (
              <>
                {SHOW_DEMO_CONTROLS ? (
                  <>
                    {/* Demo / simulation remains available for development. */}
                    <View style={styles.demoHeader}>
                      <Ionicons name="flask-outline" size={16} color={themeColors.textMuted} />
                      <Text style={[styles.sectionLabelInline, { color: themeColors.textMuted }]}>
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
                  </>
                ) : null}

                {/* Future work */}
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{t('settings.more')}</Text>
                <View style={styles.moreList}>
                  {FUTURE.map(({ key, icon, accent, lightBackground, darkBackground }) => (
                    <View
                      key={key}
                      style={[
                        styles.moreRow,
                        { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.moreIcon,
                          { backgroundColor: isDark ? darkBackground : lightBackground },
                        ]}
                      >
                        <Ionicons name={icon} size={20} color={accent} />
                      </View>
                      <Text style={[styles.moreLabel, { color: themeColors.textBody }]}>
                        {t(`settings.${key}`)}
                      </Text>
                      <StatusBadge variant="warning" dot label={t('settings.comingSoon')} />
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    maxHeight: '88%',
  },
  scroll: { gap: spacing.md, paddingBottom: spacing.sm },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },

  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  sectionLabelInline: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoHint: { fontSize: fontSizes.caption, lineHeight: 16 },
  demoSubLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  chipTextActive: { fontWeight: fontWeights.semibold },

  appearanceRow: { flexDirection: 'row', gap: spacing.sm },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    position: 'relative',
  },
  appearanceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheck: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },
  appearanceLabelActive: { fontWeight: fontWeights.semibold },

  sectionHeaderRow: {
    gap: 2,
    marginTop: spacing.md,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paletteCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    position: 'relative',
    justifyContent: 'center',
  },
  palettePreviewRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  paletteTitle: {
    fontSize: 12.5,
    fontWeight: fontWeights.semibold,
  },

  moreList: { gap: spacing.xs },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  moreIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreLabel: { flex: 1, fontSize: fontSizes.body },
});
