import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, BrandMark, FeatureArt, LegalDocumentSheet, SettingsModal, type FeatureName } from '@/components';
import type { LegalDocType } from '@/content/legal';
import { useAuth } from '@/context/AuthContext';
import { makeMockSession, usersMock } from '@/mock/users.mock';
import type { RootStackParamList } from '@/navigation/types';
import { isMockMode } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

/** The banner art is 3:1; sized explicitly because react-native-web ignores aspectRatio on absolute images. */
const BANNER_HEIGHT = 180;

const FEATURES: { art: FeatureName; key: 'fast' | 'find' | 'pay' }[] = [
  { art: 'charging', key: 'fast' },
  { art: 'find', key: 'find' },
  { art: 'pay', key: 'pay' },
];

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);
  // The sample-driver shortcut stays on web (the public demo), but the badge only shows
  // when the app really runs on mock data, so production web isn't labelled as a mock.
  const mockData = isMockMode();
  const demoAvailable = mockData || Platform.OS === 'web';

  function handleQuickMockLogin() {
    const mockDriver = usersMock[0];
    signIn(makeMockSession(mockDriver));
  }


  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Settings (language, appearance, …) & Mock status */}
        <View style={styles.topBar}>
          {mockData ? (
            <View style={styles.mockBadge}>
              <Ionicons name="flask-outline" size={14} color={colors.primary} />
              <Text style={styles.mockBadgeText}>{t('welcome.mockBadge')}</Text>
            </View>
          ) : (
            <View />
          )}
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
        <BrandMark size={76} style={styles.logo} />

        {/* Headline */}
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

        {/* Accent line */}
        <View style={styles.accent} />

        {/* Feature chips */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.featureItem}>
              <FeatureArt name={f.art} size={68} />
              <Text style={styles.featureLabel}>{t(`welcome.features.${f.key}`)}</Text>
            </View>
          ))}
        </View>

        {/* Station image banner */}
        <View style={styles.imageBanner}>
          {/* 3:1 illustration, anchored right so the car and charger stay in frame on narrow screens. */}
          <Image
            source={require('../../assets/header-background.png')}
            style={styles.bannerImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.imageCaptionRow}>
            <Ionicons name="flash" size={14} color={colors.primary} />
            <Text style={styles.imageCaption}>{t('welcome.coverage')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <View style={styles.footer}>
        {demoAvailable && (
          <AppButton
            label={t('welcome.quickDemo')}
            onPress={handleQuickMockLogin}
            style={styles.mockCtaButton}
          />
        )}
        <AppButton
          label={t('welcome.cta')}
          variant={demoAvailable ? 'secondary' : 'primary'}
          onPress={() => navigation.navigate('Login')}
          style={styles.ctaButton}
        />
        <Text style={styles.footerNote}>
          {t('welcome.agreePrefix')}
          <Text style={styles.footerLink} onPress={() => setLegalDoc('terms')}>
            {t('common.terms')}
          </Text>
          {t('welcome.and')}
          <Text style={styles.footerLink} onPress={() => setLegalDoc('privacy')}>
            {t('common.privacy')}
          </Text>
        </Text>
      </View>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LegalDocumentSheet
        visible={legalDoc !== null}
        type={legalDoc ?? 'terms'}
        onClose={() => setLegalDoc(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Phone-width column, centred on tablets and desktop browsers.
  scroll: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },

  // Top bar (settings entry)
  topBar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  mockBadgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
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
  logo: {
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
    gap: spacing.xs,
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
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: BANNER_HEIGHT,
    width: BANNER_HEIGHT * 3,
  },
  imageCaptionRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  imageCaption: {
    flexShrink: 1,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textStrong,
    lineHeight: lineHeights.caption,
  },

  // Footer
  footer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
  mockCtaButton: {
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
