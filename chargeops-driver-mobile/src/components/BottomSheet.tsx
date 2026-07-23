import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /**
   * Entrance style. 'slide' (default) gently rises from the bottom; 'fade' makes
   * the panel appear immediately in place — used for the notifications panel,
   * which shouldn't feel like it's travelling up from the bottom of the screen.
   */
  animation?: 'slide' | 'fade';
}

/**
 * Reusable bottom sheet with a **blurred** backdrop (expo-blur): tap-out to
 * dismiss, drag handle, optional title. The whole overlay fades in; for 'slide'
 * the sheet also rises a touch. Blurring the background is why the modal fades
 * rather than slides — a full-screen blur that slid up from the bottom would
 * leave the top of the screen unblurred mid-animation.
 */
export function BottomSheet({ visible, onClose, title, children, animation = 'slide' }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && animation === 'slide') {
      rise.setValue(28);
      Animated.timing(rise, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      rise.setValue(0);
    }
  }, [visible, animation, rise]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY: rise }] }]}
        >
          <View style={styles.handle} />
          {title !== undefined && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable style={styles.closeBtn} hitSlop={8} onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.textBody} />
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
