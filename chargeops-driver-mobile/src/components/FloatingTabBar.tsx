import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRef, useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

/**
 * Height of the floating pill itself: bar padding (sm top + sm bottom) plus one
 * tab's content (xs padding + 32 icon + 2 gap + label line + xs padding).
 * Kept as a constant rather than measured because every consumer needs it
 * during layout, before the bar has rendered.
 */
export const FLOATING_TAB_BAR_HEIGHT = 76;

/** Gap between the pill and the bottom edge of the screen. */
export const FLOATING_TAB_BAR_GAP = spacing.lg;

/** How far the pill floats above the very bottom, respecting the home indicator. */
function useBarOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, FLOATING_TAB_BAR_GAP);
}

/**
 * Bottom padding a tab screen's scrollable content needs so its last row is not
 * hidden behind the bar.
 *
 * The bar is `position: absolute`, so it sits outside the layout flow and
 * reserves no space of its own — every tab screen has to pad for it explicitly.
 * Apply to the `contentContainerStyle` of the screen's scroller (or to whatever
 * the screen anchors to its bottom edge), never to the container: padding on
 * the container would clip the scroll area instead of letting content scroll
 * out from under the bar.
 */
export function useTabBarInset() {
  return useBarOffset() + FLOATING_TAB_BAR_HEIGHT + spacing.md;
}

/** Mapping from route name to icon pair [outline, filled]. */
const TAB_ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  StationList: ['search-outline', 'search'],
  Map: ['map-outline', 'map'],
  Bookings: ['flash-outline', 'flash'],
  BookingHistory: ['time-outline', 'time'],
  Profile: ['person-outline', 'person'],
};

/** The center tab (FAB) route name. */
const CENTER_TAB = 'Bookings';

/**
 * Floating Pill Bottom Tab Bar — a custom `tabBar` component for
 * React Navigation's `createBottomTabNavigator`.
 *
 * Renders a frosted-glass floating capsule with rounded corners. The
 * center "Đặt chỗ" tab is elevated as a prominent FAB-style button
 * in the brand emerald color. Active tabs show a soft emerald pill
 * indicator behind the icon.
 *
 * Fully dynamic for Light / Dark mode via `usePreferences`.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { themeColors, isDark } = usePreferences();
  const barOffset = useBarOffset();

  return (
    <View style={[styles.wrapper, { paddingBottom: barOffset }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? 'rgba(22,27,26,0.92)' : 'rgba(255,255,255,0.92)',
            borderColor: isDark ? 'rgba(42,49,47,0.6)' : 'rgba(229,231,235,0.6)',
            shadowColor: isDark ? '#000' : '#6B7280',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const isCenter = route.name === CENTER_TAB;

          const iconPair = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          const iconName = isFocused ? iconPair[1] : iconPair[0];

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          function onLongPress() {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          }

          if (isCenter) {
            return (
              <CenterTab
                key={route.key}
                label={label}
                iconName={iconName}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                themeColors={themeColors}
              />
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconWrap,
                  isFocused && {
                    backgroundColor: themeColors.primarySoft,
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? themeColors.primary : themeColors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? themeColors.primary : themeColors.textMuted },
                  isFocused && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Elevated center FAB tab with a gentle scale-bounce animation on focus change.
 */
function CenterTab({
  label,
  iconName,
  isFocused,
  onPress,
  onLongPress,
  themeColors,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  themeColors: ReturnType<typeof usePreferences>['themeColors'];
}) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.08 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.08 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isFocused, scaleAnim]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.centerTab}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: themeColors.primary,
            shadowColor: themeColors.primary,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons name={iconName} size={26} color="#FFFFFF" />
      </Animated.View>
      <Text
        style={[
          styles.centerLabel,
          { color: isFocused ? themeColors.primary : themeColors.textMuted },
          isFocused && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // paddingBottom is applied inline — it tracks the bottom safe-area inset.
    paddingHorizontal: spacing.lg,
  },
  bar: {
    minHeight: FLOATING_TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    // Shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  // Regular tab
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: fontWeights.bold,
  },

  // Center FAB tab
  centerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    // Shift the FAB up to overlap the bar edge
    marginTop: -28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // Glow shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
});
