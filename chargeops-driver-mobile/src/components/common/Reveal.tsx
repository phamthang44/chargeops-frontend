import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

/** Mass-carrying curve — never `linear` / `ease-in-out`. */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

export interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms before the reveal starts. */
  delay?: number;
  /** Animation duration in ms. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Scroll-entry reveal: heavy fade-up (translateY + opacity, transform-only for
 * GPU safety). Animates once on mount with an optional stagger delay so stacked
 * sections cascade into view instead of popping in statically.
 */
export function Reveal({ children, delay = 0, duration = 720, style }: RevealProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: EASE,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [progress, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
