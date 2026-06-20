import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface StarRatingProps {
  rating: number; // 0..5
  size?: number;
}

/** Read-only 5-star rating row (full / half / empty), in the warning (amber) color. */
export function StarRating({ rating, size = 14 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map((i) => {
        const name = rating >= i + 1 ? 'star' : rating >= i + 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={colors.warning} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
});
