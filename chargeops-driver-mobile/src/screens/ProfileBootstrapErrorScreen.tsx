import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { ProfileApiError } from '@/services/profileService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

/** Recoverable state when the authenticated token exists but profile bootstrap fails. */
export function ProfileBootstrapErrorScreen() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const { profileError, retryProfile, signOut } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const errorCode =
    profileError instanceof ProfileApiError ? profileError.code : undefined;

  async function handleRetry() {
    setRetrying(true);
    try {
      await retryProfile();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: themeColors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: themeColors.surfaceAlt },
          ]}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={42}
            color={themeColors.error}
          />
        </View>
        <Text style={[styles.title, { color: themeColors.textStrong }]}>
          {t('profileBootstrap.title')}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          {errorCode === 'PROFILE_001'
            ? t('profileBootstrap.emailConflict')
            : t('profileBootstrap.subtitle')}
        </Text>
        {errorCode ? (
          <View
            style={[
              styles.codeBadge,
              {
                backgroundColor: themeColors.surfaceAlt,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={[styles.codeText, { color: themeColors.textMuted }]}>
              {t('profileBootstrap.errorCode', { code: errorCode })}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <AppButton
          label={t('profileBootstrap.retry')}
          onPress={() => void handleRetry()}
          loading={retrying}
        />
        <AppButton
          label={t('profileBootstrap.signOut')}
          onPress={() => void signOut()}
          variant="secondary"
          disabled={retrying}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.title,
    lineHeight: lineHeights.title,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    textAlign: 'center',
  },
  codeBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  codeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  actions: { gap: spacing.md },
});
