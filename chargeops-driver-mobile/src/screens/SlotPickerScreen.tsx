import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Card } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SlotPicker'>;
type Route = RouteProp<RootStackParamList, 'SlotPicker'>;

/**
 * Placeholder "Chọn khung giờ" screen — step 3 of the booking flow.
 * Real implementation: date strip + slot grid with fixed per-slot prices.
 */
export function SlotPickerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('slotPicker.title')}</Text>
        <Text style={styles.subtitle}>{t('slotPicker.placeholder')}</Text>

        <Card>
          <Text style={styles.body}>stationId: {params.stationId}</Text>
          <Text style={styles.body}>chargerId: {params.chargerId ?? t('slotPicker.notChosen')}</Text>
        </Card>

        <AppButton
          label={t('slotPicker.cta')}
          onPress={() => navigation.navigate('QRCheckIn', {})}
        />
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
