import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, OtpInput } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/i18n/authErrors';
import type { RootStackParamList } from '@/navigation/types';
import { resendOtp, verifyOtp } from '@/services/authService';
import { colors, fontSizes, fontWeights, lineHeights, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;
type Route = RouteProp<RootStackParamList, 'OtpVerification'>;

const RESEND_SECONDS = 60;

/** Mask a phone/email target for display, e.g. +84•••••4321 / a•••@example.com. */
function maskTarget(channel: 'phone' | 'email', target: string): string {
  if (channel === 'phone') {
    return target.length > 4 ? `${target.slice(0, 3)}••••${target.slice(-4)}` : target;
  }
  const [local, domain] = target.split('@');
  if (!domain) return target;
  return `${local.slice(0, 1)}•••@${domain}`;
}

/** Enter the 6-digit OTP. On success, signIn flips the app to the Tabs stack (auto-login). */
export function OtpVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { signIn } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      const session = await verifyOtp(params.target, code);
      signIn(session);
    } catch (e) {
      setError(authErrorMessage(t, e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    await resendOtp(params.target);
    setCode('');
    setError(null);
    setCooldown(RESEND_SECONDS);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('otp.headerTitle')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.body}>
          <Text style={styles.title}>{t('otp.title')}</Text>
          <Text style={styles.subtitle}>
            <Trans
              i18nKey={params.channel === 'phone' ? 'otp.sentToPhone' : 'otp.sentToEmail'}
              values={{ target: maskTarget(params.channel, params.target) }}
              components={[<Text key="t" style={styles.target} />]}
            />
          </Text>

          <OtpInput value={code} onChangeText={setCode} length={6} error={!!error} />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>{t('otp.noCode')}</Text>
            {cooldown > 0 ? (
              <Text style={styles.resendMuted}>{t('otp.resendIn', { seconds: cooldown })}</Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={6}>
                <Text style={styles.resendLink}>{t('otp.resend')}</Text>
              </Pressable>
            )}
          </View>

          <Pressable onPress={() => navigation.goBack()} hitSlop={6}>
            <Text style={styles.changeLink}>{t('otp.changeNumber')}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <AppButton
            label={t('otp.cta')}
            onPress={handleVerify}
            loading={submitting}
            disabled={code.length !== 6 || submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  title: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textStrong, lineHeight: lineHeights.display },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted, lineHeight: lineHeights.body },
  target: { color: colors.textStrong, fontWeight: fontWeights.semibold },
  error: { fontSize: fontSizes.caption, color: colors.error },
  resendRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  resendText: { fontSize: fontSizes.body, color: colors.textMuted },
  resendMuted: { fontSize: fontSizes.body, color: colors.textMuted, fontWeight: fontWeights.medium },
  resendLink: { fontSize: fontSizes.body, color: colors.primary, fontWeight: fontWeights.semibold },
  changeLink: { fontSize: fontSizes.body, color: colors.primary, fontWeight: fontWeights.medium },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
});
