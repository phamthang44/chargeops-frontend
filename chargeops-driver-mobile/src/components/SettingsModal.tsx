import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences, type AppearanceMode } from '@/context/PreferencesContext';
import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import { LanguageSwitcher } from './LanguageSwitcher';
import { StatusBadge } from './StatusBadge';

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
  },
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
