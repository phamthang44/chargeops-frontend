import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { fontWeights, radius, spacing } from '@/theme';

/** In-flow navigation: its width is reserved by the existing tab navigator. */
export function NavigationRail({ state, descriptors, navigation }: BottomTabBarProps) {
  const { themeColors } = usePreferences();
  const insets = useSafeAreaInsets();
  const { navigationRailWidth } = useAdaptiveLayout();

  return (
    <View
      testID="driver-navigation-rail"
      style={[
        styles.rail,
        {
          width: navigationRailWidth,
          paddingLeft: insets.left,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: themeColors.surface,
          borderRightColor: themeColors.border,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brand} accessible accessibilityLabel="ChargeOps">
          <Ionicons name="flash" size={24} color={themeColors.primary} />
          <Text style={[styles.brandLabel, { color: themeColors.textStrong }]}>ChargeOps</Text>
        </View>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title ?? route.name;
          const color = focused ? themeColors.textStrong : themeColors.textMuted;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected: focused }}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: focused || pressed ? themeColors.surfaceAlt : themeColors.transparent },
              ]}
            >
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              <Text style={[styles.label, { color, fontWeight: focused ? fontWeights.bold : fontWeights.medium }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { flexShrink: 0, borderRightWidth: StyleSheet.hairlineWidth },
  content: { padding: spacing.sm, gap: spacing.xs },
  brand: { minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  brandLabel: { fontSize: 13, fontWeight: fontWeights.bold },
  item: { minHeight: 64, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, gap: spacing.xs, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  label: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
