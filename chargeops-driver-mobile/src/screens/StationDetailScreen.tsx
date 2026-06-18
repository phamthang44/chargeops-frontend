import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Card } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StationDetail'>;
type Route = RouteProp<RootStackParamList, 'StationDetail'>;

/** Placeholder station detail screen — step 2 of the booking flow. */
export function StationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Chi tiết trạm</Text>
        <Text style={styles.subtitle}>Màn hình chi tiết trạm (placeholder)</Text>

        <Card>
          <Text style={styles.body}>stationId: {params.stationId}</Text>
        </Card>

        <AppButton
          label="Chọn khung giờ"
          onPress={() => navigation.navigate('SlotPicker', { stationId: params.stationId })}
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
