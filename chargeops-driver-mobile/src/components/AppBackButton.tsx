import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { GlassButton } from '@/components/GlassButton';
import { usePreferences } from '@/context/PreferencesContext';

export interface AppBackButtonProps {
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Standardized Back Button for all navigation headers across ChargeOps.
 * 
 * Features:
 * - 40px circular glass button using Liquid Glass with theme-aware fallback.
 * - Perfectly optically centered left chevron (`transform: [{ translateX: -1.5 }]`),
 *   eliminating the asymmetric visual bias caused by the chevron glyph's rightward mass and font bearings.
 * - Subtle theme-adaptive 1px border for crisp boundary definition on any background.
 */
export function AppBackButton({
  onPress,
  size = 40,
  accessibilityLabel = 'Quay lại',
  style,
}: AppBackButtonProps) {
  const { themeColors, isDark } = usePreferences();

  return (
    <GlassButton
      size={size}
      glassEffectStyle="regular"
      fallbackColor={themeColors.surfaceAlt}
      borderColor={isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)'}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={style}
      contentStyle={[
        styles.circleBorder,
        { borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)' },
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={22}
        color={themeColors.textStrong}
        style={styles.backChevron}
      />
    </GlassButton>
  );
}

const styles = StyleSheet.create({
  circleBorder: {
    borderWidth: 1,
  },
  backChevron: {
    // Optical Centering:
    // Biểu tượng chevron `<` vốn có đỉnh nhọn ở bên trái và 2 nhánh xòe ở bên phải.
    // Nếu để canh giữa cơ học, trọng tâm thị giác của mũi tên bị lệch sang phải ~1.5px.
    // Dịch -1.5px sang trái giúp mũi tên nằm chính xác 100% ở tâm điểm của hình tròn.
    transform: [{ translateX: -1.5 }],
  },
});
