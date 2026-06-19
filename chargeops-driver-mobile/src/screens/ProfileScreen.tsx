import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Card, LanguageSwitcher } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';

/** Placeholder profile screen. Shows the signed-in user, language switch, and sign-out. */
export function ProfileScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Text style={styles.subtitle}>{t('profile.placeholder')}</Text>

        <Card style={styles.card}>
          {session ? (
            <>
              <Text style={styles.name}>{session.user.name}</Text>
              <Text style={styles.body}>{session.user.email}</Text>
              <Text style={styles.body}>{session.user.phone}</Text>
              <Text style={styles.role}>{t('profile.role', { role: session.user.role })}</Text>
            </>
          ) : (
            <Text style={styles.body}>{t('profile.notSignedIn')}</Text>
          )}
        </Card>

        <View style={styles.languageBlock}>
          <Text style={styles.label}>{t('common.language')}</Text>
          <LanguageSwitcher />
        </View>

        <AppButton label={t('profile.signOut')} variant="secondary" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted },
  card: { gap: spacing.xs },
  name: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  body: { fontSize: fontSizes.body, color: colors.textBody },
  role: { fontSize: fontSizes.caption, color: colors.textMuted, marginTop: spacing.xs },
  languageBlock: { gap: spacing.sm },
  label: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
});
