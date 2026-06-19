import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';

type Route = RouteProp<RootStackParamList, 'QRCheckIn'>;

/** Placeholder QR check-in screen — final step of the booking flow. */
export function QRCheckInScreen() {
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('qrCheckIn.title')}</Text>
        <Text style={styles.subtitle}>{t('qrCheckIn.placeholder')}</Text>

        <Card>
          <Text style={styles.body}>bookingId: {params?.bookingId ?? t('qrCheckIn.none')}</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted },
  body: { fontSize: fontSizes.body, color: colors.textBody },
});
