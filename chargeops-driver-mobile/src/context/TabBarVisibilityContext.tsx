import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';

export interface TabBarVisibilityContextType {
  translateY: Animated.Value;
  isHidden: boolean;
  showTabBar: () => void;
  hideTabBar: () => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/** Distance in pixels to translate down to fully hide the floating bar and center FAB. */
export const TAB_BAR_HIDE_DISTANCE = 120;

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | null>(null);

/**
 * Context provider providing coordinated auto-hiding Bottom Tab Bar animations
 * (Facebook/Instagram scroll-aware style) powered by organic spring physics.
 */
export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [isHidden, setIsHidden] = useState(false);
  const isHiddenRef = useRef(false);
  const prevOffsetRef = useRef(0);
  const lastDirectionRef = useRef<'up' | 'down' | null>(null);

  const showTabBar = useCallback(() => {
    if (!isHiddenRef.current) return;
    isHiddenRef.current = false;
    setIsHidden(false);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 14, // Gentle spring bounce when settling into place
      mass: 0.85,
      stiffness: 140,
      overshootClamping: false,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [translateY]);

  const hideTabBar = useCallback(() => {
    if (isHiddenRef.current) return;
    isHiddenRef.current = true;
    setIsHidden(true);
    Animated.spring(translateY, {
      toValue: TAB_BAR_HIDE_DISTANCE,
      damping: 18,
      mass: 0.85,
      stiffness: 160,
      overshootClamping: true, // Smooth slide down without bouncing below edge
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [translateY]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const currentOffset = contentOffset.y;

      // 1. Near the top of the scroll view: always reveal
      if (currentOffset <= 15) {
        showTabBar();
        prevOffsetRef.current = currentOffset;
        lastDirectionRef.current = null;
        return;
      }

      // 2. Ignore bounce / rubber-banding on iOS
      if (layoutMeasurement && contentSize) {
        if (currentOffset < 0) return;
        // Don't trigger hide when bouncing against bottom edge
        if (currentOffset + layoutMeasurement.height >= contentSize.height - 15) {
          return;
        }
      }

      const diff = currentOffset - prevOffsetRef.current;

      // Reset reference point if scroll direction changes
      if (
        (diff > 0 && lastDirectionRef.current === 'up') ||
        (diff < 0 && lastDirectionRef.current === 'down')
      ) {
        prevOffsetRef.current = currentOffset;
        lastDirectionRef.current = diff > 0 ? 'down' : 'up';
        return;
      }

      // 3. Responsive threshold (10px) for immediate, snappy feedback
      if (Math.abs(diff) >= 10) {
        if (diff > 0 && currentOffset > 40) {
          // Scrolling down: hide tab bar
          hideTabBar();
          lastDirectionRef.current = 'down';
        } else if (diff < 0) {
          // Scrolling up: show tab bar immediately with spring bounce
          showTabBar();
          lastDirectionRef.current = 'up';
        }
        prevOffsetRef.current = currentOffset;
      }
    },
    [showTabBar, hideTabBar],
  );

  const value = useMemo(
    () => ({
      translateY,
      isHidden,
      showTabBar,
      hideTabBar,
      handleScroll,
    }),
    [translateY, isHidden, showTabBar, hideTabBar, handleScroll],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

// Resilient fallback if used outside Provider
const defaultAnimatedValue = new Animated.Value(0);

export function useTabBarVisibility(): TabBarVisibilityContextType {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    return {
      translateY: defaultAnimatedValue,
      isHidden: false,
      showTabBar: () => {},
      hideTabBar: () => {},
      handleScroll: () => {},
    };
  }
  return context;
}

/**
 * Convenient hook to spread directly onto any FlatList, SectionList, or ScrollView:
 * ```tsx
 * const tabBarScroll = useTabBarScroll();
 * <FlatList {...tabBarScroll} ... />
 * ```
 */
export function useTabBarScroll() {
  const { handleScroll } = useTabBarVisibility();
  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
  };
}
