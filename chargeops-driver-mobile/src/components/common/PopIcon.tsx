import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

export interface PopIconProps {
  /** Toggles (e.g. copy → checkmark) trigger the spring pop. */
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * Ionicons with a spring "pop" whenever the glyph changes — used for copy
 * feedback so the swap to the checkmark interpolates instead of snapping.
 */
export function PopIcon({ name, size = 16, color }: PopIconProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scale.setValue(0.55);
    Animated.spring(scale, {
      toValue: 1,
      speed: 18,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  }, [name, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
