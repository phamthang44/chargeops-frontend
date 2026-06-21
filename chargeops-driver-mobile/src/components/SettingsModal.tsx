import { Ionicons } from '@expo/vector-icons';
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
import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import { LanguageSwitcher } from './LanguageSwitcher';
import { StatusBadge } from './StatusBadge';

const PAYMENT_OUTCOMES: PaymentSimOutcome[] = ['SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT', 'RANDOM'];
const BOOKING_OUTCOMES: BookingSimOutcome[] = ['SUCCESS', 'SLOT_TAKEN', 'NETWORK_ERROR', 'RANDOM'];

const APPEARANCE: { mode: AppearanceMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', icon: 'sunny-outline' },
  { mode: 'dark', icon: 'moon-outline' },
  { mode: 'system', icon: 'phone-portrait-outline' },
];

// Placeholder rows for future settings work.
const FUTURE: { key: 'notifications' | 'help' | 'about'; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'notifications', icon: 'notifications-outline' },
  { key: 'help', icon: 'help-circle-outline' },
  { key: 'about', icon: 'information-circle-outline' },
];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

/** Bottom-sheet settings menu: language, appearance, and future options. */
export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { appearance, setAppearance } = usePreferences();
  const [sim, setSim] = useState(getSimConfig);

  function pickPayment(outcome: PaymentSimOutcome) {
    setPaymentSim(outcome);
    setSim((s) => ({ ...s, payment: outcome }));
  }
  function pickBooking(outcome: BookingSimOutcome) {
    setBookingSim(outcome);
    setSim((s) => ({ ...s, booking: outcome }));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <Pressable style={styles.closeBtn} hitSlop={8} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textBody} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Language */}
            <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
            <LanguageSwitcher />

            {/* Appearance */}
            <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
            <View style={styles.appearanceRow}>
              {APPEARANCE.map(({ mode, icon }) => {
                const active = appearance === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[styles.appearanceOption, active && styles.appearanceActive]}
                    onPress={() => setAppearance(mode)}
                  >
                    <Ionicons name={icon} size={22} color={active ? colors.primary : colors.textMuted} />
                    <Text style={[styles.appearanceLabel, active && styles.appearanceLabelActive]}>
                      {t(`settings.appearanceOptions.${mode}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Demo / simulation (mock only) */}
            <View style={styles.demoHeader}>
              <Ionicons name="flask-outline" size={16} color={colors.textMuted} />
              <Text style={styles.sectionLabelInline}>{t('settings.demo')}</Text>
            </View>
            <Text style={styles.demoHint}>{t('settings.demoHint')}</Text>

            <Text style={styles.demoSubLabel}>{t('settings.demoPayment')}</Text>
            <View style={styles.chipRow}>
              {PAYMENT_OUTCOMES.map((o) => {
                const active = sim.payment === o;
                return (
                  <Pressable
                    key={o}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => pickPayment(o)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t(`settings.simPayment.${o}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.demoSubLabel}>{t('settings.demoBooking')}</Text>
            <View style={styles.chipRow}>
              {BOOKING_OUTCOMES.map((o) => {
                const active = sim.booking === o;
                return (
                  <Pressable
                    key={o}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => pickBooking(o)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t(`settings.simBooking.${o}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Future work */}
            <Text style={styles.sectionLabel}>{t('settings.more')}</Text>
            <View style={styles.moreList}>
              {FUTURE.map(({ key, icon }) => (
                <View key={key} style={styles.moreRow}>
                  <Ionicons name={icon} size={20} color={colors.textMuted} />
                  <Text style={styles.moreLabel}>{t(`settings.${key}`)}</Text>
                  <StatusBadge variant="neutral" label={t('settings.comingSoon')} />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },

  // Demo / simulation
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  sectionLabelInline: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoHint: { fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: 16 },
  demoSubLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textBody, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium, color: colors.textMuted },
  chipTextActive: { color: colors.primaryDark, fontWeight: fontWeights.semibold },

  appearanceRow: { flexDirection: 'row', gap: spacing.sm },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  appearanceActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  appearanceLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },
  appearanceLabelActive: { color: colors.primaryDark, fontWeight: fontWeights.semibold },

  moreList: { gap: spacing.xs },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  moreLabel: { flex: 1, fontSize: fontSizes.body, color: colors.textBody },
});
