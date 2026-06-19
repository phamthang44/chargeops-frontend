import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, PasswordField, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/i18n/authErrors';
import type { RootStackParamList } from '@/navigation/types';
import { login } from '@/services/authService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const EMAIL_RE = /\S+@\S+\.\S+/;

/** Email + password login (SRS FR01). On success, signIn flips the app to the Tabs stack. */
export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = EMAIL_RE.test(email) && password.length >= 8 && !submitting;

  async function handleLogin() {
    setFormError(null);
    setSubmitting(true);
    try {
      const session = await login({ email, password });
      signIn(session);
    } catch (e) {
      setFormError(authErrorMessage(t, e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('login.headerTitle')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <View style={styles.form}>
            <TextField
              label={t('login.emailLabel')}
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder={t('login.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <PasswordField
              label={t('login.passwordLabel')}
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder={t('login.passwordPlaceholder')}
            />

            <Pressable style={styles.forgot} hitSlop={6}>
              <Text style={styles.forgotText}>{t('login.forgot')}</Text>
            </Pressable>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          </View>

          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={styles.securityText}>{t('login.securityNote')}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label={t('login.cta')} onPress={handleLogin} loading={submitting} disabled={!canSubmit} style={styles.cta} />
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={6}>
            <Text style={styles.switchText}>
              {t('login.noAccount')}
              <Text style={styles.switchLink}>{t('login.signUp')}</Text>
            </Text>
          </Pressable>
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
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  title: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textStrong, lineHeight: lineHeights.display },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted, lineHeight: lineHeights.body },
  form: { gap: spacing.lg },
  forgot: { alignSelf: 'flex-end' },
  forgotText: { fontSize: fontSizes.caption, color: colors.primary, fontWeight: fontWeights.medium },
  formError: { fontSize: fontSizes.caption, color: colors.error },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  securityText: { flex: 1, fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.caption },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  cta: { height: 52, borderRadius: radius.lg },
  switchText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
  switchLink: { color: colors.primary, fontWeight: fontWeights.semibold },
});
