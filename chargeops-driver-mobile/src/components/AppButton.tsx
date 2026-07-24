import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Dynamic theme-aware button using design system tokens. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const { themeColors } = usePreferences();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: themeColors.primary }
          : {
              backgroundColor: themeColors.surfaceAlt,
              borderWidth: 1,
              borderColor: themeColors.border,
            },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : themeColors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isPrimary ? '#FFFFFF' : themeColors.textStrong },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
});
