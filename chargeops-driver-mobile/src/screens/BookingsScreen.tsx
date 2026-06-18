import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components';
import { getBookingHistory } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, spacing } from '@/theme';
import type { Booking } from '@/types';

/**
 * "Đặt chỗ" tab — upcoming / active bookings.
 * Placeholder: reads bookings via the service layer and shows active count.
 */
export function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getBookingHistory().then((data) => {
      if (active) {
        setBookings(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const activeCount = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status),
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Đặt chỗ</Text>
        <Text style={styles.subtitle}>Lượt đặt chỗ sắp tới / đang hoạt động (placeholder)</Text>

        <Card>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.body}>Có {activeCount} lượt đặt chỗ đang hoạt động (mock).</Text>
          )}
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
