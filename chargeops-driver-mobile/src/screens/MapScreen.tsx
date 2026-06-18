import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';

/** Placeholder "Bản đồ" tab. Real map (Google Maps) is out of scope for the skeleton. */
export function MapScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Bản đồ</Text>
        <Text style={styles.subtitle}>Màn hình bản đồ trạm sạc (placeholder)</Text>

        <Card>
          <Text style={styles.body}>Bản đồ Google Maps sẽ hiển thị ở đây.</Text>
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
