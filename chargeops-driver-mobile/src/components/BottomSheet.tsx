import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /**
   * Entrance style. 'slide' (default) gently rises from the bottom; 'fade' makes
   * the panel appear immediately in place.
   */
  animation?: 'slide' | 'fade';
}

/**
 * Dynamic theme-aware bottom sheet with a **blurred** backdrop.
 */
export function BottomSheet({ visible, onClose, title, children, animation = 'slide' }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && animation === 'slide') {
      rise.setValue(28);
      Animated.timing(rise, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
    } else {
      rise.setValue(0);
    }
  }, [visible, animation, rise]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: insets.bottom + spacing.lg,
              transform: [{ translateY: rise }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />
          {title !== undefined && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: themeColors.textStrong }]}>{title}</Text>
              <Pressable
                style={[styles.closeBtn, { backgroundColor: themeColors.surfaceAlt }]}
                hitSlop={8}
                onPress={onClose}
              >
                <Ionicons name="close" size={22} color={themeColors.textBody} />
              </Pressable>
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
