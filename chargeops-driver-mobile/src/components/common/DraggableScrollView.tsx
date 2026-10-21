import React, { forwardRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

import {
  useWebMouseDragScroll,
  type WebMouseDragScrollOptions,
} from '@/hooks/useWebMouseDragScroll';

export interface DraggableScrollViewProps extends ScrollViewProps {
  webDragOptions?: WebMouseDragScrollOptions;
}

/**
 * Drop-in replacement for ScrollView that adds desktop mouse drag-to-scroll & wheel horizontal scroll
 * when horizontal={true} on web, with zero overhead or changes on mobile touch devices.
 */
export const DraggableScrollView = forwardRef<ScrollView, DraggableScrollViewProps>(
  function DraggableScrollView({ webDragOptions, horizontal, ...props }, ref) {
    const dragRef = useWebMouseDragScroll<ScrollView>(ref, {
      disabled: !horizontal,
      ...webDragOptions,
    });

    return <ScrollView ref={dragRef} horizontal={horizontal} {...props} />;
  }
);
