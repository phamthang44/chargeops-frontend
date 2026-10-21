import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTaskLayout } from '@/hooks/useTaskLayout';

/** One stable tree and one parent scroll region across orientation changes. */
export function TaskColumns({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  const { split, contentMaxWidth } = useTaskLayout();
  return (
    <View testID="task-columns" style={[styles.container, { maxWidth: contentMaxWidth }, split && styles.split]}>
      <View testID="task-main" style={[styles.column, split && styles.main]}>{main}</View>
      <View testID="task-aside" style={[styles.column, split && styles.aside]}>{aside}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'center', gap: 24 },
  split: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: 16, minWidth: 0 },
  main: { flex: 1.45 },
  aside: { flex: 1 },
});
