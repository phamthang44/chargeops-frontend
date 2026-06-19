import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Checkbox, PasswordField, PhoneField, TextField } from '@/components';
import { authErrorMessage } from '@/i18n/authErrors';
import type { RootStackParamList } from '@/navigation/types';
import { register } from '@/services/authService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const EMAIL_RE = /\S+@\S+\.\S+/;

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
}

/** Driver registration form (name, email, +84 phone, password). role is fixed to DRIVER. */
export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = t('register.errors.name');
    if (!EMAIL_RE.test(email)) next.email = t('register.errors.email');
    const localPhone = phone.replace(/\s/g, '');
    if (localPhone.length < 9 || localPhone.length > 10) next.phone = t('register.errors.phone');
    if (password.length < 8) next.password = t('register.errors.password');
    if (confirm !== password) next.confirm = t('register.errors.confirm');
    return next;
  }

  const canSubmit =
    name.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    phone.replace(/\s/g, '').length >= 9 &&
    password.length >= 8 &&
    confirm === password &&
    agreed &&
    !submitting;

  async function handleRegister() {
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const localPhone = phone.replace(/\s/g, '').replace(/^0/, '');
      const fullPhone = `+84${localPhone}`;
      const { channel, target } = await register({ name: name.trim(), email: email.trim(), phone: fullPhone, password });
      navigation.navigate('OtpVerification', { channel, target });
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
        <Text style={styles.headerTitle}>{t('register.headerTitle')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('register.title')}</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

          <View style={styles.form}>
            <TextField
              label={t('register.nameLabel')}
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder={t('register.namePlaceholder')}
              error={errors.name}
            />
            <TextField
              label={t('register.emailLabel')}
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder={t('register.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <PhoneField label={t('register.phoneLabel')} value={phone} onChangeText={setPhone} error={errors.phone} />
            <PasswordField
              label={t('register.passwordLabel')}
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder={t('register.passwordPlaceholder')}
              error={errors.password}
            />
            <PasswordField
              label={t('register.confirmLabel')}
              leftIcon="lock-closed-outline"
              value={confirm}
              onChangeText={setConfirm}
              placeholder={t('register.confirmPlaceholder')}
              error={errors.confirm}
            />

            <Checkbox checked={agreed} onChange={setAgreed}>
              {t('register.agreePrefix')}
              <Text style={styles.link}>{t('common.terms')}</Text>
              {t('register.agreeMid')}
              <Text style={styles.link}>{t('common.privacy')}</Text>
              {t('register.agreeSuffix')}
            </Checkbox>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label={t('register.cta')} onPress={handleRegister} loading={submitting} disabled={!canSubmit} style={styles.cta} />
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={6}>
            <Text style={styles.switchText}>
              {t('register.hasAccount')}
              <Text style={styles.switchLink}>{t('register.signIn')}</Text>
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
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },
  title: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textStrong, lineHeight: lineHeights.display },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted, lineHeight: lineHeights.body },
  form: { gap: spacing.lg },
  link: { color: colors.primary, fontWeight: fontWeights.medium },
  formError: { fontSize: fontSizes.caption, color: colors.error },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  cta: { height: 52, borderRadius: radius.lg },
  switchText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
  switchLink: { color: colors.primary, fontWeight: fontWeights.semibold },
});
