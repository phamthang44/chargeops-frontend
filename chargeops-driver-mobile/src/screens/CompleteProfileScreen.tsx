import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, PhoneField, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { ProfileApiError } from '@/services/profileService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

interface FormErrors {
  displayName?: string;
  phone?: string;
}

/** Required profile gate shown before an authenticated driver can enter the app. */
export function CompleteProfileScreen() {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const { session, profile, completeProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(
    initialDisplayName(
      profile?.displayName,
      session?.user.name,
      profile?.email ?? session?.user.email,
    ),
  );
  const [phone, setPhone] = useState(
    toLocalVietnamesePhone(profile?.phone ?? session?.user.phone ?? ''),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => displayName.trim().length > 0 && digitsOnly(phone).length >= 9,
    [displayName, phone],
  );

  async function handleSubmit() {
    const nextErrors = validateForm(displayName, phone, t);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const normalizedPhone = toE164VietnamesePhone(phone);
    setSubmitting(true);
    try {
      await completeProfile({
        displayName: displayName.trim(),
        phone: normalizedPhone,
      });
    } catch (reason: unknown) {
      if (reason instanceof ProfileApiError) {
        setErrors({
          displayName: reason.fieldMessage('displayName'),
          phone: reason.fieldMessage('phone'),
        });
        setFormError(
          reason.code === 'PROFILE_001'
            ? t('completeProfile.errors.emailConflict')
            : t('completeProfile.errors.submit'),
        );
      } else {
        setFormError(t('completeProfile.errors.submit'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: themeColors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={36}
              color={themeColors.primary}
            />
          </View>

          <View style={styles.heading}>
            <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
              {t('completeProfile.eyebrow')}
            </Text>
            <Text style={[styles.title, { color: themeColors.textStrong }]}>
              {t('completeProfile.title')}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              {t('completeProfile.subtitle')}
            </Text>
          </View>

          <View
            style={[
              styles.emailCard,
              {
                backgroundColor: themeColors.surfaceAlt,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={themeColors.textMuted}
            />
            <View style={styles.emailText}>
              <Text style={[styles.emailLabel, { color: themeColors.textMuted }]}>
                {t('completeProfile.emailLabel')}
              </Text>
              <Text
                style={[styles.emailValue, { color: themeColors.textStrong }]}
                numberOfLines={1}
              >
                {profile?.email ?? session?.user.email}
              </Text>
            </View>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={themeColors.success}
            />
          </View>

          <View style={styles.form}>
            <TextField
              label={t('completeProfile.displayNameLabel')}
              value={displayName}
              onChangeText={(value) => {
                setDisplayName(value);
                setErrors((current) => ({ ...current, displayName: undefined }));
              }}
              placeholder={t('completeProfile.displayNamePlaceholder')}
              leftIcon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              maxLength={255}
              error={errors.displayName}
              returnKeyType="next"
            />
            <PhoneField
              label={t('completeProfile.phoneLabel')}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setErrors((current) => ({ ...current, phone: undefined }));
              }}
              error={errors.phone}
            />
          </View>

          <View
            style={[
              styles.notice,
              {
                backgroundColor: themeColors.primarySoft,
                borderColor: themeColors.primary,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={themeColors.primary}
            />
            <Text style={[styles.noticeText, { color: themeColors.textBody }]}>
              {t('completeProfile.notice')}
            </Text>
          </View>

          {formError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: themeColors.surfaceAlt,
                  borderColor: themeColors.error,
                },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={themeColors.error}
              />
              <Text style={[styles.errorText, { color: themeColors.error }]}>
                {formError}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <AppButton
            label={t('completeProfile.submit')}
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={!canSubmit || submitting}
          />
          <AppButton
            label={t('completeProfile.signOut')}
            onPress={() => void signOut()}
            variant="secondary"
            disabled={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function validateForm(
  displayName: string,
  phone: string,
  t: (key: string) => string,
): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = displayName.trim();
  const localPhone = normalizeLocalVietnamesePhone(phone);

  if (!trimmedName) {
    errors.displayName = t('completeProfile.errors.displayNameRequired');
  } else if (trimmedName.length > 255) {
    errors.displayName = t('completeProfile.errors.displayNameMax');
  }

  if (!localPhone) {
    errors.phone = t('completeProfile.errors.phoneRequired');
  } else if (!/^[35789]\d{8}$/.test(localPhone)) {
    errors.phone = t('completeProfile.errors.phoneInvalid');
  }

  return errors;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function initialDisplayName(
  profileName?: string | null,
  sessionName?: string,
  email?: string,
): string {
  if (profileName?.trim()) return profileName;
  if (!sessionName?.trim() || sessionName.trim().toLowerCase() === email?.trim().toLowerCase()) {
    return '';
  }
  return sessionName;
}

function normalizeLocalVietnamesePhone(value: string): string {
  let digits = digitsOnly(value);
  if (digits.startsWith('84')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function toLocalVietnamesePhone(value: string): string {
  return normalizeLocalVietnamesePhone(value);
}

function toE164VietnamesePhone(value: string): string {
  return `+84${normalizeLocalVietnamesePhone(value)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: spacing.sm },
  eyebrow: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  emailText: { flex: 1, gap: spacing.xs },
  emailLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  emailValue: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  form: { gap: spacing.lg },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
