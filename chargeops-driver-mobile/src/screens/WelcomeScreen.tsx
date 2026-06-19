import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, SettingsModal } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const FEATURES = [
  { icon: 'flash' as const, key: 'fast' as const },
  { icon: 'location' as const, key: 'find' as const },
  { icon: 'card' as const, key: 'pay' as const },
] as const;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Settings (language, appearance, …) — available before login */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.settingsBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('settings.open')}
            onPress={() => setSettingsOpen(true)}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textBody} />
          </Pressable>
        </View>

        {/* App logo */}
        <View style={styles.logoBox}>
          <Ionicons name="flash" size={40} color={colors.textInverse} />
        </View>

        {/* Headline */}
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

        {/* Accent line */}
        <View style={styles.accent} />

        {/* Feature chips */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.featureLabel}>{t(`welcome.features.${f.key}`)}</Text>
            </View>
          ))}
        </View>

        {/* Station image banner */}
        <View style={styles.imageBanner}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business-outline" size={56} color="rgba(255,255,255,0.25)" />
          </View>
          <View style={styles.imageCaptionRow}>
            <Text style={styles.imageCaption}>{t('welcome.coverage')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={styles.footer}>
        <AppButton
          label={t('welcome.cta')}
          onPress={() => navigation.navigate('Login')}
          style={styles.ctaButton}
        />
        <Text style={styles.footerNote}>
          {t('welcome.agreePrefix')}
          <Text style={styles.footerLink} onPress={() => {}}>
            {t('common.terms')}
          </Text>
          {t('welcome.and')}
          <Text style={styles.footerLink} onPress={() => {}}>
            {t('common.privacy')}
          </Text>
        </Text>
      </View>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },

  // Top bar (settings entry)
  topBar: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.textStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  // Headline
  title: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
    color: colors.textStrong,
    textAlign: 'center',
    lineHeight: lineHeights.display,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.body,
    marginBottom: spacing.lg,
  },

  // Accent
  accent: {
    width: 32,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginBottom: spacing.xl,
  },

  // Features
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.caption,
  },

  // Image banner
  imageBanner: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2D3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCaptionRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(17,24,39,0.55)',
  },
  imageCaption: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textInverse,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  ctaButton: {
    height: 52,
    borderRadius: radius.lg,
  },
  footerNote: {
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.caption,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
});
