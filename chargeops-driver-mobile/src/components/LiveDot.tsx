import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface LiveDotProps {
  /** Dot + halo color. Defaults to the info blue used for active charging. */
  color?: string;
  /** Core dot diameter (px). */
  size?: number;
}

/**
 * A small solid dot with a softly pulsing halo — signals a live / in-progress
 * state (e.g. an active charging session). Animation runs on the native driver.
 */
export function LiveDot({ color = colors.info, size = 8 }: LiveDotProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size, backgroundColor: color, transform: [{ scale }], opacity },
        ]}
      />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
});
