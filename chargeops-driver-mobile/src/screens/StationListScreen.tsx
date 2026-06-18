import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getNearbyStations } from '@/services/stationService';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';
import type { Station } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * "Tìm trạm" tab — home/discovery list.
 * Also the end-to-end proof of the service layer: loads stations via
 * getNearbyStations() and renders them (count + each station as a card).
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getNearbyStations().then((data) => {
      if (active) {
        setStations(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tìm trạm</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Đang tải…' : `Đã tải ${stations.length} trạm sạc từ service layer (mock).`}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          stations.map((station) => (
            <Pressable
              key={station.id}
              onPress={() => navigation.navigate('StationDetail', { stationId: station.id })}
            >
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  {station.rating !== undefined && (
                    <Text style={styles.rating}>★ {station.rating.toFixed(1)}</Text>
                  )}
                </View>
                <Text style={styles.address}>{station.address}</Text>
                <Text style={styles.meta}>
                  {station.availableChargers > 0
                    ? `Còn ${station.availableChargers}/${station.totalChargers} cổng`
                    : 'Hết chỗ'}
                  {station.distanceKm !== undefined ? `  ·  ${station.distanceKm} km` : ''}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted, marginBottom: spacing.xs },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stationName: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong, flex: 1 },
  rating: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong, marginLeft: spacing.sm },
  address: { fontSize: fontSizes.body, color: colors.textMuted },
  meta: { fontSize: fontSizes.caption, color: colors.textBody },
});
