import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { getOverlayLayout } from '@/utils/overlayLayout';

export function useOverlayLayout() {
  const { availableWidth, availableHeight } = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  const layout = getOverlayLayout(availableWidth, availableHeight);
  const rootStyle: ViewStyle = {
    justifyContent: layout.isDialog ? 'center' : 'flex-end',
    paddingTop: insets.top + layout.gutter,
    paddingLeft: insets.left + layout.gutter,
    paddingRight: insets.right + layout.gutter,
    paddingBottom: layout.gutter,
  };
  const sheetStyle: ViewStyle = {
    width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center',
    maxHeight: layout.maxHeight,
    borderBottomLeftRadius: layout.isDialog ? 16 : 0,
    borderBottomRightRadius: layout.isDialog ? 16 : 0,
  };
  return { ...layout, rootStyle, sheetStyle };
}
