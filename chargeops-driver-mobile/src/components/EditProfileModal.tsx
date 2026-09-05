import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { ProfileApiError } from '@/services/profileService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { buildImageKitUrl, getAvatarUrl } from '@/utils/imagekit';
import { AppButton } from './AppButton';
import { AvatarUploadModal } from './AvatarUploadModal';
import { PhoneField } from './PhoneField';
import { TextField } from './TextField';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FormErrors {
  displayName?: string;
  phone?: string;
}

/** Edit backend-owned profile fields while keeping identity security in Keycloak. */
export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile, session, completeProfile } = useAuth();
  const { themeColors, isDark } = usePreferences();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const userAvatar = profile?.avatarUrl ?? session?.user.avatarUrl ?? null;
  const initials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .slice(-2)
        .join('')
    : 'EV';

  useEffect(() => {
    if (!visible) return;
    setDisplayName(profile?.displayName ?? session?.user.name ?? '');
    setPhone(toLocalVietnamesePhone(profile?.phone ?? session?.user.phone ?? ''));
    setErrors({});
    setFormError(null);
  }, [profile?.displayName, profile?.phone, session?.user.name, session?.user.phone, visible]);

  const canSubmit = useMemo(
    () => displayName.trim().length > 0 && normalizeLocalVietnamesePhone(phone).length === 9,
    [displayName, phone],
  );

  async function handleSubmit() {
    const nextErrors = validateForm(displayName, phone, t);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await completeProfile({
        displayName: displayName.trim(),
        phone: toE164VietnamesePhone(phone),
      });
      onClose();
      Alert.alert(t('profile.edit.successTitle'), t('profile.edit.successBody'));
    } catch (reason: unknown) {
      if (reason instanceof ProfileApiError) {
        setErrors({
          displayName: reason.fieldMessage('displayName'),
          phone: reason.fieldMessage('phone'),
        });
      }
      setFormError(t('profile.edit.errors.submit'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={styles.root}>
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={submitting ? undefined : onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
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
                  {t('profile.edit.title')}
                </Text>
                <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                  {t('profile.edit.subtitle')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit.cancel')}
                disabled={submitting}
                hitSlop={8}
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: themeColors.surfaceAlt }]}
              >
                <Ionicons name="close" size={22} color={themeColors.textBody} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}
            >
              {/* Avatar Preview & Edit Button */}
              <View style={styles.avatarRow}>
                <Pressable
                  style={styles.avatarCircle}
                  onPress={() => setAvatarModalOpen(true)}
                  hitSlop={6}
                >
                  {userAvatar ? (
                    <Image
                      source={{
                        uri: getAvatarUrl(userAvatar, 160),
                      }}
                      style={styles.avatarImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primarySoft }]}>
                      <Text style={[styles.avatarText, { color: themeColors.primaryDark }]}>{initials}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.avatarBadge,
                      { backgroundColor: themeColors.primary, borderColor: themeColors.surface },
                    ]}
                  >
                    <Ionicons name="camera" size={11} color="#FFFFFF" />
                  </View>
                </Pressable>
                <Pressable onPress={() => setAvatarModalOpen(true)} hitSlop={8}>
                  <Text style={[styles.changeAvatarText, { color: themeColors.primary }]}>
                    {userAvatar
                      ? t('profile.changeAvatar', 'Thay đổi ảnh đại diện')
                      : t('profile.uploadAvatar', 'Tải ảnh đại diện')}
                  </Text>
                </Pressable>
              </View>

              <TextField
                label={t('profile.edit.displayNameLabel')}
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  setErrors((current) => ({ ...current, displayName: undefined }));
                }}
                placeholder={t('profile.edit.displayNamePlaceholder')}
                leftIcon="person-outline"
                autoCapitalize="words"
                autoComplete="name"
                maxLength={255}
                error={errors.displayName}
              />
              <PhoneField
                label={t('profile.edit.phoneLabel')}
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setErrors((current) => ({ ...current, phone: undefined }));
                }}
                error={errors.phone}
              />

              <View
                style={[
                  styles.identityNotice,
                  { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={themeColors.textMuted} />
                <Text style={[styles.identityNoticeText, { color: themeColors.textMuted }]}>
                  {t('profile.edit.identityNotice')}
                </Text>
              </View>

              {formError ? (
                <View style={[styles.errorBanner, { borderColor: themeColors.error }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={themeColors.error} />
                  <Text style={[styles.errorText, { color: themeColors.error }]}>{formError}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <AppButton
                label={t('profile.edit.save')}
                loading={submitting}
                disabled={!canSubmit || submitting}
                onPress={() => void handleSubmit()}
              />
              <AppButton
                label={t('profile.edit.cancel')}
                variant="secondary"
                disabled={submitting}
                onPress={onClose}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <AvatarUploadModal
        visible={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={userAvatar}
        displayName={displayName}
      />
    </Modal>
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
    errors.displayName = t('profile.edit.errors.displayNameRequired');
  } else if (trimmedName.length > 255) {
    errors.displayName = t('profile.edit.errors.displayNameMax');
  }

  if (!localPhone) {
    errors.phone = t('profile.edit.errors.phoneRequired');
  } else if (!/^[35789]\d{8}$/.test(localPhone)) {
    errors.phone = t('profile.edit.errors.phoneInvalid');
  }

  return errors;
}

function normalizeLocalVietnamesePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
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
  root: { flex: 1, justifyContent: 'flex-end' },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    height: '88%',
    maxHeight: '96%',
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
  form: { gap: spacing.lg },
  identityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  identityNoticeText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
  actions: { gap: spacing.sm },
  avatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  changeAvatarText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
});
