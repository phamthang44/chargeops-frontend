import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResponseType, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components';
import { useAuth } from '@/context/AuthContext';
import {
  consumeWebAuthTransaction,
  createSessionFromKeycloakToken,
  exchangeKeycloakAuthorizationCode,
  getKeycloakRedirectUri,
  keycloakConfig,
  storeWebAuthTransaction,
} from '@/services/keycloakAuthService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

WebBrowser.maybeCompleteAuthSession();

/** Hosted Keycloak login. The app receives only the authorization code/tokens. */
export function KeycloakLoginScreen() {
  const { i18n, t } = useTranslation();
  const { signIn } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const discovery = useAutoDiscovery(keycloakConfig.issuerUrl);
  const redirectUri = useMemo(() => getKeycloakRedirectUri(), []);
  const keycloakLocale = i18n.resolvedLanguage?.toLowerCase().startsWith('en') ? 'en' : 'vi';
  const callbackStarted = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: keycloakConfig.clientId,
      redirectUri,
      responseType: ResponseType.Code,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
      extraParams: { ui_locales: keycloakLocale },
    },
    discovery,
  );

  const completeAuthorization = useCallback(
    async (code: string, codeVerifier: string) => {
      if (!discovery) throw new Error(t('login.authNotReady'));

      const tokenResponse = await exchangeKeycloakAuthorizationCode(
        code,
        codeVerifier,
        redirectUri,
        discovery,
      );
      const session = await createSessionFromKeycloakToken(tokenResponse, discovery);
      signIn(session);
    },
    [discovery, redirectUri, signIn, t],
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!response) return;
    if (response.type !== 'success') {
      if (response.type === 'error') setFormError(t('login.authError'));
      return;
    }
    if (!discovery || !request?.codeVerifier || !response.params.code) return;

    let active = true;
    setSubmitting(true);
    setFormError(null);
    void completeAuthorization(response.params.code, request.codeVerifier)
      .catch((reason: unknown) => {
        if (active) setFormError(reason instanceof Error ? reason.message : t('login.authError'));
      })
      .finally(() => {
        if (active) setSubmitting(false);
      });

    return () => {
      active = false;
    };
  }, [completeAuthorization, discovery, request?.codeVerifier, response, t]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !discovery || callbackStarted.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const providerError = params.get('error');
    if (!code && !providerError) return;

    callbackStarted.current = true;
    const transaction = consumeWebAuthTransaction();
    window.history.replaceState({}, document.title, redirectUri);

    if (!transaction || params.get('state') !== transaction.state) {
      setFormError(t('login.authError'));
      return;
    }

    if (providerError) {
      if (
        transaction.mode === 'silent' &&
        ['login_required', 'interaction_required', 'consent_required'].includes(providerError)
      ) {
        navigation.replace('Welcome');
        return;
      }
      setFormError(params.get('error_description') ?? t('login.authError'));
      return;
    }

    if (!code) {
      setFormError(t('login.authError'));
      return;
    }

    let active = true;
    setSubmitting(true);
    setFormError(null);
    void completeAuthorization(code, transaction.codeVerifier)
      .catch((reason: unknown) => {
        if (active) setFormError(reason instanceof Error ? reason.message : t('login.authError'));
      })
      .finally(() => {
        if (active) setSubmitting(false);
      });

    return () => {
      active = false;
    };
  }, [completeAuthorization, discovery, navigation, redirectUri, t]);

  async function handleLogin() {
    setFormError(null);
    if (!discovery || !request) {
      setFormError(t('login.authNotReady'));
      return;
    }
    setSubmitting(true);
    try {
      if (Platform.OS === 'web') {
        if (!request.url || !request.codeVerifier) {
          throw new Error(t('login.authNotReady'));
        }

        storeWebAuthTransaction(request.state, request.codeVerifier, 'interactive');
        window.location.assign(request.url);
        return;
      }

      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') setSubmitting(false);
    } catch (reason: unknown) {
      setSubmitting(false);
      setFormError(reason instanceof Error ? reason.message : t('login.authError'));
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.brandMark}>
          <Ionicons name="flash" size={24} color={colors.primary} />
        </View>
        <Text style={styles.eyebrow}>ChargeOps</Text>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        <View style={styles.infoBox}>
          <Ionicons name="globe-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{t('login.hostedDescription')}</Text>
        </View>
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.securityText}>{t('login.securityNote')}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          label={t('login.cta')}
          onPress={() => void handleLogin()}
          loading={submitting}
          disabled={submitting}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.lg },
  brandMark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  eyebrow: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.primary },
  title: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textStrong, lineHeight: lineHeights.display },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted, lineHeight: lineHeights.body },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  infoText: { flex: 1, fontSize: fontSizes.body, lineHeight: lineHeights.body, color: colors.textBody },
  formError: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption, color: colors.error },
  securityBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md },
  securityText: { flex: 1, fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.caption },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  cta: { height: 52, borderRadius: radius.lg },
});
