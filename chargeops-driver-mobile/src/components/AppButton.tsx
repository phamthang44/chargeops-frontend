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

// `danger` = a consequential, hard-to-undo action (e.g. ending a charging
// session before it's full). Solid error fill so it can never be mistaken for
// the routine emerald primary.
type Variant = 'primary' | 'secondary' | 'danger';

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
  const isDanger = variant === 'danger';
  const isSolid = isPrimary || isDanger; // filled + white label
  const isDisabled = disabled || loading;

  const solidBg = isDanger ? themeColors.error : themeColors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isSolid
          ? {
              backgroundColor: solidBg,
              // A soft glow in the button's own color lifts it off the footer.
              shadowColor: solidBg,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 3,
            }
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
        <ActivityIndicator color={isSolid ? '#FFFFFF' : themeColors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isSolid ? '#FFFFFF' : themeColors.textStrong },
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
