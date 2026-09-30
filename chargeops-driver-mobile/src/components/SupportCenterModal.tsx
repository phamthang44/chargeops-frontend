import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/navigation/types';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { AppButton } from './AppButton';
import { StatusBadge } from './StatusBadge';

interface SupportCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

const HELP_TOPICS: {
  key: 'account' | 'booking' | 'payment';
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  lightBackground: string;
  darkBackground: string;
}[] = [
  { key: 'account', icon: 'shield-checkmark-outline', accent: '#10B981', lightBackground: '#ECFDF5', darkBackground: '#113322' },
  { key: 'booking', icon: 'calendar-outline', accent: '#3B82F6', lightBackground: '#EFF6FF', darkBackground: '#172554' },
  { key: 'payment', icon: 'wallet-outline', accent: '#F59E0B', lightBackground: '#FFFBEB', darkBackground: '#422006' },
];

/** In-app self-service help that does not pretend a production mail channel exists. */
export function SupportCenterModal({ visible, onClose }: SupportCenterModalProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
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
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('profile.support.title')}
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                {t('profile.support.subtitle')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={8}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: themeColors.surfaceAlt }]}
            >
              <Ionicons name="close" size={22} color={themeColors.textBody} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View
              style={[
                styles.welcomeCard,
                { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primary },
              ]}
            >
              <View style={[styles.welcomeIcon, { backgroundColor: themeColors.primary }]}>
                <Ionicons name="help-buoy" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.welcomeCopy}>
                <Text style={[styles.welcomeTitle, { color: themeColors.primaryDark }]}>
                  {t('profile.support.welcomeTitle')}
                </Text>
                <Text style={[styles.welcomeBody, { color: themeColors.textBody }]}>
                  {t('profile.support.welcomeBody')}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
              {t('profile.support.quickHelp')}
            </Text>
            <View style={styles.topicList}>
              {HELP_TOPICS.map(({ key, icon, accent, lightBackground, darkBackground }) => (
                <View
                  key={key}
                  style={[
                    styles.topicCard,
                    { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.topicIcon,
                      { backgroundColor: isDark ? darkBackground : lightBackground },
                    ]}
                  >
                    <Ionicons name={icon} size={21} color={accent} />
                  </View>
                  <View style={styles.topicCopy}>
                    <Text style={[styles.topicTitle, { color: themeColors.textStrong }]}>
                      {t(`profile.support.topics.${key}.title`)}
                    </Text>
                    <Text style={[styles.topicBody, { color: themeColors.textMuted }]}>
                      {t(`profile.support.topics.${key}.body`)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Interactive Support Ticket Center (FE-13) */}
            <View style={styles.ticketActionsSection}>
              <Pressable
                style={[
                  styles.ticketActionBtn,
                  {
                    backgroundColor: themeColors.primarySoft,
                    borderColor: themeColors.primary,
                  },
                ]}
                onPress={() => {
                  onClose();
                  navigation.navigate('MyTickets');
                }}
              >
                <View style={[styles.ticketActionIcon, { backgroundColor: themeColors.primary }]}>
                  <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.ticketActionCopy}>
                  <Text style={[styles.ticketActionTitle, { color: themeColors.primaryDark }]}>
                    {t('profile.support.myTicketsTitle')}
                  </Text>
                  <Text style={[styles.ticketActionSub, { color: themeColors.textBody }]}>
                    {t('profile.support.myTicketsBody')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
              </Pressable>

              <Pressable
                style={[
                  styles.ticketActionBtn,
                  {
                    backgroundColor: themeColors.surfaceAlt,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => {
                  onClose();
                  navigation.navigate('CreateTicket', {});
                }}
              >
                <View style={[styles.ticketActionIcon, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
                  <Ionicons name="add-circle-outline" size={22} color="#3B82F6" />
                </View>
                <View style={styles.ticketActionCopy}>
                  <Text style={[styles.ticketActionTitle, { color: themeColors.textStrong }]}>
                    {t('profile.support.newTicketTitle')}
                  </Text>
                  <Text style={[styles.ticketActionSub, { color: themeColors.textMuted }]}>
                    {t('profile.support.newTicketBody')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
              </Pressable>
            </View>
          </ScrollView>

          <AppButton label={t('profile.support.close')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '84%',
    maxHeight: '94%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  handle: { width: 40, height: 4, borderRadius: radius.full, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  subtitle: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: spacing.lg, paddingBottom: spacing.sm },
  welcomeCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  welcomeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCopy: { flex: 1, gap: spacing.xs },
  welcomeTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  welcomeBody: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  sectionLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicList: { gap: spacing.sm },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  topicIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCopy: { flex: 1, gap: 2 },
  topicTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  topicBody: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  requestCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  requestTitle: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  requestBody: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  ticketActionsSection: { gap: spacing.sm },
  ticketActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  ticketActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketActionCopy: { flex: 1, gap: 2 },
  ticketActionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  ticketActionSub: { fontSize: fontSizes.caption - 1, lineHeight: 16 },
});
