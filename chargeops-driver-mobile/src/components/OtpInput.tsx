import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSizes, fontWeights, radius } from '@/theme';

interface OtpInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  error?: boolean;
}

/**
 * Segmented N-digit code input. A single hidden TextInput holds the value;
 * the boxes are a visual representation that focuses the input on tap.
 */
export function OtpInput({ value, onChangeText, length = 6, error }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const focusedIndex = Math.min(value.length, length - 1);

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {digits.map((digit, i) => {
        const isFocused = i === focusedIndex;
        return (
          <View
            key={i}
            style={[
              styles.box,
              digit ? styles.boxFilled : null,
              isFocused ? styles.boxFocused : null,
              error ? styles.boxError : null,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  boxError: {
    borderColor: colors.error,
  },
  digit: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    color: colors.textStrong,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
