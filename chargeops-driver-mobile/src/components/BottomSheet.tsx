import { useOverlayLayout } from '@/hooks/useOverlayLayout';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Static content may scroll within the bounded panel; lists keep their own scroller. */
  scrollable?: boolean;
  /**
   * Entrance style. 'slide' (default) gently rises from the bottom; 'fade' makes
   * the panel appear immediately in place.
   */
  animation?: 'slide' | 'fade';
}

/**
 * Dynamic theme-aware bottom sheet with a **blurred** backdrop.
 */
export function BottomSheet({ visible, onClose, title, children, animation = 'slide', scrollable = false }: BottomSheetProps) {
  const overlay = useOverlayLayout();
  const { t } = useTranslation();
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
      <View style={[styles.root, overlay.rootStyle]}>
        <BlurView intensity={28} tint={isDark ? 'dark' : 'regular'} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          testID="adaptive-sheet"
          style={[
            styles.sheet,
            overlay.sheetStyle,
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
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                style={[styles.closeBtn, { backgroundColor: themeColors.surfaceAlt }]}
                hitSlop={8}
                onPress={onClose}
              >
                <Ionicons name="close" size={22} color={themeColors.textBody} />
              </Pressable>
            </View>
          )}
          {scrollable ? (
            <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  bodyScroll: { flexShrink: 1, minHeight: 0 },
  body: { gap: spacing.sm },
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
  title: { flex: 1, minWidth: 0, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
