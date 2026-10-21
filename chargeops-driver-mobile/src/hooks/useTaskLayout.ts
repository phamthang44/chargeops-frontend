import { useWindowDimensions } from 'react-native';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { getTaskLayout } from '@/utils/taskLayout';

export function useTaskLayout() {
  const { availableWidth, availableHeight } = useAdaptiveLayout();
  const { fontScale } = useWindowDimensions();
  return getTaskLayout(availableWidth, availableHeight, fontScale);
}
